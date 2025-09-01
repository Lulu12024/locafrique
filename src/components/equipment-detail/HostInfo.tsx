
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Shield, MessageCircle, Clock } from 'lucide-react';
import { ProfileData } from '@/types/supabase';

interface HostInfoProps {
  owner: ProfileData;
  onOwnerClick: () => void;
}

export function HostInfo({ owner, onOwnerClick }: HostInfoProps) {
  return (
    <div className="pb-6 border-b border-gray-200">
      <h3 className="text-xl font-semibold mb-4">Rencontrez votre hôte</h3>
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={owner.avatar_url} />
              <AvatarFallback className="bg-gray-200 text-gray-700 text-lg font-semibold">
                {owner.first_name[0]}{owner.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">
                {owner.first_name} {owner.last_name}
              </h3>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Star className="h-4 w-4 text-black fill-current" />
                <span>4.8 · Hôte depuis 2021</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-gray-600" />
              <span>Identité vérifiée</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MessageCircle className="h-4 w-4 text-gray-600" />
              <span>Taux de réponse : 100%</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-600" />
              <span>Répond en moins d'une heure</span>
            </div>
          </div>

          <Button variant="outline" className="w-full mt-4" onClick={onOwnerClick}>
            Contacter l'hôte
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
