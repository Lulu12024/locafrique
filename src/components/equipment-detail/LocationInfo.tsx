
import React from 'react';
import { MapPin } from 'lucide-react';

interface LocationInfoProps {
  city: string;
  country: string;
}

export function LocationInfo({ city, country }: LocationInfoProps) {
  return (
    <div className="pb-6">
      <h3 className="text-xl font-semibold mb-4">Où vous récupérerez l'équipement</h3>
      <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">{city}, {country}</p>
        </div>
      </div>
    </div>
  );
}
