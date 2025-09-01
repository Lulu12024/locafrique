
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, MapPin, X } from "lucide-react";
import { DialogClose } from "@/components/ui/dialog";

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: () => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
}

const MobileSearchModal: React.FC<MobileSearchModalProps> = ({
  isOpen,
  onClose,
  onSearch,
  searchQuery,
  setSearchQuery,
  location,
  setLocation,
}) => {
  const handleSearch = () => {
    onSearch();
    onClose();
  };

  // Villes prédéfinies pour sélection rapide
  const cities = ['Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi', 'Djougou', 'Bohicon'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-sm mx-auto p-0 bg-white rounded-t-3xl bottom-0 top-auto translate-y-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Rechercher
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Location Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              Où ?
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Ville, quartier..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            
            {/* Villes rapides */}
            <div className="flex flex-wrap gap-2 mt-2">
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => setLocation(city)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    location === city 
                      ? 'bg-green-500 text-white border-green-500' 
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-green-300'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              Quel équipement recherchez-vous ?
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Ex: Perceuse, Scie, Échelle..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Search Button */}
          <Button
            onClick={handleSearch}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-medium text-base shadow-sm"
          >
            <Search className="h-5 w-5 mr-2" />
            Rechercher
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobileSearchModal;
