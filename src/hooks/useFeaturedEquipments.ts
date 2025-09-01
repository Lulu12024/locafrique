
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";
import { EquipmentData } from '@/types/supabase';

export function useFeaturedEquipments() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch featured equipments for homepage
  const fetchFeaturedEquipments = async (): Promise<EquipmentData[]> => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("🏠 Récupération des équipements en vedette...");
      
      const { data, error } = await supabase
        .from('equipments')
        .select(`
          *,
          images:equipment_images (*),
          owner:profiles!equipments_owner_id_fkey (
            id,
            first_name,
            last_name,
            avatar_url,
            city
          )
        `)
        .eq('status', 'disponible')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error("❌ Erreur lors de la récupération:", error);
        setError(`Erreur base de données: ${error.message}`);
        throw error;
      }
      
      console.log("✅ Données brutes récupérées:", data);
      
      if (!data || data.length === 0) {
        console.log("ℹ️ Aucun équipement disponible");
        return [];
      }
      
      // Transform data to match EquipmentData type with proper image handling
      const equipments = data.map(equipment => {
        console.log("🔄 Traitement équipement:", equipment.id, equipment.title);
        console.log("📸 Images reçues:", equipment.images);
        
        // Ensure images is always an array and log each image
        const images = Array.isArray(equipment.images) ? equipment.images : [];
        console.log("📷 Images transformées pour", equipment.title, ":", images);
        
        // Log individual image URLs for debugging
        images.forEach((img, index) => {
          console.log(`📷 Image ${index} pour ${equipment.title}:`, img.image_url, "Primary:", img.is_primary);
        });
        
        return {
          ...equipment,
          images: images,
          owner: equipment.owner ? {
            ...equipment.owner,
            user_type: 'proprietaire' as const
          } : undefined
        };
      }) as EquipmentData[];
      
      console.log("✅ Équipements transformés avec images:", equipments);
      setIsLoading(false);
      return equipments;
      
    } catch (error: any) {
      console.error("❌ Erreur lors de la récupération des équipements en vedette:", error);
      setError(error.message || "Erreur inconnue");
      setIsLoading(false);
      
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les équipements en vedette. Veuillez réessayer.",
        variant: "destructive",
      });
      return [];
    }
  };

  return {
    fetchFeaturedEquipments,
    isLoading,
    error
  };
}
