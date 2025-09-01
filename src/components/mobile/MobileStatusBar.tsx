import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useMobileCapabilities } from '@/hooks/useMobileCapabilities';

interface MobileStatusBarProps {
  backgroundColor?: string;
  style?: 'light' | 'dark';
}

export function MobileStatusBar({ 
  backgroundColor = '#ffffff', 
  style = 'dark' 
}: MobileStatusBarProps) {
  const { isNative, isIOS } = useMobileCapabilities();

  useEffect(() => {
    if (!isNative) return;

    const setupStatusBar = async () => {
      try {
        // Configurer le style de la status bar
        await StatusBar.setStyle({ 
          style: style === 'light' ? Style.Light : Style.Dark 
        });

        // Configurer la couleur de fond (Android uniquement)
        if (!isIOS) {
          await StatusBar.setBackgroundColor({ color: backgroundColor });
        }

        // Afficher la status bar
        await StatusBar.show();
      } catch (error) {
        console.error('Erreur lors de la configuration de la status bar:', error);
      }
    };

    setupStatusBar();
  }, [isNative, isIOS, backgroundColor, style]);

  // Ce composant ne rend rien, il configure seulement la status bar
  return null;
}