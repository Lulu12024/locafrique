
import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useEquipmentReviews, OwnerStats } from '@/hooks/useEquipmentReviews';

interface OwnerRatingProps {
  ownerId: string;
  className?: string;
  showDetails?: boolean;
}

export function OwnerRating({ ownerId, className = '', showDetails = true }: OwnerRatingProps) {
  const [stats, setStats] = useState<OwnerStats>({ totalReviews: 0, averageRating: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { fetchOwnerStats } = useEquipmentReviews();

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      const ownerStats = await fetchOwnerStats(ownerId);
      setStats(ownerStats);
      setIsLoading(false);
    };

    loadStats();
  }, [ownerId]);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
        {showDetails && (
          <>
            <span className="text-gray-300">·</span>
            <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
          </>
        )}
      </div>
    );
  }

  if (stats.totalReviews === 0) {
    return (
      <div className={`flex items-center gap-1 text-gray-500 ${className}`}>
        <Star className="h-4 w-4" />
        <span className="text-sm">Nouveau</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      <span className="font-medium text-sm">
        {stats.averageRating.toFixed(1)}
      </span>
      {showDetails && (
        <>
          <span className="text-gray-400">·</span>
          <span className="text-sm text-gray-600">
            {stats.totalReviews} avis
          </span>
        </>
      )}
    </div>
  );
}
