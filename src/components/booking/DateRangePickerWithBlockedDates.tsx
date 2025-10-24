// src/components/booking/DateRangePickerWithBlockedDates.tsx
// VERSION CORRIGÉE POUR PRODUCTION - Empêche la fermeture automatique

import React, { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { CalendarIcon, AlertCircle } from 'lucide-react';
import { format, isBefore, startOfDay, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useBookedDates } from '@/hooks/useBookedDates';

interface DateRangePickerWithBlockedDatesProps {
  equipmentId: string;
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  className?: string;
  buttonClassName?: string;
}

/**
 * Sélecteur de plage de dates qui bloque automatiquement les dates réservées
 * Empêche la sélection de dates qui chevaucheraient des réservations existantes
 */
export const DateRangePickerWithBlockedDates: React.FC<DateRangePickerWithBlockedDatesProps> = ({
  equipmentId,
  date,
  setDate,
  className,
  buttonClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDateBooked, hasOverlap, bookedDates } = useBookedDates(equipmentId);
  const today = startOfDay(new Date());

  /**
   * Vérifie si une date doit être désactivée
   */
  const isDateDisabled = (date: Date): boolean => {
    const dateToCheck = startOfDay(date);
    
    // Désactiver les dates passées
    if (isBefore(dateToCheck, today)) {
      return true;
    }

    // Désactiver les dates réservées
    return isDateBooked(date);
  };

  /**
   * Gère la sélection de dates avec validation
   */
  const handleDateSelect = (selectedRange: DateRange | undefined) => {
    console.log('📅 Sélection de dates:', selectedRange);
    setError(null);

    if (!selectedRange) {
      setDate(undefined);
      return;
    }

    // Si seulement la date de début est sélectionnée
    if (selectedRange.from && !selectedRange.to) {
      // Vérifier que la date de début n'est pas réservée
      if (isDateBooked(selectedRange.from)) {
        setError('Cette date n\'est pas disponible');
        return;
      }
      
      setDate(selectedRange);
      return;
    }

    // Si les deux dates sont sélectionnées
    if (selectedRange.from && selectedRange.to) {
      // Vérifier qu'il n'y a pas de chevauchement
      if (hasOverlap(selectedRange.from, selectedRange.to)) {
        setError('Cette période chevauche des dates déjà réservées. Veuillez choisir d\'autres dates.');
        setDate(undefined);
        return;
      }

      setDate(selectedRange);
      setError(null);
      
      // ✅ IMPORTANT : Fermer avec un délai pour éviter les conflits
      setTimeout(() => {
        setIsOpen(false);
      }, 100);
    }
  };

  /**
   * Formate l'affichage des dates sélectionnées
   */
  const formatDateDisplay = (): string => {
    if (!date?.from) {
      return 'Sélectionner les dates';
    }

    if (date.from && !date.to) {
      return format(date.from, 'd MMM yyyy', { locale: fr });
    }

    if (date.from && date.to) {
      return `${format(date.from, 'd MMM', { locale: fr })} - ${format(date.to, 'd MMM yyyy', { locale: fr })}`;
    }

    return 'Sélectionner les dates';
  };

  /**
   * Modificateurs pour styler les dates
   */
  const modifiers = {
    booked: (date: Date) => isDateBooked(date),
    selected: date?.from || date?.to ? (checkDate: Date) => {
      if (!date.from || !date.to) return false;
      return isWithinInterval(checkDate, { start: date.from, end: date.to });
    } : undefined,
  };

  const modifiersClassNames = {
    booked: 'bg-red-100 text-red-900 line-through opacity-50 cursor-not-allowed',
    selected: 'bg-primary text-primary-foreground',
  };

  // ✅ CORRECTION CRITIQUE : Empêcher la propagation des clics
  const handlePopoverContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal h-12 px-4',
              !date?.from && 'text-muted-foreground',
              buttonClassName
            )}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
          >
            <CalendarIcon className="mr-3 h-5 w-5 flex-shrink-0" />
            <span className="truncate">{formatDateDisplay()}</span>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-auto p-0 z-[10000]" 
          align="start"
          onClick={handlePopoverContentClick}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // ✅ Empêcher la fermeture si on clique à l'intérieur du calendrier
            const target = e.target as HTMLElement;
            if (target.closest('[role="dialog"]') || target.closest('.rdp')) {
              e.preventDefault();
            }
          }}
        >
          <div 
            className="p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            {bookedDates.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Les dates en rouge sont déjà réservées et ne peuvent pas être sélectionnées.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            <div onClick={(e) => e.stopPropagation()}>
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from || new Date()}
                selected={date}
                onSelect={handleDateSelect}
                numberOfMonths={2}
                locale={fr}
                disabled={isDateDisabled}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
                className="rounded-md border"
              />
            </div>

            <div className="flex gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-green-500"></div>
                <span>Disponible</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-red-500"></div>
                <span>Réservé</span>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateRangePickerWithBlockedDates;