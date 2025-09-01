
import React from 'react';
import { ReviewsList } from '@/components/reviews/ReviewsList';
import { OwnerRating } from '@/components/reviews/OwnerRating';

interface EquipmentReviewsProps {
  equipmentId: string;
  ownerId: string;
}

export function EquipmentReviews({ equipmentId, ownerId }: EquipmentReviewsProps) {
  return (
    <div className="border-t pt-6 space-y-6">
      {/* Statistiques du propriétaire */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Avis et évaluations</h3>
        <OwnerRating ownerId={ownerId} showDetails={true} />
      </div>
      
      {/* Liste des avis */}
      <ReviewsList equipmentId={equipmentId} showTitle={false} />
    </div>
  );
}
