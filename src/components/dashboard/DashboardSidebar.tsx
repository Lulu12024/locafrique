
import React from "react";
import { useAuth } from "@/hooks/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck,
  ShoppingCart,
  Truck,
  Wallet,
  Plus,
  History,
  FileText,
  BarChart3,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserRoles } from "@/hooks/auth/useUserRoles";

interface DashboardSidebarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onMobileMenuItemClick?: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ 
  activeTab = '',
  setActiveTab = () => {},
  onMobileMenuItemClick = () => {}
}) => {
  const { profile } = useAuth();
  const { isProprietaire, userType } = useUserRoles(profile);
  const isMobile = useIsMobile();
  
  // Debug logs pour voir les changements de profil
  console.log("🎯 DashboardSidebar render:", {
    profile,
    isProprietaire: isProprietaire,
    userType: userType,
    activeTab
  });
  
  const handleMenuClick = (tab: string) => {
    console.log("📱 Menu clicked:", tab, "pour utilisateur:", userType);
    setActiveTab(tab);
    // Fermer le menu mobile après un clic
    if (isMobile) {
      onMobileMenuItemClick();
    }
  };
  
  // Fonction pour déterminer si un utilisateur est propriétaire
  const isOwner = isProprietaire;
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          Menu {profile?.user_type && `(${profile.user_type})`}
          {/* Debug info */}
          <div className="text-xs text-gray-500 mt-1">
            Debug: {profile?.first_name} {profile?.last_name} - Type: {userType}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <div className="space-y-1">
          <Button 
            variant={activeTab === "stats" ? "default" : "ghost"} 
            className="w-full justify-start text-sm"
            onClick={() => handleMenuClick("stats")}
            size={isMobile ? "sm" : "default"}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Mes stats
          </Button>
          
          {/* Debug: afficher le statut de propriétaire */}
          <div className="text-xs text-gray-400 px-2">
            Propriétaire: {isOwner ? 'OUI' : 'NON'}
          </div>
          
          {/* Menus spécifiques aux propriétaires */}
          {isOwner && (
            <>
              <Button 
                variant={activeTab === "equipment" ? "default" : "ghost"} 
                className="w-full justify-start text-sm"
                onClick={() => handleMenuClick("equipment")}
                size={isMobile ? "sm" : "default"}
              >
                <Truck className="h-4 w-4 mr-2" />
                Mes équipements
              </Button>
              
              <Button 
                variant={activeTab === "add-equipment" ? "default" : "ghost"} 
                className="w-full justify-start text-sm"
                onClick={() => handleMenuClick("add-equipment")}
                size={isMobile ? "sm" : "default"}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un équipement
              </Button>
              
              <Button 
                variant={activeTab === "subscription" ? "default" : "ghost"} 
                className="w-full justify-start text-sm relative"
                onClick={() => handleMenuClick("subscription")}
                size={isMobile ? "sm" : "default"}
              >
                <span className="mr-2">💎</span>
                Abonnement
                <Badge variant="secondary" className="ml-auto text-xs">
                  Nouveau
                </Badge>
              </Button>
              
              <Button 
                variant={activeTab === "bookings" ? "default" : "ghost"} 
                className="w-full justify-start text-sm"
                onClick={() => handleMenuClick("bookings")}
                size={isMobile ? "sm" : "default"}
              >
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Demandes reçues
              </Button>
            </>
          )}
          
          {/* Menus spécifiques aux locataires */}
          {!isOwner && (
            <>
              <Button 
                variant={activeTab === "rentals" ? "default" : "ghost"} 
                className="w-full justify-start text-sm"
                onClick={() => handleMenuClick("rentals")}
                size={isMobile ? "sm" : "default"}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Mes locations
              </Button>
              
              {/* Debug info pour locataire */}
              <div className="text-xs text-green-500 px-2">
                Mode Locataire actif
              </div>
            </>
          )}
          
          {/* Menus communs */}
          <Button 
            variant={activeTab === "contracts" ? "default" : "ghost"} 
            className="w-full justify-start text-sm"
            onClick={() => handleMenuClick("contracts")}
            size={isMobile ? "sm" : "default"}
          >
            <FileText className="h-4 w-4 mr-2" />
            Mes Contrats
          </Button>
          
          <Button 
            variant={activeTab === "wallet" ? "default" : "ghost"} 
            className="w-full justify-start text-sm"
            onClick={() => handleMenuClick("wallet")}
            size={isMobile ? "sm" : "default"}
          >
            <Wallet className="h-4 w-4 mr-2" />
            Portefeuille
          </Button>
          
          <Button 
            variant={activeTab === "history" ? "default" : "ghost"} 
            className="w-full justify-start text-sm"
            onClick={() => handleMenuClick("history")}
            size={isMobile ? "sm" : "default"}
          >
            <History className="h-4 w-4 mr-2" />
            Historique
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardSidebar;
