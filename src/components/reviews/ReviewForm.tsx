
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useEquipmentReviews } from '@/hooks/useEquipmentReviews';

interface ReviewFormProps {
  equipmentId: string;
  bookingId: string;
  equipmentTitle: string;
  onReviewSubmitted?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ 
  equipmentId, 
  bookingId, 
  equipmentTitle, 
  onReviewSubmitted, 
  onCancel 
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const { createReview, isLoading } = useEquipmentReviews();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      return;
    }

    const result = await createReview(equipmentId, bookingId, rating, comment);
    
    if (result.success) {
      setRating(0);
      setComment('');
      onReviewSubmitted?.();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg">Évaluer votre expérience</CardTitle>
        <p className="text-sm text-gray-600">{equipmentTitle}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating Stars */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Note *
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 hover:scale-110 transition-transform"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {rating === 1 && "Très décevant"}
                {rating === 2 && "Décevant"}
                {rating === 3 && "Correct"}
                {rating === 4 && "Très bien"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Commentaire (optionnel)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience avec cet équipement..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 caractères
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Annuler
              </Button>
            )}
            <Button
              type="submit"
              disabled={rating === 0 || isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? 'Publication...' : 'Publier l\'avis'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
