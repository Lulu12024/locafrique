
export * from "./types";
export * from "./useOwnerBookings";
export * from "./useRenterBookings";
export * from "./useTransformers";

// Create a unified useBookings hook for Dashboard.tsx compatibility
export const useBookings = () => {
  const { fetchOwnerBookings, updateBookingStatus } = require('./useOwnerBookings').useOwnerBookings();
  const { fetchRenterBookings, cancelBooking } = require('./useRenterBookings').useRenterBookings();

  // Fetch all bookings for a user (both as renter and owner)
  const fetchUserBookings = async (userId: string) => {
    if (!userId) {
      throw new Error("User ID is required");
    }
    
    try {
      const [renterBookings, ownerBookings] = await Promise.all([
        fetchRenterBookings(userId),
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
    fetchUserBookings,
    fetchOwnerBookings,
    fetchRenterBookings,
    cancelBooking,
    updateBookingStatus,
  };
};
