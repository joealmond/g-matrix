'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { useAdmin } from '@/hooks/use-admin';
import { Product, Vote } from '@/lib/types';
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
import { ThumbsUp, MapPin, DollarSign, Loader2, CheckCircle, Trash2, Users, ShieldCheck, Clock, Eye } from 'lucide-react';

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
  
  // Custom vote state
  const [customVibe, setCustomVibe] = useState({ safety: 50, taste: 50 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  
  // Admin state
  const [highlightedVoteId, setHighlightedVoteId] = useState<string | null>(null);
  const [deletingVoteId, setDeletingVoteId] = useState<string | null>(null);

  const decodedProductName = decodeURIComponent(params.name as string);
  const productId = decodedProductName.toLowerCase().replace(/[^a-z0-9]/g, '-');

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

          {/* Vibe Chart Card with View Toggle */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="font-headline">{t('overallVibe')}</CardTitle>
              <CardDescription>{t('basedOnVotes', { count: product.voteCount || 0 })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="flex justify-around text-center">
                <div>
                  <p className="text-sm text-muted-foreground">{t('averageSafety')}</p>
                  <p className="text-3xl font-bold">{Math.round(product.avgSafety || 0)}%</p>
                  {getRatingBadge(product.avgSafety || 0)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('averageTaste')}</p>
                  <p className="text-3xl font-bold">{Math.round(product.avgTaste || 0)}%</p>
                  {getRatingBadge(product.avgTaste || 0)}
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

              {/* Chart with dots */}
              <div className="relative h-[350px]">
                <ProductVibeChart />
                
                {/* Average dot */}
                {viewMode === 'average' && product.avgTaste !== undefined && product.avgSafety !== undefined && (
                  <div
                    className="absolute w-4 h-4 rounded-full border-2 border-primary-foreground shadow-lg pointer-events-none"
                    style={{
                      left: `calc(${product.avgTaste}% - 8px)`,
                      top: `calc(${100 - product.avgSafety}% - 8px)`,
                      backgroundColor: getColorForProduct(product.name),
                    }}
                  />
                )}

                {/* User's vote dot (or impersonated user's vote) */}
                {viewMode === 'myVote' && effectiveVote && (
                  <div
                    className={`absolute w-5 h-5 rounded-full border-2 shadow-lg pointer-events-none ${
                      impersonatedUserId ? 'border-yellow-500' : 'border-white'
                    }`}
                    style={{
                      left: `calc(${effectiveVote.taste}% - 10px)`,
                      top: `calc(${100 - effectiveVote.safety}% - 10px)`,
                      backgroundColor: getColorForProduct(product.name),
                    }}
                  />
                )}
                {viewMode === 'myVote' && !effectiveVote && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                    <p className="text-muted-foreground">
                      {impersonatedUserId ? t('userHasNotVoted') : t('noVoteYet')}
                    </p>
                  </div>
                )}

                {/* All votes dots */}
                {viewMode === 'allVotes' && allVotes.map((vote, idx) => (
                  <div
                    key={idx}
                    className={`absolute rounded-full shadow-sm pointer-events-none transition-all ${
                      highlightedVoteId === vote.userId 
                        ? 'w-5 h-5 ring-2 ring-primary ring-offset-2 z-10' 
                        : 'w-3 h-3'
                    }`}
                    style={{
                      left: `calc(${vote.taste}% - ${highlightedVoteId === vote.userId ? 10 : 6}px)`,
                      top: `calc(${100 - vote.safety}% - ${highlightedVoteId === vote.userId ? 10 : 6}px)`,
                      opacity: highlightedVoteId && highlightedVoteId !== vote.userId ? 0.4 : 0.9,
                      backgroundColor: getColorForProduct(product.name),
                    }}
                    title={vote.isRegistered ? t('verifiedUser') : t('anonymousUser')}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Voting Section - Only for logged in users, hidden when impersonating another user */}
        {isLoggedIn && !isImpersonatingOtherUser && (
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">{t('addYourVote')}</CardTitle>
              <CardDescription>
                {hasVoted ? t('updateYourVote') : t('shareYourOpinion')}
                {isRegistered && <Badge variant="secondary" className="ml-2">{t('verifiedVote')}</Badge>}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Agree button */}
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Button 
                  onClick={handleAgree} 
                  disabled={isSubmitting}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ThumbsUp className="mr-2 h-4 w-4" />
                  )}
                  {t('agreeWithCommunity')} (+1)
                </Button>
                <span className="text-muted-foreground">{t('or')}</span>
              </div>

              <Separator />

              {/* Custom vote with draggable dot */}
              <div className="space-y-4">
                <p className="font-semibold">{t('customVote')}</p>
                
                <div className="relative h-[300px] border rounded-lg overflow-hidden">
                  <ProductVibeChart />
                  <DraggableDot 
                    safety={customVibe.safety} 
                    taste={customVibe.taste} 
                    onVibeChange={handleVibeChange}
                  />
                </div>

                {/* Sliders */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('safety')}: {customVibe.safety}%</Label>
                    <Slider
                      value={[customVibe.safety]}
                      onValueChange={(v) => handleSliderChange('safety', v)}
                      max={100}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('taste')}: {customVibe.taste}%</Label>
                    <Slider
                      value={[customVibe.taste]}
                      onValueChange={(v) => handleSliderChange('taste', v)}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSubmitCustom} 
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  {hasVoted ? t('confirmUpdate') : t('confirmVote')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Not logged in prompt */}
        {!isLoggedIn && !userLoading && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">{t('signInToVote')}</p>
            </CardContent>
          </Card>
        )}

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

          {/* Price & Location Card */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">{t('purchaseInfo')}</CardTitle>
              <CardDescription>{t('purchaseInfoDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('price')}</p>
                  {product.price ? (
                    <p className="font-semibold">{product.price} {product.currency || 'USD'}</p>
                  ) : (
                    <p className="text-muted-foreground text-sm">{t('notAvailable')}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('purchaseLocation')}</p>
                  {product.purchaseLocation ? (
                    <p className="font-semibold">{product.purchaseLocation}</p>
                  ) : (
                    <p className="text-muted-foreground text-sm">{t('notAvailable')}</p>
                  )}
                </div>
              </div>
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
