// src/components/booking/SingleDatePickerSimple.tsx
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SingleDatePickerSimpleProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  label: string;
  placeholder?: string;
  minDate?: Date;
  className?: string;
}

export const SingleDatePickerSimple: React.FC<SingleDatePickerSimpleProps> = ({
  date,
  setDate,
  label,
  placeholder = 'Sélectionner une date',
  minDate,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const today = startOfDay(new Date());

  const isDateDisabled = (dateToCheck: Date): boolean => {
    const checkDate = startOfDay(dateToCheck);
    
    // Désactiver les dates passées
    if (isBefore(checkDate, today)) {
      return true;
    }

    // Désactiver si avant minDate
    if (minDate && isBefore(checkDate, startOfDay(minDate))) {
      return true;
    }

    return false;
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    console.log(`📅 ${label} sélectionnée:`, selectedDate);
    setDate(selectedDate);
    setIsOpen(false);
  };

  const formatDateDisplay = (): string => {
    if (!date) return placeholder;
    try {
      return format(date, 'EEEE d MMMM yyyy', { locale: fr });
    } catch (err) {
      return date.toLocaleDateString('fr-FR');
    }
  };

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal h-12 px-4',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-3 h-5 w-5" />
            <span className="truncate">{formatDateDisplay()}</span>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-auto p-0 z-[10000]" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            locale={fr}
            disabled={isDateDisabled}
            className="rounded-md border"
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SingleDatePickerSimple;