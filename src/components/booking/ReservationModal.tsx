// src/components/booking/ReservationModal.tsx
// VERSION SIMPLIFIÉE : Paiement KakiaPay UNIQUEMENT - Pas de wallet

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, 
  Clock,
  CreditCard,
  Info,
  Zap,
  Upload,
  Calculator,
  Calendar as CalendarIcon,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/hooks/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { KkiaPayWidget } from '@/components/KkiaPayWidget';

// Déclarations TypeScript pour KakiaPay
declare global {
  interface Window {
    openKkiapayWidget: (config: any) => void;
    addKkiapayListener: (event: string, callback: (response: any) => void) => void;
    removeKkiapayListener: (event: string, callback: (response: any) => void) => void;
  }
}

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  equipment: any;
  startDate?: Date | string;
  endDate?: Date | string;
  total?: number;
}

// Fonctions utilitaires
const safeToLocaleString = (value: any): string => {
  try {
    const num = Number(value);
    if (isNaN(num)) return '0';
    return num.toLocaleString();
  } catch {
    return '0';
  }
};

const safeFormatDate = (date: Date | string, formatType: 'short' | 'long' = 'short'): string => {
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return 'Date invalide';
    }
    
    if (isNaN(dateObj.getTime())) {
      return 'Date invalide';
    }
    
    if (formatType === 'long') {
      return dateObj.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } else {
      return dateObj.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
  } catch (error) {
    console.error('Erreur formatage date:', error);
    return 'Date invalide';
  }
};

const calculateDays = (start: Date, end: Date): number => {
  try {
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return Math.max(1, daysDiff);
  } catch {
    return 1;
  }
};

