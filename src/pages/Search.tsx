
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useEquipmentSearch } from '@/hooks/useEquipmentSearch';
import { SearchFilters } from '@/components/search/SearchFilters';
import { SearchResults } from '@/components/search/SearchResults';
import { SearchHeader } from '@/components/search/SearchHeader';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import { EquipmentData } from '@/types/supabase';
import { useIsMobile } from '@/hooks/use-mobile';

const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { searchEquipments, isLoading } = useEquipmentSearch();
  const isMobile = useIsMobile();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [equipments, setEquipments] = useState<EquipmentData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    city: searchParams.get('city') || '',
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
  });

  const handleSearch = useCallback(async (query: string, newFilters = filters) => {
    try {
      setError(null);
      console.log('🔍 Recherche avec:', { query, filters: newFilters });
      
      const results = await searchEquipments({
        searchQuery: query.trim() || undefined,
        ...newFilters,
      });
      
      console.log('✅ Résultats trouvés:', results?.length || 0);
      setEquipments(results || []);
    } catch (error: any) {
      console.error('❌ Erreur de recherche:', error);
      setError(error.message || 'Erreur lors de la recherche');
      setEquipments([]);
    }
  }, [searchEquipments, filters]);

  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    console.log('🎛️ Filtres changés:', newFilters);
    setFilters(newFilters);
    handleSearch(searchQuery, newFilters);
  }, [searchQuery, handleSearch]);

  const handleSearchSubmit = useCallback((query: string) => {
    setSearchQuery(query);
    handleSearch(query, filters);
  }, [filters, handleSearch]);

  const handleRetry = () => {
    handleSearch(searchQuery, filters);
  };

  // Recherche initiale au chargement
  useEffect(() => {
    console.log('🚀 Chargement initial de la page de recherche');
    handleSearch(searchQuery, filters);
  }, []); // Dépendances vides pour éviter les re-renders infinis

  // Écouter les changements d'URL
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    const urlCategory = searchParams.get('category') || '';
    const urlCity = searchParams.get('city') || '';
    
    if (urlQuery !== searchQuery || urlCategory !== filters.category || urlCity !== filters.city) {
      console.log('🔄 URL changée, mise à jour des paramètres');
      setSearchQuery(urlQuery);
      const newFilters = {
        category: urlCategory,
        city: urlCity,
        minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
        maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      };
      setFilters(newFilters);
      handleSearch(urlQuery, newFilters);
    }
  }, [location.search]); // Seulement dépendant de location.search

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec barre de recherche */}
      <SearchHeader 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearchSubmit}
        isLoading={isLoading}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Message d'erreur amélioré */}
        {error && (
          <div className="mb-6">
            <ErrorMessage 
              title="Erreur de recherche"
              message={error}
              onRetry={handleRetry}
              retryText="Relancer la recherche"
            />
          </div>
        )}

        {/* Layout responsive amélioré */}
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Sidebar des filtres - Responsive amélioré */}
          <div className={`${isMobile ? 'w-full' : 'w-full xl:w-80 xl:flex-shrink-0'}`}>
            <div className={`${isMobile ? '' : 'sticky top-24'}`}>
              <SearchFilters 
                filters={filters}
                onFiltersChange={handleFilterChange}
                resultsCount={equipments?.length || 0}
              />
            </div>
          </div>

          {/* Résultats de recherche - Layout amélioré */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="flex justify-center items-center min-h-96">
                <LoadingSpinner 
                  size="lg" 
                  text="Recherche en cours..." 
                  className="flex-col space-y-4"
                />
              </div>
            ) : (
              <SearchResults 
                equipments={equipments || []}
                isLoading={isLoading}
                searchQuery={searchQuery}
                filters={filters}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
