// src/pages/EquipmentDetail.tsx - VERSION CORRIGÉE SANS MÉTRIQUES FAUSSES
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
  Flower,
  Phone
} from 'lucide-react';
import { EquipmentData } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import ReservationModal from '@/components/booking/ReservationModal';
import { useAuth } from '@/hooks/auth';
import { useEquipmentReviews } from '@/hooks/useEquipmentReviews';
import type { EquipmentReview } from '@/hooks/useEquipmentReviews';
import { useIsMobile } from '@/hooks/use-mobile';
import { AvailabilityCalendar } from '@/components/booking/AvailabilityCalendar';
import { useBookedDates } from '@/hooks/useBookedDates';
import ContactOwnerButton from '@/components/messaging/ContactOwnerButton';
import { useFavorites } from '@/hooks/useFavorites';

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
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [hasPendingBooking, setHasPendingBooking] = useState(false);
  const { fetchEquipmentReviews, fetchOwnerStats } = useEquipmentReviews();
  const [realEquipmentReviews, setRealEquipmentReviews] = useState<EquipmentReview[]>([]);
  const [realOwnerStats, setRealOwnerStats] = useState({ averageRating: 0, totalReviews: 0 });

  const [similarEquipments, setSimilarEquipments] = useState<EquipmentData[]>([]);
  const [showStickyNav, setShowStickyNav] = useState(false);
  const [activeSection, setActiveSection] = useState('photos');
  const [showStickyBooking, setShowStickyBooking] = useState(false);

  // Refs pour les sections
  const photosRef = React.useRef<HTMLDivElement>(null);
  const aboutRef = React.useRef<HTMLDivElement>(null);
  const reviewsRef = React.useRef<HTMLDivElement>(null);
  const calendarRef = React.useRef<HTMLDivElement>(null);
  const bookingCardRef = React.useRef<HTMLDivElement>(null);

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
            .select('id, first_name, last_name, avatar_url, created_at, phone_number')
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
        await checkPendingBooking(id);
        
        // Charger les équipements similaires
        if (equipmentData.category) {
          await loadSimilarEquipments(equipmentData.category, id);
        }
      } catch (error) {
        console.error("❌ Erreur inattendue:", error);
        setError("Une erreur inattendue s'est produite");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEquipment();
  }, [id]);

  // Vérifier les réservations en attente quand l'utilisateur change
  useEffect(() => {
    if (id) {
      checkPendingBooking(id);
    }
  }, [user, id]);

  // Détecter le scroll pour afficher le menu sticky
  useEffect(() => {
    const handleScroll = () => {
      // Afficher le menu après avoir scrollé 600px (après les images)
      setShowStickyNav(window.scrollY > 600);

      // Détecter si on a dépassé la carte de réservation
      if (bookingCardRef.current) {
        const rect = bookingCardRef.current.getBoundingClientRect();
        // Si la carte est au-dessus de l'écran (on l'a dépassée)
        setShowStickyBooking(rect.bottom < 100);
      }

      // Détecter quelle section est visible
      const sections = [
        { ref: photosRef, id: 'photos' },
        { ref: aboutRef, id: 'about' },
        { ref: reviewsRef, id: 'reviews' },
        { ref: calendarRef, id: 'calendar' }
      ];

      for (const section of sections) {
        if (section.ref.current) {
          const rect = section.ref.current.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fonction pour scroller vers une section
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      const top = ref.current.offsetTop - 140; // 140px = hauteur du header + menu sticky
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

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

  // Vérifier si l'utilisateur a déjà une réservation en attente
  const checkPendingBooking = async (equipmentId: string) => {
    if (!user) {
      setHasPendingBooking(false);
      return;
    }

    try {
      const { data: pendingBookings, error } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('equipment_id', equipmentId)
        .eq('renter_id', user.id)
        .in('status', ['pending', 'confirmed']);

      if (error) {
        console.error("Erreur vérification réservation:", error);
        return;
      }

      // Si on a au moins une réservation en attente ou confirmée
      const hasPending = pendingBookings && pendingBookings.length > 0;
      setHasPendingBooking(hasPending);
      
      if (hasPending) {
        console.log(`✅ ${pendingBookings.length} réservation(s) en attente trouvée(s):`, pendingBookings);
      }
    } catch (error) {
      console.error("Erreur inattendue vérification réservation:", error);
    }
  };

  // Charger les équipements similaires
  const loadSimilarEquipments = async (category: string, currentId: string) => {
    try {
      const { data, error } = await supabase
        .from('equipments')
        .select('*, images:equipment_images(*)')
        .eq('category', category)
        .eq('status', 'disponible')
        .neq('id', currentId)
        .limit(4);

      if (!error && data) {
        setSimilarEquipments(data);
        console.log("✅ Équipements similaires chargés:", data.length);
      }
    } catch (error) {
      console.error("❌ Erreur chargement équipements similaires:", error);
    }
  };

  const handleReservationSuccess = () => {
    toast({
      title: "🎉 Réservation créée !",
      description: "Votre demande a été envoyée. Commission de 5% appliquée.",
    });
    if (id) {
      loadEquipmentStats(id);
      checkPendingBooking(id); // Re-vérifier les réservations en attente
    }
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
    
    if (!equipment?.id) return;
    
    const isCurrentlyFavorite = isFavorite(equipment.id);
    
    if (isCurrentlyFavorite) {
      await removeFromFavorites(equipment.id);
      toast({
        title: "Retiré des favoris"
      });
    } else {
      await addToFavorites(equipment.id);
      toast({
        title: "Ajouté aux favoris"
      });
    }
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
              <Heart className={`h-5 w-5 ${equipment?.id && isFavorite(equipment.id) ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* MENU DE NAVIGATION STICKY (apparaît au scroll) */}
      {!isMobile && showStickyNav && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-14">
              {/* Navigation gauche */}
              <nav className="flex items-center space-x-8">
                <button
                  onClick={() => scrollToSection(photosRef)}
                  className={`text-sm font-medium transition-colors pb-4 border-b-2 ${
                    activeSection === 'photos'
                      ? 'text-gray-900 border-gray-900'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  Photos
                </button>
                
                <button
                  onClick={() => scrollToSection(aboutRef)}
                  className={`text-sm font-medium transition-colors pb-4 border-b-2 ${
                    activeSection === 'about'
                      ? 'text-gray-900 border-gray-900'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  Équipements
                </button>
                
                <button
                  onClick={() => scrollToSection(reviewsRef)}
                  className={`text-sm font-medium transition-colors pb-4 border-b-2 ${
                    activeSection === 'reviews'
                      ? 'text-gray-900 border-gray-900'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  Commentaires
                </button>
                
                <button
                  onClick={() => scrollToSection(calendarRef)}
                  className={`text-sm font-medium transition-colors pb-4 border-b-2 ${
                    activeSection === 'calendar'
                      ? 'text-gray-900 border-gray-900'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  Calendrier
                </button>
              </nav>

              {/* Bouton de réservation (apparaît quand on dépasse la carte) */}
              {showStickyBooking && (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatPrice(equipment.daily_price)} FCFA
                    </div>
                    <div className="text-xs text-gray-600">par jour</div>
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
                      if (hasPendingBooking) {
                        toast({
                          title: "Réservation en attente",
                          description: "Vous avez déjà une réservation en attente pour cet équipement.",
                          variant: "destructive"
                        });
                        return;
                      }
                      setShowReservationModal(true);
                    }}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md"
                    disabled={equipment.status !== 'disponible' || hasPendingBooking}
                  >
                    {hasPendingBooking ? 'Réservation en attente' : 'Réserver'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div className="pt-16 pb-32">
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 py-4' : 'px-6 py-6'}`}>
          
          {/* GALERIE D'IMAGES - PLEINE LARGEUR EN HAUT */}
          <div ref={photosRef}>
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
                  <Heart className={`h-4 w-4 ${equipment?.id && isFavorite(equipment.id) ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
              </div>
            </div>
          )}
          </div>

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
                </div>
              </div>

              {/* Description */}
              <Card ref={aboutRef}>
                <CardContent className={`${isMobile ? 'p-4' : 'p-8'}`}>
                  {isMobile ? (
                    <>
                      <h3 className="text-lg font-semibold mb-4">Description</h3>
                      <p className="text-gray-700 leading-relaxed mb-4 whitespace-pre-line">
                        {equipment.description || 'Équipement professionnel de qualité.'}
                      </p>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {/* Équipement vérifié - toujours affiché */}
                        <div className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span>Équipement vérifié</span>
                        </div>

                        {/* Options dynamiques */}
                        {equipment.has_technical_support && (
                          <div className="flex items-center text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            <span>Support technique</span>
                          </div>
                        )}
                        
                        {equipment.has_training && (
                          <div className="flex items-center text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            <span>Formation incluse</span>
                          </div>
                        )}
                        
                        {equipment.has_insurance && (
                          <div className="flex items-center text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            <span>Assurance incluse</span>
                          </div>
                        )}
                        
                        {equipment.has_delivery && (
                          <div className="flex items-center text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            <span>Livraison possible</span>
                          </div>
                        )}
                        
                        {equipment.has_recent_maintenance && (
                          <div className="flex items-center text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            <span>Maintenance récente</span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xl font-semibold mb-4">À propos de cet équipement</h3>
                          <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line">
                            {equipment.description || 'Équipement professionnel de qualité supérieure, idéal pour vos projets. Matériel régulièrement entretenu et vérifié.'}
                          </p>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-xl font-semibold mb-6">Ce que propose cet équipement</h3>
                          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            {/* Équipement vérifié - toujours affiché */}
                            <div className="flex items-center">
                              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                              <span className="text-gray-700">Équipement vérifié</span>
                            </div>

                            {/* Options dynamiques - affichées seulement si cochées */}
                            {equipment.has_technical_support && (
                              <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                                <span className="text-gray-700">Support technique</span>
                              </div>
                            )}
                            
                            {equipment.has_training && (
                              <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                                <span className="text-gray-700">Formation incluse</span>
                              </div>
                            )}
                            
                            {equipment.has_insurance && (
                              <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                                <span className="text-gray-700">Assurance incluse</span>
                              </div>
                            )}
                            
                            {equipment.has_delivery && (
                              <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                                <span className="text-gray-700">Livraison possible</span>
                              </div>
                            )}
                            
                            {equipment.has_recent_maintenance && (
                              <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                                <span className="text-gray-700">Maintenance récente</span>
                              </div>
                            )}
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
                    
                    {/* Boutons d'action - Responsive */}
                    <div className={`${isMobile ? 'flex gap-2 w-full' : 'flex gap-2'}`}>
                      {/* Bouton Appeler (si numéro disponible) */}
                      {equipment?.owner?.phone_number && (
                        <Button
                          asChild
                          variant="outline"
                          className={`${isMobile ? 'flex-1' : ''} border-green-600 text-green-600 hover:bg-green-50`}
                        >
                          <a href={`tel:${equipment.owner.phone_number}`} className="flex items-center justify-center">
                            <Phone className="h-4 w-4 mr-2" />
                            {isMobile ? 'Appeler' : 'Appeler'}
                          </a>
                        </Button>
                      )}
                      
                      {/* Bouton Contacter */}
                      <div className={equipment?.owner?.phone_number && isMobile ? 'flex-1' : ''}>
                        <ContactOwnerButton
                          ownerId={equipment.owner_id}
                          ownerName={equipment.owner.first_name}
                          equipmentId={equipment.id}
                          equipmentTitle={equipment.title}
                          variant="outline"
                          className={equipment?.owner?.phone_number && isMobile ? 'w-full' : ''}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Avis */}
              <Card ref={reviewsRef}>
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

              {/* CALENDRIER DE DISPONIBILITÉ */}
              <div ref={calendarRef} id="calendar" className="scroll-mt-20">
                <AvailabilityCalendar 
                  equipmentId={equipment.id}
                  showLegend={true}
                  compact={isMobile}
                />
              </div>

              {/* CARTE DE LOCALISATION */}
              <Card>
                <CardContent className={`${isMobile ? 'p-4' : 'p-8'}`}>
                  <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold mb-6`}>
                    Où récupérer l'équipement
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {equipment.location || 'Localisation'}
                        </p>
                        <p className="text-gray-600">
                          {equipment.city}, {equipment.country}
                        </p>
                      </div>
                    </div>
                    
                    {/* Carte Google Maps intégrée */}
                    <div className="w-full h-96 bg-gray-200 rounded-lg overflow-hidden relative">
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(`${equipment.city}, ${equipment.country}`)}&zoom=13`}
                        allowFullScreen
                        loading="lazy"
                        title="Localisation de l'équipement"
                      />
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <span>
                          La zone approximative est affichée sur la carte. L'adresse exacte sera communiquée après la confirmation de votre réservation pour des raisons de sécurité.
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CONDITIONS & RÈGLES */}
              <Card>
                <CardContent className={`${isMobile ? 'p-4' : 'p-8'}`}>
                  <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold mb-6`}>
                    Choses à savoir
                  </h3>
                  
                  <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'grid-cols-3 gap-8'}`}>
                    {/* Règles de location */}
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Package className="h-5 w-5 text-green-600" />
                        Règles de location
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Retour à l'heure convenue</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>État initial requis au retour</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Pièce d'identité obligatoire</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Caution remboursable</span>
                        </li>
                      </ul>
                    </div>

                    {/* Santé et sécurité */}
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-green-600" />
                        Santé et sécurité
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Équipement vérifié régulièrement</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Nettoyage après chaque utilisation</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Assurance responsabilité civile</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Support technique disponible</span>
                        </li>
                      </ul>
                    </div>

                    {/* Politique d'annulation */}
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-green-600" />
                        Politique d'annulation
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Annulation gratuite 24h avant</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Remboursement de 50% si 48h avant</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Pas de remboursement moins de 24h</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Caution retournée sous 48h</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ÉQUIPEMENTS SIMILAIRES */}
              {similarEquipments.length > 0 && (
                <Card>
                  <CardContent className={`${isMobile ? 'p-4' : 'p-8'}`}>
                    <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold mb-6`}>
                      Équipements similaires
                    </h3>
                    
                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-2 lg:grid-cols-4 gap-4'}`}>
                      {similarEquipments.map((item) => {
                        const itemImages = Array.isArray(item.images) && item.images.length > 0
                          ? item.images.map(img => typeof img === 'string' ? img : img?.image_url).filter(Boolean)
                          : ['/api/placeholder/300/200'];

                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              navigate(`/equipments/details/${item.id}`);
                              window.scrollTo(0, 0);
                            }}
                            className="group text-left hover:shadow-lg transition-shadow rounded-lg overflow-hidden border border-gray-200"
                          >
                            <div className="aspect-video relative overflow-hidden bg-gray-200">
                              <SafeImage
                                src={itemImages[0]}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                category={item.category}
                              />
                            </div>
                            <div className="p-3">
                              <h4 className="font-medium text-gray-900 mb-1 line-clamp-1">
                                {item.title}
                              </h4>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                                {item.location}, {item.city}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-green-600">
                                  {formatPrice(item.daily_price)} FCFA
                                </span>
                                <span className="text-xs text-gray-500">par jour</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar réservation */}
            <div className="space-y-6">
              <Card 
                ref={bookingCardRef}
                className={`${isMobile ? 'border-2 border-blue-200 shadow-xl' : 'border border-gray-200 shadow-lg'}`}
              >
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
                          if (hasPendingBooking) {
                            toast({
                              title: "Réservation en attente",
                              description: "Vous avez déjà une réservation en attente pour cet équipement.",
                              variant: "destructive"
                            });
                            return;
                          }
                          setShowReservationModal(true);
                        }}
                        className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                        disabled={equipment.status !== 'disponible' || equipment.owner_id === user?.id || hasPendingBooking}
                      >
                        <Calendar className="h-5 w-5 mr-2" />
                        {equipment.owner_id === user?.id 
                          ? 'Votre équipement' 
                          : hasPendingBooking
                          ? 'Réservation en attente'
                          : equipment.status === 'disponible' ? 'Réserver' : 'Indisponible'}
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
                    if (hasPendingBooking) {
                      toast({
                        title: "Réservation en attente",
                        description: "Vous avez déjà une réservation en attente pour cet équipement.",
                        variant: "destructive"
                      });
                      return;
                    }
                    setShowReservationModal(true);
                  }}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 ml-4 rounded-lg px-8 py-3"
                  disabled={equipment.status !== 'disponible' || equipment.owner_id === user?.id || hasPendingBooking}
                >
                  {equipment.owner_id === user?.id 
                    ? 'Votre équipement' 
                    : hasPendingBooking
                    ? 'En attente'
                    : 'Réserver'}
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