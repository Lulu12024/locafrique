
import { useCallback } from 'react';
import { useProfile } from './useProfile';
import { useAuthState } from './useAuthState';
import { useSessionValidator } from './useSessionValidator';
import { useProfileManager } from './useProfileManager';
import { useAuthListener } from './useAuthListener';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook principal d'authentification optimisé pour des performances rapides
 */
export function useAuthCore() {
  const { 
    state,
    setState,
    authCheckComplete,
    authTimeoutRef,
    profileLoadAttempted
  } = useAuthState();
  
  const { fetchUserProfile } = useProfile();
  const { validateSession } = useSessionValidator();
  
  const { 
    handleFetchUserProfile, 
    refreshProfile 
  } = useProfileManager(
    fetchUserProfile,
    setState,
    profileLoadAttempted
  );

  // Configuration du listener d'authentification optimisé
  useAuthListener(
    setState,
    handleFetchUserProfile,
    authTimeoutRef,
    authCheckComplete,
    profileLoadAttempted
  );

  // Vérification de session rapide et optimisée
  const checkSession = useCallback(async () => {
    try {
      console.log("🚀 Vérification rapide de la session...");
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        console.log("⚡ Session active trouvée pour:", data.session.user.email);
        
        // Mise à jour immédiate de l'état utilisateur
        setState(prev => ({ 
          ...prev, 
          user: data.session.user, 
          loading: false 
        }));
        
        // Chargement du profil en parallèle (non bloquant)
        handleFetchUserProfile(data.session.user);
      } else {
        console.log("❌ Aucune session active");
        setState(prev => ({ 
          ...prev, 
          user: null,
          profile: null,
          loading: false 
        }));
      }
      
      authCheckComplete.current = true;
    } catch (error) {
      console.error("❌ Erreur vérification session:", error);
      setState(prev => ({ 
        ...prev, 
        user: null,
        profile: null,
        loading: false 
      }));
      authCheckComplete.current = true;
    }
  }, [setState, handleFetchUserProfile, authCheckComplete]);

  return {
    ...state,
    loadingProfile: state.loadingProfile,
    refreshProfile: useCallback(() => refreshProfile(state.user), [refreshProfile, state.user]),
    fetchUserProfile: handleFetchUserProfile,
    validateSession: useCallback(() => validateSession(state.user), [validateSession, state.user]),
    authCheckComplete: authCheckComplete.current,
    checkSession
  };
}
