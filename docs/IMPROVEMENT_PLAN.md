# G-Matrix — Teardown & Startup Roadmap (June 2026)

Scope: full critique of concept, UX, ranking, stack, architecture and code, plus a concrete path to a releasable web + iOS + Android v1 (Capacitor), sized for a few hundred users on a near-zero budget, with a scaling path after.

Decisions taken: **Capacitor** for mobile; **multi-allergen from v1** (with a UI design that keeps it as simple as gluten-only).

---

## 1. The concept, questioned

What's strong: crowd-sourced *experience* data ("did this product actually wreck me?") is something labels and ingredient databases cannot provide. The taste axis is a real differentiator — celiac apps tell you what's *safe*, almost none tell you what's *good*. The matrix visual is memorable and shareable. Hungary-first is a sensible beachhead: a tight, underserved, highly motivated community (celiac + gluten-sensitive ≈ several hundred thousand people, active Facebook groups).

What's weak or risky:

1. **"Safety" by vibes is a medical claim.** For a celiac, a wrong "Clean" can mean weeks of illness. A product with one anonymous vote currently looks identical to one with 200 votes. This is the single biggest concept-level flaw — fix with confidence display (see §3) and by pairing crowd votes with *objective* data: declared allergens + "may contain traces" pulled from Open Food Facts by barcode, plus certification flags (AOECS crossed grain). Crowd = experience layer; OFF/labels = fact layer. Show both, never merge them.
2. **The real usage moment is the supermarket aisle, not the couch.** Someone holds a product and needs a verdict in under 10 seconds. The current home screen (a scatter plot of up to 100 products) is a researcher's view. The matrix should be the *explore/share* view; the primary mobile flow must be **scan barcode → verdict card** (safety + confidence + taste + price + "seen at Lidl 3 days ago"). This also makes Capacitor worth doing: a native ML Kit barcode scanner is the killer native feature and your Apple 4.2 review insurance.
3. **Brand voice vs. audience.** The Gen Z styling ("Yass/Meh/Pass", "Wrecked", "Russian Roulette") is fun, but the heaviest users of celiac tools are typically parents of celiac kids and adults 30–50. Keep the playfulness on taste/value; on the safety axis use unambiguous language ("Reactions reported"). "Russian Roulette" as a label for medically risky food is a tone/liability risk — rename. Also test the name: "G-Matrix" reads as hardware; with multi-allergen it's wrong anyway (G = gluten). Pick a name that survives the allergen expansion.
4. **Product identity is broken by design.** Products are keyed by slugified name (`schar-ciabatta`). "Schär" vs "Schar" vs "Schär Ciabatta 200g" = duplicate products, split votes, hijackable images. **Barcode (EAN) must be the primary key.** Photo+AI naming stays as fallback for products without readable barcodes. Open Food Facts (free, ODbL, no API key) resolves EAN → name, brand, image, ingredients, declared allergens. This single change fixes dedup, gives you allergen facts for free, and pre-seeds the catalog.

## 2. How people will use it — intuitiveness audit

Current flows and friction:

- **Contributor flow** (photo → AI analysis → sessionStorage handoff → vibe-check page → vote): five steps, fragile (sessionStorage lost on refresh; URL carries the product *name*), and it's the only path to creating a product. With barcode-first: scan → confirm OFF prefill → vote. Two steps.
- **Anonymous users can't vote on existing products** (vibe-check redirects them to sign in). That contradicts the goal of accumulating data while small. With Firebase *anonymous auth* (see §4) everyone can vote, registered votes simply weigh more — which is exactly your existing weighting model.
- **Voting precision is incoherent**: 3 buttons map to 80/50/20, then a "fine-tune" drag panel allows 0–100, and the fine-tune writes through a *different* path (client Firestore) that the security rules actually block. Pick one: 3 buttons is the right v1 (fast, thumb-friendly); store the bucket, drop the fine-tune panel or make it update the same vote via the same API.
- **The matrix on mobile**: dots ≤6px are not tappable targets; 100 dots with hash-based colors carry no meaning. Make dot size = vote count (confidence), color = safety verdict, and cluster/limit to top-N by votes. Quadrant filter buttons are good — keep.
- **Trust signals are absent**: no vote counts, no "last confirmed", no source attribution anywhere in the UI. Every score needs "n votes · updated X days ago" or users (rightly) won't trust it.
- **Good instincts worth keeping**: quadrant quick-filters, value lens, store + GPS tagging ("seen at" is genuinely useful and rare), gamification (well-scoped: points for *useful* contributions), hu/en i18n from day one.

## 3. The ranking system — not good enough yet, easily fixable

Current: weighted mean (registered ×2, anonymous ×1), optional time decay via a full-rescan job that nothing schedules. Three problems:

1. **No confidence model.** One 80/80 vote renders identically to five hundred. Use a Bayesian (shrunk) average for everything displayed and sorted:
   `score = (C × m + Σ votes) / (C + n)` with m = global mean (~55) and C ≈ 8. New products start near the middle and *earn* their corner. Below n=3, label "Not enough votes" and render hollow/grey on the matrix — never let a single vote place a product in "Holy Grail".
2. **Vote integrity is currently zero** (see §4) — any ranking is meaningless until one person = one vote per product. This is a security fix, not a ranking fix, but it's prerequisite.
3. **Time decay implementation won't scale and isn't running.** It re-reads every vote of every product (O(products × votes)). At your scale that's fine *if it runs* — schedule it as a Cloud Function (daily) now; later switch to incremental decay (store a decayed-sum + last-decay timestamp per product, decay lazily on write).

Keep: registered/anon weighting (2:1 is reasonable), the config.ts tunables approach (genuinely good practice), server-side aggregate computation. Add per-allergen aggregates (below). The 80/50/20 button mapping is fine once aggregated — the false precision problem disappears when you show confidence.

**Multi-allergen ranking model** (your chosen scope): taste and price are allergen-independent — one aggregate each. Safety is *per allergen*:

```
product.safetyByAllergen: {
  gluten:  { regSum, regN, anonSum, anonN, score },   // score = shrunk avg
  lactose: { ... },
  ...
}
vote.allergens: ['gluten']        // the allergen(s) this voter avoids & is rating
user.avoids:    ['gluten','lactose']  // profile, set once at onboarding
```

UI stays single-lens: the user picks what they avoid during onboarding; every screen renders safety *for their allergens* (worst-of when multiple). The matrix never shows 14 axes — it shows *your* axis. Use the EU-14 allergen list as the enum (matches OFF's allergen tags 1:1, and HU/EU labeling law). Launch marketing still targets the gluten community first — the app supporting more allergens doesn't require the community to be split on day one.

## 4. Security & integrity — must fix before any release

These are critical; all are fixable in days:

1. **Anyone can vote unlimited times.** `userId = anonymous_${Date.now()}` creates a fresh vote doc per click. One angry user (or a brand) can move any product anywhere.
2. **The server trusts the client about identity.** `submitVote({ userId, isRegistered })` — callers can claim any uid (overwriting *other users'* votes, since vote docs are keyed by uid) and claim registered status for double weight.
3. **`deleteVote` has no auth check at all** despite the "admin only" comment. Anyone who can reach the server action can delete arbitrary votes.
4. **Firestore rules are theater for votes**: server actions use the Admin SDK, which bypasses rules entirely; meanwhile the one client-side write path (fine-tune panel) is blocked by those same rules.
5. **In-memory rate limiting** resets per instance/cold start on App Hosting — ineffective.
6. **`seedRandomPrices`** fabricates ratings data. Delete it. Fake data in a trust product is poison, and it's callable from the admin dashboard.

The fix pattern (one consistent write path):

- Enable **Firebase Anonymous Auth**. Every visitor has a real `auth.uid`; upgrading to Google sign-in links the same uid (`linkWithCredential`) so votes survive registration.
- Client sends its **ID token** with every mutation; the server verifies it (`adminAuth.verifyIdToken`) and derives `userId` and `isRegistered` (`sign_in_provider !== 'anonymous'`) server-side. Nothing identity-related crosses the wire as a parameter.
- Admin checks: verify token, then check `roles_admin/{uid}` server-side.
- Lock rules down: votes and products are **server-write-only** (clients read; all writes via API). Rules stop pretending.
- Add **Firebase App Check** (free) and a per-uid daily vote cap in Firestore instead of the in-memory IP map.
- Resize/compress images client-side before upload (canvas → WebP ≤ 800px, ~100 KB). Currently up to 5 MB per photo goes straight to Storage — that's the one thing that would actually burn the free tier.

## 5. Stack verdict — keep it, trim it

The stack choice is right for "free for a long time": Next.js + Firebase + Gemini Flash has no monthly floor and generous free allowances. Verified June 2026:

| Service | Free allowance | Your usage at ~300 active users |
|---|---|---|
| Firestore | 50k reads / 20k writes / day | Comfortable, *if* product lists are paginated & cached (see §6) |
| Auth | Unlimited email/Google (10k/mo verifications) | Negligible |
| Storage | 5 GB + egress quota | Fine with client-side image compression |
| App Hosting (needs Blaze) | Free allowances since Aug 2025; scale-to-zero, maxInstances 2 already set | ~€0–5/mo |
| Gemini API free tier | Flash ≈ 1,500 req/day | Photo analysis is a fallback after barcode — tens/day |
| Open Food Facts | Free, no key, ODbL | Attribute the source in UI (license requirement) |

Unavoidable non-free items: Apple Developer **$99/yr**, Google Play **$25 once**. Budget ~€10/mo + store fees; set a Cloud Billing alert at €10 now.

Trim the stack:

- **Genkit is dead weight**: `src/ai/genkit.ts` references the long-retired `gemini-pro`, both `genkit:*` scripts point to `src/ai/dev.ts` which doesn't exist (`genkit:watch` additionally has a `srcai/` typo), and actual AI calls use `@google/generative-ai` directly. Drop `genkit`, `@genkit-ai/*`, `genkit-cli`. `patch-package` runs on every install but there is no `patches/` directory — remove it too — or adopt Genkit properly. Dropping is simpler; the direct SDK call works. Note `@google/generative-ai` is deprecated in favor of `@google/genai` — migrate when convenient.
- Check `patch-package` (no patches dir visible), `embla-carousel`, and unused Radix packages.
- Next 16 / React 19 / Tailwind 3 / recharts 2: fine. Don't chase Tailwind 4 mid-flight.

**One structural change is forced by Capacitor**: server actions don't exist in a static export. Move all mutations (`submitVote`, `analyzeAndUploadProduct`, admin ops) to **Route Handlers** (`/api/*`) with token verification per §4. The web app calls the same endpoints (server actions are an implementation detail you lose nothing by dropping; you gain a single audited write path for web *and* the apps).

## 6. Architecture & code review

Data model:

- **Products keyed by EAN** (fallback: generated id for barcode-less products), `nameLower` field for prefix search, `allergenInfo` from OFF (declared + traces), `safetyByAllergen` aggregates per §3.
- **`stores` array on the product doc is a time bomb**: unbounded growth toward the 1 MB doc limit, and each re-tag overwrites `lastSeenAt` history. Move to a `products/{id}/sightings` subcollection; keep the latest 3–5 denormalized on the product for display.
- The gamification update runs in a second, separate transaction — acceptable (it's best-effort and you already catch failures), but `votesToday`-based streak logic belongs in `lib/` with unit tests; it's exactly the kind of date-math that silently breaks.

Reads & search:

- Home fetches `limit(100)` with **no orderBy** — beyond 100 products that's an arbitrary subset; the matrix and "search" silently lie. Fix: `orderBy('voteCount', 'desc').limit(50)` for the default view, and for search publish a tiny JSON name-index (id, name, n) to Storage/CDN on a schedule — a few thousand products is <100 KB, client-side fuzzy search, zero Firestore reads. That carries you to ~10k products before you need Algolia/Typesense/Meilisearch.
- Each visit re-reads the whole product list. Cache the default list server-side (`unstable_cache`/ISR, 5-min TTL) so anonymous browsing costs ~0 reads.

SEO — a core feature in the blueprint, currently absent: every page is `'use client'`; product pages have no `generateMetadata`, no OG images, no sitemap, no robots.txt, and nothing is server-rendered. For a community product, shared product cards ("look how bad this one scored") are the growth loop. Make product pages server components (data fetch via Admin SDK, vote panel stays a client island), add `generateMetadata` + an `opengraph-image` route rendering the mini-matrix card, sitemap from product list. This is the web target only — the Capacitor build skips it.

Code style & modularity:

- `actions.ts` is 725 lines doing six jobs (AI, upload, votes, gamification, admin, batch recalc). Split into `src/server/{ai,votes,gamification,admin,recalc}.ts`; routes become thin wrappers. The voting math (subtract-old/add-new, weighted avg, shrinkage) belongs in pure functions in `lib/ranking.ts`.
- **Zero tests.** Minimum bar before release: vitest unit tests for `lib/ranking.ts` + `lib/gamification.ts` (pure functions, easy), and Firestore **rules tests** with the emulator. The rules-bypass bug in §4 is exactly what rules tests catch.
- Duplications to consolidate: Haversine ×2, relative-time helper, slug generation ×3 (client and server — drift here = data corruption; after the EAN switch, delete slugs entirely).
- Mixed component naming (`admin-toolbar.tsx` vs `LocaleSwitcher.tsx`) — pick kebab-case, rename once.
- The custom `src/firebase/*` hooks layer (error-emitter, permission error contexts) is decent; after votes go server-side, most client Firestore code reduces to reads, which simplifies it further.
- `voting-panel.tsx` dynamic-imports the server action inside the click handler and builds a fake `Vote` with `as any` casts — both disappear with the API refactor.

## 7. Roadmap to first release

**Phase 0 — Integrity (week 1–2).** Anonymous auth + ID-token verification; convert server actions to `/api/*` route handlers; lock Firestore rules to server-write-only; admin check on delete; App Check; per-uid vote cap; delete `seedRandomPrices`; client-side image compression; billing alert. *Exit: one person = one vote, verified identity, no fake data.*

**Phase 1 — Product v1, web (week 3–6).**
- EAN as product key + OFF lookup (name, brand, image, allergens) + web barcode scanning (`getUserMedia` + ZXing/`BarcodeDetector` where available).
- Multi-allergen model per §3: EU-14 enum, `safetyByAllergen`, onboarding "what do you avoid?", allergen-lens rendering.
- Ranking v2: shrunk averages, n≥3 display threshold, dot size = votes, vote count + freshness on every score. Rename "Russian Roulette".
- Scan/search-first mobile home; matrix moves to an Explore tab. Verdict card as the central screen.
- SEO: server-rendered product pages, `generateMetadata`, OG image route, sitemap. PWA manifest + installability.
- Refactor: split `actions.ts`, `lib/ranking.ts` with tests, rules tests, drop Genkit, dedupe helpers, kill the fine-tune client-write path.
- Soft-launch to the Hungarian celiac Facebook groups; seed catalog from OFF's HU gluten-free products so day-one isn't empty.

**Phase 2 — Capacitor apps (week 7–10).**
- Second build target: `output: 'export'` behind an env flag. Restructure app-routes to be export-safe: product pages resolve by query param/client route in the app build; locale handling client-side (next-intl without middleware) for the export target.
- Plugins: `@capacitor-mlkit/barcode-scanning` (on-device, free), `@capacitor/camera`, `@capacitor/haptics` (the blueprint promised haptics — here they're real), `@capacitor/push-notifications` + FCM, `@capacitor-firebase/authentication` (popup sign-in doesn't work in webviews).
- Apple 4.2 insurance: native scanner, haptics, push, offline cache of the user's recent products — demonstrably more than a wrapped site.
- Internal testing (TestFlight / Play internal track) with ~20 community users before public listing.

**Phase 3 — Scale (post-launch, as needed).**
- Few hundred users: nothing to do — free tiers hold.
- ~1k+ users / 10k+ products: scheduled Cloud Function for time decay + trending; search index service; sightings subcollection with geo-queries (geohash); moderation queue (reports exist in blueprint but aren't built); PostHog/GA4 analytics; price *history* (you already collect price-per-store — the trend chart is a premium feature waiting to exist).
- Monetization order: clearly-labeled sponsored placements in the existing ad slots → affiliate links to GF webshops → B2B dashboard for GF brands (your aggregated taste/safety data per product is exactly what they can't get elsewhere). Don't gate consumer safety data — ever; it's the trust core.

**Definition of "releasable v1"**: scan or search any HU product → verdict with confidence in <10 s; vote in 2 taps; one identity = one vote; allergen profile respected everywhere; product pages shareable with OG cards; same backend serving web, iOS, Android.

---

*Sources: Firebase pricing & App Hosting cost docs, Gemini API rate-limit docs, Capacitor + Next.js static-export guides, App Store Guideline 4.2 analyses, Open Food Facts API docs (all checked June 2026).*
