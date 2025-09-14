// src/components/CategoryCarousel.tsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Import des icônes Lucide
import {
  Smartphone,
  Car,
  Wrench,
  Printer,
  Gamepad2,
  Music,
  Refrigerator,
  Headphones,
  Hammer,
  Truck,
  Settings,
  Zap,
  Calendar,
  Flower,
  Package,
  Construction,
  Tractor,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Mapping des icônes
const ICON_MAPPING: { [key: string]: React.ComponentType<any> } = {
  // Icônes principales (format PascalCase)
  'Smartphone': Smartphone,
  'Car': Car,
  'Wrench': Wrench,
  'Printer': Printer,
  'Gamepad2': Gamepad2,
  'Music': Music,
  'Refrigerator': Refrigerator,
  'Headphones': Headphones,
  'Hammer': Hammer,
  'Truck': Truck,
  'Settings': Settings,
  'Zap': Zap,
  'Calendar': Calendar,
  'Flower': Flower,
  'Package': Package,
  'Construction': Construction,
  'Tractor': Tractor,
  
  // Icônes problématiques (format lowercase) - CORRECTION
  'wrench': Wrench,
  'hammer': Hammer,
  'zap': Zap,
  'calendar': Calendar,
  'flower': Flower,
  'move': Settings,
  'construction': Construction,
  'agriculture': Tractor,
  'transport': Car,
  'manutention': Settings,
  'electrique': Zap,
  'sport': Gamepad2,
  'evenementiel': Music,
  'jardinage': Flower,
  'bricolage': Wrench,
  
  // Fallback
  'default': Package
};

// Composant pour rendre une icône de manière sécurisée
interface CategoryIconProps {
  iconName: string | null | undefined;
  className?: string;
  size?: number;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ 
  iconName, 
  className = "h-6 w-6", 
  size = 24 
}) => {
  if (!iconName) {
    const DefaultIcon = ICON_MAPPING['default'];
    return <DefaultIcon className={className} size={size} />;
  }

  const cleanIconName = iconName.trim();
  const IconComponent = ICON_MAPPING[cleanIconName] || ICON_MAPPING['default'];
  
  return <IconComponent className={className} size={size} />;
};

// Fonction pour corriger les noms d'icônes
const getCorrectIconName = (iconName: string | null | undefined): string => {
  if (!iconName) return 'default';
  
  const cleanName = iconName.trim();
  
  const nameMapping: { [key: string]: string } = {
    'wrench': 'Wrench',
    'hammer': 'Construction', 
    'zap': 'Zap',
    'calendar': 'Calendar',
    'flower': 'Flower',
    'move': 'Settings',
    'construction': 'Construction',
    'agriculture': 'Tractor',
    'transport': 'Car',
    'manutention': 'Settings',
    'electrique': 'Zap',
    'sport': 'Gamepad2',
    'evenementiel': 'Music',
    'jardinage': 'Flower',
    'bricolage': 'Wrench'
  };
  
  return nameMapping[cleanName] || cleanName;
};

// Catégories de fallback
const getCorrectedCategories = () => {
  return [
    {
      id: 'construction',
      name: 'Équipements de construction',
      icon: 'Construction',
      description: 'Outils et équipements de construction'
    },
    {
      id: 'agriculture', 
      name: 'Matériels agricoles',
      icon: 'Tractor',
      description: 'Équipements agricoles et forestiers'
    },
    {
      id: 'transport',
      name: 'Véhicules de transport', 
      icon: 'Car',
      description: 'Véhicules et moyens de transport'
    },
    {
      id: 'manutention',
      name: 'Équipements de manutention',
      icon: 'Settings',
      description: 'Équipements de levage et manutention'
    },
    {
      id: 'electrique',
      name: 'Outils électriques',
      icon: 'Zap', 
      description: 'Outils et équipements électriques'
    },
    {
      id: 'sport',
      name: 'Équipements de sport',
      icon: 'Gamepad2',
      description: 'Matériel sportif et de loisirs'
    },
    {
      id: 'evenementiel',
      name: 'Événementiel',
      icon: 'Music',
      description: 'Matériel pour événements'
    },
    {
      id: 'jardinage',
      name: 'Jardinage',
      icon: 'Flower',
      description: 'Outils de jardinage'
    },
    {
      id: 'bricolage',
      name: 'Bricolage',
      icon: 'Wrench',
      description: 'Outils de bricolage'
    }
  ];
};

