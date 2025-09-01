
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookingStatus, OwnerBooking } from "./types";
import { useToast } from "@/components/ui/use-toast";
import { useTransformers } from "./useTransformers";

// Custom hook for owner bookings
export const useOwnerBookings = () => {
  const { toast } = useToast();
  const { transformToOwnerBookings } = useTransformers();
  
  // Fetch bookings for an owner
  const fetchOwnerBookings = async (ownerId: string): Promise<OwnerBooking[]> => {
    // This fetches bookings where this user is the owner of the equipment
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        equipment:equipment_id(*)
      `)
      .eq("equipment.owner_id", ownerId);
    
    if (error) {
      console.error("Error fetching owner bookings:", error);
      throw error;
    }

    // Fetch renter profiles for each booking
    const bookingsWithRenters = await Promise.all(
      (data || []).map(async (booking) => {
        const { data: renterData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", booking.renter_id)
          .single();
        
        return {
          ...booking,
          renter: renterData || null
        };
      })
    );

    return transformToOwnerBookings(bookingsWithRenters || []);
  };

  // Update booking status (approve or reject)
  const updateBookingStatus = async ({ 
    bookingId, 
    status 
  }: { 
    bookingId: string; 
    status: BookingStatus 
  }) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", bookingId);
    
    if (error) {
      console.error("Error updating booking status:", error);
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
    
    return { success: true };
  };
  
  // Query for fetching owner bookings
  const useOwnerBookingsQuery = (ownerId: string) => useQuery({
    queryKey: ["ownerBookings", ownerId],
    queryFn: () => fetchOwnerBookings(ownerId),
    enabled: !!ownerId,
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
