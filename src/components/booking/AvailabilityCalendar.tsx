// src/components/booking/AvailabilityCalendar.tsx
import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Info, CheckCircle, XCircle } from 'lucide-react';
import { useBookedDates } from '@/hooks/useBookedDates';
import { isBefore, startOfDay, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AvailabilityCalendarProps {
  equipmentId: string;
  className?: string;
  showLegend?: boolean;
  compact?: boolean;
}

/**
 * Composant de calendrier qui affiche la disponibilité d'un équipement
 * Les dates réservées sont automatiquement bloquées
 */
export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  equipmentId,
  className = '',
  showLegend = true,
  compact = false,
}) => {
  const { bookedDates, isLoading, isDateBooked } = useBookedDates(equipmentId);
  const today = startOfDay(new Date());

  /**
   * Détermine si une date doit être désactivée
   */
  const isDateDisabled = (date: Date): boolean => {
    const dateToCheck = startOfDay(date);
    
    // Désactiver les dates passées
    if (isBefore(dateToCheck, today) && !isToday(date)) {
      return true;
    }

    // Désactiver les dates réservées
    return isDateBooked(date);
  };

  /**
   * Modificateurs pour styler les dates du calendrier
   */
  const modifiers = {
    booked: (date: Date) => isDateBooked(date),
    available: (date: Date) => {
      const dateToCheck = startOfDay(date);
      return !isBefore(dateToCheck, today) && !isDateBooked(date);
    },
  };

  const modifiersClassNames = {
    booked: 'bg-red-100 text-red-900 line-through opacity-50 cursor-not-allowed',
    available: 'bg-green-50 hover:bg-green-100 text-green-900',
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Chargement du calendrier...
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {!compact && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Disponibilité
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent className="space-y-4">
        {bookedDates.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Cet équipement a <strong>{bookedDates.length}</strong> jour(s) réservé(s).
              Les dates en rouge ne sont pas disponibles.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center">
          <Calendar
            mode="single"
            locale={fr}
            disabled={isDateDisabled}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            className="rounded-md border"
            numberOfMonths={compact ? 1 : 2}
          />
        </div>

        {showLegend && (
          <div className="flex flex-wrap gap-3 pt-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span className="text-muted-foreground">Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <span className="text-muted-foreground">Réservé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gray-300"></div>
              <span className="text-muted-foreground">Passé</span>
            </div>
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground">
          Les dates en blanc sont disponibles pour la réservation
        </p>
      </CardContent>
    </Card>
  );
};

export default AvailabilityCalendar;