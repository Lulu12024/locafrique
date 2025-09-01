
import React from "react";
import { Search, MessageSquare, Bell, Grid3X3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const LinkedInDashboardHeader: React.FC = () => {
  const { user, profile } = useAuth();

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo and Search */}
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">3W</span>
              </div>
            </div>
            
            {/* Search bar */}
            <div className="hidden md:flex relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Rechercher"
                className="pl-10 bg-gray-100 border-0 focus:bg-white focus:ring-1 focus:ring-green-600"
              />
            </div>
          </div>

          {/* Navigation Icons */}
          <div className="flex items-center space-x-6">
            <Button variant="ghost" size="sm" className="flex flex-col items-center p-2 hover:bg-gray-100">
              <Grid3X3 className="h-5 w-5 text-gray-600" />
              <span className="text-xs text-gray-600 mt-1">Accueil</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="flex flex-col items-center p-2 hover:bg-gray-100">
              <MessageSquare className="h-5 w-5 text-gray-600" />
              <span className="text-xs text-gray-600 mt-1">Messages</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="flex flex-col items-center p-2 hover:bg-gray-100 relative">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="text-xs text-gray-600 mt-1">Notifications</span>
              <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
            </Button>
            
            <Button variant="ghost" size="sm" className="flex flex-col items-center p-2 hover:bg-gray-100">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-600 mt-1">Moi</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default LinkedInDashboardHeader;
