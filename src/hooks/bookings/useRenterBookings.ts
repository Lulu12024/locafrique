
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookingStatus, RenterBooking } from "./types";
import { useToast } from "@/components/ui/use-toast";
import { useTransformers } from "./useTransformers";

export const useRenterBookings = (userId?: string) => {
  const { toast } = useToast();
  const { transformToRenterBookings } = useTransformers();
  
  // Fetch bookings for a renter
  const fetchRenterBookings = async (renterId: string): Promise<RenterBooking[]> => {
    if (!renterId) return [];

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        equipment:equipment_id(*)
      `)
      .eq("renter_id", renterId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching renter bookings:", error);
      throw error;
    }

    // Fetch owner profiles for each booking
    const bookingsWithOwners = await Promise.all(
      (data || []).map(async (booking) => {
        if (!booking.equipment) return booking;
        
        const { data: ownerData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", booking.equipment.owner_id)
          .single();
        
        return {
          ...booking,
          owner: ownerData || null
        };
      })
    );

    return transformToRenterBookings(bookingsWithOwners || []);
  };

  // Cancel a booking
  const cancelBooking = async (bookingId: string): Promise<boolean> => {
    if (!userId) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour annuler une réservation.",
        variant: "destructive",
      });
      return false;
    }

    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId)
      .eq("renter_id", userId);

    if (error) {
      console.error("Error cancelling booking:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler cette réservation.",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Succès",
      description: "La réservation a été annulée.",
    });
    return true;
  };

  // Use React Query for bookings
  const {
    data: bookings = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["renterBookings", userId],
    queryFn: () => userId ? fetchRenterBookings(userId) : Promise.resolve([]),
    enabled: !!userId,
  });

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      refetch();
    },
  });
  
  const useRenterBookingsQuery = (renterId: string) => {
    return useQuery({
      queryKey: ["renterBookings", renterId],
      queryFn: () => fetchRenterBookings(renterId),
      enabled: !!renterId,
    });
  };

  const useCancelBookingMutation = () => {
    return useMutation({
      mutationFn: cancelBooking,
      onSuccess: () => refetch(),
    });
  };
  
  // Export both the hook results and the functions for use in useBookings
  return {
    bookings,
    isLoading,
    isError,
    refetch,
    cancelBooking: cancelBookingMutation.mutate,
    fetchRenterBookings,
    useRenterBookingsQuery,
    useCancelBookingMutation,
  };
};
