// src/integrations/supabase/client-no-realtime.ts
// Version du client Supabase sans realtime pour éviter les problèmes WebSocket

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { Capacitor } from '@capacitor/core';

const SUPABASE_URL = "https://nvcgijtnwnbgxzuclbhy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52Y2dpanRud25iZ3h6dWNsYmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTM4MjEsImV4cCI6MjA3MjU4OTgyMX0.vybd5mCZUKZccLN2toyzz9z6yoQs0FXWEaYPb4S2nck";

// Configuration d'authentification
const getAuthConfig = () => {
  const isNative = Capacitor.isNativePlatform();
  
  return {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: !isNative,
  };
};

// Client Supabase sans realtime
export const supabaseNoRealtime = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY, 
  {
    auth: getAuthConfig(),
    db: {
      schema: 'public'
    },
    global: {
      headers: { 
        'X-Client-Info': `lovable-web-app-${Capacitor.getPlatform()}-no-realtime` 
      }
    },
    // Désactiver complètement realtime
    realtime: {
      params: {
        eventsPerSecond: 0 // Désactiver les événements
      }
    }
  }
);

// Client principal avec fallback
let primaryClient: ReturnType<typeof createClient<Database>>;

try {
  // Essayer d'importer le client normal
  const { supabase } = await import('./client');
  primaryClient = supabase;
} catch (error) {
  console.warn('Client Supabase standard non disponible, utilisation du fallback sans realtime:', error);
  primaryClient = supabaseNoRealtime;
}

export const supabase = primaryClient;

// Fonction pour vérifier la validité de la session
export const hasValidSession = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    return !!data.session && !error;
  } catch (e) {
    console.error("Exception lors de la vérification de la session:", e);
    return false;
  }
};