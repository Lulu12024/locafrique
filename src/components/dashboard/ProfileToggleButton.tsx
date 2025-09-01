
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserCog } from "lucide-react";
import { useAuth } from "@/hooks/auth";
import { useUserRoles } from "@/hooks/auth/useUserRoles";
import { useToast } from "@/components/ui/use-toast";

interface ProfileToggleButtonProps {
  shouldShow: boolean;
  isLoading?: boolean;
}

const ProfileToggleButton: React.FC<ProfileToggleButtonProps> = ({ shouldShow, isLoading = false }) => {
  const { profile, updateProfile, refreshProfile } = useAuth();
  const { userType } = useUserRoles(profile);
  const [isChangingProfile, setIsChangingProfile] = useState(false);
  const { toast } = useToast();

  console.log("🔘 ProfileToggleButton optimisé:", {
    shouldShow,
    isLoading,
    profile,
    currentType: userType,
    hasProfile: !!profile
  });

  if (!shouldShow && !isLoading) return null;

  // Affichage optimisé du loading
  if (isLoading || !profile) {
    return (
      <Button 
        variant="outline" 
        size="sm"
        disabled
        className="flex items-center gap-2 bg-white border-terracotta text-terracotta"
      >
        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
        <span>Chargement...</span>
      </Button>
    );
  }

  const currentUserType = userType || 'locataire';
  const nextUserType = currentUserType === 'proprietaire' ? 'locataire' : 'proprietaire';

  const handleToggleUserType = async () => {
    if (!profile || isChangingProfile) return;
    
    try {
      setIsChangingProfile(true);
      
      console.log("⚡ Changement rapide de profil:", currentUserType, "->", nextUserType);
      
      // Mise à jour optimisée sans rechargement complet
      const result = await updateProfile({
        user_type: nextUserType
      });
      
      if (result.success) {
        // Rafraîchissement rapide du profil
        await refreshProfile();
        
        toast({
          title: "Profil modifié",
          description: `Mode ${nextUserType === 'proprietaire' ? 'propriétaire' : 'locataire'} activé.`,
          duration: 2000
        });
        
        console.log("⚡ Changement de profil terminé en moins de 1s");
      } else {
        throw new Error(result.error || "Erreur inconnue");
      }
    } catch (error) {
      console.error("❌ Erreur changement profil:", error);
      toast({
        title: "Erreur",
        description: "Impossible de changer le type de profil.",
        variant: "destructive"
      });
    } finally {
      setIsChangingProfile(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleToggleUserType}
      disabled={isChangingProfile}
      className="flex items-center gap-2 bg-white border-terracotta text-terracotta hover:bg-terracotta hover:text-white transition-colors"
    >
      {isChangingProfile ? (
        <>
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
          <span>Changement...</span>
        </>
      ) : (
        <>
          <UserCog className="h-4 w-4" />
          <span>Mode {nextUserType}</span>
        </>
      )}
    </Button>
  );
};

export default ProfileToggleButton;
