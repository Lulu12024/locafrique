
import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth";
import { useUserRoles } from "@/hooks/auth/useUserRoles";
import { X, LogOut, Crown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  BarChart3,
  Truck,
  Plus,
  ClipboardCheck,
  ShoppingCart,
  FileText,
  Wallet,
  History,
  Settings,
} from "lucide-react";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ 
  isOpen, 
  onClose, 
  activeTab, 
  setActiveTab 
}) => {
  const { profile, user, signOut } = useAuth();
  const { isProprietaire } = useUserRoles(profile);

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const menuItems = [
    { id: "stats", label: "Vue d'ensemble", icon: BarChart3, show: true },
    ...(isProprietaire ? [
      { id: "equipment", label: "Mes équipements", icon: Truck, show: true },
      { id: "add-equipment", label: "Ajouter équipement", icon: Plus, show: true },
      { id: "bookings", label: "Réservations", icon: ClipboardCheck, show: true },
    ] : [
      { id: "rentals", label: "Mes locations", icon: ShoppingCart, show: true },
    ]),
    { id: "contracts", label: "Contrats", icon: FileText, show: true },
    { id: "wallet", label: "Portefeuille", icon: Wallet, show: true },
    { id: "history", label: "Historique", icon: History, show: true },
    { id: "profile", label: "Paramètres", icon: Settings, show: true },
  ];

  const handleMenuClick = (tabId: string) => {
    setActiveTab(tabId);
    onClose();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Enhanced Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Enhanced Sidebar */}
      <div className="fixed top-0 left-0 h-full w-[320px] max-w-[85vw] bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden shadow-2xl">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 p-6 text-white relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]"></div>
          
          {/* Close button - Better positioning */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 w-10 h-10 p-0 rounded-full border border-white/20 backdrop-blur-sm"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </Button>
          
          <div className="relative z-10 pr-12">
            <div className="flex items-center space-x-4 mb-4">
              <Avatar className="h-16 w-16 border-3 border-white/30 shadow-lg">
                <AvatarFallback className="bg-white/20 text-white text-lg font-bold backdrop-blur-sm">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-1 leading-tight">
                  {profile?.first_name} {profile?.last_name}
                </h2>
                <div className="flex items-center space-x-2">
                  <p className="text-green-100 text-sm font-medium">
                    {profile?.user_type === 'proprietaire' ? 'Propriétaire' : 'Locataire'}
                  </p>
                  {isProprietaire && (
                    <Crown className="h-4 w-4 text-yellow-300" />
                  )}
                </div>
              </div>
            </div>

            {/* Brand footer in header */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">3W</span>
                </div>
                <span className="text-white font-bold text-sm">Dashboard</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Menu Items */}
        <div className="flex-1 overflow-y-auto bg-white">
          <nav className="p-4">
            <div className="space-y-1">
              {menuItems.filter(item => item.show).map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`w-full justify-start h-14 px-4 rounded-xl transition-all duration-200 ${
                    activeTab === item.id 
                      ? 'bg-green-50 text-green-700 shadow-sm border border-green-200 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => handleMenuClick(item.id)}
                >
                  <item.icon className={`h-5 w-5 mr-4 ${
                    activeTab === item.id ? 'text-green-600' : 'text-gray-500'
                  }`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Button>
              ))}
            </div>
          </nav>

          {/* Enhanced Sign Out */}
          <div className="p-4 border-t border-gray-100 mt-4">
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start h-14 px-4 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all duration-200"
            >
              <LogOut className="h-5 w-5 mr-4" />
              <span className="text-sm font-medium">Déconnexion</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;
