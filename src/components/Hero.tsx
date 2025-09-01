
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/auth";
import { useNavigate } from "react-router-dom";
import AuthModal from "./AuthModal";
import MobileSearchModal from "./MobileSearchModal";

interface HeroProps {
  onCitySearch?: (city: string, searchQuery?: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onCitySearch }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const isMobile = useIsMobile();
  
  const handleSearch = async () => {
    if (!location.trim()) {
      toast({
        title: "Ville manquante",
        description: "Veuillez sélectionner une ville pour rechercher",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSearching(true);
      
      if (onCitySearch) {
        onCitySearch(location.trim(), searchQuery.trim() || undefined);
      } else {
        // Naviguer vers la page de recherche avec les paramètres
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        if (location.trim()) params.set('city', location.trim());
        navigate(`/search?${params.toString()}`);
      }
    } catch (error) {
      toast({
        title: "Erreur de recherche",
        description: "Une erreur est survenue lors de la recherche. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleRentOut = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      setShowAuthModal(true);
    }
  };

  const handleSearchClick = () => {
    setShowSearchModal(true);
  };

  const handleMobileSearch = async () => {
    try {
      setIsSearching(true);
      
      if (location.trim() || searchQuery.trim()) {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        if (location.trim()) params.set('city', location.trim());
        navigate(`/search?${params.toString()}`);
      } else {
        navigate('/search');
      }
    } catch (error) {
      toast({
        title: "Erreur de navigation",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  if (isMobile) {
    return (
      <section className="relative w-full bg-gradient-to-br from-green-50 to-blue-50">
        {/* Section Hero mobile avec titre et description */}
        <div className="px-4 pt-6 pb-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Trouvez et louez rapidement du matériel près de chez vous
          </h1>
          <p className="text-gray-600 text-sm mb-6">
            Des milliers d'équipements disponibles à la location
          </p>
          
          {/* Barre de recherche principale style Airbnb - Mobile optimisé */}
          <div 
            className="bg-white rounded-full shadow-lg border border-gray-200 px-4 py-3 flex items-center space-x-3 cursor-pointer hover:shadow-xl transition-shadow active:scale-95"
            onClick={handleSearchClick}
          >
            <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">Trouver un matériel</div>
              <div className="text-xs text-gray-500 truncate">Équipements • Où • Quand</div>
            </div>
          </div>
        </div>

        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode="login"
        />

        <MobileSearchModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          onSearch={handleMobileSearch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          location={location}
          setLocation={setLocation}
        />
      </section>
    );
  }

  // Desktop version - Style Airbnb avec responsive design amélioré
  return (
    <section className="relative w-full">
      {/* Hero section avec image d'arrière-plan */}
      <div 
        className="relative h-[40vh] lg:h-[45vh] xl:h-[50vh] min-h-[350px] bg-cover bg-center"
        style={{
          backgroundImage: "url('/lovable-uploads/2270a799-6495-4342-9cdb-16a44061ba92.png')"
        }}
      >
        {/* Overlay sombre pour améliorer la lisibilité */}
        <div className="absolute inset-0 bg-black/40"></div>
        
        {/* Content container */}
        <div className="relative h-full flex flex-col justify-center items-center px-4 z-10">
          {/* Titre principal */}
          <div className="text-center mb-8 max-w-4xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Louez l'équipement dont vous avez besoin
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              Trouvez et réservez des équipements près de chez vous
            </p>
          </div>

          {/* Airbnb-style search bar - Responsive amélioré */}
          <div className="w-full max-w-5xl mx-auto">
            <div className="bg-white rounded-full shadow-2xl border border-gray-200 overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Location */}
                <div className="flex-1 px-4 md:px-6 py-3 md:py-4 border-b md:border-b-0 md:border-r border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="text-xs font-semibold text-gray-900 mb-1">Où</div>
                  <input
                    type="text"
                    placeholder="Rechercher une destination"
                    className="w-full text-gray-700 placeholder-gray-400 outline-none bg-transparent text-sm md:text-base"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isSearching && handleSearch()}
                    disabled={isSearching}
                  />
                </div>

                {/* Equipment search */}
                <div className="flex-1 px-4 md:px-6 py-3 md:py-4 border-b md:border-b-0 hover:bg-gray-50 transition-colors">
                  <div className="text-xs font-semibold text-gray-900 mb-1">Quoi</div>
                  <input
                    type="text"
                    placeholder="Quel équipement ?"
                    className="w-full text-gray-700 placeholder-gray-400 outline-none bg-transparent text-sm md:text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isSearching && handleSearch()}
                    disabled={isSearching}
                  />
                </div>

                {/* Search button */}
                <div className="px-4 py-3 md:py-4">
                  <Button
                    className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-full h-auto font-medium text-sm md:text-base shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                    onClick={handleSearch}
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <Search className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                    )}
                    {isSearching ? "Recherche..." : "Rechercher"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
      />
    </section>
  );
};

export default Hero;
