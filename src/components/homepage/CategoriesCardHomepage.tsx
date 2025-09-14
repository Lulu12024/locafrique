import React, { useState, useRef, useEffect } from 'react';
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
  ChevronLeft,
  TrendingUp,
  Users,
  MapPin,
  Star
} from 'lucide-react';

const CategoriesHomepage = () => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

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

  // Calcul des dimensions responsive
  const getItemsPerView = () => {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth < 640) return 1; // mobile
    if (window.innerWidth < 768) return 2; // sm
    if (window.innerWidth < 1024) return 3; // md
    if (window.innerWidth < 1280) return 4; // lg
    return 5; // xl et plus
  };

  const [itemsPerView, setItemsPerView] = useState(getItemsPerView);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerView(getItemsPerView());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, categories.length - itemsPerView);

  // Navigation functions
  const goToPrevious = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Touch handlers pour le swipe mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    }
    if (isRightSwipe) {
      goToPrevious();
    }
  };

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

        {/* Carrousel des catégories */}
        <div className="relative">
          {/* Bouton Précédent */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-lg border-gray-200 hover:bg-white hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            onClick={goToPrevious}
            disabled={isTransitioning}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Bouton Suivant */}
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-lg border-gray-200 hover:bg-white hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            onClick={goToNext}
            disabled={isTransitioning}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Container du carrousel */}
          <div className="overflow-hidden mx-8">
            <div
              ref={carouselRef}
              className="flex transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <div
                    key={category.id}
                    className="flex-none px-3"
                    style={{ width: `${100 / itemsPerView}%` }}
                  >
                    <Card 
                      className="group hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-3 border-0 overflow-hidden relative h-full"
                      onMouseEnter={() => setHoveredCategory(category.id)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      onClick={() => handleCategoryClick(category.id)}
                    >
                      <CardContent className="p-0 h-full flex flex-col">
                        {/* Header avec gradient */}
                        <div className={`bg-gradient-to-br ${category.gradient} p-6 text-white relative overflow-hidden flex-grow`}>
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
                        <div className="p-4 bg-white flex-shrink-0">
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
                                  +{category.subcategories.length - 3} plus
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Indicateurs de position */}
          <div className="flex justify-center mt-6 space-x-2">
            {Array.from({ length: maxIndex + 1 }, (_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex 
                    ? 'bg-green-600 w-8' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                onClick={() => {
                  if (!isTransitioning) {
                    setIsTransitioning(true);
                    setCurrentIndex(index);
                    setTimeout(() => setIsTransitioning(false), 300);
                  }
                }}
              />
            ))}
          </div>
        </div>

        {/* Section statistiques */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">15,000+</h3>
            <p className="text-gray-600">Utilisateurs actifs</p>
          </div>

          <div className="p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">95%</h3>
            <p className="text-gray-600">Taux de satisfaction</p>
          </div>

          <div className="p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">50+</h3>
            <p className="text-gray-600">Villes couvertes</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoriesHomepage;