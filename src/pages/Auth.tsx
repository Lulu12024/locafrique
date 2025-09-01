
import { AuthForm } from "@/components/auth/AuthForm";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth"; // Correction du chemin d'importation

/**
 * Page d'authentification avec redirection automatique
 * pour les utilisateurs déjà connectés
 */
export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, authCheckComplete } = useAuth();

  // Redirection automatique si l'utilisateur est déjà connecté
  useEffect(() => {
    // Ne rediriger que si:
    // 1. L'authentification a été vérifiée (authCheckComplete)
    // 2. L'utilisateur est connecté (user exists)
    // 3. Le chargement est terminé (loading = false)
    if (authCheckComplete && user && !loading) {
      console.log("👉 Utilisateur déjà connecté, redirection vers le tableau de bord...");
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, authCheckComplete, navigate]);

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      {/* Afficher le formulaire d'authentification uniquement si l'utilisateur n'est pas déjà connecté */}
      {(!loading && authCheckComplete && !user) && <AuthForm />}
      
      {/* Afficher un indicateur de chargement pendant la vérification */}
      {(loading || !authCheckComplete) && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-terracotta mx-auto"></div>
          <p className="mt-2">Chargement...</p>
        </div>
      )}
    </div>
  );
}
