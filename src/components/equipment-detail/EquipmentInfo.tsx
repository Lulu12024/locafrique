
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EquipmentData } from '@/types/supabase';

interface EquipmentInfoProps {
  equipment: EquipmentData;
  onOwnerClick: () => void;
}

export function EquipmentInfo({ equipment, onOwnerClick }: EquipmentInfoProps) {
  return (
    <div className="pb-6 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-1">
            {equipment.category} proposé par {equipment.owner?.first_name}
          </h2>
          <div className="flex items-center gap-2 text-gray-600">
            <Badge variant="secondary" className="bg-gray-100">
              {equipment.subcategory || equipment.category}
            </Badge>
            <span>·</span>
            <span>{equipment.condition}</span>
            {equipment.year && (
              <>
                <span>·</span>
                <span>{equipment.year}</span>
              </>
            )}
          </div>
        </div>
        {equipment.owner && (
          <Avatar className="h-14 w-14 cursor-pointer" onClick={onOwnerClick}>
            <AvatarImage src={equipment.owner.avatar_url} />
            <AvatarFallback className="bg-gray-200 text-gray-700 text-lg font-semibold">
              {equipment.owner.first_name[0]}{equipment.owner.last_name[0]}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}
