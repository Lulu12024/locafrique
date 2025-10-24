// src/components/booking/SingleDatePickerWithBlockedDates.tsx
// VERSION ULTRA-ROBUSTE - Affichage garanti
import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { CalendarIcon, AlertCircle } from 'lucide-react';
import { useBookedDates } from '@/hooks/useBookedDates';

interface SingleDatePickerWithBlockedDatesProps {
  equipmentId: string;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  label: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export const SingleDatePickerWithBlockedDates: React.FC<SingleDatePickerWithBlockedDatesProps> = ({
  equipmentId,
  date,
  setDate,
  label,
  placeholder = 'Sélectionner une date',
  minDate,
  maxDate,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date);
  
  // Charger les dates réservées
  const { isDateBooked, bookedDates, isLoading } = useBookedDates(equipmentId);

  // Synchroniser avec la prop date
  useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  /**
   * Normalise une date (supprime l'heure)
   */
  const normalizeDate = (dateToNormalize: Date): Date => {
    const normalized = new Date(dateToNormalize);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  /**
   * Vérifie si une date doit être désactivée
   */
  const isDateDisabled = (dateToCheck: Date): boolean => {
    const today = normalizeDate(new Date());
    const checkDate = normalizeDate(dateToCheck);
    
    // Désactiver les dates passées
    if (checkDate < today) {
      return true;
    }

    // Désactiver si avant minDate
    if (minDate) {
      const min = normalizeDate(minDate);
      if (checkDate < min) {
        return true;
      }
    }

    // Désactiver si après maxDate
    if (maxDate) {
      const max = normalizeDate(maxDate);
      if (checkDate > max) {
        return true;
      }
    }

    // Désactiver les dates réservées
    try {
      return isDateBooked(dateToCheck);
    } catch (err) {
      console.error('Erreur vérification date:', err);
      return false;
    }
  };

  /**
   * Gère la sélection de date
   */
  const handleDateSelect = (newDate: Date | undefined) => {
    console.log(`📅 ${label} - Date sélectionnée:`, newDate);
    
    if (!newDate) {
      setSelectedDate(undefined);
      setDate(undefined);
      return;
    }

    // Vérifier que la date n'est pas réservée
    if (isDateBooked(newDate)) {
      console.warn('⚠️ Date réservée, sélection refusée');
      return;
    }

    // Mettre à jour l'état local ET l'état parent
    setSelectedDate(newDate);
    setDate(newDate);
    setIsOpen(false);
    
    console.log('✅ Date mise à jour:', newDate);
  };

  /**
   * Formate l'affichage de la date
   */
  const formatDateDisplay = (): string => {
    const dateToFormat = selectedDate || date;
    
    if (!dateToFormat) {
      return placeholder;
    }
    
    try {
      return dateToFormat.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (err) {
      console.error('Erreur formatage:', err);
      return dateToFormat.toLocaleDateString('fr-FR');
    }
  };

  // Afficher un loader pendant le chargement
  if (isLoading) {
    return (
      <Button
        variant="outline"
        disabled
        className={cn(
          'w-full justify-start text-left font-normal h-12 px-4',
          className
        )}
      >
        <CalendarIcon className="mr-3 h-5 w-5 animate-pulse" />
        <span className="text-muted-foreground">Chargement...</span>
      </Button>
    );
  }

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal h-12 px-4',
              !selectedDate && !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-3 h-5 w-5" />
            <span className="truncate">{formatDateDisplay()}</span>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-auto p-0 z-[10000]" align="start">
          <div className="p-4 space-y-3">
            {bookedDates.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {bookedDates.length} jour(s) réservé(s). Les dates grisées ne sont pas disponibles.
                </AlertDescription>
              </Alert>
            )}

            <Calendar
              mode="single"
              selected={selectedDate || date}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              className="rounded-md border"
              initialFocus
            />

            <div className="flex gap-3 text-xs text-muted-foreground border-t pt-2">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-primary"></div>
                <span>Disponible</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-muted"></div>
                <span>Réservé</span>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SingleDatePickerWithBlockedDates;