// src/components/booking/ReservationModal.tsx - Système de réservation fonctionnel

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Clock, CreditCard, Shield, AlertCircle, Loader2 } from 'lucide-react';
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

  // États pour les détails de réservation
  const [reservationDetails, setReservationDetails] = useState({
    deliveryMethod: 'pickup', // 'pickup' ou 'delivery'
    deliveryAddress: '',
    contactPhone: '',
    specialRequests: '',
    acceptTerms: false
  });

  // Calculs des prix
  const numberOfDays = startDate && endDate ? Math.max(1, differenceInDays(endDate, startDate) + 1) : 0;
  const subtotal = numberOfDays * equipment.daily_price;
  const serviceFee = Math.round(subtotal * 0.05); // 5% de frais de service
  const total = subtotal + serviceFee;

  // Validation des dates
  const minDate = startOfDay(new Date());
  const isDateValid = startDate && endDate && !isBefore(startDate, minDate) && !isBefore(endDate, startDate);

  // Gestion du changement d'étape
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

    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Soumission de la réservation
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
      // Créer la réservation dans la base de données
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
          delivery_method: reservationDetails.deliveryMethod,
          delivery_address: reservationDetails.deliveryAddress || null,
          contact_phone: reservationDetails.contactPhone,
          special_requests: reservationDetails.specialRequests || null
        })
        .select()
        .single();

      if (bookingError) {
        console.error("Erreur lors de la création de la réservation:", bookingError);
        throw bookingError;
      }

      console.log("Réservation créée avec succès:", booking);

      // Créer une notification pour le propriétaire
      if (equipment.owner_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: equipment.owner_id,
            type: 'new_booking',
            title: 'Nouvelle demande de réservation',
            message: `${user.email} souhaite réserver "${equipment.title}" du ${format(startDate, 'dd MMMM', { locale: fr })} au ${format(endDate, 'dd MMMM', { locale: fr })}.`,
            related_id: booking.id
          });
      }

      toast({
        title: "Réservation envoyée !",
        description: "Votre demande a été envoyée au propriétaire. Vous recevrez une confirmation sous peu.",
      });

      onSuccess();
      onClose();

    } catch (error) {
      console.error("Erreur lors de la réservation:", error);
      toast({
        title: "Erreur de réservation",
        description: "Une erreur s'est produite lors de l'envoi de votre réservation. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setReservationDetails(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            <span>Réserver {equipment.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Indicateur d'étapes */}
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  currentStep >= step ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"
                )}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={cn(
                    "w-16 h-1 mx-2",
                    currentStep > step ? "bg-green-600" : "bg-gray-200"
                  )} />
                )}
              </div>
            ))}
          </div>

          {/* Étape 1: Sélection des dates */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Quand souhaitez-vous louer cet équipement ?</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Date de début */}
                <div>
                  <Label>Date de début</Label>
                  <Popover open={startTimeCalendarOpen} onOpenChange={setStartTimeCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "dd MMMM yyyy", { locale: fr }) : "Sélectionner"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date);
                          setStartTimeCalendarOpen(false);
                          // Si la date de fin est avant la nouvelle date de début, la réinitialiser
                          if (endDate && date && isBefore(endDate, date)) {
                            setEndDate(undefined);
                          }
                        }}
                        disabled={(date) => isBefore(date, minDate)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Date de fin */}
                <div>
                  <Label>Date de fin</Label>
                  <Popover open={endTimeCalendarOpen} onOpenChange={setEndTimeCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                        disabled={!startDate}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "dd MMMM yyyy", { locale: fr }) : "Sélectionner"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          setEndDate(date);
                          setEndTimeCalendarOpen(false);
                        }}
                        disabled={(date) => !startDate || isBefore(date, startDate)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Résumé des prix */}
              {isDateValid && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>{equipment.daily_price.toLocaleString()} FCFA × {numberOfDays} jour(s)</span>
                    <span>{subtotal.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Frais de service</span>
                    <span>{serviceFee.toLocaleString()} FCFA</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{total.toLocaleString()} FCFA</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    + Caution : {equipment.deposit_amount.toLocaleString()} FCFA (remboursable)
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Étape 2: Détails de livraison */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Détails de votre réservation</h3>

              {/* Méthode de récupération */}
              <div>
                <Label>Comment souhaitez-vous récupérer l'équipement ?</Label>
                <Select 
                  value={reservationDetails.deliveryMethod} 
                  onValueChange={(value) => handleInputChange('deliveryMethod', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">Je viens le récupérer</SelectItem>
                    <SelectItem value="delivery">Livraison (frais supplémentaires)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Adresse de livraison */}
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

              {/* Téléphone de contact */}
              <div>
                <Label>Numéro de téléphone *</Label>
                <Input
                  type="tel"
                  value={reservationDetails.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  placeholder="+229 XX XX XX XX"
                  required
                />
              </div>

              {/* Demandes spéciales */}
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

          {/* Étape 3: Confirmation */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Confirmez votre réservation</h3>

              {/* Résumé de la réservation */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Équipement</span>
                  <span>{equipment.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Dates</span>
                  <span>
                    {startDate && endDate ? 
                      `${format(startDate, 'dd MMM', { locale: fr })} - ${format(endDate, 'dd MMM yyyy', { locale: fr })}` 
                      : '-'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Durée</span>
                  <span>{numberOfDays} jour(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Récupération</span>
                  <span>{reservationDetails.deliveryMethod === 'pickup' ? 'Sur place' : 'Livraison'}</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{total.toLocaleString()} FCFA</span>
                </div>
              </div>

              {/* Informations importantes */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800">Important</p>
                    <ul className="text-blue-700 mt-1 space-y-1">
                      <li>• Votre réservation sera confirmée par le propriétaire</li>
                      <li>• La caution sera préautorisée mais non débitée</li>
                      <li>• Annulation gratuite jusqu'à 24h avant le début</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Boutons de navigation */}
          <div className="flex justify-between pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={currentStep === 1 ? onClose : prevStep}
              disabled={isSubmitting}
            >
              {currentStep === 1 ? 'Annuler' : 'Précédent'}
            </Button>
            
            {currentStep < 3 ? (
              <Button onClick={nextStep} className="bg-green-600 hover:bg-green-700">
                Suivant
              </Button>
            ) : (
              <Button 
                onClick={handleReservationSubmit} 
                className="bg-green-600 hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  'Confirmer la réservation'
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReservationModal;