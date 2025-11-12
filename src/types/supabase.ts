
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
  
  // Champs de modération
  moderation_status?: 'pending' | 'approved' | 'rejected' | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  approved_at?: string | null;
  is_premium?: boolean;
  published_at?: string | null;

  // ✅ NOUVEAU : Type de prix pour les chambres/logements
  price_type?: 'daily' | 'monthly';

  // Champs de fonctionnalités
  has_technical_support?: boolean;
  has_training?: boolean;
  has_insurance?: boolean;
  has_delivery?: boolean;
  has_recent_maintenance?: boolean;
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

// ✅ HELPERS UTILITAIRES POUR CHAMBRES/LOGEMENTS

/**
 * Vérifie si un équipement est une chambre/logement
 */
export function isRoomCategory(category: string): boolean {
  const roomKeywords = ['chambre', 'logement', 'appartement', 'studio'];
  return roomKeywords.some(keyword => 
    category.toLowerCase().includes(keyword)
  );
}

/**
 * Formate le prix avec l'unité appropriée
 */
export function formatPrice(equipment: EquipmentData): string {
  const price = equipment.daily_price.toLocaleString();
  const unit = equipment.price_type === 'monthly' ? 'mois' : 'jour';
  return `${price} FCFA/${unit}`;
}

/**
 * Obtient le label du type de logement
 */
export function getRoomTypeLabel(brand?: string): string {
  const labels: Record<string, string> = {
    'studio_meuble': 'Studio meublé',
    'studio_non_meuble': 'Studio non meublé',
    'appartement_meuble': 'Appartement meublé',
    'appartement_non_meuble': 'Appartement non meublé',
    'chambre_meublee': 'Chambre meublée',
    'chambre_non_meublee': 'Chambre non meublée',
    'villa': 'Villa/Maison'
  };
  
  return labels[brand || ''] || brand || 'Non spécifié';
}

/**
 * Obtient les fonctionnalités actives d'un équipement
 */
export function getActiveFeatures(equipment: EquipmentData): Array<{
  key: string;
  label: string;
  icon: string;
}> {
  const features = [];
  const isRoom = isRoomCategory(equipment.category);
  
  if (equipment.has_technical_support) {
    features.push({
      key: 'technical_support',
      label: isRoom ? 'Gardien/Concierge' : 'Support technique',
      icon: '🛠️'
    });
  }
  
  if (equipment.has_training) {
    features.push({
      key: 'training',
      label: isRoom ? "Aide à l'installation" : 'Formation incluse',
      icon: '📚'
    });
  }
  
  if (equipment.has_insurance) {
    features.push({
      key: 'insurance',
      label: isRoom ? 'Assurance habitation' : 'Assurance incluse',
      icon: '🛡️'
    });
  }
  
  if (equipment.has_delivery) {
    features.push({
      key: 'delivery',
      label: isRoom ? 'Parking disponible' : 'Livraison possible',
      icon: '🚚'
    });
  }
  
  if (equipment.has_recent_maintenance) {
    features.push({
      key: 'maintenance',
      label: isRoom ? 'Entretien régulier' : 'Maintenance récente',
      icon: '✅'
    });
  }
  
  return features;
}

/**
 * Type helper pour les chambres/logements
 */
export type RoomEquipmentData = EquipmentData & {
  price_type: 'daily' | 'monthly';
  brand: 'studio_meuble' | 'studio_non_meuble' | 'appartement_meuble' | 
         'appartement_non_meuble' | 'chambre_meublee' | 'chambre_non_meublee' | 'villa';
};
