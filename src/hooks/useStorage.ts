
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";

export function useStorage() {
  const uploadImage = async (
    file: File, 
    equipmentId: string,
    isPrimary: boolean = false
  ): Promise<{ success: boolean; url?: string; error?: any }> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${equipmentId}/${fileName}`;
      
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
      
      return { success: true, url: publicUrl };
    } catch (error) {
      console.error('Erreur lors du téléversement de l\'image:', error);
      toast({
        title: "Erreur",
        description: "Impossible de téléverser l'image.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  return {
    uploadImage
  };
}
