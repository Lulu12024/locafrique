
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Star, Heart, Eye, Shield, MessageSquare } from "lucide-react";
import { EquipmentData } from "@/types/supabase";
import { OwnerProfilePopup } from "@/components/owner/OwnerProfilePopup";

interface ModernFeatureCardProps {
  equipment: EquipmentData;
}

const ModernFeatureCard: React.FC<ModernFeatureCardProps> = ({ equipment }) => {
  const navigate = useNavigate();
  const [showOwnerPopup, setShowOwnerPopup] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const images = Array.isArray(equipment.images) ? equipment.images : [];
  const primaryImage = images.find(img => img.is_primary === true);
  const firstImage = images.length > 0 ? images[0] : null;
  const imageUrl = primaryImage?.image_url || firstImage?.image_url || "/placeholder.svg";

  const handleViewDetails = () => {
    navigate(`/equipments/details/${equipment.id}`);
  };

  const handleOwnerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOwnerPopup(true);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <>
      <Card 
        className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group border border-gray-200 bg-white"
        onClick={handleViewDetails}
      >
        <div className="relative">
          <div className="aspect-[4/3] overflow-hidden">
            <img 
              src={imageUrl} 
              alt={equipment.title} 
              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
          </div>
          
          {/* Actions overlay */}
          <div className="absolute top-3 right-3 space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="sm"
              variant="secondary"
              className="w-8 h-8 p-0 rounded-full bg-white/90 hover:bg-white shadow-sm"
              onClick={handleLikeClick}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
            </Button>
          </div>
          
          {/* Badge catégorie */}
          <div className="absolute top-3 left-3">
            <Badge className="bg-green-600 text-white text-xs px-2 py-1 rounded-md font-medium">
              {equipment.category}
            </Badge>
          </div>

          {/* Badge vérifié */}
          {equipment.owner && (
            <div className="absolute bottom-3 right-3 bg-white/90 p-1.5 rounded-full shadow-sm">
              <Shield className="h-3 w-3 text-green-600" />
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Titre */}
            <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-green-600 transition-colors">
              {equipment.title}
            </h3>
            
            {/* Localisation et note */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-500">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{equipment.city ? `${equipment.city}${equipment.country ? `, ${equipment.country}` : ''}` : equipment.country}</span>
              </div>
              <div className="flex items-center space-x-1 text-yellow-500">
                <Star className="h-3 w-3 fill-current" />
                <span className="text-xs font-medium text-gray-600">4.9</span>
              </div>
            </div>
            
            {/* Prix */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-lg text-gray-900">
                  {equipment.daily_price?.toLocaleString()} FCFA
                </span>
                <span className="text-sm text-gray-500 ml-1">/jour</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-400">
                <Eye className="h-4 w-4" />
                <span className="text-xs">{Math.floor(Math.random() * 50) + 10}</span>
              </div>
            </div>
            
            {/* Actions ligne */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              {/* Propriétaire */}
              {equipment.owner && (
                <div className="flex items-center space-x-2">
                  <Avatar 
                    className="h-6 w-6 cursor-pointer hover:ring-2 hover:ring-green-600 hover:ring-offset-1 transition-all"
                    onClick={handleOwnerClick}
                  >
                    <AvatarImage src={equipment.owner.avatar_url} />
                    <AvatarFallback className="text-xs bg-green-600 text-white">
                      {equipment.owner.first_name?.[0]}{equipment.owner.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-600 font-medium">
                    {equipment.owner.first_name} {equipment.owner.last_name}
                  </span>
                </div>
              )}
              
              {/* Action message */}
              <Button
                size="sm"
                variant="ghost"
                className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  // Action message
                }}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Owner Profile Popup */}
      {equipment.owner && (
        <OwnerProfilePopup
          owner={equipment.owner}
          isOpen={showOwnerPopup}
          onClose={() => setShowOwnerPopup(false)}
          equipmentCount={equipment.booking_count || 1}
        />
      )}
    </>
  );
};

export default ModernFeatureCard;
