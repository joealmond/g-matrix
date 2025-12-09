'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useEffect, useState, useCallback, useRef } from 'react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { useAdmin } from '@/hooks/use-admin';
import { useGeolocation } from '@/hooks/use-geolocation';
import { Product, Vote, StoreEntry } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProductVibeChart } from '@/components/dashboard/product-vibe-chart';
import { getColorForProduct } from '@/components/dashboard/matrix-chart';
import { DraggableDot } from '@/components/dashboard/draggable-dot';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { useImpersonate } from '@/hooks/use-impersonate';
import { submitVote, deleteVote } from '@/app/actions';
import { ThumbsUp, MapPin, DollarSign, Loader2, CheckCircle, Trash2, Users, ShieldCheck, Clock, Eye, Navigation, ExternalLink } from 'lucide-react';

// Haversine formula to calculate distance between two GPS points (in km)
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper to open maps (native on mobile, Google Maps on desktop)
function openMapsLink(lat: number, lng: number, storeName: string) {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const query = encodeURIComponent(storeName);
  
  if (isMobile) {
    // Try native maps app
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isIOS) {
      window.location.href = `maps://?q=${query}&ll=${lat},${lng}`;
    } else {
      window.location.href = `geo:${lat},${lng}?q=${query}`;
    }
  } else {
    // Desktop: open Google Maps
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  }
}

// Helper to format relative time (e.g., "2 hours ago", "3 months ago")
function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears >= 1) return `${diffYears}y ago`;
  if (diffMonths >= 1) return `${diffMonths}mo ago`;
  if (diffDays >= 1) return `${diffDays}d ago`;
  if (diffHours >= 1) return `${diffHours}h ago`;
  if (diffMins >= 1) return `${diffMins}m ago`;
  return 'just now';
}

