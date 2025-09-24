import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/auth';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

export function MobileBottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user , profile  } = useAuth();

  const navItems: NavItem[] = [
    {
      id: 'home',
      label: t('nav.home', 'Accueil'),
      icon: Home,
      path: '/'
    },
    {
      id: 'explore',
      label: t('nav.explore', 'Explorer'),
      icon: Search,
      path: '/search'
    },
    {
      id: 'profile',
      label: t('nav.profile', 'Profil'),
      icon: User,
      path: user && profile?.id ? `/owner/profile/${profile.id}` : '/auth'
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-1 min-w-0 flex-1 transition-colors duration-200",
                "touch-manipulation"
              )}
            >
              <div className={cn(
                "flex flex-col items-center space-y-1",
                active ? "text-primary" : "text-gray-600"
              )}>
                <Icon className={cn(
                  "h-6 w-6 transition-colors",
                  active ? "text-primary" : "text-gray-600"
                )} />
                <span className={cn(
                  "text-xs font-medium",
                  active ? "text-primary" : "text-gray-600"
                )}>
                  {item.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}