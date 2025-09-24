// src/components/booking/ReservationModal.tsx - Version responsive
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { 
  CalendarIcon, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  X,
  Calendar as CalendarDays,
  CreditCard,
  Wallet,
  Clock,
  MapPin
} from 'lucide-react';
import { useAuth } from '@/hooks/auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/components/ui/use-toast';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (reservationData: any) => void;
  equipment: any;
  startDate?: Date | string;
  endDate?: Date | string;
  total?: number;
}

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
        day: '2-digit', 
        month: '2-digit' 
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
  const isMobile = useIsMobile();
  
  // Validation de l'équipement
  const validEquipment = useMemo(() => {
    if (!equipment || typeof equipment !== 'object') {
      return {
        id: '',
        title: 'Équipement non spécifié',
        daily_price: 0,
        deposit_amount: 0,
        owner_id: ''
      };
    }
    return {
      id: equipment.id || '',
      title: equipment.title || 'Équipement',
      daily_price: Number(equipment.daily_price) || 0,
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

  // États du composant
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  // Calcul du total
  const calculatedTotal = useMemo(() => {
    try {
      const days = calculateDays(selectedStartDate, selectedEndDate);
      const dailyPrice = validEquipment.daily_price;
      return days * dailyPrice;
    } catch {
      return 0;
    }
  }, [selectedStartDate, selectedEndDate, validEquipment.daily_price]);

  const days = calculateDays(selectedStartDate, selectedEndDate);

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedStartDate(date);
      // Ajuster la date de fin si elle devient antérieure à la date de début
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

  const handleReservation = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour faire une réservation.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Simuler la création de réservation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Réservation confirmée !",
        description: `Votre réservation pour ${validEquipment.title} a été confirmée.`
      });

      if (onSuccess) {
        onSuccess({
          equipment_id: validEquipment.id,
          start_date: selectedStartDate,
          end_date: selectedEndDate,
          total_price: calculatedTotal
        });
      }

      onClose();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la réservation. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ['Dates', 'Détails', 'Paiement', 'Confirmation'];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "gap-0 p-0 overflow-hidden",
        isMobile 
          ? "max-w-[95vw] max-h-[95vh] w-full h-full m-0 rounded-t-xl rounded-b-none fixed bottom-0 top-auto data-[state=open]:slide-in-from-bottom-0 data-[state=closed]:slide-out-to-bottom-0" 
          : "max-w-2xl max-h-[90vh] w-full"
      )}>
        {isMobile ? (
          // VERSION MOBILE - Full screen bottom sheet
          <div className="flex flex-col h-full">
            {/* Header mobile */}
            <div className="relative bg-gradient-to-r from-green-500 to-blue-500 text-white p-4 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">Réservation Express</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClose}
                  className="text-white hover:bg-white/20 p-1 h-8 w-8"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Equipment title */}
              <h2 className="text-lg font-bold mb-4">{validEquipment.title}</h2>

              {/* Mobile stepper */}
              <div className="flex justify-between items-center">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-center">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                      currentStep > index + 1 
                        ? "bg-white text-green-600" 
                        : currentStep === index + 1
                        ? "bg-white text-green-600"
                        : "bg-white/30 text-white"
                    )}>
                      {currentStep > index + 1 ? <CheckCircle className="h-4 w-4" /> : index + 1}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={cn(
                        "w-8 h-0.5 mx-2 transition-all",
                        currentStep > index + 1 ? "bg-white" : "bg-white/30"
                      )} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Content mobile */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Step 1: Date Selection */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-center mb-6">Choisissez vos dates</h3>
                    
                    {/* Date inputs mobile */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium mb-2 block">Date de début</Label>
                        <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal h-12 text-base"
                            >
                              <CalendarIcon className="mr-3 h-5 w-5" />
                              {safeFormatDate(selectedStartDate, 'long')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="center">
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

                      <div>
                        <Label className="text-base font-medium mb-2 block">Date de fin</Label>
                        <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal h-12 text-base"
                            >
                              <CalendarIcon className="mr-3 h-5 w-5" />
                              {safeFormatDate(selectedEndDate, 'long')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="center">
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
                  </div>

                  {/* Summary mobile */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Durée</span>
                      <span className="font-semibold text-blue-600">{days} jour{days > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Prix journalier</span>
                      <span className="font-semibold">{validEquipment.daily_price.toLocaleString()} FCFA</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="font-semibold text-lg">Total</span>
                      <span className="font-bold text-xl text-green-600">{calculatedTotal.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional steps would go here */}
              {currentStep > 1 && (
                <div className="text-center py-8">
                  <h3 className="text-xl font-bold mb-4">Étape {currentStep}</h3>
                  <p className="text-gray-600">Cette étape sera développée prochainement</p>
                </div>
              )}
            </div>

            {/* Footer mobile */}
            <div className="border-t bg-white p-4 space-y-4">
              {currentStep === 1 ? (
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                    className="flex-1 h-12 text-base"
                  >
                    Annuler
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep(2)}
                    disabled={!selectedStartDate || !selectedEndDate}
                    className="flex-1 h-12 text-base bg-green-600 hover:bg-green-700"
                  >
                    Continuer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="flex-1 h-12 text-base"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                  </Button>
                  {currentStep < 4 ? (
                    <Button 
                      onClick={() => setCurrentStep(currentStep + 1)}
                      className="flex-1 h-12 text-base bg-green-600 hover:bg-green-700"
                    >
                      Continuer
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleReservation}
                      disabled={isSubmitting}
                      className="flex-1 h-12 text-base bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? 'Réservation...' : 'Réserver'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          // VERSION DESKTOP - Modal standard
          <div className="max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header desktop */}
            <DialogHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5" />
                  </div>
                  Réservation Express
                </DialogTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <p className="text-white/90 mt-2">{validEquipment.title}</p>

              {/* Desktop stepper */}
              <div className="flex justify-center mt-6">
                <div className="flex items-center space-x-2">
                  {steps.map((step, index) => (
                    <div key={index} className="flex items-center">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                        currentStep > index + 1 
                          ? "bg-white text-green-600 shadow-lg" 
                          : currentStep === index + 1
                          ? "bg-white text-green-600 shadow-lg"
                          : "bg-green-400 text-white"
                      )}>
                        {currentStep > index + 1 ? <CheckCircle className="h-6 w-6" /> : index + 1}
                      </div>
                      {index < steps.length - 1 && (
                        <div className={cn(
                          "w-16 h-1 mx-2 transition-all",
                          currentStep > index + 1 ? "bg-white" : "bg-green-400"
                        )} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </DialogHeader>

            {/* Content desktop */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Step 1: Date Selection */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-4">Choisissez vos dates</h3>
                    
                    {/* Date selectors desktop */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {/* Start date */}
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

                      {/* End date */}
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

                    {/* Summary desktop */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Durée</div>
                          <div className="font-semibold text-blue-600">{days} jour{days > 1 ? 's' : ''}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Prix journalier</div>
                          <div className="font-semibold">{validEquipment.daily_price.toLocaleString()} FCFA</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Total</div>
                          <div className="font-bold text-lg text-green-600">{calculatedTotal.toLocaleString()} FCFA</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional steps would go here */}
              {currentStep > 1 && (
                <div className="text-center py-8">
                  <h3 className="text-xl font-bold mb-4">Étape {currentStep}</h3>
                  <p className="text-gray-600">Cette étape sera développée prochainement</p>
                </div>
              )}
            </div>

            {/* Footer desktop */}
            <div className="border-t p-6">
              {currentStep === 1 ? (
                <div className="flex justify-end gap-4">
                  <Button variant="outline" onClick={onClose}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep(2)}
                    disabled={!selectedStartDate || !selectedEndDate}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Continuer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep(currentStep - 1)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                  </Button>
                  {currentStep < 4 ? (
                    <Button 
                      onClick={() => setCurrentStep(currentStep + 1)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Continuer
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleReservation}
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? 'Réservation...' : 'Réserver'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ReservationModal;