import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookingStatus, RenterBooking } from "./types";
import { useToast } from "@/components/ui/use-toast";
import { useTransformers } from "./useTransformers";

// Custom hook for renter bookings - Version simplifiée sans jointures complexes
export const useRenterBookings = () => {
  const { toast } = useToast();
  const { transformToRenterBookings } = useTransformers();
  
  // Fetch bookings for a renter using simple queries
  const fetchRenterBookings = async (renterId: string): Promise<RenterBooking[]> => {
    try {
      console.log('🔍 Fetching renter bookings for:', renterId);
      
      // Étape 1: Récupérer tous les bookings du locataire
      const { data: bookingsData, error: bookingError } = await supabase
        .from("bookings")
        .select("id, equipment_id, renter_id, start_date, end_date, total_price, status, payment_status, created_at, updated_at, contract_url, deposit_amount")
        .eq("renter_id", renterId)
        .order('created_at', { ascending: false });
      
      if (bookingError) {
        console.error("❌ Error fetching renter bookings:", bookingError);
        throw bookingError;
      }

      if (!bookingsData || bookingsData.length === 0) {
        console.log('📭 No bookings found for renter:', renterId);
        return [];
      }

      console.log('📋 Found bookings:', bookingsData.length);

      // Étape 2: Récupérer les équipements associés
      const equipmentIds = [...new Set(bookingsData.map(b => b.equipment_id))];
      const { data: equipmentsData, error: equipmentError } = await supabase
        .from("equipments")
        .select("id, title, description, category, subcategory, daily_price, deposit_amount, owner_id, location, city, country, status, created_at, updated_at")
        .in('id', equipmentIds);
      
      if (equipmentError) {
        console.error("❌ Error fetching equipment:", equipmentError);
        throw equipmentError;
      }

      console.log('🔧 Found equipment:', equipmentsData?.length || 0);

      // Étape 3: Récupérer les profils des propriétaires
      const ownerIds = [...new Set((equipmentsData || []).map(eq => eq.owner_id))];
      const { data: ownersData, error: ownerError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, phone_number, avatar_url, user_type, created_at")
        .in('id', ownerIds);

      if (ownerError) {
        console.error("❌ Error fetching owners:", ownerError);
        // Ne pas faire échouer la requête, continuer sans les profils
      }

      console.log('👥 Found owners:', ownersData?.length || 0);

      // Étape 4: Combiner toutes les données
      const bookingsWithDetails = bookingsData.map(booking => {
        const equipment = equipmentsData?.find(eq => eq.id === booking.equipment_id);
        const owner = equipment ? ownersData?.find(o => o.id === equipment.owner_id) : null;

        return {
          ...booking,
          equipment: equipment ? {
            ...equipment,
            images: [] // Ajouter un tableau vide pour les images
          } : null,
          owner: owner || null
        };
      });

      // Étape 5: Transformer les données
      const transformedBookings = transformToRenterBookings(bookingsWithDetails.filter(b => b.equipment));
      
      console.log('✅ Renter bookings transformed:', transformedBookings.length);
      return transformedBookings;
      
    } catch (error) {
      console.error("❌ Error in fetchRenterBookings:", error);
      throw error;
    }
  };

  // Cancel booking
  const cancelBooking = async (bookingId: string) => {
    try {
      console.log('🔄 Cancelling booking:', bookingId);
      
      const { error } = await supabase
        .from("bookings")
        .update({ status: 'cancelled' })
        .eq("id", bookingId);
      
      if (error) {
        console.error("❌ Error cancelling booking:", error);
        toast({
          title: "Erreur",
          description: "Impossible d'annuler la réservation.",
          variant: "destructive",
        });
        return { success: false };
      }
      
      toast({
        title: "Succès",
        description: "La réservation a été annulée avec succès.",
      });
      
      console.log('✅ Booking cancelled successfully');
      return { success: true };
      
    } catch (error) {
      console.error("❌ Error in cancelBooking:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive",
      });
      return { success: false };
    }
  };
  
  // Query for fetching renter bookings
  const useRenterBookingsQuery = (renterId: string) => useQuery({
    queryKey: ["renterBookings", renterId],
    queryFn: () => fetchRenterBookings(renterId),
    enabled: !!renterId,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Mutation for cancelling booking
  const useCancelBookingMutation = () => useMutation({
    mutationFn: cancelBooking,
  });
  
  return {
    fetchRenterBookings,
    cancelBooking,
    useRenterBookingsQuery,
    useCancelBookingMutation,
  };
};