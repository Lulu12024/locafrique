
-- Créer une table pour stocker les favoris des utilisateurs
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.equipments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, equipment_id)
);

-- Activer RLS sur la table des favoris
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can create their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;

-- Politique pour que les utilisateurs puissent voir leurs propres favoris
CREATE POLICY "Users can view their own favorites" 
  ON public.favorites 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Politique pour que les utilisateurs puissent ajouter leurs propres favoris
CREATE POLICY "Users can create their own favorites" 
  ON public.favorites 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Politique pour que les utilisateurs puissent supprimer leurs propres favoris
CREATE POLICY "Users can delete their own favorites" 
  ON public.favorites 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Activer la réplication en temps réel pour la table favorites
ALTER TABLE public.favorites REPLICA IDENTITY FULL;

-- Ajouter la table à la publication pour les mises à jour en temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE public.favorites;

-- Activer la réplication en temps réel pour les notifications existantes
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Ajouter les notifications à la publication si pas déjà fait
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;
