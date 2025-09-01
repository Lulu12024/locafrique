
import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/auth";
import { toast } from "@/components/ui/use-toast";

interface RequireAuthProps {
  redirectTo?: string;
}

/**
 * Composant pour protéger les routes qui nécessitent une authentification
 * Redirige vers la page de connexion si l'utilisateur n'est pas authentifié
 */
export function RequireAuth({ redirectTo = '/auth' }: RequireAuthProps) {
  const { user, loading, authCheckComplete } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Ne vérifier que lorsque la vérification d'authentification est terminée
    if (authCheckComplete && !loading) {
      // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
      if (!user) {
        console.log("🔒 Accès refusé: l'utilisateur n'est pas connecté");
        
        toast({
          title: "Accès refusé",
          description: "Vous devez être connecté pour accéder à cette page.",
          variant: "destructive",
        });
        
        navigate(redirectTo, { replace: true });
      }
    }
  }, [user, loading, authCheckComplete, navigate, redirectTo]);
  
  // Afficher un indicateur de chargement pendant la vérification d'authentification
  if (loading || !authCheckComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-terracotta mx-auto"></div>
          <p className="mt-2">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }
  
  // Rendre les enfants uniquement si l'utilisateur est authentifié
  return user ? <Outlet /> : null;
}
