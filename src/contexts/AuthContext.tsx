
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { ProfileData } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";

// Types pour le contexte d'authentification
interface AuthContextType {
  user: User | null;
  profile: ProfileData | null;
  isLoading: boolean;
  isLoadingProfile: boolean;
  isAuthenticated: boolean;
  authReady: boolean;
  
  // Actions d'authentification
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<boolean>;
  updateProfile: (data: Partial<ProfileData>) => Promise<boolean>;
  updatePassword: (password: string) => Promise<boolean>;
}

interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: 'locataire' | 'proprietaire';
}

// Création du contexte avec des valeurs par défaut
export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  isLoadingProfile: false,
  isAuthenticated: false,
  authReady: false,
  
  signIn: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  signOut: async () => {},
  refreshProfile: async () => false,
  updateProfile: async () => false,
  updatePassword: async () => false,
});

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

// Provider du contexte d'authentification
export const AuthProvider = ({ children }: AuthProviderProps) => {
  // États pour l'utilisateur et le profil
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  
  // Fonction pour nettoyer l'état d'authentification
  const cleanupAuthState = () => {
    // Nettoyer les jetons d'authentification standard
    localStorage.removeItem('supabase.auth.token');
    
    // Nettoyer les clés d'authentification Supabase
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Nettoyer les clés dans sessionStorage
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  // Fonction pour récupérer le profil utilisateur
  const fetchUserProfile = async (userId: string): Promise<ProfileData | null> => {
    if (!userId) return null;
    
    setIsLoadingProfile(true);
    console.log(`🔍 Chargement du profil pour l'utilisateur ${userId}`);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) throw error;
      
      if (data) {
        console.log("✅ Profil chargé avec succès:", data);
        return data as ProfileData;
      } else {
        console.log("❓ Aucun profil trouvé, création d'un nouveau profil...");
        
        // Récupérer les données utilisateur
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          throw new Error("Utilisateur non trouvé");
        }
        
        // Extraire les métadonnées
        const meta = userData.user.user_metadata;
        const firstName = meta?.first_name || "";
        const lastName = meta?.last_name || "";
        const userType = meta?.user_type || "locataire";
        
        // Créer le profil
        const { data: newProfile, error: createError } = await supabase.rpc('create_profile_securely', {
          user_id: userId,
          first_name: firstName,
          last_name: lastName,
          user_type: userType
        });
        
        if (createError) throw createError;
        
        // Récupérer le profil créé
        const { data: createdProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
          
        if (createdProfile) {
          console.log("✅ Nouveau profil créé:", createdProfile);
          return createdProfile as ProfileData;
        }
      }
      
      return null;
    } catch (error) {
      console.error("❌ Erreur lors du chargement du profil:", error);
      toast({
        title: "Erreur de profil",
        description: "Impossible de charger votre profil utilisateur.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoadingProfile(false);
    }
  };
  
  // Fonction pour connecter l'utilisateur
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log("🔑 Tentative de connexion...");
      
      // Nettoyer l'état d'authentification avant la connexion
      cleanupAuthState();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      console.log("✅ Connexion réussie!");
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur la plateforme!",
      });
      
      return { success: true };
    } catch (error: any) {
      console.error("❌ Erreur de connexion:", error);
      toast({
        title: "Erreur de connexion",
        description: error.message || "Identifiants incorrects",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fonction pour inscrire un utilisateur
  const signUp = async (data: SignUpData) => {
    try {
      setIsLoading(true);
      console.log("📝 Tentative d'inscription...");
      
      // Nettoyer l'état d'authentification avant l'inscription
      cleanupAuthState();
      
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            user_type: data.userType
          }
        }
      });
      
      if (error) throw error;
      
      console.log("✅ Inscription réussie!");
      toast({
        title: "Inscription réussie",
        description: "Veuillez vérifier votre email pour confirmer votre compte.",
      });
      
      return { success: true };
    } catch (error: any) {
      console.error("❌ Erreur d'inscription:", error);
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Un problème est survenu lors de l'inscription",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fonction pour déconnecter l'utilisateur
  const signOut = async () => {
    try {
      setIsLoading(true);
      console.log("🚪 Déconnexion en cours...");
      
      // Nettoyer l'état d'authentification
      cleanupAuthState();
      
      // Déconnexion Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      // Réinitialiser l'état local
      setUser(null);
      setProfile(null);
      
      toast({
        title: "Déconnexion réussie",
      });
      
      // Redirection forcée pour s'assurer que tout est nettoyé
      window.location.href = '/auth';
    } catch (error: any) {
      console.error("❌ Erreur de déconnexion:", error);
      toast({
        title: "Erreur lors de la déconnexion",
        description: "Un problème est survenu. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fonction pour rafraîchir le profil utilisateur
  const refreshProfile = async (): Promise<boolean> => {
    if (!user) return false;
    
    console.log("🔄 Rafraîchissement du profil...");
    const profileData = await fetchUserProfile(user.id);
    
    if (profileData) {
      setProfile(profileData);
      return true;
    }
    
    return false;
  };
  
  // Fonction pour mettre à jour le profil utilisateur
  const updateProfile = async (data: Partial<ProfileData>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      console.log("✏️ Mise à jour du profil...");
      
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Rafraîchir les données du profil
      await refreshProfile();
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès.",
      });
      
      return true;
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour du profil:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre profil.",
        variant: "destructive",
      });
      return false;
    }
  };
  
  // Fonction pour mettre à jour le mot de passe
  const updatePassword = async (password: string): Promise<boolean> => {
    try {
      console.log("🔒 Mise à jour du mot de passe...");
      
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      toast({
        title: "Mot de passe mis à jour",
        description: "Votre mot de passe a été modifié avec succès.",
      });
      
      return true;
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour du mot de passe:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre mot de passe.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Effet pour initialiser l'écouteur d'authentification
  useEffect(() => {
    console.log("🔐 Initialisation du système d'authentification...");
    
    let profileTimeout: NodeJS.Timeout | null = null;
    let isActive = true;
    
    // Écouteur d'authentification pour détecter les changements d'état
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`🔄 Événement d'authentification: ${event}`);
        
        // Mettre à jour l'état utilisateur de manière synchrone
        if (isActive) {
          setUser(session?.user || null);
        }
        
        // Si connecté, charger le profil avec un petit délai pour éviter les conditions de course
        if (session?.user && isActive) {
          // Annuler tout chargement de profil précédent
          if (profileTimeout) clearTimeout(profileTimeout);
          
          // Programmer un nouveau chargement de profil
          profileTimeout = setTimeout(() => {
            if (!isActive) return;
            
            fetchUserProfile(session.user.id).then(profileData => {
              if (isActive && profileData) {
                setProfile(profileData);
              }
            });
          }, 200);
        }
        
        // Si déconnecté, réinitialiser l'état
        if (event === 'SIGNED_OUT' && isActive) {
          setUser(null);
          setProfile(null);
        }
      }
    );
    
    // Vérifier la session existante
    const checkSession = async () => {
      try {
        setIsLoading(true);
        console.log("🔍 Vérification de la session existante...");
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        // Mettre à jour l'état utilisateur
        if (isActive) {
          setUser(data.session?.user || null);
          
          // Si l'utilisateur est connecté, charger son profil
          if (data.session?.user) {
            console.log("👤 Utilisateur connecté, chargement du profil...");
            const profileData = await fetchUserProfile(data.session.user.id);
            
            if (isActive && profileData) {
              setProfile(profileData);
            }
          }
        }
      } catch (error) {
        console.error("❌ Erreur lors de la vérification de la session:", error);
      } finally {
        if (isActive) {
          setIsLoading(false);
          setAuthReady(true);
        }
      }
    };
    
    // Exécuter la vérification de la session
    checkSession();
    
    // Nettoyage lors du démontage du composant
    return () => {
      isActive = false;
      if (profileTimeout) clearTimeout(profileTimeout);
      subscription.unsubscribe();
    };
  }, []);
  
  // Calculer si l'utilisateur est authentifié
  const isAuthenticated = !!user;
  
  // Valeurs du contexte
  const value = {
    user,
    profile,
    isLoading,
    isLoadingProfile,
    isAuthenticated,
    authReady,
    
    signIn,
    signUp,
    signOut,
    refreshProfile,
    updateProfile,
    updatePassword
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
