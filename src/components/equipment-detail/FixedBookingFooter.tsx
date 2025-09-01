
import React from 'react';
import { Button } from '@/components/ui/button';
import { EquipmentData } from '@/types/supabase';

interface FixedBookingFooterProps {
  equipment: EquipmentData;
  onReservationClick: () => void;
}

export function FixedBookingFooter({ equipment, onReservationClick }: FixedBookingFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20 lg:block">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold">
              {equipment.daily_price?.toLocaleString()} FCFA
            </span>
            <span className="text-gray-600 text-sm">par jour</span>
          </div>
          <div className="text-sm text-gray-600">
            19–21 sept.
          </div>
        </div>
        
        <Button 
          onClick={onReservationClick}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium"
          disabled={equipment.status !== 'disponible'}
        >
          Réserver
        </Button>
      </div>
    </div>
  );
}
