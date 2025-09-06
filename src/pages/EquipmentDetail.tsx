
// import React, { useState, useEffect } from "react";
// import { useParams, useLocation } from "react-router-dom";
// import { useEquipmentDetail } from "@/hooks/useEquipmentDetail";
// import Footer from "@/components/Footer";
// import { AppStoreStyleDetailView } from "@/components/equipment-detail/AppStoreStyleDetailView";
// import { useDeviceSize } from "@/hooks/use-mobile";
// import { useAuth } from "@/hooks/auth";
// import { Container } from "@/components/ui/container";
// import { Skeleton } from "@/components/ui/skeleton";
// import { AlertCircle, RefreshCw } from "lucide-react";
// import { Button } from "@/components/ui/button";

// const EquipmentDetail = () => {
//   const { id } = useParams<{ id: string }>();
//   const location = useLocation();
//   const { fetchEquipmentById, isLoading } = useEquipmentDetail();
//   const [equipmentData, setEquipmentData] = useState<any>(null);
//   const [error, setError] = useState<string | null>(null);
//   const { isMobile } = useDeviceSize();
//   const { user } = useAuth();
  
//   console.log('🔍 EquipmentDetail - ID depuis l\'URL:', id);
//   console.log('📱 Est mobile:', isMobile);
//   console.log('🔗 URL actuelle:', window.location.href);
  
//   // Fetch equipment data with retry mechanism
//   const fetchData = async () => {
//     console.log('🚀 Début de fetchData avec ID:', id);
    
//     if (!id) {
//       console.error('❌ ID d\'équipement manquant dans l\'URL');
//       setError("ID d'équipement manquant");
//       return;
//     }

//     // Vérifier le format UUID
//     const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
//     if (!uuidRegex.test(id)) {
//       console.error('❌ Format UUID invalide:', id);
//       setError("Format d'ID invalide");
//       return;
//     }

//     try {
//       setError(null);
//       console.log("🔍 Chargement des détails de l'équipement:", id);
      
//       const data = await fetchEquipmentById(id);
//       console.log("📦 Données reçues:", data);
      
//       if (data.equipment && data.owner) {
//         // Combine equipment and owner data
//         const combinedData = {
//           ...data.equipment,
//           owner: data.owner
//         };
//         setEquipmentData(combinedData);
//         console.log("✅ Données combinées:", combinedData);
//       } else {
//         console.error('❌ Données manquantes:', data);
//         setError("Équipement non trouvé");
//       }
//     } catch (err: any) {
//       console.error("❌ Erreur lors du chargement:", err);
//       setError(err.message || "Erreur lors du chargement des détails");
//     }
//   };

//   useEffect(() => {
//     console.log('🔄 useEffect déclenché, ID:', id);
//     fetchData();
//   }, [id]);

//   const handleRetry = () => {
//     console.log('🔄 Retry déclenché');
//     fetchData();
//   };

//   // Loading skeleton
//   const LoadingSkeleton = () => (
//     <div className="container mx-auto px-4 py-8">
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//         <div className="space-y-4">
//           <Skeleton className="aspect-video rounded-lg" />
//           <div className="grid grid-cols-4 gap-2">
//             {[...Array(4)].map((_, i) => (
//               <Skeleton key={i} className="aspect-square rounded-md" />
//             ))}
//           </div>
//         </div>
//         <div className="space-y-6">
//           <Skeleton className="h-8 w-3/4" />
//           <Skeleton className="h-4 w-1/2" />
//           <Skeleton className="h-12 w-1/3" />
//           <div className="space-y-2">
//             <Skeleton className="h-4 w-full" />
//             <Skeleton className="h-4 w-full" />
//             <Skeleton className="h-4 w-2/3" />
//           </div>
//         </div>
//       </div>
//     </div>
//   );

//   // Error component
//   const ErrorComponent = () => (
//     <div className="min-h-[50vh] flex items-center justify-center">
//       <div className="text-center space-y-4 max-w-md">
//         <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
//           <AlertCircle className="h-8 w-8 text-red-600" />
//         </div>
//         <h2 className="text-xl font-semibold text-gray-900">Équipement non trouvé</h2>
//         <p className="text-gray-600">{error}</p>
//         <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
//           <p><strong>Debug Info:</strong></p>
//           <p>ID recherché: {id}</p>
//           <p>Format UUID valide: {id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? 'Oui' : 'Non'}</p>
//           <p>URL actuelle: {window.location.href}</p>
//           <p>Mobile: {isMobile ? 'Oui' : 'Non'}</p>
//         </div>
//         <Button onClick={handleRetry} variant="outline" className="mt-4">
//           <RefreshCw className="h-4 w-4 mr-2" />
//           Réessayer
//         </Button>
//       </div>
//     </div>
//   );

