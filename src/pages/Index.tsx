import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Hero from "@/components/Hero";
import HeroBanner from "@/components/HeroBanner";
import ScrollSearchBar from "@/components/ScrollSearchBar";
import ConditionalFooter from "@/components/ConditionalFooter";
import AirbnbStyleCard from "@/components/AirbnbStyleCard";
import CategoryCarousel from "@/components/CategoryCarousel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useFeaturedEquipments } from "@/hooks/useFeaturedEquipments";
import { useCategories } from "@/hooks/useCategories";
import { useEquipmentSearch } from "@/hooks/useEquipmentSearch";
import { useInternational } from "@/hooks/useInternational";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNavigate } from "react-router-dom";
import { EquipmentData } from "@/types/supabase";
import { AlertCircle, RefreshCw, TrendingUp, Users, Shield, ArrowLeft, MapPin, Globe } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import { useScrollBehavior } from "@/hooks/useScrollBehavior";
import MobileBanner from "@/components/MobileBanner";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { showScrollSearch } = useScrollBehavior();
  const { getAllCities, getLocalCities, getCurrencySymbol, getUserCountry, userLocation } = useInternational();
  const { location, isLoading: locationLoading, error: locationError } = useGeolocation();
  const { fetchFeaturedEquipments } = useFeaturedEquipments();
  const { fetchCategories } = useCategories();
  const { searchEquipments } = useEquipmentSearch();
  const [featuredEquipments, setFeaturedEquipments] = useState<EquipmentData[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [cityEquipments, setCityEquipments] = useState<EquipmentData[]>([]);
  const [loadingCityEquipments, setLoadingCityEquipments] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("📦 Chargement des équipements...");
      
      // Filtrer par pays de l'utilisateur si disponible
      const searchParams: any = {};
      if (location?.country) {
        searchParams.country = location.country;
      }
      
      const [equipments, categoriesData] = await Promise.all([
        fetchFeaturedEquipments(),
        fetchCategories()
      ]);
      
      console.log("📦 Équipements récupérés:", equipments.length);
      console.log("🌍 Localisation utilisateur:", location);
      
      setFeaturedEquipments(equipments);
      setCategories(categoriesData);
      
    } catch (error: any) {
      console.error("❌ Erreur lors du chargement des données:", error);
      setError(error.message || "Erreur de chargement");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCityEquipments = async (city: string, query?: string) => {
    try {
      setLoadingCityEquipments(true);
      console.log(`🏙️ Chargement des équipements pour ${city}...`, query ? `avec recherche: ${query}` : '');
      
      const searchParams: any = { city };
      if (query) {
        searchParams.searchQuery = query;
      }
      
      const [equipments, categoriesData] = await Promise.all([
        searchEquipments(searchParams),
        fetchCategories()
      ]);
      
      setCityEquipments(equipments);
      setCategories(categoriesData);
      setSelectedCity(city);
      setSearchQuery(query);
    } catch (error: any) {
      console.error("❌ Erreur lors du chargement des équipements de la ville:", error);
      setError(error.message || "Erreur de chargement des équipements de la ville");
    } finally {
      setLoadingCityEquipments(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    console.log('Catégorie sélectionnée:', categoryId);
    setSelectedCategory(categoryId);
    // Ici vous pouvez filtrer les équipements par catégorie
    // ou naviguer vers une page de recherche avec le filtre de catégorie
  };

  const handleBackToHome = () => {
    setSelectedCity(null);
    setCityEquipments([]);
    setSearchQuery(undefined);
    setSelectedCategory(null);
  };

  const handleCategoryFilter = (categoryId: string) => {
    console.log('Filtrage par catégorie:', categoryId);
  };

  useEffect(() => {
    // Attendre que la géolocalisation soit terminée avant de charger les données
    if (!locationLoading && location) {
      loadData();
    }
  }, [location, locationLoading]);

  const handleRetry = () => {
    loadData();
  };

  // Utiliser les villes locales en priorité
  const priorityCities = getLocalCities();
  const userCountry = getUserCountry();
  
  const groupEquipmentsByCity = (equipments: EquipmentData[]) => {
    const cities = priorityCities.slice(0, 6); // Prendre les 6 premières villes du pays de l'utilisateur
    const grouped: { [key: string]: EquipmentData[] } = {};
    
    cities.forEach(city => {
      grouped[city] = equipments.filter(eq => eq.city === city).slice(0, 6);
      if (grouped[city].length < 6) {
        const remaining = equipments.filter(eq => eq.city !== city).slice(0, 6 - grouped[city].length);
        grouped[city] = [...grouped[city], ...remaining];
      }
    });
    
    return grouped;
  };

  const equipmentsByCity = !isMobile ? groupEquipmentsByCity(featuredEquipments) : {};

  // Si une ville est sélectionnée, afficher ses équipements
  if (selectedCity) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <ScrollSearchBar isVisible={true} onCitySearch={loadCityEquipments} />
        
        <section className={`${isMobile ? 'py-2 pt-16' : 'py-12 pt-24'} bg-gray-50 flex-1 min-h-0`}>
          <div className="max-w-7xl mx-auto px-4">
            {/* Categories Carousel - Fixe juste avant le titre */}
            <div className="mb-3">
              <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide pb-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    onClick={() => handleCategoryFilter(category.id)}
                    className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full border border-gray-200 hover:border-green-300 hover:bg-green-50 cursor-pointer transition-all duration-200 whitespace-nowrap flex-shrink-0"
                  >
                    <span className="text-lg">{category.icon || "📦"}</span>
                    <span className="text-sm font-medium text-gray-700">{category.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Header avec bouton retour */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={handleBackToHome}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>{t('common.back')}</span>
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {t('equipment.popular')} {selectedCity}
                    {searchQuery && ` - "${searchQuery}"`}
                  </h1>
                  <p className="text-gray-600 text-sm">
                    {cityEquipments.length} {cityEquipments.length > 1 ? t('common.equipments') : t('common.equipment')} {cityEquipments.length > 1 ? t('common.availables') : t('common.available')}
                    {searchQuery && ` pour "${searchQuery}"`}
                  </p>
                </div>
              </div>
            </div>

            {/* Loading state pour la ville */}
            {loadingCityEquipments ? (
              <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-6 gap-4'}`}>
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className={`${isMobile ? 'aspect-square' : 'aspect-[4/3]'} bg-gray-200 rounded-xl mb-2`}></div>
                    <div className="space-y-1.5">
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2.5 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-2.5 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : cityEquipments.length > 0 ? (
              <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-6 gap-4'}`}>
                {cityEquipments.map((equipment) => (
                  <AirbnbStyleCard
                    key={equipment.id}
                    equipment={equipment}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <div className="text-gray-500 mb-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium mb-2">
                    {t('equipment.noEquipment')} {selectedCity}
                    {searchQuery && ` pour "${searchQuery}"`}
                  </p>
                  <p className="text-sm">{t('equipment.tryOtherSearch')}</p>
                </div>
              </Card>
            )}
          </div>
        </section>

        <ConditionalFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ScrollSearchBar isVisible={showScrollSearch} onCitySearch={loadCityEquipments} />
      
      {/* HeroBanner seulement sur desktop */}
      {!isMobile && <HeroBanner />}
      
      {/* Indicateur de localisation */}
      {location && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-center space-x-2 text-sm text-green-800">
              <MapPin className="h-4 w-4" />
              <span>
                {t('hero.showingEquipmentsFor')} {location.city}, {location.country}
              </span>
              {userCountry && (
                <span className="ml-2">{userCountry.flag}</span>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Hero seulement sur desktop */}
      {!isMobile && <Hero onCitySearch={loadCityEquipments} />}
      
      {/* Section Catégories Carousel */}
      <CategoryCarousel 
        onCategorySelect={handleCategorySelect}
        selectedCategory={selectedCategory}
      />
      
      {/* Bannière mobile uniquement */}
      <MobileBanner />
      
      {/* Section équipements populaires */}
      <section className={`${isMobile ? 'py-1 pt-4' : 'py-12'} bg-gray-50 flex-1`}>
        <div className="max-w-7xl mx-auto px-4">
          {/* Error Alert */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-red-800">{t('common.error')}: {error}</span>
                <Button 
                  onClick={handleRetry} 
                  size="sm" 
                  variant="outline"
                  className="ml-4 border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {t('common.retry')}
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Location Error Alert */}
          {locationError && (
            <Alert className="mb-6 border-orange-200 bg-orange-50">
              <Globe className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <p className="mb-2">Impossible de détecter automatiquement votre localisation.</p>
                <p className="text-sm">Les équipements affichés peuvent ne pas correspondre à votre région.</p>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Loading State */}
          {(isLoading || locationLoading) ? (
            <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-6 gap-3'}`}>
              {[...Array(isMobile ? 6 : 12)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className={`${isMobile ? 'aspect-square' : 'aspect-[4/3]'} bg-gray-200 rounded-xl mb-2`}></div>
                  <div className="space-y-1">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredEquipments.length > 0 ? (
            <>
              {/* Version Mobile */}
              {isMobile ? (
                <>
                  <div className="mb-2">
                    <div className="mb-2">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {t('equipment.popular')}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {location?.city || priorityCities[0] || 'Votre région'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {featuredEquipments.slice(0, 6).map((equipment) => (
                      <AirbnbStyleCard
                        key={equipment.id}
                        equipment={equipment}
                      />
                    ))}
                  </div>
                  
                  <div className="mb-4">
                    <div className="mb-2">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {t('common.equipments')} {t('common.availables')}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {priorityCities[1] || 'Région proche'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {featuredEquipments.slice(4, 8).map((equipment) => (
                        <AirbnbStyleCard
                          key={`weekend-${equipment.id}`}
                          equipment={equipment}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* Version Web - Par ville avec grille 6x6 */
                <>
                  {Object.entries(equipmentsByCity).map(([city, cityEquipments]) => (
                    cityEquipments.length > 0 && (
                      <div key={city} className="mb-12">
                        <div className="mb-6">
                          <h2 className="text-xl font-bold text-gray-900 mb-1">
                            {t('equipment.popular')}
                          </h2>
                          <p className="text-gray-600 flex items-center space-x-2">
                            <span>{city}</span>
                            {userCountry && <span>{userCountry.flag}</span>}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-6 gap-3 mb-8">
                          {cityEquipments.map((equipment) => (
                            <div key={`${city}-${equipment.id}`} className="w-full">
                              <AirbnbStyleCard
                                equipment={equipment}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </>
              )}
            </>
          ) : !error ? (
            <Card className="p-8 text-center">
              <div className="text-gray-500 mb-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium mb-2">{t('equipment.noEquipment')}</p>
                <p className="text-sm">{t('equipment.tryOtherSearch')}</p>
              </div>
              <Button 
                onClick={handleRetry}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('common.retry')}
              </Button>
            </Card>
          ) : null}
        </div>
      </section>

      {/* Section statistiques */}
      <section className="py-8 md:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              {t('stats.community')}
            </h2>
            <p className="text-gray-600">
              {t('stats.trustUs')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <Card className="text-center p-4 md:p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">10,000+</h3>
              <p className="text-gray-600 text-sm md:text-base">{t('stats.activeUsers')}</p>
            </Card>
            
            <Card className="text-center p-4 md:p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">50,000+</h3>
              <p className="text-gray-600 text-sm md:text-base">{t('stats.completedRentals')}</p>
            </Card>
            
            <Card className="text-center p-4 md:p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Shield className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">99%</h3>
              <p className="text-gray-600 text-sm md:text-base">{t('stats.satisfaction')}</p>
            </Card>
          </div>
        </div>
      </section>

      <ConditionalFooter />
    </div>
  );
};

export default Index;
