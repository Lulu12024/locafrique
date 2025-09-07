import { useAuth } from "@/hooks/auth";
import { useRenterBookings } from "./bookings/useRenterBookings";
import { useOwnerBookings } from "./bookings/useOwnerBookings";

export const useBookings = () => {
  const { user } = useAuth();
  
  // ✅ Utilisation correcte des hooks sans paramètres
  const renterBookingsHook = useRenterBookings();
  const ownerBookingsHook = useOwnerBookings();

  // Fetch all bookings for a user (both as renter and owner)
  const fetchUserBookings = async (userId: string) => {
    if (!userId) {
      throw new Error("User ID is required");
    }
    
    try {
      const [renterBookings, ownerBookings] = await Promise.all([
        renterBookingsHook.fetchRenterBookings(userId),
        ownerBookingsHook.fetchOwnerBookings(userId)
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
    fetchOwnerBookings: ownerBookingsHook.fetchOwnerBookings,
    fetchUserBookings,
    
    // Booking actions
    cancelBooking: renterBookingsHook.cancelBooking,
    updateBookingStatus: ownerBookingsHook.updateBookingStatus,
    
    // Queries (pour compatibilité)
    useRenterBookingsQuery: renterBookingsHook.useRenterBookingsQuery,
    useOwnerBookingsQuery: ownerBookingsHook.useOwnerBookingsQuery,
    
    // Mutations (pour compatibilité)
    useCancelBookingMutation: renterBookingsHook.useCancelBookingMutation,
    useUpdateBookingStatusMutation: ownerBookingsHook.useUpdateBookingStatusMutation,
  };
};