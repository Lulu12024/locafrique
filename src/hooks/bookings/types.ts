export type BookingStatus = 
  | "pending" 
  | "approved" 
  | "rejected" 
  | "completed" 
  | "cancelled" 
  | "confirmée" 
  | "refusée" 
  | "en_attente"
  | "negotiating"
  | "en_cours";

export type EquipmentImageData = {
  id: string;
  equipment_id: string;
  image_url: string;
  created_at: string;
  is_primary?: boolean;
};

export interface SelectQueryError<T = string> {
  error: true;
  message: T;
}

export type EquipmentData = {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  daily_price: number;
  deposit_amount: number;
  owner_id: string;
  location: string;
  city: string;
  country: string;
  status: string;
  created_at: string;
  updated_at: string;
  images: EquipmentImageData[] | SelectQueryError<string>;
};

export type OwnerData = {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  avatar_url?: string;
  created_at: string;
  user_type?: 'locataire' | 'proprietaire';
};

export type RenterData = OwnerData;

export type BookingData = {
  id: string;
  equipment_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  total_price: number;
  status: BookingStatus;
  payment_status?: string;
  created_at: string;
  updated_at?: string;
  contract_url?: string;
  deposit_amount?: number;
};

// Define these types separately without circular references
export type RenterBooking = {
  id: string;
  equipment_id: string;
  owner_id?: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  total_price: number;
  status: BookingStatus;
  payment_status?: string;
  created_at: string;
  updated_at?: string;
  contract_url?: string;
  deposit_amount?: number;
  equipment: EquipmentData;
  owner?: OwnerData;
};

export type OwnerBooking = {
  id: string;
  equipment_id: string;
  owner_id?: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  total_price: number;
  status: BookingStatus;
  payment_status?: string;
  created_at: string;
  updated_at?: string;
  contract_url?: string;
  deposit_amount?: number;
  equipment: EquipmentData;
  renter?: OwnerData;
};

// Helper function to normalize booking status
export const normalizeBookingStatus = (status: string): BookingStatus => {
  // Convert various status formats to a consistent format
  switch(status.toLowerCase()) {
    case 'en_attente':
    case 'en attente':
      return 'pending';
    case 'confirmée':
    case 'confirmee':
    case 'approved':
      return 'approved';
    case 'refusée':
    case 'refusee':
    case 'rejected':
      return 'rejected';
    case 'completée':
    case 'completee':
    case 'completed':
      return 'completed';
    case 'canceled':
    case 'annulée':
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending';  // Default fallback
  }
};

// Add a utility function to ensure compatibility with BookingData
export const asBookingData = (booking: OwnerBooking | RenterBooking): BookingData => {
  return {
    ...booking,
    total_price: booking.total_amount,
  };
};
