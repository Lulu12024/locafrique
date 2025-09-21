import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EquipmentImage {
  id: string;
  image_url: string;
  is_primary?: boolean;
  equipment_id: string;
}

interface EquipmentImageGalleryProps {
  images: EquipmentImage[];
  title: string;
}

export const EquipmentImageGallery: React.FC<EquipmentImageGalleryProps> = ({ images, title }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Debug logging
  console.log("🖼️ Galerie d'images - Props reçues:", { images, imagesCount: images?.length });

  // Si pas d'images, afficher placeholder
  if (!images || images.length === 0) {
    console.log("❌ Aucune image à afficher");
    return (
      <div className="w-full h-64 md:h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <ImageIcon className="h-16 w-16 mx-auto mb-2" />
          <p>Aucune image disponible</p>
        </div>
      </div>
    );
  }

  // Trier les images : image principale en premier
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return 0;
  });

  console.log("📷 Images triées:", sortedImages);

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? sortedImages.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => 
      prev === sortedImages.length - 1 ? 0 : prev + 1
    );
  };

  const currentImage = sortedImages[currentImageIndex];
  console.log("🎯 Image actuelle:", currentImage);

  return (
    <div className="w-full">
      {/* Image principale */}
      <div className="relative w-full h-64 md:h-96 bg-gray-100 rounded-lg overflow-hidden mb-4">
        <img
          src={currentImage.image_url}
          alt={`${title} - Image ${currentImageIndex + 1}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error("❌ Erreur de chargement d'image:", currentImage.image_url);
            e.currentTarget.src = "/placeholder.svg";
          }}
          onLoad={() => {
            console.log("✅ Image chargée avec succès:", currentImage.image_url);
          }}
        />
        
        {/* Badge image principale */}
        {currentImage.is_primary && (
          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
            Image principale
          </div>
        )}
        
        {/* Contrôles de navigation - Seulement si plusieurs images */}
        {sortedImages.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            {/* Indicateur de position */}
            <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
              {currentImageIndex + 1} / {sortedImages.length}
            </div>
          </>
        )}
      </div>
      
      {/* Miniatures - Seulement si plusieurs images */}
      {sortedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setCurrentImageIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                index === currentImageIndex 
                  ? 'border-blue-500 opacity-100' 
                  : 'border-gray-300 opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={image.image_url}
                alt={`${title} - Miniature ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            </button>
          ))}
        </div>
      )}
      
      {/* Info de debug en développement */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
          <strong>Debug:</strong> {sortedImages.length} image(s) chargée(s) | 
          Image actuelle: {currentImageIndex + 1} | 
          URL: {currentImage.image_url}
        </div>
      )}
    </div>
  );
};