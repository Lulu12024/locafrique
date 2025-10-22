
import { User as SupabaseUser } from "@supabase/supabase-js";

// Types pour les données de Supabase
export interface ProfileData {
  id: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  address?: string;
  city?: string;
  country?: string;
  avatar_url?: string;
  user_type: 'locataire' | 'proprietaire';
  created_at?: string;
  updated_at?: string;
  id_number?: string;
  id_document_url?: string;
  is_verified?: boolean;
}

export interface BookingData {
  id: string;
  equipment_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  created_at?: string;
  contract_url?: string;
  deposit_amount?: number;
  payment_status?: string;
  updated_at?: string;
  equipment?: EquipmentData;
  owner?: ProfileData;
  renter?: ProfileData;
  owner_signature?: boolean;
  renter_signature?: boolean;
}

// Type générique pour les erreurs de requête
export interface SelectQueryError<T = string> {
  error: true;
  message?: T;
}

export interface EquipmentData {
  id: string;
  title: string;
  description: string;
  daily_price: number;
  deposit_amount: number;
  location: string;
  city: string;
  country: string;
  category: string;
  subcategory?: string;
  status: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  condition?: string;
  brand?: string;
  year?: number;
  weekly_price?: number;
  rental_conditions?: string;
  images: EquipmentImageData[] | SelectQueryError<string>;
  owner?: ProfileData;
  booking_count?: number;
  
  // ✅ AJOUT : Champs de modération
  moderation_status?: 'pending' | 'approved' | 'rejected' | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  approved_at?: string | null;
  is_premium?: boolean;
  published_at?: string | null;
}

export interface EquipmentImageData {
  id: string;
  equipment_id: string;
  image_url: string;
  is_primary: boolean;
  created_at?: string;
}

export interface MessageData {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  booking_id?: string;
  read?: boolean;
  created_at?: string;
}

export interface WalletData {
  id: string;
  user_id: string;
  balance: number;
  created_at?: string;
  updated_at?: string;
}

export interface TransactionData {
  id: string;
  wallet_id: string;
  amount: number;
  transaction_type: string;
  status: string;
  description?: string;
  reference_id?: string;
  created_at?: string;
}

// User related types
export type User = SupabaseUser;

export interface SignUpParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: 'locataire' | 'proprietaire';
  phone?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface ResetPasswordParams {
  email: string;
}

export interface UpdateProfileParams {
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ContractData {
  id: string;
  booking_id: string;
  file_url: string;
  renter_signature_url?: string;
  owner_signature_url?: string;
  status: 'draft' | 'pending_renter' | 'pending_owner' | 'completed';
  created_at?: string;
  updated_at?: string;
}

export interface PaymentData {
  id: string;
  booking_id: string;
  amount: number;
  deposit_amount: number;
  payment_method: 'card' | 'mobile_money' | 'wallet';
  status: 'pending' | 'completed' | 'failed';
  transaction_id?: string;
  created_at?: string;
}

// Mock database interface for simulation
export interface MockTables {
  payments: PaymentData[];
  contracts: ContractData[];
}
