
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { EquipmentData } from '@/types/supabase';
import AirbnbStyleCard from '@/components/AirbnbStyleCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface SearchResultsProps {
  equipments: EquipmentData[];
  isLoading: boolean;
  searchQuery: string;
  filters: any;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  equipments,
  isLoading,
  searchQuery,
  filters
}) => {
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-green-600 mb-4" />
        <p className="text-gray-600 text-lg">Recherche en cours...</p>
        <p className="text-gray-500 text-sm mt-2">Veuillez patienter</p>
      </div>
    );
  }

  if (!equipments || equipments.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-3">
            Aucun équipement trouvé
          </h3>
          <p className="text-gray-600 mb-6 text-lg">
            {searchQuery ? (
              <>Aucun résultat pour "<strong>{searchQuery}</strong>"</>
            ) : (
              'Aucun équipement ne correspond à vos critères de recherche'
            )}
          </p>
          <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
            <p className="font-medium mb-2">Suggestions pour améliorer votre recherche :</p>
            <ul className="text-left space-y-1">
              <li>• Vérifiez l'orthographe de vos mots-clés</li>
              <li>• Essayez des termes plus généraux</li>
              <li>• Supprimez certains filtres</li>
              <li>• Changez la ville de recherche</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header des résultats */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {equipments.length} équipement{equipments.length !== 1 ? 's' : ''} trouvé{equipments.length !== 1 ? 's' : ''}
          </h2>
          {searchQuery && (
            <p className="text-green-600 text-lg mt-1">
              pour "{searchQuery}"
            </p>
          )}
        </div>
      </div>

      {/* Grille des équipements - 2 par ligne comme sur l'accueil */}
      <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-2 gap-6'}`}>
        {equipments.map((equipment) => (
          <AirbnbStyleCard
            key={equipment.id}
            equipment={equipment}
          />
        ))}
      </div>
    </div>
  );
};

