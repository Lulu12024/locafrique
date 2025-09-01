
import { useAuthCore } from './useAuthCore';
import { useAuthActions } from './useAuthActions';
import { useUserRoles } from './useUserRoles';

/**
 * Main authentication hook that composes all the specialized auth hooks
 * This provides a unified API for authentication while keeping the implementation
 * organized in smaller, focused hooks
 */
export function useAuth() {
  const { 
    user, 
    profile, 
    loading, 
    loadingProfile,
    refreshProfile,
    fetchUserProfile,
    authCheckComplete
  } = useAuthCore();
  
  const {
    signUp,
    signIn,
    signOut,
    updateProfile,
    updatePassword
  } = useAuthActions(user, profile);
  
  const {
    isProprietaire,
    isLocataire,
    hasValidProfile
  } = useUserRoles(profile);

  return {
    // User state
    user,
    profile,
    loading,
    loadingProfile,
    
    // Authentication actions
    signUp,
    signIn,
    signOut,
    updateProfile,
    updatePassword,
    
    // User roles avec gestion sécurisée
    isProprietaire,
    isLocataire,
    hasValidProfile,
    
    // Profile management
    fetchUserProfile,
    refreshProfile,
    
    // Auth check status
    authCheckComplete
  };
}
