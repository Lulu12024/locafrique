
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Euro, 
  MapPin,
  Tag,
  Shield
} from 'lucide-react';
import { EquipmentData } from '@/types/supabase';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReservationSummaryProps {
  equipment: EquipmentData;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  depositAmount: number;
}

export function ReservationSummary({
  equipment,
  startDate,
  endDate,
  totalPrice,
  depositAmount
}: ReservationSummaryProps) {
  const rentalDays = differenceInDays(endDate, startDate) + 1;
  const totalToPay = totalPrice + depositAmount;

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg">Récapitulatif de la réservation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Equipment summary */}
        <div className="space-y-2">
          <h4 className="font-medium">{equipment.title}</h4>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-3 w-3" />
            <span>{equipment.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Tag className="h-3 w-3" />
            <span>{equipment.category}</span>
            {equipment.subcategory && (
              <>
                <span>•</span>
                <span>{equipment.subcategory}</span>
              </>
            )}
          </div>
        </div>

        <Separator />

        {/* Rental period */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Période de location</span>
          </div>
          <div className="ml-6 space-y-1">
            <p className="text-sm">
              <span className="font-medium">Début:</span> {format(startDate, 'EEEE dd MMMM yyyy', { locale: fr })}
            </p>
            <p className="text-sm">
              <span className="font-medium">Fin:</span> {format(endDate, 'EEEE dd MMMM yyyy', { locale: fr })}
            </p>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="h-3 w-3" />
              <span>{rentalDays} jour{rentalDays > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Price breakdown */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Euro className="h-4 w-4 text-green-500" />
            <span className="font-medium">Détail des coûts</span>
          </div>
          
          <div className="ml-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Prix journalier:</span>
              <span>{equipment.daily_price} FCFA</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Nombre de jours:</span>
              <span>{rentalDays}</span>
            </div>
            
            {equipment.weekly_price && rentalDays >= 7 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Tarif hebdomadaire appliqué:</span>
                <span>-{(rentalDays * equipment.daily_price) - totalPrice} FCFA</span>
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-between font-medium">
              <span>Sous-total location:</span>
              <span>{totalPrice} FCFA</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-blue-500" />
                <span>Caution (remboursable):</span>
              </div>
              <span>{depositAmount} FCFA</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between text-lg font-bold text-primary">
              <span>Total à payer:</span>
              <span>{totalToPay} FCFA</span>
            </div>
          </div>
        </div>

        {/* Additional info */}
        <div className="bg-blue-50 p-3 rounded-md">
          <p className="text-xs text-blue-800">
            💡 <strong>Bon à savoir:</strong> La caution vous sera intégralement restituée 
            après vérification de l'état du matériel lors de la restitution.
          </p>
        </div>

        {equipment.rental_conditions && (
          <div className="bg-yellow-50 p-3 rounded-md">
            <p className="text-xs font-medium text-yellow-800 mb-1">Conditions particulières:</p>
            <p className="text-xs text-yellow-700">{equipment.rental_conditions}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
