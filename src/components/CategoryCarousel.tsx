
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

  // Catégories par défaut avec leurs icônes et traductions
  const defaultCategories: Category[] = [
    {
      id: "construction",
      name: t('categories.construction'),
      icon: "🏗️"
    },
    {
      id: "agriculture",
      name: t('categories.agriculture'), 
      icon: "🚜"
    },
    {
      id: "transport",
      name: t('categories.transport'),
      icon: "🚚"
    },
    {
      id: "manutention",
      name: t('categories.manutention'),
      icon: "🏋️"
    },
    {
      id: "electrique",
      name: t('categories.electrique'),
      icon: "⚡"
    },
    {
      id: "sport",
      name: t('categories.sport'),
      icon: "⚽"
    },
    {
      id: "evenementiel", 
      name: t('categories.evenementiel'),
      icon: "🎪"
    },
    {
      id: "jardinage",
      name: t('categories.jardinage'),
      icon: "🌱"
    },
    {
      id: "nettoyage",
      name: t('categories.nettoyage'),
      icon: "🧽"
    },
    {
      id: "bricolage",
      name: t('categories.bricolage'),
      icon: "🔨"
    }
  ];

  // Charger les catégories de la base de données ou utiliser les catégories par défaut
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const dbCategories = await fetchCategories();
        if (dbCategories && dbCategories.length > 0) {
          // Mapper les catégories de la DB avec les icônes par défaut
          const mappedCategories = dbCategories.map(dbCat => {
            const defaultCat = defaultCategories.find(dc => dc.id === dbCat.id);
            return {
              id: dbCat.id,
              name: dbCat.name,
              icon: dbCat.icon || defaultCat?.icon || "📦"
            };
          });
          setCategories(mappedCategories);
        } else {
          // Utiliser les catégories par défaut si aucune en DB
          setCategories(defaultCategories);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
        // Utiliser les catégories par défaut en cas d'erreur
        setCategories(defaultCategories);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [t]); // Dépendance sur t pour recharger lors du changement de langue

  const handleCategoryClick = (categoryId: string) => {
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    } else {
      // Naviguer vers la page de recherche avec le filtre de catégorie
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
                  onClick={() => handleCategoryClick(category.id)}
                  className={cn(
                    "flex flex-col items-center space-y-1 h-auto py-3 px-4 rounded-lg transition-all duration-200 whitespace-nowrap w-full min-w-[110px] hover:scale-105",
                    selectedCategory === category.id 
                      ? "bg-primary text-primary-foreground shadow-md scale-105" 
                      : "hover:bg-gray-100 hover:shadow-sm text-gray-700 bg-white border border-gray-200"
                  )}
                >
                  <span className="text-lg mb-0.5">{category.icon}</span>
                  <span className="text-xs font-medium leading-tight text-center">{category.name}</span>
                  {category.count && (
                    <span className={cn(
                      "text-xs opacity-70",
                      selectedCategory === category.id ? "text-primary-foreground/80" : "text-gray-500"
                    )}>
                      {category.count}
                    </span>
                  )}
                </Button>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-4 bg-white/80 hover:bg-white" />
          <CarouselNext className="hidden md:flex -right-4 bg-white/80 hover:bg-white" />
        </Carousel>
      </div>
    </div>
  );
};

export default CategoryCarousel;
