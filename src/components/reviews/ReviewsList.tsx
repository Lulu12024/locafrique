
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { useEquipmentReviews, EquipmentReview } from '@/hooks/useEquipmentReviews';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReviewsListProps {
  equipmentId: string;
  showTitle?: boolean;
}

export function ReviewsList({ equipmentId, showTitle = true }: ReviewsListProps) {
  const [reviews, setReviews] = useState<EquipmentReview[]>([]);
  const { fetchEquipmentReviews, isLoading } = useEquipmentReviews();

  useEffect(() => {
    const loadReviews = async () => {
      const data = await fetchEquipmentReviews(equipmentId);
      setReviews(data);
    };

    loadReviews();
  }, [equipmentId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {showTitle && <h3 className="text-lg font-semibold">Avis des utilisateurs</h3>}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        {showTitle && <h3 className="text-lg font-semibold mb-4">Avis des utilisateurs</h3>}
        <p className="text-gray-500">Aucun avis pour le moment.</p>
        <p className="text-sm text-gray-400 mt-1">
          Soyez le premier à laisser votre avis !
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Avis des utilisateurs</h3>
          <span className="text-sm text-gray-500">({reviews.length})</span>
        </div>
      )}
      
      <div className="space-y-3">
        {reviews.map((review) => (
          <Card key={review.id} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={review.reviewer?.avatar_url} />
                  <AvatarFallback className="bg-gray-200 text-gray-700">
                    {review.reviewer?.first_name?.[0]}{review.reviewer?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {review.reviewer?.first_name} {review.reviewer?.last_name}
                      </span>
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
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(review.created_at), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </div>
                  
                  {review.comment && (
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