//   return (
//     <div className="min-h-screen flex flex-col">      
//       <main className="flex-grow">
//         {isLoading ? (
//           <div className="py-8">
//             <Container>
//               <LoadingSkeleton />
//             </Container>
//           </div>
//         ) : error || !equipmentData ? (
//           <div className="py-8">
//             <Container>
//               <ErrorComponent />
//             </Container>
//           </div>
//         ) : (
//           <AppStoreStyleDetailView 
//             equipment={equipmentData} 
//           />
//         )}
//       </main>
      
//       <Footer />
//     </div>
//   );
// };

// export default EquipmentDetail;
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Star, Shield, Package, Clock, CreditCard, ArrowRight, Heart, Share2 } from 'lucide-react';

// Composant principal de la fiche produit modernisée
const EquipmentDetail = () => {
  const [showReservationFlow, setShowReservationFlow] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDates, setSelectedDates] = useState({ from: null, to: null });
  const [isLiked, setIsLiked] = useState(false);

  // Données d'exemple pour l'équipement
  const equipment = {
    id: "eq-123",
    title: "Pelleteuse hydraulique Caterpillar 320",
    daily_price: 45000,
    deposit_amount: 150000,
    rating: 4.8,
    reviews: 24,
    location: "Cotonou, Bénin",
    category: "Équipements de construction",
    verified: true,
    images: [
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=600",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600"
    ],
    description: "Pelleteuse hydraulique en excellent état, idéale pour vos travaux de terrassement et construction. Entretien régulier assuré.",
    features: [
      "Capacité de godet: 1.2 m³",
      "Poids opérationnel: 20 tonnes",
      "Consommation: 15L/h",
      "Équipée GPS de sécurité"
    ],
    owner: {
      name: "Jean Kouassi",
      avatar: "JK",
      verified: true,
      responseTime: "< 1h",
      hostSince: "2022"
    }
  };

  const ReservationFlow = () => {
    const steps = [
      { id: 1, name: 'Dates', icon: Calendar, desc: 'Choisissez vos dates' },
      { id: 2, name: 'Informations', icon: Package, desc: 'Vos coordonnées' },
      { id: 3, name: 'Paiement', icon: CreditCard, desc: 'Finalisation' }
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header avec étapes */}
          <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Réservation - {equipment.title}</h2>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/20"
                onClick={() => setShowReservationFlow(false)}
              >
                ✕
              </Button>
            </div>
            
            {/* Indicateur d'étapes */}
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.id ? 'bg-white text-blue-600 border-white' : 'border-white/50 text-white/70'
                  }`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-white' : 'text-white/70'}`}>
                      {step.name}
                    </p>
                    <p className="text-xs text-white/70">{step.desc}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="h-4 w-4 mx-4 text-white/50" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contenu de l'étape */}
          <div className="p-6">
            {currentStep === 1 && <DateSelectionStep />}
            {currentStep === 2 && <InformationStep />}
            {currentStep === 3 && <PaymentStep />}
          </div>
        </div>
      </div>
    );
  };

  const DateSelectionStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-4">Sélectionnez vos dates</h3>
          <div className="bg-gray-50 p-6 rounded-xl">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
                <input 
                  type="date" 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
                <input 
                  type="date" 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 <strong>Conseil :</strong> Les réservations de plus de 7 jours bénéficient d'une réduction de 10%
              </p>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-4">Récapitulatif</h3>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-4">
                <img src={equipment.images[0]} alt={equipment.title} className="w-16 h-16 rounded-lg object-cover" />
                <div>
                  <h4 className="font-medium">{equipment.title}</h4>
                  <p className="text-sm text-gray-600">{equipment.location}</p>
                </div>
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Prix par jour</span>
                  <span>{equipment.daily_price.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span>Nombre de jours</span>
                  <span>3 jours</span>
                </div>
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span>{(equipment.daily_price * 3).toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Frais de service (5%)</span>
                  <span>{Math.round(equipment.daily_price * 3 * 0.05).toLocaleString()} FCFA</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{Math.round(equipment.daily_price * 3 * 1.05).toLocaleString()} FCFA</span>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-700">
                  <strong>Caution :</strong> {equipment.deposit_amount.toLocaleString()} FCFA (remboursable)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button onClick={() => setCurrentStep(2)} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
          Continuer <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const InformationStep = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Vos informations</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
          <input type="text" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
          <input type="text" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input type="email" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
          <input type="tel" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Utilisation prévue</label>
        <textarea 
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
          rows={3}
          placeholder="Décrivez brièvement l'utilisation prévue de l'équipement..."
        />
      </div>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep(1)}>
          Retour
        </Button>
        <Button onClick={() => setCurrentStep(3)} className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
          Continuer <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const PaymentStep = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Finalisation et paiement</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Méthode de paiement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="payment" className="mr-3" defaultChecked />
                  <div className="flex-1">
                    <div className="font-medium">Carte bancaire</div>
                    <div className="text-sm text-gray-600">Visa, Mastercard</div>
                  </div>
                </label>
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="payment" className="mr-3" />
                  <div className="flex-1">
                    <div className="font-medium">Mobile Money</div>
                    <div className="text-sm text-gray-600">MTN, Moov, Orange</div>
                  </div>
                </label>
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="payment" className="mr-3" />
                  <div className="flex-1">
                    <div className="font-medium">Portefeuille 3W-LOC</div>
                    <div className="text-sm text-gray-600">Solde : 50,000 FCFA</div>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Protection incluse</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✓ Assurance équipement</li>
              <li>✓ Support 24/7</li>
              <li>✓ Remboursement en cas d'annulation</li>
            </ul>
          </div>
        </div>
        
        {/* Récapitulatif final */}
        <Card>
          <CardHeader>
            <CardTitle>Récapitulatif final</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Location (3 jours)</span>
                <span>{(equipment.daily_price * 3).toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Commission plateforme (5%)</span>
                <span>{Math.round(equipment.daily_price * 3 * 0.05).toLocaleString()} FCFA</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                <span>Total à payer</span>
                <span>{Math.round(equipment.daily_price * 3 * 1.05).toLocaleString()} FCFA</span>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Caution (bloquée)</span>
                  <span>{equipment.deposit_amount.toLocaleString()} FCFA</span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">Débloquée après retour de l'équipement</p>
              </div>
            </div>
            
            <Button className="w-full py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-lg font-semibold">
              Confirmer et payer
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-start">
        <Button variant="outline" onClick={() => setCurrentStep(2)}>
          Retour
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Images et titre principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="relative">
            <img 
              src={equipment.images[0]} 
              alt={equipment.title}
              className="w-full h-96 object-cover rounded-2xl"
            />
            <div className="absolute top-4 right-4 flex space-x-2">
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-white/90 hover:bg-white"
                onClick={() => setIsLiked(!isLiked)}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'text-red-500 fill-current' : ''}`} />
              </Button>
              <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {equipment.images.slice(1, 5).map((img, index) => (
              <img key={index} src={img} alt="" className="h-20 object-cover rounded-lg" />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="secondary">{equipment.category}</Badge>
              {equipment.verified && (
                <Badge className="bg-green-100 text-green-800">
                  <Shield className="h-3 w-3 mr-1" />
                  Vérifié
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{equipment.title}</h1>
            <div className="flex items-center space-x-4 text-gray-600">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {equipment.location}
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1 text-yellow-500" />
                {equipment.rating} ({equipment.reviews} avis)
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl">
            <div className="flex items-baseline space-x-2 mb-4">
              <span className="text-3xl font-bold text-green-600">
                {equipment.daily_price.toLocaleString()} FCFA
              </span>
              <span className="text-gray-600">/jour</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Caution : {equipment.deposit_amount.toLocaleString()} FCFA (remboursable)
            </p>
            
            {/* NOUVEAU BOUTON DE RÉSERVATION MODERNISÉ */}
            <Button 
              onClick={() => setShowReservationFlow(true)}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold text-lg rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <Calendar className="mr-3 h-6 w-6" />
              Réserver maintenant
            </Button>
            
            <p className="text-xs text-gray-500 text-center mt-2">
              Réservation instantanée • Annulation gratuite 24h avant
            </p>
          </div>

          {/* Informations du propriétaire (SANS contact direct) */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {equipment.owner.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{equipment.owner.name}</h3>
                    {equipment.owner.verified && (
                      <Shield className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Répond en {equipment.owner.responseTime}
                    </span>
                    <span>Hôte depuis {equipment.owner.hostSince}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Description et caractéristiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{equipment.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Caractéristiques</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {equipment.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Flux de réservation en overlay */}
      {showReservationFlow && <ReservationFlow />}
    </div>
  );
};

export default EquipmentDetail;