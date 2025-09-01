
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Star } from "lucide-react";
import { EquipmentData } from "@/types/supabase";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFavorites } from "@/hooks/useFavorites";

interface AirbnbStyleCardProps {
  equipment: EquipmentData;
}

const AirbnbStyleCard: React.FC<AirbnbStyleCardProps> = ({ equipment }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();

  // Handle images array safely
  const images = Array.isArray(equipment.images) ? equipment.images : [];
  const primaryImage = images.find(img => img.is_primary === true);
  const firstImage = images.length > 0 ? images[0] : null;
  const imageUrl = primaryImage?.image_url || firstImage?.image_url || "/placeholder.svg";

  const handleViewDetails = () => {
    console.log('🔍 [MOBILE DEBUG] Navigation vers les détails de l\'équipement');
    console.log('📱 [MOBILE DEBUG] Est mobile:', isMobile);
    console.log('🆔 [MOBILE DEBUG] ID de l\'équipement:', equipment.id);
    console.log('📦 [MOBILE DEBUG] Données complètes de l\'équipement:', equipment);
    console.log('🔗 [MOBILE DEBUG] URL de navigation qui sera utilisée:', `/equipments/details/${equipment.id}`);
    
    if (!equipment.id) {
      console.error('❌ [MOBILE DEBUG] ID d\'équipement manquant!', equipment);
      alert('Erreur: ID d\'équipement manquant');
      return;
    }
    
    // Vérifier le format UUID avant navigation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(equipment.id)) {
      console.error('❌ [MOBILE DEBUG] Format UUID invalide:', equipment.id);
      alert(`Erreur: Format UUID invalide: ${equipment.id}`);
      return;
    }
    
    console.log('✅ [MOBILE DEBUG] Navigation en cours...');
    navigate(`/equipments/details/${equipment.id}`);
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const isCurrentlyFavorite = isFavorite(equipment.id);
    
    if (isCurrentlyFavorite) {
      await removeFromFavorites(equipment.id);
    } else {
      await addToFavorites(equipment.id);
    }
  };

  const isEquipmentFavorite = isFavorite(equipment.id);

  return (
    <div 
      className="bg-white rounded-xl overflow-hidden cursor-pointer group"
      onClick={handleViewDetails}
    >
      {/* Image container - Taille réduite */}
      <div className={`relative overflow-hidden ${isMobile ? 'aspect-square' : 'aspect-[4/3]'}`}>
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
      </div>

      {/* Content - Réduit encore plus */}
      <div className={`${isMobile ? 'p-2' : 'p-2'}`}>
        {/* Location and rating */}
        <div className="flex items-center justify-between mb-1">
          <h3 className={`font-medium text-gray-900 truncate flex-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
            {equipment.title}
          </h3>
          <div className="flex items-center space-x-1 ml-1">
            <Star className={`${isMobile ? 'h-2.5 w-2.5' : 'h-2.5 w-2.5'} fill-current text-gray-900`} />
            <span className={`text-gray-900 font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}>
              {(4.0 + Math.random()).toFixed(1)}
            </span>
          </div>
        </div>

        {/* Location */}
        <div className={`text-gray-500 mb-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
          {equipment.city ? `${equipment.city}${equipment.country ? `, ${equipment.country}` : ''}` : equipment.country}
        </div>

        {/* Dates (simulé) */}
        <div className={`text-gray-500 mb-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
          {new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'short' 
          })} - {new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000 + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'short' 
          })}
        </div>

        {/* Price */}
        <div className="flex items-baseline space-x-1">
          <span className={`font-semibold text-gray-900 ${isMobile ? 'text-xs' : 'text-xs'}`}>
            {equipment.daily_price?.toLocaleString()} FCFA
          </span>
          <span className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-xs'}`}>par jour</span>
        </div>
      </div>
    </div>
  );
};

export default AirbnbStyleCard;
