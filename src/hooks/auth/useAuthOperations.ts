
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";
import { AuthResult, SignInParams, SignUpParams } from './types';

export function useAuthOperations() {
  // Fonction de préparation pour l'authentification
  const prepareForAuth = async () => {
    // Nettoyer d'abord les jetons d'authentification standard
    localStorage.removeItem('supabase.auth.token');
    
    // Nettoyer toutes les clés d'authentification Supabase de localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Nettoyer de sessionStorage si utilisé
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
    
    // Tenter une déconnexion globale pour s'assurer que l'état est propre
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      // Continuer même si la déconnexion échoue
      console.log("Erreur lors de la déconnexion préalable (ignorée):", err);
    }
  };

  // Fonction d'inscription
  const signUp = async (params: SignUpParams): Promise<AuthResult> => {
    try {
      console.log("Début de l'inscription...");
      
      // Préparer l'authentification
      await prepareForAuth();
      
      const { error } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
        options: {
          data: {
            first_name: params.firstName,
            last_name: params.lastName,
            user_type: params.userType,
            phone: params.phone || ""
          }
        }
      });
      
      if (error) throw error;
      
      console.log("Inscription réussie!");
      
      toast({
        title: "Inscription réussie",
        description: "Veuillez vérifier votre email pour confirmer votre compte.",
      });
      
      return { success: true, message: "Inscription réussie. Veuillez vérifier votre email." };
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      
      toast({
        title: "Erreur lors de l'inscription",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  // Fonction de connexion
  const signIn = async (params: SignInParams): Promise<AuthResult> => {
    try {
      console.log("Début de la connexion...");
      
      // Préparer l'authentification
      await prepareForAuth();
      
      const { error } = await supabase.auth.signInWithPassword({
        email: params.email,
        password: params.password,
      });
      
      if (error) throw error;
      
      console.log("Connexion réussie!");
      
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur 3W-LOC!",
      });
      
      return { success: true, message: "Connexion réussie" };
    } catch (error) {
      console.error("Erreur de connexion:", error);
      
      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  // Fonction de déconnexion
  const signOut = async (): Promise<AuthResult> => {
    try {
      console.log("Début de la déconnexion...");
      
      // Préparer l'authentification
      await prepareForAuth();
      
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      
      console.log("Déconnexion réussie!");
      
      toast({
        title: "Déconnexion réussie",
      });
      
      // Forcer une redirection pour s'assurer que l'état est propre
      window.location.href = '/auth';
      
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      
      toast({
        title: "Erreur lors de la déconnexion",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  // Fonction pour mettre à jour le mot de passe
  const updatePassword = async (newPassword: string): Promise<AuthResult> => {
    try {
      console.log("Mise à jour du mot de passe...");
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) throw error;
      
      console.log("Mot de passe mis à jour avec succès!");
      
      toast({
        title: "Mot de passe mis à jour",
        description: "Votre mot de passe a été modifié avec succès.",
      });
      
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la mise à jour du mot de passe:", error);
      
      toast({
        title: "Erreur",
        description: "Impossible de modifier le mot de passe: " + error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  return {
    signUp,
    signIn,
    signOut,
    updatePassword
  };
}
