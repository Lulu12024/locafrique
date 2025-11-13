// src/components/booking/ReservationModal.tsx
// VERSION FINALE: Bail mensuel + Location journalière

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, 
  Clock,
  Info,
  Zap,
  Upload,
  Calendar as CalendarIcon,
  Home
} from 'lucide-react';
import { useAuth } from '@/hooks/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { SingleDatePickerWithBlockedDates } from './SingleDatePickerWithBlockedDates';
import { isRoomCategory } from '@/types/supabase';

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
  
  // ✅ Détection du type
  const isRoom = equipment ? isRoomCategory(equipment.category) : false;
  const isMonthlyLease = isRoom && equipment?.price_type === 'monthly';
  const isDailyRental = !isMonthlyLease;
  
  const itemLabel = isRoom ? 'logement' : 'équipement';
  const ItemLabel = isRoom ? 'Logement' : 'Équipement';

  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(
    startDate ? new Date(startDate) : undefined
  );
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(
    endDate ? new Date(endDate) : undefined
  );

  const [bailDuration, setBailDuration] = useState<number>(1);

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

  const feeCalculations = useMemo(() => {
    if (!validEquipment?.daily_price) {
      return {
        baseCost: 0,
        numberOfDays: 0,
        numberOfMonths: 0,
        commissionAmount: 0,
        platformFee: 0,
        totalWithFees: 0
      };
    }

    // BAIL MENSUEL
    if (isMonthlyLease) {
      if (!selectedStartDate || !bailDuration) {
        return {
          baseCost: 0,
          numberOfDays: 0,
          numberOfMonths: 0,
          commissionAmount: 0,
          platformFee: 0,
          totalWithFees: 0
        };
      }

      const baseCost = validEquipment.daily_price * bailDuration;
      const commissionAmount = Math.round(baseCost * 0.05);
      const platformFee = 500;
      const totalWithFees = baseCost + commissionAmount + platformFee;

      return {
        baseCost,
        numberOfDays: bailDuration * 30,
        numberOfMonths: bailDuration,
        commissionAmount,
        platformFee,
        totalWithFees
      };
    }

    // LOCATION JOURNALIÈRE
    if (!selectedStartDate || !selectedEndDate) {
      return {
        baseCost: 0,
        numberOfDays: 0,
        numberOfMonths: 0,
        commissionAmount: 0,
        platformFee: 0,
        totalWithFees: 0
      };
    }

    const diffTime = Math.abs(selectedEndDate.getTime() - selectedStartDate.getTime());
    const numberOfDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    const baseCost = validEquipment.daily_price * numberOfDays;
    const commissionAmount = Math.round(baseCost * 0.05);
    const platformFee = 500;
    const totalWithFees = baseCost + commissionAmount + platformFee;

    return {
      baseCost,
      numberOfDays,
      numberOfMonths: 0,
      commissionAmount,
      platformFee,
      totalWithFees
    };
  }, [validEquipment, selectedStartDate, selectedEndDate, bailDuration, isMonthlyLease]);

  useEffect(() => {
    if (isMonthlyLease && selectedStartDate && bailDuration) {
      const endDate = new Date(selectedStartDate);
      endDate.setMonth(endDate.getMonth() + bailDuration);
      setSelectedEndDate(endDate);
    }
  }, [selectedStartDate, bailDuration, isMonthlyLease]);

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
    if (currentStep === 1) {
      if (!selectedStartDate) {
        toast({
          title: "Date de début requise",
          description: isMonthlyLease ? "Veuillez sélectionner la date de début du bail." : "Veuillez sélectionner une date de début.",
          variant: "destructive"
        });
        return;
      }

      if (isDailyRental) {
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
      }

      console.log('🔍 Validation des dates...');
      
      try {
        const { data: validation, error: validationError } = await supabase.functions.invoke(
          'validate-booking-dates',
          {
            body: {
              equipment_id: validEquipment.id,
              start_date: selectedStartDate.toISOString(),
              end_date: selectedEndDate!.toISOString(),
            }
          }
        );

        if (validationError) {
          console.error('❌ Erreur validation:', validationError);
          toast({
            title: "Erreur de validation",
            description: "Impossible de vérifier la disponibilité.",
            variant: "destructive"
          });
          return;
        }

        if (!validation?.valid) {
          console.log('❌ Dates non valides:', validation);
          toast({
            title: "Dates non disponibles",
            description: validation?.error || "Ces dates chevauchent une réservation existante.",
            variant: "destructive"
          });
          return;
        }

        console.log('✅ Dates validées');
      } catch (error) {
        console.error('❌ Erreur validation:', error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue.",
          variant: "destructive"
        });
        return;
      }
    } else if (currentStep === 2) {
      if (!reservationDetails.contactPhone) {
        toast({
          title: "Téléphone requis",
          variant: "destructive"
        });
        return;
      }
      if (reservationDetails.deliveryMethod === 'delivery' && !reservationDetails.deliveryAddress) {
        toast({
          title: "Adresse requise",
          variant: "destructive"
        });
        return;
      }
    } else if (currentStep === 3) {
      if (!reservationDetails.identityNumber) {
        toast({
          title: "Numéro d'identité requis",
          variant: "destructive"
        });
        return;
      }
    } else if (currentStep === 4) {
      if (!reservationDetails.acceptTerms) {
        toast({
          title: "Conditions requises",
          variant: "destructive"
        });
        return;
      }
      createBookingDirectly();
      return;
    }

    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const createBookingDirectly = async () => {
    if (!user?.id || !validEquipment.id) {
      toast({
        title: "Erreur",
        description: "Informations manquantes.",
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
          const fileName = `identity_${user.id}/${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('identity-documents')
            .upload(fileName, reservationDetails.identityDocument, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) throw uploadError;

          if (uploadData) {
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
        start_date: selectedStartDate!.toISOString(),
        end_date: selectedEndDate!.toISOString(),
        total_price: feeCalculations.baseCost,
        deposit_amount: validEquipment.deposit_amount,
        status: 'pending',
        payment_status: 'pending',
        payment_method: null,
        transaction_id: null,
        contact_phone: reservationDetails.contactPhone || '',
        delivery_method: reservationDetails.deliveryMethod || 'pickup',
        delivery_address: reservationDetails.deliveryAddress || null,
        special_requests: reservationDetails.specialRequests || null,
        commission_amount: feeCalculations.commissionAmount,
        platform_fee: feeCalculations.platformFee,
        identity_verified: true,
        identity_document_url: documentUrl,
        booking_type: isMonthlyLease ? 'lease' : 'rental'
      };

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (bookingError) throw bookingError;

      console.log('✅ Réservation créée:', booking.id);

      try {
        await supabase.functions.invoke('send-booking-notification-gmail', {
          body: { booking_id: booking.id }
        });
      } catch (emailError) {
        console.error('⚠️ Erreur email:', emailError);
      }

      toast({
        title: isMonthlyLease ? "🎉 Demande de bail créée !" : "🎉 Réservation créée !",
        description: "Le propriétaire a été notifié.",
        duration: 5000
      });

      onSuccess();
      onClose();

    } catch (error: any) {
      console.error('❌ Erreur:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-lg sm:max-w-2xl lg:max-w-4xl h-[92vh] p-0 flex flex-col">
        <div className="flex flex-col h-full">
          
          <div className="shrink-0">
            <DialogHeader>
              <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-3 sm:p-4 text-white">
                <DialogTitle className="text-base sm:text-xl font-bold flex items-center">
                  {isMonthlyLease ? <Home className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> : <Zap className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />}
                  {isMonthlyLease ? 'Demande de bail' : 'Réservation Express'}
                </DialogTitle>
                <p className="text-emerald-100 text-xs sm:text-sm mt-1 truncate">
                  {validEquipment.title}
                </p>
                
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    {[1, 2, 3, 4].map((step) => (
                      <div key={step} className="flex items-center">
                        <div className={cn(
                          "w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold",
                          currentStep >= step ? "bg-white text-emerald-600" : "bg-emerald-500/30 text-white"
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
                    <span className="text-white/90">{isMonthlyLease ? 'Bail' : 'Dates'}</span>
                    <span className="text-white/90">Contact</span>
                    <span className="text-white/90">ID</span>
                    <span className="text-white/90">OK</span>
                  </div>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 sm:px-6 sm:py-4">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    {isMonthlyLease ? 'Période du bail' : 'Sélectionner les dates'}
                  </h3>
                  
                  <Alert className="mb-6">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {isMonthlyLease 
                        ? "Sélectionnez la date de début et la durée de votre bail mensuel."
                        : "Les dates déjà réservées sont automatiquement bloquées."
                      }
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2 mb-4">
                    <Label htmlFor="start-date" className="text-sm font-medium">
                      {isMonthlyLease ? 'Date de début du bail' : 'Date de début'} <span className="text-red-500">*</span>
                    </Label>
                    <SingleDatePickerWithBlockedDates
                      equipmentId={validEquipment.id}
                      date={selectedStartDate}
                      setDate={(date) => {
                        setSelectedStartDate(date);
                        if (isDailyRental && date && selectedEndDate && selectedEndDate <= date) {
                          setSelectedEndDate(undefined);
                        }
                      }}
                      label={isMonthlyLease ? "Date de début du bail" : "Date de début"}
                      placeholder={isMonthlyLease ? "Date d'entrée" : "Sélectionner"}
                    />
                  </div>

                  {isMonthlyLease && (
                    <div className="space-y-2 mb-4">
                      <Label htmlFor="bail-duration" className="text-sm font-medium">
                        Durée du bail <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={bailDuration.toString()}
                        onValueChange={(value) => setBailDuration(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 mois</SelectItem>
                          <SelectItem value="3">3 mois</SelectItem>
                          <SelectItem value="6">6 mois</SelectItem>
                          <SelectItem value="12">12 mois</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {isDailyRental && (
                    <div className="space-y-2 mb-4">
                      <Label htmlFor="end-date" className="text-sm font-medium">
                        Date de fin <span className="text-red-500">*</span>
                      </Label>
                      <SingleDatePickerWithBlockedDates
                        equipmentId={validEquipment.id}
                        date={selectedEndDate}
                        setDate={setSelectedEndDate}
                        label="Date de fin"
                        placeholder="Sélectionner"
                        minDate={selectedStartDate}
                      />
                    </div>
                  )}

                  {selectedStartDate && selectedEndDate && (
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center mb-3">
                          <CalendarIcon className="h-5 w-5 text-green-600 mr-2" />
                          <span className="font-semibold text-green-800">
                            {isMonthlyLease ? 'Période du bail' : 'Période sélectionnée'}
                          </span>
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
                            <span className="font-semibold">Durée :</span>
                            <span className="font-bold text-base">
                              {isMonthlyLease 
                                ? `${feeCalculations.numberOfMonths} mois`
                                : `${feeCalculations.numberOfDays} jour${feeCalculations.numberOfDays > 1 ? 's' : ''}`
                              }
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
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-3">
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
                    <Label htmlFor="delivery">
                      {isRoom ? 'Mode de visite' : 'Récupération'} *
                    </Label>
                    <Select
                      value={reservationDetails.deliveryMethod}
                      onValueChange={(value) => handleInputChange('deliveryMethod', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pickup">
                          {isRoom ? 'Visite sur place' : 'Retrait sur place'}
                        </SelectItem>
                        <SelectItem value="delivery">
                          {isRoom ? 'Visite virtuelle' : 'Livraison'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {reservationDetails.deliveryMethod === 'delivery' && !isRoom && (
                    <div>
                      <Label htmlFor="address">Adresse *</Label>
                      <Input
                        id="address"
                        placeholder="Votre adresse"
                        value={reservationDetails.deliveryAddress}
                        onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="requests">
                      {isRoom ? 'Message' : 'Demandes'} (optionnel)
                    </Label>
                    <textarea
                      id="requests"
                      className="w-full mt-1 p-2 border rounded-md min-h-[100px]"
                      placeholder={isRoom ? "Présentez-vous..." : "Demandes particulières ?"}
                      value={reservationDetails.specialRequests}
                      onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold mb-4">Vérification d'identité</h3>
                
                <Alert className="mb-4 border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700 text-sm">
                    Pour votre sécurité, une pièce d'identité est demandée.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="idNumber">Numéro d'identité *</Label>
                    <Input
                      id="idNumber"
                      placeholder="Ex: CI123456789"
                      value={reservationDetails.identityNumber}
                      onChange={(e) => handleInputChange('identityNumber', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Document (optionnel)</Label>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="identity-upload"
                    />
                    <label htmlFor="identity-upload">
                      <div className={cn(
                        "mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer",
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
                            <p className="text-sm text-gray-600">Télécharger</p>
                            <p className="text-xs text-gray-500 mt-1">Max 5MB</p>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold mb-4">
                  {isMonthlyLease ? 'Confirmer la demande' : 'Confirmer'}
                </h3>
                
                <Card className="bg-amber-50 border-amber-200 mb-4">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center mb-2">
                      <Info className="h-5 w-5 text-amber-600 mr-2" />
                      <span className="text-sm font-medium text-amber-800">Paiement</span>
                    </div>
                    <p className="text-xs text-amber-700">
                      {isMonthlyLease 
                        ? "À la signature du bail"
                        : "Lors de la récupération"
                      }
                    </p>
                  </CardContent>
                </Card>

                <Card className="mb-4">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3">Récapitulatif</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{ItemLabel}</span>
                        <span className="font-medium">{validEquipment.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Période</span>
                        <span className="font-medium">
                          {isMonthlyLease 
                            ? `${feeCalculations.numberOfMonths} mois`
                            : `${feeCalculations.numberOfDays} jour${feeCalculations.numberOfDays > 1 ? 's' : ''}`
                          }
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
                        <span>Total</span>
                        <span>{safeToLocaleString(feeCalculations.totalWithFees)} FCFA</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-start space-x-2 mb-4">
                  <Checkbox 
                    id="terms" 
                    checked={reservationDetails.acceptTerms}
                    onCheckedChange={(checked) => handleInputChange('acceptTerms', checked)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed">
                    J'accepte les conditions générales
                  </Label>
                </div>

                <Button
                  onClick={nextStep}
                  disabled={!reservationDetails.acceptTerms || isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="mr-2 h-5 w-5 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      {isMonthlyLease ? 'Confirmer le bail' : 'Confirmer'}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

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
                  className={cn("flex-1 text-sm h-10", currentStep === 1 && "ml-auto")}
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

export default ReservationModal;