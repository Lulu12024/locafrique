import { Crown, Star, TrendingUp } from 'lucide-react';

const PremiumEquipmentSection = () => {
  return (
    <section className="py-16 bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* En-tête premium */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium mb-4">
            <Crown className="h-4 w-4 mr-2" />
            Équipements Premium
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Sélection <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">Premium</span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez nos équipements haut de gamme sélectionnés par nos partenaires premium
          </p>
        </div>

        {/* Grille d'équipements premium */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Cards d'équipements avec badge premium */}
        </div>
      </div>
    </section>
  );
};