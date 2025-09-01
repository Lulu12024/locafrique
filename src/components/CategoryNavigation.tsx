
import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EQUIPMENT_CATEGORIES } from "@/data/categories";
import { useNavigate, useParams } from "react-router-dom";

interface CategoryNavigationProps {
  currentCategory?: string;
  equipmentCounts?: Record<string, number>;
}

const CategoryNavigation: React.FC<CategoryNavigationProps> = ({
  currentCategory,
  equipmentCounts = {}
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { category } = useParams();

  const handleCategoryClick = (categoryKey: string) => {
    if (categoryKey === 'all') {
      navigate('/equipments');
    } else {
      navigate(`/equipments/${categoryKey}`);
    }
  };

  const categories = Object.entries(EQUIPMENT_CATEGORIES);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
      <h3 className="font-semibold text-lg mb-4">{t('categories.title')}</h3>
      
      <div className="flex flex-wrap gap-2">
        {/* Bouton "Toutes les catégories" */}
        <Button
          variant={!category ? "default" : "outline"}
          size="sm"
          onClick={() => handleCategoryClick('all')}
          className={`flex items-center gap-2 ${!category ? 'bg-terracotta hover:bg-terracotta/90' : ''}`}
        >
          📦 {t('categories.allCategories')}
          {equipmentCounts.total && (
            <Badge variant="secondary" className="ml-1 bg-white text-gray-700">
              {equipmentCounts.total}
            </Badge>
          )}
        </Button>

        {/* Boutons pour chaque catégorie */}
        {categories.map(([key, categoryData]) => (
          <Button
            key={key}
            variant={category === key ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryClick(key)}
            className={`flex items-center gap-2 ${category === key ? 'bg-terracotta hover:bg-terracotta/90' : ''}`}
          >
            <span>{categoryData.icon}</span>
            <span className="hidden sm:inline">{t(`categories.${key}`)}</span>
            <span className="sm:hidden">{key}</span>
            {equipmentCounts[key] && (
              <Badge variant="secondary" className="ml-1 bg-white text-gray-700">
                {equipmentCounts[key]}
              </Badge>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CategoryNavigation;
