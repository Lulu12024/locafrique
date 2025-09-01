
import { BookingStatus, EquipmentData, OwnerBooking, OwnerData, RenterBooking, normalizeBookingStatus } from "./types";

export const useTransformers = () => {
  /**
   * Transform raw booking data from the API to RenterBooking type
   */
  const transformToRenterBookings = (data: any[]): RenterBooking[] => {
    if (!data || data.length === 0) return [];

    return data.map((booking) => {
      // Ensure equipment data is properly structured
      const equipment: EquipmentData = booking.equipment ? {
        id: booking.equipment.id,
        title: booking.equipment.title,
        description: booking.equipment.description,
        category: booking.equipment.category,
        subcategory: booking.equipment.subcategory || '',
        daily_price: booking.equipment.daily_price,
        deposit_amount: booking.equipment.deposit_amount,
        owner_id: booking.equipment.owner_id,
        location: booking.equipment.location,
        city: booking.equipment.city || '',
        country: booking.equipment.country || '',
        status: booking.equipment.status,
        created_at: booking.equipment.created_at,
        updated_at: booking.equipment.updated_at,
        images: booking.equipment.images || { error: true, message: "No images available" }
      } : {
        id: '',
        title: 'Équipement indisponible',
        description: '',
        category: '',
        subcategory: '',
        daily_price: 0,
        deposit_amount: 0,
        owner_id: '',
        location: '',
        city: '',
        country: '',
        status: 'indisponible',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        images: { error: true, message: "No images available" }
      };

      // Owner data transformation
      const owner: OwnerData = booking.owner ? {
        id: booking.owner.id || '',
        email: booking.owner.email,
        first_name: booking.owner.first_name,
        last_name: booking.owner.last_name,
        phone_number: booking.owner.phone_number,
        avatar_url: booking.owner.avatar_url,
        created_at: booking.owner.created_at || new Date().toISOString(),
        user_type: booking.owner.user_type || 'proprietaire'
      } : {
        id: '',
        created_at: new Date().toISOString()
      };

      // Create properly typed RenterBooking object
      const renterBooking: RenterBooking = {
        id: booking.id,
        equipment_id: booking.equipment_id,
        owner_id: equipment.owner_id,
        renter_id: booking.renter_id,
        start_date: booking.start_date,
        end_date: booking.end_date,
        total_amount: booking.total_price || 0,
        total_price: booking.total_price || 0,
        status: normalizeBookingStatus(booking.status || 'pending'),
        payment_status: booking.payment_status,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
        contract_url: booking.contract_url,
        deposit_amount: booking.deposit_amount,
        equipment,
        owner
      };

      return renterBooking;
    });
  };

  /**
   * Transform raw booking data from the API to OwnerBooking type
   */
  const transformToOwnerBookings = (data: any[]): OwnerBooking[] => {
    if (!data || data.length === 0) return [];

    return data.map((booking) => {
      // Ensure equipment data is properly structured
      const equipment: EquipmentData = booking.equipment ? {
        id: booking.equipment.id,
        title: booking.equipment.title,
        description: booking.equipment.description,
        category: booking.equipment.category,
        subcategory: booking.equipment.subcategory || '',
        daily_price: booking.equipment.daily_price,
        deposit_amount: booking.equipment.deposit_amount,
        owner_id: booking.equipment.owner_id,
        location: booking.equipment.location,
        city: booking.equipment.city || '',
        country: booking.equipment.country || '',
        status: booking.equipment.status,
        created_at: booking.equipment.created_at,
        updated_at: booking.equipment.updated_at,
        images: booking.equipment.images || { error: true, message: "No images available" }
      } : {
        id: '',
        title: 'Équipement indisponible',
        description: '',
        category: '',
        subcategory: '',
        daily_price: 0,
        deposit_amount: 0,
        owner_id: '',
        location: '',
        city: '',
        country: '',
        status: 'indisponible',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        images: { error: true, message: "No images available" }
      };

      // Renter data transformation
      const renter: OwnerData = booking.renter ? {
        id: booking.renter.id || '',
        email: booking.renter.email,
        first_name: booking.renter.first_name,
        last_name: booking.renter.last_name,
        phone_number: booking.renter.phone_number,
        avatar_url: booking.renter.avatar_url,
        created_at: booking.renter.created_at || new Date().toISOString(),
        user_type: booking.renter.user_type || 'locataire'
      } : {
        id: '',
        created_at: new Date().toISOString()
      };

      // Create properly typed OwnerBooking object
      const ownerBooking: OwnerBooking = {
        id: booking.id,
        equipment_id: booking.equipment_id,
        owner_id: equipment.owner_id,
        renter_id: booking.renter_id,
        start_date: booking.start_date,
        end_date: booking.end_date,
        total_amount: booking.total_price || 0,
        total_price: booking.total_price || 0,
        status: normalizeBookingStatus(booking.status || 'pending'),
        payment_status: booking.payment_status,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
        contract_url: booking.contract_url,
        deposit_amount: booking.deposit_amount,
        equipment,
        renter
      };

      return ownerBooking;
    });
  };

  return {
    transformToRenterBookings,
    transformToOwnerBookings
  };
};
