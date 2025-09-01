
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export function useMobileCapabilities() {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<'web' | 'ios' | 'android'>('web');

  useEffect(() => {
    const checkPlatform = () => {
      const isNativeApp = Capacitor.isNativePlatform();
      const currentPlatform = Capacitor.getPlatform() as 'web' | 'ios' | 'android';
      
      setIsNative(isNativeApp);
      setPlatform(currentPlatform);
    };

    checkPlatform();
  }, []);

  return {
    isNative,
    platform,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isWeb: platform === 'web'
  };
}
