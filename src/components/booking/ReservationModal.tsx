// src/components/booking/ReservationModal.tsx
// VERSION RESPONSIVE MOBILE - Indicateur horizontal

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  Wallet, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  CreditCard,
  Plus,
  Info,
  Zap,
  Phone,
  Upload,
  User,
  MapPin,
  MessageSquare,
  DollarSign,
  Calendar as CalendarIcon,
  Calculator
} from 'lucide-react';
import { useAuth } from '@/hooks/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { KkiaPayWidget } from '@/components/KkiaPayWidget';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  equipment: any;
  startDate?: Date | string;
  endDate?: Date | string;
  total?: number;
}

// Fonctions utilitaires (inchangées)
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
  total: initialTotal
}: ReservationModalProps) {
  const { user } = useAuth();
  
  if (!isOpen) {
    return null;
  }
  
  // Validation de l'équipement avec valeurs par défaut
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

  // États pour les dates sélectionnées
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
  const [walletBalance, setWalletBalance] = useState(0);
  const [modalMode, setModalMode] = useState<'reservation' | 'recharge'>('reservation');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);
  
  // États pour la recharge
  const [rechargeAmount, setRechargeAmount] = useState('');
  
  const quickAmounts = [10000, 25000, 50000, 100000, 200000];
  
  const feeCalculations = useMemo(() => {
    const baseCost = calculatedTotal;
    const commissionAmount = Math.round(baseCost * 0.05);
    const platformFee = Math.round(baseCost * 0.02);
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
    paymentMethod: 'wallet',
    acceptTerms: false
  });

  // Charger le solde du portefeuille
  useEffect(() => {
    if (user && isOpen) {
      loadWalletBalance();
    }
  }, [user, isOpen]);

  const loadWalletBalance = async () => {
    if (!user?.id) {
      setWalletBalance(0);
      return;
    }

    try {
      await supabase.rpc('ensure_user_wallet', { p_user_id: user.id });
      
      const { data: wallet, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Erreur chargement portefeuille:', error);
        setWalletBalance(0);
      } else {
        const balance = Number(wallet?.balance) || 0;
        setWalletBalance(balance);
      }
    } catch (error) {
      console.error('Erreur chargement portefeuille:', error);
      setWalletBalance(0);
    }
  };

  const isSufficientBalance = walletBalance >= feeCalculations.totalWithFees;

  // Gestionnaires pour le widget KkiaPay
  const handleRechargeSuccess = (response: any) => {
    console.log('✅ Recharge réussie:', response);
    loadWalletBalance();
    setModalMode('reservation');
    setRechargeAmount('');
    
    toast({
      title: "Recharge réussie !",
      description: `Votre portefeuille a été rechargé de ${response.amount?.toLocaleString()} FCFA`,
    });
  };

  const handleRechargeError = (error: any) => {
    console.error('❌ Erreur recharge:', error);
    toast({
      title: "Erreur recharge",
      description: error.message || "Une erreur s'est produite lors de la recharge",
      variant: "destructive"
    });
  };

  const handleRechargeCancel = () => {
    console.log('🚫 Recharge annulée par l\'utilisateur');
    toast({
      title: "Paiement annulé",
      description: "Le paiement a été annulé",
    });
  };

  const handleQuickAmount = (amount: number) => {
    setRechargeAmount(amount.toString());
  };

  const formatRechargeAmount = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    const number = parseInt(numericValue) || 0;
    return number.toLocaleString('fr-FR');
  };

  const handleRechargeAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setRechargeAmount(value);
  };

  // Gestion des changements d'input
  const handleInputChange = (field: string, value: any) => {
    setReservationDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Gestion des dates - VERSION SIMPLIFIÉE POUR PRODUCTION
  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      console.log('Date de début sélectionnée:', date);
      setSelectedStartDate(date);
      
      // Si la date de fin est antérieure ou égale à la nouvelle date de début, l'ajuster
      if (selectedEndDate <= date) {
        const newEndDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
        setSelectedEndDate(newEndDate);
        console.log('Date de fin ajustée à:', newEndDate);
      }
      
      // Fermeture simple et directe
      setIsStartDateOpen(false);
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date && date > selectedStartDate) {
      console.log('Date de fin sélectionnée:', date);
      setSelectedEndDate(date);
      
      // Fermeture simple et directe
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

  // Fonction de soumission (code existant adapté)
  const handleReservationSubmit = async () => {
    if (!user?.id || !validEquipment.id || calculatedTotal <= 0) {
      toast({
        title: "Erreur",
        description: "Informations manquantes pour la réservation.",
        variant: "destructive"
      });
      return;
    }

    const baseCost = calculatedTotal;
    const commissionAmount = Math.round(baseCost * 0.05);
    const platformFee = Math.round(baseCost * 0.02);
    const totalWithFees = baseCost + commissionAmount + platformFee;

    if (paymentMethod === 'wallet' && walletBalance < totalWithFees) {
      toast({
        title: "Solde insuffisant",
        description: `Il vous manque ${safeToLocaleString(totalWithFees - walletBalance)} FCFA.`,
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
        total_price: baseCost,
        deposit_amount: validEquipment.deposit_amount,
        status: 'pending',
        payment_status: paymentMethod === 'wallet' ? 'paid' : 'pending',
        payment_method: paymentMethod,
        contact_phone: reservationDetails.contactPhone || '',
        delivery_method: reservationDetails.deliveryMethod || 'pickup',
        delivery_address: reservationDetails.deliveryAddress || null,
        special_requests: reservationDetails.specialRequests || null,
        automatic_validation: false,
        commission_amount: commissionAmount,
        platform_fee: platformFee,
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

      // Déduction du portefeuille
      if (paymentMethod === 'wallet' && totalWithFees > 0) {
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('id, balance, user_id')
          .eq('user_id', user.id)
          .single();

        if (walletError || !walletData?.id) {
          await supabase.from('bookings').delete().eq('id', booking.id);
          throw new Error(`Portefeuille introuvable: ${walletError?.message || 'ID manquant'}`);
        }

        const rpcParams = {
          p_wallet_id: walletData.id,
          p_amount: totalWithFees,
          p_transaction_type: 'debit',
          p_description: `Réservation ${validEquipment.title} (${safeToLocaleString(baseCost)} + frais ${safeToLocaleString(commissionAmount + platformFee)}) - En attente d'approbation`,
          p_reference_id: booking.id,
          p_booking_id: booking.id
        };

        const { data: transactionData, error: transactionError } = await supabase.rpc(
          'create_wallet_transaction_secure',
          rpcParams
        );

        if (transactionError) {
          await supabase.from('bookings').delete().eq('id', booking.id);
          throw new Error(`Erreur RPC: ${transactionError.message}`);
        }

        if (!transactionData || transactionData.success === false) {
          await supabase.from('bookings').delete().eq('id', booking.id);
          throw new Error(`Erreur: ${transactionData?.error || 'Transaction échouée'}`);
        }

        await loadWalletBalance();
      }

      // Notifications
      if (validEquipment.owner_id && user.email) {
        const notifications = [
          {
            user_id: validEquipment.owner_id,
            type: 'new_booking_request',
            title: '📋 Nouvelle demande de réservation',
            message: `${user.email} souhaite réserver "${validEquipment.title}" du ${safeFormatDate(selectedStartDate, 'long')} au ${safeFormatDate(selectedEndDate, 'long')} pour ${safeToLocaleString(baseCost)} FCFA (+ frais ${safeToLocaleString(commissionAmount + platformFee)} FCFA).`,
            booking_id: booking.id
          },
          {
            user_id: user.id,
            type: 'booking_pending_approval',
            title: '⏳ Réservation en attente',
            message: `Votre demande de réservation pour "${validEquipment.title}" a été envoyée au propriétaire.`,
            booking_id: booking.id
          }
        ];

        await supabase.from('notifications').insert(notifications);
      }

      toast({
        title: "🎉 Demande envoyée !",
        description: paymentMethod === 'wallet' 
          ? `Montant débité: ${safeToLocaleString(totalWithFees)} FCFA (location + frais) • En attente d'approbation`
          : "Votre demande a été envoyée au propriétaire pour approbation",
        duration: 5000
      });

      onSuccess();
      onClose();

    } catch (error: any) {
      toast({
        title: "Erreur de réservation",
        description: error.message || "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const rechargeAmountNumber = parseInt(rechargeAmount) || 0;

  return (
    <>
      {/* Modal principal de réservation - RESPONSIVE */}
      {modalMode === 'reservation' && (
        <Dialog open={isOpen} onOpenChange={(open) => {
          // Empêcher la fermeture automatique si un calendrier est ouvert
          if (!open && (isStartDateOpen || isEndDateOpen)) {
            return;
          }
          onClose();
        }}>
          <DialogContent 
            className="w-full max-w-lg sm:max-w-2xl lg:max-w-4xl h-[95vh] sm:h-auto max-h-[95vh] p-0 overflow-hidden"
            onPointerDownOutside={(e) => {
              // Empêcher la fermeture si on clique sur un calendrier
              const target = e.target as HTMLElement;
              if (target.closest('[data-radix-calendar]') || target.closest('[data-radix-popover-content]')) {
                e.preventDefault();
              }
            }}
            onInteractOutside={(e) => {
              // Empêcher la fermeture si on interagit avec un calendrier
              const target = e.target as HTMLElement;
              if (target.closest('[data-radix-calendar]') || target.closest('[data-radix-popover-content]')) {
                e.preventDefault();
              }
            }}
          >
            <div className="flex flex-col h-full">
              <DialogHeader className="shrink-0">
                <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-4 sm:p-6 text-white">
                  <DialogTitle className="text-lg sm:text-2xl font-bold flex items-center">
                    <Zap className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                    Réservation Express
                  </DialogTitle>
                  <p className="text-emerald-100 text-xs sm:text-sm mt-1 truncate">{validEquipment.title}</p>
                  
                  {/* Indicateur de progression horizontal responsive - CORRIGÉ */}
                  <div className="mt-4 sm:mt-6">
                    <div className="flex items-center justify-between">
                      {[1, 2, 3, 4, 5].map((step) => (
                        <div key={step} className="flex items-center">
                          <div className={cn(
                            "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all",
                            currentStep >= step 
                              ? "bg-white text-emerald-600 shadow-lg" 
                              : "bg-emerald-400 text-white"
                          )}>
                            {currentStep > step ? <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6" /> : step}
                          </div>
                          {step < 5 && (
                            <div className={cn(
                              "w-6 sm:w-12 lg:w-16 h-1 mx-1 sm:mx-2 transition-all",
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
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {/* Étape 1: Sélection des dates */}
                  {currentStep === 1 && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-4">Choisissez vos dates</h3>
                        
                        {/* Sélecteurs de dates - Stack sur mobile */}
                        <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0 mb-6">
                          {/* Date de début */}
                          <div className="space-y-2">
                            <Label className="text-sm">Date de début</Label>
                            <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal text-sm"
                                  onClick={() => setIsStartDateOpen(true)}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  <span className="truncate">{safeFormatDate(selectedStartDate, 'long')}</span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent 
                                className="w-auto p-0 z-[10000]" 
                                align="start"
                                side="bottom"
                                sideOffset={4}
                              >
                                <Calendar
                                  mode="single"
                                  selected={selectedStartDate}
                                  onSelect={handleStartDateChange}
                                  onDayClick={(date) => {
                                    console.log('OnDayClick - Date de début:', date);
                                    handleStartDateChange(date);
                                  }}
                                  disabled={(date) => {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    return date < today;
                                  }}
                                  initialFocus
                                  locale={undefined}
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
                                  onClick={() => setIsEndDateOpen(true)}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  <span className="truncate">{safeFormatDate(selectedEndDate, 'long')}</span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent 
                                className="w-auto p-0 z-[10000]" 
                                align="start"
                                side="bottom"
                                sideOffset={4}
                              >
                                <Calendar
                                  mode="single"
                                  selected={selectedEndDate}
                                  onSelect={handleEndDateChange}
                                  onDayClick={(date) => {
                                    console.log('OnDayClick - Date de fin:', date);
                                    handleEndDateChange(date);
                                  }}
                                  disabled={(date) => {
                                    const startDate = new Date(selectedStartDate);
                                    startDate.setHours(0, 0, 0, 0);
                                    return date <= startDate;
                                  }}
                                  initialFocus
                                  locale={undefined}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        {/* Résumé de la période - Stack sur mobile */}
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                              <div className="text-center">
                                <p className="text-xs sm:text-sm text-blue-600">Durée</p>
                                <p className="font-bold text-sm sm:text-base text-blue-800">
                                  {calculateDays(selectedStartDate, selectedEndDate)} jour{calculateDays(selectedStartDate, selectedEndDate) > 1 ? 's' : ''}
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

                        {/* Information sur le prix hebdomadaire */}
                        {validEquipment.weekly_price > 0 && calculateDays(selectedStartDate, selectedEndDate) >= 7 && (
                          <Alert className="border-green-200 bg-green-50">
                            <Calculator className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-700 text-sm">
                              <strong>Prix hebdomadaire appliqué !</strong> Vous économisez par rapport au tarif journalier.
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
                                <p className="text-sm text-green-700 truncate px-2">Document téléchargé: {reservationDetails.identityDocument.name}</p>
                              </>
                            ) : (
                              <>
                                <Upload className="h-6 w-6 text-gray-400 mb-1 mx-auto" />
                                <p className="text-sm text-gray-600">Cliquez pour télécharger votre pièce d'identité</p>
                                <p className="text-xs text-gray-500 mt-1">PNG, JPG - Max 5MB</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Étape 4: Paiement */}
                  {currentStep === 4 && (
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <Label className="text-base font-medium">Mode de paiement</Label>
                        <div className="space-y-3 mt-3">
                          
                          {/* Option Portefeuille */}
                          <Card 
                            className={`cursor-pointer transition-all ${
                              paymentMethod === 'wallet' 
                                ? 'border-emerald-500 bg-emerald-50' 
                                : 'hover:border-gray-300'
                            }`}
                            onClick={() => setPaymentMethod('wallet')}
                          >
                            <CardContent className="p-3 sm:p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm sm:text-base">Mon portefeuille</p>
                                    <p className="text-xs sm:text-sm text-gray-500 truncate">
                                      Solde: {safeToLocaleString(walletBalance)} FCFA
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {isSufficientBalance ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Alerte solde insuffisant */}
                          {paymentMethod === 'wallet' && !isSufficientBalance && (
                            <Alert className="border-orange-200 bg-orange-50">
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                              <AlertDescription className="text-orange-700">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                                  <span className="text-sm">
                                    Solde insuffisant. Il vous manque {safeToLocaleString(feeCalculations.totalWithFees - walletBalance)} FCFA.
                                  </span>
                                  <Button
                                    size="sm"
                                    onClick={() => setModalMode('recharge')}
                                    className="self-start sm:self-auto"
                                  >
                                    <Plus className="mr-1 h-3 w-3" />
                                    Recharger
                                  </Button>
                                </div>
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* Option Carte bancaire */}
                          <Card 
                            className={`cursor-pointer transition-all ${
                              paymentMethod === 'card' 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'hover:border-gray-300'
                            }`}
                            onClick={() => setPaymentMethod('card')}
                          >
                            <CardContent className="p-3 sm:p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm sm:text-base">Carte bancaire</p>
                                    <p className="text-xs sm:text-sm text-gray-500">Paiement sécurisé via Stripe</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {/* Conditions générales */}
                      <div className="flex items-start space-x-2">
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
                    </div>
                  )}
                  
                  {/* Étape 5: Récapitulatif */}
                  {currentStep === 5 && (
                    <div className="space-y-4 sm:space-y-6">
                      {/* Récapitulatif complet */}
                      <Card className="bg-gray-50">
                        <CardContent className="p-3 sm:p-4">
                          <h4 className="font-medium mb-3 text-sm sm:text-base">Récapitulatif de la réservation</h4>
                          <div className="space-y-2 text-xs sm:text-sm">
                            <div className="flex justify-between">
                              <span>Équipement:</span>
                              <span className="font-medium text-right truncate ml-2">{validEquipment.title}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Période:</span>
                              <span className="text-right">{safeFormatDate(selectedStartDate, 'short')} - {safeFormatDate(selectedEndDate, 'short')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Durée:</span>
                              <span>{calculateDays(selectedStartDate, selectedEndDate)} jour(s)</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Contact:</span>
                              <span className="text-right truncate ml-2">{reservationDetails.contactPhone || 'Non renseigné'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Livraison:</span>
                              <span>{reservationDetails.deliveryMethod === 'pickup' ? 'Retrait' : 'Livraison'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Détail des coûts */}
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
                            <div className="flex justify-between text-orange-600">
                              <span>Frais service (2%):</span>
                              <span>+ {safeToLocaleString(feeCalculations.platformFee)} FCFA</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-medium text-sm sm:text-lg">
                              <span>Total à débiter:</span>
                              <span className="text-red-600">
                                {safeToLocaleString(feeCalculations.totalWithFees)} FCFA
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mt-2">
                              * Les frais sont inclus dans le montant débité
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Bouton de soumission */}
                      <Button
                        onClick={handleReservationSubmit}
                        disabled={isSubmitting || (paymentMethod === 'wallet' && !isSufficientBalance)}
                        className="w-full h-10 sm:h-12 text-sm sm:text-base"
                      >
                        {isSubmitting ? (
                          <>
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            <span className="truncate">
                              {paymentMethod === 'wallet' 
                                ? `Réserver & Débiter ${safeToLocaleString(feeCalculations.totalWithFees)} FCFA`
                                : 'Envoyer la demande'
                              }
                            </span>
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation fixe en bas */}
              <div className="shrink-0 p-4 sm:p-6 border-t bg-white">
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={currentStep === 1 ? onClose : prevStep}
                    disabled={isSubmitting}
                    size="sm"
                  >
                    {currentStep === 1 ? 'Annuler' : 'Précédent'}
                  </Button>
                  
                  {currentStep < 5 ? (
                    <Button onClick={nextStep} disabled={isSubmitting} size="sm">
                      Suivant
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de recharge - RESPONSIVE */}
      {modalMode === 'recharge' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModalMode('reservation');
              setRechargeAmount('');
            }
          }}
        >
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold mb-2 flex items-center">
                  <Wallet className="mr-2 h-5 w-5 text-emerald-600" />
                  Recharger votre portefeuille
                </h3>
                <p className="text-gray-600 text-sm">
                  Solde actuel: <span className="font-medium text-emerald-600">{safeToLocaleString(walletBalance)} FCFA</span>
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Il vous manque: <span className="font-medium text-red-600">{safeToLocaleString(feeCalculations.totalWithFees - walletBalance)} FCFA</span>
                </p>
              </div>

              {/* Montants rapides */}
              <div className="mb-4">
                <Label className="text-sm font-medium mb-3 block">Montants rapides</Label>
                <div className="grid grid-cols-2 gap-2">
                  {quickAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant={rechargeAmount === amount.toString() ? "default" : "outline"}
                      onClick={() => handleQuickAmount(amount)}
                      className="text-xs sm:text-sm py-2 h-auto px-2"
                    >
                      <span className="truncate">{safeToLocaleString(amount)} FCFA</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Montant personnalisé */}
              <div className="mb-4 sm:mb-6">
                <Label htmlFor="custom-amount" className="text-sm font-medium mb-2 block">
                  Ou saisissez un montant personnalisé
                </Label>
                <div className="relative">
                  <Input
                    id="custom-amount"
                    type="text"
                    placeholder="Montant en FCFA"
                    value={formatRechargeAmount(rechargeAmount)}
                    onChange={handleRechargeAmountChange}
                    className="pr-16 text-sm"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    FCFA
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Minimum: 1 000 FCFA • Maximum: 1 000 000 FCFA
                </p>
              </div>

              {/* Informations de paiement */}
              <Card className="bg-blue-50 border-blue-200 mb-4 sm:mb-6">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center mb-2">
                    <Info className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-800">Paiement via KkiaPay</span>
                  </div>
                  <p className="text-xs text-blue-700">
                    Widget KkiaPay sécurisé pour Mobile Money, cartes bancaires et autres moyens de paiement locaux.
                  </p>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="space-y-3">
                {rechargeAmountNumber >= 1000 ? (
                  <KkiaPayWidget
                    amount={rechargeAmountNumber}
                    onSuccess={handleRechargeSuccess}
                    onError={handleRechargeError}
                    onCancel={handleRechargeCancel}
                  />
                ) : (
                  <Button disabled className="w-full text-sm">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Saisissez un montant (min. 1 000 FCFA)
                  </Button>
                )}

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setModalMode('reservation');
                      setRechargeAmount('');
                    }}
                    className="w-full sm:flex-1 text-sm"
                  >
                    Annuler
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setModalMode('reservation')} 
                    className="w-full sm:flex-1 text-sm"
                  >
                    Retour
                  </Button>
                </div>
              </div>

              {/* Note de sécurité */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-gray-600">
                    <p className="font-medium mb-1">Paiement 100% sécurisé</p>
                    <p>Vos données bancaires sont protégées et ne sont jamais stockées sur nos serveurs.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ReservationModal;