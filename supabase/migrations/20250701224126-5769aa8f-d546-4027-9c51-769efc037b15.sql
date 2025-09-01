
-- Créer une table pour les évaluations d'équipements
CREATE TABLE IF NOT EXISTS public.equipment_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES public.equipments(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(booking_id) -- Une seule évaluation par réservation
);

-- Activer RLS sur la table des évaluations
ALTER TABLE public.equipment_reviews ENABLE ROW LEVEL SECURITY;

-- Politique pour que tout le monde puisse voir les évaluations
CREATE POLICY "Everyone can view equipment reviews" 
  ON public.equipment_reviews 
  FOR SELECT 
  USING (true);

-- Politique pour que les locataires puissent créer des évaluations pour leurs réservations terminées
CREATE POLICY "Renters can create reviews for their completed bookings" 
  ON public.equipment_reviews 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = reviewer_id 
    AND EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = booking_id 
      AND renter_id = auth.uid() 
      AND status IN ('completed', 'returned')
    )
  );

-- Politique pour que les utilisateurs puissent modifier leurs propres évaluations
CREATE POLICY "Users can update their own reviews" 
  ON public.equipment_reviews 
  FOR UPDATE 
  USING (auth.uid() = reviewer_id);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_equipment_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_equipment_reviews_updated_at
  BEFORE UPDATE ON public.equipment_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_reviews_updated_at();

-- Activer la réplication en temps réel pour la table equipment_reviews
ALTER TABLE public.equipment_reviews REPLICA IDENTITY FULL;

-- Ajouter la table à la publication pour les mises à jour en temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE public.equipment_reviews;
