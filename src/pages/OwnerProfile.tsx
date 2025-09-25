// src/pages/OwnerProfile.tsx - VERSION COMPLÈTE AVEC DESKTOP AMÉLIORÉ
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/auth';
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
  Package,
  Camera,
  Edit3,  
  Image as ImageIcon
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
  const { user } = useAuth();
  const isOwnProfile = user?.id === owner?.id;
  // États pour les modals de photos
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoModalType, setPhotoModalType] = useState<'profile' | 'cover'>('profile');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [stats, setStats] = useState({
    totalEquipments: 0,
    averageRating: 0,
    totalReviews: 0,
    responseRate: 96,
    satisfactionRate: 96
  });

  // Fonction pour ouvrir la modal de changement de photo
  const openPhotoModal = (type: 'profile' | 'cover') => {
    setPhotoModalType(type);
    setShowPhotoModal(true);
  };

  // Fonction pour gérer l'upload de photo
  const handlePhotoUpload = async (file: File, type: 'profile' | 'cover') => {
    try {
      setUploadingPhoto(true);
      console.log(`🔄 Upload ${type} photo:`, file.name);
      
      if (!owner?.id) {
        throw new Error('ID utilisateur manquant');
      }
      
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Le fichier est trop volumineux (max 5MB)');
      }
      
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        throw new Error('Veuillez sélectionner un fichier image');
      }
      
      // Créer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${owner.id}/${type}-${Date.now()}.${fileExt}`;
      
      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Erreur upload:', uploadError);
        throw new Error('Erreur lors de l\'upload: ' + uploadError.message);
      }
      
      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);
      
      console.log('✅ URL publique:', publicUrl);
      
      // Mettre à jour le profil en base
      const updateField = type === 'profile' ? 'avatar_url' : 'cover_image_url';
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [updateField]: publicUrl })
        .eq('id', owner.id);
      
      if (updateError) {
        console.error('Erreur update profil:', updateError);
        throw new Error('Erreur lors de la mise à jour du profil');
      }
      
      // Mettre à jour l'état local
      setOwner(prev => prev ? {
        ...prev,
        [updateField]: publicUrl
      } : null);
      
      setShowPhotoModal(false);
      
      toast({
        title: "✅ Photo mise à jour",
        description: `${type === 'profile' ? 'Photo de profil' : 'Photo de couverture'} modifiée avec succès`,
      });
      
    } catch (error: any) {
      console.error('Erreur upload photo:', error);
      toast({
        title: "❌ Erreur",
        description: error.message || "Impossible d'uploader la photo",
        variant: "destructive"
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Fonction pour prendre une photo
  const handleTakePhoto = async (type: 'profile' | 'cover') => {
    try {
      console.log(`📸 Prendre photo ${type}`);
      
      // Vérifier si l'API Camera est disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "📸 Caméra non disponible",
          description: "Votre navigateur ne supporte pas l'accès à la caméra. Utilisez 'Choisir dans la galerie'.",
          variant: "destructive"
        });
        return;
      }
      
      // Demander l'accès à la caméra
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } // Caméra frontale par défaut
      });
      
      // Créer un élément vidéo pour prévisualiser
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.srcObject = stream;
      video.play();
      
      // Attendre que la vidéo soit prête
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Prendre la photo après un délai
        setTimeout(() => {
          if (ctx) {
            ctx.drawImage(video, 0, 0);
            
            // Convertir en blob
            canvas.toBlob(async (blob) => {
              if (blob) {
                // Créer un fichier à partir du blob
                const file = new File([blob], `camera-${type}-${Date.now()}.jpg`, {
                  type: 'image/jpeg'
                });
                
                // Arrêter la caméra
                stream.getTracks().forEach(track => track.stop());
                
                // Upload la photo
                await handlePhotoUpload(file, type);
              }
            }, 'image/jpeg', 0.8);
          }
        }, 1000); // Délai d'1 seconde pour stabiliser l'image
      };
      
    } catch (error: any) {
      console.error('Erreur caméra:', error);
      
      if (error.name === 'NotAllowedError') {
        toast({
          title: "📸 Accès caméra refusé",
          description: "Veuillez autoriser l'accès à la caméra pour prendre une photo.",
          variant: "destructive"
        });
      } else if (error.name === 'NotFoundError') {
        toast({
          title: "📸 Caméra introuvable",
          description: "Aucune caméra détectée sur votre appareil.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "📸 Erreur caméra",
          description: "Impossible d'accéder à la caméra. Utilisez 'Choisir dans la galerie'.",
          variant: "destructive"
        });
      }
    }
  };

  const handleChooseFromGallery = (type: 'profile' | 'cover') => {
    console.log(`🖼️ Choisir photo ${type} depuis galerie`);
    
    // Créer un input file invisible et le déclencher
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await handlePhotoUpload(file, type);
      }
    };
    
    // Déclencher la sélection de fichier
    input.click();
    
    // Nettoyer l'input après utilisation
    setTimeout(() => {
      input.remove();
    }, 1000);
  };

  // Fonction pour récupérer le statut de vérification réel
  const getVerificationStatus = (owner: ProfileData) => {
    return {
      identity: {
        verified: !!owner.id_document_url && !!owner.is_verified,
        detail: owner.first_name ? `(${owner.first_name.substring(0, 8)}...)` : '',
        flag: '🇫🇷'
      },
      email: {
        verified: true,
        detail: '',
        flag: ''
      },
      phone: {
        verified: !!owner.phone_number,
        detail: owner.phone_number ? `(${owner.phone_number.substring(0, 6)}...)` : '',
        flag: ''
      },
      linkedin: {
        verified: false,
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

      const transformedEquipments = equipmentsData?.map(equipment => {
        const images = Array.isArray(equipment.images) ? equipment.images : [];
        return {
          ...equipment,
          images: images
        };
      }) || [];

      setEquipments(transformedEquipments);

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
        // VERSION MOBILE - INCHANGÉE
        <>
          {/* Header avec photo de couverture MODIFIABLE */}
          <div className="relative">
            {/* Photo de couverture avec bouton de modification - ZONE ENTIÈRE CLIQUABLE */}
            <div 
              className={`h-48 bg-gradient-to-r from-green-400 via-blue-400 to-purple-500 relative overflow-hidden group ${isOwnProfile ? 'cursor-pointer' : ''}`}
              onClick={isOwnProfile ? () => openPhotoModal('cover') : undefined}
            >
              <div className="absolute inset-0 bg-black/10"></div>
              
              {/* Image de couverture si disponible */}
              {owner.cover_image_url && (
                <img 
                  src={owner.cover_image_url} 
                  alt="Photo de couverture"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              
              {/* Overlay décoratif */}
              <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-1/4 w-24 h-24 bg-white/15 rounded-full blur-2xl"></div>
              </div>
              
              {/* Bouton retour */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-colors z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(-1);
                }}
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </Button>

              {/* Boutons top-right */}
              {isOwnProfile && (  
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                  {/* Bouton modifier photo de couverture */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPhotoModal('cover');
                    }}
                  >
                    <ImageIcon className="h-5 w-5 text-gray-700" />
                  </Button>
                  
                  {/* Bouton modifier profil */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/settings/profile');
                    }}
                    title="Modifier le profil"
                  >
                    <Edit3 className="h-5 w-5 text-gray-700" />
                  </Button>
                </div>
              )}
              

              {/* Overlay de modification */}
              
              {isOwnProfile && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-all duration-200">
                  <div className="text-center text-white pointer-events-none">
                    <ImageIcon className="h-12 w-12 mx-auto mb-3 drop-shadow-lg" />
                    <p className="text-lg font-semibold drop-shadow-lg">
                      {owner.cover_image_url ? 'Modifier la photo de couverture' : 'Ajouter une photo de couverture'}
                    </p>
                    <p className="text-sm opacity-80 mt-1">Cliquez pour changer</p>
                  </div>
                </div>
              )}
            </div>

            {/* Profil du propriétaire */}
            <div className="relative -mt-16 px-4">
              <div className="flex flex-col items-center">
                {/* Avatar avec bouton photo */}
                <div className="relative mb-4">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg bg-white">
                    <AvatarImage src={owner.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-2xl font-bold">
                      {owner.first_name[0]}{owner.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Bouton pour changer la photo de profil */}
                  {isOwnProfile && (
                    <button 
                      onClick={() => openPhotoModal('profile')}
                      className="absolute bottom-0 right-0 bg-green-500 text-white rounded-full p-2 shadow-lg hover:bg-green-600 transition-colors"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  )}
                  
                  {/* Badge vérifié */}
                  {(owner.is_verified && owner.id_document_url) && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-green-500 text-white rounded-full p-2 shadow-lg">
                      <Shield className="h-4 w-4" />
                    </div>
                  )}
                </div>
                
                {/* Informations utilisateur */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {owner.first_name} {owner.last_name}
                  </h1>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-center text-gray-600 text-sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Membre depuis {memberSince}</span>
                    </div>
                    
                    {owner.city && owner.country && (
                      <div className="flex items-center justify-center text-gray-600 text-sm">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{owner.city}, {owner.country}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contenu principal MOBILE */}
          <div className="px-4 py-6 space-y-6">
            
            {/* Section Statistiques */}
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

            {/* Section Matériels proposés */}
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Matériels proposés</h2>
                
                {equipments.length > 0 ? (
                  <div className="relative">
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
                            
                            <div className="p-4">
                              <h3 className="font-medium text-gray-900 text-sm leading-tight mb-2 line-clamp-2">
                                {equipment.title}
                              </h3>
                              
                              <div className="mb-2">
                                <span className="text-lg font-bold text-green-600">
                                  {equipment.daily_price?.toLocaleString()} FCFA
                                </span>
                                <span className="text-xs text-gray-500 ml-1">/jour</span>
                              </div>
                              
                              <div className="flex items-center text-xs text-gray-600">
                                <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{equipment.city}, {equipment.country}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
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

            {/* Section Vérifications */}
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

            {/* Section Informations supplémentaires */}
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
        // VERSION DESKTOP AMÉLIORÉE
        <>
          {/* Header Desktop COMPACT */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-8 py-6">
              <div className="flex items-center justify-between">
                {/* Bouton retour */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-3 py-2"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="h-5 w-5" />
                  Retour
                </Button>

                {/* Actions à droite */}
                {isOwnProfile && (
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => openPhotoModal('cover')}
                    >
                      <ImageIcon className="h-4 w-4" />
                      Photo de couverture
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => navigate('/settings/profile')}
                    >
                      <Edit3 className="h-4 w-4" />
                      Modifier le profil
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contenu principal REDESIGNÉ */}
          <div className="max-w-7xl mx-auto px-8 py-8">
            
            {/* Section profil compacte */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
              <div className="flex items-start gap-8">
                
                {/* Avatar et bouton photo */}
                <div className="relative flex-shrink-0">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-lg bg-white">
                    <AvatarImage src={owner.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-3xl font-bold">
                      {owner.first_name[0]}{owner.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Bouton modifier photo profil */}
                  {isOwnProfile && (
                    <button 
                      onClick={() => openPhotoModal('profile')}
                      className="absolute bottom-0 right-0 bg-green-500 text-white rounded-full p-3 shadow-lg hover:bg-green-600 transition-colors"
                      title="Modifier la photo de profil"
                    >
                      <Camera className="h-5 w-5" />
                    </button>
                  )}
                </div>
                
                {/* Informations principales */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        {owner.first_name} {owner.last_name}
                      </h1>
                      
                      <div className="flex items-center gap-6 text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          <span>Membre depuis {memberSince}</span>
                        </div>
                        
                        {owner.city && owner.country && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            <span>{owner.city}, {owner.country}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Badges de vérification */}
                      <div className="flex items-center gap-3 mb-6">
                        {(owner.is_verified && owner.id_document_url) && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <Shield className="h-4 w-4 mr-2" />
                            Profil vérifié
                          </Badge>
                        )}
                        
                        {stats.totalReviews === 0 && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            <Star className="h-4 w-4 mr-2" />
                            Nouveau propriétaire
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Photo de couverture miniature */}
                    <div className="relative">
                      <div 
                        className={`w-48 h-32 bg-gradient-to-r from-green-400 via-blue-400 to-purple-500 rounded-xl overflow-hidden ${isOwnProfile ? 'cursor-pointer hover:shadow-lg' : ''} transition-shadow group`}
                        onClick={isOwnProfile ? () => openPhotoModal('cover') : undefined}
                      >
                        {owner.cover_image_url && (
                          <img 
                            src={owner.cover_image_url} 
                            alt="Photo de couverture"
                            className="w-full h-full object-cover"
                          />
                        )}
                        
                        {/* Overlay de modification */}
                        {isOwnProfile && (
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="text-center text-white">
                              <ImageIcon className="h-8 w-8 mx-auto mb-1" />
                              <p className="text-sm font-medium">
                                {owner.cover_image_url ? 'Modifier' : 'Ajouter'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Statistiques en ligne */}
                  <div className="grid grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-gray-900">{stats.totalEquipments}</div>
                      <div className="text-sm text-gray-600">Équipements</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.totalReviews > 0 ? stats.totalReviews : 'Nouveau'}
                      </div>
                      <div className="text-sm text-gray-600">Avis reçus</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      {stats.totalReviews > 0 ? (
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Star className="h-5 w-5 text-yellow-500 fill-current" />
                          <span className="text-2xl font-bold text-gray-900">{stats.averageRating}</span>
                        </div>
                      ) : (
                        <div className="text-2xl font-bold text-gray-400">-</div>
                      )}
                      <div className="text-sm text-gray-600">Note moyenne</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-green-600">{stats.responseRate}%</div>
                      <div className="text-sm text-gray-600">Taux réponse</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Layout 2 colonnes pour le contenu */}
            <div className="grid grid-cols-12 gap-8">
              
              {/* Colonne principale (8/12) */}
              <div className="col-span-8 space-y-8">
                
                {/* Matériels proposés - Design amélioré */}
                <Card className="shadow-sm border border-gray-200">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Matériels proposés</h2>
                      <Badge variant="outline" className="text-gray-600">
                        {equipments.length} équipement{equipments.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    
                    {equipments.length > 0 ? (
                      <div className="grid grid-cols-2 gap-6">
                        {equipments.map((equipment) => {
                          const images = Array.isArray(equipment.images) ? equipment.images : [];
                          const primaryImage = images.find(img => img.is_primary) || images[0];
                          
                          return (
                            <div 
                              key={equipment.id}
                              className="bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
                              onClick={() => handleEquipmentClick(equipment.id)}
                            >
                              {/* Image */}
                              <div className="w-full h-48 bg-gray-200 overflow-hidden">
                                {primaryImage ? (
                                  <img
                                    src={primaryImage.image_url}
                                    alt={equipment.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                                    <Package className="h-12 w-12 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              
                              {/* Contenu */}
                              <div className="p-6">
                                <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-3 line-clamp-2">
                                  {equipment.title}
                                </h3>
                                
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-2xl font-bold text-green-600">
                                      {equipment.daily_price?.toLocaleString()} FCFA
                                    </span>
                                    <span className="text-gray-500 text-sm ml-1">/jour</span>
                                  </div>
                                  
                                  <Badge variant="outline" className="text-green-600 border-green-200">
                                    Disponible
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center text-gray-600 text-sm mt-2">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  <span className="truncate">{equipment.city}, {equipment.country}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-16 text-gray-500">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Package className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Aucun équipement</h3>
                        <p className="text-gray-500">Ce propriétaire n'a pas encore ajouté d'équipement</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* À propos - Simplifié */}
                <Card className="shadow-sm border border-gray-200">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">À propos</h2>
                    
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Membre depuis</p>
                            <p className="text-gray-600">{memberSince}</p>
                          </div>
                        </div>
                        
                        {owner.city && owner.country && (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Localisation</p>
                              <p className="text-gray-600">{owner.city}, {owner.country}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <Shield className={`h-5 w-5 ${(owner.is_verified && owner.id_document_url) ? 'text-green-600' : 'text-red-600'}`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Statut de vérification</p>
                            <p className={`${(owner.is_verified && owner.id_document_url) ? 'text-green-600' : 'text-red-600'}`}>
                              {(owner.is_verified && owner.id_document_url) ? 'Profil vérifié' : 'Profil non vérifié'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <Star className="h-5 w-5 text-yellow-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Évaluations</p>
                            <p className="text-gray-600">
                              {stats.totalReviews > 0 
                                ? `${stats.averageRating}/5 • ${stats.totalReviews} avis`
                                : 'Aucun avis pour le moment'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Badge nouveau propriétaire si nécessaire */}
                    {stats.totalReviews === 0 && (
                      <div className="mt-8 p-6 bg-yellow-50 rounded-2xl border border-yellow-200">
                        <div className="flex items-center gap-3 mb-2">
                          <Star className="h-6 w-6 text-yellow-600" />
                          <span className="text-lg font-semibold text-yellow-800">
                            Nouveau sur la plateforme
                          </span>
                        </div>
                        <p className="text-yellow-700">
                          Ce propriétaire vient de rejoindre 3W-LOC. Soyez le premier à laisser un avis après une location !
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar droite (4/12) - Compacte */}
              <div className="col-span-4 space-y-6">
                
                {/* Vérifications compactes */}
                <Card className="shadow-sm border border-gray-200">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Vérifications</h3>
                    
                    {owner && (
                      <div className="space-y-3">
                        {(() => {
                          const verificationStatus = getVerificationStatus(owner);
                          const verificationItems = [
                            { type: 'identity', label: 'Identité', ...verificationStatus.identity },
                            { type: 'email', label: 'Email', ...verificationStatus.email },
                            { type: 'phone', label: 'Téléphone', ...verificationStatus.phone },
                            { type: 'linkedin', label: 'LinkedIn', ...verificationStatus.linkedin }
                          ];

                          return verificationItems.map((verification, index) => (
                            <div key={index} className="flex items-center justify-between py-2">
                              <span className="text-gray-700 text-sm">{verification.label}</span>
                              <div className="flex items-center gap-2">
                                {verification.verified ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <div className="h-4 w-4 rounded-full border border-red-600 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Actions rapides */}
                {isOwnProfile && (
                  <Card className="shadow-sm border border-gray-200">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                      
                      <div className="space-y-3">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => openPhotoModal('profile')}
                        >
                          <Camera className="h-4 w-4 mr-3" />
                          Changer photo de profil
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => openPhotoModal('cover')}
                        >
                          <ImageIcon className="h-4 w-4 mr-3" />
                          Changer photo de couverture
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => navigate('/settings/profile')}
                        >
                          <Edit3 className="h-4 w-4 mr-3" />
                          Modifier le profil
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal d'upload de photo */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-2">
              Changer la {photoModalType === 'profile' ? 'photo de profil' : 'photo de couverture'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {photoModalType === 'profile' 
                ? 'Votre photo de profil sera visible par tous les utilisateurs'
                : 'Personnalisez votre profil avec une belle photo de couverture'
              }
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={() => handleTakePhoto(photoModalType)}
                disabled={uploadingPhoto}
                className="w-full bg-green-500 text-white rounded-lg py-3 font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingPhoto ? (
                  <Loader2 className="h-5 w-5 inline mr-2 animate-spin" />
                ) : (
                  <Camera className="h-5 w-5 inline mr-2" />
                )}
                {uploadingPhoto ? 'Upload en cours...' : 'Prendre une photo'}
              </button>
              
              <button 
                onClick={() => handleChooseFromGallery(photoModalType)}
                disabled={uploadingPhoto}
                className="w-full bg-gray-100 text-gray-700 rounded-lg py-3 font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingPhoto ? (
                  <Loader2 className="h-5 w-5 inline mr-2 animate-spin" />
                ) : (
                  <ImageIcon className="h-5 w-5 inline mr-2" />
                )}
                {uploadingPhoto ? 'Upload en cours...' : 'Choisir dans la galerie'}
              </button>
              
              <button 
                onClick={() => setShowPhotoModal(false)}
                disabled={uploadingPhoto}
                className="w-full text-gray-500 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerProfile;