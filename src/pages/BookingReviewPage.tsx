import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface BookingData {
  id: string;
  equipment: {
    id: string;
    title: string;
    images: { image_url: string }[];
  };
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
}

export default function BookingReviewPage() {
  const { booking_id } = useParams<{ booking_id: string }>();
  const navigate = useNavigate();
  
  // ✅ CORRECTION : Récupérer l'état de chargement
  const { user, loading: authLoading } = useAuth();
  
  console.log("🔍 BookingReviewPage - User:", user?.email, "AuthLoading:", authLoading);  

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [existingReview, setExistingReview] = useState<any>(null);

  useEffect(() => {
    // ✅ CORRECTION : Attendre que l'authentification soit chargée
    if (authLoading) {
      console.log("⏳ Attente du chargement de l'authentification...");
      return;
    }

    // ✅ Maintenant on peut vérifier si l'utilisateur est connecté
    if (!user) {
      console.log("❌ Utilisateur non connecté, redirection vers /auth");
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour laisser un avis",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    console.log("✅ Utilisateur authentifié, chargement des données...");
    loadBookingData();
  }, [booking_id, user, authLoading]); // ✅ Ajouter authLoading dans les dépendances

  const loadBookingData = async () => {
    if (!booking_id) return;

    try {
      setIsLoading(true);

      // Récupérer les données de la réservation
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id,
          start_date,
          end_date,
          total_price,
          status,
          renter_id,
          equipment:equipments!inner (
            id,
            title,
            images:equipment_images (
              image_url
            )
          )
        `)
        .eq('id', booking_id)
        .single();

      if (bookingError) throw bookingError;

      // Vérifier que l'utilisateur est bien le locataire
      if (bookingData.renter_id !== user?.id) {
        toast({
          title: "Accès refusé",
          description: "Vous ne pouvez pas évaluer cette réservation",
          variant: "destructive",
        });
        navigate('/my-bookings');
        return;
      }

      // Vérifier que la réservation est terminée
      if (bookingData.status !== 'completed' && bookingData.status !== 'returned') {
        toast({
          title: "Réservation non terminée",
          description: "Vous ne pouvez évaluer que les réservations terminées",
          variant: "destructive",
        });
        navigate('/my-bookings');
        return;
      }

      setBooking(bookingData as BookingData);

      // Vérifier si un avis existe déjà
      const { data: reviewData } = await supabase
        .from('equipment_reviews')
        .select('*')
        .eq('booking_id', booking_id)
        .single();

      if (reviewData) {
        setExistingReview(reviewData);
        setRating(reviewData.rating);
        setComment(reviewData.comment || '');
        toast({
          title: "Avis existant",
          description: "Vous avez déjà évalué cette location. Vous pouvez la modifier.",
        });
      }
    } catch (error: any) {
      console.error('Erreur chargement réservation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de la réservation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!booking || !user) return;

    if (rating === 0) {
      toast({
        title: "Note requise",
        description: "Veuillez attribuer une note entre 1 et 5 étoiles",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      if (existingReview) {
        // Modifier l'avis existant
        const { error } = await supabase
          .from('equipment_reviews')
          .update({
            rating,
            comment: comment || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingReview.id);

        if (error) throw error;

        toast({
          title: "Avis modifié",
          description: "Votre évaluation a été mise à jour avec succès",
        });
      } else {
        // Créer un nouvel avis
        const { error } = await supabase
          .from('equipment_reviews')
          .insert({
            equipment_id: booking.equipment.id,
            booking_id: booking_id,
            reviewer_id: user.id,
            rating,
            comment: comment || null,
          });

        if (error) throw error;

        if (rating >= 4) {
          toast({
            title: "Avis créé",
            description: "Votre évaluation a été créée. Une commission est requise pour la publier.",
          });
        } else {
          toast({
            title: "Avis publié",
            description: "Votre évaluation a été publiée avec succès",
          });
        }
      }

      // Rediriger vers la page de réservations
      setTimeout(() => {
        navigate('/my-bookings');
      }, 2000);
    } catch (error: any) {
      console.error('Erreur soumission avis:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de soumettre votre avis",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // ✅ CORRECTION : Afficher un loader pendant le chargement de l'auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">Réservation introuvable</p>
            <Button onClick={() => navigate('/my-bookings')}>
              Retour à mes réservations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* En-tête */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/my-bookings')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {existingReview ? 'Modifier mon avis' : 'Laisser un avis'}
          </h1>
          <p className="text-gray-600">
            Partagez votre expérience avec la communauté
          </p>
        </div>

        {/* Informations sur la location */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <img
                src={booking.equipment.images?.[0]?.image_url || '/placeholder.png'}
                alt={booking.equipment.title}
                className="w-24 h-24 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">
                  {booking.equipment.title}
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    📅 Du {formatDate(booking.start_date)} au {formatDate(booking.end_date)}
                  </p>
                  <p className="font-medium text-green-600">
                    💰 {booking.total_price.toLocaleString()} FCFA
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulaire d'évaluation */}
        <Card>
          <CardHeader>
            <CardTitle>Votre évaluation</CardTitle>
            <CardDescription>
              Notez votre expérience et aidez les autres utilisateurs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Notation par étoiles */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Note générale *
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= (hoverRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {rating > 0 ? (
                    <span>
                      {rating}/5 - {
                        rating === 5 ? 'Excellent' :
                        rating === 4 ? 'Très bien' :
                        rating === 3 ? 'Bien' :
                        rating === 2 ? 'Moyen' :
                        'Décevant'
                      }
                    </span>
                  ) : (
                    'Aucune note'
                  )}
                </span>
              </div>
            </div>

            {/* Commentaire */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commentaire (optionnel)
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Partagez votre expérience : état de l'équipement, service du propriétaire, etc."
                rows={6}
                className="w-full"
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {comment.length}/1000 caractères
              </p>
            </div>

            {/* Info sur la commission */}
            {rating >= 4 && !existingReview && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>ℹ️ Information :</strong> Les avis de 4 étoiles et plus nécessitent
                  le paiement d'une commission avant publication pour éviter les abus.
                  Les avis de 3 étoiles et moins sont publiés immédiatement.
                </p>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate('/my-bookings')}
                disabled={isSubmitting}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={isSubmitting || rating === 0}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    En cours...
                  </>
                ) : (
                  existingReview ? 'Modifier l\'avis' : 'Publier l\'avis'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Conseils */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              💡 Conseils pour un bon avis
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Soyez honnête et constructif dans vos commentaires</li>
              <li>• Décrivez l'état de l'équipement et la qualité du service</li>
              <li>• Mentionnez les points positifs et les axes d'amélioration</li>
              <li>• Restez respectueux et courtois</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}