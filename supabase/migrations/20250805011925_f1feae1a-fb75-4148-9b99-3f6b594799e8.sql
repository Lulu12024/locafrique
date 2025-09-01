-- Corriger les problèmes de sécurité (suite) sans les triggers existants

-- 1. Créer des données de test réalistes pour les équipements
INSERT INTO public.profiles (id, first_name, last_name, user_type, phone_number, city, country) VALUES
('00000000-0000-0000-0000-000000000001', 'Jean', 'Martin', 'proprietaire', '+33123456789', 'Paris', 'France'),
('00000000-0000-0000-0000-000000000002', 'Marie', 'Dubois', 'proprietaire', '+33123456790', 'Lyon', 'France'),
('00000000-0000-0000-0000-000000000003', 'Pierre', 'Bernard', 'proprietaire', '+33123456791', 'Marseille', 'France'),
('00000000-0000-0000-0000-000000000004', 'Sophie', 'Leroy', 'locataire', '+33123456792', 'Paris', 'France'),
('00000000-0000-0000-0000-000000000005', 'Thomas', 'Moreau', 'locataire', '+33123456793', 'Lyon', 'France')
ON CONFLICT (id) DO NOTHING;

-- 2. Créer des portefeuilles pour les nouveaux profils
INSERT INTO public.wallets (user_id, balance) VALUES
('00000000-0000-0000-0000-000000000001', 500.00),
('00000000-0000-0000-0000-000000000002', 750.00),
('00000000-0000-0000-0000-000000000003', 300.00),
('00000000-0000-0000-0000-000000000004', 150.00),
('00000000-0000-0000-0000-000000000005', 200.00)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Ajouter des équipements de test réalistes
INSERT INTO public.equipments (
  id,
  title, 
  description, 
  daily_price, 
  deposit_amount, 
  location, 
  city, 
  country, 
  category, 
  subcategory, 
  status, 
  owner_id,
  condition,
  brand,
  year,
  moderation_status
) VALUES
('10000000-0000-0000-0000-000000000001', 'Perceuse Bosch Professional', 'Perceuse sans fil 18V avec 2 batteries et chargeur. Parfait pour travaux de bricolage et construction légère.', 25.00, 100.00, '15 Rue de la Paix', 'Paris', 'France', 'bricolage', 'perceuses', 'disponible', '00000000-0000-0000-0000-000000000001', 'excellent', 'Bosch', 2023, 'approved'),

('10000000-0000-0000-0000-000000000002', 'Tracteur tondeuse Honda', 'Tracteur tondeuse 17CV, coupe 107cm. Idéal pour grands jardins et espaces verts.', 80.00, 500.00, '32 Avenue des Fleurs', 'Lyon', 'France', 'jardinage', 'tondeuses', 'disponible', '00000000-0000-0000-0000-000000000002', 'bon', 'Honda', 2022, 'approved'),

('10000000-0000-0000-0000-000000000003', 'Bétonnière électrique 140L', 'Bétonnière électrique 140L pour travaux de maçonnerie. Moteur 550W.', 35.00, 200.00, '8 Rue du Port', 'Marseille', 'France', 'construction', 'betonniere', 'disponible', '00000000-0000-0000-0000-000000000003', 'bon', 'Altrad', 2021, 'approved'),

('10000000-0000-0000-0000-000000000004', 'Groupe électrogène 3000W', 'Générateur essence 3000W, silencieux. Parfait pour événements extérieurs.', 45.00, 300.00, '45 Boulevard Voltaire', 'Paris', 'France', 'electrique', 'generateurs', 'disponible', '00000000-0000-0000-0000-000000000001', 'excellent', 'Honda', 2023, 'approved'),

('10000000-0000-0000-0000-000000000005', 'Transpalette manuel 2T', 'Transpalette manuel capacité 2 tonnes. Idéal pour manutention en entrepôt.', 20.00, 150.00, '67 Rue Industrielle', 'Lyon', 'France', 'manutention', 'transpalettes', 'disponible', '00000000-0000-0000-0000-000000000002', 'bon', 'Jungheinrich', 2020, 'approved'),

('10000000-0000-0000-0000-000000000006', 'Compresseur d''air 50L', 'Compresseur vertical 50L, 8 bars. Moteur 2CV pour usage intensif.', 30.00, 180.00, '23 Zone Artisanale', 'Marseille', 'France', 'electrique', 'compresseurs', 'disponible', '00000000-0000-0000-0000-000000000003', 'excellent', 'Michelin', 2022, 'approved'),

('10000000-0000-0000-0000-000000000007', 'Tente de réception 6x3m', 'Tente blanche professionnelle 6x3m pour événements. Structure aluminium.', 60.00, 400.00, '15 Avenue des Fêtes', 'Paris', 'France', 'evenementiel', 'tentes', 'disponible', '00000000-0000-0000-0000-000000000001', 'excellent', 'Proloisirs', 2023, 'approved')
ON CONFLICT (id) DO NOTHING;

-- 4. Ajouter des images pour les équipements
INSERT INTO public.equipment_images (equipment_id, image_url, is_primary) VALUES
('10000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500', true),
('10000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500', true),
('10000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500', true),
('10000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=500', true),
('10000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=500', true),
('10000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500', true),
('10000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500', true)
ON CONFLICT DO NOTHING;

-- 5. Ajouter des réservations de test
INSERT INTO public.bookings (
  id,
  equipment_id, 
  renter_id, 
  start_date, 
  end_date, 
  total_price, 
  deposit_amount, 
  status, 
  payment_status
) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', '2024-02-01 09:00:00+00', '2024-02-03 18:00:00+00', 50.00, 100.00, 'confirmed', 'paid'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', '2024-02-05 08:00:00+00', '2024-02-07 19:00:00+00', 160.00, 500.00, 'pending', 'en_attente')
ON CONFLICT (id) DO NOTHING;

-- 6. Mettre à jour les équipements existants avec un statut valide
UPDATE public.equipments 
SET status = 'disponible' 
WHERE status NOT IN ('en_attente', 'disponible', 'loue', 'maintenance', 'retire');

UPDATE public.equipments 
SET moderation_status = 'approved'
WHERE moderation_status = 'pending' AND title IS NOT NULL AND description IS NOT NULL;