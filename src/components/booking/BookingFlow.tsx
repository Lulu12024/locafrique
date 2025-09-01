
import React, { useState } from 'react';
import { useAuth } from '@/hooks/auth';
import { useBookingProcess } from '@/hooks/useBookingProcess';
import { usePayment } from '@/hooks/usePayment';
import { BookingData, EquipmentData } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { addDays, differenceInDays } from 'date-fns';
import DatePickerWithRange from '@/components/DatePickerWithRange';
import { Loader2, Check, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ReservationSummary } from './ReservationSummary';
import { BookingConfirmation } from './BookingConfirmation';
import { ContractView } from './ContractView';
import { ProfileCompletionForm } from './ProfileCompletionForm';

interface BookingFlowProps {
  equipment: EquipmentData;
  onComplete?: () => void;
}

export function BookingFlow({ equipment, onComplete }: BookingFlowProps) {
  const { user, profile, refreshProfile, loading: authLoading, authCheckComplete } = useAuth();
  const {
    loading,
    currentStep,
    setCurrentStep,
    calculateRentalPrice,
    createBooking
  } = useBookingProcess();
  const { createPayment } = usePayment();
  
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to?: Date;
  }>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });
  
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  
  const rentalDays = dateRange.to 
    ? differenceInDays(dateRange.to, dateRange.from) + 1 
    : 1;
    
  const totalPrice = calculateRentalPrice(equipment, rentalDays);
  
  // Check if user has completed profile with all required fields for contract
  const isProfileComplete = profile && 
    profile.first_name && 
    profile.last_name && 
    profile.phone_number && 
    profile.address && 
    profile.city && 
    profile.country && 
    profile.id_number;
  
  const handleBooking = async () => {
    console.log("🔍 Tentative de réservation - Utilisateur:", user?.email);
    console.log("🔍 Auth loading:", authLoading);
    console.log("🔍 Auth check complete:", authCheckComplete);
    console.log("🔍 Profile complet:", isProfileComplete);
    console.log("🔍 User object:", user);
    console.log("🔍 Profile object:", profile);
    
    // Vérifier d'abord que l'auth est complètement chargée
    if (authLoading || !authCheckComplete) {
      console.log("⏳ En attente de la vérification d'authentification");
      return;
    }
    
    if (!user) {
      console.log("❌ Pas d'utilisateur connecté");
      return;
    }

    if (!isProfileComplete) {
      console.log("📝 Profil incomplet, affichage du formulaire");
      setShowProfileForm(true);
      return;
    }

    if (dateRange.from && dateRange.to) {
      console.log("📅 Création de la réservation avec les dates:", dateRange);
      const result = await createBooking(
        equipment.id,
        dateRange.from,
        dateRange.to,
        rentalDays
      );
      
      if (result) {
        // Déclencher le processus de paiement
        const paymentResult = await createPayment({
          bookingId: result.id,
          amount: totalPrice,
          depositAmount: equipment.deposit_amount,
          description: `Location de ${equipment.title}`
        });

        if (paymentResult.success) {
          setBooking(result);
          setCurrentStep('complete');
        }
      }
    }
  };

  const handleProfileComplete = async () => {
    console.log("✅ Profil complété, continuer la réservation");
    setShowProfileForm(false);
    await refreshProfile();
    // Continue with booking after profile is complete
    if (dateRange.from && dateRange.to) {
      const result = await createBooking(
        equipment.id,
        dateRange.from,
        dateRange.to,
        rentalDays
      );
      
      if (result) {
        // Déclencher le processus de paiement
        const paymentResult = await createPayment({
          bookingId: result.id,
          amount: totalPrice,
          depositAmount: equipment.deposit_amount,
          description: `Location de ${equipment.title}`
        });

        if (paymentResult.success) {
          setBooking(result);
          setCurrentStep('complete');
        }
      }
    }
  };
  
  // Wait for auth check to complete before showing anything
  if (authLoading || !authCheckComplete) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Vérification de l'authentification...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connexion requise</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Vous devez être connecté pour réserver ce matériel</p>
          <Button asChild>
            <Link to="/auth">Se connecter</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show profile completion form if needed
  if (showProfileForm) {
    return (
      <ProfileCompletionForm
        onComplete={handleProfileComplete}
        onCancel={() => setShowProfileForm(false)}
      />
    );
  }

  if (currentStep === 'complete' && booking) {
    return (
      <BookingConfirmation 
        booking={booking}
        onContactOwner={() => {
          console.log('Contact owner');
        }}
        onViewContract={() => setCurrentStep('contract')}
      />
    );
  }

  if (currentStep === 'contract' && booking) {
    return (
      <ContractView 
        booking={booking}
        onContractSigned={() => {
          console.log('Contract signed');
        }}
      />
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main booking form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Réserver ce matériel</CardTitle>
              <p className="text-sm text-green-600">
                ✅ Connecté en tant que: {user.email}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date selection */}
              <div>
                <h3 className="text-lg font-medium mb-3">Choisir les dates</h3>
                <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                <p className="text-sm text-gray-600 mt-2">
                  Sélectionnez les dates de début et de fin de votre location
                </p>
              </div>
              
              <Separator />
              
              {/* Profile status */}
              <div>
                <h3 className="text-lg font-medium mb-3">Vos informations</h3>
                {isProfileComplete ? (
                  <div className="bg-green-50 p-4 rounded-md">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <Check className="h-4 w-4" />
                      <span className="font-medium">Profil complet</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Nom complet:</span>
                        <p className="font-medium">{profile?.first_name} {profile?.last_name}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Téléphone:</span>
                        <p className="font-medium">{profile?.phone_number}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Adresse:</span>
                        <p className="font-medium">
                          {profile?.address}, {profile?.city}, {profile?.country}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-4 rounded-md">
                    <div className="flex items-center gap-2 text-yellow-700 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Profil incomplet</span>
                    </div>
                    <p className="text-sm text-yellow-600">
                      Vous devrez compléter vos informations personnelles 
                      (nom, téléphone, adresse, pièce d'identité) pour le contrat de location.
                    </p>
                  </div>
                )}
              </div>
              
              <Separator />
              
              {/* Terms and conditions */}
              <div>
                <h3 className="text-lg font-medium mb-3">Conditions</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <input type="checkbox" id="terms" className="mt-1" required />
                    <label htmlFor="terms" className="text-gray-700">
                      J'accepte les{' '}
                      <Link to="/terms" className="text-blue-600 hover:underline">
                        conditions générales d'utilisation
                      </Link>{' '}
                      et la{' '}
                      <Link to="/privacy" className="text-blue-600 hover:underline">
                        politique de confidentialité
                      </Link>
                    </label>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <input type="checkbox" id="damage" className="mt-1" required />
                    <label htmlFor="damage" className="text-gray-700">
                      Je m'engage à utiliser le matériel conformément à sa destination 
                      et à le restituer dans l'état où je l'ai reçu
                    </label>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <input type="checkbox" id="insurance" className="mt-1" required />
                    <label htmlFor="insurance" className="text-gray-700">
                      Je confirme être couvert par une assurance responsabilité civile
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Action button */}
              <div className="pt-4">
                <Button 
                  onClick={handleBooking} 
                  disabled={loading || !dateRange.to || authLoading || !authCheckComplete}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Création de la réservation...
                    </>
                  ) : (authLoading || !authCheckComplete) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Vérification...
                    </>
                  ) : !isProfileComplete ? (
                    'Compléter le profil et réserver'
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Confirmer la réservation
                    </>
                  )}
                </Button>
                
                {!isProfileComplete && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Vous devrez renseigner vos informations personnelles avant la validation finale
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Reservation summary sidebar */}
        <div className="lg:col-span-1">
          {dateRange.to && (
            <ReservationSummary
              equipment={equipment}
              startDate={dateRange.from}
              endDate={dateRange.to}
              totalPrice={totalPrice}
              depositAmount={equipment.deposit_amount}
            />
          )}
        </div>
      </div>
    </div>
  );
}
