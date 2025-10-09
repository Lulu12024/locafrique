import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Home, HelpCircle, UserPlus, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import AuthModal from "./AuthModal";
import ProfileDropdown from "./mobile/ProfileDropdown";
import DesktopProfileDropdown from "./desktop/ProfileDropdown";
import NotificationBell from "./NotificationBell";
import ReservationsDropdown from "./ReservationsDropdown";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading } = useAuth();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAuthClick = () => {
    setShowAuthModal(true);
  };

  // Navigation items avec traductions
  const navigationItems = [
    {
      id: 'home',
      label: t('nav.home'),
      icon: Home,
      path: '/',
    },
    {
      id: 'how-it-works',
      label: t('nav.howItWorks'),
      icon: HelpCircle,
      path: '/how-it-works',
    },
    {
      id: 'become-owner',
      label: t('nav.becomeOwner'),
      icon: UserPlus,
      path: '/become-owner',
    },
  ];

  if (loading) {
    return (
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {!isMobile && (
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">3W</span>
                </div>
                <span className="font-bold text-lg text-gray-900">3W-LOC</span>
              </Link>
            )}
            <LoadingSpinner size="sm" />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Navigation mobile */}
          {isMobile ? (
            <>
              {/* Logo mobile */}
              <Link 
                to="/" 
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">3W</span>
                </div>
                <span className="font-bold text-lg text-gray-900">3W-LOC</span>
              </Link>
              
              {/* Actions mobiles à droite */}
              <div className="flex items-center space-x-2">
                {user && (
                  <>
                    <ReservationsDropdown />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="relative hover:bg-gray-100 transition-colors"
                      onClick={() => navigate('/messaging')}
                    >
                      <MessageSquare className="h-5 w-5 text-gray-600" />
                    </Button>
                    {/* 🔔 AJOUT DES NOTIFICATIONS SUR MOBILE */}
                    <NotificationBell />
                  </>
                )}
                <ProfileDropdown />
              </div>
            </>
          ) : (
            <>
              {/* Logo sur desktop */}
              <Link 
                to="/" 
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 bg-green-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold">3W</span>
                </div>
                <span className="font-bold text-xl text-gray-900">3W-LOC</span>
              </Link>

              {/* Menu de navigation au centre sur desktop avec états actifs */}
              <div className="flex items-center space-x-6 lg:space-x-8">
                {navigationItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  
                  return (
                    <Link 
                      key={item.id}
                      to={item.path}
                      className={cn(
                        "flex items-center space-x-2 font-medium transition-all duration-200 px-3 py-2 rounded-lg",
                        isActive 
                          ? "text-green-600 bg-green-50 shadow-sm" 
                          : "text-gray-700 hover:text-green-600 hover:bg-gray-50"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden lg:inline">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Actions desktop à droite */}
              <div className="flex items-center space-x-3">
                {user && (
                  <>
                    <ReservationsDropdown />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="relative hover:bg-gray-100 transition-colors"
                      onClick={() => navigate('/messaging')}
                    >
                      <MessageSquare className="h-5 w-5 text-gray-600" />
                    </Button>
                    <NotificationBell />
                  </>
                )}
                {user ? (
                  <DesktopProfileDropdown />
                ) : (
                  <Button 
                    onClick={handleAuthClick}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"
                  >
                    {t('nav.login')}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
      />
    </nav>
  );
};

export default Navbar;