
/**
 * Fonction pour nettoyer l'état de l'authentification pour éviter les problèmes de "limbo"
 * où l'utilisateur reste bloqué entre les états connecté/déconnecté
 */
export const cleanupAuthState = (): void => {
  // Supprimer les jetons d'authentification standard
  localStorage.removeItem('supabase.auth.token');
  
  // Supprimer toutes les clés d'authentification Supabase de localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Supprimer de sessionStorage si utilisé
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

/**
 * Fonction pour forcer une redirection après une opération d'authentification
 * afin d'assurer un état propre de l'application
 */
export const forceRedirect = (path: string = '/'): void => {
  window.location.href = path;
};
