-- -- Créer la table pour les tokens push des utilisateurs
-- CREATE TABLE IF NOT EXISTS public.user_push_tokens (
--   id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
--   user_id UUID NOT NULL,
--   token TEXT NOT NULL,
--   platform TEXT NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
--   updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
--   UNIQUE(user_id, platform)
-- );

-- -- Enable RLS
-- ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- -- Create policies
-- CREATE POLICY "Users can manage their own push tokens" 
-- ON public.user_push_tokens 
-- FOR ALL 
-- USING (auth.uid() = user_id);

-- -- Trigger pour updated_at
-- CREATE TRIGGER update_user_push_tokens_updated_at
-- BEFORE UPDATE ON public.user_push_tokens
-- FOR EACH ROW
-- EXECUTE FUNCTION public.update_updated_at_column();