import React, { useState } from 'react';
import { EquipmentData } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Star, MapPin, Calendar, User, Share, ChevronRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppStoreStyleDetailViewProps {
  equipment: EquipmentData;
}

export function AppStoreStyleDetailView({ equipment }: AppStoreStyleDetailViewProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const images = Array.isArray(equipment.images) ? equipment.images : [];
  const mainImage = images[selectedImageIndex]?.image_url || images[0]?.image_url || '/placeholder.svg';
  
  const handleBack = () => {
    navigate(-1);
  };

  const handleReservation = () => {
    console.log('Réservation pour:', equipment.id);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className={`flex items-center justify-between ${isMobile ? 'p-3' : 'p-4'} border-b bg-gray-50`}>
        <Button 
          variant="ghost" 
          size={isMobile ? "sm" : "sm"}
          onClick={handleBack}
          className="rounded-full p-2"
        >
          <ArrowLeft className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
        </Button>
        <div className="flex items-center space-x-2">
          <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-primary rounded-lg flex items-center justify-center`}>
            <span className={`text-white ${isMobile ? 'text-xs' : 'text-sm'} font-bold`}>
              {equipment.category?.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className={`font-semibold text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{equipment.category}</span>
        </div>
        <Button variant="ghost" size={isMobile ? "sm" : "sm"} className="rounded-full p-2">
          <Share className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
        </Button>
      </div>

      <div className={`${isMobile ? 'mx-2' : 'max-w-2xl mx-auto'}`}>
        {/* Main Section */}
        <div className={`bg-gradient-to-b from-white to-gray-50 ${isMobile ? 'p-4' : 'p-6'}`}>
          <div className={`flex items-start ${isMobile ? 'space-x-3' : 'space-x-4'}`}>
            <div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} rounded-2xl overflow-hidden flex-shrink-0 shadow-lg`}>
              <img 
                src={mainImage} 
                alt={equipment.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex-1">
              <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 mb-1`}>
                {equipment.title}
              </h1>
              <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} mb-3`}>
                {equipment.description?.substring(0, isMobile ? 80 : 100)}...
              </p>
              <Button 
                onClick={handleReservation}
                className={`bg-blue-500 hover:bg-blue-600 text-white ${isMobile ? 'px-6 py-1.5 text-sm' : 'px-8 py-2'} rounded-full font-semibold`}
              >
                Réserver
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className={`grid grid-cols-4 ${isMobile ? 'gap-2 p-4' : 'gap-4 p-6'} border-b border-gray-100`}>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`${isMobile ? 'h-2 w-2' : 'h-3 w-3'} ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                />
              ))}
            </div>
            <p className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>4,5</p>
            <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 uppercase tracking-wide`}>Notes</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <MapPin className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-gray-400`} />
            </div>
            <p className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold text-gray-900 truncate`}>{equipment.city}</p>
            <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 uppercase tracking-wide`}>Lieu</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Calendar className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-gray-400`} />
            </div>
            <p className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold text-gray-900`}>Dispo</p>
            <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 uppercase tracking-wide`}>État</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Avatar className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`}>
                <AvatarImage src={equipment.owner?.avatar_url} />
                <AvatarFallback>
                  {equipment.owner?.first_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            <p className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold text-gray-900 truncate`}>{equipment.owner?.first_name}</p>
            <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 uppercase tracking-wide`}>Propriétaire</p>
          </div>
        </div>

        {/* Price Section */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Tarification</h3>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Prix par jour</span>
              <span className="font-semibold text-gray-900">{formatPrice(equipment.daily_price)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Caution</span>
              <span className="font-semibold text-gray-900">{formatPrice(equipment.deposit_amount)}</span>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Caractéristiques</h3>
          <p className="text-gray-700 leading-relaxed">
            {equipment.description}
          </p>
          {equipment.rental_conditions && (
            <div className="mt-4 flex flex-wrap gap-2">
              {equipment.rental_conditions.split(',').map((condition, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {condition.trim()}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Images Gallery */}
        {images.length > 0 && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aperçu</h3>
            <div className="grid grid-cols-2 gap-3">
              {images.slice(0, 4).map((image, index) => (
                <Card 
                  key={index}
                  className="aspect-video overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img 
                    src={image.image_url} 
                    alt={`${equipment.title} - Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </Card>
              ))}
            </div>
            {images.length > 4 && (
              <p className="text-center text-gray-500 text-sm mt-3">
                +{images.length - 4} autres photos
              </p>
            )}
          </div>
        )}

        {/* Contact Owner Section */}
        <div className="p-6 bg-gray-50">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={equipment.owner?.avatar_url} />
              <AvatarFallback>
                {equipment.owner?.first_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">
                {equipment.owner?.first_name} {equipment.owner?.last_name}
              </h4>
              <p className="text-sm text-gray-600">Propriétaire depuis 2023</p>
            </div>
            <Button variant="outline" size="sm">
              Contacter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}