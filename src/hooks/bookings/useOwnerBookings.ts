import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookingStatus, OwnerBooking } from "./types";
import { useToast } from "@/components/ui/use-toast";
import { useTransformers } from "./useTransformers";

// Custom hook for owner bookings - Version simplifiée sans jointures complexes
export const useOwnerBookings = () => {
  const { toast } = useToast();
  const { transformToOwnerBookings } = useTransformers();
  
  // Fetch bookings for an owner using simple queries
  const fetchOwnerBookings = async (ownerId: string): Promise<OwnerBooking[]> => {
    try {
      console.log('🔍 Fetching owner bookings for:', ownerId);
      
      // Étape 1: Récupérer tous les équipements du propriétaire
      const { data: ownerEquipments, error: equipmentError } = await supabase
        .from("equipments")
        .select("id, title, description, category, subcategory, daily_price, deposit_amount, owner_id, location, city, country, status, created_at, updated_at")
        .eq("owner_id", ownerId);
      
      if (equipmentError) {
        console.error("❌ Error fetching owner equipment:", equipmentError);
        throw equipmentError;
      }

      if (!ownerEquipments || ownerEquipments.length === 0) {
        console.log('📭 No equipment found for owner:', ownerId);
        return [];
      }

      const equipmentIds = ownerEquipments.map(eq => eq.id);
      console.log('🔧 Found equipment IDs:', equipmentIds);

      // Étape 2: Récupérer les bookings pour ces équipements
      const { data: bookingsData, error: bookingError } = await supabase
        .from("bookings")
        .select("id, equipment_id, renter_id, start_date, end_date, total_price, status, payment_status, created_at, updated_at, contract_url, deposit_amount")
        .in("equipment_id", equipmentIds)
        .order('created_at', { ascending: false });
      
      if (bookingError) {
        console.error("❌ Error fetching bookings:", bookingError);
        throw bookingError;
      }

      if (!bookingsData || bookingsData.length === 0) {
        console.log('📭 No bookings found for owner equipment');
        return [];
      }

      console.log('📋 Found bookings:', bookingsData.length);

      // Étape 3: Récupérer les profils des locataires
      const renterIds = [...new Set(bookingsData.map(b => b.renter_id))];
      const { data: rentersData, error: renterError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, phone_number, avatar_url, user_type, created_at")
        .in('id', renterIds);

      if (renterError) {
        console.error("❌ Error fetching renters:", renterError);
        // Ne pas faire échouer la requête, continuer sans les profils
      }

      console.log('👥 Found renters:', rentersData?.length || 0);

      // Étape 4: Combiner toutes les données
      const bookingsWithDetails = bookingsData.map(booking => {
        const equipment = ownerEquipments.find(eq => eq.id === booking.equipment_id);
        const renter = rentersData?.find(r => r.id === booking.renter_id);

        return {
          ...booking,
          equipment: equipment ? {
            ...equipment,
            images: [] // Ajouter un tableau vide pour les images
          } : null,
          renter: renter || null
        };
      });

      // Étape 5: Transformer les données
      const transformedBookings = transformToOwnerBookings(bookingsWithDetails.filter(b => b.equipment));
      
      console.log('✅ Owner bookings transformed:', transformedBookings.length);
      return transformedBookings;
      
    } catch (error) {
      console.error("❌ Error in fetchOwnerBookings:", error);
      throw error;
    }
  };

  // Update booking status
  const updateBookingStatus = async ({ 
    bookingId, 
    status 
  }: { 
    bookingId: string; 
    status: BookingStatus 
  }) => {
    try {
      console.log('🔄 Updating booking status:', { bookingId, status });
      
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId);
      
      if (error) {
        console.error("❌ Error updating booking status:", error);
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour le statut de la réservation.",
          variant: "destructive",
        });
        return { success: false };
      }
      
      toast({
        title: "Succès",
        description: `La réservation a été ${status === "approved" ? "approuvée" : "refusée"}.`,
      });
      
      console.log('✅ Booking status updated successfully');
      return { success: true };
      
    } catch (error) {
      console.error("❌ Error in updateBookingStatus:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive",
      });
      return { success: false };
    }
  };
  
  // Query for fetching owner bookings
  const useOwnerBookingsQuery = (ownerId: string) => useQuery({
    queryKey: ["ownerBookings", ownerId],
    queryFn: () => fetchOwnerBookings(ownerId),
    enabled: !!ownerId,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Mutation for updating booking status
  const useUpdateBookingStatusMutation = () => useMutation({
    mutationFn: updateBookingStatus,
  });
  
  return {
    fetchOwnerBookings,
    updateBookingStatus,
    useOwnerBookingsQuery,
    useUpdateBookingStatusMutation,
  };
};