
-- Ajouter des colonnes pour gérer le système de commission des évaluations
ALTER TABLE public.equipment_reviews 
ADD COLUMN status TEXT DEFAULT 'published',
ADD COLUMN commission_due DECIMAL(10,2) DEFAULT 0,
ADD COLUMN commission_paid BOOLEAN DEFAULT false,
ADD COLUMN commission_paid_at TIMESTAMP WITH TIME ZONE;

-- Ajouter des contraintes pour le status
ALTER TABLE public.equipment_reviews 
ADD CONSTRAINT check_review_status 
CHECK (status IN ('published', 'pending_payment', 'hidden'));

-- Créer une table pour tracker les commissions dues
CREATE TABLE public.review_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.equipment_reviews(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'waived')),
  due_date TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(review_id)
);

-- Activer RLS sur la table des commissions
ALTER TABLE public.review_commissions ENABLE ROW LEVEL SECURITY;

-- Politique pour que les propriétaires voient leurs commissions
CREATE POLICY "Owners can view their commissions" 
  ON public.review_commissions 
  FOR SELECT 
  USING (owner_id = auth.uid());

-- Politique pour que les propriétaires mettent à jour leurs commissions
CREATE POLICY "Owners can update their commissions" 
  ON public.review_commissions 
  FOR UPDATE 
  USING (owner_id = auth.uid());

-- Fonction pour calculer et gérer la commission lors de création d'avis
CREATE OR REPLACE FUNCTION handle_review_commission()
RETURNS TRIGGER AS $$
DECLARE
  equipment_owner_id UUID;
  commission_amount DECIMAL(10,2);
BEGIN
  -- Récupérer l'ID du propriétaire de l'équipement
  SELECT owner_id INTO equipment_owner_id
  FROM equipments 
  WHERE id = NEW.equipment_id;
  
  -- Si l'évaluation est >= 4 étoiles, créer une commission
  IF NEW.rating >= 4 THEN
    -- Calculer 10% du prix journalier de l'équipement
    SELECT daily_price * 0.10 INTO commission_amount
    FROM equipments 
    WHERE id = NEW.equipment_id;
    
    -- Mettre le statut en attente de paiement
    NEW.status = 'pending_payment';
    NEW.commission_due = commission_amount;
    
    -- Créer l'enregistrement de commission
    INSERT INTO public.review_commissions (
      review_id, 
      owner_id, 
      amount
    ) VALUES (
      NEW.id, 
      equipment_owner_id, 
      commission_amount
    );
    
    -- Créer une notification pour le propriétaire
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message
    ) VALUES (
      equipment_owner_id,
      'commission_due',
      'Commission due pour évaluation positive',
      'Vous avez reçu une évaluation de ' || NEW.rating || ' étoiles. Une commission de ' || commission_amount || ' FCFA est due pour publier cet avis.'
    );
    
  ELSE
    -- Si moins de 4 étoiles, publier directement mais noter la commission due
    NEW.status = 'published';
    
    -- Calculer la commission pour information
    SELECT daily_price * 0.10 INTO commission_amount
    FROM equipments 
    WHERE id = NEW.equipment_id;
    
    NEW.commission_due = commission_amount;
    
    -- Créer l'enregistrement de commission pour suivi
    INSERT INTO public.review_commissions (
      review_id, 
      owner_id, 
      amount,
      status
    ) VALUES (
      NEW.id, 
      equipment_owner_id, 
      commission_amount,
      'pending'
    );
    
    -- Notification pour rappel de commission
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message
    ) VALUES (
      equipment_owner_id,
      'commission_reminder',
      'Commission à régler',
      'Évaluation de ' || NEW.rating || ' étoiles reçue. Commission de ' || commission_amount || ' FCFA à régler pour régularisation.'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
CREATE TRIGGER review_commission_trigger
  BEFORE INSERT ON public.equipment_reviews
  FOR EACH ROW
  EXECUTE FUNCTION handle_review_commission();

-- Modifier la politique de sélection des avis pour ne montrer que les avis publiés publiquement
DROP POLICY IF EXISTS "Everyone can view equipment reviews" ON public.equipment_reviews;

CREATE POLICY "Everyone can view published equipment reviews" 
  ON public.equipment_reviews 
  FOR SELECT 
  USING (status = 'published');

-- Politique pour que les propriétaires voient tous leurs avis (même en attente)
CREATE POLICY "Owners can view all reviews of their equipment" 
  ON public.equipment_reviews 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM equipments 
    WHERE equipments.id = equipment_reviews.equipment_id 
    AND equipments.owner_id = auth.uid()
  ));
