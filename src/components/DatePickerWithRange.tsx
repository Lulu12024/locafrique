
import * as React from "react";
import { addDays, format, isBefore, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

interface DatePickerWithRangeProps {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  className?: string;
  buttonClassName?: string;
}

const DatePickerWithRange: React.FC<DatePickerWithRangeProps> = ({
  date,
  setDate,
  className,
  buttonClassName,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const today = startOfDay(new Date());
  
  const handleDateSelect = (selectedRange: DateRange | undefined) => {
    console.log('📅 Date sélectionnée dans DatePickerWithRange:', selectedRange);
    
    if (selectedRange?.from && selectedRange?.to) {
      // Vérifier que les dates ne sont pas dans le passé
      const fromDate = startOfDay(selectedRange.from);
      const toDate = startOfDay(selectedRange.to);
      
      if (isBefore(fromDate, today) || isBefore(toDate, today)) {
        console.log('❌ Dates dans le passé détectées, correction...');
        return;
      }
    }
    
    setDate(selectedRange);
  };

  const isDateDisabled = (date: Date) => {
    // Désactiver les dates passées
    return isBefore(startOfDay(date), today);
  };

  const formatDateDisplay = () => {
    if (!date?.from) {
      return "Sélectionner les dates";
    }
    
    if (date.from && !date.to) {
      return format(date.from, "d MMM yyyy", { locale: fr });
    }
    
    if (date.from && date.to) {
      return `${format(date.from, "d MMM", { locale: fr })} - ${format(date.to, "d MMM yyyy", { locale: fr })}`;
    }
    
    return "Sélectionner les dates";
  };

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-12 px-4",
              !date?.from && "text-muted-foreground",
              buttonClassName
            )}
            onClick={() => setIsOpen(true)}
          >
            <CalendarIcon className="mr-3 h-5 w-5 flex-shrink-0" />
            <span className="truncate">{formatDateDisplay()}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 z-[10000]" 
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from || new Date()}
            selected={date}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            className="p-4 pointer-events-auto"
            disabled={isDateDisabled}
            locale={fr}
            modifiers={{
              disabled: isDateDisabled
            }}
            modifiersStyles={{
              disabled: { color: '#ccc', textDecoration: 'line-through' }
            }}
          />
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {date?.from && date?.to && (
                  <>
                    Durée: {Math.max(1, Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24)) + 1)} jour(s)
                  </>
                )}
              </span>
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
                className="ml-4 bg-blue-600 hover:bg-blue-700"
                disabled={!date?.from || !date?.to}
              >
                Confirmer
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePickerWithRange;
