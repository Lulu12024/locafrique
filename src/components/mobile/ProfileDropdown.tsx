
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Settings, LogOut, LayoutDashboard, Package, Plus, Calendar, FileText, Wallet, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/auth';
import { useNavigate } from 'react-router-dom';
import AddEquipmentModal from '@/components/AddEquipmentModal';

const ProfileDropdown: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleAuthClick = () => {
    navigate('/auth');
    closeDropdown();
  };

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: t('menu.overview'),
      onClick: () => handleNavigation('/overview')
    },
    {
      icon: Package,
      label: t('menu.equipments'),
      onClick: () => handleNavigation('/my-equipments')
    },
    {
      icon: Plus,
      label: t('menu.addEquipment'),
      onClick: handleAddEquipment
    },
    {
      icon: Calendar,
      label: t('menu.bookings'),
      onClick: () => handleNavigation('/my-bookings')
    },
    {
      icon: FileText,
      label: t('menu.contracts'),
      onClick: () => handleNavigation('/my-contracts')
    },
    {
      icon: Wallet,
      label: t('menu.wallet'),
      onClick: () => handleNavigation('/my-wallet')
    },
    {
      icon: History,
      label: t('menu.history'),
      onClick: () => handleNavigation('/my-history')
    },
    {
      icon: Settings,
      label: t('menu.settings'),
      onClick: () => handleNavigation('/my-settings')
    }
  ];

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Profile Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={user ? toggleDropdown : handleAuthClick}
          className="relative p-2"
          aria-label={user ? "Menu profil" : t('menu.signIn')}
        >
          {user ? (
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-green-600 text-white text-sm">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <User className="h-6 w-6 text-gray-600" />
          )}
        </Button>

        {/* Dropdown Menu */}
        {isOpen && user && (
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
                <span>{t('menu.signOut')}</span>
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

export default ProfileDropdown;
