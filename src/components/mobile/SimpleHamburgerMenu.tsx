
import React, { useState } from 'react';
import { Menu, X, Home, HelpCircle, UserPlus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const SimpleHamburgerMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleNavigation = (path: string) => {
    navigate(path);
    closeMenu();
  };

  const menuItems = [
    { icon: Home, label: 'Accueil', path: '/' },
    { icon: HelpCircle, label: 'Comment ça marche', path: '/how-it-works' },
    { icon: UserPlus, label: 'Devenir propriétaire', path: '/become-owner' },
    { icon: Search, label: 'Rechercher', path: '/search' },
  ];

  return (
    <>
      {/* Hamburger Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMenu}
        className="relative z-[100] p-2"
        aria-label="Menu"
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[90] backdrop-blur-sm"
          onClick={closeMenu}
        />
      )}

      {/* Menu Panel */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-[95] transform transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Header */}
        <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]"></div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMenu}
            className="absolute top-3 right-3 text-white hover:bg-white/30 bg-white/10 rounded-full w-10 h-10 z-10 border border-white/20"
            aria-label="Fermer le menu"
          >
            <X className="h-6 w-6 font-bold" />
          </Button>
          
          <div className="relative z-10 pr-12">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center border border-white/30">
                <span className="text-white font-bold text-lg">3W</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white drop-shadow-sm">3W-LOC</h2>
                <p className="text-green-100 text-sm">Menu de navigation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white flex-1 overflow-y-auto">
          <nav className="p-4">
            <div className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className="w-full flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group bg-white"
                >
                  <div className="p-3 rounded-xl bg-gray-50 group-hover:bg-green-50 transition-colors duration-200">
                    <item.icon className="h-6 w-6 text-gray-600 group-hover:text-green-600 transition-colors duration-200" />
                  </div>
                  <span className="font-medium text-gray-900 flex-1 text-left text-lg">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </nav>

          {/* Brand Footer */}
          <div className="p-4 text-center border-t border-gray-100 bg-gray-50">
            <div className="text-green-600 font-bold text-lg">3W-LOC</div>
            <p className="text-xs text-gray-500">Location d'équipements</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SimpleHamburgerMenu;
