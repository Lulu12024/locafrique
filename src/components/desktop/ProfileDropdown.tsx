
import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, LayoutDashboard, Package, Plus, Calendar, FileText, Wallet, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/auth';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AddEquipmentModal from '@/components/AddEquipmentModal';

const DesktopProfileDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    closeDropdown();
  };

  const handleAddEquipment = () => {
    setShowAddEquipmentModal(true);
    closeDropdown();
  };

  const handleSignOut = async () => {
    await signOut();
    closeDropdown();
    navigate('/');
  };

  if (!user) return null;

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Vue d\'ensemble',
      onClick: () => handleNavigation('/overview')
    },
    {
      icon: Package,
      label: 'Mes annonces',
      onClick: () => handleNavigation('/my-equipments')
    },
    {
      icon: Plus,
      label: 'Publier une annonce',
      onClick: handleAddEquipment
    },
    {
      icon: Calendar,
      label: 'Mes locations',
      onClick: () => handleNavigation('/my-bookings')
    },
    {
      icon: FileText,
      label: 'Contrats',
      onClick: () => handleNavigation('/my-contracts')
    },
    {
      icon: Wallet,
      label: 'Portefeuille',
      onClick: () => handleNavigation('/my-wallet')
    },
    {
      icon: History,
      label: 'Historique',
      onClick: () => handleNavigation('/my-history')
    },
    {
      icon: Settings,
      label: 'Paramètres',
      onClick: () => handleNavigation('/my-settings')
    }
  ];

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Profile Button */}
        <Button 
          variant="ghost" 
          className="flex items-center space-x-2 hover:bg-gray-100 transition-colors rounded-lg px-3 py-2" 
          onClick={toggleDropdown}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-green-600 text-white text-sm">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <span className="text-gray-700 font-medium hidden lg:inline">{t('nav.profile')}</span>
        </Button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-green-600 text-white">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sign Out - Bien visible en bas */}
            <div className="border-t border-gray-100 py-2">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
              >
                <LogOut className="h-4 w-4" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Equipment Modal */}
      <AddEquipmentModal 
        isOpen={showAddEquipmentModal}
        onClose={() => setShowAddEquipmentModal(false)}
      />
    </>
  );
};

export default DesktopProfileDropdown;
