
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";
import { EquipmentData } from '@/types/supabase';
import { useAuth } from '@/hooks/auth';

export function useEquipments() {
  const { user } = useAuth();

  // Fonction pour récupérer les matériels de l'utilisateur (propriétaire)
  const fetchUserEquipments = async (): Promise<EquipmentData[]> => {
    if (!user) {
      console.log("❌ Aucun utilisateur connecté");
      return [];
    }
    
    try {
      console.log("🔍 Récupération des équipements pour l'utilisateur:", user.id);
      
      const { data, error } = await supabase
        .from('equipments')
        .select(`
          *,
          images:equipment_images (*),
          owner:profiles!equipments_owner_id_fkey (*)
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("❌ Erreur lors de la récupération des équipements:", error);
        throw error;
      }
      
      console.log("✅ Équipements récupérés:", data?.length || 0, data);
      
      const equipments = data as EquipmentData[];
      
      // Récupérer le nombre de réservations pour chaque équipement
      if (equipments && equipments.length > 0) {
        for (const equipment of equipments) {
          const { count, error: countError } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('equipment_id', equipment.id);
            
          if (!countError) {
            equipment.booking_count = count || 0;
          }
        }
      }
      
      return equipments || [];
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des matériels:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos matériels.",
        variant: "destructive",
      });
      return [];
    }
  };

  // Fonction pour ajouter un nouveau matériel
  const addEquipment = async (equipmentData: Omit<EquipmentData, 'id' | 'owner_id' | 'created_at' | 'updated_at' | 'images'>): Promise<{ success: boolean, data?: EquipmentData, error?: any }> => {
    if (!user) {
      console.error("❌ Utilisateur non connecté");
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour ajouter un équipement.",
        variant: "destructive",
      });
      return { success: false, error: "Utilisateur non connecté" };
    }
    
    try {
      console.log("📝 Début de l'ajout d'équipement:", equipmentData);
      console.log("👤 Utilisateur connecté:", user.id);
      
      // Validation des données requises
      if (!equipmentData.title || !equipmentData.description || !equipmentData.daily_price || !equipmentData.category) {
        const missingFields = [];
        if (!equipmentData.title) missingFields.push("titre");
        if (!equipmentData.description) missingFields.push("description");
        if (!equipmentData.daily_price) missingFields.push("prix journalier");
        if (!equipmentData.category) missingFields.push("catégorie");
        
        const errorMsg = `Champs manquants: ${missingFields.join(", ")}`;
        console.error("❌ Validation échouée:", errorMsg);
        
        toast({
          title: "Données manquantes",
          description: errorMsg,
          variant: "destructive",
        });
        return { success: false, error: errorMsg };
      }
      
      // Préparer les données pour l'insertion
      const insertData = {
        title: equipmentData.title.trim(),
        description: equipmentData.description.trim(),
        daily_price: Number(equipmentData.daily_price),
        deposit_amount: Number(equipmentData.deposit_amount),
        category: equipmentData.category,
        subcategory: equipmentData.subcategory || null,
        condition: equipmentData.condition || null,
        brand: equipmentData.brand || null,
        year: equipmentData.year || null,
        location: equipmentData.location?.trim() || '',
        city: equipmentData.city || 'Cotonou',
        country: equipmentData.country || 'Bénin',
        status: 'disponible',
        owner_id: user.id
      };
      
      console.log("📦 Données préparées pour insertion:", insertData);
      
      const { data, error } = await supabase
        .from('equipments')
        .insert(insertData)
        .select(`
          *,
          images:equipment_images(*)
        `)
        .single();
      
      if (error) {
        console.error("❌ Erreur lors de l'insertion:", error);
        
        // Messages d'erreur plus spécifiques
        let errorMessage = "Impossible d'ajouter l'équipement.";
        if (error.code === '23505') {
          errorMessage = "Un équipement avec ce nom existe déjà.";
        } else if (error.code === '23502') {
          errorMessage = "Certaines informations obligatoires sont manquantes.";
        } else if (error.message) {
          errorMessage = `Erreur: ${error.message}`;
        }
        
        toast({
          title: "Erreur d'ajout",
          description: errorMessage,
          variant: "destructive",
        });
        
        return { success: false, error };
      }
      
      console.log("✅ Équipement ajouté avec succès:", data);
      
      toast({
        title: "Matériel ajouté",
        description: "Votre matériel a été ajouté avec succès.",
      });
      
      // Convert to EquipmentData with proper images array
      const equipmentWithImages = {
        ...data,
        images: data.images || []
      } as EquipmentData;
      
      return { success: true, data: equipmentWithImages };
    } catch (error) {
      console.error("❌ Erreur complète lors de l'ajout:", error);
      
      let errorMessage = "Une erreur inattendue s'est produite.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur",
        description: `Impossible d'ajouter le matériel: ${errorMessage}`,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  // Fonction pour mettre à jour un matériel existant
  const updateEquipment = async (id: string, equipmentData: Partial<EquipmentData>): Promise<{success: boolean; error?: any}> => {
    if (!user) return { success: false, error: "Utilisateur non connecté" };
    
    try {
      const { error } = await supabase
        .from('equipments')
        .update(equipmentData)
        .eq('id', id)
        .eq('owner_id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Matériel mis à jour",
        description: "Les informations du matériel ont été mises à jour avec succès.",
      });
      
      return { success: true };
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le matériel: " + (error as Error).message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  // Fonction pour supprimer un matériel
  const deleteEquipment = async (id: string): Promise<{success: boolean; error?: any}> => {
    if (!user) return { success: false, error: "Utilisateur non connecté" };
    
    try {
      // Supprimer d'abord les images associées dans storage
      const { data: imagesData, error: imagesError } = await supabase
        .from('equipment_images')
        .select('image_url')
        .eq('equipment_id', id);
      
      if (imagesError) {
        console.error("Erreur lors de la récupération des images:", imagesError);
      } else if (imagesData) {
        // Extraire les chemins d'accès aux fichiers à partir des URL publiques
        const fileUrls = imagesData.map(img => {
          const url = new URL(img.image_url);
          const path = decodeURIComponent(url.pathname).replace(/^\/storage\/v1\/object\/public\/equipment_images\//, '');
          return path;
        });
        
        // Supprimer les fichiers du bucket
        if (fileUrls.length > 0) {
          const { error: deleteStorageError } = await supabase.storage
            .from('equipment_images')
            .remove(fileUrls);
            
          if (deleteStorageError) {
            console.error("Erreur lors de la suppression des images:", deleteStorageError);
          }
        }
      }
      
      // Supprimer le matériel (les références dans equipment_images seront supprimées par cascade)
      const { error } = await supabase
        .from('equipments')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Matériel supprimé",
        description: "Le matériel a été supprimé avec succès.",
      });
      
      return { success: true };
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le matériel: " + (error as Error).message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };
  
  return {
    fetchUserEquipments,
    addEquipment,
    updateEquipment,
    deleteEquipment
  };
}
