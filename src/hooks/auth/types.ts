
import { User } from '@supabase/supabase-js';
import { ProfileData } from '@/types/supabase';

export interface AuthResult {
  success: boolean;
  error?: any;
  message?: string;
}

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

export interface AuthState {
  user: User | null;
  profile: ProfileData | null;
  loading: boolean;
  loadingProfile: boolean;
}

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  user_type: 'locataire' | 'proprietaire';
  avatar_url?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  country?: string;
  id_number?: string;
  id_document_url?: string;
  created_at: string;
  updated_at: string;
}
