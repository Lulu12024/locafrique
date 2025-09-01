
import React from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/auth";
import { useUserRoles } from "@/hooks/auth/useUserRoles";
import { useIsMobile } from "@/hooks/use-mobile";
import ProfileToggleButton from "./ProfileToggleButton";
import DebugButton from "./DebugButton";

interface DashboardHeaderProps {
  onToggleMobileSidebar: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onToggleMobileSidebar }) => {
  const { user, profile, loading, loadingProfile } = useAuth();
  const { userType } = useUserRoles(profile);
  const isMobile = useIsMobile();

  // Debug complet de l'état
  console.log("🎯 DashboardHeader Debug:", {
    user: !!user,
    profile: profile,
    loading,
    loadingProfile,
    userType: userType,
    shouldShowToggle: !!user && !!profile && !loading && !loadingProfile
  });

  const shouldShowProfileToggle = !!user && !!profile && !loading && !loadingProfile;

  return (
    <div className="flex items-center justify-between mb-4 md:mb-6">
      <h1 className="text-xl md:text-2xl font-bold">
        Tableau de bord
        {/* Debug info amélioré */}
        <span className="text-sm text-gray-500 ml-2">
          ({profile ? `${profile.first_name} ${profile.last_name} - ${userType}` : 'Chargement...'})
        </span>
      </h1>
      
      <div className="flex items-center gap-2">
        {/* Afficher le bouton même si le profil charge */}
        {user && (
          <ProfileToggleButton 
            shouldShow={shouldShowProfileToggle}
            isLoading={loading || loadingProfile}
          />
        )}
        <DebugButton />
        
        {isMobile && (
          <Button 
            variant="outline" 
            size="sm" 
            className="md:hidden" 
            onClick={onToggleMobileSidebar}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
