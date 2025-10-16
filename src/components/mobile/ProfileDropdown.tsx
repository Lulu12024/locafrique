// src/components/mobile/ProfileDropdown.tsx
// VERSION CORRIGÉE - Affiche le menu propriétaire sur mobile

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/auth';
import { 
  LayoutDashboard, 
  Package, 
  Plus, 
  Calendar, 
  FileText, 
  Wallet, 
  History, 
  Settings,
  LogOut,
  User,
  ClipboardCheck,
  ShoppingCart,
  Bell
} from 'lucide-react';
import AddEquipmentModal from '../AddEquipmentModal';

const ProfileDropdown: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

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
    console.log('🔧 Ouverture modal ajout équipement (mobile)');
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

  // ✅ MENU UNIVERSEL - IDENTIQUE POUR TOUS
  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Vue d'ensemble",
      onClick: () => handleNavigation('/overview')
    },
    {
      icon: Package,
      label: "Mes annonces",
      onClick: () => handleNavigation('/my-equipments')
    },
    {
      icon: Plus,
      label: "Publier une annonce",
      onClick: handleAddEquipment
    },
    {
      icon: ClipboardCheck,
      label: "Demandes reçues",
      onClick: () => handleNavigation('/my-bookings')
    },
    {
      icon: ShoppingCart,
      label: "Mes locations",
      onClick: () => handleNavigation('/my-rentals')
    },
    {
      icon: History,
      label: "Historique",
      onClick: () => handleNavigation('/my-history')
    },
    {
      icon: Settings,
      label: "Paramètres",
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
              <AvatarFallback className="bg-green-600 text-white text-xs">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <User className="h-5 w-5" />
          )}
        </Button>

        {/* Dropdown Menu */}
        {isOpen && user && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
            {/* Profile Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-green-600 text-white">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                  {/* Badge du type d'utilisateur */}
                  <p className="text-xs text-green-600 font-medium mt-1">
                    {profile?.user_type === 'proprietaire' ? 'Propriétaire' : 'Locataire'}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                >
                  <item.icon className="h-4 w-4 text-gray-500" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Sign Out */}
            <div className="border-t border-gray-100 pt-2">
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add Equipment */}
      {showAddEquipmentModal && (
        <AddEquipmentModal 
          isOpen={showAddEquipmentModal}
          onClose={() => setShowAddEquipmentModal(false)}
        />
      )}
    </>
  );
};

export default ProfileDropdown;