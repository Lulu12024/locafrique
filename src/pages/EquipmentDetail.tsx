// src/pages/EquipmentDetail.tsx - Version avec vraies données

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MapPin, Star, Shield, Package, Clock, CreditCard, ArrowRight, Heart, Share2, ChevronLeft, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react';
import { EquipmentData } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import ReservationModal from '@/components/booking/ReservationModal';

const EquipmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [equipment, setEquipment] = useState<EquipmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);

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
        
        const { data, error: fetchError } = await supabase
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

        if (!data) {
          setError("Équipement non trouvé");
          setIsLoading(false);
          return;
        }

        console.log("✅ Équipement chargé:", data);
        setEquipment(data as EquipmentData);
        setIsLoading(false);

      } catch (error) {
        console.error("❌ Erreur lors du chargement:", error);
        setError("Erreur lors du chargement de l'équipement");
        setIsLoading(false);
      }
    };

    fetchEquipment();
  }, [id]);

  // Navigation entre les images
  const nextImage = () => {
    if (equipment && Array.isArray(equipment.images) && equipment.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % equipment.images.length);
    }
  };

  const prevImage = () => {
    if (equipment && Array.isArray(equipment.images) && equipment.images.length > 1) {
      setCurrentImageIndex((prev) => prev === 0 ? equipment.images.length - 1 : prev - 1);
    }
  };

  // Gestion de la réservation
  const handleReservation = () => {
    setShowReservationModal(true);
  };

  const handleReservationSuccess = () => {
    setShowReservationModal(false);
    toast({
      title: "Réservation réussie !",
      description: "Votre demande de réservation a été envoyée au propriétaire.",
    });
  };

  // États de chargement et d'erreur
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-green-600" />
          <p className="text-gray-600">Chargement des détails de l'équipement...</p>
        </div>
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Équipement non trouvé</h1>
          <p className="text-gray-600 mb-6">{error || "Cet équipement n'existe pas ou n'est plus disponible."}</p>
          <Button onClick={() => navigate('/')} className="bg-green-600 hover:bg-green-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  // Gestion des images
  const images = Array.isArray(equipment.images) ? equipment.images : [];
  const currentImage = images[currentImageIndex];
  const hasImages = images.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec bouton retour */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsLiked(!isLiked)}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale - Images et détails */}
          <div className="lg:col-span-2 space-y-6">
            {/* Galerie d'images */}
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-gray-100">
                {hasImages && currentImage ? (
                  <img
                    src={currentImage.image_url}
                    alt={equipment.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                
                {/* Navigation des images */}
                {images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>
              
              {/* Miniatures */}
              {images.length > 1 && (
                <div className="p-4">
                  <div className="flex space-x-2 overflow-x-auto">
                    {images.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 ${
                          currentImageIndex === index ? 'border-green-500' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={image.image_url}
                          alt={`Vue ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Informations principales */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {equipment.title}
                    </h1>
                    <div className="flex items-center space-x-4 text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{equipment.city}, {equipment.country}</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                        <span className="font-medium">4.8</span>
                        <span className="text-sm ml-1">(24 avis)</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {equipment.status}
                  </Badge>
                </div>

                {/* Propriétaire */}
                {equipment.owner && (
                  <div className="flex items-center space-x-3 py-4 border-y">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={equipment.owner.avatar_url} />
                      <AvatarFallback className="bg-green-100 text-green-700">
                        {equipment.owner.first_name?.[0]}{equipment.owner.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">
                          {equipment.owner.first_name} {equipment.owner.last_name}
                        </p>
                        <Shield className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-sm text-gray-600">
                        Répond en &lt; 1h • Hôte depuis 2022
                      </p>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="py-6">
                  <h3 className="text-lg font-semibold mb-3">Description</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {equipment.description}
                  </p>
                </div>

                {/* Détails techniques */}
                <div className="py-6 border-t">
                  <h3 className="text-lg font-semibold mb-4">Détails de l'équipement</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Catégorie</span>
                        <span className="font-medium">{equipment.category}</span>
                      </div>
                      {equipment.brand && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Marque</span>
                          <span className="font-medium">{equipment.brand}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">État</span>
                        <span className="font-medium">{equipment.condition}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {equipment.year && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Année</span>
                          <span className="font-medium">{equipment.year}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Caution</span>
                        <span className="font-medium">{equipment.deposit_amount.toLocaleString()} FCFA</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Localisation */}
                <div className="py-6 border-t">
                  <h3 className="text-lg font-semibold mb-4">Où vous récupérerez l'équipement</h3>
                  <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">{equipment.location || equipment.city}</p>
                      <p className="text-sm text-gray-500 mt-1">Carte interactive bientôt disponible</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonne de droite - Panneau de réservation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {equipment.daily_price.toLocaleString()} FCFA
                      <span className="text-base font-normal text-gray-600">/jour</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Caution : {equipment.deposit_amount.toLocaleString()} FCFA (remboursable)
                    </p>
                  </div>

                  <Button 
                    onClick={handleReservation}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 text-lg font-semibold mb-4"
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Réserver maintenant
                  </Button>

                  <div className="text-center text-sm text-gray-600 space-y-1">
                    <p>Réservation instantanée • Annulation gratuite 24h avant</p>
                  </div>

                  <div className="mt-6 pt-6 border-t space-y-3">
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
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

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