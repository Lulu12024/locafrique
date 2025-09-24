// src/components/equipment-detail/MobileEquipmentDetailView.tsx - Version améliorée
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft, 
  Star, 
  MapPin, 
  Package, 
  Heart, 
  Shield,
  Share2,
  Camera,
  Clock,
  Users
} from 'lucide-react';
import { EquipmentData } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Calendar } from '../ui/calendar';

interface MobileEquipmentDetailViewProps {
  equipment: EquipmentData;
}

// Composant pour les images avec fallback amélioré
interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

const SafeImage: React.FC<SafeImageProps> = ({ 
  src, 
  alt, 
  className,
  fallbackSrc = '/api/placeholder/400/300' 
}) => {
  const [imageSrc, setImageSrc] = useState(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImageSrc(fallbackSrc);
    }
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={cn("relative overflow-hidden bg-gray-200", className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-pulse flex flex-col items-center">
            <Camera className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-xs text-gray-500">Chargement...</span>
          </div>
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={cn("w-full h-full object-cover transition-opacity duration-300", {
          "opacity-0": isLoading,
          "opacity-100": !isLoading
        })}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
      />
    </div>
  );
};

export function MobileEquipmentDetailView({ equipment }: MobileEquipmentDetailViewProps) {
  const navigate = useNavigate();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Gestion sécurisée des images - CORRIGÉ
  const getImages = () => {
    try {
      if (Array.isArray(equipment.images) && equipment.images.length > 0) {
        return equipment.images
          .map(img => {
            // Gérer différents formats d'images
            if (typeof img === 'string') return img;
            if (img && typeof img === 'object') {
              return img.image_url;
            }
            return null;
          })
          .filter(Boolean);
      }
    } catch (error) {
      console.error('Erreur lors du traitement des images:', error);
    }
    
    // Image par défaut si aucune image ou erreur
    return ['/api/placeholder/400/300'];
  };

  const allImages = getImages();

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleBack = () => {
    navigate(-1); // Retour à la page précédente
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: equipment.title,
        url: window.location.href,
      });
    } else {
      // Fallback : copier l'URL
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleReserverClick = () => {
    // TODO: Implémenter la logique de réservation
    console.log('Réservation cliquée pour équipement:', equipment.id);
  };

  const handleFavoriteClick = () => {
    setIsFavorite(!isFavorite);
    // TODO: Implémenter la logique de favoris
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header fixe avec flèche retour - AJOUTÉ */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3 safe-area-inset-top">
          {/* Bouton retour */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-full"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Button>

          {/* Actions à droite */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <Share2 className="h-5 w-5 text-gray-700" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavoriteClick}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <Heart className={cn("h-5 w-5", isFavorite ? "fill-red-500 text-red-500" : "text-gray-700")} />
            </Button>
          </div>
        </div>
      </div>

      {/* Galerie d'images - Layout responsive amélioré */}
      <div className="relative pt-16"> {/* pt-16 pour l'espace du header */}
        <div className="relative aspect-[4/3] w-full bg-gray-200">
          <SafeImage
            src={allImages[selectedImageIndex]}
            alt={equipment.title || 'Équipement'}
            className="w-full h-full"
          />
          
          {/* Overlay avec actions - Responsive */}
          <div className="absolute inset-0">
            {/* Bouton voir toutes les photos */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 right-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAllPhotos(true)}
                  className="bg-white/90 backdrop-blur-sm text-gray-900 hover:bg-white border-0 shadow-lg text-sm px-3 py-2"
                >
                  Voir les {allImages.length} photos
                </Button>
              </div>
            )}
            
            {/* Compteur d'images */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
                {selectedImageIndex + 1} / {allImages.length}
              </div>
            )}
          </div>
          
          {/* Navigation entre images - Améliorée */}
          {allImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 h-10 w-10 hover:bg-white shadow-md border border-gray-200"
                onClick={prevImage}
              >
                <ChevronLeft className="h-5 w-5 text-gray-900" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 h-10 w-10 hover:bg-white shadow-md border border-gray-200"
                onClick={nextImage}
              >
                <ChevronRight className="h-5 w-5 text-gray-900" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Contenu principal avec layout responsive amélioré */}
      <div className="px-4 py-6 space-y-6 pb-32"> {/* pb-32 pour l'espace du bouton fixe */}
        
        {/* Section titre et informations - Layout optimisé */}
        <div className="space-y-3">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight break-words">
            {equipment.title}
          </h1>
          
          {/* Badges et localisation - Responsive */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-xs px-2 py-1">
              {equipment.subcategory || equipment.category}
            </Badge>
            <span className="text-gray-400">•</span>
            <div className="flex items-center text-gray-600 min-w-0">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate">{equipment.city}, {equipment.country}</span>
            </div>
          </div>
          
          {/* Rating et statistiques - Amélioré */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-black fill-current" />
              <span className="font-medium">4.89</span>
              <span className="text-gray-600 text-sm">(127 avis)</span>
            </div>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600 text-sm">96% de satisfaction</span>
          </div>
        </div>

        {/* Informations sur le propriétaire - Layout responsive amélioré */}
        {equipment.owner && (
          <div className="border rounded-xl p-4 bg-gray-50">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={equipment.owner.avatar_url} />
                <AvatarFallback className="bg-gray-200 text-gray-700 font-semibold">
                  {equipment.owner.first_name?.[0]}{equipment.owner.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  Hôte : {equipment.owner.first_name}
                </div>
                <div className="text-sm text-gray-600">
                  Vérifier • Hôte depuis 2 ans
                </div>
              </div>
            </div>
            
            {/* Points forts en grille responsive */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
                  <Package className="h-4 w-4 text-green-600" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm">Procédure d'arrivée irréprochable</div>
                  <div className="text-xs text-gray-600">100% des clients récents ont donné 5 étoiles</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-pink-100 rounded-full flex-shrink-0">
                  <Heart className="h-4 w-4 text-pink-600" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm">Perle rare !</div>
                  <div className="text-xs text-gray-600">Les réservations pour cet équipement sont fréquentes</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
                  <Shield className="h-4 w-4 text-green-600" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm">{equipment.owner.first_name} est Vérifié</div>
                  <div className="text-xs text-gray-600">Identité et informations confirmées</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Description - Typography améliorée */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-lg mb-3">Description</h3>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
            {equipment.description || 'Équipement professionnel de qualité, parfait pour vos projets. Matériel bien entretenu et régulièrement vérifié.'}
          </p>
        </div>

        {/* Détails équipement - Layout responsive en grid */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-lg mb-4">Détails de l'équipement</h3>
          <div className="space-y-3">
            {equipment.brand && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Marque</span>
                <span className="font-medium text-gray-900 text-right break-words">{equipment.brand}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">État</span>
              <Badge variant="outline" className="font-medium">
                {equipment.condition || 'Bon état'}
              </Badge>
            </div>
            {equipment.year && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Année</span>
                <span className="font-medium text-gray-900">{equipment.year}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Disponibilité</span>
              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                Disponible immédiatement
              </Badge>
            </div>
          </div>
        </div>

        {/* Localisation - Design amélioré et responsive */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-lg mb-4">Où vous récupérerez l'équipement</h3>
          <div className="bg-gray-100 rounded-xl h-48 flex items-center justify-center">
            <div className="text-center px-4">
              <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium break-words">{equipment.city}, {equipment.country}</p>
              <p className="text-sm text-gray-500 mt-1">La localisation exacte sera communiquée après réservation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton de réservation fixe style Airbnb - NOUVEAU */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white border-t border-gray-200 shadow-2xl">
          {/* Indicateur de swipe subtil */}
          <div className="flex justify-center py-1">
            <div className="w-8 h-1 bg-gray-300 rounded-full opacity-40" />
          </div>
          
          <div className="px-4 pb-4 pt-2 safe-area-inset-bottom">
            <div className="flex items-center justify-between">
              {/* Section prix et informations */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-xl font-bold text-gray-900 tracking-tight">
                    {equipment.daily_price?.toLocaleString() || '0'} FCFA
                  </span>
                  <span className="text-gray-600 text-sm font-medium">par jour</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-3 w-3 mr-1.5 flex-shrink-0" />
                  <span>19–21 sept.</span>
                  <span className="mx-2 text-gray-400">•</span>
                  <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span>Disponible</span>
                </div>
              </div>
              
              {/* Bouton réserver style Airbnb */}
              <Button 
                onClick={handleReserverClick}
                className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ml-4 rounded-lg px-8 py-3 text-base min-w-[120px] disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
                disabled={equipment.status !== 'disponible'}
                size="lg"
              >
                Réserver
              </Button>
            </div>
            
            {/* Informations supplémentaires */}
            <div className="flex items-center justify-center mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current text-black" />
                  <span className="font-medium">4.89</span>
                </div>
                <span className="text-gray-400">•</span>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>127 avis</span>
                </div>
                <span className="text-gray-400">•</span>
                <Badge variant="outline" className="text-xs py-0 px-2 border-green-200 text-green-700">
                  Hôte vérifié
                </Badge>
              </div>
            </div>

            {/* Message de confiance */}
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-500">
                Vous ne serez pas débité pour le moment
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal toutes les photos - Amélioré */}
      <AnimatePresence>
        {showAllPhotos && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white"
          >
            <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllPhotos(false)}
                className="text-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <span className="font-medium">
                {allImages.length} photo{allImages.length > 1 ? 's' : ''}
              </span>
              <div /> {/* Spacer */}
            </div>
            
            <div className="space-y-2 p-4">
              {allImages.map((image, index) => (
                <div key={index} className="aspect-[4/3] rounded-xl overflow-hidden">
                  <SafeImage
                    src={image}
                    alt={`Vue ${index + 1}`}
                    className="w-full h-full"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}