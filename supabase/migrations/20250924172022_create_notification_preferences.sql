-- Migration Supabase : Table des préférences de notification
-- Créer le fichier : supabase/migrations/[timestamp]_create_notification_preferences.sql

-- Créer la table des préférences de notification
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Préférences email
  email_bookings BOOLEAN DEFAULT true,
  email_payments BOOLEAN DEFAULT true, 
  email_messages BOOLEAN DEFAULT true,
  email_marketing BOOLEAN DEFAULT false,
  email_security BOOLEAN DEFAULT true,
  
  -- Préférences push
  push_bookings BOOLEAN DEFAULT true,
  push_payments BOOLEAN DEFAULT true,
  push_messages BOOLEAN DEFAULT true,
  push_reminders BOOLEAN DEFAULT true,
  
  -- Paramètres généraux
  sound_enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  digest_frequency TEXT DEFAULT 'immediate' CHECK (digest_frequency IN ('immediate', 'hourly', 'daily', 'weekly')),
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Contrainte unique par utilisateur
  UNIQUE(user_id)
);

-- Activer RLS (Row Level Security)
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs voient leurs propres préférences
CREATE POLICY "Users can view their own notification preferences" 
ON public.notification_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

-- Politique pour que les utilisateurs créent leurs préférences
CREATE POLICY "Users can create their own notification preferences" 
ON public.notification_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Politique pour que les utilisateurs mettent à jour leurs préférences
CREATE POLICY "Users can update their own notification preferences" 
ON public.notification_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Politique pour que les utilisateurs suppriment leurs préférences
CREATE POLICY "Users can delete their own notification preferences" 
ON public.notification_preferences 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Activer la réplication en temps réel
ALTER TABLE public.notification_preferences REPLICA IDENTITY FULL;

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id 
ON public.notification_preferences(user_id);

-- Commentaires sur la table
COMMENT ON TABLE public.notification_preferences IS 'Préférences de notification des utilisateurs';
COMMENT ON COLUMN public.notification_preferences.user_id IS 'ID utilisateur propriétaire des préférences';
COMMENT ON COLUMN public.notification_preferences.email_bookings IS 'Notifications email pour les réservations';
COMMENT ON COLUMN public.notification_preferences.push_bookings IS 'Notifications push pour les réservations';
COMMENT ON COLUMN public.notification_preferences.digest_frequency IS 'Fréquence des résumés de notification';