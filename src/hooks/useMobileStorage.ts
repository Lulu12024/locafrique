
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export function useMobileStorage() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeStorage = async () => {
      if (Capacitor.isNativePlatform()) {
        // Sur mobile natif, on peut implémenter des optimisations spécifiques
        console.log('Initialisation du storage mobile sur:', Capacitor.getPlatform());
      }
      setIsReady(true);
    };

    initializeStorage();
  }, []);

  const setItem = async (key: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const getItem = async (key: string): Promise<string | null> => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Erreur lors de la lecture:', error);
      return null;
    }
  };

  const removeItem = async (key: string): Promise<void> => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  return {
    isReady,
    setItem,
    getItem,
    removeItem
  };
}