export default function ProductDetailsPage() {
  const t = useTranslations('ProductPage');
  const params = useParams();
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();
  const { isAdmin, isRealAdmin } = useAdmin();
  const { toast } = useToast();
  const { startViewingAsUser, impersonatedUserId } = useImpersonate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allVotes, setAllVotes] = useState<Vote[]>([]);
  const [userVote, setUserVote] = useState<Vote | null>(null);
  const [viewMode, setViewMode] = useState<'average' | 'myVote' | 'allVotes'>('average');
  const [chartMode, setChartMode] = useState<'vibe' | 'value'>('vibe');
  
  // Custom vote state
  const [customVibe, setCustomVibe] = useState({ safety: 50, taste: 50 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  
  // Admin state
  const [highlightedVoteId, setHighlightedVoteId] = useState<string | null>(null);
  const [deletingVoteId, setDeletingVoteId] = useState<string | null>(null);
  
  // Ref for scrolling to chart
  const chartCardRef = useRef<HTMLDivElement>(null);

  const decodedProductName = decodeURIComponent(params.name as string);
  const productId = decodedProductName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Geolocation for "Near Me" badge
  const { coords: userCoords } = useGeolocation();
  const NEAR_ME_RADIUS_KM = 5;

  // Fetch product and user's vote
  useEffect(() => {
    const fetchProductData = async () => {
      if (!firestore || !decodedProductName) return;
      setIsLoading(true);

      const productRef = doc(firestore, 'products', productId);

      try {
        const docSnap = await getDoc(productRef);
        if (docSnap.exists()) {
          const productData = { id: docSnap.id, ...docSnap.data() } as Product;
          setProduct(productData);
          setCustomVibe({ safety: productData.avgSafety || 50, taste: productData.avgTaste || 50 });
        } else {
          console.log('No such product!');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductData();
  }, [firestore, decodedProductName, productId]);

  // Fetch user's vote when user is available
  useEffect(() => {
    const fetchUserVote = async () => {
      if (!firestore || !user || !productId) return;
      
      const voteRef = doc(firestore, 'products', productId, 'votes', user.uid);
      try {
        const voteSnap = await getDoc(voteRef);
        if (voteSnap.exists()) {
          const vote = voteSnap.data() as Vote;
          setUserVote(vote);
          setCustomVibe({ safety: vote.safety, taste: vote.taste });
          setHasVoted(true);
        }
      } catch (error) {
        console.error('Error fetching user vote:', error);
      }
    };

    fetchUserVote();
  }, [firestore, user, productId]);

  // Fetch all votes when view mode changes to allVotes OR when admin needs to see voter list OR when impersonating
  useEffect(() => {
    const fetchAllVotes = async () => {
      if (!firestore || !productId) return;
      // Fetch votes when viewing all votes OR when admin needs the list OR when impersonating
      if (viewMode !== 'allVotes' && !isRealAdmin && !impersonatedUserId) return;
      
      const votesRef = collection(firestore, 'products', productId, 'votes');
      try {
        const snapshot = await getDocs(votesRef);
        const votes = snapshot.docs.map(d => ({ userId: d.id, ...d.data() }) as Vote);
        setAllVotes(votes);
      } catch (error) {
        console.error('Error fetching votes:', error);
      }
    };

    fetchAllVotes();
  }, [firestore, productId, viewMode, isRealAdmin, impersonatedUserId]);

  const handleVibeChange = useCallback((newVibe: { safety: number; taste: number }) => {
    setCustomVibe(newVibe);
  }, []);

  const handleSliderChange = (type: 'safety' | 'taste', value: number[]) => {
    setCustomVibe(prev => ({ ...prev, [type]: value[0] }));
  };

  // Admin: Delete vote handler
  const handleDeleteVote = async (voteUserId: string) => {
    if (!product || !isAdmin) return;
    
    setDeletingVoteId(voteUserId);
    const result = await deleteVote({
      productId: product.id,
      userId: voteUserId,
    });

    setDeletingVoteId(null);
    if (result.success) {
      toast({
        title: t('voteDeleted'),
        description: t('voteDeletedDescription'),
      });
      // Remove from local state
      setAllVotes(prev => prev.filter(v => v.userId !== voteUserId));
      // Refresh product data
      const productRef = doc(firestore!, 'products', productId);
      const docSnap = await getDoc(productRef);
      if (docSnap.exists()) {
        setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
      }
    } else {
      toast({
        variant: 'destructive',
        title: t('deleteVoteFailed'),
        description: result.error,
      });
    }
  };

  // Agree (+1) - submit vote with current average
  const handleAgree = async () => {
    if (!user || !product) {
      toast({
        variant: 'destructive',
        title: t('signInRequired'),
        description: t('signInToVote'),
      });
      return;
    }

    setIsSubmitting(true);
    const result = await submitVote({
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl,
      userId: user.uid,
      isRegistered: !user.isAnonymous,
      safety: product.avgSafety,
      taste: product.avgTaste,
    });

    setIsSubmitting(false);
    if (result.success) {
      toast({
        title: t('voteSubmitted'),
        description: t('agreedWithCommunity'),
      });
      setHasVoted(true);
      setUserVote({
        userId: user.uid,
        safety: product.avgSafety,
        taste: product.avgTaste,
        isRegistered: !user.isAnonymous,
        votedAt: new Date() as any,
        createdAt: null as any,
      });
      // Refresh product data
      const productRef = doc(firestore!, 'products', productId);
      const docSnap = await getDoc(productRef);
      if (docSnap.exists()) {
        setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
      }
    } else {
      toast({
        variant: 'destructive',
        title: t('voteFailed'),
        description: result.error,
      });
    }
  };

  // Submit custom vote
  const handleSubmitCustom = async () => {
    if (!user || !product) {
      toast({
        variant: 'destructive',
        title: t('signInRequired'),
        description: t('signInToVote'),
      });
      return;
    }

    setIsSubmitting(true);
    const result = await submitVote({
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl,
      userId: user.uid,
      isRegistered: !user.isAnonymous,
      safety: customVibe.safety,
      taste: customVibe.taste,
    });

    setIsSubmitting(false);
    if (result.success) {
      toast({
        title: t('voteSubmitted'),
        description: hasVoted ? t('voteUpdated') : t('customVoteAdded'),
      });
      setHasVoted(true);
      setUserVote({
        userId: user.uid,
        safety: customVibe.safety,
        taste: customVibe.taste,
        isRegistered: !user.isAnonymous,
        votedAt: new Date() as any,
        createdAt: null as any,
      });
      // Refresh product data
      const productRef = doc(firestore!, 'products', productId);
      const docSnap = await getDoc(productRef);
      if (docSnap.exists()) {
        setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
      }
    } else {
      toast({
        variant: 'destructive',
        title: t('voteFailed'),
        description: result.error,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col md:grid md:grid-cols-2 gap-8">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-headline">{t('productNotFound')}</h1>
        <p className="text-muted-foreground">{t('productNotFoundDescription', { name: decodedProductName })}</p>
      </div>
    );
  }
  
  const getRatingBadge = (value: number) => {
    if (value > 75) return <Badge variant="default" className="bg-green-500">{t('excellent')}</Badge>;
    if (value > 50) return <Badge variant="secondary">{t('good')}</Badge>;
    if (value > 25) return <Badge variant="outline">{t('fair')}</Badge>;
    return <Badge variant="destructive">{t('poor')}</Badge>;
  };

  const isLoggedIn = !!user && !userLoading;
  const isRegistered = user && !user.isAnonymous;
  
  // Get the effective vote to display - either impersonated user's or real user's
  const impersonatedVote = impersonatedUserId 
    ? allVotes.find(v => v.userId === impersonatedUserId) 
    : null;
  const effectiveVote = impersonatedUserId ? impersonatedVote : userVote;
  const isImpersonatingOtherUser = !!impersonatedUserId && impersonatedUserId !== user?.uid;

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline text-3xl">{t('productDetails')}</h1>
      </div>
      
      <div className="flex flex-col gap-8">
        {/* Top row: Product image and vibe chart */}
        <div className="flex flex-col md:grid md:grid-cols-2 gap-8">
          {/* Product Image Card */}
          <Card>
            <CardHeader>
              <CardTitle className='font-headline'>{product.name}</CardTitle>
              <CardDescription>
                {t('communitySourcedVibe')}
                <span className="ml-2">
                  <Badge variant="outline">{product.voteCount || 0} {t('votes')}</Badge>
                  {product.registeredVoteCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {product.registeredVoteCount} {t('verified')}
                    </Badge>
                  )}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Front image */}
              {product?.imageUrl ? (
                <div className="relative w-full rounded-md overflow-hidden border p-4 flex justify-center items-center">
                  <img 
                    src={product.imageUrl} 
                    alt={`Image of ${product.name}`} 
                    className="max-h-[400px] w-auto max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-full aspect-square bg-muted rounded-md flex items-center justify-center">
                  <span className="text-muted-foreground">{t('noImage')}</span>
                </div>
              )}
              
              {/* Back image placeholder */}
              {product.backImageUrl ? (
                <div className="relative w-full rounded-md overflow-hidden border p-4 flex justify-center items-center">
                  <img 
                    src={product.backImageUrl} 
                    alt={`Back of ${product.name}`} 
                    className="max-h-[300px] w-auto max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-full h-24 bg-muted/50 rounded-md flex items-center justify-center border-dashed border-2">
                  <span className="text-muted-foreground text-sm">{t('backImageComingSoon')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chart Card */}
          <Card className="h-full" ref={chartCardRef}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="font-headline">
                  {chartMode === 'vibe' ? t('overallVibe') : t('overallValue')}
                </CardTitle>
                {/* Quadrant Badges - inline with title */}
                {(() => {
                  const isTasty = (product.avgTaste || 0) >= 50;
                  const isSafe = (product.avgSafety || 0) >= 50;
                  let vibeQuadrant = '';
                  let vibeColor = '';
                  if (isTasty && isSafe) { vibeQuadrant = t('holyGrail'); vibeColor = 'bg-green-500/10 text-green-500 border-green-500/30'; }
                  else if (!isTasty && isSafe) { vibeQuadrant = t('survivorFood'); vibeColor = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'; }
                  else if (isTasty && !isSafe) { vibeQuadrant = t('russianRoulette'); vibeColor = 'bg-orange-500/10 text-orange-500 border-orange-500/30'; }
                  else { vibeQuadrant = t('theBin'); vibeColor = 'bg-red-500/10 text-red-500 border-red-500/30'; }
                  return (
                    <Badge variant="outline" className={`${vibeColor} px-2 py-0.5 text-xs`}>
                      🎯 {vibeQuadrant}
                    </Badge>
                  );
                })()}
                {product.avgPrice && product.avgPrice > 0 && (() => {
                  const isTasty = (product.avgTaste || 0) >= 50;
                  const isCheap = product.avgPrice <= 2.5;
                  let valueQuadrant = '';
                  let valueColor = '';
                  if (isTasty && isCheap) { valueQuadrant = t('theSteal'); valueColor = 'bg-green-500/10 text-green-500 border-green-500/30'; }
                  else if (!isTasty && isCheap) { valueQuadrant = t('cheapFiller'); valueColor = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'; }
                  else if (isTasty && !isCheap) { valueQuadrant = t('treat'); valueColor = 'bg-blue-500/10 text-blue-500 border-blue-500/30'; }
                  else { valueQuadrant = t('ripOff'); valueColor = 'bg-red-500/10 text-red-500 border-red-500/30'; }
                  return (
                    <Badge variant="outline" className={`${valueColor} px-2 py-0.5 text-xs`}>
                      💰 {valueQuadrant}
                    </Badge>
                  );
                })()}
              </div>
              <CardDescription>{t('basedOnVotes', { count: product.voteCount || 0 })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">{t('averageSafety')}</p>
                  <p className="text-2xl font-bold">{Math.round(product.avgSafety || 0)}%</p>
                  {getRatingBadge(product.avgSafety || 0)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('averageTaste')}</p>
                  <p className="text-2xl font-bold">{Math.round(product.avgTaste || 0)}%</p>
                  {getRatingBadge(product.avgTaste || 0)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('averagePriceShort')}</p>
                  <p className="text-2xl font-bold">
                    {product.avgPrice && product.avgPrice > 0 
                      ? '$'.repeat(Math.round(product.avgPrice))
                      : '—'
                    }
                  </p>
                  {product.avgPrice && product.avgPrice > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {product.avgPrice <= 2 ? t('cheap') : product.avgPrice >= 4 ? t('expensive') : t('moderate')}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Chart with dots */}
              <div className="relative h-[350px]">
                <ProductVibeChart mode={chartMode} />
                
                {/* 
                  Position calculation:
                  - Vibe mode: safety 0-100 maps directly, then inverted (100-safety) for CSS top
                  - Value mode: price 1-5 maps to 20-100 (like main page), then inverted (100-value) for CSS top
                    Formula: (price - 1) * 20 + 20 gives: 1->20, 2->40, 3->60, 4->80, 5->100
                    Then CSS top: 100 - chartValue, so cheap(1->20) at bottom (80%), expensive(5->100) at top (0%)
                */}
                
                {/* Average dot */}
                {viewMode === 'average' && (() => {
                  const xPos = product.avgTaste ?? 50;
                  const yPos = chartMode === 'value' 
                    ? product.avgPrice 
                      ? 100 - ((product.avgPrice - 1) * 20 + 20)  // 1->80%, 5->0%
                      : 50
                    : 100 - (product.avgSafety ?? 50);
                  
                  return (
                    <div
                      className="absolute w-4 h-4 rounded-full border-2 border-primary-foreground shadow-lg pointer-events-none"
                      style={{
                        left: `calc(${xPos}% - 8px)`,
                        top: `calc(${yPos}% - 8px)`,
                        backgroundColor: getColorForProduct(product.name),
                      }}
                    />
                  );
                })()}

                {/* User's vote dot (or impersonated user's vote) */}
                {viewMode === 'myVote' && effectiveVote && (() => {
                  const xPos = effectiveVote.taste;
                  const yPos = chartMode === 'value'
                    ? effectiveVote.price
                      ? 100 - ((effectiveVote.price - 1) * 20 + 20)  // 1->80%, 5->0%
                      : null  // No price vote
                    : 100 - effectiveVote.safety;
                  
                  if (chartMode === 'value' && yPos === null) {
                    return (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                        <p className="text-muted-foreground text-sm text-center px-4">
                          {t('noPriceVote')}
                        </p>
                      </div>
                    );
                  }
                  
                  return (
                    <div
                      className={`absolute w-5 h-5 rounded-full border-2 shadow-lg pointer-events-none ${
                        impersonatedUserId ? 'border-yellow-500' : 'border-white'
                      }`}
                      style={{
                        left: `calc(${xPos}% - 10px)`,
                        top: `calc(${yPos}% - 10px)`,
                        backgroundColor: getColorForProduct(product.name),
                      }}
                    />
                  );
                })()}
                {viewMode === 'myVote' && !effectiveVote && !isLoggedIn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                    <p className="text-muted-foreground">
                      {impersonatedUserId ? t('userHasNotVoted') : t('noVoteYet')}
                    </p>
                  </div>
                )}

                {/* All votes dots */}
                {viewMode === 'allVotes' && allVotes.map((vote, idx) => {
                  const xPos = vote.taste;
                  const yPos = chartMode === 'value'
                    ? vote.price
                      ? 100 - ((vote.price - 1) * 20 + 20)  // 1->80%, 5->0%
                      : null  // Skip votes without price in value mode
                    : 100 - vote.safety;
                  
                  // In value mode, skip votes without price
                  if (chartMode === 'value' && yPos === null) return null;
                  
                  return (
                    <div
                      key={idx}
                      className={`absolute rounded-full shadow-sm pointer-events-none transition-all ${
                        highlightedVoteId === vote.userId 
                          ? 'w-5 h-5 ring-2 ring-primary ring-offset-2 z-10' 
                          : 'w-3 h-3'
                      }`}
                      style={{
                        left: `calc(${xPos}% - ${highlightedVoteId === vote.userId ? 10 : 6}px)`,
                        top: `calc(${yPos}% - ${highlightedVoteId === vote.userId ? 10 : 6}px)`,
                        opacity: highlightedVoteId && highlightedVoteId !== vote.userId ? 0.4 : 0.9,
                        backgroundColor: getColorForProduct(product.name),
                      }}
                      title={vote.isRegistered ? t('verifiedUser') : t('anonymousUser')}
                    />
                  );
                })}
                
                {/* Draggable dot for voting - only when logged in and in myVote mode and not impersonating */}
                {/* Note: Only show in Vibe mode since DraggableDot works with safety/taste */}
                {isLoggedIn && viewMode === 'myVote' && !isImpersonatingOtherUser && chartMode === 'vibe' && (
                  <DraggableDot 
                    safety={customVibe.safety} 
                    taste={customVibe.taste} 
                    onVibeChange={handleVibeChange}
                  />
                )}
              </div>
              
              {/* Lens Toggle - centered below chart */}
              <div className="flex justify-center">
                <div className="flex gap-1 p-1 bg-muted rounded-lg">
                  <Button
                    variant={chartMode === 'vibe' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setChartMode('vibe')}
                    className="text-xs"
                  >
                    🎯 {t('vibeLens')}
                  </Button>
                  <Button
                    variant={chartMode === 'value' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setChartMode('value')}
                    className="text-xs"
                    disabled={!product.avgPrice || product.avgPrice <= 0}
                  >
                    💰 {t('valueLens')}
                  </Button>
                </div>
              </div>
              
              {/* View Mode Tabs */}
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="average">{t('average')}</TabsTrigger>
                  {(isLoggedIn || impersonatedUserId) && (
                    <TabsTrigger value="myVote">
                      {impersonatedUserId ? t('theirVote') : t('myVote')}
                    </TabsTrigger>
                  )}
                  {!isLoggedIn && !impersonatedUserId && <TabsTrigger value="myVote" disabled>{t('myVote')}</TabsTrigger>}
                  <TabsTrigger value="allVotes">{t('allVotes')}</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {/* Impersonation indicator */}
              {impersonatedUserId && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-500/10 border border-yellow-500/30">
                  <Eye className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-yellow-500">
                    {t('viewingAs')} <code className="font-mono">{impersonatedUserId.slice(0, 8)}...</code>
                  </span>
                </div>
              )}

              {/* Voting controls - inline, only when logged in and in myVote mode */}
              {isLoggedIn && viewMode === 'myVote' && !isImpersonatingOtherUser && (
                <div className="space-y-4 pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{t('dragToVote')}</span>
                    {isRegistered && <Badge variant="secondary" className="text-xs">{t('verifiedVote')}</Badge>}
                  </div>
                  
                  {/* Sliders */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm">{t('safety')}: {customVibe.safety}%</Label>
                      <Slider
                        value={[customVibe.safety]}
                        onValueChange={(v) => handleSliderChange('safety', v)}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">{t('taste')}: {customVibe.taste}%</Label>
                      <Slider
                        value={[customVibe.taste]}
                        onValueChange={(v) => handleSliderChange('taste', v)}
                        max={100}
                        step={1}
                      />
                    </div>
                  </div>
                  
                  {/* Vote buttons */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      onClick={handleAgree} 
                      disabled={isSubmitting}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ThumbsUp className="mr-2 h-4 w-4" />
                      )}
                      {t('agreeWithCommunity')}
                    </Button>
                    <Button 
                      onClick={handleSubmitCustom} 
                      disabled={isSubmitting}
                      size="sm"
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      {hasVoted ? t('confirmUpdate') : t('confirmVote')}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Sign in prompt when viewing myVote but not logged in */}
              {!isLoggedIn && viewMode === 'myVote' && !impersonatedUserId && (
                <div className="text-center p-4 border-t">
                  <p className="text-muted-foreground text-sm">{t('signInToVote')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Product Details Placeholders */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Ingredients Card */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">{t('ingredients')}</CardTitle>
              <CardDescription>{t('ingredientsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {product.ingredients && product.ingredients.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {product.ingredients.map((ingredient, idx) => (
                    <li key={idx} className="text-sm">{ingredient}</li>
                  ))}
                </ul>
              ) : (
                <div className="h-24 bg-muted/50 rounded-md flex items-center justify-center border-dashed border-2">
                  <span className="text-muted-foreground text-sm">{t('ingredientsComingSoon')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Purchase Info Card - Combined Store + Price entries */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">{t('purchaseInfo')}</CardTitle>
              <CardDescription>{t('purchaseInfoDescriptionNew')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {product.stores && product.stores.length > 0 ? (
                <>
                  {product.stores.map((store, idx) => {
                    // Calculate freshness
                    const lastSeen = store.lastSeenAt instanceof Date 
                      ? store.lastSeenAt 
                      : (store.lastSeenAt as any)?.toDate?.() 
                        ? (store.lastSeenAt as any).toDate()
                        : new Date(store.lastSeenAt as unknown as string);
                    const daysSince = Math.floor((Date.now() - lastSeen.getTime()) / (1000 * 60 * 60 * 24));
                    const freshnessClass = daysSince < 7 
                      ? 'border-green-500/50' 
                      : daysSince < 30 
                        ? 'border-yellow-500/50' 
                        : 'border-muted opacity-60';
                    
                    // Check if store is near user
                    const isNearMe = store.geoPoint && userCoords && 
                      getDistanceKm(userCoords.lat, userCoords.lng, store.geoPoint.lat, store.geoPoint.lng) <= NEAR_ME_RADIUS_KM;
                    
                    const hasLocation = !!store.geoPoint;
                    const hasPrice = store.price && store.price > 0;
                    
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-center gap-3 p-3 rounded-lg border ${freshnessClass} bg-card hover:bg-muted/50 transition-colors ${hasLocation ? 'cursor-pointer' : ''}`}
                        onClick={() => hasLocation && openMapsLink(store.geoPoint!.lat, store.geoPoint!.lng, store.name)}
                      >
                        {/* Price indicator - prominent on left */}
                        <div className="flex flex-col items-center justify-center w-16 h-16 rounded-md bg-primary/10 flex-shrink-0 border border-primary/20">
                          {hasPrice ? (
                            <>
                              <span className="text-lg font-bold text-primary">
                                {'$'.repeat(store.price!)}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {store.price === 1 && t('cheap')}
                                {store.price === 2 && t('budget')}
                                {store.price === 3 && t('moderate')}
                                {store.price === 4 && t('pricey')}
                                {store.price === 5 && t('expensive')}
                              </span>
                            </>
                          ) : (
                            <DollarSign className="h-6 w-6 text-muted-foreground opacity-30" />
                          )}
                        </div>
                        
                        {/* Store info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{store.name}</p>
                            {isNearMe && (
                              <Badge variant="default" className="bg-green-500 text-white text-xs">
                                {t('nearMe')}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            <span>{getRelativeTimeString(lastSeen)}</span>
                            {hasLocation && (
                              <>
                                <span>•</span>
                                <Navigation className="h-3 w-3" />
                                <span>{t('tapForDirections')}</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* External link indicator */}
                        {hasLocation && (
                          <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Average price summary */}
                  {product.avgPrice && product.avgPrice > 0 && (
                    <div className="pt-3 border-t flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('averagePriceAcrossStores')}</span>
                      <span className="font-bold text-primary">
                        {'$'.repeat(Math.round(product.avgPrice))}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('noStoreDataYet')}</p>
                  <p className="text-xs mt-1">{t('beFirstToReport')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Admin Voter List */}
        {isRealAdmin && allVotes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('voterList')}
              </CardTitle>
              <CardDescription>
                {t('voterListDescription', { count: allVotes.length })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {allVotes.map((vote) => {
                    // Calculate vote age for display
                    const voteDate = (vote.votedAt as any)?.toDate?.() || (vote.createdAt as any)?.toDate?.();
                    const voteAge = voteDate ? getRelativeTimeString(voteDate) : null;
                    const isImpersonating = impersonatedUserId === vote.userId;
                    
                    return (
                    <div 
                      key={vote.userId}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                        highlightedVoteId === vote.userId ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                      } ${isImpersonating ? 'ring-2 ring-yellow-500' : ''}`}
                      onClick={() => {
                        setHighlightedVoteId(prev => prev === vote.userId ? null : vote.userId);
                        setViewMode('allVotes');
                        // Scroll to chart
                        setTimeout(() => {
                          chartCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">
                              {vote.userId.slice(0, 8)}...
                            </span>
                            {vote.isRegistered ? (
                              <Badge variant="secondary" className="text-xs">
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                {t('verified')}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">{t('anonymous')}</Badge>
                            )}
                            {voteAge && (
                              <span className="text-xs text-muted-foreground">{voteAge}</span>
                            )}
                            {isImpersonating && (
                              <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-500 border-yellow-500/50">
                                <Eye className="h-3 w-3 mr-1" />
                                {t('impersonating')}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-4 text-sm mt-1">
                            <span>{t('safety')}: <strong>{vote.safety}%</strong></span>
                            <span>{t('taste')}: <strong>{vote.taste}%</strong></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`hover:bg-yellow-500/10 ${isImpersonating ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            startViewingAsUser(vote.userId);
                          }}
                          title={t('viewAsThisUser')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVote(vote.userId);
                          }}
                          disabled={deletingVoteId === vote.userId}
                        >
                          {deletingVoteId === vote.userId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )})}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
