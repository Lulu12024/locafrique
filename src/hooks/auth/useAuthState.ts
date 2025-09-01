
import { useState, useRef, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { ProfileData } from '@/types/supabase';
import { AuthState } from './types';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook optimisé pour l'état d'authentification avec initialisation rapide
 */
export function useAuthState() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    loadingProfile: false
  });
  
  const authCheckComplete = useRef(false);
  const authTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileLoadAttempted = useRef(false);
  
  // Initialisation ultra-rapide
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("⚡ Initialisation rapide de l'auth...");
        
        // Vérification immédiate sans attente
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("❌ Erreur session:", error);
          setState(prev => ({ ...prev, loading: false }));
          authCheckComplete.current = true;
          return;
        }
        
        if (data.session?.user) {
          console.log("⚡ Session trouvée immédiatement:", data.session.user.email);
          setState(prev => ({ 
            ...prev, 
            user: data.session.user, 
            loading: false 
          }));
        } else {
          console.log("❌ Aucune session active");
          setState(prev => ({ ...prev, loading: false }));
        }
        
        authCheckComplete.current = true;
      } catch (error) {
        console.error("❌ Erreur initialisation:", error);
        setState(prev => ({ ...prev, loading: false }));
        authCheckComplete.current = true;
      }
    };
    
    // Exécution immédiate
    initializeAuth();
  }, []);
  
  return {
    state,
    setState,
    authCheckComplete,
    authTimeoutRef,
    profileLoadAttempted
  };
}
