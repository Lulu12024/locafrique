
import { supabase } from '@/integrations/supabase/client';

export const checkStorageSetup = async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log("🔍 Vérification de la configuration du stockage...");
    
    // Vérifier si le bucket existe
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("❌ Erreur lors de la récupération des buckets:", bucketsError);
      return { success: false, message: "Impossible de vérifier les buckets de stockage" };
    }
    
    console.log("📦 Buckets disponibles:", buckets?.map(b => b.name));
    
    const equipmentImagesBucket = buckets?.find(bucket => bucket.name === 'equipment_images');
    
    if (!equipmentImagesBucket) {
      console.warn("⚠️ Le bucket 'equipment_images' n'existe pas");
      return { success: false, message: "Le bucket de stockage des images n'est pas configuré" };
    }
    
    console.log("✅ Bucket 'equipment_images' trouvé:", equipmentImagesBucket);
    
    // Tester l'upload avec un fichier de test
    try {
      const testFile = new Blob(['test'], { type: 'text/plain' });
      const testPath = `test/${Date.now()}.txt`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('equipment_images')
        .upload(testPath, testFile);
        
      if (uploadError) {
        console.error("❌ Erreur lors du test d'upload:", uploadError);
        return { success: false, message: `Erreur de test d'upload: ${uploadError.message}` };
      }
      
      console.log("✅ Test d'upload réussi:", uploadData);
      
      // Nettoyer le fichier de test
      await supabase.storage
        .from('equipment_images')
        .remove([testPath]);
        
      return { success: true, message: "Configuration du stockage vérifiée avec succès" };
    } catch (testError) {
      console.error("❌ Erreur lors du test de stockage:", testError);
      return { success: false, message: "Erreur lors du test de stockage" };
    }
  } catch (error) {
    console.error("❌ Erreur lors de la vérification du stockage:", error);
    return { success: false, message: "Erreur de vérification du stockage" };
  }
};
