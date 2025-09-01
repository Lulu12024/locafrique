
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { X, User, Mail, Phone, Calendar, Shield, CreditCard, Smartphone, Truck, MapPin } from 'lucide-react';
import { EquipmentData } from '@/types/supabase';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/auth';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import DatePickerWithRange from '@/components/DatePickerWithRange';
import { addDays, differenceInDays, format, isAfter, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

interface ReservationPopupProps {
  equipment: EquipmentData;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function ReservationPopup({ equipment, isOpen, onClose, onComplete }: ReservationPopupProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(),
    to: addDays(new Date(), 7)
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: 'Bonjour, je suis intéressé(e) par la location de votre matériel. Pourriez-vous me confirmer la disponibilité pour les dates sélectionnées ? Merci !',
    deliveryOption: '',
    paymentMethod: '',
    cardNumber: '',
    cardExpiry: '',
    cardCVV: '',
    mobileNumber: '',
    paypalEmail: ''
  });

  console.log('🎯 ReservationPopup rendu avec isOpen:', isOpen);
  console.log('📅 Date range actuel:', dateRange);

  // Calculer le nombre de jours et le prix total dynamiquement
  const rentalDays = dateRange.to && dateRange.from 
    ? Math.max(1, differenceInDays(dateRange.to, dateRange.from) + 1)
    : 1;

  const totalPrice = equipment.daily_price * rentalDays;
  const serviceFee = 2500;
  const finalTotal = totalPrice + serviceFee;

  // Validation des dates
  const isDateRangeValid = () => {
    if (!dateRange.from || !dateRange.to) return false;
    
    const today = startOfDay(new Date());
    const fromDate = startOfDay(dateRange.from);
    const toDate = startOfDay(dateRange.to);
    
    // Vérifier que les dates ne sont pas dans le passé
    if (isBefore(fromDate, today) || isBefore(toDate, today)) {
      return false;
    }
    
    // Vérifier que la date de fin est après ou égale à la date de début
    return isAfter(toDate, fromDate) || fromDate.getTime() === toDate.getTime();
  };

  const handleDateChange = (newDateRange: DateRange | undefined) => {
    console.log('📅 Nouvelle sélection de dates:', newDateRange);
    
    if (newDateRange) {
      const today = startOfDay(new Date());
      
      let validFrom = newDateRange.from;
      let validTo = newDateRange.to;
      
      // Empêcher la sélection de dates passées
      if (validFrom && isBefore(startOfDay(validFrom), today)) {
        validFrom = new Date();
      }
      
      if (validTo && isBefore(startOfDay(validTo), today)) {
        validTo = addDays(new Date(), 1);
      }
      
      setDateRange({
        from: validFrom,
        to: validTo
      });
    } else {
      setDateRange(newDateRange);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour effectuer une réservation.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.firstName || !formData.email || !formData.phone || !formData.deliveryOption || !formData.paymentMethod) {
      toast({
        title: "Champs obligatoires",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    if (!isDateRangeValid()) {
      toast({
        title: "Dates invalides",
        description: "Veuillez sélectionner des dates valides. Les dates ne peuvent pas être dans le passé.",
        variant: "destructive",
      });
      return;
    }

    // Validation des champs de paiement selon la méthode choisie
    if (formData.paymentMethod === 'card' && (!formData.cardNumber || !formData.cardExpiry || !formData.cardCVV)) {
      toast({
        title: "Informations de carte manquantes",
        description: "Veuillez remplir toutes les informations de votre carte bancaire.",
        variant: "destructive",
      });
      return;
    }

    if (formData.paymentMethod === 'mobile' && !formData.mobileNumber) {
      toast({
        title: "Numéro mobile requis",
        description: "Veuillez saisir votre numéro de téléphone pour le paiement mobile.",
        variant: "destructive",
      });
      return;
    }

    if (formData.paymentMethod === 'paypal' && !formData.paypalEmail) {
      toast({
        title: "Email PayPal requis",
        description: "Veuillez saisir votre email PayPal.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('📝 Traitement de la réservation directe');
      
      const dateText = `Du ${format(dateRange.from!, 'dd MMMM yyyy', { locale: fr })} au ${format(dateRange.to!, 'dd MMMM yyyy', { locale: fr })} (${rentalDays} jour${rentalDays > 1 ? 's' : ''})`;
      
      console.log('📅 Dates de réservation:', dateText);
      console.log('💰 Prix total:', finalTotal);
      
      toast({
        title: "Réservation confirmée",
        description: `Votre réservation de ${equipment.title} pour ${rentalDays} jour${rentalDays > 1 ? 's' : ''} a été confirmée. Total: ${finalTotal.toLocaleString()} FCFA`,
      });

      // Reset form and close popup
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        message: 'Bonjour, je suis intéressé(e) par la location de votre matériel. Pourriez-vous me confirmer la disponibilité pour les dates sélectionnées ? Merci !',
        deliveryOption: '',
        paymentMethod: '',
        cardNumber: '',
        cardExpiry: '',
        cardCVV: '',
        mobileNumber: '',
        paypalEmail: ''
      });
      setDateRange({
        from: new Date(),
        to: addDays(new Date(), 7)
      });
      
      onComplete();
      onClose();
      
    } catch (error: any) {
      console.error('❌ Erreur lors du traitement de la réservation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter la réservation. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) {
    console.log('❌ Popup fermé - isOpen est false');
    return null;
  }

  console.log('✅ Popup affiché - isOpen est true');

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-[90%] max-w-6xl rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-green-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Réservation</h2>
              <p className="text-sm text-gray-600">{equipment.title}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
            {/* Left Column - Dates and Summary */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Sélectionnez vos dates
                </h3>
                <DatePickerWithRange 
                  date={dateRange} 
                  setDate={handleDateChange}
                  className="w-full"
                  buttonClassName="w-full h-12 text-left justify-start border-2 hover:border-blue-300 focus:border-blue-500 transition-colors"
                />
                {dateRange.from && dateRange.to && !isDateRangeValid() && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <X className="h-4 w-4" />
                    Veuillez sélectionner des dates valides (pas dans le passé)
                  </p>
                )}
              </div>
              
              {/* Rental Summary */}
              {dateRange.from && dateRange.to && isDateRangeValid() && (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-500" />
                    Résumé de la location
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Dates:</span>
                      <span className="font-medium text-gray-900">
                        {format(dateRange.from, 'dd/MM', { locale: fr })} - {format(dateRange.to, 'dd/MM/yyyy', { locale: fr })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Prix par jour:</span>
                      <span className="text-gray-900">{equipment.daily_price?.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Nombre de jours:</span>
                      <span className="font-medium text-gray-900">{rentalDays} jour{rentalDays > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Sous-total:</span>
                      <span className="text-gray-900">{totalPrice.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Frais de service:</span>
                      <span className="text-gray-900">{serviceFee.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between items-center font-semibold text-lg pt-3 border-t border-gray-300">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-blue-600">{finalTotal.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Notice */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-amber-800 mb-1">Sécurité et protection</h4>
                    <p className="text-sm text-amber-700">
                      Pour votre sécurité et celle du propriétaire, nous vous recommandons fortement de maintenir toutes vos communications sur notre plateforme. Notre équipe peut ainsi vous accompagner tout au long du processus de location.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Form */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-500" />
                    Vos informations
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prénom *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Votre prénom"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className="pl-10 h-11"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom *
                        </label>
                        <Input
                          placeholder="Votre nom"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="h-11"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          E-mail *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="email"
                            placeholder="votre@email.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="pl-10 h-11"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Téléphone *
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="tel"
                            placeholder="+225 XX XX XX XX"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="pl-10 h-11"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Options */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Truck className="h-5 w-5 text-green-500" />
                    Mode de récupération *
                  </h3>
                  <RadioGroup 
                    value={formData.deliveryOption} 
                    onValueChange={(value) => handleInputChange('deliveryOption', value)}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-4 border-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                      <RadioGroupItem value="delivery" id="delivery" />
                      <Label htmlFor="delivery" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Truck className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="font-medium">Je souhaite être livré</div>
                          <div className="text-sm text-gray-500">Livraison à votre adresse</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                      <RadioGroupItem value="pickup" id="pickup" />
                      <Label htmlFor="pickup" className="flex items-center gap-2 cursor-pointer flex-1">
                        <MapPin className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="font-medium">Je souhaite aller récupérer le matériel</div>
                          <div className="text-sm text-gray-500">Retrait sur place</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Payment Methods */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-purple-500" />
                    Moyen de paiement *
                  </h3>
                  <RadioGroup 
                    value={formData.paymentMethod} 
                    onValueChange={(value) => handleInputChange('paymentMethod', value)}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-4 border-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                        <CreditCard className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="font-medium">Carte bancaire</div>
                          <div className="text-sm text-gray-500">Visa, Mastercard</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                      <RadioGroupItem value="mobile" id="mobile" />
                      <Label htmlFor="mobile" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Smartphone className="h-5 w-5 text-orange-500" />
                        <div>
                          <div className="font-medium">Paiement mobile</div>
                          <div className="text-sm text-gray-500">Flooz, Moov Money, MTN, Wave</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                      <RadioGroupItem value="paypal" id="paypal" />
                      <Label htmlFor="paypal" className="flex items-center gap-2 cursor-pointer flex-1">
                        <div className="w-5 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">P</div>
                        <div>
                          <div className="font-medium">PayPal</div>
                          <div className="text-sm text-gray-500">Paiement sécurisé en ligne</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Dynamic Payment Fields */}
                  {formData.paymentMethod === 'card' && (
                    <div className="mt-4 space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <h4 className="font-medium text-blue-900 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Informations de carte
                      </h4>
                      <div className="space-y-3">
                        <Input
                          placeholder="Numéro de carte (1234 5678 9012 3456)"
                          value={formData.cardNumber}
                          onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                          maxLength={19}
                          className="h-11"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="MM/AA"
                            value={formData.cardExpiry}
                            onChange={(e) => handleInputChange('cardExpiry', e.target.value)}
                            maxLength={5}
                            className="h-11"
                          />
                          <Input
                            placeholder="CVV"
                            value={formData.cardCVV}
                            onChange={(e) => handleInputChange('cardCVV', e.target.value)}
                            maxLength={4}
                            className="h-11"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.paymentMethod === 'mobile' && (
                    <div className="mt-4 space-y-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
                      <h4 className="font-medium text-orange-900 flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        Paiement mobile
                      </h4>
                      <Input
                        placeholder="Numéro de téléphone (+225 XX XX XX XX)"
                        value={formData.mobileNumber}
                        onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                        className="h-11"
                      />
                    </div>
                  )}

                  {formData.paymentMethod === 'paypal' && (
                    <div className="mt-4 space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <h4 className="font-medium text-blue-900 flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">P</div>
                        Compte PayPal
                      </h4>
                      <Input
                        type="email"
                        placeholder="Email PayPal (exemple@email.com)"
                        value={formData.paypalEmail}
                        onChange={(e) => handleInputChange('paypalEmail', e.target.value)}
                        className="h-11"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message au propriétaire
                  </label>
                  <Textarea
                    placeholder="Votre message..."
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    className="min-h-[100px] resize-none"
                    rows={4}
                  />
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button 
              variant="outline"
              onClick={onClose}
              className="px-8 h-12"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 text-white px-8 h-12 font-semibold"
              disabled={!formData.firstName || !formData.email || !formData.phone || !formData.deliveryOption || !formData.paymentMethod || !isDateRangeValid() || isSubmitting}
            >
              {isSubmitting ? 'Traitement en cours...' : `Réserver maintenant - ${finalTotal.toLocaleString()} FCFA`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
