
import React from "react";
import { Button } from "@/components/ui/button";
import { Menu, Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/auth";

interface MobileDashboardHeaderProps {
  onMenuToggle: () => void;
}

const MobileDashboardHeader: React.FC<MobileDashboardHeaderProps> = ({ onMenuToggle }) => {
  const { user, profile } = useAuth();

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 md:hidden shadow-sm">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Menu Button - Improved touch target */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onMenuToggle}
            className="p-3 hover:bg-gray-100 rounded-full -ml-1"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-6 w-6 text-gray-700" />
          </Button>

          {/* Logo - Compact for mobile */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">3W</span>
            </div>
            <span className="font-semibold text-lg text-gray-900 hidden xs:block">Dashboard</span>
          </div>

          {/* Profile Section - Improved for mobile */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 relative hover:bg-gray-100 rounded-full"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-gray-600" />
              <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
            </Button>
            <Avatar className="h-9 w-9 border-2 border-gray-100">
              <AvatarFallback className="bg-green-600 text-white text-sm font-medium">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
};

export default MobileDashboardHeader;
