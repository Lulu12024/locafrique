
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";

export const uploadEquipmentImage = async (
  file: File, 
  userId: string,
  equipmentId: string,
  isPrimary: boolean = false
): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${userId}/${equipmentId}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('equipment_images')
      .upload(filePath, file);

    if (error) {
      console.error('Erreur lors du téléversement de l\'image:', error);
      throw error;
    }
    
    // Get public URL for the file
    const { data: { publicUrl } } = supabase.storage
      .from('equipment_images')
      .getPublicUrl(filePath);
    
    // Save reference in equipment_images table
    const { error: dbError } = await supabase
      .from('equipment_images')
      .insert({
        equipment_id: equipmentId,
        image_url: publicUrl,
        is_primary: isPrimary
      });
      
    if (dbError) {
      console.error('Erreur lors de l\'enregistrement de l\'image dans la base de données:', dbError);
      throw dbError;
    }
    
    return publicUrl;
  } catch (error) {
    console.error('Erreur lors du téléversement de l\'image:', error);
    toast({
      title: "Erreur",
      description: "Impossible de téléverser l'image.",
      variant: "destructive",
    });
    return null;
  }
};

export const uploadIdDocument = async (
  file: File, 
  userId: string
): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `id_document.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('id_documents')
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.error('Erreur lors du téléversement du document:', error);
      throw error;
    }
    
    // Get URL for the file (not public since it's sensitive)
    const { data: { publicUrl } } = supabase.storage
      .from('id_documents')
      .getPublicUrl(filePath);
    
    return publicUrl;
  } catch (error) {
    console.error('Erreur lors du téléversement du document:', error);
    toast({
      title: "Erreur",
      description: "Impossible de téléverser le document d'identité.",
      variant: "destructive",
    });
    return null;
  }
};
