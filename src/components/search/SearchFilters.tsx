
import React, { useState, useEffect } from 'react';
import { Filter, X, MapPin, Euro } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEquipmentSearch } from '@/hooks/useEquipmentSearch';
import { Badge } from '@/components/ui/badge';

interface SearchFiltersProps {
  filters: {
    category: string;
    city: string;
    minPrice?: number;
    maxPrice?: number;
  };
  onFiltersChange: (filters: any) => void;
  resultsCount: number;
}

const categories = [
  'Électronique',
  'Jardinage',
  'Bricolage',
  'Sport',
  'Automobile',
  'Musique',
  'Photo/Vidéo',
  'Cuisine',
  'Nettoyage',
  'Autre'
];

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  resultsCount
}) => {
  const { fetchCities, fetchPriceRange } = useEquipmentSearch();
  const [cities, setCities] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [citiesData, priceData] = await Promise.all([
          fetchCities(),
          fetchPriceRange()
        ]);
        setCities(citiesData || []);
        setPriceRange(priceData || { min: 0, max: 1000 });
      } catch (error) {
        console.error('Erreur lors du chargement des filtres:', error);
        setCities([]);
        setPriceRange({ min: 0, max: 1000 });
      }
    };
    loadFilterData();
  }, [fetchCities, fetchPriceRange]);

  const handleFilterChange = (key: string, value: any) => {
    // Convert "all" values to empty strings for the filter logic
    const filterValue = value === "all-categories" || value === "all-cities" ? "" : value;
    const newFilters = { ...filters, [key]: filterValue };
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({
      category: '',
      city: '',
      minPrice: undefined,
      maxPrice: undefined,
    });
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== '' && value !== undefined && value !== null
  ).length;

  return (
    <Card className="sticky top-24 bg-white shadow-sm border border-gray-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Filter className="h-5 w-5 text-green-600" />
            Filtres
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="lg:hidden"
            >
              {isExpanded ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Effacer
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {resultsCount} équipement{resultsCount !== 1 ? 's' : ''} trouvé{resultsCount !== 1 ? 's' : ''}
        </p>
      </CardHeader>

      <CardContent className={`space-y-6 ${!isExpanded ? 'hidden lg:block' : ''}`}>
        {/* Catégorie */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Filter className="h-4 w-4" />
            Catégorie
          </Label>
          <Select
            value={filters.category || "all-categories"}
            onValueChange={(value) => handleFilterChange('category', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Toutes les catégories" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg">
              <SelectItem value="all-categories">Toutes les catégories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ville */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <MapPin className="h-4 w-4" />
            Ville
          </Label>
          <Select
            value={filters.city || "all-cities"}
            onValueChange={(value) => handleFilterChange('city', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Toutes les villes" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg">
              <SelectItem value="all-cities">Toutes les villes</SelectItem>
              {cities.length > 0 ? (
                cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-cities" disabled>
                  Aucune ville disponible
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Prix */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Euro className="h-4 w-4" />
            Prix par jour (FCFA)
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Minimum</Label>
              <Input
                type="number"
                placeholder={`${priceRange.min}`}
                value={filters.minPrice || ''}
                onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Maximum</Label>
              <Input
                type="number"
                placeholder={`${priceRange.max}`}
                value={filters.maxPrice || ''}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                className="text-sm"
              />
            </div>
          </div>
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            Gamme: {priceRange.min.toLocaleString()} - {priceRange.max.toLocaleString()} FCFA
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
