
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/components/ui/use-toast";
import MobileSearchModal from "./MobileSearchModal";

interface ScrollSearchBarProps {
  isVisible: boolean;
  onCitySearch?: (city: string, searchQuery?: string) => void;
}

const ScrollSearchBar: React.FC<ScrollSearchBarProps> = ({ isVisible, onCitySearch }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const handleSearch = () => {
    if (location.trim() && onCitySearch) {
      onCitySearch(location, searchQuery.trim() || undefined);
    } else if (!location.trim()) {
      toast({
        title: "Ville manquante",
        description: "Veuillez sélectionner une ville pour rechercher",
        variant: "destructive",
      });
    }
  };

  const handleSearchClick = () => {
    setShowSearchModal(true);
  };

  if (isMobile) {
    return (
      <>
        <div 
          className={`fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 transition-transform duration-300 ${
            isVisible ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <div className="px-4 py-3">
            <div 
              className="bg-white rounded-full shadow-lg border border-gray-200 px-4 py-3 flex items-center space-x-3 cursor-pointer"
              onClick={handleSearchClick}
            >
              <Search className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Trouver un matériel</div>
                <div className="text-xs text-gray-500">Équipements • Où • Quand</div>
              </div>
            </div>
          </div>
        </div>

        <MobileSearchModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          onSearch={handleSearch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          location={location}
          setLocation={setLocation}
        />
      </>
    );
  }

  return (
    <div 
      className={`fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="bg-white rounded-full shadow-xl border border-gray-200 overflow-hidden">
          <div className="flex">
            {/* Location */}
            <div className="flex-1 px-6 py-3 border-r border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="text-xs font-semibold text-gray-900 mb-1">Où</div>
              <input
                type="text"
                placeholder="Rechercher une destination"
                className="w-full text-gray-700 placeholder-gray-400 outline-none bg-transparent text-sm"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Equipment search */}
            <div className="flex-1 px-6 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="text-xs font-semibold text-gray-900 mb-1">Quoi</div>
              <input
                type="text"
                placeholder="Quel équipement ?"
                className="w-full text-gray-700 placeholder-gray-400 outline-none bg-transparent text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Search button */}
            <div className="px-4 py-3">
              <Button
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full h-auto font-medium text-sm shadow-lg"
                onClick={handleSearch}
              >
                <Search className="h-4 w-4 mr-2" />
                Rechercher
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScrollSearchBar;
