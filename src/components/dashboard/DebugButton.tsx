
import React from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/auth";
import { useUserRoles } from "@/hooks/auth/useUserRoles";

const DebugButton: React.FC = () => {
  const { user, profile, loading, loadingProfile, authCheckComplete } = useAuth();
  const { isProprietaire, isLocataire, userType } = useUserRoles(profile);

  const handleDebugClick = () => {
    console.log("🔍 DEBUG COMPLET:", {
      // État utilisateur
      user: user ? {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      } : null,
      
      // État profil
      profile: profile,
      
      // États de chargement
      loading,
      loadingProfile,
      authCheckComplete,
      
      // Rôles calculés
      currentType: userType,
      isProprietaire: isProprietaire,
      isLocataire: isLocataire,
      
      // Conditions d'affichage
      shouldShowToggle: !!user && !!profile && !loading && !loadingProfile,
      
      // Timestamp
      timestamp: new Date().toISOString()
    });
  };

  return (
    <Button 
      variant="destructive" 
      size="sm"
      onClick={handleDebugClick}
      className="flex items-center gap-2"
    >
      <RotateCcw className="h-4 w-4" />
      <span>Debug</span>
    </Button>
  );
};

export default DebugButton;
