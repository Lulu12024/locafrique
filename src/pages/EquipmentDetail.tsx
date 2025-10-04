// src/pages/EquipmentDetail.tsx - VERSION FINALE CORRIGÉE
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
  Heart, 
  Share2, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft, 
  Loader2,
  MessageSquare,
  TrendingUp,
  Eye,
  Users,
  CheckCircle,
  Zap,
  Percent,
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

interface SafeImageProps {
  src?: string;
  alt?: string;
  className?: string;
  fallbackSrc?: string;
  category?: string;
}

const SafeImage: React.FC<SafeImageProps> = ({ 
  src, 
  alt = '', 
  className,
  fallbackSrc = '/api/placeholder/400/300',
  category 
}) => {
  const [imageSrc, setImageSrc] = useState(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showFallback, setShowFallback] = useState(!src);

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
          <p className="text-xs text-green-600 mt-1">Image bientôt disponible</p>
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
        key={imageSrc}
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
  
  // Détection mobile plus robuste
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      console.log('📱 Mobile détecté:', mobile, '- Largeur:', window.innerWidth);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Debug: vérifier la détection mobile
  useEffect(() => {
    console.log('🔍 isMobile:', isMobile);
    console.log('📱 window.innerWidth:', window.innerWidth);
  }, [isMobile]);
  
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

  const [equipmentStats, setEquipmentStats] = useState({
    totalBookings: 0,
    averageRating: 0,
    reviewCount: 0,
    responseRate: 0,
    lastBookingDate: null as string | null
  });

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
      } else {
        return ['/api/placeholder/800/600'];
      }
    } catch (error) {
      console.error('Erreur traitement images:', error);
    }
    return ['/api/placeholder/800/600'];
  };

  const allImages = getImages();

  useEffect(() => {
    const fetchEquipment = async () => {
      if (!id) {
        setError("ID d'équipement manquant");
        setIsLoading(false);
        return;
      }

      try {
        // Charger l'équipement
        const { data: equipmentData, error: fetchError } = await supabase
          .from('equipments')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) {
          console.error("❌ Erreur:", fetchError);
          setError("Équipement non trouvé");
          setIsLoading(false);
          return;
        }

        console.log("✅ Équipement chargé:", equipmentData);

        // Charger les images
        const { data: imagesData } = await supabase
          .from('equipment_images')
          .select('*')
          .eq('equipment_id', id);

        equipmentData.images = imagesData || [];

        // Charger le propriétaire avec owner_id
        if (equipmentData.owner_id) {
          console.log("👤 Chargement du propriétaire avec ID:", equipmentData.owner_id);
          
          const { data: ownerData, error: ownerError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, created_at')
            .eq('id', equipmentData.owner_id)
            .maybeSingle();

          if (ownerError) {
            console.error("❌ Erreur chargement propriétaire:", ownerError);
            console.error("❌ Code erreur:", ownerError.code);
            console.error("❌ Message:", ownerError.message);
            
            // Si erreur de permissions, créer un profil par défaut
            equipmentData.owner = {
              id: equipmentData.owner_id,
              first_name: 'Propriétaire',
              last_name: '',
              avatar_url: null
            };
          } else if (ownerData) {
            console.log("✅ Propriétaire trouvé:", ownerData);
            equipmentData.owner = ownerData;
          } else {
            console.warn("⚠️ Aucun profil retourné (peut-être RLS?)");
            // Créer un profil par défaut
            equipmentData.owner = {
              id: equipmentData.owner_id,
              first_name: 'Propriétaire',
              last_name: '',
              avatar_url: null
            };
          }
        }

        setEquipment(equipmentData);
        await loadEquipmentStats(id);
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

  const loadEquipmentStats = async (equipmentId: string) => {
    try {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, created_at, status')
        .eq('equipment_id', equipmentId);

      if (bookings) {
        const totalBookings = bookings.length;
        const lastBooking = bookings.length > 0 
          ? bookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
          : null;

        setEquipmentStats(prev => ({
          ...prev,
          totalBookings,
          lastBookingDate: lastBooking?.created_at || null,
          responseRate: 95
        }));
      }

      const reviews = await fetchEquipmentReviews(equipmentId);
      setRealEquipmentReviews(reviews);
      
      if (reviews.length > 0) {
        const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        setEquipmentStats(prev => ({
          ...prev,
          averageRating: Math.round(avgRating * 10) / 10,
          reviewCount: reviews.length
        }));
      }

      if (equipment?.owner_id) {
        const ownerStatistics = await fetchOwnerStats(equipment.owner_id);
        setRealOwnerStats(ownerStatistics);
      }
    } catch (error) {
      console.error("Erreur chargement stats:", error);
    }
  };

  const incrementViewCount = async (equipmentId: string) => {
    setViewCount(Math.floor(Math.random() * 500) + 100);
  };

  const handleReservationSuccess = () => {
    toast({
      title: "🎉 Réservation créée !",
      description: "Votre demande a été envoyée. Commission de 5% appliquée.",
    });
    if (id) loadEquipmentStats(id);
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Connectez-vous pour ajouter aux favoris.",
        variant: "destructive"
      });
      return;
    }
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "Retiré des favoris" : "Ajouté aux favoris"
    });
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: equipment?.title,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Lien copié" });
      }
    } catch (error) {
      console.error("Erreur partage:", error);
    }
  };

  const nextImage = () => {
    if (allImages.length > 1) {
      setCurrentImageIndex((currentImageIndex + 1) % allImages.length);
    }
  };

  const prevImage = () => {
    if (allImages.length > 1) {
      setCurrentImageIndex((currentImageIndex - 1 + allImages.length) % allImages.length);
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
            <p className="text-gray-600">Chargement...</p>
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
      {/* Header fixe */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/search');
              }
            }}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Button>

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

      {/* Contenu principal */}
      <div className="pt-16 pb-32">
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 py-4' : 'px-6 py-6'}`}>
          
          {/* GALERIE D'IMAGES - PLEINE LARGEUR EN HAUT */}
          {isMobile ? (
            /* MOBILE - Carrousel */
            <Card className="overflow-hidden mb-6">
              <div className="relative">
                <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
                  <SafeImage
                    src={allImages[currentImageIndex]}
                    className="w-full h-full"
                    category={equipment.category}
                  />
                  
                  {allImages.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  
                  <div className="absolute top-4 left-4 space-y-2">
                    {getAvailabilityBadge()}
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 block">
                      <Zap className="h-3 w-3 mr-1" />
                      Réservation instantanée
                    </Badge>
                  </div>
                  
                  <div className="absolute bottom-4 left-4">
                    <Badge variant="outline" className="bg-white/90">
                      <Eye className="h-3 w-3 mr-1" />
                      {viewCount} vues
                    </Badge>
                  </div>

                  {allImages.length > 1 && (
                    <div className="absolute bottom-4 right-4">
                      <Badge variant="outline" className="bg-white/90">
                        {currentImageIndex + 1} / {allImages.length}
                      </Badge>
                    </div>
                  )}
                </div>
                
                {allImages.length > 1 && (
                  <div className="p-3">
                    <div className="flex space-x-2 overflow-x-auto">
                      {allImages.map((image: any, index: number) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-12 rounded border-2 overflow-hidden ${
                            currentImageIndex === index ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                          }`}
                        >
                          <SafeImage 
                            src={image} 
                            className="w-full h-full"
                            category={equipment.category}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            /* DESKTOP - Grille Airbnb PLEINE LARGEUR */
            <div className="relative grid grid-cols-4 grid-rows-2 gap-2 h-[480px] rounded-xl overflow-hidden mb-8">
              <button 
                onClick={() => setCurrentImageIndex(0)}
                className="col-span-2 row-span-2 relative group cursor-pointer overflow-hidden"
              >
                <SafeImage
                  src={allImages[0]}
                  alt={equipment.title}
                  className="w-full h-full object-cover"
                  category={equipment.category}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                
                <div className="absolute top-4 left-4 space-y-2">
                  {getAvailabilityBadge()}
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 block">
                    <Zap className="h-3 w-3 mr-1" />
                    Réservation instantanée
                  </Badge>
                </div>
                
                <div className="absolute bottom-4 left-4">
                  <Badge variant="outline" className="bg-white/90">
                    <Eye className="h-3 w-3 mr-1" />
                    {viewCount} vues
                  </Badge>
                </div>
              </button>
              
              {[1, 2, 3, 4].map((index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className="relative group cursor-pointer overflow-hidden row-span-1"
                >
                  <SafeImage
                    src={allImages[index] || allImages[0]}
                    alt={`Vue ${index + 1}`}
                    className="w-full h-full object-cover"
                    category={equipment.category}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  
                  {index === 4 && allImages.length > 5 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="text-white text-sm font-semibold flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
                        <Camera className="h-4 w-4" />
                        <span>Afficher toutes les photos</span>
                      </div>
                    </div>
                  )}
                </button>
              ))}
              
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleShare}
                  className="bg-white/90 hover:bg-white shadow-md"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleToggleFavorite}
                  className="bg-white/90 hover:bg-white shadow-md"
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
              </div>
            </div>
          )}

          {/* CONTENU + SIDEBAR EN DESSOUS DES IMAGES */}
          <div className={`grid grid-cols-1 ${isMobile ? 'gap-6 pb-20' : 'lg:grid-cols-3 gap-6 lg:gap-8'}`}>
            
            {/* Colonne principale - Détails */}
            <div className={`${isMobile ? 'space-y-6' : 'lg:col-span-2 space-y-8'}`}>

              {/* Titre */}
              <div className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
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
                
                <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl lg:text-4xl'} font-bold text-gray-900 leading-tight`}>
                  {equipment.title}
                </h1>
                
                <div className={`flex items-center ${isMobile ? 'flex-wrap gap-2' : 'space-x-6'}`}>
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
                    <span>96% satisfaction</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <Card>
                <CardContent className={`${isMobile ? 'p-4' : 'p-8'}`}>
                  {isMobile ? (
                    <>
                      <h3 className="text-lg font-semibold mb-4">Description</h3>
                      <p className="text-gray-700 leading-relaxed mb-4">
                        {equipment.description || 'Équipement professionnel de qualité.'}
                      </p>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span>Équipement vérifié</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span>Assurance incluse</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span>Support technique</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span>Livraison possible</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span>Formation incluse</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span>Maintenance récente</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xl font-semibold mb-4">À propos de cet équipement</h3>
                          <p className="text-gray-700 text-base leading-relaxed">
                            {equipment.description || 'Équipement professionnel de qualité supérieure, idéal pour vos projets. Matériel régulièrement entretenu et vérifié.'}
                          </p>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-xl font-semibold mb-6">Ce que propose cet équipement</h3>
                          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            <div className="flex items-center">
                              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                              <span className="text-gray-700">Équipement vérifié</span>
                            </div>
                            <div className="flex items-center">
                              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                              <span className="text-gray-700">Assurance incluse</span>
                            </div>
                            <div className="flex items-center">
                              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                              <span className="text-gray-700">Support technique</span>
                            </div>
                            <div className="flex items-center">
                              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                              <span className="text-gray-700">Livraison possible</span>
                            </div>
                            <div className="flex items-center">
                              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                              <span className="text-gray-700">Formation incluse</span>
                            </div>
                            <div className="flex items-center">
                              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                              <span className="text-gray-700">Maintenance récente</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Propriétaire */}
              <Card>
                <CardContent className={`${isMobile ? 'p-4' : 'p-8'}`}>
                  <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold mb-6`}>Propriétaire</h3>
                  
                  <div className={`${isMobile ? 'space-y-3' : 'flex items-center justify-between'}`}>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        const ownerId = equipment?.owner?.id || equipment?.owner_id;
                        
                        if (!equipment?.owner) {
                          toast({
                            title: "Propriétaire introuvable",
                            description: "Les informations du propriétaire ne sont pas disponibles.",
                            variant: "destructive"
                          });
                          return;
                        }
                        
                        if (ownerId) {
                          navigate(`/owner/profile/${ownerId}`);
                        }
                      }}
                      className={`flex items-center space-x-3 ${isMobile ? 'w-full' : 'flex-1'} text-left hover:bg-gray-50 rounded-lg p-2 transition-colors group ${!equipment?.owner ? 'cursor-not-allowed opacity-50' : ''}`}
                      disabled={!equipment?.owner}
                    >
                      <Avatar className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'}`}>
                        <AvatarImage src={equipment?.owner?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                          {equipment?.owner?.first_name?.[0] || 'P'}{equipment?.owner?.last_name?.[0] || 'P'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'} text-gray-900`}>
                            {equipment?.owner?.first_name && equipment?.owner?.last_name 
                              ? `${equipment.owner.first_name} ${equipment.owner.last_name}`
                              : 'Propriétaire'
                            }
                          </h4>
                          <div className="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full">
                            <Shield className="h-3 w-3 text-white" />
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= Math.floor(realOwnerStats.averageRating)
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-900 ml-1`}>
                            {realOwnerStats.totalReviews > 0 
                              ? `${realOwnerStats.averageRating} (${realOwnerStats.totalReviews} avis)` 
                              : 'Nouveau propriétaire'
                            }
                          </span>
                        </div>
                      </div>
                    </button>
                    
                    <Button 
                      variant="outline" 
                      className={`${
                        isMobile 
                          ? 'w-full py-3' 
                          : 'ml-3 px-6 py-3'
                      } border-green-200 text-green-700 hover:bg-green-50`}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contacter
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Avis */}
              <Card>
                <CardContent className={`${isMobile ? 'p-4' : 'p-8'}`}>
                  <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold mb-6`}>Avis des clients</h3>
                  {realEquipmentReviews.length === 0 ? (
                    <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
                      <div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <Star className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} text-gray-400`} />
                      </div>
                      <p className="text-gray-600 mb-2">Aucune évaluation</p>
                      <p className="text-sm text-gray-500">
                        Soyez le premier à laisser un avis !
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {realEquipmentReviews.slice(0, 3).map((review) => (
                        <div key={review.id} className="border-b pb-4 last:border-0">
                          <div className="flex items-center gap-2 mb-2">
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
                            <p className="text-gray-600 text-sm">{review.comment}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(review.created_at).toLocaleDateString('fr-FR', { 
                              year: 'numeric', month: 'long', day: 'numeric' 
                            })}
                          </p>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full">
                        Voir tous les avis ({realEquipmentReviews.length})
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar réservation */}
            <div className="space-y-6">
              <Card className={`${isMobile ? 'border-2 border-blue-200 shadow-xl' : 'sticky top-24 border border-gray-200 shadow-lg'}`}>
                <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                  {isMobile ? (
                    <>
                      <div className="text-center mb-6">
                        <div className="text-2xl font-bold text-green-600">
                          {formatPrice(equipment.daily_price)} FCFA
                        </div>
                        <div className="text-gray-600">par jour</div>
                        
                        <div className="mt-2 p-2 bg-orange-50 rounded-lg">
                          <div className="flex items-center justify-center text-orange-700 text-sm">
                            <Percent className="h-4 w-4 mr-1" />
                            Commission: 5% fixe
                          </div>
                        </div>
                        
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

                      <div className="text-center text-sm text-gray-600 space-y-1">
                        <p>Réservation instantanée • Commission 5%</p>
                        <p>Annulation gratuite 24h avant</p>
                      </div>

                      <Separator className="my-6" />

                      <div className="space-y-3">
                        <div className="flex items-center text-sm">
                          <Shield className="h-4 w-4 text-green-600 mr-2" />
                          <span>Vérifié et assuré</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 text-green-600 mr-2" />
                          <span>Disponibilité temps réel</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <CreditCard className="h-4 w-4 text-green-600 mr-2" />
                          <span>Paiement sécurisé</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-6">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-semibold text-gray-900">
                            {formatPrice(equipment.daily_price)} FCFA
                          </span>
                          <span className="text-gray-600">par jour</span>
                        </div>
                        
                        {equipmentStats.reviewCount > 0 && (
                          <div className="flex items-center gap-1 mt-2 text-sm">
                            <Star className="h-4 w-4 text-gray-900 fill-current" />
                            <span className="font-semibold">{equipmentStats.averageRating}</span>
                            <span className="text-gray-600">· {equipmentStats.reviewCount} avis</span>
                          </div>
                        )}
                      </div>

                      <Separator className="my-5" />

                      <div className="space-y-3 mb-5">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Tarif semaine (7j)</span>
                          <span className="font-medium">{formatPrice(equipment.daily_price * 7 * 0.93)} FCFA</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Tarif mois (30j)</span>
                          <span className="font-medium">{formatPrice(equipment.daily_price * 30 * 0.85)} FCFA</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Commission de service</span>
                          <span>5%</span>
                        </div>
                      </div>

                      <Separator className="my-5" />

                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <div className="font-medium">Caution</div>
                          <div className="text-sm text-gray-600">Remboursable sous 48h</div>
                        </div>
                        <span className="font-semibold">{formatPrice(equipment.deposit_amount || 0)} FCFA</span>
                      </div>

                      <Button 
                        onClick={() => {
                          if (!user) {
                            toast({
                              title: "Connexion requise",
                              variant: "destructive"
                            });
                            navigate('/auth');
                            return;
                          }
                          setShowReservationModal(true);
                        }}
                        className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                        disabled={equipment.status !== 'disponible'}
                      >
                        <Calendar className="h-5 w-5 mr-2" />
                        {equipment.status === 'disponible' ? 'Réserver' : 'Indisponible'}
                      </Button>

                      <p className="text-center text-sm text-gray-600 mt-4">
                        Vous ne serez pas encore débité
                      </p>

                      <Separator className="my-6" />

                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-gray-700">
                          <Shield className="h-5 w-5 text-gray-400" />
                          <span>Vérifié et assuré</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-700">
                          <Clock className="h-5 w-5 text-gray-400" />
                          <span>Réservation instantanée</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-700">
                          <CreditCard className="h-5 w-5 text-gray-400" />
                          <span>Paiement sécurisé</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Statistiques */}
              <Card>
                <CardContent className={`${isMobile ? 'p-4' : 'p-8'}`}>
                  <h4 className={`font-semibold mb-${isMobile ? '4' : '6'} ${!isMobile && 'text-lg'}`}>Statistiques</h4>
                  <div className={`space-y-${isMobile ? '3' : '4'}`}>
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

      {/* Barre fixe mobile */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="bg-white border-t shadow-2xl">
            <div className="flex justify-center py-1">
              <div className="w-8 h-1 bg-gray-300 rounded-full opacity-40" />
            </div>
            
            <div className="px-4 pb-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-xl font-bold text-gray-900">
                      {formatPrice(equipment.daily_price)} FCFA
                    </span>
                    <span className="text-gray-600 text-sm">par jour</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-3 w-3 mr-1.5" />
                    <span>Disponible</span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => {
                    if (!user) {
                      toast({
                        title: "Connexion requise",
                        variant: "destructive"
                      });
                      navigate('/auth');
                      return;
                    }
                    setShowReservationModal(true);
                  }}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 ml-4 rounded-lg px-8 py-3"
                  disabled={equipment.status !== 'disponible'}
                >
                  Réserver
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal réservation */}
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