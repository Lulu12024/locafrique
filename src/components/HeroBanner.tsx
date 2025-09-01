
import React from "react";
import { AutoplayCarousel, CarouselContent, CarouselItem } from "@/components/AutoplayCarousel";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const HeroBanner = () => {
  const isMobile = useIsMobile();

  // N'afficher la bannière que sur mobile
  if (!isMobile) {
    return null;
  }

  const bannerSlides = [
    {
      id: 1,
      title: "Louez l'équipement parfait",
      subtitle: "DES MILLIERS D'OUTILS DISPONIBLES",
      discount: "LIVRAISON RAPIDE",
      buttonText: "Découvrir",
      image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=400&fit=crop&crop=center",
      backgroundColor: "bg-gradient-to-r from-green-500 to-green-600"
    },
    {
      id: 2,
      title: "Équipements professionnels",
      subtitle: "QUALITÉ GARANTIE",
      discount: "PRIX COMPÉTITIFS",
      buttonText: "Explorer",
      image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=400&fit=crop&crop=center",
      backgroundColor: "bg-gradient-to-r from-blue-500 to-blue-600"
    },
    {
      id: 3,
      title: "Gagnez de l'argent",
      subtitle: "METTEZ VOS OUTILS EN LOCATION",
      discount: "INSCRIPTION GRATUITE",
      buttonText: "Commencer",
      image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=400&fit=crop&crop=center",
      backgroundColor: "bg-gradient-to-r from-purple-500 to-purple-600"
    }
  ];

  return (
    <div className="px-4 py-2 bg-gray-50">
      <AutoplayCarousel 
        className="w-full max-w-6xl mx-auto"
        autoplayInterval={5000}
        loop={true}
      >
        <CarouselContent>
          {bannerSlides.map((slide) => (
            <CarouselItem key={slide.id}>
              <div className="relative h-48 md:h-36 rounded-3xl overflow-hidden shadow-2xl">
                {/* Gradient overlay amélioré */}
                <div className={`absolute inset-0 ${slide.backgroundColor} opacity-85`}></div>
                
                {/* Image de fond avec meilleur blending */}
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
                />
                
                {/* Contenu principal */}
                <div className="absolute inset-0 flex items-center justify-between p-6">
                  <div className="text-white max-w-md flex-1">
                    {/* Badge de la marque */}
                    <div className="mb-3">
                      <span className="text-xs bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full font-bold border border-white/30">
                        3W-LOC
                      </span>
                    </div>
                    
                    {/* Titre principal */}
                    <h2 className="text-xl font-bold mb-3 leading-tight drop-shadow-lg">
                      {slide.title}
                    </h2>
                    
                    {/* Sous-titre */}
                    <p className="text-sm font-semibold mb-2 text-green-100 drop-shadow-md">
                      {slide.subtitle}
                    </p>
                    
                    {/* Promotion */}
                    <p className="text-xs opacity-90 mb-4 text-green-50 drop-shadow-sm">
                      {slide.discount}
                    </p>
                    
                    {/* Bouton d'action */}
                    <Button 
                      className="text-sm px-6 py-2.5 bg-white text-gray-900 hover:bg-gray-100 font-bold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                    >
                      🚀 {slide.buttonText}
                    </Button>
                  </div>
                </div>
                
                {/* Indicateurs de pagination améliorés */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {bannerSlides.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        index === slide.id - 1 
                          ? 'bg-white shadow-lg scale-110' 
                          : 'bg-white/60 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Effet de brillance sur le contenant */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50 animate-pulse"></div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </AutoplayCarousel>
    </div>
  );
};

export default HeroBanner;
