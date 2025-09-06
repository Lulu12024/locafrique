import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Smartphone, 
  Car, 
  Wrench, 
  Printer, 
  Gamepad2, 
  Music, 
  Refrigerator, 
  Headphones, 
  Hammer, 
  Truck,
  Camera,
  Bike,
  Settings,
  Monitor,
  Dumbbell,
  PartyPopper,
  WashingMachine,
  Mic,
  Scissors,
  ChevronRight,
  TrendingUp,
  Users,
  MapPin,
  Star
} from 'lucide-react';

const CategoriesHomepage = () => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Catégories selon le cahier des charges 3W-LOC
  const categories = [
    {
      id: 'electronique',
      name: 'Électronique',
      icon: Smartphone,
      gradient: 'from-blue-500 to-purple-600',
      description: 'Appareils photo, smartphones, tablettes, ordinateurs',
      subcategories: [
        'Appareils photo', 'Caméras', 'Smartphones', 
        'Tablettes', 'Ordinateurs portables', 'Consoles de jeux'
      ],
      color: '#3B82F6',
      count: 342,
      trending: true
    },
    {
      id: 'vehicules',
      name: 'Véhicules',
      icon: Car,
      gradient: 'from-red-500 to-orange-600',
      description: 'Voitures, motos, vélos, camions et caravans',
      subcategories: [
        'Voitures', 'Motos', 'Vélos', 
        'Trottinettes électriques', 'Camions', 'Caravans'
      ],
      color: '#EF4444',
      count: 158,
      trending: false
    },
    {
      id: 'outils-equipements',
      name: 'Outils & Équipements',
      icon: Wrench,
      gradient: 'from-green-500 to-emerald-600',
      description: 'Outils de jardinage, bricolage, construction',
      subcategories: [
        'Outils de jardinage', 'Outils de bricolage', 
        'Équipements de construction', 'Outils de mécanique'
      ],
      color: '#10B981',
      count: 567,
      trending: true
    },
    {
      id: 'materiel-bureau',
      name: 'Matériel de Bureau',
      icon: Printer,
      gradient: 'from-indigo-500 to-blue-600',
      description: 'Imprimantes, projecteurs, écrans, meubles',
      subcategories: [
        'Imprimantes', 'Projecteurs', 'Écrans', 'Meubles de bureau'
      ],
      color: '#6366F1',
      count: 89,
      trending: false
    },
    {
      id: 'equipements-loisirs',
      name: 'Équipements de Loisirs',
      icon: Gamepad2,
      gradient: 'from-pink-500 to-rose-600',
      description: 'Sport, musique, camping, jeux de société',
      subcategories: [
        'Jeux de société', 'Équipements de sport', 
        'Instruments de musique', 'Matériel de camping'
      ],
      color: '#EC4899',
      count: 234,
      trending: true
    },
    {
      id: 'evenements',
      name: 'Événements',
      icon: Music,
      gradient: 'from-yellow-500 to-orange-600',
      description: 'Sonorisation, éclairage, décoration, mobilier',
      subcategories: [
        'Équipements de sonorisation', 'Éclairage', 
        'Tables et chaises', 'Tentes', 'Décorations'
      ],
      color: '#F59E0B',
      count: 127,
      trending: false
    },
    {
      id: 'electromenager',
      name: 'Électroménager',
      icon: Refrigerator,
      gradient: 'from-cyan-500 to-blue-600',
      description: 'Réfrigérateurs, machines à laver, micro-ondes',
      subcategories: [
        'Réfrigérateurs', 'Machines à laver', 
        'Micro-ondes', 'Aspirateurs'
      ],
      color: '#06B6D4',
      count: 76,
      trending: false
    },
    {
      id: 'materiel-audiovisuel',
      name: 'Matériel Audiovisuel',
      icon: Headphones,
      gradient: 'from-purple-500 to-indigo-600',
      description: 'Enceintes, micros, équipements DJ, caméras pro',
      subcategories: [
        'Enceintes', 'Micros', 'Équipements DJ', 
        'Caméras professionnelles'
      ],
      color: '#8B5CF6',
      count: 145,
      trending: true
    },
    {
      id: 'bricolage-jardinage',
      name: 'Bricolage & Jardinage',
      icon: Hammer,
      gradient: 'from-green-600 to-lime-600',
      description: 'Tondeuses, tronçonneuses, outillage divers',
      subcategories: [
        'Tondeuses', 'Tronçonneuses', 
        'Taille-haies', 'Outillage divers'
      ],
      color: '#16A34A',
      count: 198,
      trending: false
    },
    {
      id: 'equipements-transport',
      name: 'Équipements de Transport',
      icon: Truck,
      gradient: 'from-gray-600 to-slate-700',
      description: 'Remorques, pelles mécaniques, chariots',
      subcategories: [
        'Remorques', 'Pelles mécaniques', 'Chariots élévateurs'
      ],
      color: '#475569',
      count: 67,
      trending: false
    }
  ];

  // Fonction pour obtenir l'icône de sous-catégorie
  const getSubcategoryIcon = (subcategory: string) => {
    const iconMap: { [key: string]: any } = {
      'Appareils photo': Camera,
      'Smartphones': Smartphone,
      'Voitures': Car,
      'Motos': Bike,
      'Vélos': Bike,
      'Outils de bricolage': Settings,
      'Imprimantes': Printer,
      'Projecteurs': Monitor,
      'Équipements de sport': Dumbbell,
      'Instruments de musique': Music,
      'Équipements de sonorisation': PartyPopper,
      'Machines à laver': WashingMachine,
      'Enceintes': Headphones,
      'Micros': Mic,
      'Tondeuses': Scissors,
      'Chariots élévateurs': Truck
    };
    
    return iconMap[subcategory] || Wrench;
  };

  const handleCategoryClick = (categoryId: string) => {
    // Navigation vers la page de recherche avec filtre de catégorie
    window.location.href = `/search?category=${categoryId}`;
  };

  const handleSubcategoryClick = (categoryId: string, subcategory: string) => {
    // Navigation vers la page de recherche avec filtre de sous-catégorie
    window.location.href = `/search?category=${categoryId}&subcategory=${encodeURIComponent(subcategory)}`;
  };

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* En-tête de section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-4">
            <TrendingUp className="h-4 w-4 mr-2" />
            Plus de 2000 équipements disponibles
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Explorez nos <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">Catégories</span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Trouvez l'équipement parfait parmi nos 10 catégories principales. 
            De l'électronique aux équipements de construction, tout est disponible près de chez vous.
          </p>
        </div>

        {/* Grille des catégories principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-16">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Card 
                key={category.id}
                className="group hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-3 border-0 overflow-hidden relative"
                onMouseEnter={() => setHoveredCategory(category.id)}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={() => handleCategoryClick(category.id)}
              >
                <CardContent className="p-0">
                  {/* Header avec gradient */}
                  <div className={`bg-gradient-to-br ${category.gradient} p-6 text-white relative overflow-hidden`}>
                    {/* Badge trending */}
                    {category.trending && (
                      <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold flex items-center">
                        <Star className="h-3 w-3 mr-1" />
                        Tendance
                      </div>
                    )}
                    
                    {/* Effet de brillance au hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                    
                    <div className="relative z-10">
                      <IconComponent className="h-12 w-12 mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-lg" />
                      <h3 className="text-lg font-bold mb-2 leading-tight">
                        {category.name}
                      </h3>
                      <p className="text-sm opacity-90 leading-relaxed">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Contenu avec compteur et preview sous-catégories */}
                  <div className="p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-semibold">
                        {category.count} articles
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                    </div>
                    
                    {/* Sous-catégories en preview */}
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Sous-catégories :
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {category.subcategories.slice(0, 3).map((sub, index) => (
                          <span 
                            key={index}
                            className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubcategoryClick(category.id, sub);
                            }}
                          >
                            {sub}
                          </span>
                        ))}
                        {category.subcategories.length > 3 && (
                          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-md font-medium">
                            +{category.subcategories.length - 3} autres
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Section détaillée des sous-catégories populaires */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-12">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Sous-catégories les plus recherchées
            </h3>
            <p className="text-gray-600">
              Découvrez les équipements les plus demandés par notre communauté
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'Appareils photo', count: 89, category: 'electronique' },
              { name: 'Vélos', count: 67, category: 'vehicules' },
              { name: 'Outils de bricolage', count: 134, category: 'outils-equipements' },
              { name: 'Projecteurs', count: 45, category: 'materiel-bureau' },
              { name: 'Équipements de sport', count: 78, category: 'equipements-loisirs' },
              { name: 'Sonorisation', count: 56, category: 'evenements' },
              { name: 'Machines à laver', count: 34, category: 'electromenager' },
              { name: 'Micros', count: 43, category: 'materiel-audiovisuel' },
              { name: 'Tondeuses', count: 67, category: 'bricolage-jardinage' },
              { name: 'Remorques', count: 23, category: 'equipements-transport' },
              { name: 'Smartphones', count: 156, category: 'electronique' },
              { name: 'Caméras pro', count: 34, category: 'materiel-audiovisuel' }
            ].map((subcategory, index) => {
              const IconComponent = getSubcategoryIcon(subcategory.name);
              return (
                <div 
                  key={index}
                  className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group border border-transparent hover:border-gray-200"
                  onClick={() => handleSubcategoryClick(subcategory.category, subcategory.name)}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform group-hover:shadow-lg">
                    <IconComponent className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 text-center leading-tight mb-1">
                    {subcategory.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {subcategory.count} articles
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section CTA pour les propriétaires */}
        <div className="relative overflow-hidden rounded-3xl">
          <div className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 p-8 lg:p-12 text-white relative">
            {/* Motif de fond */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
              <div className="grid grid-cols-8 gap-4 h-full">
                {Array.from({ length: 32 }).map((_, i) => (
                  <div key={i} className="bg-white/10 rounded-full"></div>
                ))}
              </div>
            </div>
            
            <div className="relative z-10 text-center">
              <h3 className="text-3xl lg:text-4xl font-bold mb-4">
                Vous avez du matériel à louer ?
              </h3>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                Rejoignez plus de 1200 propriétaires qui génèrent des revenus avec leurs équipements. 
                Inscription gratuite et commission compétitive.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg" 
                  className="bg-white text-green-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg"
                  onClick={() => window.location.href = '/become-owner'}
                >
                  Publier une annonce
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-xl"
                  onClick={() => window.location.href = '/how-it-works'}
                >
                  Comment ça marche
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques de la plateforme */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
          {[
            { label: 'Catégories', value: '10', icon: '📂', description: 'Secteurs couverts' },
            { label: 'Équipements', value: '2000+', icon: '⚙️', description: 'Articles disponibles' },
            { label: 'Utilisateurs', value: '1200+', icon: '👥', description: 'Membres actifs' },
            { label: 'Villes', value: '25+', icon: '🏙️', description: 'Locations couvertes' }
          ].map((stat, index) => (
            <div key={index} className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-3">{stat.icon}</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm font-medium text-gray-700 mb-1">{stat.label}</div>
              <div className="text-xs text-gray-500">{stat.description}</div>
            </div>
          ))}
        </div>

        {/* Indicateur des villes principales */}
        <div className="mt-12 text-center">
          <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center justify-center">
            <MapPin className="h-5 w-5 mr-2 text-green-600" />
            Disponible dans vos villes
          </h4>
          <div className="flex flex-wrap justify-center gap-3">
            {['Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi', 'Ouidah', 'Natitingou'].map((city, index) => (
              <Badge key={index} variant="outline" className="px-4 py-2 text-sm">
                {city}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoriesHomepage;  