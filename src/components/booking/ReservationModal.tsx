// MODIFIER le fichier existant : /src/components/booking/ReservationModal.tsx
// Remplacer TOUT le contenu par ce code

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  CalendarIcon, 
  Clock, 
  CreditCard, 
  Shield, 
  CheckCircle,
  Phone,
  MapPin,
  AlertTriangle,
  Loader2,
  UserCheck,
  DollarSign,
  Percent
} from 'lucide-react';
import { format, differenceInDays, addDays, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { EquipmentData } from '@/types/supabase';
import { useAuth } from '@/hooks/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: EquipmentData;
  onSuccess: () => void;
}

const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  equipment,
  onSuccess
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // États pour les dates
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [startTimeCalendarOpen, setStartTimeCalendarOpen] = useState(false);
  const [endTimeCalendarOpen, setEndTimeCalendarOpen] = useState(false);

  // États pour les détails de réservation - COLONNES MAINTENANT EXISTANTES
  const [reservationDetails, setReservationDetails] = useState({
    deliveryMethod: 'pickup',
    deliveryAddress: '',
    contactPhone: '',
    specialRequests: '',
    acceptTerms: false,
    identityDocument: null,
    identityNumber: ''
  });

  // États pour le paiement
  const [paymentMethod, setPaymentMethod] = useState('card');

  // Calculs des prix - COMMISSION AUTOMATIQUE 5%
  const numberOfDays = startDate && endDate ? Math.max(1, differenceInDays(endDate, startDate) + 1) : 0;
  const subtotal = numberOfDays * equipment.daily_price;
  const platformFee = Math.round(subtotal * 0.02); // 2% frais plateforme
  const commission = Math.round(subtotal * 0.05); // 5% commission automatique
  const total = subtotal + platformFee;

  // Validation des dates
  const minDate = startOfDay(new Date());
  const isDateValid = startDate && endDate && !isBefore(startDate, minDate) && !isBefore(endDate, startDate);

  const handleInputChange = (field: string, value: any) => {
    setReservationDetails(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep === 1 && !isDateValid) {
      toast({
        title: "Dates requises",
        description: "Veuillez sélectionner des dates valides pour votre réservation.",
        variant: "destructive"
      });
      return;
    }
    
    if (currentStep === 2 && !reservationDetails.contactPhone) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez renseigner votre numéro de téléphone.",
        variant: "destructive"
      });
      return;
    }

    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Soumission de la réservation - AVEC NOUVELLES COLONNES
  const handleReservationSubmit = async () => {
    if (!user?.id || !startDate || !endDate) {
      toast({
        title: "Erreur",
        description: "Informations manquantes pour la réservation.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('📝 Création de la réservation avec validation automatique...');
      
      // Créer la réservation dans la base de données avec TOUTES les colonnes
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          equipment_id: equipment.id,
          renter_id: user.id,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          total_price: total,
          deposit_amount: equipment.deposit_amount,
          status: 'pending',
          payment_status: 'pending',
          // NOUVELLES COLONNES - maintenant disponibles
          contact_phone: reservationDetails.contactPhone,
          delivery_method: reservationDetails.deliveryMethod,
          delivery_address: reservationDetails.deliveryAddress || null,
          special_requests: reservationDetails.specialRequests || null,
          automatic_validation: true
          // commission_amount et platform_fee seront calculés automatiquement par le trigger
        })
        .select()
        .single();

      if (bookingError) {
        console.error("❌ Erreur lors de la création de la réservation:", bookingError);
        throw bookingError;
      }

      console.log("✅ Réservation créée avec succès:", booking);

      // Créer une notification pour le propriétaire
      if (equipment.owner_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: equipment.owner_id,
            type: 'new_booking',
            title: 'Nouvelle demande de réservation',
            message: `${user.email} souhaite réserver "${equipment.title}" du ${format(startDate, 'dd MMMM', { locale: fr })} au ${format(endDate, 'dd MMMM', { locale: fr })}.`,
            booking_id: booking.id
          });
      }

      toast({
        title: "🎉 Réservation créée !",
        description: `Votre réservation pour ${numberOfDays} jour(s) a été envoyée au propriétaire. Commission: ${commission.toLocaleString()} FCFA (5%).`,
      });

      onSuccess();
      onClose();

    } catch (error) {
      console.error("❌ Erreur lors de la réservation:", error);
      toast({
        title: "Erreur de réservation",
        description: "Une erreur s'est produite lors de l'envoi de votre réservation. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white rounded-t-lg -mx-6 -mt-6 mb-4">
            <DialogTitle className="text-xl font-bold">
              Réservation Modernisée
            </DialogTitle>
            <p className="text-blue-100 text-sm">{equipment.title}</p>
            
            {/* Indicateur de progression */}
            <div className="flex items-center justify-between mt-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    currentStep >= step ? "bg-white text-blue-600" : "bg-blue-400 text-white"
                  )}>
                    {currentStep > step ? <CheckCircle className="h-5 w-5" /> : step}
                  </div>
                  {step < 4 && (
                    <div className={cn(
                      "w-12 h-1 mx-2",
                      currentStep > step ? "bg-white" : "bg-blue-400"
                    )} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs mt-2">
              <span>Dates</span>
              <span>Contact</span>
              <span>Vérification</span>
              <span>Paiement</span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Étape 1: Sélection des dates */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Choisissez vos dates</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-base font-medium">Date de début</Label>
                  <Popover open={startTimeCalendarOpen} onOpenChange={setStartTimeCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'dd MMMM yyyy', { locale: fr }) : 'Sélectionner...'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={(date) => isBefore(date, minDate)}
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label className="text-base font-medium">Date de fin</Label>
                  <Popover open={endTimeCalendarOpen} onOpenChange={setEndTimeCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'dd MMMM yyyy', { locale: fr }) : 'Sélectionner...'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => !startDate || isBefore(date, startDate)}
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Résumé des prix avec commission visible */}
              {isDateValid && (
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3">Résumé de la location</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>{equipment.daily_price.toLocaleString()} FCFA × {numberOfDays} jour(s)</span>
                        <span>{subtotal.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Frais de plateforme (2%)</span>
                        <span>{platformFee.toLocaleString()} FCFA</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{total.toLocaleString()} FCFA</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        + Caution : {equipment.deposit_amount.toLocaleString()} FCFA (remboursable)
                      </div>
                      <div className="bg-orange-50 p-2 rounded text-sm">
                        <div className="flex items-center text-orange-700">
                          <Percent className="h-4 w-4 mr-1" />
                          Commission automatique: {commission.toLocaleString()} FCFA (5% fixe)
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Étape 2: Détails de contact et livraison */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Informations de contact et livraison</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Méthode de récupération</Label>
                  <Select value={reservationDetails.deliveryMethod} onValueChange={(value) => handleInputChange('deliveryMethod', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pickup">
                        <div className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4" />
                          Je viens récupérer
                        </div>
                      </SelectItem>
                      <SelectItem value="delivery">
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4" />
                          Livraison (frais en sus)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Téléphone de contact *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="tel"
                      value={reservationDetails.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      placeholder="+229 XX XX XX XX"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {reservationDetails.deliveryMethod === 'delivery' && (
                <div>
                  <Label>Adresse de livraison</Label>
                  <Textarea
                    value={reservationDetails.deliveryAddress}
                    onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                    placeholder="Adresse complète pour la livraison..."
                    rows={3}
                  />
                </div>
              )}

              <div>
                <Label>Demandes spéciales (optionnel)</Label>
                <Textarea
                  value={reservationDetails.specialRequests}
                  onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                  placeholder="Instructions particulières, questions pour le propriétaire..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Étape 3: Vérification automatique */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Vérification automatique</h3>
              
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-8 w-8 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-green-800">Validation automatique activée</h4>
                      <p className="text-sm text-green-600">
                        Vos documents seront vérifiés automatiquement. Commission de 5% appliquée automatiquement.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Numéro de pièce d'identité</Label>
                  <Input
                    value={reservationDetails.identityNumber}
                    onChange={(e) => handleInputChange('identityNumber', e.target.value)}
                    placeholder="Ex: 123456789"
                  />
                </div>

                <div>
                  <Label>Photo de la pièce d'identité</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <CreditCard className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Téléchargement automatisé</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Étape 4: Finalisation */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Finaliser votre réservation</h3>

              {/* Récapitulatif complet */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Récapitulatif final</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Équipement</span>
                      <span className="font-medium">{equipment.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dates</span>
                      <span>
                        {startDate && endDate ? 
                          `${format(startDate, 'dd MMM', { locale: fr })} - ${format(endDate, 'dd MMM yyyy', { locale: fr })}` 
                          : '-'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Durée</span>
                      <span>{numberOfDays} jour(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contact</span>
                      <span>{reservationDetails.contactPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Récupération</span>
                      <span>{reservationDetails.deliveryMethod === 'pickup' ? 'Sur place' : 'Livraison'}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total à payer</span>
                      <span>{total.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>Commission (automatique)</span>
                      <span>{commission.toLocaleString()} FCFA (5%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-blue-900">Système automatisé</h4>
                      <p className="text-sm text-blue-700">
                        Validation automatique • Commission fixe 5% • Notification email immédiate
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer avec boutons */}
        <div className="border-t pt-6 flex justify-between">
          <Button 
            variant="outline" 
            onClick={currentStep === 1 ? onClose : prevStep}
            disabled={isSubmitting}
          >
            {currentStep === 1 ? 'Annuler' : 'Précédent'}
          </Button>
          
          {currentStep < 4 ? (
            <Button onClick={nextStep} disabled={isSubmitting}>
              Suivant
            </Button>
          ) : (
            <Button 
              onClick={handleReservationSubmit} 
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Confirmer la réservation
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReservationModal;