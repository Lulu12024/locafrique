// src/components/booking/ReservationModal.tsx
// VERSION CORRIGÉE AVEC LE NOUVEAU KKIAPAYWTIGET

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
import { KkiaPayWidget } from '@/components/KkiaPayWidget'; // Import du nouveau widget

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  equipment: any;
  startDate?: Date | string;
  endDate?: Date | string;
  total?: number;
}

// Fonction utilitaire pour formater un nombre en toute sécurité
const safeToLocaleString = (value: any): string => {
  try {
    const num = Number(value);
    if (isNaN(num)) return '0';
    return num.toLocaleString();
  } catch {
    return '0';
  }
};

// Fonction utilitaire pour formater les dates sans erreur
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

// Calculer le nombre de jours entre deux dates
const calculateDays = (start: Date, end: Date): number => {
  try {
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return Math.max(1, daysDiff); // Minimum 1 jour
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
  
  // Vérification précoce et retour si le modal n'est pas ouvert
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
      // Par défaut, fin = début + 1 jour
      const start = selectedStartDate || new Date();
      return new Date(start.getTime() + 24 * 60 * 60 * 1000);
    } catch {
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  });

  // Calcul du prix total basé sur les dates et l'équipement
  const calculatedTotal = useMemo(() => {
    try {
      const days = calculateDays(selectedStartDate, selectedEndDate);
      const dailyPrice = validEquipment.daily_price;
      const weeklyPrice = validEquipment.weekly_price;
      
      if (days >= 7 && weeklyPrice > 0) {
        // Utiliser le prix hebdomadaire si disponible et plus avantageux
        const weeks = Math.floor(days / 7);
        const remainingDays = days % 7;
        const weeklyTotal = weeks * weeklyPrice;
        const dailyTotal = remainingDays * dailyPrice;
        return weeklyTotal + dailyTotal;
      } else {
        // Utiliser uniquement le prix journalier
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
  
  // Montants rapides pour la recharge
  const quickAmounts = [10000, 25000, 50000, 100000, 200000];
  
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

  // Vérifier si le solde est suffisant
  const isSufficientBalance = walletBalance >= calculatedTotal;

  // Gestionnaires pour le widget KkiaPay
  const handleRechargeSuccess = (response: any) => {
    console.log('✅ Recharge réussie:', response);
    
    // Recharger le solde
    loadWalletBalance();
    
    // Retourner au mode réservation
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
    // Supprimer tous les caractères non numériques
    const numericValue = value.replace(/[^\d]/g, '');
    
    // Convertir en nombre et formater avec des espaces
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

  // Gestion des dates avec validation
  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedStartDate(date);
      
      // Ajuster la date de fin si elle est antérieure à la nouvelle date de début
      if (selectedEndDate <= date) {
        setSelectedEndDate(new Date(date.getTime() + 24 * 60 * 60 * 1000));
      }
    }
    setIsStartDateOpen(false);
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date && date > selectedStartDate) {
      setSelectedEndDate(date);
    }
    setIsEndDateOpen(false);
  };

  // Gestion du fichier d'identité
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifications de sécurité
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
    // Validations selon l'étape
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

    if (paymentMethod === 'wallet' && !isSufficientBalance) {
      toast({
        title: "Solde insuffisant",
        description: "Veuillez recharger votre portefeuille ou choisir un autre mode de paiement.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🚀 Création de réservation...');
      
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
        total_price: calculatedTotal,
        deposit_amount: validEquipment.deposit_amount,
        status: 'pending',
        payment_status: paymentMethod === 'wallet' ? 'paid' : 'pending',
        payment_method: paymentMethod,
        contact_phone: reservationDetails.contactPhone || '',
        delivery_method: reservationDetails.deliveryMethod || 'pickup',
        delivery_address: reservationDetails.deliveryAddress || null,
        special_requests: reservationDetails.specialRequests || null,
        automatic_validation: false,
        commission_amount: calculatedTotal * 0.05,
        platform_fee: calculatedTotal * 0.02,
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

      // Déduction du portefeuille si nécessaire
      if (paymentMethod === 'wallet' && calculatedTotal > 0) {
        const { data: walletData } = await supabase
          .from('wallets')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (walletData?.id) {
          const { data: transactionData, error: transactionError } = await supabase.rpc(
            'create_wallet_transaction_secure',
            {
              p_wallet_id: walletData.id,
              p_amount: calculatedTotal,
              p_transaction_type: 'debit',
              p_description: `Réservation ${validEquipment.title} - En attente d'approbation`,
              p_reference_id: booking.id,
              p_booking_id: booking.id
            }
          );

          if (transactionError || !transactionData?.success) {
            await supabase.from('bookings').delete().eq('id', booking.id);
            throw new Error("Erreur lors de la déduction du portefeuille");
          }

          await loadWalletBalance();
        }
      }

      // Notifications
      if (validEquipment.owner_id && user.email) {
        const notifications = [
          {
            user_id: validEquipment.owner_id,
            type: 'new_booking_request',
            title: '📋 Nouvelle demande de réservation',
            message: `${user.email} souhaite réserver "${validEquipment.title}" du ${safeFormatDate(selectedStartDate, 'long')} au ${safeFormatDate(selectedEndDate, 'long')} pour ${safeToLocaleString(calculatedTotal)} FCFA.`,
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
          ? `Montant débité: ${safeToLocaleString(calculatedTotal)} FCFA • En attente d'approbation`
          : "Votre demande a été envoyée au propriétaire pour approbation",
        duration: 5000
      });

      onSuccess();
      onClose();

    } catch (error: any) {
      console.error("❌ Erreur lors de la réservation:", error);
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
      {/* Modal principal de réservation */}
      {modalMode === 'reservation' && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-6 text-white rounded-t-lg -mx-6 -mt-6 mb-6">
                <DialogTitle className="text-2xl font-bold flex items-center">
                  <Zap className="mr-3 h-6 w-6" />
                  Réservation Express
                </DialogTitle>
                <p className="text-emerald-100 text-sm mt-1">{validEquipment.title}</p>
                
                {/* Indicateur de progression */}
                <div className="flex items-center justify-between mt-6">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                        currentStep >= step 
                          ? "bg-white text-emerald-600 shadow-lg" 
                          : "bg-emerald-400 text-white"
                      )}>
                        {currentStep > step ? <CheckCircle className="h-6 w-6" /> : step}
                      </div>
                      {step < 5 && (
                        <div className={cn(
                          "w-16 h-1 mx-2 transition-all",
                          currentStep > step ? "bg-white" : "bg-emerald-400"
                        )} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </DialogHeader>

            {/* Corps du modal */}
            <div className="space-y-6">
              {/* Étape 1: Sélection des dates */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-4">Choisissez vos dates</h3>
                    
                    {/* Sélecteurs de dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {/* Date de début */}
                      <div className="space-y-2">
                        <Label>Date de début</Label>
                        <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {safeFormatDate(selectedStartDate, 'long')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selectedStartDate}
                              onSelect={handleStartDateChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Date de fin */}
                      <div className="space-y-2">
                        <Label>Date de fin</Label>
                        <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {safeFormatDate(selectedEndDate, 'long')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
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

                    {/* Résumé de la période */}
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-center space-x-4">
                          <div className="text-center">
                            <p className="text-sm text-blue-600">Durée</p>
                            <p className="font-bold text-blue-800">
                              {calculateDays(selectedStartDate, selectedEndDate)} jour{calculateDays(selectedStartDate, selectedEndDate) > 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="w-px h-8 bg-blue-300" />
                          <div className="text-center">
                            <p className="text-sm text-blue-600">Prix journalier</p>
                            <p className="font-bold text-blue-800">
                              {safeToLocaleString(validEquipment.daily_price)} FCFA
                            </p>
                          </div>
                          <div className="w-px h-8 bg-blue-300" />
                          <div className="text-center">
                            <p className="text-sm text-blue-600">Total</p>
                            <p className="text-xl font-bold text-green-600">
                              {safeToLocaleString(calculatedTotal)} FCFA
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Information sur le prix hebdomadaire si applicable */}
                    {validEquipment.weekly_price > 0 && calculateDays(selectedStartDate, selectedEndDate) >= 7 && (
                      <Alert className="border-green-200 bg-green-50">
                        <Calculator className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700">
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
                    <Label htmlFor="phone">Numéro de téléphone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+229 XX XX XX XX"
                      value={reservationDetails.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="delivery">Mode de livraison</Label>
                    <Select value={reservationDetails.deliveryMethod} onValueChange={(value) => handleInputChange('deliveryMethod', value)}>
                      <SelectTrigger>
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
                      <Label htmlFor="address">Adresse de livraison</Label>
                      <Input
                        id="address"
                        placeholder="Votre adresse complète"
                        value={reservationDetails.deliveryAddress}
                        onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="requests">Demandes spéciales (optionnel)</Label>
                    <textarea
                      id="requests"
                      className="w-full p-2 border border-gray-300 rounded-md"
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
                    <Label htmlFor="identity-number">Numéro de pièce d'identité *</Label>
                    <Input
                      id="identity-number"
                      placeholder="Numéro CNI, passeport..."
                      value={reservationDetails.identityNumber}
                      onChange={(e) => handleInputChange('identityNumber', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="identity-doc">Document d'identité *</Label>
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
                          "border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer transition-colors",
                          reservationDetails.identityDocument 
                            ? "border-green-300 bg-green-50" 
                            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                        )}
                      >
                        {reservationDetails.identityDocument ? (
                          <>
                            <CheckCircle className="h-6 w-6 text-green-600 mb-1 mx-auto" />
                            <p className="text-sm text-green-700">Document téléchargé: {reservationDetails.identityDocument.name}</p>
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
                <div className="space-y-6">
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
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Wallet className="h-6 w-6 text-emerald-600" />
                              <div>
                                <p className="font-medium">Mon portefeuille</p>
                                <p className="text-sm text-gray-500">
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
                            <div className="flex items-center justify-between">
                              <span>
                                Solde insuffisant. Il vous manque {safeToLocaleString(calculatedTotal - walletBalance)} FCFA.
                              </span>
                              <Button
                                size="sm"
                                onClick={() => setModalMode('recharge')}
                                className="ml-2"
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
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <CreditCard className="h-6 w-6 text-blue-600" />
                              <div>
                                <p className="font-medium">Carte bancaire</p>
                                <p className="text-sm text-gray-500">Paiement sécurisé via Stripe</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Conditions générales */}
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="terms" 
                      checked={reservationDetails.acceptTerms}
                      onCheckedChange={(checked) => handleInputChange('acceptTerms', checked)}
                    />
                    <Label htmlFor="terms" className="text-sm">
                      J'accepte les <span className="text-blue-600 underline cursor-pointer">conditions générales</span>
                    </Label>
                  </div>
                </div>
              )}
              
              {/* Étape 5: Récapitulatif */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  {/* Récapitulatif complet */}
                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3">Récapitulatif de la réservation</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Équipement:</span>
                          <span className="font-medium">{validEquipment.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Période:</span>
                          <span>{safeFormatDate(selectedStartDate, 'short')} - {safeFormatDate(selectedEndDate, 'short')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Durée:</span>
                          <span>{calculateDays(selectedStartDate, selectedEndDate)} jour(s)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Contact:</span>
                          <span>{reservationDetails.contactPhone || 'Non renseigné'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Livraison:</span>
                          <span>{reservationDetails.deliveryMethod === 'pickup' ? 'Retrait' : 'Livraison'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Informations de paiement */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Paiement</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Méthode:</span>
                          <span>{paymentMethod === 'wallet' ? 'Portefeuille' : 'Carte bancaire'}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium text-lg">
                          <span>Total:</span>
                          <span className="text-green-600">{safeToLocaleString(calculatedTotal)} FCFA</span>
                        </div>
                        {paymentMethod === 'wallet' && (
                          <>
                            <div className="flex justify-between">
                              <span>Solde actuel:</span>
                              <span>{safeToLocaleString(walletBalance)} FCFA</span>
                            </div>
                            <div className="flex justify-between text-red-600">
                              <span>Après déduction:</span>
                              <span>{safeToLocaleString(walletBalance - calculatedTotal)} FCFA</span>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bouton de soumission */}
                  <Button
                    onClick={handleReservationSubmit}
                    disabled={isSubmitting || (paymentMethod === 'wallet' && !isSufficientBalance)}
                    className="w-full h-12"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {paymentMethod === 'wallet' 
                          ? `Réserver & Débiter ${safeToLocaleString(calculatedTotal)} FCFA`
                          : 'Envoyer la demande de réservation'
                        }
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={currentStep === 1 ? onClose : prevStep}
                  disabled={isSubmitting}
                >
                  {currentStep === 1 ? 'Annuler' : 'Précédent'}
                </Button>
                
                {currentStep < 5 ? (
                  <Button onClick={nextStep} disabled={isSubmitting}>
                    Suivant
                  </Button>
                ) : null}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de recharge KkiaPay - NOUVELLE VERSION AVEC WIDGET */}
      {modalMode === 'recharge' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModalMode('reservation');
              setRechargeAmount('');
            }
          }}
        >
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2 flex items-center">
                <Wallet className="mr-2 h-5 w-5 text-emerald-600" />
                Recharger votre portefeuille
              </h3>
              <p className="text-gray-600 text-sm">
                Solde actuel: <span className="font-medium text-emerald-600">{safeToLocaleString(walletBalance)} FCFA</span>
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Il vous manque: <span className="font-medium text-red-600">{safeToLocaleString(calculatedTotal - walletBalance)} FCFA</span>
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
                    className="text-sm py-2 h-auto"
                  >
                    {safeToLocaleString(amount)} FCFA
                  </Button>
                ))}
              </div>
            </div>

            {/* Montant personnalisé */}
            <div className="mb-6">
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
                  className="pr-16"
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
            <Card className="bg-blue-50 border-blue-200 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center mb-2">
                  <Info className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">Paiement via KkiaPay</span>
                </div>
                <p className="text-xs text-blue-700">
                  Widget KkiaPay sécurisé pour Mobile Money, cartes bancaires et autres moyens de paiement locaux.
                </p>
              </CardContent>
            </Card>

            {/* Boutons d'action - NOUVELLE VERSION AVEC WIDGET */}
            <div className="space-y-3">
              {rechargeAmountNumber >= 1000 ? (
                <KkiaPayWidget
                  amount={rechargeAmountNumber}
                  onSuccess={handleRechargeSuccess}
                  onError={handleRechargeError}
                  onCancel={handleRechargeCancel}
                />
              ) : (
                <Button disabled className="w-full">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Saisissez un montant (min. 1 000 FCFA)
                </Button>
              )}

              <div className="flex space-x-3">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setModalMode('reservation');
                    setRechargeAmount('');
                  }}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setModalMode('reservation')} 
                  className="flex-1"
                >
                  Retour à la réservation
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
      )}
    </>
  );
}

export default ReservationModal;