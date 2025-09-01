
import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, MessageSquare, Settings, Crown, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/auth";
import { useUserRoles } from "@/hooks/auth/useUserRoles";
import { Link, useNavigate } from "react-router-dom";
import ReservationsDropdown from "@/components/ReservationsDropdown";

interface DashboardNavbarProps {
  onMenuClick?: (menu: string) => void;
}

const DashboardNavbar: React.FC<DashboardNavbarProps> = ({ onMenuClick }) => {
  const { user, profile, signOut } = useAuth();
  const { isProprietaire } = useUserRoles(profile);
  const navigate = useNavigate();

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const handleMenuClick = (menu: string) => {
    console.log("🔧 DashboardNavbar - Menu clicked:", menu);
    if (onMenuClick) {
      onMenuClick(menu);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log("Déconnexion en cours...");
      await signOut();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white font-bold">3W</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Dashboard</span>
          </Link>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <ReservationsDropdown />
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative hover:bg-gray-100 transition-colors"
              onClick={() => navigate('/messaging')}
            >
              <MessageSquare className="h-5 w-5 text-gray-600" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative hover:bg-gray-100 transition-colors"
              onClick={() => handleMenuClick("notifications")}
            >
              <Bell className="h-5 w-5 text-gray-600" />
              <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
            </Button>

            {/* Bouton Pro - seulement pour les propriétaires */}
            {isProprietaire && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 border border-yellow-200 transition-all"
                onClick={() => handleMenuClick("subscription")}
              >
                <Crown className="h-5 w-5 text-yellow-600" />
                <span className="text-xs text-yellow-700 ml-1 hidden sm:inline">Pro</span>
              </Button>
            )}

            <Button 
              variant="ghost" 
              size="sm" 
              className="relative hover:bg-gray-100 transition-colors"
              onClick={() => handleMenuClick("profile")}
            >
              <Settings className="h-5 w-5 text-gray-600" />
            </Button>

            {/* Bouton de déconnexion */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
            </Button>

            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-green-600 text-white text-sm">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;
