-- Première étape : Vérifier si la table equipment_images a RLS activé, sinon l'activer
ALTER TABLE public.equipment_images ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes pour equipment_images
DROP POLICY IF EXISTS "Equipment images are linked to existing equipment" ON public.equipment_images;
DROP POLICY IF EXISTS "Owners can add images to their equipments" ON public.equipment_images;
DROP POLICY IF EXISTS "Owners can view their equipment images" ON public.equipment_images;
DROP POLICY IF EXISTS "Everyone can view approved equipment images" ON public.equipment_images;
DROP POLICY IF EXISTS "Owners can update their equipment images" ON public.equipment_images;
DROP POLICY IF EXISTS "Owners can delete their equipment images" ON public.equipment_images;
DROP POLICY IF EXISTS "Owners can manage their equipment images" ON public.equipment_images;
DROP POLICY IF EXISTS "Public can view approved equipment images" ON public.equipment_images;
DROP POLICY IF EXISTS "Owners can manage images of their equipment" ON public.equipment_images;

-- 🎯 POLITIQUE PERMISSIVE : Tout utilisateur authentifié peut ajouter des images
CREATE POLICY "Authenticated users can add images to any equipment" 
ON public.equipment_images 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.equipments 
    WHERE id = equipment_id
  )
);

-- Politique pour que tout le monde puisse voir toutes les images
CREATE POLICY "Anyone can view equipment images" 
ON public.equipment_images 
FOR SELECT 
USING (true);

-- Politique pour que les propriétaires d'équipements puissent MODIFIER les images de leurs équipements
CREATE POLICY "Owners can update images of their equipment" 
ON public.equipment_images 
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.equipments 
    WHERE id = equipment_id 
    AND owner_id = auth.uid()
  )
);

-- Politique pour que les propriétaires d'équipements puissent SUPPRIMER les images de leurs équipements
CREATE POLICY "Owners can delete images of their equipment" 
ON public.equipment_images 
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.equipments 
    WHERE id = equipment_id 
    AND owner_id = auth.uid()
  )
);