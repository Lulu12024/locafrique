
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth";
import { useRenterBookings } from "./bookings/useRenterBookings";
import { useOwnerBookings } from "./bookings/useOwnerBookings";

export const useBookings = () => {
  const { user } = useAuth();
  const renterBookingsHook = useRenterBookings(user?.id);
  const { 
    fetchOwnerBookings, 
    updateBookingStatus 
  } = useOwnerBookings();

  // Fetch all bookings for a user (both as renter and owner)
  const fetchUserBookings = async (userId: string) => {
    if (!userId) {
      throw new Error("User ID is required");
    }
    
    try {
      const [renterBookings, ownerBookings] = await Promise.all([
        renterBookingsHook.fetchRenterBookings(userId),
        fetchOwnerBookings(userId)
      ]);

      return {
        renterBookings,
        ownerBookings
      };
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      return {
        renterBookings: [],
        ownerBookings: []
      };
    }
  };

  return {
    // Booking fetch functions
    fetchRenterBookings: renterBookingsHook.fetchRenterBookings,
    fetchOwnerBookings,
    fetchUserBookings,
    
    // Booking actions
    cancelBooking: renterBookingsHook.cancelBooking,
    updateBookingStatus,
  };
};
