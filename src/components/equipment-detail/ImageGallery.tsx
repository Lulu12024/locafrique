
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Eye, Share2, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EquipmentImageData } from '@/types/supabase';

interface ImageGalleryProps {
  images: EquipmentImageData[];
  equipmentTitle: string;
}

export function ImageGallery({ images, equipmentTitle }: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  // Safely handle images
  const primaryImage = images.find((img: EquipmentImageData) => img.is_primary);
  const allImages = primaryImage ? [primaryImage, ...images.filter(img => !img.is_primary)] : images;

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  if (allImages.length === 0) {
    return (
      <div className="col-span-3">
        <div className="w-full h-80 bg-gray-100 rounded-xl flex items-center justify-center">
          <p className="text-gray-400">Aucune image disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-3">
      <div className="space-y-4 sticky top-6">
        {/* Main image */}
        <div className="relative">
          <img 
            src={allImages[selectedImageIndex]?.image_url || '/placeholder.svg'}
            alt={equipmentTitle}
            className="w-full h-80 object-cover rounded-xl cursor-pointer hover:brightness-90 transition-all"
            onClick={() => setShowAllPhotos(true)}
          />
          
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
          
          {/* Image counter */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
              {selectedImageIndex + 1} / {allImages.length}
            </div>
          )}
        </div>
        
        {/* Thumbnails */}
        {allImages.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {allImages.slice(0, 8).map((image: EquipmentImageData, index) => (
              <div 
                key={image.id} 
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 ${
                  index === selectedImageIndex ? 'border-black' : 'border-transparent'
                }`}
                onClick={() => setSelectedImageIndex(index)}
              >
                <img 
                  src={image.image_url}
                  alt={`${equipmentTitle} - ${index + 1}`}
                  className="w-full h-16 object-cover hover:brightness-90 transition-all"
                />
              </div>
            ))}
          </div>
        )}
        
        {/* Show all photos button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowAllPhotos(true)}
        >
          <Eye className="h-4 w-4 mr-2" />
          Voir toutes les photos
        </Button>
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
                ← Retour
              </Button>
              <span className="font-medium">{selectedImageIndex + 1} / {allImages.length}</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="relative h-[calc(100vh-80px)] flex items-center justify-center bg-black">
              <img
                src={allImages[selectedImageIndex]?.image_url}
                alt={equipmentTitle}
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
            
            {/* Thumbnail strip */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="flex gap-2 bg-white/80 p-2 rounded-lg max-w-md overflow-x-auto">
                {allImages.slice(0, 10).map((image: EquipmentImageData, index) => (
                  <motion.div 
                    key={image.id}
                    className={`flex-shrink-0 w-16 h-12 rounded cursor-pointer border-2 ${
                      index === selectedImageIndex ? 'border-white' : 'border-transparent'
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                    whileHover={{ scale: 1.05 }}
                  >
                    <img 
                      src={image.image_url}
                      alt={`${equipmentTitle} - ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
