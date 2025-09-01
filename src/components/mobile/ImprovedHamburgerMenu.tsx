
import React, { useState } from 'react';
import { Menu, X, User, Heart, Bell, Settings, LogOut, Home, Search, MessageCircle, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/auth/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';

const ImprovedHamburgerMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/');
  };

  const menuItems = [
    { icon: Home, label: 'Accueil', path: '/' },
    { icon: Search, label: 'Rechercher', path: '/search' },
    { icon: LayoutDashboard, label: 'Vue d\'ensemble', path: '/overview' },
    { icon: Heart, label: 'Favoris', path: '/favorites' },
    { icon: MessageCircle, label: 'Messages', path: '/messaging' },
    { 
      icon: Bell, 
      label: 'Notifications', 
      path: '/overview',
      badge: unreadCount > 0 ? unreadCount : undefined 
    },
    { icon: Settings, label: 'Paramètres', path: '/my-settings' },
  ];

  return (
    <>
      {/* Hamburger Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMenu}
        className="relative z-50"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-6 w-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16 border-2 border-white/20">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-white/20 text-white text-lg font-bold">
                    {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  {user ? (
                    <>
                      <h2 className="text-xl font-bold">
                        {profile?.first_name} {profile?.last_name}
                      </h2>
                      <p className="text-green-100 text-sm">
                        {profile?.user_type === 'proprietaire' ? 'Propriétaire' : 'Locataire'}
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold">Bienvenue</h2>
                      <p className="text-green-100 text-sm">Connectez-vous pour continuer</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <nav className="p-4">
              <div className="space-y-2">
                {menuItems.map((item, index) => (
                  <motion.button
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleNavigation(item.path)}
                    className="w-full flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-green-100 transition-colors">
                      <item.icon className="h-5 w-5 text-gray-600 group-hover:text-green-600" />
                    </div>
                    <span className="font-medium text-gray-900 flex-1 text-left">
                      {item.label}
                    </span>
                    {item.badge && (
                      <Badge variant="destructive" className="ml-auto">
                        {item.badge > 9 ? '9+' : item.badge}
                      </Badge>
                    )}
                  </motion.button>
                ))}
              </div>
            </nav>

            {/* Auth Section */}
            <div className="p-4 border-t border-gray-200 mt-auto">
              {user ? (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-4 p-3 rounded-xl hover:bg-red-50 text-red-600 transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors">
                    <LogOut className="h-5 w-5" />
                  </div>
                  <span className="font-medium flex-1 text-left">
                    Déconnexion
                  </span>
                </motion.button>
              ) : (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  onClick={() => handleNavigation('/auth')}
                  className="w-full flex items-center space-x-4 p-3 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-colors"
                >
                  <div className="p-2 rounded-lg bg-white/20">
                    <User className="h-5 w-5" />
                  </div>
                  <span className="font-medium flex-1 text-left">
                    Se connecter
                  </span>
                </motion.button>
              )}
            </div>

            {/* Brand */}
            <div className="p-4 text-center border-t border-gray-200">
              <div className="text-green-600 font-bold text-lg">3W-LOC</div>
              <p className="text-xs text-gray-500">Location d'équipements</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ImprovedHamburgerMenu;
