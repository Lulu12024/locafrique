
/**
 * Utilitaire pour nettoyer l'état d'authentification de manière sélective
 * pour éviter les problèmes de "limbo" tout en préservant les sessions valides
 */

// Fonction pour nettoyer les tokens obsolètes tout en préservant la session active
export const cleanupAuthState = (preserveCurrentSession: boolean = true): void => {
  // Ne pas effectuer de nettoyage complet par défaut - cela peut causer des problèmes de déconnexion
  if (!preserveCurrentSession) {
    // Nettoyage complet (utilisé uniquement lors de la déconnexion explicite)
    console.log("Nettoyage complet demandé - suppression de tous les tokens");
    
    try {
      // Nettoyer toutes les clés d'authentification Supabase de localStorage SAUF la session actuelle
      Object.keys(localStorage).forEach((key) => {
        if ((key.startsWith('supabase.auth.token') || key.includes('sb-')) && 
            // !key.includes('sb-' + 'eqvgbqxaefpkbfetubrt' + '-auth-token')) {
            !key.includes('sb-' + 'nvcgijtnwnbgxzuclbhy' + '-auth-token')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error("Erreur lors du nettoyage du localStorage:", e);
    }
  } else {
    // Mode conservatif - préserver la session actuelle
    console.log("Mode de nettoyage conservatif - préservation de la session actuelle");
    // Ne pas toucher aux clés liées à la session actuelle
  }
};

/**
 * Fonction pour forcer une redirection après une opération d'authentification
 * et s'assurer que l'application est dans un état propre
 */
export const forceRedirect = (path: string = '/'): void => {
  // Utilisez window.location.href pour une redirection complète
  // plutôt que react-router qui préserve l'état précédent
  window.location.href = path;
};

/**
 * Préparation avant l'authentification pour éviter les états incohérents
 * mais sans détruire la session active
 */
export const prepareForAuth = async (): Promise<void> => {
  // Nettoyer d'abord l'état d'authentification, tout en préservant la session active
  cleanupAuthState(true);
  
  // Retourner une promesse résolue pour permettre le chaînage
  return Promise.resolve();
};
