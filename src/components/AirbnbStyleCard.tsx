import React from 'react';
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
  const averageRating = (equipment as any).averageRating || 0;
  const reviewCount = (equipment as any).reviewCount || 0;

  // ✅ Unité basée sur price_type uniquement
  const priceUnit = equipment.price_type === 'monthly' ? 'mois' : 'jour';

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

  const images = Array.isArray(equipment.images) ? equipment.images : [];
  const primaryImage = images.find(img => img.is_primary) || images[0];
  const imageUrl = primaryImage?.image_url || "/placeholder.svg";

  return (
    <div 
      className={`cursor-pointer group ${isMobile ? 'w-full' : 'w-full'}`}
      onClick={handleClick}
    >
      <div className={`relative overflow-hidden rounded-xl ${isMobile ? 'aspect-square' : 'aspect-[4/3]'}`}>
        <img 
          src={imageUrl} 
          alt={equipment.title} 
          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg";
          }}
        />
        
        <button
          onClick={handleFavoriteClick}
          className={`absolute ${isMobile ? 'top-1.5 right-1.5 w-6 h-6' : 'top-2 right-2 w-6 h-6'} bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors`}
        >
          <Heart 
            className={`${isMobile ? 'h-3 w-3' : 'h-3 w-3'} ${isEquipmentFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
          />
        </button>

        {equipment.category && (
          <div className={`absolute ${isMobile ? 'top-1.5 left-1.5' : 'top-2 left-2'}`}>
            <Badge className={`bg-green-500 text-white ${isMobile ? 'text-xs px-1.5 py-0.5' : 'text-xs px-1.5 py-0.5'}`}>
              {equipment.category}
            </Badge>
          </div>
        )}
      </div>

      <div className={`${isMobile ? 'p-2' : 'p-2'}`}>
        <div className="flex items-center justify-between mb-1">
          <h3 className={`font-medium text-gray-900 truncate flex-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
            {equipment.title}
          </h3>
          {reviewCount > 0 ? (
            <div className="flex items-center space-x-1 ml-1">
              <Star className={`${isMobile ? 'h-2.5 w-2.5' : 'h-2.5 w-2.5'} fill-current text-gray-900`} />
              <span className={`text-gray-900 font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}>
                {averageRating}
              </span>
              <span className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                ({reviewCount})
              </span>
            </div>
          ) : (
            <span className={`text-gray-500 ml-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
              Aucun avis
            </span>
          )}
        </div>

        <div className={`text-gray-500 mb-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
          {equipment.city ? `${equipment.city}${equipment.country ? `, ${equipment.country}` : ''}` : equipment.country}
        </div>

        <div className="flex items-baseline space-x-1">
          <span className={`font-semibold text-gray-900 ${isMobile ? 'text-xs' : 'text-xs'}`}>
            {equipment.daily_price?.toLocaleString()} FCFA
          </span>
          <span className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-xs'}`}>
            par {priceUnit}
          </span>
        </div>

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