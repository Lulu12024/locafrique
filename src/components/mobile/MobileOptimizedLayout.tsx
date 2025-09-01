import React from 'react';
import { useMobileCapabilities } from '@/hooks/useMobileCapabilities';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { MobileStatusBar } from './MobileStatusBar';
import { MobileBottomNavigation } from './MobileBottomNavigation';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  className?: string;
  statusBarStyle?: 'light' | 'dark';
  statusBarBackgroundColor?: string;
}

export function MobileOptimizedLayout({ 
  children, 
  className, 
  statusBarStyle = 'dark',
  statusBarBackgroundColor = '#ffffff'
}: MobileOptimizedLayoutProps) {
  const { isNative, platform } = useMobileCapabilities();
  const isMobile = useIsMobile();

  return (
    <>
      {/* Configuration de la status bar pour mobile natif */}
      <MobileStatusBar 
        style={statusBarStyle}
        backgroundColor={statusBarBackgroundColor}
      />
      
      <div className={cn(
        "min-h-screen bg-background",
        // Ajustements spécifiques pour mobile natif
        isNative && "pt-safe-top",
        // Ajustements spécifiques par plateforme
        platform === 'ios' && [
          "supports-[padding:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)]"
        ],
        platform === 'android' && [
          "supports-[padding:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)]"
        ],
        // Optimisations tactiles pour mobile
        isMobile && [
          "touch-manipulation",
          "mobile-transition",
          "pb-16" // Espace pour la navigation bottom
        ],
        className
      )}>
        {children}
        
        {/* Navigation mobile en bas */}
        {isMobile && <MobileBottomNavigation />}
      </div>
    </>
  );
}