-- ========================================
-- Migration: Ajout des champs pour la gestion des statuts de location
-- Fichier: supabase/migrations/20251020191527_rental_status_fields.sql
-- VERSION CORRIGÉE - Sans utilisation d'ENUM
-- ========================================

-- 1. Ajouter les nouveaux champs à la table bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS rental_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 2. Ajouter des commentaires pour documenter les champs
COMMENT ON COLUMN public.bookings.rental_started_at IS 'Date et heure de début effectif de la location (quand le propriétaire marque "en location")';
COMMENT ON COLUMN public.bookings.completed_at IS 'Date et heure de fin effective de la location (quand le propriétaire marque "terminée")';

-- 3. Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_bookings_rental_started_at 
ON public.bookings(rental_started_at) 
WHERE rental_started_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_completed_at 
ON public.bookings(completed_at) 
WHERE completed_at IS NOT NULL;

-- 4. Créer une fonction pour automatiser les notifications lors des changements de statut
CREATE OR REPLACE FUNCTION notify_rental_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le statut passe à 'ongoing', créer une notification
  IF NEW.status = 'ongoing' AND (OLD.status IS NULL OR OLD.status != 'ongoing') THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      booking_id,
      read
    )
    SELECT 
      NEW.renter_id,
      'rental_started',
      'Location démarrée',
      'Votre location de "' || e.title || '" a démarré.',
      NEW.id,
      false
    FROM public.equipments e
    WHERE e.id = NEW.equipment_id;
  END IF;

  -- Si le statut passe à 'completed', créer une notification pour l'évaluation
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      booking_id,
      read
    )
    SELECT 
      NEW.renter_id,
      'rental_completed',
      'Location terminée',
      'Votre location est terminée. Merci de laisser une évaluation pour "' || e.title || '".',
      NEW.id,
      false
    FROM public.equipments e
    WHERE e.id = NEW.equipment_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Créer le trigger
DROP TRIGGER IF EXISTS on_rental_status_change ON public.bookings;
CREATE TRIGGER on_rental_status_change
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_rental_status_change();

-- 6. Créer une vue pour faciliter le suivi des locations en cours
CREATE OR REPLACE VIEW public.ongoing_rentals AS
SELECT 
  b.id,
  b.equipment_id,
  b.renter_id,
  b.start_date,
  b.end_date,
  b.rental_started_at,
  b.total_price,
  e.title as equipment_title,
  e.owner_id,
  pr.first_name as renter_first_name,
  pr.last_name as renter_last_name,
  pr.phone_number as renter_phone,
  po.first_name as owner_first_name,
  po.last_name as owner_last_name,
  po.phone_number as owner_phone
FROM public.bookings b
JOIN public.equipments e ON b.equipment_id = e.id
JOIN public.profiles pr ON b.renter_id = pr.id
JOIN public.profiles po ON e.owner_id = po.id
WHERE b.status = 'ongoing'
ORDER BY b.rental_started_at DESC;

-- 7. Donner les permissions appropriées
GRANT SELECT ON public.ongoing_rentals TO authenticated;

-- 8. Créer une fonction pour obtenir les statistiques de location d'un propriétaire
CREATE OR REPLACE FUNCTION get_owner_rental_stats(owner_uuid UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_rentals', COUNT(*),
    'ongoing_rentals', COUNT(*) FILTER (WHERE b.status = 'ongoing'),
    'completed_rentals', COUNT(*) FILTER (WHERE b.status = 'completed'),
    'total_revenue', COALESCE(SUM(b.total_price) FILTER (WHERE b.status = 'completed'), 0),
    'pending_revenue', COALESCE(SUM(b.total_price) FILTER (WHERE b.status = 'ongoing'), 0),
    'average_rental_duration', AVG(DATE_PART('day', b.end_date - b.start_date)) FILTER (WHERE b.status = 'completed')
  ) INTO stats
  FROM public.bookings b
  JOIN public.equipments e ON b.equipment_id = e.id
  WHERE e.owner_id = owner_uuid
    AND b.status IN ('ongoing', 'completed');
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Commentaire sur la fonction
COMMENT ON FUNCTION get_owner_rental_stats(UUID) IS 'Récupère les statistiques de location pour un propriétaire donné';

-- 10. Créer des index pour améliorer les performances des requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_bookings_status_ongoing 
ON public.bookings(status, equipment_id) 
WHERE status = 'ongoing';

CREATE INDEX IF NOT EXISTS idx_bookings_status_completed 
ON public.bookings(status, completed_at) 
WHERE status = 'completed';

-- 11. Ajouter une contrainte CHECK pour valider les statuts possibles
-- (Remplace l'ENUM par une contrainte)
DO $$
BEGIN
  -- Supprimer l'ancienne contrainte si elle existe
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bookings_status_check'
  ) THEN
    ALTER TABLE public.bookings DROP CONSTRAINT bookings_status_check;
  END IF;

  -- Ajouter la nouvelle contrainte avec 'ongoing'
  ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'confirmed', 'ongoing', 'completed', 'rejected', 'cancelled'));
END $$;

-- 12. Message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Migration rental_status_fields terminée avec succès!';
  RAISE NOTICE '📊 Nouveaux statuts disponibles: pending, confirmed, ongoing, completed, rejected, cancelled';
  RAISE NOTICE '🔔 Trigger de notification automatique activé';
  RAISE NOTICE '📈 Vue ongoing_rentals créée';
  RAISE NOTICE '📊 Fonction get_owner_rental_stats() disponible';
END $$;