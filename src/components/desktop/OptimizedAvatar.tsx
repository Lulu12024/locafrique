import React, { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
const imageCache = new Map<string, string>();

interface OptimizedAvatarProps {
  src?: string | null;  // ✅ Ajouter null
  fallback: string;
  className?: string;
}

// ✅ Fonction pour obtenir l'URL publique Supabase
const getSupabaseUrl = (path?: string | null): string | null => {
  if (!path) {
    console.log('❌ Pas de path fourni');
    return null;
  }

  console.log('📸 Path reçu:', path);

  // Si déjà une URL complète
  if (path.startsWith('http')) {
    console.log('✅ URL complète détectée');
    return path;
  }

  // Construire l'URL publique Supabase
  const { data } = supabase.storage
    .from('profile-images') // ✅ Remplacez par le nom de votre bucket
    .getPublicUrl(path);

  console.log('🌐 URL Supabase générée:', data.publicUrl);
  return data.publicUrl;
};

export const OptimizedAvatar: React.FC<OptimizedAvatarProps> = ({ 
  src, 
  fallback, 
  className 
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 OptimizedAvatar monté avec src:', src);

    const fullUrl = getSupabaseUrl(src);
    
    if (!fullUrl) {
      console.log('⚠️ Pas d\'URL, affichage du fallback');
      setLoading(false);
      return;
    }

    // Vérifier le cache
    if (imageCache.has(fullUrl)) {
      console.log('⚡ Image trouvée dans le cache');
      setImageSrc(imageCache.get(fullUrl)!);
      setLoading(false);
      return;
    }

    console.log('📥 Préchargement de l\'image depuis:', fullUrl);

    // Précharger l'image
    const img = new Image();
    img.onload = () => {
      console.log('✅ Image chargée avec succès');
      imageCache.set(fullUrl, fullUrl);
      setImageSrc(fullUrl);
      setLoading(false);
    };
    img.onerror = (e) => {
      console.error('❌ Erreur de chargement:', e);
      setLoading(false);
    };
    img.src = fullUrl;

    // Timeout de sécurité
    const timeout = setTimeout(() => {
      console.log('⏱️ Timeout - affichage du fallback');
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [src]);

  return (
    <Avatar className={className}>
      {!loading && imageSrc && <AvatarImage src={imageSrc} />}
      <AvatarFallback className="bg-green-600 text-white">
        {fallback}
      </AvatarFallback>
    </Avatar>
  );
};