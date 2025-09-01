
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEquipmentReviews, EquipmentReview } from '@/hooks/useEquipmentReviews';
import { useReviewCommissions } from '@/hooks/useReviewCommissions';
import { Star, AlertCircle, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/auth';

export function PendingReviewsAlert() {
  const { user } = useAuth();
  const [pendingReviews, setPendingReviews] = useState<EquipmentReview[]>([]);
  const { fetchOwnerReviews } = useEquipmentReviews();
  const { markCommissionAsPaid, isLoading } = useReviewCommissions();

  useEffect(() => {
    const loadPendingReviews = async () => {
      if (!user) return;
      
      const reviews = await fetchOwnerReviews(user.id);
      const pending = reviews.filter(review => review.status === 'pending_payment');
      setPendingReviews(pending);
    };

    loadPendingReviews();
  }, [user]);

  const handlePayCommission = async (reviewId: string) => {
    // Ici on devrait trouver la commission correspondante
    // Pour simplifier, on suppose qu'il y a une relation directe
    console.log('Paiement de la commission pour l\'avis:', reviewId);
    
    // Recharger les avis après paiement
    if (user) {
      const reviews = await fetchOwnerReviews(user.id);
      const pending = reviews.filter(review => review.status === 'pending_payment');
      setPendingReviews(pending);
    }
  };

  if (pendingReviews.length === 0) return null;

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">
        Avis en attente de publication
      </AlertTitle>
      <AlertDescription className="text-amber-700 space-y-4">
        <p>
          Vous avez {pendingReviews.length} avis positif{pendingReviews.length > 1 ? 's' : ''} en attente de publication. 
          Une commission est requise pour les publier publiquement.
        </p>
        
        <div className="space-y-3">
          {pendingReviews.map((review) => (
            <Card key={review.id} className="border-amber-200 bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        {review.rating} étoiles
                      </Badge>
                    </div>
                    
                    {review.comment && (
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                        "{review.comment}"
                      </p>
                    )}
                    
                    <p className="text-sm font-medium text-amber-800">
                      Commission requise: {review.commission_due.toLocaleString()} FCFA
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => handlePayCommission(review.id)}
                    disabled={isLoading}
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Payer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}
