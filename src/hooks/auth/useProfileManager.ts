
import { useCallback, useRef, MutableRefObject } from 'react';
import { User } from '@supabase/supabase-js';
import { ProfileData } from '@/types/supabase';
import { AuthState } from './types';

type FetchProfileFunction = (userId: string) => Promise<ProfileData | null>;
type SetStateFunction = (updater: (prev: AuthState) => AuthState) => void;

/**
 * Hook optimisé pour la gestion rapide des profils utilisateur
 */
export function useProfileManager(
  fetchUserProfile: FetchProfileFunction,
  setState: SetStateFunction,
  profileLoadAttempted: MutableRefObject<boolean>
) {
  const profileFetchInProgress = useRef(false);
  // Cache amélioré avec durée de vie plus longue
  const profileCache = useRef<{userId: string, profile: ProfileData, timestamp: number} | null>(null);
  
  // Cache valide pendant 10 minutes au lieu de 5
  const isCacheValid = useCallback((userId: string) => {
    if (!profileCache.current) return false;
    if (profileCache.current.userId !== userId) return false;
    
    const now = Date.now();
    const cacheTime = profileCache.current.timestamp;
    const cacheValidityPeriod = 10 * 60 * 1000; // 10 minutes
    
    return (now - cacheTime) < cacheValidityPeriod;
  }, []);

  /**
   * Chargement optimisé du profil avec cache persistant
   */
  const handleFetchUserProfile = useCallback(async (user: User | null) => {
    if (!user) return;
    
    // Vérification immédiate du cache
    if (isCacheValid(user.id)) {
      console.log("⚡ Profil chargé depuis le cache (instantané)");
      setState(prev => ({ 
        ...prev, 
        profile: profileCache.current!.profile,
        loadingProfile: false 
      }));
      profileLoadAttempted.current = true;
      return;
    }
    
    // Éviter les appels multiples
    if (profileFetchInProgress.current) {
      console.log("⏳ Chargement déjà en cours, attente...");
      return;
    }
    
    profileFetchInProgress.current = true;
    profileLoadAttempted.current = true;
    
    console.log("🔄 Chargement profil depuis la base...", user.id);
    setState(prev => ({ ...prev, loadingProfile: true }));
    
    try {
      const userProfile = await fetchUserProfile(user.id);
      
      if (userProfile) {
        console.log("✅ Profil chargé:", userProfile.user_type);
        
        // Mise à jour du cache
        profileCache.current = {
          userId: user.id,
          profile: userProfile,
          timestamp: Date.now()
        };
        
        setState(prev => ({
          ...prev,
          profile: userProfile,
          loadingProfile: false
        }));
      } else {
        console.warn("⚠️ Profil non trouvé");
        setState(prev => ({ ...prev, loadingProfile: false }));
      }
    } catch (error) {
      console.error("❌ Erreur chargement profil:", error);
      setState(prev => ({ ...prev, loadingProfile: false }));
    } finally {
      profileFetchInProgress.current = false;
    }
  }, [fetchUserProfile, setState, profileLoadAttempted, isCacheValid]);
  
  /**
   * Rafraîchissement forcé du profil
   */
  const refreshProfile = useCallback(async (user: User | null) => {
    if (!user) {
      console.warn("⚠️ Impossible de rafraîchir: aucun utilisateur");
      return;
    }
    
    console.log("🔄 Rafraîchissement forcé du profil...");
    // Invalidation du cache
    profileCache.current = null;
    profileLoadAttempted.current = false;
    await handleFetchUserProfile(user);
  }, [handleFetchUserProfile, profileLoadAttempted]);
  
  return {
    handleFetchUserProfile,
    refreshProfile
  };
}
