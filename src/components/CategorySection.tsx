import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, MapPin } from "lucide-react";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Category } from "@/hooks/useCategories";

// Define the component props interface
interface CategorySectionProps {
  categories: Category[] | any[];
  loading: boolean;
}

// Définition des matériels populaires (augmenté à 20)
const popularItems = [
  {
    id: 1,
    name: "Bétonnière professionnelle",
    category: "Construction",
    price: 15000,
    unit: "jour",
    rating: 4.8,
    reviews: 32,
    location: "Cotonou",
  },
  {
    id: 2,
    name: "Tracteur agricole",
    category: "Agriculture",
    price: 45000,
    unit: "jour",
    rating: 4.5,
    reviews: 16,
    location: "Porto-Novo",
  },
  {
    id: 3,
    name: "Sonorisation complète",
    category: "Événementiel",
    price: 25000,
    unit: "jour",
    rating: 4.7,
    reviews: 24,
    location: "Cotonou",
  },
  {
    id: 4,
    name: "Échafaudage métallique",
    category: "Construction",
    price: 8000,
    unit: "jour",
    rating: 4.6,
    reviews: 18,
    location: "Abomey",
  },
  {
    id: 5,
    name: "Motoculteur",
    category: "Agriculture",
    price: 12000,
    unit: "jour",
    rating: 4.3,
    reviews: 14,
    location: "Parakou",
  },
  {
    id: 6,
    name: "Groupe électrogène 5kVA",
    category: "Événementiel",
    price: 10000,
    unit: "jour",
    rating: 4.9,
    reviews: 27,
    location: "Cotonou",
  },
  {
    id: 7,
    name: "Camion benne 3T",
    category: "Transport",
    price: 35000,
    unit: "jour",
    rating: 4.4,
    reviews: 21,
    location: "Porto-Novo",
  },
  {
    id: 8,
    name: "Perceuse industrielle",
    category: "Construction",
    price: 5000,
    unit: "jour",
    rating: 4.7,
    reviews: 29,
    location: "Cotonou",
  },
  {
    id: 9,
    name: "Système d'irrigation",
    category: "Agriculture",
    price: 8500,
    unit: "jour",
    rating: 4.2,
    reviews: 11,
    location: "Parakou",
  },
  {
    id: 10,
    name: "Vidéoprojecteur HD",
    category: "Bureautique",
    price: 7500,
    unit: "jour",
    rating: 4.8,
    reviews: 23,
    location: "Cotonou",
  },
  {
    id: 11,
    name: "Tente de réception 100m²",
    category: "Événementiel",
    price: 30000,
    unit: "jour",
    rating: 4.9,
    reviews: 31,
    location: "Porto-Novo",
  },
  {
    id: 12,
    name: "Meuleuse d'angle",
    category: "Construction",
    price: 3500,
    unit: "jour",
    rating: 4.6,
    reviews: 19,
    location: "Abomey",
  },
  {
    id: 13,
    name: "Pulvérisateur agricole",
    category: "Agriculture",
    price: 4500,
    unit: "jour",
    rating: 4.3,
    reviews: 15,
    location: "Parakou",
  },
  {
    id: 14,
    name: "Camionnette frigorifique",
    category: "Transport",
    price: 40000,
    unit: "jour",
    rating: 4.7,
    reviews: 12,
    location: "Cotonou",
  },
  {
    id: 15,
    name: "Pack 20 tables pliantes",
    category: "Événementiel",
    price: 12000,
    unit: "jour",
    rating: 4.4,
    reviews: 22,
    location: "Porto-Novo",
  },
  {
    id: 16,
    name: "Ponceuse orbitale",
    category: "Construction",
    price: 4000,
    unit: "jour",
    rating: 4.5,
    reviews: 17,
    location: "Cotonou",
  },
  {
    id: 17,
    name: "Imprimante multifonction",
    category: "Bureautique",
    price: 6000,
    unit: "jour",
    rating: 4.2,
    reviews: 13,
    location: "Abomey",
  },
  {
    id: 18,
    name: "Chariot élévateur",
    category: "Transport",
    price: 50000,
    unit: "jour",
    rating: 4.8,
    reviews: 20,
    location: "Parakou",
  },
  {
    id: 19,
    name: "Machine à brouillard",
    category: "Événementiel",
    price: 7000,
    unit: "jour",
    rating: 4.6,
    reviews: 18,
    location: "Cotonou",
  },
  {
    id: 20,
    name: "Cloueuse pneumatique",
    category: "Construction",
    price: 6500,
    unit: "jour",
    rating: 4.7,
    reviews: 25,
    location: "Porto-Novo",
  },
];

const CategorySection: React.FC<CategorySectionProps> = ({ categories, loading }) => {
  // Use the categories prop passed from the parent component instead of the static array
  const displayCategories = categories.length > 0 ? categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon || "📦",
    count: 0, // We don't have count in the API data
    color: "bg-terracotta/10", // Default color
  })) : [];

  return (
    <section className="section bg-white">
      <div className="container-custom">
        <div className="mb-8 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Explorer par catégorie
          </h2>
          <p className="text-gray-600">
            Découvrez une large gamme de matériels disponibles à la location
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full mb-12"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {loading ? (
              // Loading skeletons for categories
              [...Array(6)].map((_, index) => (
                <CarouselItem key={`skeleton-${index}`} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/6">
                  <div className="bg-gray-100 animate-pulse rounded-xl p-4 text-center h-32 flex flex-col justify-center items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-200 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </CarouselItem>
              ))
            ) : displayCategories.length > 0 ? (
              // Render actual categories
              displayCategories.map((category) => (
                <CarouselItem key={category.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/6">
                  <div
                    className={`${category.color} rounded-xl p-4 text-center transition-all hover:scale-105 hover:shadow-md cursor-pointer h-full flex flex-col justify-center items-center`}
                  >
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <h3 className="font-medium mb-1">{category.name}</h3>
                    <p className="text-xs text-gray-600">{category.count} articles</p>
                  </div>
                </CarouselItem>
              ))
            ) : (
              // Fallback when no categories available
              <CarouselItem className="pl-2 md:pl-4 col-span-full text-center py-10">
                <p>Aucune catégorie disponible pour le moment.</p>
              </CarouselItem>
            )}
          </CarouselContent>
          <div className="flex justify-center mt-4">
            <CarouselPrevious className="static transform-none mx-2" />
            <CarouselNext className="static transform-none mx-2" />
          </div>
        </Carousel>

        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold">
              Matériels populaires
            </h2>
            <Button variant="ghost" className="text-terracotta hover:text-terracotta/80 hover:bg-terracotta/10">
              Voir tout <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularItems.map((item, index) => (
              <Card 
                key={item.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="h-40 bg-gradient-to-br from-gray-100 to-white relative">
                  <div className="absolute top-2 left-2 bg-terracotta text-white text-xs font-semibold px-2 py-1 rounded-md">
                    {item.category}
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-base line-clamp-1">{item.name}</h3>
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="ml-1 text-xs">{item.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>{item.location}</span>
                    <span className="mx-1">•</span>
                    <span>{item.reviews} avis</span>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <div>
                      <span className="font-bold text-base">
                        {item.price.toLocaleString()} FCFA
                      </span>
                      <span className="text-xs text-gray-500">/{item.unit}</span>
                    </div>
                    <Button
                      size="sm"
                      className="bg-ocean hover:bg-ocean/90 text-xs px-3 py-1 h-auto"
                    >
                      Réserver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex justify-center mt-8">
            <Button className="bg-terracotta hover:bg-terracotta/90">
              Découvrir plus de matériels <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
