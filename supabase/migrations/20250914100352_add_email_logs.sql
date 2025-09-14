-- supabase/migrations/20250914100355_fix_function_conflicts.sql

-- 1. Supprimer les fonctions existantes qui ont des conflits de types
DROP FUNCTION IF EXISTS public.ensure_user_wallet(UUID);
DROP FUNCTION IF EXISTS public.create_wallet_transaction_secure(UUID, NUMERIC, TEXT, TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS public.approve_booking_automatically(UUID, UUID);
DROP FUNCTION IF EXISTS public.reject_booking_with_refund(UUID, UUID);
DROP FUNCTION IF EXISTS public.create_booking_notification(UUID, UUID, TEXT, TEXT, TEXT);

-- 2. Vérifier et supprimer les autres fonctions potentiellement conflictuelles
DO $$
BEGIN
    -- Supprimer toutes les versions de ensure_user_wallet
    DROP FUNCTION IF EXISTS public.ensure_user_wallet(UUID) CASCADE;
    DROP FUNCTION IF EXISTS public.ensure_user_wallet(TEXT) CASCADE;
    
    -- Supprimer toutes les versions de create_wallet_transaction avec différentes signatures
    DROP FUNCTION IF EXISTS public.create_wallet_transaction(UUID, NUMERIC, TEXT, TEXT, UUID) CASCADE;
    DROP FUNCTION IF EXISTS public.create_wallet_transaction_secure(UUID, NUMERIC, TEXT, TEXT, UUID) CASCADE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Ignorer les erreurs si les fonctions n'existent pas
        NULL;
END $$;

-- 3. Recréer la fonction ensure_user_wallet avec la bonne signature
CREATE OR REPLACE FUNCTION public.ensure_user_wallet(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  wallet_id UUID;
BEGIN
  -- Vérifier si le portefeuille existe
  SELECT id INTO wallet_id
  FROM public.wallets
  WHERE user_id = p_user_id;
  
  -- Créer le portefeuille s'il n'existe pas
  IF wallet_id IS NULL THEN
    INSERT INTO public.wallets (user_id, balance)
    VALUES (p_user_id, 0)
    RETURNING id INTO wallet_id;
    
    RAISE NOTICE 'Nouveau portefeuille créé avec ID: % pour utilisateur: %', wallet_id, p_user_id;
  END IF;
  
  RETURN wallet_id;
END;
$$;

-- 4. Recréer la fonction create_wallet_transaction_secure avec la bonne signature
CREATE OR REPLACE FUNCTION public.create_wallet_transaction_secure(
  p_wallet_id UUID,
  p_amount NUMERIC,
  p_transaction_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_booking_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  transaction_id UUID;
  current_balance NUMERIC;
  new_balance NUMERIC;
  wallet_user_id UUID;
  result JSON;
BEGIN
  -- Vérifier que le portefeuille existe et récupérer les infos
  SELECT balance, user_id INTO current_balance, wallet_user_id
  FROM public.wallets 
  WHERE id = p_wallet_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Portefeuille non trouvé avec ID: %', p_wallet_id;
  END IF;
  
  -- Vérifier l'autorisation (utilisateur connecté = propriétaire du portefeuille OU admin)
  IF wallet_user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Accès non autorisé à ce portefeuille';
  END IF;
  
  -- Calculer le nouveau solde
  IF p_transaction_type IN ('credit', 'refund') THEN
    new_balance := current_balance + ABS(p_amount);
  ELSIF p_transaction_type = 'debit' THEN
    new_balance := current_balance - ABS(p_amount);
    -- Vérifier que le solde est suffisant pour les débits
    IF new_balance < 0 THEN
      RAISE EXCEPTION 'Solde insuffisant. Solde actuel: %, Montant demandé: %', current_balance, ABS(p_amount);
    END IF;
  ELSE
    RAISE EXCEPTION 'Type de transaction invalide: %', p_transaction_type;
  END IF;
  
  -- Créer la transaction
  INSERT INTO public.wallet_transactions (
    wallet_id, 
    amount, 
    transaction_type, 
    description, 
    reference_id,
    booking_id,
    status
  ) VALUES (
    p_wallet_id,
    CASE 
      WHEN p_transaction_type = 'debit' THEN -ABS(p_amount)
      ELSE ABS(p_amount)
    END,
    p_transaction_type,
    p_description,
    p_reference_id,
    p_booking_id,
    'completed'
  ) RETURNING id INTO transaction_id;
  
  -- Mettre à jour le solde du portefeuille
  UPDATE public.wallets 
  SET balance = new_balance,
      updated_at = now()
  WHERE id = p_wallet_id;
  
  -- Préparer le résultat
  result := json_build_object(
    'success', true,
    'transaction_id', transaction_id,
    'previous_balance', current_balance,
    'new_balance', new_balance,
    'amount', p_amount,
    'transaction_type', p_transaction_type
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, retourner les détails
    result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'current_balance', current_balance,
      'requested_amount', p_amount,
      'transaction_type', p_transaction_type
    );
    RETURN result;
END;
$$;

-- 5. Recréer la fonction approve_booking_automatically
CREATE OR REPLACE FUNCTION public.approve_booking_automatically(
  p_booking_id UUID,
  p_owner_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  booking_data RECORD;
  result JSON;
BEGIN
  -- Vérifier que la réservation existe et appartient au propriétaire
  SELECT b.*, e.owner_id, e.title as equipment_title
  INTO booking_data
  FROM public.bookings b
  JOIN public.equipments e ON b.equipment_id = e.id
  WHERE b.id = p_booking_id AND e.owner_id = p_owner_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Réservation non trouvée ou accès non autorisé';
  END IF;
  
  -- Vérifier que la réservation est en attente
  IF booking_data.status != 'pending' THEN
    RAISE EXCEPTION 'Cette réservation ne peut pas être approuvée (statut actuel: %)', booking_data.status;
  END IF;
  
  -- Mettre à jour le statut de la réservation
  UPDATE public.bookings
  SET status = 'approved',
      owner_approval = true,
      approved_at = now(),
      updated_at = now()
  WHERE id = p_booking_id;
  
  -- Préparer le résultat
  result := json_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'status', 'approved',
    'approved_at', now(),
    'equipment_title', booking_data.equipment_title
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'booking_id', p_booking_id
    );
    RETURN result;
END;
$$;

-- 6. Recréer la fonction reject_booking_with_refund
CREATE OR REPLACE FUNCTION public.reject_booking_with_refund(
  p_booking_id UUID,
  p_owner_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  booking_data RECORD;
  wallet_id UUID;
  refund_result JSON;
  result JSON;
BEGIN
  -- Vérifier que la réservation existe et appartient au propriétaire
  SELECT b.*, e.owner_id, e.title as equipment_title
  INTO booking_data
  FROM public.bookings b
  JOIN public.equipments e ON b.equipment_id = e.id
  WHERE b.id = p_booking_id AND e.owner_id = p_owner_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Réservation non trouvée ou accès non autorisé';
  END IF;
  
  -- Vérifier que la réservation est en attente
  IF booking_data.status != 'pending' THEN
    RAISE EXCEPTION 'Cette réservation ne peut pas être refusée (statut actuel: %)', booking_data.status;
  END IF;
  
  -- Mettre à jour le statut de la réservation
  UPDATE public.bookings
  SET status = 'rejected',
      owner_approval = false,
      rejected_at = now(),
      updated_at = now()
  WHERE id = p_booking_id;
  
  -- Remboursement automatique si payé par portefeuille
  IF booking_data.payment_method = 'wallet' AND booking_data.payment_status = 'paid' THEN
    -- Récupérer le portefeuille du locataire
    SELECT id INTO wallet_id
    FROM public.wallets
    WHERE user_id = booking_data.renter_id;
    
    IF wallet_id IS NOT NULL THEN
      -- Effectuer le remboursement
      SELECT public.create_wallet_transaction_secure(
        wallet_id,
        booking_data.total_price,
        'refund',
        format('Remboursement - Réservation refusée: %s', booking_data.equipment_title),
        p_booking_id,
        p_booking_id
      ) INTO refund_result;
      
      -- Mettre à jour le statut de paiement
      UPDATE public.bookings
      SET payment_status = 'refunded'
      WHERE id = p_booking_id;
    END IF;
  END IF;
  
  -- Préparer le résultat
  result := json_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'status', 'rejected',
    'rejected_at', now(),
    'refund_processed', COALESCE((refund_result ->> 'success')::boolean, false),
    'refund_details', refund_result,
    'equipment_title', booking_data.equipment_title
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'booking_id', p_booking_id
    );
    RETURN result;
END;
$$;

-- 7. Recréer la fonction create_booking_notification
CREATE OR REPLACE FUNCTION public.create_booking_notification(
  p_user_id UUID,
  p_booking_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Vérifier que l'utilisateur existe
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Utilisateur non trouvé: %', p_user_id;
  END IF;
  
  -- Vérifier que la réservation existe
  IF NOT EXISTS (SELECT 1 FROM public.bookings WHERE id = p_booking_id) THEN
    RAISE EXCEPTION 'Réservation non trouvée: %', p_booking_id;
  END IF;
  
  -- Créer la notification
  INSERT INTO public.notifications (
    user_id,
    booking_id,
    type,
    title,
    message,
    created_at
  ) VALUES (
    p_user_id,
    p_booking_id,
    p_type,
    p_title,
    p_message,
    now()
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- 8. Fonction utilitaire pour vérifier l'intégrité des fonctions
CREATE OR REPLACE FUNCTION public.check_wallet_functions_integrity()
RETURNS TABLE (
  function_name TEXT,
  status TEXT,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'ensure_user_wallet'::TEXT,
    CASE 
      WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'ensure_user_wallet') 
      THEN 'OK'::TEXT 
      ELSE 'MISSING'::TEXT 
    END,
    'Crée un portefeuille pour un utilisateur'::TEXT
  UNION ALL
  SELECT 
    'create_wallet_transaction_secure'::TEXT,
    CASE 
      WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_wallet_transaction_secure') 
      THEN 'OK'::TEXT 
      ELSE 'MISSING'::TEXT 
    END,
    'Crée une transaction sécurisée'::TEXT
  UNION ALL
  SELECT 
    'approve_booking_automatically'::TEXT,
    CASE 
      WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'approve_booking_automatically') 
      THEN 'OK'::TEXT 
      ELSE 'MISSING'::TEXT 
    END,
    'Approuve automatiquement une réservation'::TEXT
  UNION ALL
  SELECT 
    'reject_booking_with_refund'::TEXT,
    CASE 
      WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'reject_booking_with_refund') 
      THEN 'OK'::TEXT 
      ELSE 'MISSING'::TEXT 
    END,
    'Rejette une réservation avec remboursement'::TEXT;
END;
$$;

-- 9. Vérification finale
DO $$
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN 
    SELECT * FROM public.check_wallet_functions_integrity()
  LOOP
    RAISE NOTICE 'Fonction %: % - %', func_record.function_name, func_record.status, func_record.details;
  END LOOP;
  
  RAISE NOTICE 'Migration des fonctions terminée avec succès';
END $$;