
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { Capacitor } from '@capacitor/core';

// const SUPABASE_URL = "https://eqvgbqxaefpkbfetubrt.supabase.co";
// const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxdmdicXhhZWZwa2JmZXR1YnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NDU5MjAsImV4cCI6MjA2MzMyMTkyMH0.1Az2gg7RGJW-zR9AItfKwZy1Sd3g3WqbUslJlu5TAbo";

const SUPABASE_URL = "https://nvcgijtnwnbgxzuclbhy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52Y2dpanRud25iZ3h6dWNsYmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTM4MjEsImV4cCI6MjA3MjU4OTgyMX0.vybd5mCZUKZccLN2toyzz9z6yoQs0FXWEaYPb4S2nck";

// Configuration spécifique pour mobile
const getStorageImplementation = () => {
  if (Capacitor.isNativePlatform()) {
    // Sur mobile natif, utiliser le localStorage standard
    return localStorage;
  }
  // Sur web, utiliser le localStorage standard aussi
  return localStorage;
};

export const supabaseMobile = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: getStorageImplementation(),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Désactiver pour éviter les problèmes sur mobile
  },
  realtime: {
    params: {
      eventsPerSecond: 1
    }
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: { 
      'X-Client-Info': `lovable-mobile-app-${Capacitor.getPlatform()}` 
    }
  }
});

// Fonction pour vérifier la connectivité réseau sur mobile
export const checkNetworkStatus = async (): Promise<boolean> => {
  try {
    if (Capacitor.isNativePlatform()) {
      // Sur mobile, on peut ajouter des checks de connectivité plus sophistiqués
      const response = await fetch(SUPABASE_URL + '/rest/v1/', { 
        method: 'HEAD'
      });
      return response.ok;
    }
    return true; // Sur web, on assume que la connexion est disponible
  } catch (error) {
    console.error('Erreur de connectivité:', error);
    return false;
  }
};
