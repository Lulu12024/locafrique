
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";
import { EquipmentData, ProfileData } from '@/types/supabase';
import { useAuth } from '@/hooks/auth';

export function useEquipmentDetail() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Function to fetch equipment detail by ID with optimized query
  const fetchEquipmentById = async (id: string): Promise<{ equipment: EquipmentData | null, owner: ProfileData | null }> => {
    try {
      setIsLoading(true);
      
      console.log("🔍 Récupération de l'équipement:", id);
      
      // Validate UUID format to prevent database errors
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!id || !uuidRegex.test(id)) {
        console.error("⚠️ Format UUID invalide:", id);
        return { equipment: null, owner: null };
      }
      
      // Single query to get equipment with owner data
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipments')
        .select(`
          *,
          images:equipment_images (*),
          owner:profiles!equipments_owner_id_fkey (
            id,
            first_name,
            last_name,
            avatar_url,
            city,
            country,
            phone_number,
            created_at,
            user_type
          )
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (equipmentError) {
        console.error("❌ Erreur lors de la récupération:", equipmentError);
        throw equipmentError;
      }
      
      if (!equipmentData) {
        console.error("❌ Équipement non trouvé pour l'ID:", id);
        return { equipment: null, owner: null };
      }
      
      console.log("✅ Équipement récupéré:", equipmentData.title);
      
      // Transform data to match expected types
      const transformedEquipment: EquipmentData = {
        ...equipmentData,
        images: Array.isArray(equipmentData.images) ? equipmentData.images : [],
        owner: equipmentData.owner ? {
          ...equipmentData.owner,
          user_type: equipmentData.owner.user_type || 'proprietaire'
        } as ProfileData : undefined
      };
      
      const owner = equipmentData.owner ? {
        ...equipmentData.owner,
        user_type: equipmentData.owner.user_type || 'proprietaire'
      } as ProfileData : null;
      
      return { 
        equipment: transformedEquipment, 
        owner: owner
      };
      
    } catch (error: any) {
      console.error("❌ Erreur dans fetchEquipmentById:", error);
      
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les détails de l'équipement. Veuillez réessayer.",
        variant: "destructive",
      });
      
      return { equipment: null, owner: null };
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create a booking for an equipment
  const createBooking = async (
    equipmentId: string,
    startDate: Date,
    endDate: Date,
    totalPrice: number,
    depositAmount: number
  ) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour effectuer une réservation.",
        variant: "destructive",
      });
      return { success: false, error: "Utilisateur non connecté" };
    }
    
    try {
      console.log("📝 Création de réservation:", { equipmentId, startDate, endDate });
      
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          equipment_id: equipmentId,
          renter_id: user.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          total_price: totalPrice,
          deposit_amount: depositAmount,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) {
        console.error("❌ Erreur création réservation:", error);
        throw error;
      }
      
      console.log("✅ Réservation créée:", data);
      
      toast({
        title: "Demande envoyée",
        description: "Votre demande de réservation a été envoyée avec succès.",
      });
      
      return { success: true, data };
    } catch (error: any) {
      console.error("❌ Erreur lors de la création de la réservation:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la réservation: " + error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  return {
    fetchEquipmentById,
    createBooking,
    isLoading
  };
}
