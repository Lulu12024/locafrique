
import React from 'react';
import { useMobileCapabilities } from '@/hooks/useMobileCapabilities';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileLayout({ children, className }: MobileLayoutProps) {
  const { isNative, platform } = useMobileCapabilities();
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      "min-h-screen bg-background",
      // Ajustements spécifiques pour mobile natif
      isNative && "pt-safe-top",
      // Ajustements spécifiques par plateforme
      platform === 'ios' && "supports-[padding:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)]",
      platform === 'android' && "supports-[padding:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)]",
      className
    )}>
      {children}
    </div>
  );
}
