
import React from 'react';
import { toast } from "@/components/ui/use-toast";

// Types d'erreurs d'authentification courants
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'invalid_credentials',
  USER_EXISTS = 'user_exists',
  WEAK_PASSWORD = 'weak_password',
  INVALID_EMAIL = 'invalid_email',
  NETWORK_ERROR = 'network_error',
  UNKNOWN = 'unknown'
}

interface AuthErrorProps {
  error: any;
  errorType?: AuthErrorType;
  customMessage?: string;
}

/**
 * Fonction utilitaire pour gérer et afficher les erreurs d'authentification
 */
export const handleAuthError = ({ error, errorType, customMessage }: AuthErrorProps): void => {
  console.error('Erreur d\'authentification:', error);
  
  let title = "Erreur d'authentification";
  let description = customMessage || "Une erreur est survenue lors de l'opération.";
  
  if (typeof error === 'string') {
    description = error;
  } else if (error?.message) {
    description = error.message;
  }
  
  // Traiter les types d'erreurs spécifiques
  switch (errorType) {
    case AuthErrorType.INVALID_CREDENTIALS:
      title = "Identifiants incorrects";
      description = customMessage || "Email ou mot de passe incorrect.";
      break;
    case AuthErrorType.USER_EXISTS:
      title = "Utilisateur existant";
      description = customMessage || "Un compte existe déjà avec cet email.";
      break;
    case AuthErrorType.WEAK_PASSWORD:
      title = "Mot de passe faible";
      description = customMessage || "Le mot de passe doit contenir au moins 6 caractères.";
      break;
    case AuthErrorType.INVALID_EMAIL:
      title = "Email invalide";
      description = customMessage || "Veuillez fournir une adresse email valide.";
      break;
    case AuthErrorType.NETWORK_ERROR:
      title = "Erreur réseau";
      description = customMessage || "Vérifiez votre connexion internet et réessayez.";
      break;
    default:
      // Pour les erreurs inconnues, utilisez le message par défaut ou personnalisé
      break;
  }
  
  // Afficher le toast d'erreur
  toast({
    title,
    description,
    variant: "destructive",
  });
};

/**
 * Composant pour encapsuler la gestion des erreurs d'authentification
 */
const AuthErrorHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Ce composant pourrait être utilisé pour encapsuler les formulaires d'authentification
  // et gérer les erreurs de manière centralisée
  return <>{children}</>;
};

export default AuthErrorHandler;
