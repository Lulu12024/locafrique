// src/components/booking/ReservationModal.tsx
// VERSION SANS PAIEMENT : Le paiement KakiaPay est commenté, réservation directe sans payer
// Pour réactiver le paiement : décommenter les sections marquées /* PAIEMENT */

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
  // CreditCard, /* PAIEMENT */
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
import { DateRangePickerWithBlockedDates } from './DateRangePickerWithBlockedDates';
import { SingleDatePickerWithBlockedDates } from './SingleDatePickerWithBlockedDates';
// import { KkiaPayWidget } from '@/components/KkiaPayWidget'; /* PAIEMENT */

/* PAIEMENT - Déclarations TypeScript pour KakiaPay
declare global {
  interface Window {
    openKkiapayWidget: (config: any) => void;
    addKkiapayListener: (event: string, callback: (response: any) => void) => void;
    removeKkiapayListener: (event: string, callback: (response: any) => void) => void;
  }
}
*/

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  equipment: any;
  startDate?: Date | string;
  endDate?: Date | string;
  total?: number;
}

function ReservationModal({
  isOpen,
  onClose,
  onSuccess,
  equipment,
  startDate,
  endDate,
  total
}: ReservationModalProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // États pour les dates
  // const [selectedStartDate, setSelectedStartDate] = useState<Date>(
  //   startDate ? new Date(startDate) : new Date()
  // );
  // const [selectedEndDate, setSelectedEndDate] = useState<Date>(
  //   endDate ? new Date(endDate) : new Date()
  // );
  // const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  // const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  // const [selectedDateRange, setSelectedDateRange] = useState<{from: Date | undefined, to: Date | undefined}>(() => {
  //   const today = new Date();
  //   const tomorrow = new Date(today);
  //   tomorrow.setDate(tomorrow.getDate() + 1);
    
  //   return {
  //     from: startDate ? new Date(startDate) : undefined,
  //     to: endDate ? new Date(endDate) : undefined
  //   };
  // });
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(
    startDate ? new Date(startDate) : undefined
  );
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(
    endDate ? new Date(endDate) : undefined
  );
  /* PAIEMENT - États pour le paiement
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [kakiaPayTransactionId, setKakiaPayTransactionId] = useState<string>('');
  */

  const [reservationDetails, setReservationDetails] = useState({
    contactPhone: '',
    deliveryMethod: 'pickup',
    deliveryAddress: '',
    specialRequests: '',
    identityNumber: '',
    identityDocument: null as File | null,
    acceptTerms: false
  });

  const validEquipment = useMemo(() => equipment, [equipment]);

  // Calcul des prix
  const feeCalculations = useMemo(() => {
    if (!validEquipment?.daily_price) {
      return {
        baseCost: 0,
        numberOfDays: 0,
        commissionAmount: 0,
        platformFee: 0,
        totalWithFees: 0
      };
    }

    if (!selectedStartDate || !selectedEndDate) {
    return {
      baseCost: 0,
      numberOfDays: 0,
      commissionAmount: 0,
      platformFee: 0,
      totalWithFees: 0
    };
  }

    const start = selectedStartDate;
    const end = selectedEndDate;

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const numberOfDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    const baseCost = validEquipment.daily_price * numberOfDays;
    const commissionAmount = Math.round(baseCost * 0.05);
    const platformFee = 500;
    const totalWithFees = baseCost + commissionAmount + platformFee;

    return {
      baseCost,
      numberOfDays,
      commissionAmount,
      platformFee,
      totalWithFees
    };
  }, [validEquipment, selectedStartDate, selectedEndDate]);

  // Fonctions utilitaires
  const safeFormatDate = (date: Date | string | undefined, format: 'short' | 'long' = 'short') => {
    if (!date) return 'Date non définie';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (format === 'long') {
        return dateObj.toLocaleDateString('fr-FR', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      return dateObj.toLocaleDateString('fr-FR');
    } catch {
      return 'Date invalide';
    }
  };

  const safeToLocaleString = (value: number | undefined) => {
    return value?.toLocaleString() || '0';
  };

  const handleInputChange = (field: string, value: any) => {
    setReservationDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille maximale est de 5MB.",
          variant: "destructive"
        });
        return;
      }
      handleInputChange('identityDocument', file);
    }
  };

  const nextStep = async () => {
    // Validations
    if (currentStep === 1) {
      if (!selectedStartDate) {
        toast({
          title: "Date de début requise",
          description: "Veuillez sélectionner une date de début.",
          variant: "destructive"
        });
        return;
      }

      if (!selectedEndDate) {
        toast({
          title: "Date de fin requise",
          description: "Veuillez sélectionner une date de fin.",
          variant: "destructive"
        });
        return;
      }

      if (selectedEndDate <= selectedStartDate) {
        toast({
          title: "Dates invalides",
          description: "La date de fin doit être après la date de début.",
          variant: "destructive"
        });
        return;
      }

      // ✅ AJOUTER CETTE VALIDATION BACKEND
      console.log('🔍 Validation des dates auprès du serveur...');
      
      try {
        const { data: validation, error: validationError } = await supabase.functions.invoke(
          'validate-booking-dates',
          {
            body: {
              equipment_id: validEquipment.id,
              start_date: selectedStartDate.toISOString(),
            end_date: selectedEndDate.toISOString(),
            }
          }
        );

        if (validationError) {
          console.error('❌ Erreur validation:', validationError);
          toast({
            title: "Erreur de validation",
            description: "Impossible de vérifier la disponibilité. Veuillez réessayer.",
            variant: "destructive"
          });
          return;
        }

        if (!validation?.valid) {
          console.log('❌ Dates non valides:', validation);
          toast({
            title: "Dates non disponibles",
            description: validation?.error || "Ces dates chevauchent une réservation existante. Veuillez choisir d'autres dates.",
            variant: "destructive"
          });
          return;
        }

        console.log('✅ Dates validées avec succès');
      } catch (error) {
        console.error('❌ Erreur lors de la validation:', error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la validation des dates.",
          variant: "destructive"
        });
        return;
      }
    } else if (currentStep === 2) {
      if (!reservationDetails.contactPhone) {
        toast({
          title: "Téléphone requis",
          description: "Veuillez fournir un numéro de téléphone.",
          variant: "destructive"
        });
        return;
      }
      if (reservationDetails.deliveryMethod === 'delivery' && !reservationDetails.deliveryAddress) {
        toast({
          title: "Adresse requise",
          description: "Veuillez fournir une adresse de livraison.",
          variant: "destructive"
        });
        return;
      }
    } else if (currentStep === 3) {
      if (!reservationDetails.identityNumber) {
        toast({
          title: "Numéro d'identité requis",
          description: "Veuillez fournir votre numéro d'identité.",
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
      // ✅ SANS PAIEMENT : Créer directement la réservation
      createBookingDirectly();
      return;
    }

    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  /* PAIEMENT - Fonction pour ouvrir KakiaPay
  const handleOpenKakiaPay = () => {
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

  const handleKakiaPaySuccess = async (response: any) => {
    console.log('✅ Paiement KakiaPay réussi:', response);
    setPaymentCompleted(true);
    setKakiaPayTransactionId(response.transactionId || response.transaction_id);
    toast({
      title: "✅ Paiement validé !",
      description: "Création de votre réservation en cours...",
    });
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
  */ // FIN PAIEMENT

  // ✅ SANS PAIEMENT : Création directe de la réservation
  const createBookingDirectly = async () => {
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
          // ✅ Format correct pour RLS: identity_USER_ID/filename
          const fileName = `identity_${user.id}/${Date.now()}.${fileExt}`;
          
          console.log('📤 Upload document identité:', fileName);
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('identity-documents')
            .upload(fileName, reservationDetails.identityDocument, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('❌ Erreur upload:', uploadError);
            throw uploadError;
          }

          if (uploadData) {
            const { data: publicUrlData } = supabase.storage
              .from('identity-documents')
              .getPublicUrl(uploadData.path);
            documentUrl = publicUrlData.publicUrl;
            console.log('✅ Document uploadé:', documentUrl);
          }
        } catch (uploadErr) {
          console.error("❌ Exception upload:", uploadErr);
          toast({
            title: "Erreur upload",
            description: "Impossible d'uploader le document. Continuons sans.",
            variant: "destructive"
          });
        }
      }

      // ✅ Créer la réservation SANS PAIEMENT
      const bookingData = {
        equipment_id: validEquipment.id,
        renter_id: user.id,
        // start_date: selectedStartDate.toISOString().split('T')[0],
        // end_date: selectedEndDate.toISOString().split('T')[0],
        start_date: selectedStartDate.toISOString(),
        end_date: selectedEndDate.toISOString(),
        total_price: feeCalculations.baseCost,
        deposit_amount: validEquipment.deposit_amount,
        status: 'pending', // En attente de validation du propriétaire
        payment_status: 'pending', // ✅ SANS PAIEMENT : 'pending' au lieu de 'paid'
        payment_method: null, // ✅ Pas de méthode de paiement pour le moment
        transaction_id: null, // ✅ Pas de transaction
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

      console.log('✅ Réservation créée sans paiement:', booking.id);

      // ✅ La notification est maintenant créée dans l'Edge Function (contourne RLS)
      // Pas besoin de créer la notification ici

      // Envoyer l'email au propriétaire (qui créera aussi la notification)
      try {
        console.log('📧 Envoi email au propriétaire...');
        
        const { data: emailResult, error: emailError } = await supabase.functions.invoke(
          'send-booking-notification-gmail',
          {
            body: { booking_id: booking.id }
          }
        );

        if (emailError) {
          console.error('⚠️ Erreur envoi email:', emailError);
        } else if (emailResult?.success) {
          console.log('✅ Email envoyé avec succès au propriétaire');
        }
      } catch (emailError: any) {
        console.error('⚠️ Exception lors de l\'envoi email:', emailError.message);
      }

      toast({
        title: "🎉 Réservation créée !",
        description: "Le propriétaire a été notifié. Vous serez contacté pour le paiement.",
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

  /* PAIEMENT - Création de réservation APRÈS paiement
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

      const bookingData = {
        equipment_id: validEquipment.id,
        renter_id: user.id,
        start_date: selectedStartDate.toISOString().split('T')[0],
        end_date: selectedEndDate.toISOString().split('T')[0],
        total_price: feeCalculations.baseCost,
        deposit_amount: validEquipment.deposit_amount,
        status: 'pending',
        payment_status: 'paid', // Payé via KakiaPay
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

      console.log('✅ Réservation créée avec paiement:', booking.id);

      await supabase.from('notifications').insert({
        user_id: validEquipment.owner_id,
        type: 'new_booking',
        title: '🔔 Nouvelle réservation payée',
        message: `${user.email} a réservé "${validEquipment.title}" pour ${safeToLocaleString(feeCalculations.baseCost)} FCFA. Paiement confirmé.`,
        booking_id: booking.id
      });

      try {
        const { data: emailResult, error: emailError } = await supabase.functions.invoke(
          'send-booking-notification-gmail',
          {
            body: { booking_id: booking.id }
          }
        );

        if (emailError) {
          console.error('⚠️ Erreur envoi email:', emailError);
        } else if (emailResult?.success) {
          console.log('✅ Email envoyé au propriétaire');
        }
      } catch (emailError: any) {
        console.error('⚠️ Exception email:', emailError.message);
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
        description: error.message || "Une erreur est survenue.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  */ // FIN PAIEMENT

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent 
        className="w-[95vw] max-w-lg sm:max-w-2xl lg:max-w-4xl h-[92vh] p-0 flex flex-col"
      >
        <div className="flex flex-col h-full">
          
          {/* Header - Fixed - 20% */}
          <div className="shrink-0">
            <DialogHeader>
              <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-3 sm:p-4 text-white">
                <DialogTitle className="text-base sm:text-xl font-bold flex items-center">
                  <Zap className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Réservation Express
                </DialogTitle>
                <p className="text-emerald-100 text-xs sm:text-sm mt-1 truncate">
                  {validEquipment.title}
                </p>
                
                {/* Indicateur de progression - COMPACT */}
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    {[1, 2, 3, 4].map((step) => (
                      <div key={step} className="flex items-center">
                        <div className={cn(
                          "w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold",
                          currentStep >= step 
                            ? "bg-white text-emerald-600" 
                            : "bg-emerald-500/30 text-white"
                        )}>
                          {step}
                        </div>
                        {step < 4 && (
                          <div className={cn(
                            "h-0.5 w-4 sm:w-12 mx-0.5 sm:mx-1",
                            currentStep > step ? "bg-white" : "bg-emerald-500/30"
                          )} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] sm:text-xs">
                    <span className="text-white/90">Dates</span>
                    <span className="text-white/90">Contact</span>
                    <span className="text-white/90">ID</span>
                    <span className="text-white/90">OK</span>
                  </div>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 sm:px-6 sm:py-4">
            {/* Étape 1: Sélection des dates */}
            {/* {currentStep === 1 && (
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Sélectionnez vos dates</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Date de début</Label>
                      <Popover 
                        open={isStartDateOpen} 
                        onOpenChange={setIsStartDateOpen}
                        modal={true}  // ✅ AJOUT
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {safeFormatDate(selectedStartDate)}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent 
                          className="w-auto p-0 z-[9999]"  // ✅ z-index très élevé
                          align="start"
                          onInteractOutside={(e) => {
                            // ✅ Empêcher la fermeture automatique
                            e.preventDefault();
                          }}
                        >
                          <Calendar
                            mode="single"
                            selected={selectedStartDate}
                            onSelect={(date) => {
                              if (date) {
                                setSelectedStartDate(date);
                                setIsStartDateOpen(false);  // Fermer manuellement
                              }
                            }}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>


                    <div>
                      <Label className="text-sm font-medium mb-2 block">Date de fin</Label>
                      <Popover 
                        open={isEndDateOpen} 
                        onOpenChange={setIsEndDateOpen}
                        modal={true}  // ✅ AJOUT
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {safeFormatDate(selectedEndDate)}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent 
                          className="w-auto p-0 z-[9999]"  // ✅ z-index très élevé
                          align="start"
                          onInteractOutside={(e) => {
                            // ✅ Empêcher la fermeture automatique
                            e.preventDefault();
                          }}
                        >
                          <Calendar
                            mode="single"
                            selected={selectedEndDate}
                            onSelect={(date) => {
                              if (date) {
                                setSelectedEndDate(date);
                                setIsEndDateOpen(false);  // Fermer manuellement
                              }
                            }}
                            disabled={(date) => date <= selectedStartDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <Card className="mt-4 sm:mt-6 bg-gradient-to-br from-blue-50 to-emerald-50 border-blue-200">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center mb-2 sm:mb-3">
                        <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2" />
                        <h4 className="font-semibold text-sm sm:text-base text-blue-900">
                          Estimation des coûts
                        </h4>
                      </div>
                      
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span>Prix journalier</span>
                          <span className="font-medium">{safeToLocaleString(validEquipment.daily_price)} FCFA</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Nombre de jours</span>
                          <span className="font-medium">{feeCalculations.numberOfDays}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold text-blue-700">
                          <span>Sous-total</span>
                          <span>{safeToLocaleString(feeCalculations.baseCost)} FCFA</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Commission plateforme (5%)</span>
                          <span>{safeToLocaleString(feeCalculations.commissionAmount)} FCFA</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Frais de service</span>
                          <span>{safeToLocaleString(feeCalculations.platformFee)} FCFA</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-base font-bold text-emerald-700">
                          <span>Total</span>
                          <span>{safeToLocaleString(feeCalculations.totalWithFees)} FCFA</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )} */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Sélectionner les dates</h3>
                  
                  {/* Message informatif */}
                  <Alert className="mb-6">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Les dates déjà réservées sont automatiquement bloquées. 
                      Vous ne pouvez pas sélectionner des dates qui chevauchent une réservation existante.
                    </AlertDescription>
                  </Alert>

                  {/* Champ 1 : Date de début */}
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="start-date" className="text-sm font-medium">
                      Date de début <span className="text-red-500">*</span>
                    </Label>
                    <SingleDatePickerWithBlockedDates
                      equipmentId={validEquipment.id}
                      date={selectedStartDate}
                      setDate={(date) => {
                        console.log('📅 Date de début sélectionnée:', date);
                        setSelectedStartDate(date);
                        // Si la date de fin est avant la nouvelle date de début, la réinitialiser
                        if (date && selectedEndDate && selectedEndDate <= date) {
                          setSelectedEndDate(undefined);
                          toast({
                            title: "Date de fin réinitialisée",
                            description: "La date de fin doit être après la date de début.",
                          });
                        }
                      }}
                      label="Date de début"
                      placeholder="Sélectionner la date de début"
                    />
                  </div>

                  {/* Champ 2 : Date de fin */}
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="end-date" className="text-sm font-medium">
                      Date de fin <span className="text-red-500">*</span>
                    </Label>
                    <SingleDatePickerWithBlockedDates
                      equipmentId={validEquipment.id}
                      date={selectedEndDate}
                      setDate={(date) => {
                        console.log('📅 Date de fin sélectionnée:', date);
                        setSelectedEndDate(date);
                      }}
                      label="Date de fin"
                      placeholder="Sélectionner la date de fin"
                      minDate={selectedStartDate} // ✅ La date de fin doit être après la date de début
                    />
                    {selectedStartDate && !selectedEndDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Sélectionnez une date après le {safeFormatDate(selectedStartDate)}
                      </p>
                    )}
                  </div>

                  {/* Affichage de la période sélectionnée */}
                  {selectedStartDate && selectedEndDate && (
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center mb-3">
                          <CalendarIcon className="h-5 w-5 text-green-600 mr-2" />
                          <span className="font-semibold text-green-800">Période sélectionnée</span>
                        </div>
                        <div className="space-y-2 text-sm text-green-700">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Début :</span>
                            <span className="font-medium">{safeFormatDate(selectedStartDate, 'long')}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Fin :</span>
                            <span className="font-medium">{safeFormatDate(selectedEndDate, 'long')}</span>
                          </div>
                          <Separator className="my-2 bg-green-200" />
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">Durée totale :</span>
                            <span className="font-bold text-base">
                              {feeCalculations.numberOfDays} jour{feeCalculations.numberOfDays > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-green-200">
                            <span className="font-semibold">Prix estimé :</span>
                            <span className="font-bold text-lg text-green-700">
                              {safeToLocaleString(feeCalculations.totalWithFees)} FCFA
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Message d'aide */}
                  {!selectedStartDate && (
                    <Alert variant="default" className="mt-4">
                      <CalendarIcon className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Commencez par sélectionner une date de début
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}

            {/* Étape 2: Informations de contact */}
            {currentStep === 2 && (
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Informations de contact</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="phone">Numéro de téléphone *</Label>
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
                      <Label htmlFor="delivery">Méthode de récupération *</Label>
                      <Select
                        value={reservationDetails.deliveryMethod}
                        onValueChange={(value) => handleInputChange('deliveryMethod', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pickup">Récupération sur place</SelectItem>
                          <SelectItem value="delivery">Livraison</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {reservationDetails.deliveryMethod === 'delivery' && (
                      <div>
                        <Label htmlFor="address">Adresse de livraison *</Label>
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
                      <Label htmlFor="requests">Demandes spéciales (optionnel)</Label>
                      <textarea
                        id="requests"
                        className="w-full mt-1 p-2 border rounded-md min-h-[100px]"
                        placeholder="Avez-vous des demandes particulières ?"
                        value={reservationDetails.specialRequests}
                        onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Étape 3: Vérification d'identité */}
            {currentStep === 3 && (
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Vérification d'identité</h3>
                  
                  <Alert className="mb-4 border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700 text-sm">
                      Pour votre sécurité et celle du propriétaire, nous demandons une pièce d'identité.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="idNumber">Numéro de pièce d'identité *</Label>
                      <Input
                        id="idNumber"
                        placeholder="Ex: CI123456789"
                        value={reservationDetails.identityNumber}
                        onChange={(e) => handleInputChange('identityNumber', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Document d'identité (optionnel)</Label>
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="identity-upload"
                      />
                      <label htmlFor="identity-upload">
                        <div className={cn(
                          "mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all",
                          reservationDetails.identityDocument
                            ? "border-green-300 bg-green-50" 
                            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                        )}>
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
                              <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF - Max 5MB</p>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Étape 4: Confirmation (SANS PAIEMENT) */}
            {currentStep === 4 && (
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Confirmer la réservation</h3>
                  
                  {/* Info sans paiement */}
                  <Card className="bg-amber-50 border-amber-200 mb-4">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center mb-2">
                        <Info className="h-5 w-5 text-amber-600 mr-2" />
                        <span className="text-sm font-medium text-amber-800">Paiement à la livraison</span>
                      </div>
                      <p className="text-xs text-amber-700">
                        Le paiement sera effectué directement auprès du propriétaire lors de la récupération de l'équipement.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Récapitulatif */}
                  <Card className="mb-4">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3">Récapitulatif</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Équipement</span>
                          <span className="font-medium">{validEquipment.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Période</span>
                          <span className="font-medium">
                            {feeCalculations.numberOfDays} jour{feeCalculations.numberOfDays > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Du</span>
                          <span className="font-medium">{safeFormatDate(selectedStartDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Au</span>
                          <span className="font-medium">{safeFormatDate(selectedEndDate)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between text-base font-bold text-emerald-700">
                          <span>Montant total</span>
                          <span>{safeToLocaleString(feeCalculations.totalWithFees)} FCFA</span>
                        </div>
                        <p className="text-xs text-amber-600 mt-2">
                          💡 À régler au propriétaire lors de la remise du matériel
                        </p>
                      </div>
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
                        J'accepte les <span className="text-blue-600 underline cursor-pointer">conditions générales</span> et je m'engage à payer le montant convenu lors de la récupération
                      </Label>
                    </div>

                    {/* Bouton de confirmation */}
                    <Button
                      onClick={nextStep}
                      disabled={!reservationDetails.acceptTerms || isSubmitting}
                      className="w-full"
                      size="lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Clock className="mr-2 h-5 w-5 animate-spin" />
                          Création en cours...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-5 w-5" />
                          Confirmer la réservation
                        </>
                      )}
                    </Button>
                  </div>

                  {/* PAIEMENT - Widget KakiaPay commenté */}
                  {/* 
                  {reservationDetails.acceptTerms && !paymentCompleted && (
                    <div>
                      <Button
                        onClick={() => {
                          onClose();
                          setTimeout(() => {
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
                  */}
                </div>
            )}
          </div>

          {/* Footer avec boutons */}
          <div className="shrink-0 border-t bg-white p-3 sm:p-4">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button
                  onClick={prevStep}
                  variant="outline"
                  disabled={isSubmitting}
                  className="flex-1 text-sm h-10"
                  size="sm"
                >
                  Précédent
                </Button>
              )}
              
              {currentStep < 4 && (
                <Button
                  onClick={nextStep}
                  disabled={isSubmitting}
                  className={cn(
                    "flex-1 text-sm h-10",
                    currentStep === 1 && "ml-auto"
                  )}
                  size="sm"
                >
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

// Export par défaut pour compatibilité avec les imports existants
export default ReservationModal;