function ReservationModal({
  isOpen,
  onClose,
  onSuccess,
  equipment,
  startDate: initialStartDate,
  endDate: initialEndDate,
}: ReservationModalProps) {
  const { user } = useAuth();
  
  if (!isOpen) {
    return null;
  }
  
  // Validation de l'équipement
  const validEquipment = useMemo(() => {
    if (!equipment || typeof equipment !== 'object') {
      return {
        id: '',
        title: 'Équipement non spécifié',
        daily_price: 0,
        weekly_price: 0,
        deposit_amount: 0,
        owner_id: ''
      };
    }
    return {
      id: equipment.id || '',
      title: equipment.title || 'Équipement',
      daily_price: Number(equipment.daily_price) || 0,
      weekly_price: Number(equipment.weekly_price) || 0,
      deposit_amount: Number(equipment.deposit_amount) || 0,
      owner_id: equipment.owner_id || ''
    };
  }, [equipment]);

  // États pour les dates
  const [selectedStartDate, setSelectedStartDate] = useState<Date>(() => {
    try {
      if (initialStartDate) {
        const date = typeof initialStartDate === 'string' ? new Date(initialStartDate) : initialStartDate;
        return !isNaN(date.getTime()) ? date : new Date();
      }
      return new Date();
    } catch {
      return new Date();
    }
  });

  const [selectedEndDate, setSelectedEndDate] = useState<Date>(() => {
    try {
      if (initialEndDate) {
        const date = typeof initialEndDate === 'string' ? new Date(initialEndDate) : initialEndDate;
        return !isNaN(date.getTime()) ? date : new Date(Date.now() + 24 * 60 * 60 * 1000);
      }
      const start = selectedStartDate || new Date();
      return new Date(start.getTime() + 24 * 60 * 60 * 1000);
    } catch {
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  });

  // Calcul du prix total
  const calculatedTotal = useMemo(() => {
    try {
      const days = calculateDays(selectedStartDate, selectedEndDate);
      const dailyPrice = validEquipment.daily_price;
      const weeklyPrice = validEquipment.weekly_price;
      
      if (days >= 7 && weeklyPrice > 0) {
        const weeks = Math.floor(days / 7);
        const remainingDays = days % 7;
        const weeklyTotal = weeks * weeklyPrice;
        const dailyTotal = remainingDays * dailyPrice;
        return weeklyTotal + dailyTotal;
      } else {
        return days * dailyPrice;
      }
    } catch {
      return 0;
    }
  }, [selectedStartDate, selectedEndDate, validEquipment.daily_price, validEquipment.weekly_price]);

  // États du composant
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [kakiaPayTransactionId, setKakiaPayTransactionId] = useState<string | null>(null);
  
  // ✅ Charger le script KakiaPay
  useEffect(() => {
    if (!document.querySelector('script[src*="kkiapay"]')) {
      const script = document.createElement('script');
      script.src = 'https://cdn.kkiapay.me/k.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);
  
  const feeCalculations = useMemo(() => {
    const baseCost = calculatedTotal;
    const commissionAmount = Math.round(baseCost * 0.05);
    const platformFee = 0; // Pas de frais supplémentaire pour le locataire
    const totalWithFees = baseCost + commissionAmount + platformFee;
    
    return {
      baseCost,
      commissionAmount,
      platformFee,
      totalWithFees
    };
  }, [calculatedTotal]);

  // États pour les détails de réservation
  const [reservationDetails, setReservationDetails] = useState({
    contactPhone: '',
    deliveryMethod: 'pickup',
    deliveryAddress: '',
    specialRequests: '',
    identityNumber: '',
    identityDocument: null as File | null,
    acceptTerms: false
  });

  // Gestion des changements d'input
  const handleInputChange = (field: string, value: any) => {
    setReservationDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Gestion des dates
  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedStartDate(date);
      if (selectedEndDate <= date) {
        const newEndDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
        setSelectedEndDate(newEndDate);
      }
      setIsStartDateOpen(false);
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date && date > selectedStartDate) {
      setSelectedEndDate(date);
      setIsEndDateOpen(false);
    }
  };

  // Gestion du fichier d'identité
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille maximale autorisée est de 5MB.",
          variant: "destructive"
        });
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Format non supporté",
          description: "Seuls les formats JPG et PNG sont acceptés.",
          variant: "destructive"
        });
        return;
      }
      
      handleInputChange('identityDocument', file);
    }
  };

  // Navigation entre les étapes
  const nextStep = () => {
    if (currentStep === 1) {
      if (calculatedTotal <= 0) {
        toast({
          title: "Période invalide",
          description: "Veuillez sélectionner une période de location valide.",
          variant: "destructive"
        });
        return;
      }
    } else if (currentStep === 2) {
      if (!reservationDetails.contactPhone.trim()) {
        toast({
          title: "Téléphone requis",
          description: "Veuillez saisir votre numéro de téléphone.",
          variant: "destructive"
        });
        return;
      }
    } else if (currentStep === 3) {
      if (!reservationDetails.identityNumber.trim() || !reservationDetails.identityDocument) {
        toast({
          title: "Vérification d'identité requise",
          description: "Veuillez fournir votre numéro et document d'identité.",
          variant: "destructive"
        });
        return;
      }
    } else if (currentStep === 4) {
      if (!reservationDetails.acceptTerms) {
        toast({
          title: "Conditions requises",
          description: "Veuillez accepter les conditions générales.",
          variant: "destructive"
        });
        return;
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // ✅ Fonction pour ouvrir KakiaPay après fermeture du modal
  const handleOpenKakiaPay = () => {
    // Utiliser directement l'API KakiaPay
    if (window.openKkiapayWidget) {
      window.openKkiapayWidget({
        amount: feeCalculations.totalWithFees,
        api_key: import.meta.env.VITE_KAKIAPAY_API_KEY || '8a7c56d02d3011f0844d9be160e8ba91',
        sandbox: true,
        email: user?.email,
        phone: reservationDetails.contactPhone,
        name: `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim(),
        data: {
          bookingData: {
            equipment_id: validEquipment.id,
            start_date: selectedStartDate.toISOString().split('T')[0],
            end_date: selectedEndDate.toISOString().split('T')[0],
            total_price: feeCalculations.baseCost,
            deposit_amount: validEquipment.deposit_amount,
            contact_phone: reservationDetails.contactPhone,
            delivery_method: reservationDetails.deliveryMethod,
            delivery_address: reservationDetails.deliveryAddress,
            special_requests: reservationDetails.specialRequests,
            identity_number: reservationDetails.identityNumber,
            commission_amount: feeCalculations.commissionAmount,
          }
        }
      });

      // Écouter les événements KakiaPay
      window.addKkiapayListener('success', async (response: any) => {
        console.log('✅ Paiement réussi:', response);
        await handleKakiaPaySuccess(response);
      });

      window.addKkiapayListener('failed', (error: any) => {
        console.error('❌ Paiement échoué:', error);
        handleKakiaPayError(error);
      });
    } else {
      toast({
        title: "Erreur",
        description: "Le système de paiement n'est pas disponible.",
        variant: "destructive"
      });
    }
  };

  // ✅ Gestionnaire de succès du paiement KakiaPay
  const handleKakiaPaySuccess = async (response: any) => {
    console.log('✅ Paiement KakiaPay réussi:', response);
    
    setPaymentCompleted(true);
    setKakiaPayTransactionId(response.transactionId || response.transaction_id);

    toast({
      title: "✅ Paiement validé !",
      description: "Création de votre réservation en cours...",
    });

    // Créer la réservation maintenant que le paiement est confirmé
    await createBookingAfterPayment(response.transactionId || response.transaction_id);
  };

  const handleKakiaPayError = (error: any) => {
    console.error('❌ Erreur paiement KakiaPay:', error);
    toast({
      title: "Erreur de paiement",
      description: error.message || "Le paiement a échoué. Veuillez réessayer.",
      variant: "destructive"
    });
  };

  const handleKakiaPayCancel = () => {
    console.log('🚫 Paiement annulé');
    toast({
      title: "Paiement annulé",
      description: "Vous pouvez réessayer quand vous le souhaitez.",
    });
  };

  // ✅ Création de la réservation APRÈS le paiement
  const createBookingAfterPayment = async (transactionId: string) => {
    if (!user?.id || !validEquipment.id) {
      toast({
        title: "Erreur",
        description: "Informations utilisateur manquantes.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload du document d'identité
      let documentUrl = null;
      if (reservationDetails.identityDocument) {
        try {
          const fileExt = reservationDetails.identityDocument.name.split('.').pop() || 'jpg';
          const fileName = `identity_${user.id}_${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('identity-documents')
            .upload(fileName, reservationDetails.identityDocument);

          if (!uploadError && uploadData) {
            const { data: publicUrlData } = supabase.storage
              .from('identity-documents')
              .getPublicUrl(uploadData.path);
            documentUrl = publicUrlData.publicUrl;
          }
        } catch (uploadErr) {
          console.error("❌ Erreur upload:", uploadErr);
        }
      }

      // Créer la réservation
      const bookingData = {
        equipment_id: validEquipment.id,
        renter_id: user.id,
        start_date: selectedStartDate.toISOString().split('T')[0],
        end_date: selectedEndDate.toISOString().split('T')[0],
        total_price: feeCalculations.baseCost,
        deposit_amount: validEquipment.deposit_amount,
        status: 'pending', // ✅ En attente de validation du propriétaire
        payment_status: 'paid', // ✅ Déjà payé via KakiaPay
        payment_method: 'kakiapay',
        transaction_id: transactionId,
        contact_phone: reservationDetails.contactPhone || '',
        delivery_method: reservationDetails.deliveryMethod || 'pickup',
        delivery_address: reservationDetails.deliveryAddress || null,
        special_requests: reservationDetails.specialRequests || null,
        commission_amount: feeCalculations.commissionAmount,
        platform_fee: feeCalculations.platformFee,
        identity_verified: true,
        identity_document_url: documentUrl
      };

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (bookingError) {
        throw bookingError;
      }

      console.log('✅ Réservation créée:', booking.id);

      // ✅ Créer la notification in-app pour le propriétaire
      await supabase.from('notifications').insert({
        user_id: validEquipment.owner_id,
        type: 'new_booking',
        title: '🔔 Nouvelle réservation payée',
        message: `${user.email} a réservé "${validEquipment.title}" du ${safeFormatDate(selectedStartDate, 'long')} au ${safeFormatDate(selectedEndDate, 'long')} pour ${safeToLocaleString(feeCalculations.baseCost)} FCFA. Paiement confirmé.`,
        booking_id: booking.id
      });

      // ✅ Envoyer l'email au propriétaire
      try {
        console.log('📧 Envoi email au propriétaire via Gmail...');
        
        const { data: emailResult, error: emailError } = await supabase.functions.invoke(
          'send-booking-notification-gmail', // ← Nouvelle fonction Gmail
          {
            body: { booking_id: booking.id }
          }
        );

        if (emailError) {
          console.error('⚠️ Erreur envoi email au propriétaire:', emailError);
          // L'email n'est pas critique, on continue quand même
        } else if (emailResult?.success) {
          console.log('✅ Email envoyé avec succès au propriétaire');
        } else {
          console.warn('⚠️ Email non envoyé, mais réservation créée');
        }
      } catch (emailError: any) {
        console.error('⚠️ Exception lors de l\'envoi email:', emailError.message);
        // Ne pas bloquer la réservation si l'email échoue
      }

      toast({
        title: "🎉 Réservation créée !",
        description: "Le propriétaire a été notifié et va examiner votre demande.",
        duration: 5000
      });

      onSuccess();
      onClose();

    } catch (error: any) {
      console.error('❌ Erreur création réservation:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création de la réservation.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && (isStartDateOpen || isEndDateOpen)) {
        return;
      }
      onClose();
    }}>
      <DialogContent 
        className="w-full max-w-lg sm:max-w-2xl lg:max-w-4xl h-[85vh] sm:h-auto max-h-[85vh] p-0 overflow-hidden"
      >
        <div className="flex flex-col h-full">
          <DialogHeader className="shrink-0">
            <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-3 sm:p-6 text-white">
              <DialogTitle className="text-base sm:text-2xl font-bold flex items-center">
                <Zap className="mr-2 sm:mr-3 h-4 w-4 sm:h-6 sm:w-6" />
                Réservation Express
              </DialogTitle>
              <p className="text-emerald-100 text-xs sm:text-sm mt-1 truncate">{validEquipment.title}</p>
              
              {/* Indicateur de progression */}
              <div className="mt-3 sm:mt-6">
                <div className="flex items-center justify-between">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={cn(
                        "w-6 h-6 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all",
                        currentStep >= step 
                          ? "bg-white text-emerald-600 shadow-lg" 
                          : "bg-emerald-400 text-white"
                      )}>
                        {currentStep > step ? <CheckCircle className="h-3 w-3 sm:h-6 sm:w-6" /> : step}
                      </div>
                      {step < 5 && (
                        <div className={cn(
                          "w-4 sm:w-12 lg:w-16 h-1 mx-1 sm:mx-2 transition-all",
                          currentStep > step ? "bg-white" : "bg-emerald-400"
                        )} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Corps du modal avec scroll */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 sm:p-6 space-y-3 sm:space-y-6">
              
              {/* Étape 1: Sélection des dates */}
              {currentStep === 1 && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-4">Choisissez vos dates</h3>
                    
                    <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0 mb-6">
                      {/* Date de début */}
                      <div className="space-y-2">
                        <Label className="text-sm">Date de début</Label>
                        <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal text-sm"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              <span className="truncate">{safeFormatDate(selectedStartDate, 'long')}</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 z-[10000]" align="start">
                            <Calendar
                              mode="single"
                              selected={selectedStartDate}
                              onSelect={handleStartDateChange}
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Date de fin */}
                      <div className="space-y-2">
                        <Label className="text-sm">Date de fin</Label>
                        <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal text-sm"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              <span className="truncate">{safeFormatDate(selectedEndDate, 'long')}</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 z-[10000]" align="start">
                            <Calendar
                              mode="single"
                              selected={selectedEndDate}
                              onSelect={handleEndDateChange}
                              disabled={(date) => date <= selectedStartDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* Résumé */}
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                          <div className="text-center">
                            <p className="text-xs sm:text-sm text-blue-600">Durée</p>
                            <p className="font-bold text-sm sm:text-base text-blue-800">
                              {calculateDays(selectedStartDate, selectedEndDate)} jour(s)
                            </p>
                          </div>
                          <div className="hidden sm:block w-px h-8 bg-blue-300" />
                          <div className="text-center">
                            <p className="text-xs sm:text-sm text-blue-600">Prix journalier</p>
                            <p className="font-bold text-sm sm:text-base text-blue-800">
                              {safeToLocaleString(validEquipment.daily_price)} FCFA
                            </p>
                          </div>
                          <div className="hidden sm:block w-px h-8 bg-blue-300" />
                          <div className="text-center">
                            <p className="text-xs sm:text-sm text-blue-600">Total</p>
                            <p className="text-lg sm:text-xl font-bold text-green-600">
                              {safeToLocaleString(calculatedTotal)} FCFA
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {validEquipment.weekly_price > 0 && calculateDays(selectedStartDate, selectedEndDate) >= 7 && (
                      <Alert className="border-green-200 bg-green-50 mt-4">
                        <Calculator className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700 text-sm">
                          Prix hebdomadaire appliqué ! Vous économisez.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              )}

              {/* Étape 2: Contact */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="phone" className="text-sm">Numéro de téléphone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+229 XX XX XX XX"
                      value={reservationDetails.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="delivery" className="text-sm">Mode de livraison</Label>
                    <Select value={reservationDetails.deliveryMethod} onValueChange={(value) => handleInputChange('deliveryMethod', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pickup">Retrait sur place</SelectItem>
                        <SelectItem value="delivery">Livraison</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {reservationDetails.deliveryMethod === 'delivery' && (
                    <div>
                      <Label htmlFor="address" className="text-sm">Adresse de livraison</Label>
                      <Input
                        id="address"
                        placeholder="Votre adresse complète"
                        value={reservationDetails.deliveryAddress}
                        onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="requests" className="text-sm">Demandes spéciales (optionnel)</Label>
                    <textarea
                      id="requests"
                      className="w-full p-2 border border-gray-300 rounded-md mt-1 text-sm"
                      rows={3}
                      placeholder="Informations supplémentaires..."
                      value={reservationDetails.specialRequests}
                      onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Étape 3: Identité */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="identity-number" className="text-sm">Numéro de pièce d'identité *</Label>
                    <Input
                      id="identity-number"
                      placeholder="Numéro CNI, passeport..."
                      value={reservationDetails.identityNumber}
                      onChange={(e) => handleInputChange('identityNumber', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="identity-doc" className="text-sm">Document d'identité *</Label>
                    <div className="mt-2">
                      <input
                        id="identity-doc"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div 
                        onClick={() => document.getElementById('identity-doc')?.click()}
                        className={cn(
                          "border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-colors",
                          reservationDetails.identityDocument 
                            ? "border-green-300 bg-green-50" 
                            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                        )}
                      >
                        {reservationDetails.identityDocument ? (
                          <>
                            <CheckCircle className="h-6 w-6 text-green-600 mb-1 mx-auto" />
                            <p className="text-sm text-green-700 truncate px-2">
                              {reservationDetails.identityDocument.name}
                            </p>
                          </>
                        ) : (
                          <>
                            <Upload className="h-6 w-6 text-gray-400 mb-1 mx-auto" />
                            <p className="text-sm text-gray-600">Cliquez pour télécharger</p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG - Max 5MB</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Étape 4: Paiement KakiaPay */}
              {currentStep === 4 && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Paiement sécurisé</h3>
                    
                    {/* Info paiement */}
                    <Card className="bg-blue-50 border-blue-200 mb-4">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center mb-2">
                          <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                          <span className="text-sm font-medium text-blue-800">Paiement via KakiaPay</span>
                        </div>
                        <p className="text-xs text-blue-700">
                          Paiement sécurisé par carte bancaire, Mobile Money ou autres moyens de paiement.
                        </p>
                      </CardContent>
                    </Card>

                    {/* Conditions générales */}
                    <div className="flex items-start space-x-2 mb-4">
                      <Checkbox 
                        id="terms" 
                        checked={reservationDetails.acceptTerms}
                        onCheckedChange={(checked) => handleInputChange('acceptTerms', checked)}
                        className="mt-0.5"
                      />
                      <Label htmlFor="terms" className="text-sm leading-relaxed">
                        J'accepte les <span className="text-blue-600 underline cursor-pointer">conditions générales</span>
                      </Label>
                    </div>

                    {/* Widget KakiaPay */}
                    {reservationDetails.acceptTerms && !paymentCompleted && (
                      <div>
                        <Button
                          onClick={() => {
                            // Fermer le modal avant d'ouvrir KakiaPay
                            onClose();
                            // Petit délai pour s'assurer que le modal est fermé
                            setTimeout(() => {
                              // Ouvrir KakiaPay ici ou via un autre mécanisme
                              handleOpenKakiaPay();
                            }, 300);
                          }}
                          className="w-full"
                          size="lg"
                        >
                          <CreditCard className="mr-2 h-5 w-5" />
                          Payer {safeToLocaleString(feeCalculations.totalWithFees)} FCFA
                        </Button>
                      </div>
                    )}

                    {paymentCompleted && (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700 text-sm">
                          Paiement validé ! Création de votre réservation...
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              )}
              
              {/* Étape 5: Récapitulatif */}
              {currentStep === 5 && (
                <div className="space-y-4 sm:space-y-6">
                  <Card className="bg-gray-50">
                    <CardContent className="p-3 sm:p-4">
                      <h4 className="font-medium mb-3 text-sm sm:text-base">Récapitulatif</h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span>Équipement:</span>
                          <span className="font-medium text-right truncate ml-2">{validEquipment.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Période:</span>
                          <span className="text-right">
                            {safeFormatDate(selectedStartDate, 'short')} - {safeFormatDate(selectedEndDate, 'short')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Durée:</span>
                          <span>{calculateDays(selectedStartDate, selectedEndDate)} jour(s)</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-3 sm:p-4">
                      <h4 className="font-medium mb-3 text-sm sm:text-base">Détail des coûts</h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span>Coût de location:</span>
                          <span>{safeToLocaleString(feeCalculations.baseCost)} FCFA</span>
                        </div>
                        <div className="flex justify-between text-orange-600">
                          <span>Commission (5%):</span>
                          <span>+ {safeToLocaleString(feeCalculations.commissionAmount)} FCFA</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium text-sm sm:text-lg">
                          <span>Total payé:</span>
                          <span className="text-green-600">
                            {safeToLocaleString(feeCalculations.totalWithFees)} FCFA
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {isSubmitting && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <Clock className="h-4 w-4 text-blue-600 animate-spin" />
                      <AlertDescription className="text-blue-700 text-sm">
                        Création de votre réservation en cours...
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="shrink-0 p-3 sm:p-6 border-t bg-white">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={currentStep === 1 ? onClose : prevStep}
                disabled={isSubmitting}
                size="sm"
              >
                {currentStep === 1 ? 'Annuler' : 'Précédent'}
              </Button>
              
              {currentStep < 4 && (
                <Button onClick={nextStep} disabled={isSubmitting} size="sm">
                  Suivant
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ReservationModal;