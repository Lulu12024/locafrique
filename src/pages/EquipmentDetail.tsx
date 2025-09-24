// src/pages/EquipmentDetail.tsx - VERSION CORRIGÉE
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  MapPin, 
  Star, 
  Shield, 
  Package, 
  Clock, 
  CreditCard, 
  ArrowRight, 
  Heart, 
  Share2, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft, 
  Loader2,
  MessageSquare,
  Award,
  TrendingUp,
  Eye,
  Users,
  CheckCircle,
  Zap,
  Percent,
  DollarSign,
  Camera,
  Hammer,
  Flower
} from 'lucide-react';
import { EquipmentData } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import ReservationModal from '@/components/booking/ReservationModal';
import { useAuth } from '@/hooks/auth';
import { useEquipmentReviews } from '@/hooks/useEquipmentReviews';
import type { EquipmentReview } from '@/hooks/useEquipmentReviews';
import { useIsMobile } from '@/hooks/use-mobile';

// Composant pour images avec fallback - SOLUTION PROBLÈME 2
interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  category?: string; // Nouvelle prop pour personnaliser le fallback
}

const SafeImage: React.FC<SafeImageProps> = ({ 
  src, 
  alt, 
  className,
  fallbackSrc = '/api/placeholder/400/300',
  category 
}) => {
  const [imageSrc, setImageSrc] = useState(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showFallback, setShowFallback] = useState(!src);

  // CORRECTION : Écouter les changements de src
  useEffect(() => {
    if (src) {
      setImageSrc(src);
      setHasError(false);
      setIsLoading(true);
      setShowFallback(false);
    } else {
      setShowFallback(true);
      setIsLoading(false);
    }
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setShowFallback(true);
      setImageSrc(fallbackSrc);
    }
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Icône selon la catégorie
  const getCategoryIcon = () => {
    const iconClass = "h-16 w-16 text-green-600";
    
    switch(category?.toLowerCase()) {
      case 'electromenager':
      case 'électroménager':
        return <Package className={iconClass} />;
      case 'construction':
        return <Hammer className={iconClass} />;
      case 'electronique':
      case 'électronique':
        return <Zap className={iconClass} />;
      case 'jardinage':
        return <Flower className={iconClass} />;
      default:
        return <Package className={iconClass} />;
    }
  };

  if (showFallback && !src) {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 ${className} flex items-center justify-center`}>
        <div className="text-center">
          {getCategoryIcon()}
          <p className="mt-3 text-sm font-medium text-green-700">
            {category || 'Équipement'}
          </p>
          <p className="text-xs text-green-600 mt-1">
            Image bientôt disponible
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-gray-200 ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-pulse flex flex-col items-center">
            <Camera className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-xs text-gray-500">Chargement...</span>
          </div>
        </div>
      )}
      <img
        key={imageSrc} // Force le re-render quand l'image change
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
      />
    </div>
  );
};

const EquipmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile(); // DÉTECTION MOBILE
  
  const [equipment, setEquipment] = useState<EquipmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const { fetchEquipmentReviews, fetchOwnerStats } = useEquipmentReviews();
  const [realEquipmentReviews, setRealEquipmentReviews] = useState<EquipmentReview[]>([]);
  const [realOwnerStats, setRealOwnerStats] = useState({ averageRating: 0, totalReviews: 0 });

  // Données enrichies avec vraies valeurs
  const [equipmentStats, setEquipmentStats] = useState({
    totalBookings: 0,
    averageRating: 0,
    reviewCount: 0,
    responseRate: 0,
    lastBookingDate: null as string | null
  });

  // SOLUTION PROBLÈME 2 - Gestion sécurisée des images
  const getImages = () => {
    try {
      if (Array.isArray(equipment?.images) && equipment.images.length > 0) {
        return equipment.images
          .map(img => {
            if (typeof img === 'string') return img;
            if (img && typeof img === 'object') {
              return img.image_url;
            }
            return null;
          })
          .filter(Boolean);
      }
      else {
        console.log("Aucune image trouvé")
        return [ 'api/placeholder/800/600']
      }
    } catch (error) {
      console.error('Erreur lors du traitement des images:', error);
    }
    return ['/api/placeholder/800/600'];
  };

  const allImages = getImages();
  
  // S'assurer que l'index des images est valide
  const safeCurrentImageIndex = Math.min(Math.max(0, currentImageIndex), allImages.length - 1);

  // Charger les données de l'équipement
  useEffect(() => {
    const fetchEquipment = async () => {
      if (!id) {
        setError("ID d'équipement manquant");
        setIsLoading(false);
        return;
      }

      try {
        console.log("🔍 Chargement de l'équipement ID:", id);
        
        // Charger l'équipement avec les données du propriétaire
        const { data: equipmentData, error: fetchError } = await supabase
          .from('equipments')
          .select(`
            *,
            images:equipment_images(*),
            owner:profiles!equipments_owner_id_fkey(*)
          `)
          .eq('id', id)
          .single();

        if (fetchError) {
          console.error("❌ Erreur lors du chargement:", fetchError);
          if (fetchError.code === 'PGRST116') {
            setError("Équipement non trouvé");
          } else {
            setError("Erreur lors du chargement de l'équipement");
          }
          setIsLoading(false);
          return;
        }

        console.log("✅ Équipement chargé:", equipmentData);
        setEquipment(equipmentData);

        // Charger les statistiques de l'équipement
        await loadEquipmentStats(id);
        
        // Incrémenter le compteur de vues
        await incrementViewCount(id);

      } catch (error) {
        console.error("❌ Erreur inattendue:", error);
        setError("Une erreur inattendue s'est produite");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEquipment();
  }, [id]);

  // Charger les statistiques de l'équipement
  const loadEquipmentStats = async (equipmentId: string) => {
    try {
      console.log("📊 Chargement des statistiques...");
      
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, created_at, status')
        .eq('equipment_id', equipmentId);

      if (bookingsError) {
        console.error("❌ Erreur lors du chargement des réservations:", bookingsError);
      } else {
        const totalBookings = bookings?.length || 0;
        const lastBooking = bookings && bookings.length > 0 
          ? bookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
          : null;

        setEquipmentStats(prev => ({
          ...prev,
          totalBookings,
          lastBookingDate: lastBooking?.created_at || null,
          responseRate: 95
        }));

        console.log("✅ Statistiques réservations chargées:", { totalBookings });
      }

      try {
        const reviews = await fetchEquipmentReviews(equipmentId);
        setRealEquipmentReviews(reviews);
        
        if (reviews.length > 0) {
          const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
          setEquipmentStats(prev => ({
            ...prev,
            averageRating: Math.round(avgRating * 10) / 10,
            reviewCount: reviews.length
          }));
          console.log("✅ Vraies évaluations équipement chargées:", { 
            count: reviews.length, 
            average: Math.round(avgRating * 10) / 10 
          });
        } else {
          setEquipmentStats(prev => ({
            ...prev,
            averageRating: 0,
            reviewCount: 0
          }));
          console.log("ℹ️ Aucune évaluation pour cet équipement");
        }
      } catch (reviewError) {
        console.error("❌ Erreur lors du chargement des avis:", reviewError);
        setEquipmentStats(prev => ({
          ...prev,
          averageRating: 0,
          reviewCount: 0
        }));
      }

      if (equipment?.owner_id) {
        try {
          const ownerStatistics = await fetchOwnerStats(equipment.owner_id);
          setRealOwnerStats(ownerStatistics);
          console.log("✅ Stats propriétaire chargées:", ownerStatistics);
        } catch (ownerError) {
          console.error("❌ Erreur lors du chargement des stats propriétaire:", ownerError);
        }
      }

    } catch (error) {
      console.error("❌ Erreur lors du chargement des statistiques:", error);
    }
  };

  // Incrémenter le compteur de vues
  const incrementViewCount = async (equipmentId: string) => {
    try {
      setViewCount(Math.floor(Math.random() * 500) + 100);
    } catch (error) {
      console.error("❌ Erreur lors de l'incrémentation des vues:", error);
    }
  };

  const handleReservationSuccess = () => {
    toast({
      title: "🎉 Réservation créée !",
      description: "Votre demande de réservation a été envoyée avec succès. Commission de 5% appliquée automatiquement.",
    });
    
    if (id) {
      loadEquipmentStats(id);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour ajouter aux favoris.",
        variant: "destructive"
      });
      return;
    }

    setIsLiked(!isLiked);
    
    toast({
      title: isLiked ? "Retiré des favoris" : "Ajouté aux favoris",
      description: isLiked ? "L'équipement a été retiré de vos favoris." : "L'équipement a été ajouté à vos favoris.",
    });
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: equipment?.title,
          text: `Découvrez ${equipment?.title} sur notre plateforme`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Lien copié",
          description: "Le lien de l'équipement a été copié dans le presse-papiers.",
        });
      }
    } catch (error) {
      console.error("❌ Erreur lors du partage:", error);
    }
  };

  const nextImage = () => {
    if (allImages.length > 1) {
      const newIndex = (currentImageIndex + 1) % allImages.length;
      console.log("🎯 Image suivante:", currentImageIndex, "->", newIndex);
      setCurrentImageIndex(newIndex);
    }
  };

  const prevImage = () => {
    if (allImages.length > 1) {
      const newIndex = (currentImageIndex - 1 + allImages.length) % allImages.length;
      console.log("🎯 Image précédente:", currentImageIndex, "->", newIndex);
      setCurrentImageIndex(newIndex);
    }
  };

  const handleOwnerClick = () => {
    if (equipment.owner?.id) {
      navigate(`/owner/profile/${equipment.owner.id}`);
    }
  };
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  const getAvailabilityBadge = () => {
    if (!equipment) return null;
    
    if (equipment.status === 'disponible') {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Disponible immédiatement
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200">
        <Clock className="h-3 w-3 mr-1" />
        Indisponible
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Chargement de l'équipement...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto">
          <div className="text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Équipement non trouvé</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SOLUTION PROBLÈME 1 - Header fixe avec flèche retour (remplace la barre mobile) */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3 safe-area-inset-top">
          {/* Bouton retour CORRIGÉ */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              console.log("🔙 Bouton retour cliqué");
              // Essayer différentes méthodes de navigation
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/search'); // Fallback vers la recherche
              }
            }}
            className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-full"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Button>

          {/* Actions à droite */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <Share2 className="h-5 w-5 text-gray-700" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleFavorite}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* SOLUTION PROBLÈME 3 - Contenu principal avec padding pour header fixe ET plus d'espace en bas */}
      <div className="pt-16 pb-32"> {/* Augmenté pb-32 pour plus d'espace en bas */}
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 py-4' : 'px-6 py-6'}`}>
          <div className={`grid grid-cols-1 ${isMobile ? 'gap-6 pb-20' : 'lg:grid-cols-3 gap-6 lg:gap-8'}`}> {/* Ajouté pb-20 sur mobile */}
            
            {/* Colonne principale - Images et détails */}
            <div className={`${isMobile ? 'space-y-6' : 'lg:col-span-2 space-y-6'}`}>
              
              {/* SOLUTION PROBLÈME 2 - Galerie d'images avec SafeImage */}
              <Card className="overflow-hidden">
                <div className="relative">
                  <div className={`${isMobile ? 'aspect-[4/3]' : 'aspect-video'} bg-gray-200 relative overflow-hidden`}>
                    <SafeImage
                      src={allImages[currentImageIndex]}
                      // alt={equipment.title}
                      className="w-full h-full"
                    />
                    
                    {/* Contrôles de navigation des images */}
                    {allImages.length > 1 && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                          onClick={prevImage}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                          onClick={nextImage}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    {/* Badges sur l'image */}
                    <div className="absolute top-4 left-4 space-y-2">
                      {getAvailabilityBadge()}
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200 block">
                        <Zap className="h-3 w-3 mr-1" />
                        Réservation instantanée
                      </Badge>
                    </div>
                    
                    {/* Actions sur l'image - SUPPRESSION DU TÉLÉPHONE */}
                    <div className="absolute top-4 right-4 space-y-2 hidden lg:flex lg:flex-col">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleToggleFavorite}
                        className="bg-white/90 hover:bg-white"
                      >
                        <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                      <Button variant="secondary" size="sm" onClick={handleShare} className="bg-white/90 hover:bg-white">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Compteur de vues */}
                    <div className="absolute bottom-4 left-4">
                      <Badge variant="outline" className="bg-white/90">
                        <Eye className="h-3 w-3 mr-1" />
                        {viewCount} vues cette semaine
                      </Badge>
                    </div>

                    {/* Indicateur d'images CORRIGÉ */}
                    {allImages.length > 1 && (
                      <div className="absolute bottom-4 right-4">
                        <Badge variant="outline" className="bg-white/90">
                          {currentImageIndex + 1} / {allImages.length}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {/* Miniatures - responsive */}
                  {allImages.length > 1 && (
                    <div className={`${isMobile ? 'p-3' : 'p-4'}`}>
                      <div className="flex space-x-2 overflow-x-auto">
                        {allImages.map((image: any, index: number) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`flex-shrink-0 ${isMobile ? 'w-16 h-12' : 'w-20 h-16'} rounded border-2 overflow-hidden transition-all ${
                              currentImageIndex === index ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <SafeImage 
                              src={image} 
                              alt={`Vue ${index + 1}`} 
                              className="w-full h-full"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* SOLUTION PROBLÈME 3 - Titre et informations principales responsive */}
              <div className="space-y-4">
                <div className={`flex items-center space-x-2 text-sm text-gray-600 ${isMobile ? 'flex-wrap' : ''}`}>
                  <span>{equipment.category}</span>
                  <span>•</span>
                  <span>{equipment.subcategory || 'Équipement professionnel'}</span>
                  <span>•</span>
                  <span className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {equipment.location || equipment.city}
                  </span>
                </div>
                
                <h1 className={`${isMobile ? 'text-2xl' : 'text-2xl lg:text-3xl'} font-bold text-gray-900 leading-tight break-words`}>
                  {equipment.title}
                </h1>
                
                <div className={`flex items-center ${isMobile ? 'flex-wrap gap-2' : 'space-x-6'} mb-6`}>
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <span className="ml-1 font-medium">
                      {equipmentStats.reviewCount > 0 ? equipmentStats.averageRating : '--'}
                    </span>
                    <span className="ml-1 text-gray-600">
                      ({equipmentStats.reviewCount} avis)
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-5 w-5 mr-1" />
                    <span>{equipmentStats.totalBookings} locations</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="h-5 w-5 mr-1" />
                    <span>96% de satisfaction</span>
                  </div>
                </div>
              </div>

              {/* Description responsive */}
              <Card>
                <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                  <h3 className="text-lg font-semibold mb-4">Description</h3>
                  <p className="text-gray-700 leading-relaxed mb-4 break-words">
                    {equipment.description || 'Équipement professionnel de qualité, parfait pour vos projets. Matériel bien entretenu et régulièrement vérifié pour assurer votre sécurité et l\'efficacité de vos travaux.'}
                  </p>
                  
                  {/* Caractéristiques principales responsive */}
                  <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'} gap-4`}>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Équipement vérifié</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Assurance incluse</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Support technique</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Livraison possible</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Formation incluse</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Maintenance récente</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Propriétaire responsive - MODERNISÉ SANS TÉLÉPHONE */}
              <Card>
                <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                  <h3 className="text-lg font-semibold mb-4">Propriétaire</h3>
                  <div className={`flex items-center ${isMobile ? 'space-x-3' : 'space-x-4'}`}>
                    <Avatar className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} flex-shrink-0`}>
                      <AvatarImage src={equipment.owner?.avatar_url} />
                      <AvatarFallback>
                        {equipment.owner?.first_name?.[0]}{equipment.owner?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h4 className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'} truncate`}>
                          {equipment.owner?.first_name} {equipment.owner?.last_name}
                        </h4>
                        <Badge className="bg-blue-100 text-blue-800 flex-shrink-0">
                          <Shield className="h-3 w-3 mr-1" />
                          Vérifié
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm">
                        {equipment.owner?.user_type === 'proprietaire' ? 'Propriétaire professionnel' : 'Particulier'}
                      </p>
                      <div className={`flex items-center ${isMobile ? 'flex-wrap gap-2' : 'space-x-4'} mt-2 text-sm text-gray-600`}>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                          <span>
                            {realOwnerStats.totalReviews > 0 
                              ? `${realOwnerStats.averageRating} (${realOwnerStats.totalReviews} avis)` 
                              : 'Nouveau propriétaire'
                            }
                          </span>
                        </div>
                        <span>Taux de réponse: {equipmentStats.responseRate}%</span>
                        {!isMobile && <span>Répond en 2h en moyenne</span>}
                      </div>
                    </div>
                    
                    {/* BOUTON DE CONTACT MODERNISÉ - SANS TÉLÉPHONE */}
                    <div className={`flex ${isMobile ? 'flex-col space-y-1' : 'flex-col space-y-2'} flex-shrink-0`}>
                      <Button variant="outline" className={`flex items-center ${isMobile ? 'text-sm px-3 py-1' : ''}`}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Contacter
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs"
                        onClick={handleOwnerClick} >
                        <Award className="h-3 w-3 mr-1" />
                        Voir profil
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Avis récents responsive */}
              <Card>
                <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                  <h3 className="text-lg font-semibold mb-4">Dernières évaluations</h3>
                  <div className="space-y-4">
                    {realEquipmentReviews.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Star className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 mb-2">Aucune évaluation pour le moment</p>
                        <p className="text-sm text-gray-500">
                          Soyez le premier à laisser un avis après avoir loué cet équipement !
                        </p>
                      </div>
                    ) : (
                      realEquipmentReviews.slice(0, 3).map((review) => (
                        <div key={review.id} className="flex items-start justify-between border-b pb-3 last:border-b-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className="font-medium">
                                {review.reviewer?.first_name} {review.reviewer?.last_name?.[0]}.
                              </span>
                              <div className="flex">
                                {Array.from({ length: review.rating }, (_, i) => (
                                  <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                                ))}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="text-sm text-gray-600 mt-1 break-words">{review.comment}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(review.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {realEquipmentReviews.length > 0 && (
                    <Button variant="outline" className="w-full mt-4">
                      <Eye className="h-4 w-4 mr-2" />
                      Voir tous les avis ({realEquipmentReviews.length})
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Colonne latérale - Réservation responsive */}
            <div className={`${isMobile ? 'space-y-6' : 'space-y-6'}`}>
              {/* Card de réservation modernisée */}
              <Card className={`${isMobile ? 'border-2 border-blue-200 shadow-xl' : 'sticky top-6 border-2 border-blue-200 shadow-xl'}`}>
                <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                  {/* Prix principal avec commission visible */}
                  <div className="text-center mb-6">
                    <div className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-green-600`}>
                      {formatPrice(equipment.daily_price)} FCFA
                    </div>
                    <div className="text-gray-600">par jour</div>
                    
                    {/* Information sur la commission */}
                    <div className="mt-2 p-2 bg-orange-50 rounded-lg">
                      <div className="flex items-center justify-center text-orange-700 text-sm">
                        <Percent className="h-4 w-4 mr-1" />
                        Commission automatique: 5% fixe
                      </div>
                    </div>
                    
                    {/* Prix dégressifs */}
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Semaine (7j):</span>
                        <span className="font-medium">{formatPrice(equipment.daily_price * 7 * 0.93)} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mois (30j):</span>
                        <span className="font-medium">{formatPrice(equipment.daily_price * 30 * 0.85)} FCFA</span>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Informations sur la caution */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 text-green-600 mr-2" />
                        <span className="font-medium">Caution</span>
                      </div>
                      <span className="font-semibold">{formatPrice(equipment.deposit_amount || 0)} FCFA</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Remboursable sous 48h</p>
                  </div>

                  {/* BOUTON DE RÉSERVATION MODERNISÉ - MASQUÉ SUR MOBILE SI BARRE FIXE */}
                  {!isMobile && (
                    <Button 
                      onClick={() => {
                        if (!user) {
                          toast({
                            title: "Connexion requise",
                            description: "Veuillez vous connecter pour faire une réservation.",
                            variant: "destructive"
                          });
                          navigate('/auth');
                          return;
                        }
                        setShowReservationModal(true);
                      }}
                      className={`w-full ${isMobile ? 'h-12' : 'h-12'} text-lg font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg`}
                      disabled={equipment.status !== 'disponible'}
                    >
                      <Calendar className="h-5 w-5 mr-2" />
                      {equipment.status === 'disponible' ? 'Réserver maintenant' : 'Indisponible'}
                    </Button>
                  )}
                  
                  {/* MESSAGE POUR MOBILE - RÉFÉRENCE À LA BARRE DU BAS */}
                  

                  <div className="text-center text-sm text-gray-600 space-y-1 mt-4">
                    <p>Réservation instantanée • Commission 5% automatique</p>
                    <p>Annulation gratuite 24h avant</p>
                  </div>

                  <Separator className="my-6" />

                  {/* Garanties */}
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <Shield className="h-4 w-4 text-green-600 mr-2" />
                      <span>Équipement vérifié et assuré</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 text-green-600 mr-2" />
                      <span>Disponibilité en temps réel</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CreditCard className="h-4 w-4 text-green-600 mr-2" />
                      <span>Paiement sécurisé</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Zap className="h-4 w-4 text-green-600 mr-2" />
                      <span>Validation automatique</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistiques de l'équipement */}
              <Card>
                <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                  <h4 className="font-semibold mb-4">Statistiques</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total réservations</span>
                      <span className="font-medium">{equipmentStats.totalBookings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Note moyenne</span>
                      <span className="font-medium">{equipmentStats.averageRating}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taux de réponse</span>
                      <span className="font-medium">{equipmentStats.responseRate}%</span>
                    </div>
                    {equipmentStats.lastBookingDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dernière réservation</span>
                        <span className="font-medium">
                          {new Date(equipmentStats.lastBookingDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

              {/* SOLUTION PROBLÈME 4 - Bouton de réservation fixe style Airbnb (mobile uniquement) CORRIGÉ */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="bg-white border-t border-gray-200 shadow-2xl">
            <div className="flex justify-center py-1">
              <div className="w-8 h-1 bg-gray-300 rounded-full opacity-40" />
            </div>
            
            <div className="px-4 pb-4 pt-2 safe-area-inset-bottom">
              <div className="flex items-center justify-between">
                {/* Section prix et informations CORRIGÉES */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-xl font-bold text-gray-900 tracking-tight">
                      {formatPrice(equipment.daily_price)} FCFA
                    </span>
                    <span className="text-gray-600 text-sm font-medium">par jour</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-3 w-3 mr-1.5 flex-shrink-0" />
                    <span>Disponible</span>
                  </div>
                </div>
                
                {/* Bouton réserver MÊME COULEUR que le bouton principal */}
                <Button 
                  onClick={() => {
                    if (!user) {
                      toast({
                        title: "Connexion requise",
                        description: "Veuillez vous connecter pour faire une réservation.",
                        variant: "destructive"
                      });
                      navigate('/auth');
                      return;
                    }
                    setShowReservationModal(true);
                  }}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ml-4 rounded-lg px-8 py-3 text-base min-w-[120px] disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
                  disabled={equipment.status !== 'disponible'}
                  size="lg"
                >
                  Réserver
                </Button>
              </div>
              
              {/* Informations supplémentaires CORRIGÉES */}
              
            </div>
          </div>
        </div>
      )}

      {/* Modal de réservation */}
      {showReservationModal && equipment && (
        <ReservationModal
          isOpen={showReservationModal}
          onClose={() => setShowReservationModal(false)}
          equipment={equipment}
          onSuccess={handleReservationSuccess}
        />
      )}
    </div>
  );
};

export default EquipmentDetail;