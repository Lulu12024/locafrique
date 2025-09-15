// VERSION SIMPLIFIÉE - Correction rapide pour AirbnbStyleCard.tsx
// Remplace seulement les parties qui utilisent Math.random()

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EquipmentData } from '@/types/supabase';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFavorites } from '@/hooks/useFavorites';

interface AirbnbStyleCardProps {
  equipment: EquipmentData;
}

const AirbnbStyleCard: React.FC<AirbnbStyleCardProps> = ({ equipment }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  
  const isEquipmentFavorite = isFavorite(equipment.id);

  // Générer des données cohérentes basées sur l'ID de l'équipement (ne changent jamais)
  const stableData = useMemo(() => {
    // Créer un hash stable basé sur l'ID
    const hash = equipment.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    // Générer une note stable entre 3.8 et 5.0
    const rating = (Math.abs(hash % 24) / 20) + 3.8;
    
    // Générer un nombre d'avis stable
    const reviewCount = Math.abs(hash % 50) + 5;
    
    // Générer des dates stables basées sur la création
    const createdAt = new Date(equipment.created_at);
    const startOffset = Math.abs(hash % 30); // Entre 0 et 30 jours
    const duration = Math.abs(hash % 20) + 7; // Entre 7 et 27 jours
    
    const startDate = new Date(createdAt.getTime() + (startOffset * 24 * 60 * 60 * 1000));
    const endDate = new Date(startDate.getTime() + (duration * 24 * 60 * 60 * 1000));
    
    return {
      rating: parseFloat(rating.toFixed(1)),
      reviewCount,
      startDate,
      endDate
    };
  }, [equipment.id, equipment.created_at]);

  const handleClick = () => {
    navigate(`/equipments/details/${equipment.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEquipmentFavorite) {
      removeFromFavorites(equipment.id);
    } else {
      addToFavorites(equipment.id);
    }
  };

  // Gestion des images
  const images = Array.isArray(equipment.images) ? equipment.images : [];
  const primaryImage = images.find(img => img.is_primary) || images[0];
  const imageUrl = primaryImage?.image_url || "/placeholder.svg";

  // Formatage des dates
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  return (
    <div 
      className={`cursor-pointer group ${isMobile ? 'w-full' : 'w-full'}`}
      onClick={handleClick}
    >
      {/* Image container */}
      <div className={`relative overflow-hidden rounded-xl ${isMobile ? 'aspect-square' : 'aspect-[4/3]'}`}>
        <img 
          src={imageUrl} 
          alt={equipment.title} 
          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg";
          }}
        />
        
        {/* Favorite button */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute ${isMobile ? 'top-1.5 right-1.5 w-6 h-6' : 'top-2 right-2 w-6 h-6'} bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors`}
        >
          <Heart 
            className={`${isMobile ? 'h-3 w-3' : 'h-3 w-3'} ${isEquipmentFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
          />
        </button>

        {/* Category badge */}
        {equipment.category && (
          <div className={`absolute ${isMobile ? 'top-1.5 left-1.5' : 'top-2 left-2'}`}>
            <Badge className={`bg-green-500 text-white ${isMobile ? 'text-xs px-1.5 py-0.5' : 'text-xs px-1.5 py-0.5'}`}>
              {equipment.category}
            </Badge>
          </div>
        )}

        {/* Status indicator */}
        {equipment.status !== 'disponible' && (
          <div className={`absolute ${isMobile ? 'bottom-1.5 left-1.5' : 'bottom-2 left-2'}`}>
            <Badge className={`bg-red-500 text-white ${isMobile ? 'text-xs px-1.5 py-0.5' : 'text-xs px-1.5 py-0.5'}`}>
              {equipment.status === 'loue' ? 'Loué' : 'Indisponible'}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`${isMobile ? 'p-2' : 'p-2'}`}>
        {/* Title and rating - CORRIGÉ */}
        <div className="flex items-center justify-between mb-1">
          <h3 className={`font-medium text-gray-900 truncate flex-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
            {equipment.title}
          </h3>
          <div className="flex items-center space-x-1 ml-1">
            <Star className={`${isMobile ? 'h-2.5 w-2.5' : 'h-2.5 w-2.5'} fill-current text-gray-900`} />
            <span className={`text-gray-900 font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}>
              {stableData.rating}
            </span>
            <span className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-xs'}`}>
              ({stableData.reviewCount})
            </span>
          </div>
        </div>

        {/* Location */}
        <div className={`text-gray-500 mb-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
          {equipment.city ? `${equipment.city}${equipment.country ? `, ${equipment.country}` : ''}` : equipment.country}
        </div>

        {/* Dates - CORRIGÉ */}
        <div className={`text-gray-500 mb-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
          {formatDate(stableData.startDate)} - {formatDate(stableData.endDate)}
        </div>

        {/* Price */}
        <div className="flex items-baseline space-x-1">
          <span className={`font-semibold text-gray-900 ${isMobile ? 'text-xs' : 'text-xs'}`}>
            {equipment.daily_price?.toLocaleString()} FCFA
          </span>
          <span className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-xs'}`}>
            par jour
          </span>
        </div>

        {/* Additional info */}
        {equipment.condition && (
          <div className={`text-gray-400 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
            État: {equipment.condition}
          </div>
        )}
      </div>
    </div>
  );
};

export default AirbnbStyleCard;