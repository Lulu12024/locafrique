-- supabase/migrations/[timestamp]_fix_notifications_rls.sql
-- Corriger les politiques RLS pour la table notifications

-- 1. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

-- 2. S'assurer que RLS est activé
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Politique SELECT : Les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- 4. ✅ Politique INSERT permissive : Permet de créer des notifications pour d'autres utilisateurs
-- Cette politique autorise la création de notifications dans le cadre de réservations
CREATE POLICY "Users can create notifications for others during bookings" 
ON public.notifications 
FOR INSERT 
WITH CHECK (
  -- L'utilisateur peut créer une notification pour lui-même
  auth.uid() = user_id 
  OR
  -- OU l'utilisateur peut créer une notification liée à une réservation valide
  (
    booking_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.equipments e ON b.equipment_id = e.id
      WHERE b.id = booking_id 
      AND (
        -- Le locataire peut notifier le propriétaire
        (b.renter_id = auth.uid() AND e.owner_id = user_id)
        OR
        -- Le propriétaire peut notifier le locataire  
        (e.owner_id = auth.uid() AND b.renter_id = user_id)
      )
    )
  )
);

-- 5. Politique UPDATE : Les utilisateurs peuvent marquer leurs notifications comme lues
CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Politique DELETE : Les utilisateurs peuvent supprimer leurs propres notifications
CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- 7. Ajouter une valeur par défaut pour le champ data (éviter erreurs JSON)
ALTER TABLE public.notifications 
ALTER COLUMN data SET DEFAULT '{}'::jsonb;

-- 8. Commentaires
COMMENT ON POLICY "Users can create notifications for others during bookings" ON public.notifications 
IS 'Permet aux locataires et propriétaires de se notifier mutuellement dans le cadre de réservations validées';