// Types
interface Category {
  id: string;
  name: string;
  icon: string;
  count?: number;
}

interface CategoryCarouselProps {
  onCategorySelect?: (categoryId: string) => void;
  selectedCategory?: string | null;
  onCategoryFilter?: (categoryId: string) => void;
}

// COMPOSANT PRINCIPAL
const CategoryCarousel: React.FC<CategoryCarouselProps> = ({ 
  onCategorySelect, 
  selectedCategory,
  onCategoryFilter 
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { fetchCategories } = useCategories();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour le carrousel
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Utiliser les catégories corrigées comme fallback
  const fallbackCategories = getCorrectedCategories();

  // Calcul des éléments visibles selon la taille d'écran
  const getVisibleItems = () => {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth < 640) return 2; // mobile
    if (window.innerWidth < 768) return 3; // sm
    if (window.innerWidth < 1024) return 4; // md
    if (window.innerWidth < 1280) return 5; // lg
    return 6; // xl et plus
  };

  const [visibleItems, setVisibleItems] = useState(getVisibleItems);

  useEffect(() => {
    const handleResize = () => {
      setVisibleItems(getVisibleItems());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calcul de l'index maximum
  const maxIndex = Math.max(0, categories.length - visibleItems);

  // Navigation functions
  const goToPrevious = () => {
    if (isTransitioning || currentIndex === 0) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => prev - 1);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToNext = () => {
    if (isTransitioning || currentIndex >= maxIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => prev + 1);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Touch handlers pour le swipe mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < maxIndex) {
      goToNext();
    }
    if (isRightSwipe && currentIndex > 0) {
      goToPrevious();
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setError(null);
        console.log("🔄 Chargement des catégories...");
        const dbCategories = await fetchCategories();
        
        if (dbCategories && dbCategories.length > 0) {
          console.log("✅ Catégories de la DB:", dbCategories);
          
          // Mapper les catégories de la DB avec les icônes corrigées
          const mappedCategories = dbCategories.map(dbCat => {
            const fallbackCat = fallbackCategories.find(fc => fc.id === dbCat.id);
            const correctedCategory = {
              id: dbCat.id,
              name: dbCat.name || fallbackCat?.name || 'Catégorie',
              icon: getCorrectIconName(dbCat.icon) || fallbackCat?.icon || 'Package'
            };
            
            console.log(`🔧 Catégorie mappée: "${dbCat.name}" -> "${correctedCategory.name}" (${dbCat.icon} -> ${correctedCategory.icon})`);
            return correctedCategory;
          });
          
          setCategories(mappedCategories);
        } else {
          console.log("⚠️ Aucune catégorie en DB, utilisation du fallback");
          setCategories(fallbackCategories);
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des catégories:', error);
        setError('Erreur de chargement');
        setCategories(fallbackCategories);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [t]);

  const handleCategoryClick = (categoryId: string) => {
    console.log("🎯 Catégorie sélectionnée:", categoryId);
    
    // 1. Mettre à jour la sélection visuelle
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    }
    
    // 2. Appliquer le filtrage
    if (onCategoryFilter) {
      onCategoryFilter(categoryId);
    } else {
      // Fallback : naviguer vers la page de recherche
      navigate(`/search?category=${categoryId}`);
    }
  };

  // État de chargement
  if (loading) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-16 z-45 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex justify-center space-x-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-16 w-28 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <p className="text-red-700">⚠️ {error}</p>
        <p className="text-sm text-red-600 mt-1">Utilisation des catégories par défaut</p>
      </div>
    );
  }

  // Si pas assez de catégories pour justifier un carrousel, utiliser le layout centré original
  if (categories.length <= visibleItems) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-16 z-45 py-4 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center">
            <div className={cn(
              "grid gap-3 w-full",
              categories.length <= 3 ? "grid-cols-3 max-w-md" :
              categories.length <= 4 ? "grid-cols-4 max-w-2xl" :
              categories.length <= 5 ? "grid-cols-5 max-w-3xl" :
              "grid-cols-6 max-w-4xl",
              "sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            )}>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "ghost"}
                  className={cn(
                    "h-16 flex flex-col items-center justify-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 text-center",
                    selectedCategory === category.id
                      ? "bg-green-600 text-white shadow-lg scale-105 border-2 border-green-700"
                      : "hover:bg-green-50 hover:scale-102 hover:border-green-200 border border-gray-200 hover:shadow-md"
                  )}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <CategoryIcon 
                    iconName={category.icon} 
                    className={cn(
                      "h-5 w-5 transition-colors",
                      selectedCategory === category.id ? "text-white" : "text-green-600"
                    )} 
                  />
                  <span className="text-xs font-medium text-center leading-tight max-w-full truncate">
                    {category.name}
                  </span>
                  {category.count && (
                    <span className="text-xs opacity-75">
                      {category.count}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RENDU PRINCIPAL - CARROUSEL HORIZONTAL
  return (
    <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-16 z-45 py-4 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Container du carrousel avec navigation */}
        <div className="relative flex items-center">
          
          {/* Bouton Précédent */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute left-0 z-10 bg-white/90 backdrop-blur-sm shadow-md border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-200 flex-shrink-0",
              currentIndex === 0 ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
            )}
            onClick={goToPrevious}
            disabled={isTransitioning || currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Bouton Suivant */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute right-0 z-10 bg-white/90 backdrop-blur-sm shadow-md border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-200 flex-shrink-0",
              currentIndex >= maxIndex ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
            )}
            onClick={goToNext}
            disabled={isTransitioning || currentIndex >= maxIndex}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Container des catégories avec overflow */}
          <div className="overflow-hidden mx-10 w-full">
            <div
              ref={carouselRef}
              className="flex transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / visibleItems)}%)`,
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex-none px-1"
                  style={{ width: `${100 / visibleItems}%` }}
                >
                  <Button
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    className={cn(
                      "h-16 w-full flex flex-col items-center justify-center space-y-1 px-2 py-2 rounded-lg transition-all duration-200 text-center",
                      selectedCategory === category.id
                        ? "bg-green-600 text-white shadow-lg scale-105 border-2 border-green-700"
                        : "hover:bg-green-50 hover:scale-102 hover:border-green-200 border border-gray-200 hover:shadow-md"
                    )}
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    {/* Icône avec couleur adaptative */}
                    <CategoryIcon 
                      iconName={category.icon} 
                      className={cn(
                        "h-5 w-5 transition-colors",
                        selectedCategory === category.id ? "text-white" : "text-green-600"
                      )} 
                    />
                    
                    {/* Nom de la catégorie */}
                    <span className="text-xs font-medium text-center leading-tight max-w-full truncate">
                      {category.name}
                    </span>
                    
                    {/* Compteur optionnel */}
                    {category.count && (
                      <span className="text-xs opacity-75">
                        {category.count}
                      </span>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Indicateurs de position */}
        {maxIndex > 0 && (
          <div className="flex justify-center mt-3 space-x-1">
            {Array.from({ length: maxIndex + 1 }, (_, index) => (
              <button
                key={index}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-200",
                  index === currentIndex 
                    ? "bg-green-600 w-6" 
                    : "bg-gray-300 hover:bg-gray-400"
                )}
                onClick={() => {
                  if (!isTransitioning) {
                    setIsTransitioning(true);
                    setCurrentIndex(index);
                    setTimeout(() => setIsTransitioning(false), 300);
                  }
                }}
              />
            ))}
          </div>
        )}
        
      </div>
    </div>
  );
};

// EXPORT PAR DÉFAUT
export default CategoryCarousel;