
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth";
import { useUserRoles } from "@/hooks/auth/useUserRoles";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Crown } from "lucide-react";
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

interface LinkedInSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const LinkedInSidebar: React.FC<LinkedInSidebarProps> = ({ activeTab, setActiveTab }) => {
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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  return (
    <div className="h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Profile Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-green-600 text-white font-bold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {profile?.first_name} {profile?.last_name}
            </h2>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-600">
                {profile?.user_type === 'proprietaire' ? 'Propriétaire' : 'Locataire'}
              </p>
              {isProprietaire && (
                <Crown className="h-4 w-4 text-yellow-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-1">
          {menuItems.filter(item => item.show).map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={`w-full justify-start h-11 px-4 rounded-lg transition-all ${
                activeTab === item.id 
                  ? 'bg-green-50 text-green-700 shadow-sm border border-green-200' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon className="h-5 w-5 mr-3" />
              <span className="text-sm font-medium">{item.label}</span>
            </Button>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full justify-start h-11 px-4 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg"
        >
          <LogOut className="h-5 w-5 mr-3" />
          <span className="text-sm font-medium">Déconnexion</span>
        </Button>
      </div>
    </div>
  );
};

export default LinkedInSidebar;
