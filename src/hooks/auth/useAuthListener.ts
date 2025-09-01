
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook optimisé pour les listeners d'authentification
 */
export function useAuthListener(
  setState,
  handleFetchUserProfile,
  authTimeoutRef,
  authCheckComplete,
  profileLoadAttempted
) {
  useEffect(() => {
    console.log("⚡ Configuration du listener auth optimisé");
    
    // Nettoyage préventif
    if (authTimeoutRef.current) {
      clearTimeout(authTimeoutRef.current);
      authTimeoutRef.current = null;
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`⚡ Événement auth: ${event}`);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          console.log(`⚡ Utilisateur connecté: ${session.user.email}`);
          
          // Mise à jour immédiate de l'état
          setState((prev) => ({ 
            ...prev, 
            user: session.user, 
            loading: false 
          }));
          
          // Chargement du profil en arrière-plan (non bloquant)
          setTimeout(() => {
            handleFetchUserProfile(session.user);
          }, 0);
        }
      } 
      else if (event === 'SIGNED_OUT') {
        console.log("👋 Déconnexion");
        setState((prevState) => ({ 
          ...prevState, 
          user: null, 
          profile: null, 
          loading: false,
          loadingProfile: false
        }));
        profileLoadAttempted.current = false;
      } 
      else if (event === 'USER_UPDATED') {
        console.log("🔄 Mise à jour utilisateur");
        if (session?.user) {
          setState((prev) => ({ ...prev, user: session.user }));
          // Pas de rechargement automatique du profil pour éviter la lenteur
        }
      }
      
      authCheckComplete.current = true;
    });
    
    return () => {
      console.log("🧹 Nettoyage listener auth");
      subscription.unsubscribe();
      
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
    };
  }, [setState, handleFetchUserProfile]);
}
