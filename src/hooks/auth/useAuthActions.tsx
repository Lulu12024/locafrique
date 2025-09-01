
import { useCallback } from 'react';
import { AuthResult, SignInParams, SignUpParams } from './types';
import { ProfileData } from '@/types/supabase';
import { useAuthOperations } from './useAuthOperations';
import { useProfile } from './useProfile';

/**
 * Hook for handling authentication actions (sign in, sign up, sign out)
 * Separates the action logic from the core authentication state
 */
export function useAuthActions(user: any, profile: ProfileData | null) {
  const { signUp: authSignUp, signIn: authSignIn, signOut: authSignOut, updatePassword } = useAuthOperations();
  const { updateProfile } = useProfile();
  
  // Wrapper for signup function
  const signUp = async (params: SignUpParams): Promise<AuthResult> => {
    return authSignUp(params);
  };

  // Wrapper for signin function
  const signIn = async (params: SignInParams): Promise<AuthResult> => {
    return authSignIn(params);
  };

  // Wrapper for signout function
  const signOut = async (): Promise<AuthResult> => {
    return authSignOut();
  };

  // Wrapper for profile updates
  const handleUpdateProfile = useCallback(async (profileData: Partial<ProfileData>): Promise<AuthResult> => {
    if (!user) return { success: false, error: "User not logged in" };
    
    const result = await updateProfile(user.id, profileData);
    
    return result;
  }, [user, updateProfile]);

  return {
    signUp,
    signIn,
    signOut,
    updateProfile: handleUpdateProfile,
    updatePassword
  };
}
