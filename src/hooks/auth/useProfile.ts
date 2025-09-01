
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";
import { ProfileData } from '@/types/supabase';

export function useProfile() {
  const [loadingProfile, setLoadingProfile] = useState(false);
  
  const fetchUserProfile = useCallback(async (userId: string) => {
    if (!userId) {
      console.error("Impossible de charger le profil: ID utilisateur manquant");
      return null;
    }
    
    setLoadingProfile(true);
    console.log(`Chargement du profil pour l'utilisateur ${userId}...`);
    
    try {
      // Approche directe pour récupérer le profil
      console.log(`Tentative de récupération du profil pour l'utilisateur ${userId}`);
      
      // Vérifier si le profil existe
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (fetchError) {
        console.error("Erreur lors de la récupération du profil:", fetchError);
        
        // Si l'erreur n'est pas simplement "aucun résultat", la propager
        if (fetchError.code !== 'PGRST116') {
          throw fetchError;
        }
        
        console.log("Profil non trouvé, tentative de création...");
        
        // Récupérer les informations de l'utilisateur
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          console.error("Impossible de récupérer les données utilisateur");
          throw new Error("Utilisateur non trouvé");
        }
        
        const meta = userData.user.user_metadata || {};
        const firstName = meta.first_name || "";
        const lastName = meta.last_name || "";
        const userType = meta.user_type || "locataire";
        
        console.log("Création d'un nouveau profil avec:", {
          firstName,
          lastName,
          userType
        });
        
        // Créer le profil
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            first_name: firstName,
            last_name: lastName,
            user_type: userType
          })
          .select()
          .single();
        
        if (createError) {
          console.error("Erreur lors de la création du profil:", createError);
          throw createError;
        }
        
        console.log("Nouveau profil créé avec succès:", newProfile);
        return newProfile as ProfileData;
      }
      
      console.log("Profil existant trouvé:", existingProfile);
      return existingProfile as ProfileData;
      
    } catch (error) {
      console.error('Erreur lors du chargement ou de la création du profil:', error);
      toast({
        title: "Erreur de profil",
        description: "Impossible de charger ou créer votre profil. Veuillez vous reconnecter.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  // Fonction pour mettre à jour le profil
  const updateProfile = async (userId: string, profileData: Partial<ProfileData>) => {
    if (!userId) return { success: false, error: "Utilisateur non connecté" };
    
    try {
      console.log("Mise à jour du profil...", profileData);
      
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId);
      
      if (error) throw error;
      
      console.log("Profil mis à jour avec succès!");
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès.",
      });
      
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  return {
    loadingProfile,
    fetchUserProfile,
    updateProfile
  };
}
