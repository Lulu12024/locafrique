-- Supprimer l'ancienne politique qui ne vérifie que l'existence de l'équipement
DROP POLICY IF EXISTS "Equipment images are linked to existing equipment" ON public.equipment_images;

-- Créer une nouvelle politique qui vérifie que l'utilisateur est le propriétaire de l'équipement
CREATE POLICY "Owners can add images to their equipments" 
ON public.equipment_images 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.equipments 
    WHERE id = equipment_id 
    AND owner_id = auth.uid()
  )
);

-- Politique pour que les propriétaires puissent voir les images de leurs équipements
CREATE POLICY "Owners can view their equipment images" 
ON public.equipment_images 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.equipments 
    WHERE id = equipment_id 
    AND owner_id = auth.uid()
  )
);

-- Politique pour que tout le monde puisse voir les images des équipements approuvés
CREATE POLICY "Everyone can view approved equipment images" 
ON public.equipment_images 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.equipments 
    WHERE id = equipment_id 
    AND moderation_status = 'approved'
  )
);

-- Politique pour que les propriétaires puissent mettre à jour leurs images
CREATE POLICY "Owners can update their equipment images" 
ON public.equipment_images 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.equipments 
    WHERE id = equipment_id 
    AND owner_id = auth.uid()
  )
);

-- Politique pour que les propriétaires puissent supprimer leurs images
CREATE POLICY "Owners can delete their equipment images" 
ON public.equipment_images 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.equipments 
    WHERE id = equipment_id 
    AND owner_id = auth.uid()
  )
);