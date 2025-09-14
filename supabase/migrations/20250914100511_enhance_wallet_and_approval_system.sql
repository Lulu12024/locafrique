
-- 1. Améliorer la table bookings pour le système d'approbation
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card' CHECK (payment_method IN ('wallet', 'card', 'kakiapay')),
ADD COLUMN IF NOT EXISTS owner_approval BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS identity_document_url TEXT,
ADD COLUMN IF NOT EXISTS contract_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS wallet_transaction_id UUID REFERENCES public.wallet_transactions(id);

-- 2. Améliorer la table wallet_transactions
ALTER TABLE public.wallet_transactions 
ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id);

-- 3. Créer la table email_logs
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  recipients TEXT[] NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  errors TEXT[],
  sent_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Créer la table payment_tokens pour KakiaPay/Stripe
CREATE TABLE IF NOT EXISTS public.payment_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('stripe', 'kakiapay')),
  token TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_bookings_payment_method ON public.bookings(payment_method);
CREATE INDEX IF NOT EXISTS idx_bookings_owner_approval ON public.bookings(owner_approval);
CREATE INDEX IF NOT EXISTS idx_bookings_approved_at ON public.bookings(approved_at);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_booking_id ON public.wallet_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_booking_id ON public.email_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON public.email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_payment_tokens_user_platform ON public.payment_tokens(user_id, platform);

-- 6. Fonction améliorée pour créer une transaction de portefeuille avec vérification de solde
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
  -- Vérifier que le portefeuille existe et appartient à l'utilisateur
  SELECT balance, user_id INTO current_balance, wallet_user_id
  FROM public.wallets 
  WHERE id = p_wallet_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Portefeuille non trouvé';
  END IF;
  
  -- Vérifier l'autorisation (utilisateur connecté = propriétaire du portefeuille)
  IF wallet_user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Accès non autorisé à ce portefeuille';
  END IF;
  
  -- Calculer le nouveau solde
  IF p_transaction_type = 'credit' OR p_transaction_type = 'refund' THEN
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
    'transaction_id', transaction_id,
    'previous_balance', current_balance,
    'new_balance', new_balance,
    'amount', p_amount,
    'transaction_type', p_transaction_type,
    'success', true
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, retourner les détails
    result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'current_balance', current_balance
    );
    RETURN result;
END;
$$;

-- 7. Fonction pour s'assurer qu'un utilisateur a un portefeuille
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
  END IF;
  
  RETURN wallet_id;
END;
$$;

-- 8. Fonction pour approuver automatiquement une réservation
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
  SELECT b.*, e.owner_id
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
    'booking_id', p_booking_id,
    'status', 'approved',
    'approved_at', now(),
    'success', true
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN result;
END;
$$;

-- 9. Fonction pour refuser une réservation avec remboursement automatique
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
  SELECT b.*, e.owner_id
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
        format('Remboursement - Réservation refusée: %s', booking_data.id),
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
    'booking_id', p_booking_id,
    'status', 'rejected',
    'rejected_at', now(),
    'refund_processed', (refund_result ->> 'success')::boolean,
    'refund_details', refund_result,
    'success', true
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN result;
END;
$$;

-- 10. Mettre à jour les policies de sécurité

-- Email logs policies
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email logs" ON public.email_logs
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE renter_id = auth.uid() OR 
            equipment_id IN (
              SELECT id FROM public.equipments WHERE owner_id = auth.uid()
            )
    )
  );

-- Payment tokens policies
ALTER TABLE public.payment_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own payment tokens" ON public.payment_tokens
  FOR ALL USING (user_id = auth.uid());

-- Améliorer les policies des wallet_transactions
DROP POLICY IF EXISTS "Users can create their own wallet transactions" ON public.wallet_transactions;

CREATE POLICY "Users can view their own wallet transactions" ON public.wallet_transactions
  FOR SELECT USING (
    wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid())
  );

CREATE POLICY "System can create wallet transactions" ON public.wallet_transactions
  FOR INSERT WITH CHECK (
    wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid())
  );

-- 11. Triggers pour les timestamps
CREATE TRIGGER update_payment_tokens_updated_at
    BEFORE UPDATE ON public.payment_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Contraintes supplémentaires
ALTER TABLE public.bookings 
ADD CONSTRAINT check_approval_consistency 
  CHECK (
    (status = 'approved' AND owner_approval = true AND approved_at IS NOT NULL) OR
    (status = 'rejected' AND owner_approval = false AND rejected_at IS NOT NULL) OR
    (status NOT IN ('approved', 'rejected'))
  );

-- 13. Vues utiles pour les statistiques

-- Vue pour les statistiques de portefeuille
CREATE OR REPLACE VIEW public.wallet_stats AS
SELECT 
  w.user_id,
  w.balance,
  COUNT(wt.id) as transaction_count,
  SUM(CASE WHEN wt.transaction_type = 'credit' THEN wt.amount ELSE 0 END) as total_credits,
  SUM(CASE WHEN wt.transaction_type = 'debit' THEN ABS(wt.amount) ELSE 0 END) as total_debits,
  MAX(wt.created_at) as last_transaction_date
FROM public.wallets w
LEFT JOIN public.wallet_transactions wt ON w.id = wt.wallet_id
GROUP BY w.user_id, w.balance;

-- Vue pour les statistiques de réservations par propriétaire
CREATE OR REPLACE VIEW public.owner_booking_stats AS
SELECT 
  e.owner_id,
  COUNT(b.id) as total_bookings,
  COUNT(CASE WHEN b.status = 'pending' THEN 1 END) as pending_bookings,
  COUNT(CASE WHEN b.status = 'approved' THEN 1 END) as approved_bookings,
  COUNT(CASE WHEN b.status = 'rejected' THEN 1 END) as rejected_bookings,
  SUM(CASE WHEN b.status = 'approved' THEN b.total_price ELSE 0 END) as total_revenue,
  AVG(CASE WHEN b.approved_at IS NOT NULL AND b.created_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (b.approved_at - b.created_at))/3600 
      ELSE NULL END) as avg_approval_time_hours
FROM public.equipments e
LEFT JOIN public.bookings b ON e.id = b.equipment_id
GROUP BY e.owner_id;

-- 14. Fonctions d'assistance pour les notifications

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
  INSERT INTO public.notifications (
    user_id,
    booking_id,
    type,
    title,
    message
  ) VALUES (
    p_user_id,
    p_booking_id,
    p_type,
    p_title,
    p_message
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;