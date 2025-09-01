import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, User, Phone, Mail, Calendar, Star, Shield, Package, MessageCircle, Eye, Heart, ChevronLeft, ChevronRight, Share2, Bookmark, Clock, Euro, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EquipmentData, EquipmentImageData } from '@/types/supabase';
import { ReservationPopup } from '@/components/booking/ReservationPopup';
import { OwnerProfilePopup } from '@/components/owner/OwnerProfilePopup';

interface MobileEquipmentDetailViewProps {
  equipment: EquipmentData;
  onBack?: () => void;
}

export function MobileEquipmentDetailView({ equipment, onBack }: MobileEquipmentDetailViewProps) {
  const [showReservationPopup, setShowReservationPopup] = useState(false);
  const [showOwnerPopup, setShowOwnerPopup] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  
  // Safely handle images
  const images = Array.isArray(equipment.images) ? equipment.images : [];
  const primaryImage = images.find((img: EquipmentImageData) => img.is_primary);
  const allImages = primaryImage ? [primaryImage, ...images.filter(img => !img.is_primary)] : images;
  
  const mainImageUrl = allImages[selectedImageIndex]?.image_url || '/placeholder.svg';
  
  const handleReservationComplete = () => {
    setShowReservationPopup(false);
  };

  const handleOwnerClick = () => {
    setShowOwnerPopup(true);
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleReserverClick = () => {
    console.log('🔘 Bouton Réserver cliqué');
    setShowReservationPopup(true);
    console.log('📝 État showReservationPopup mis à true');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header avec image principale */}
      <div className="relative">
        {/* Image principale plein écran */}
        <div className="relative h-80 overflow-hidden">
          <img 
            src={mainImageUrl}
            alt={equipment.title}
            className="w-full h-full object-cover"
          />
          
          {/* Overlay avec contrôles */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent">
            {/* Top controls */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="bg-white/90 backdrop-blur-sm rounded-full p-2 h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4 text-gray-900" />
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white/90 backdrop-blur-sm rounded-full p-2 h-8 w-8"
                >
                  <Share2 className="h-4 w-4 text-gray-900" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="bg-white/90 backdrop-blur-sm rounded-full p-2 h-8 w-8"
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-900'}`} />
                </Button>
              </div>
            </div>
            
            {/* Image counter */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {selectedImageIndex + 1} / {allImages.length}
              </div>
            )}
          </div>
          
          {/* Navigation arrows */}
          {allImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 h-8 w-8"
                onClick={prevImage}
              >
                <ChevronLeft className="h-4 w-4 text-gray-900" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 h-8 w-8"
                onClick={nextImage}
              >
                <ChevronRight className="h-4 w-4 text-gray-900" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="px-4 py-6 space-y-6 pb-24">
        {/* Titre et informations principales */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            {equipment.title}
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <Badge variant="secondary" className="bg-gray-100">
              {equipment.subcategory || equipment.category}
            </Badge>
            <span>·</span>
            <MapPin className="h-4 w-4" />
            <span>{equipment.city}, {equipment.country}</span>
          </div>
          
          {/* Rating seulement */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-black fill-current" />
              <span className="font-medium">4.89</span>
            </div>
          </div>
        </div>

        {/* Host info */}
        {equipment.owner && (
          <div className="flex items-center gap-3 py-4 border-b">
            <Avatar className="h-12 w-12">
              <AvatarImage src={equipment.owner.avatar_url} />
              <AvatarFallback className="bg-gray-200 text-gray-700 font-semibold">
                {equipment.owner.first_name[0]}{equipment.owner.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">
                Hôte : {equipment.owner.first_name}
              </div>
              <div className="text-sm text-gray-600">
                Vérifier · Hôte depuis 2 ans
              </div>
            </div>
          </div>
        )}

        {/* Highlights */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium">Procédure d'arrivée irréprochable</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 bg-pink-100 rounded-full">
              <Heart className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <div className="font-medium">Perle rare !</div>
              <div className="text-sm text-gray-600">
                Les réservations pour cet équipment sont fréquentes.
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium">{equipment.owner?.first_name} est Vérifier</div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="border-t pt-6">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {equipment.description}
          </p>
        </div>

        {/* Equipment details */}
        <div className="border-t pt-6 space-y-4">
          <h3 className="font-semibold text-lg">Détails de l'équipement</h3>
          <div className="space-y-3">
            {equipment.brand && (
              <div className="flex justify-between">
                <span className="text-gray-600">Marque</span>
                <span className="font-medium">{equipment.brand}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">État</span>
              <span className="font-medium">{equipment.condition}</span>
            </div>
            {equipment.year && (
              <div className="flex justify-between">
                <span className="text-gray-600">Année</span>
                <span className="font-medium">{equipment.year}</span>
              </div>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-lg mb-4">Où vous récupérerez l'équipement</h3>
          <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">{equipment.city}, {equipment.country}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer fixe avec prix et réservation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20 safe-area-inset-bottom">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-semibold">
                {equipment.daily_price?.toLocaleString()} FCFA
              </span>
              <span className="text-gray-600 text-sm">par jour</span>
            </div>
            <div className="text-sm text-gray-600">
              19–21 sept.
            </div>
          </div>
          
          <Button 
            onClick={handleReserverClick}
            className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-3 rounded-lg font-medium"
            disabled={equipment.status !== 'disponible'}
          >
            Réserver
          </Button>
        </div>
      </div>

      {/* All Photos Modal */}
      <AnimatePresence>
        {showAllPhotos && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllPhotos(false)}
                className="text-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <span className="font-medium">{selectedImageIndex + 1} / {allImages.length}</span>
            </div>
            
            <div className="relative h-[calc(100vh-80px)] flex items-center justify-center bg-black">
              <img
                src={allImages[selectedImageIndex]?.image_url}
                alt={equipment.title}
                className="max-w-full max-h-full object-contain"
              />
              
              {allImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute left-4 bg-white/80 hover:bg-white"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-4 bg-white/80 hover:bg-white"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reservation Popup */}
      <ReservationPopup
        equipment={equipment}
        isOpen={showReservationPopup}
        onClose={() => setShowReservationPopup(false)}
        onComplete={handleReservationComplete}
      />

      {/* Owner Profile Popup */}
      {equipment.owner && (
        <OwnerProfilePopup
          owner={equipment.owner}
          isOpen={showOwnerPopup}
          onClose={() => setShowOwnerPopup(false)}
          equipmentCount={equipment.booking_count || 1}
        />
      )}

      {/* Padding bottom pour éviter que le contenu soit caché par le footer fixe */}
      <div className="pb-20" />
    </div>
  );
}
