
import React from 'react';
import { Package, Shield, Calendar, Euro } from 'lucide-react';
import { EquipmentData } from '@/types/supabase';

interface EquipmentFeaturesProps {
  equipment: EquipmentData;
}

export function EquipmentFeatures({ equipment }: EquipmentFeaturesProps) {
  return (
    <div className="pb-6 border-b border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {equipment.brand && (
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-gray-600" />
            <div>
              <div className="font-medium">Marque</div>
              <div className="text-gray-600 text-sm">{equipment.brand}</div>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-gray-600" />
          <div>
            <div className="font-medium">État</div>
            <div className="text-gray-600 text-sm">{equipment.condition}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-gray-600" />
          <div>
            <div className="font-medium">Disponibilité</div>
            <div className="text-gray-600 text-sm">{equipment.status}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Euro className="h-6 w-6 text-gray-600" />
          <div>
            <div className="font-medium">Caution</div>
            <div className="text-gray-600 text-sm">{equipment.deposit_amount?.toLocaleString()} FCFA</div>
          </div>
        </div>
      </div>
    </div>
  );
}
