
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, User, Eye, Shield } from "lucide-react";
import { EquipmentData } from "@/types/supabase";
import { OwnerProfilePopup } from "@/components/owner/OwnerProfilePopup";

// Original FeatureCardProps kept for backward compatibility
interface FeatureCardProps {
  icon?: string;
  title?: string;
  description?: string;
  color?: string;
  equipment?: EquipmentData;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  color,
  equipment,
}) => {
  const navigate = useNavigate();
  const [showOwnerPopup, setShowOwnerPopup] = useState(false);

  // If equipment is provided, use that data with design optimized for 2-column layout
  if (equipment) {
    // Handle images array safely with improved debugging
    const images = Array.isArray(equipment.images) ? equipment.images : [];
    console.log("🎨 Rendu carte pour équipement:", equipment.title);
    console.log("🖼️ Images disponibles:", images);
    
    // Find primary image first, then fallback to first image, then placeholder
    const primaryImage = images.find(img => img.is_primary === true);
    const firstImage = images.length > 0 ? images[0] : null;
    const imageUrl = primaryImage?.image_url || firstImage?.image_url || "/placeholder.svg";
    
    console.log("🖼️ Image sélectionnée pour", equipment.title, ":", {
      primaryImage: primaryImage?.image_url,
      firstImage: firstImage?.image_url,
      finalUrl: imageUrl
    });

    const handleViewDetails = () => {
      navigate(`/equipments/details/${equipment.id}`);
    };

    const handleOwnerClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent card click
      setShowOwnerPopup(true);
    };

    return (
      <>
        <div 
          className="bg-white rounded-lg overflow-hidden shadow-sm border hover:shadow-md transition-all cursor-pointer group w-full"
          onClick={handleViewDetails}
        >
          <div className="flex">
            {/* Image section - 40% width */}
            <div className="relative w-2/5 h-48 overflow-hidden">
              <img 
                src={imageUrl} 
                alt={equipment.title} 
                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                onError={(e) => {
                  console.error("❌ Erreur de chargement d'image pour:", equipment.title, "URL:", imageUrl);
                  e.currentTarget.src = "/placeholder.svg";
                }}
                onLoad={() => {
                  console.log("✅ Image chargée avec succès pour:", equipment.title, "URL:", imageUrl);
                }}
              />
              {equipment.owner && (
                <div className="absolute top-2 right-2 bg-green-100 p-1 rounded-full">
                  <Shield className="h-3 w-3 text-green-600" />
                </div>
              )}
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="bg-white/90 text-xs">
                  {equipment.category}
                </Badge>
              </div>
            </div>
            
            {/* Content section - 60% width */}
            <div className="w-3/5 p-4 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {equipment.title}
                </h3>
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{equipment.city ? `${equipment.city}${equipment.country ? `, ${equipment.country}` : ''}` : equipment.country}</span>
                </div>
              </div>
              
              <div className="mt-auto">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-terracotta text-lg">
                    {equipment.daily_price?.toLocaleString()} FCFA
                    <span className="text-sm font-normal text-gray-500">/jour</span>
                  </span>
                </div>
                
                {/* Avatar et nom du propriétaire */}
                {equipment.owner && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar 
                        className="h-8 w-8 cursor-pointer transform hover:scale-110 transition-transform"
                        onClick={handleOwnerClick}
                      >
                        <AvatarImage src={equipment.owner.avatar_url} />
                        <AvatarFallback className="text-xs bg-primary text-white">
                          {equipment.owner.first_name?.[0]}{equipment.owner.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-600">
                        {equipment.owner.first_name} {equipment.owner.last_name}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

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
  }

  // Original rendering for non-equipment cards
  return (
    <div className="flex flex-col items-start p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      {icon && <div className={`${color} p-3 rounded-lg text-2xl mb-4`}>{icon}</div>}
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      {description && <p className="text-gray-600">{description}</p>}
    </div>
  );
};

export default FeatureCard;
