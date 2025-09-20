-- Migration pour configurer le bucket de stockage equipment_images

-- 1. Créer le bucket s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('equipment_images', 'equipment_images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Supprimer toutes les politiques existantes sur le bucket
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;
DROP POLICY IF EXISTS "Equipment images uploads" ON storage.objects;
DROP POLICY IF EXISTS "Equipment images view" ON storage.objects;
DROP POLICY IF EXISTS "Equipment images delete" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload equipment images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view equipment images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete equipment images" ON storage.objects;

-- 3. 🎯 POLITIQUE PERMISSIVE : Tout utilisateur authentifié peut uploader
CREATE POLICY "Authenticated users can upload equipment images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'equipment_images' 
  AND auth.uid() IS NOT NULL
);

-- 4. Politique pour que tout le monde puisse voir les images
CREATE POLICY "Anyone can view equipment images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'equipment_images');

-- 5. Politique pour que les utilisateurs authentifiés puissent supprimer
CREATE POLICY "Authenticated users can delete equipment images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'equipment_images' 
  AND auth.uid() IS NOT NULL
);

-- 6. Politique pour que les utilisateurs authentifiés puissent mettre à jour
CREATE POLICY "Authenticated users can update equipment images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'equipment_images' 
  AND auth.uid() IS NOT NULL
);