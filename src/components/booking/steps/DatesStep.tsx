
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DatePickerWithRange from '@/components/DatePickerWithRange';
import { addDays, differenceInDays } from 'date-fns';
import { Calendar, ArrowRight } from 'lucide-react';

interface DatesStepProps {
  dateRange: { from: Date; to?: Date };
  setDateRange: (range: { from: Date; to?: Date }) => void;
  onNext: () => void;
}

export function DatesStep({ dateRange, setDateRange, onNext }: DatesStepProps) {
  const rentalDays = dateRange.to 
    ? differenceInDays(dateRange.to, dateRange.from) + 1 
    : 1;

  const isValid = dateRange.from && dateRange.to;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          Sélectionnez vos dates de location
        </CardTitle>
        <p className="text-gray-600">
          Choisissez la période pendant laquelle vous souhaitez louer ce matériel
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        </div>
        
        {isValid && (
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-blue-800 font-medium">
              Durée sélectionnée : {rentalDays} jour{rentalDays > 1 ? 's' : ''}
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button 
            onClick={onNext} 
            disabled={!isValid}
            className="min-w-32"
          >
            Continuer
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
