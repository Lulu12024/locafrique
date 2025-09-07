import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCategories } from "@/hooks/useCategories";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CategoryIcon, getCorrectedCategories, getCorrectIconName } from "@/utils/categoryIconMapper";

interface Category {
  id: string;
  name: string;
  icon: string;
  count?: number;
}

interface CategoryCarouselProps {
  onCategorySelect?: (categoryId: string) => void;
  selectedCategory?: string | null;
}

const CategoryCarousel: React.FC<CategoryCarouselProps> = ({
  onCategorySelect, 
  selectedCategory 
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { fetchCategories } = useCategories();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Utiliser les catégories corrigées comme fallback
  const fallbackCategories = getCorrectedCategories();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setError(null);
        const dbCategories = await fetchCategories();
        
        if (dbCategories && dbCategories.length > 0) {
          // Mapper les catégories de la DB avec les icônes corrigées
          const mappedCategories = dbCategories.map(dbCat => {
            const fallbackCat = fallbackCategories.find(fc => fc.id === dbCat.id);
            return {
              id: dbCat.id,
              name: dbCat.name || fallbackCat?.name || 'Catégorie',
              icon: getCorrectIconName(dbCat.icon) || fallbackCat?.icon || 'Package'
            };
          });
          setCategories(mappedCategories);
        } else {
          // Utiliser les catégories corrigées si aucune en DB
          setCategories(fallbackCategories);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
        setError('Erreur de chargement');
        // Utiliser les catégories corrigées en cas d'erreur
        setCategories(fallbackCategories);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [t]);

  const handleCategoryClick = (categoryId: string) => {
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    } else {
      navigate(`/search?category=${categoryId}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-16 z-45 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex space-x-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-16 w-28 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <p className="text-red-700">⚠️ {error}</p>
        <p className="text-sm text-red-600 mt-1">Utilisation des catégories par défaut</p>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-16 z-45 py-3 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4">
        <Carousel
          opts={{
            align: "start",
            loop: false,
            dragFree: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2">
            {categories.map((category) => (
              <CarouselItem key={category.id} className="pl-2 basis-auto min-w-[120px] flex-shrink-0">
                <Button
                  variant={selectedCategory === category.id ? "default" : "ghost"}
                  className={cn(
                    "h-16 flex flex-col items-center justify-center space-y-1 px-4 py-2 rounded-lg transition-all duration-200",
                    selectedCategory === category.id
                      ? "bg-green-600 text-white shadow-md scale-105"
                      : "hover:bg-gray-100 hover:scale-102"
                  )}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <CategoryIcon 
                    iconName={category.icon} 
                    className="h-6 w-6" 
                  />
                  <span className="text-xs font-medium text-center leading-tight">
                    {category.name}
                  </span>
                  {category.count && (
                    <span className="text-xs opacity-75">
                      {category.count}
                    </span>
                  )}
                </Button>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
};


export default CategoryCarousel;