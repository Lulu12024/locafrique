
import { useMemo } from 'react';
import { ProfileData } from '@/types/supabase';

/**
 * Hook pour gérer les rôles utilisateur de manière sécurisée
 */
export function useUserRoles(profile: ProfileData | null) {
  return useMemo(() => {
    console.log("🔍 useUserRoles - Profil reçu:", {
      profile,
      userType: {
        _type: typeof profile?.user_type,
        value: profile?.user_type || "undefined"
      },
      firstName: {
        _type: typeof profile?.first_name,
        value: profile?.first_name || "undefined"
      },
      lastName: {
        _type: typeof profile?.last_name,
        value: profile?.last_name || "undefined"
      },
      hasProfile: !!profile
    });

    // Gestion sécurisée des profils null/undefined
    if (!profile || !profile.user_type) {
      return {
        isProprietaire: false,
        isLocataire: false,
        userType: undefined,
        hasValidProfile: false
      };
    }

    const userType = profile.user_type;
    
    return {
      isProprietaire: userType === 'proprietaire',
      isLocataire: userType === 'locataire',
      userType,
      hasValidProfile: true
    };
  }, [profile]);
}
