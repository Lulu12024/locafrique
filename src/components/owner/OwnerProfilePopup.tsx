
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProfileData } from '@/types/supabase';
import { MapPin, Calendar, Shield, MessageCircle } from 'lucide-react';
import { OwnerRating } from '@/components/reviews/OwnerRating';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface OwnerProfilePopupProps {
  owner: ProfileData;
  isOpen: boolean;
  onClose: () => void;
  equipmentCount: number;
}

export function OwnerProfilePopup({ owner, isOpen, onClose, equipmentCount }: OwnerProfilePopupProps) {
  const memberSince = owner.created_at ? format(new Date(owner.created_at), 'MMMM yyyy', { locale: fr }) : 'Date inconnue';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Profil du propriétaire</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Info propriétaire */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={owner.avatar_url} />
              <AvatarFallback className="bg-green-100 text-green-700 text-lg font-semibold">
                {owner.first_name[0]}{owner.last_name[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h3 className="text-xl font-semibold">
                {owner.first_name} {owner.last_name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Hôte vérifié</span>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold">{equipmentCount}</div>
              <div className="text-sm text-gray-600">Équipements</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <OwnerRating ownerId={owner.id} showDetails={false} />
              <div className="text-sm text-gray-600 mt-1">Note moyenne</div>
            </div>
          </div>

          {/* Informations détaillées */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>Membre depuis {memberSince}</span>
            </div>
            
            {owner.city && owner.country && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{owner.city}, {owner.country}</span>
              </div>
            )}
          </div>

          {/* Badge de vérification */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <Shield className="h-3 w-3 mr-1" />
              Identité vérifiée
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                // TODO: Implémenter la messagerie
                onClose();
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contacter
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                // TODO: Voir tous les équipements du propriétaire
                onClose();
              }}
            >
              Voir ses équipements
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
