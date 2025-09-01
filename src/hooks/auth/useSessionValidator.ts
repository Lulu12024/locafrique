
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from "@/components/ui/use-toast";

/**
 * Hook pour valider les sessions utilisateur
 * avec une logique améliorée pour éviter les boucles infinies
 */
export function useSessionValidator() {
  // Fonction pour vérifier si la session est toujours valide
  const validateSession = useCallback(async (user: User | null): Promise<boolean> => {
    if (!user) {
      console.log("⚠️ Aucun utilisateur fourni pour la validation de session");
      return false;
    }
    
    try {
      console.log(`🔍 Validation de la session pour ${user.email}`);
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn("⚠️ Erreur lors de la validation de la session:", error.message);
        return false;
      }
      
      if (!data.session) {
        console.warn("⚠️ Session invalide ou expirée");
        return false;
      }
      
      // Vérification supplémentaire: s'assurer que l'ID utilisateur correspond
      if (data.session.user.id !== user.id) {
        console.warn("⚠️ Incohérence d'ID utilisateur détectée lors de la validation");
        return false;
      }
      
      console.log("✅ Session validée avec succès");
      return true;
    } catch (e) {
      console.error("❌ Exception lors de la validation de la session:", e);
      
      // Notification utilisateur seulement si l'erreur est grave
      if (e instanceof Error && e.message !== "Failed to fetch") {
        toast({
          title: "Erreur de validation",
          description: "Impossible de vérifier votre session. Veuillez vous reconnecter.",
          variant: "destructive",
        });
      }
      
      return false;
    }
  }, []);

  return {
    validateSession
  };
}
