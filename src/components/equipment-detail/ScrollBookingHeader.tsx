
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EquipmentData } from '@/types/supabase';

interface ScrollBookingHeaderProps {
  equipment: EquipmentData;
  onReservationClick: () => void;
  rentalDays?: number;
  totalPrice?: number;
  isVisible: boolean;
}

export function ScrollBookingHeader({ 
  equipment, 
  onReservationClick, 
  rentalDays = 7, 
  totalPrice,
  isVisible 
}: ScrollBookingHeaderProps) {
  const calculatedTotal = totalPrice || (equipment.daily_price * rentalDays + 2500);

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-md transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Owner info */}
          <div className="flex items-center gap-3">
            {equipment.owner && (
              <>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={equipment.owner.avatar_url} />
                  <AvatarFallback className="bg-gray-200 text-gray-700 font-semibold">
                    {equipment.owner.first_name?.[0]}{equipment.owner.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-gray-900">
                    {equipment.owner.first_name} {equipment.owner.last_name}
                  </div>
                  <div className="text-sm text-gray-600">
                    Propriétaire
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Center: Price info */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-semibold text-gray-900">
                  {equipment.daily_price?.toLocaleString()} FCFA
                </span>
                <span className="text-sm text-gray-600">par jour</span>
              </div>
              <div className="text-sm text-gray-600">
                {rentalDays} jour{rentalDays > 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {calculatedTotal.toLocaleString()} FCFA
              </div>
              <div className="text-sm text-gray-600">
                Total
              </div>
            </div>
          </div>

          {/* Right: Reserve button */}
          <Button 
            onClick={onReservationClick}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 font-semibold"
            disabled={equipment.status !== 'disponible'}
            size="lg"
          >
            Réserver maintenant
          </Button>
        </div>
      </div>
    </div>
  );
}
