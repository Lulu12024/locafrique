-- -- Corriger les problèmes de sécurité critiques

-- -- 1. Corriger les fonctions sans search_path sécurisé
-- CREATE OR REPLACE FUNCTION public.update_updated_at_column()
-- RETURNS trigger
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = ''
-- AS $$
-- BEGIN
--     NEW.updated_at = now();
--     RETURN NEW;
-- END;
-- $$;

-- CREATE OR REPLACE FUNCTION public.update_equipment_reviews_updated_at()
-- RETURNS trigger
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = ''
-- AS $$
-- BEGIN
--   NEW.updated_at = now();
--   RETURN NEW;
-- END;
-- $$;

-- CREATE OR REPLACE FUNCTION public.update_updated_at()
-- RETURNS trigger
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = ''
-- AS $$
-- BEGIN
--   NEW.updated_at = now();
--   RETURN NEW;
-- END;
-- $$;

-- CREATE OR REPLACE FUNCTION public.create_wallet_for_new_profile()
-- RETURNS trigger
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = ''
-- AS $$
-- BEGIN
--   INSERT INTO public.wallets (user_id)
--   VALUES (NEW.id);
--   RETURN NEW;
-- END;
-- $$;

-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS trigger
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = ''
-- AS $$
-- BEGIN
--   INSERT INTO public.profiles (id, first_name, last_name, user_type)
--   VALUES (
--     NEW.id,
--     COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
--     COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
--     COALESCE(NEW.raw_user_meta_data->>'user_type', 'locataire')
--   );
--   RETURN NEW;
-- END;
-- $$;

-- -- 2. Ajouter les triggers manquants pour les timestamps
-- CREATE TRIGGER update_profiles_updated_at
--     BEFORE UPDATE ON public.profiles
--     FOR EACH ROW
--     EXECUTE FUNCTION public.update_updated_at_column();

-- CREATE TRIGGER update_equipments_updated_at
--     BEFORE UPDATE ON public.equipments
--     FOR EACH ROW
--     EXECUTE FUNCTION public.update_updated_at_column();

-- CREATE TRIGGER update_bookings_updated_at
--     BEFORE UPDATE ON public.bookings
--     FOR EACH ROW
--     EXECUTE FUNCTION public.update_updated_at_column();

-- CREATE TRIGGER update_wallets_updated_at
--     BEFORE UPDATE ON public.wallets
--     FOR EACH ROW
--     EXECUTE FUNCTION public.update_updated_at_column();

-- -- 3. Ajouter le trigger pour créer un portefeuille automatiquement
-- CREATE TRIGGER create_wallet_on_profile_creation
--     AFTER INSERT ON public.profiles
--     FOR EACH ROW
--     EXECUTE FUNCTION public.create_wallet_for_new_profile();

-- -- 4. Corriger les profils utilisateurs existants avec user_type null
-- UPDATE public.profiles 
-- SET user_type = 'locataire' 
-- WHERE user_type IS NULL;

-- -- 5. Rendre user_type obligatoire
-- ALTER TABLE public.profiles 
-- ALTER COLUMN user_type SET NOT NULL,
-- ALTER COLUMN user_type SET DEFAULT 'locataire';

-- -- 6. Ajouter des contraintes de validation
-- ALTER TABLE public.profiles 
-- ADD CONSTRAINT check_user_type CHECK (user_type IN ('locataire', 'proprietaire'));

-- -- 7. Améliorer la sécurité des équipements - ajouter une validation du statut
-- ALTER TABLE public.equipments 
-- ADD CONSTRAINT check_equipment_status CHECK (status IN ('en_attente', 'disponible', 'loue', 'maintenance', 'retire'));

-- -- 8. Ajouter des contraintes sur les réservations
-- ALTER TABLE public.bookings 
-- ADD CONSTRAINT check_booking_status CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'returned')),
-- ADD CONSTRAINT check_booking_dates CHECK (end_date > start_date),
-- ADD CONSTRAINT check_positive_price CHECK (total_price > 0);

-- -- 9. Créer une fonction pour générer des transactions de portefeuille sécurisées
-- CREATE OR REPLACE FUNCTION public.create_wallet_transaction(
--   p_wallet_id UUID,
--   p_amount NUMERIC,
--   p_transaction_type TEXT,
--   p_description TEXT DEFAULT NULL,
--   p_reference_id UUID DEFAULT NULL
-- )
-- RETURNS UUID
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = ''
-- AS $$
-- DECLARE
--   transaction_id UUID;
--   current_balance NUMERIC;
-- BEGIN
--   -- Vérifier que le portefeuille existe et appartient à l'utilisateur
--   SELECT balance INTO current_balance
--   FROM public.wallets 
--   WHERE id = p_wallet_id AND user_id = auth.uid();
  
--   IF NOT FOUND THEN
--     RAISE EXCEPTION 'Portefeuille non trouvé ou accès non autorisé';
--   END IF;
  
--   -- Vérifier que le solde est suffisant pour les débits
--   IF p_transaction_type = 'debit' AND current_balance < ABS(p_amount) THEN
--     RAISE EXCEPTION 'Solde insuffisant';
--   END IF;
  
--   -- Créer la transaction
--   INSERT INTO public.wallet_transactions (
--     wallet_id, 
--     amount, 
--     transaction_type, 
--     description, 
--     reference_id
--   ) VALUES (
--     p_wallet_id,
--     p_amount,
--     p_transaction_type,
--     p_description,
--     p_reference_id
--   ) RETURNING id INTO transaction_id;
  
--   -- Mettre à jour le solde du portefeuille
--   UPDATE public.wallets 
--   SET balance = CASE 
--     WHEN p_transaction_type = 'credit' THEN balance + ABS(p_amount)
--     WHEN p_transaction_type = 'debit' THEN balance - ABS(p_amount)
--     ELSE balance
--   END,
--   updated_at = now()
--   WHERE id = p_wallet_id;
  
--   RETURN transaction_id;
-- END;
-- $$;

-- -- 10. Ajouter des policies pour les transactions de portefeuille
-- CREATE POLICY "Users can create their own wallet transactions" 
-- ON public.wallet_transactions 
-- FOR INSERT 
-- WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM public.wallets 
--     WHERE id = wallet_id AND user_id = auth.uid()
--   )
-- );

-- -- 11. Améliorer la policy des équipements pour inclure les images
-- CREATE POLICY "Equipment images are linked to existing equipment" 
-- ON public.equipment_images 
-- FOR INSERT 
-- WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM public.equipments 
--     WHERE id = equipment_id
--   )
-- );