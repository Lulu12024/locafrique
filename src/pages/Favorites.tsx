
import React from 'react';
import { Heart, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/auth/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import AirbnbStyleCard from '@/components/AirbnbStyleCard';
import { EquipmentData } from '@/types/supabase';

const Favorites = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { favorites, loading } = useFavorites();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="px-4 py-6">
          <div className="mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour</span>
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Mes Favoris</h1>
            </div>
          </div>

          <Card>
            <CardContent className="p-8 text-center">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Connexion requise
              </h3>
              <p className="text-gray-600 mb-6">
                Vous devez être connecté pour voir vos favoris
              </p>
              <Button 
                onClick={() => navigate('/auth')}
                className="bg-green-600 hover:bg-green-700"
              >
                Se connecter
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${!isMobile ? 'pb-0' : 'pb-20'}`}>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mes Favoris</h1>
              <p className="text-gray-600">
                {favorites.length} équipement{favorites.length > 1 ? 's' : ''} en favoris
              </p>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-6 gap-4'}`}>
            {[...Array(6)].map((_, i) => (
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
        ) : favorites.length > 0 ? (
          <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-6 gap-4'}`}>
            {favorites.map((favorite) => {
              // Transformer le favori en équipment pour le composant
              const equipment: EquipmentData = {
                ...favorite.equipment,
                images: favorite.equipment?.images || []
              };
              
              return (
                <AirbnbStyleCard
                  key={favorite.id}
                  equipment={equipment}
                />
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <Card>
            <CardContent className="p-8 text-center">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun favori pour le moment
              </h3>
              <p className="text-gray-600 mb-6">
                Ajoutez des équipements à vos favoris pour les retrouver facilement ici
              </p>
              <Button 
                onClick={() => navigate('/')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Search className="h-4 w-4 mr-2" />
                Découvrir des équipements
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Favorites;
