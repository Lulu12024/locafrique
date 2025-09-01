
import { useState } from 'react';
import { EquipmentData } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import DatePickerWithRange from '@/components/DatePickerWithRange';
import { addDays, differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/auth';
import { ReservationPopup } from '@/components/booking/ReservationPopup';

interface RentalPanelProps {
  equipment: EquipmentData;
}

export function RentalPanel({ equipment }: RentalPanelProps) {
  const { user, loading: authLoading, authCheckComplete } = useAuth();
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to?: Date;
  }>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });
  
  const [isReservationPopupOpen, setIsReservationPopupOpen] = useState(false);
  
  const rentalDays = dateRange.to 
    ? differenceInDays(dateRange.to, dateRange.from) + 1 
    : 1;
    
  // Calculate rental price based on daily and weekly rates
  const calculateTotalPrice = () => {
    if (!dateRange.to) return equipment.daily_price;
    
    if (equipment.weekly_price && rentalDays >= 7) {
      const weeks = Math.floor(rentalDays / 7);
      const remainingDays = rentalDays % 7;
      return (weeks * equipment.weekly_price) + (remainingDays * equipment.daily_price);
    } else {
      return rentalDays * equipment.daily_price;
    }
  };
  
  const totalPrice = calculateTotalPrice();
  
  // Show loading while checking auth
  if (authLoading || !authCheckComplete) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Chargement...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Réserver ce matériel</CardTitle>
          <CardDescription>
            {equipment.daily_price} FCFA / jour
            {equipment.weekly_price && (
              <> · {equipment.weekly_price} FCFA / semaine</>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="mr-2 h-4 w-4" />
            <span>
              Durée: {rentalDays} jour{rentalDays > 1 ? 's' : ''}
            </span>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Prix journalier:</span>
              <span>{equipment.daily_price} FCFA</span>
            </div>
            
            {equipment.weekly_price && rentalDays >= 7 && (
              <div className="flex justify-between text-green-600">
                <span>Tarif hebdomadaire appliqué:</span>
                <span>{equipment.weekly_price} FCFA/semaine</span>
              </div>
            )}
            
            <div className="flex justify-between font-bold">
              <span>Montant total:</span>
              <span>{totalPrice} FCFA</span>
            </div>
            
            <div className="flex justify-between">
              <span>Caution (remboursable):</span>
              <span>{equipment.deposit_amount} FCFA</span>
            </div>
            
            <div className="flex justify-between text-primary font-bold">
              <span>Total à payer:</span>
              <span>{totalPrice + equipment.deposit_amount} FCFA</span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            className="w-full bg-green-600 hover:bg-green-700" 
            size="lg"
            onClick={() => setIsReservationPopupOpen(true)}
          >
            Réserver maintenant
          </Button>
        </CardFooter>
      </Card>

      <ReservationPopup
        equipment={equipment}
        isOpen={isReservationPopupOpen}
        onClose={() => setIsReservationPopupOpen(false)}
        onComplete={() => {
          setIsReservationPopupOpen(false);
          // Vous pouvez ajouter d'autres actions ici si nécessaire
        }}
      />
    </>
  );
}
