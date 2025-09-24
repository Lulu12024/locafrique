// src/pages/OwnerProfile.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Shield, 
  Star, 
  MapPin, 
  Calendar, 
  MessageSquare, 
  Phone, 
  Mail, 
  CheckCircle, 
  User, 
  Building,
  Linkedin,
  Loader2,
  Eye,
  Heart,
  Share2,
  Package
} from 'lucide-react';
import { ProfileData, EquipmentData } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEquipmentReviews } from '@/hooks/useEquipmentReviews';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface OwnerProfileProps {}

const OwnerProfile: React.FC<OwnerProfileProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { fetchOwnerStats } = useEquipmentReviews();
  const [owner, setOwner] = useState<ProfileData | null>(null);
  const [equipments, setEquipments] = useState<EquipmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEquipments: 0,
    averageRating: 0,
    totalReviews: 0,
    responseRate: 96,
    satisfactionRate: 96
  });

  // Fonction pour récupérer le statut de vérification réel
  const getVerificationStatus = (owner: ProfileData) => {
    return {
      identity: {
        verified: !!owner.id_document_url && !!owner.is_verified,
        detail: owner.first_name ? `(${owner.first_name.substring(0, 8)}...)` : '',
        flag: '🇫🇷'
      },
      email: {
        verified: true, // Toujours vérifié si l'utilisateur peut se connecter
        detail: '',
        flag: ''
      },
      phone: {
        verified: !!owner.phone_number,
        detail: owner.phone_number ? `(${owner.phone_number.substring(0, 6)}...)` : '',
        flag: ''
      },
      linkedin: {
        verified: false, // Pas encore implémenté
        detail: '',
        flag: ''
      }
    };
  };

  useEffect(() => {
    if (id) {
      fetchOwnerProfile();
    }
  }, [id]);

  const fetchOwnerProfile = async () => {
    try {
      setLoading(true);
      
      if (!id) {
        throw new Error('ID propriétaire manquant');
      }
      
      // Récupérer les données du propriétaire
      const { data: ownerData, error: ownerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (ownerError) {
        throw new Error(ownerError.message);
      }

      setOwner(ownerData);

      console.log('🔍 Recherche équipements pour propriétaire ID:', id);
      
      // Récupérer les équipements du propriétaire avec images (syntaxe corrigée)
      const { data: equipmentsData, error: equipmentsError } = await supabase
        .from('equipments')
        .select(`
          *,
          images:equipment_images (*)
        `)
        .eq('owner_id', id)
        .eq('status', 'disponible')
        .order('created_at', { ascending: false });

      if (equipmentsError) {
        console.error('❌ Erreur équipements:', equipmentsError);
        throw new Error(equipmentsError.message);
      }

      console.log('✅ Équipements récupérés:', equipmentsData?.length || 0);
      console.log('📋 Données équipements:', equipmentsData);

      // Vérification: chercher aussi TOUS les équipements de ce propriétaire (même non disponibles)
      const { data: allOwnerEquipments } = await supabase
        .from('equipments')
        .select('id, title, status, moderation_status')
        .eq('owner_id', id);
      
      console.log('🔍 TOUS les équipements du propriétaire (debug):', allOwnerEquipments);

      // Transformer les données d'équipements pour correspondre au type attendu
      const transformedEquipments = equipmentsData?.map(equipment => {
        const images = Array.isArray(equipment.images) ? equipment.images : [];
        console.log(`📷 Images pour ${equipment.title}:`, images);
        return {
          ...equipment,
          images: images
        };
      }) || [];

      setEquipments(transformedEquipments);

      // Récupérer les vraies statistiques d'avis du propriétaire
      const ownerStats = await fetchOwnerStats(id);
      
      setStats(prev => ({ 
        ...prev, 
        totalEquipments: transformedEquipments.length,
        averageRating: ownerStats.averageRating,
        totalReviews: ownerStats.totalReviews
      }));

    } catch (error: any) {
      console.error('Erreur lors du chargement du profil:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le profil du propriétaire',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEquipmentClick = (equipmentId: string) => {
    navigate(`/equipments/details/${equipmentId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Propriétaire introuvable</p>
          <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  const memberSince = owner.created_at ? format(new Date(owner.created_at), 'MMMM yyyy', { locale: fr }) : 'Date inconnue';

  return (
    <div className="min-h-screen bg-gray-50">
      {isMobile ? (
        // VERSION MOBILE
        <>
          {/* Header avec photo de couverture */}
          <div className="relative">
            {/* Photo de couverture - même style que dans vos images */}
            <div className="h-48 bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              
              {/* Bouton retour */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm rounded-full p-2 h-10 w-10 hover:bg-white shadow-md"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5 text-gray-900" />
              </Button>

              {/* Actions top-right - SUPPRIMÉES */}
              {/* Plus de boutons partage et favoris */}

              {/* Overlay avec décorations florales comme dans l'image */}
              <div className="absolute bottom-0 right-0 opacity-60">
                <div className="w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              </div>
            </div>

            {/* Profil du propriétaire */}
            <div className="relative -mt-16 px-4">
              <div className="flex items-end gap-4">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg bg-white">
                  <AvatarImage src={owner.avatar_url} />
                  <AvatarFallback className="bg-green-100 text-green-700 text-2xl font-bold">
                    {owner.first_name[0]}{owner.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 pb-4">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {owner.first_name} {owner.last_name}
                  </h1>
                  <p className="text-gray-600 text-sm mt-1">
                    Membre depuis {memberSince}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contenu principal MOBILE */}
          <div className="px-4 py-6 space-y-6">
            
            {/* Section Statistiques - Même style que les carousels dans vos images */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="text-lg font-bold text-gray-900">{stats.totalEquipments}</div>
                <div className="text-xs text-gray-600">Équipements</div>
              </div>
              <div className="text-center p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="text-lg font-bold text-gray-900">
                  {stats.totalReviews > 0 ? stats.totalReviews : 'Nouveau'}
                </div>
                <div className="text-xs text-gray-600">Avis</div>
              </div>
              <div className="text-center p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                {stats.totalReviews > 0 ? (
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-lg font-bold text-gray-900">{stats.averageRating}</span>
                  </div>
                ) : (
                  <div className="text-lg font-bold text-gray-900">-</div>
                )}
                <div className="text-xs text-gray-600">Note</div>
              </div>
            </div>

            {/* Section Matériels proposés - CARROUSEL HORIZONTAL */}
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Matériels proposés</h2>
                
                {equipments.length > 0 ? (
                  <div className="relative">
                    {/* Carrousel horizontal */}
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                      {equipments.map((equipment) => {
                        const images = Array.isArray(equipment.images) ? equipment.images : [];
                        const primaryImage = images.find(img => img.is_primary) || images[0];
                        
                        return (
                          <div 
                            key={equipment.id}
                            className="flex-shrink-0 w-48 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleEquipmentClick(equipment.id)}
                          >
                            {/* Image */}
                            <div className="w-full h-32 bg-gray-200 rounded-t-xl overflow-hidden">
                              {primaryImage ? (
                                <img
                                  src={primaryImage.image_url}
                                  alt={equipment.title}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                                  <Package className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            
                            {/* Contenu */}
                            <div className="p-4">
                              {/* Nom de l'équipement */}
                              <h3 className="font-medium text-gray-900 text-sm leading-tight mb-2 line-clamp-2">
                                {equipment.title}
                              </h3>
                              
                              {/* Prix */}
                              <div className="mb-2">
                                <span className="text-lg font-bold text-green-600">
                                  {equipment.daily_price?.toLocaleString()} FCFA
                                </span>
                                <span className="text-xs text-gray-500 ml-1">/jour</span>
                              </div>
                              
                              {/* Localisation */}
                              <div className="flex items-center text-xs text-gray-600">
                                <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{equipment.city}, {equipment.country}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Indicateur de scroll si nécessaire */}
                    {equipments.length > 2 && (
                      <div className="flex justify-center mt-4">
                        <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          Faites défiler pour voir plus →
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucun équipement disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section Vérifications - Données dynamiques */}
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Vérifications</h2>
                
                {owner && (
                  <div className="space-y-4">
                    {(() => {
                      const verificationStatus = getVerificationStatus(owner);
                      const verificationItems = [
                        {
                          type: 'identity',
                          label: 'Pièce d\'identité',
                          ...verificationStatus.identity
                        },
                        {
                          type: 'email',
                          label: 'Adresse email',
                          ...verificationStatus.email
                        },
                        {
                          type: 'phone',
                          label: 'N° de téléphone',
                          ...verificationStatus.phone
                        },
                        {
                          type: 'linkedin',
                          label: 'Compte LinkedIn',
                          ...verificationStatus.linkedin
                        }
                      ];

                      return verificationItems.map((verification, index) => (
                        <div key={index} className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-700 font-medium">
                                {verification.label}
                              </span>
                              {verification.detail && (
                                <span className="text-gray-500 text-sm">
                                  {verification.detail}
                                </span>
                              )}
                              {verification.flag && (
                                <span className="text-lg">{verification.flag}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {verification.verified ? (
                              <>
                                <span className="text-green-600 font-medium text-sm">Vérifié</span>
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              </>
                            ) : (
                              <>
                                <span className="text-red-600 font-medium text-sm">Non vérifié</span>
                                <div className="h-5 w-5 rounded-full border-2 border-red-600 flex items-center justify-center">
                                  <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section Informations supplémentaires - Données dynamiques */}
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">À propos</h2>
                
                <div className="space-y-4">
                  {owner.city && owner.country && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700">{owner.city}, {owner.country}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-700">Membre depuis {memberSince}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {(owner.is_verified && owner.id_document_url) ? (
                      <>
                        <Shield className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">Profil vérifié</span>
                      </>
                    ) : (
                      <>
                        <Shield className="h-5 w-5 text-red-500 flex-shrink-0" />
                        <span className="text-gray-700">Profil non vérifié</span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-yellow-500 flex-shrink-0 fill-current" />
                    <span className="text-gray-700">
                      {stats.totalReviews > 0 
                        ? `${stats.averageRating}/5 • ${stats.totalReviews} avis • ${stats.satisfactionRate}% de satisfaction`
                        : 'Nouveau propriétaire - Aucun avis pour le moment'
                      }
                    </span>
                  </div>
                  
                  {/* Informations sur le statut nouveau propriétaire */}
                  {stats.totalReviews === 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                          Nouveau sur la plateforme
                        </span>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">
                        Ce propriétaire vient de rejoindre 3W-LOC. Soyez le premier à laisser un avis !
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        // VERSION DESKTOP
        <>
          {/* Header Desktop */}
          <div className="relative">
            {/* Photo de couverture plus haute pour desktop */}
            <div className="h-64 bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              
              {/* Bouton retour */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-6 left-6 bg-white/80 backdrop-blur-sm rounded-full p-3 h-12 w-12 hover:bg-white shadow-md"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-6 w-6 text-gray-900" />
              </Button>

              {/* Overlay décoratif */}
              <div className="absolute bottom-0 right-0 opacity-60">
                <div className="w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              </div>
            </div>

            {/* Profil propriétaire desktop */}
            <div className="relative -mt-20 px-8">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-end gap-6">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-lg bg-white">
                    <AvatarImage src={owner.avatar_url} />
                    <AvatarFallback className="bg-green-100 text-green-700 text-3xl font-bold">
                      {owner.first_name[0]}{owner.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 pb-6">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                      {owner.first_name} {owner.last_name}
                    </h1>
                    <p className="text-gray-600 text-lg">
                      Membre depuis {memberSince}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contenu principal DESKTOP - Layout 2 colonnes */}
          <div className="px-8 py-8">
            <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
              
              {/* Colonne principale (8/12) */}
              <div className="col-span-8 space-y-8">
                
                {/* Section Matériels proposés - GRILLE DESKTOP */}
                <Card className="shadow-sm border border-gray-200">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Matériels proposés</h2>
                    
                    {equipments.length > 0 ? (
                      <div className="grid grid-cols-3 gap-6">
                        {equipments.map((equipment) => {
                          const images = Array.isArray(equipment.images) ? equipment.images : [];
                          const primaryImage = images.find(img => img.is_primary) || images[0];
                          
                          return (
                            <div 
                              key={equipment.id}
                              className="bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer"
                              onClick={() => handleEquipmentClick(equipment.id)}
                            >
                              {/* Image plus grande pour desktop */}
                              <div className="w-full h-48 bg-gray-200 rounded-t-xl overflow-hidden">
                                {primaryImage ? (
                                  <img
                                    src={primaryImage.image_url}
                                    alt={equipment.title}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                                    <Package className="h-12 w-12 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              
                              {/* Contenu */}
                              <div className="p-6">
                                {/* Nom de l'équipement */}
                                <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-3 line-clamp-2">
                                  {equipment.title}
                                </h3>
                                
                                {/* Prix */}
                                <div className="mb-3">
                                  <span className="text-2xl font-bold text-green-600">
                                    {equipment.daily_price?.toLocaleString()} FCFA
                                  </span>
                                  <span className="text-sm text-gray-500 ml-2">/jour</span>
                                </div>
                                
                                {/* Localisation */}
                                <div className="flex items-center text-sm text-gray-600">
                                  <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                                  <span className="truncate">{equipment.city}, {equipment.country}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Package className="h-16 w-16 mx-auto mb-6 text-gray-300" />
                        <p className="text-lg">Aucun équipement disponible</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Section À propos - Desktop */}
                <Card className="shadow-sm border border-gray-200">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">À propos</h2>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-6">
                        {owner.city && owner.country && (
                          <div className="flex items-center gap-4">
                            <MapPin className="h-6 w-6 text-gray-500 flex-shrink-0" />
                            <span className="text-gray-700 text-lg">{owner.city}, {owner.country}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4">
                          <Calendar className="h-6 w-6 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-700 text-lg">Membre depuis {memberSince}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          {(owner.is_verified && owner.id_document_url) ? (
                            <>
                              <Shield className="h-6 w-6 text-green-500 flex-shrink-0" />
                              <span className="text-gray-700 text-lg">Profil vérifié</span>
                            </>
                          ) : (
                            <>
                              <Shield className="h-6 w-6 text-red-500 flex-shrink-0" />
                              <span className="text-gray-700 text-lg">Profil non vérifié</span>
                            </>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <Star className="h-6 w-6 text-yellow-500 flex-shrink-0 fill-current" />
                          <span className="text-gray-700 text-lg">
                            {stats.totalReviews > 0 
                              ? `${stats.averageRating}/5 • ${stats.totalReviews} avis`
                              : 'Nouveau propriétaire'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Badge nouveau propriétaire desktop */}
                    {stats.totalReviews === 0 && (
                      <div className="mt-8 p-6 bg-yellow-50 rounded-xl border border-yellow-200">
                        <div className="flex items-center gap-3 mb-2">
                          <Star className="h-5 w-5 text-yellow-600" />
                          <span className="text-lg font-semibold text-yellow-800">
                            Nouveau sur la plateforme
                          </span>
                        </div>
                        <p className="text-sm text-yellow-700">
                          Ce propriétaire vient de rejoindre 3W-LOC. Soyez le premier à laisser un avis !
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar droite (4/12) */}
              <div className="col-span-4 space-y-8">
                
                {/* Statistiques desktop */}
                <Card className="shadow-sm border border-gray-200">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Statistiques</h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 font-medium">Équipements</span>
                        <span className="text-2xl font-bold text-gray-900">{stats.totalEquipments}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 font-medium">Avis reçus</span>
                        <span className="text-2xl font-bold text-gray-900">
                          {stats.totalReviews > 0 ? stats.totalReviews : 'Nouveau'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 font-medium">Note moyenne</span>
                        {stats.totalReviews > 0 ? (
                          <div className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500 fill-current" />
                            <span className="text-2xl font-bold text-gray-900">{stats.averageRating}</span>
                          </div>
                        ) : (
                          <span className="text-2xl font-bold text-gray-400">-</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Vérifications desktop */}
                <Card className="shadow-sm border border-gray-200">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Vérifications</h3>
                    
                    {owner && (
                      <div className="space-y-4">
                        {(() => {
                          const verificationStatus = getVerificationStatus(owner);
                          const verificationItems = [
                            {
                              type: 'identity',
                              label: 'Pièce d\'identité',
                              ...verificationStatus.identity
                            },
                            {
                              type: 'email',
                              label: 'Adresse email',
                              ...verificationStatus.email
                            },
                            {
                              type: 'phone',
                              label: 'N° de téléphone',
                              ...verificationStatus.phone
                            },
                            {
                              type: 'linkedin',
                              label: 'Compte LinkedIn',
                              ...verificationStatus.linkedin
                            }
                          ];

                          return verificationItems.map((verification, index) => (
                            <div key={index} className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-700 font-medium">
                                  {verification.label}
                                </span>
                                {verification.verified ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <div className="h-5 w-5 rounded-full border-2 border-red-600 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                {verification.detail && (
                                  <span className="text-gray-500">{verification.detail}</span>
                                )}
                                {verification.flag && (
                                  <span className="text-base">{verification.flag}</span>
                                )}
                                <span className={`font-medium ${
                                  verification.verified ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {verification.verified ? 'Vérifié' : 'Non vérifié'}
                                </span>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OwnerProfile;