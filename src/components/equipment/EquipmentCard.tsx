// src/components/equipment/EquipmentCard.tsx
// Composant de carte d'équipement avec gestion des statuts

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Crown, 
  Eye,
  MapPin,
  Star
} from 'lucide-react';
import { EquipmentData } from '@/types/supabase';
import { useIsMobile } from '@/hooks/use-mobile';

interface EquipmentCardProps {
  equipment: EquipmentData;
  showStatus?: boolean; // Pour afficher ou masquer les badges de statut
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({
  equipment,
  showStatus = true,
  onClick,
  onEdit,
  onDelete
}) => {
  const isMobile = useIsMobile();

  const getStatusConfig = (status: string, moderationStatus: string) => {
    if (moderationStatus === 'pending') {
      return {
        label: 'En attente de validation',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: Clock,
        description: 'Votre équipement est en cours de validation par notre équipe'
      };
    }
    
    if (moderationStatus === 'rejected') {
      return {
        label: 'Nécessite des modifications',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
        description: 'Des modifications sont requises avant publication'
      };
    }
    
    if (moderationStatus === 'approved' && status === 'disponible') {
      return {
        label: 'Publié',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        description: 'Votre équipement est visible et disponible à la location'
      };
    }
    
    if (status === 'loue') {
      return {
        label: 'En location',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Package,
        description: 'Actuellement loué'
      };
    }
    
    return {
      label: status,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: Package,
      description: ''
    };
  };

  const statusConfig = getStatusConfig(equipment.status, equipment.moderation_status || 'approved');
  const StatusIcon = statusConfig.icon;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non défini';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card 
      className={`
        cursor-pointer hover:shadow-md transition-all duration-200
        ${equipment.is_premium ? 'ring-2 ring-yellow-400 shadow-lg' : ''}
        ${isMobile ? 'border-gray-200' : ''}
      `}
      onClick={onClick}
    >
      <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
        {/* Image avec badge premium */}
        <div className="relative mb-3">
          <div className={`
            bg-gray-200 rounded-lg flex items-center justify-center
            ${isMobile ? 'h-32' : 'h-40'}
          `}>
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          
          {/* Badge Premium */}
          {equipment.is_premium && (
            <Badge className="absolute top-2 right-2 bg-yellow-500 hover:bg-yellow-600 text-yellow-900">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>
        
        {/* Contenu principal */}
        <div className="space-y-3">
          {/* Titre */}
          <h3 className={`font-semibold line-clamp-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
            {equipment.title}
          </h3>
          
          {/* Localisation */}
          <div className="flex items-center text-gray-600">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className={`${isMobile ? 'text-xs' : 'text-sm'} truncate`}>
              {equipment.location}
            </span>
          </div>
          
          {/* Prix */}
          <div className="flex items-center justify-between">
            <span className={`font-bold text-green-600 ${isMobile ? 'text-sm' : 'text-base'}`}>
              {equipment.daily_price.toLocaleString()} FCFA/jour
            </span>
            
            {equipment.condition && (
              <span className={`text-xs text-gray-500 ${isMobile ? '' : 'ml-2'}`}>
                État: {equipment.condition}
              </span>
            )}
          </div>
          
          {/* Statut et informations de validation */}
          {showStatus && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${statusConfig.color} flex items-center gap-1`}
                >
                  <StatusIcon className="h-3 w-3" />
                  {statusConfig.label}
                </Badge>
                
                {equipment.moderation_status === 'approved' && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Eye className="h-3 w-3 mr-1" />
                    Visible
                  </div>
                )}
              </div>
              
              {/* Informations détaillées selon le statut */}
              {equipment.moderation_status === 'pending' && (
                <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                  <p>⏳ En attente de validation par l'équipe 3W-LOC</p>
                  <p className="text-orange-500 mt-1">
                    Soumis le {formatDate(equipment.created_at)}
                  </p>
                </div>
              )}
              
              {equipment.moderation_status === 'rejected' && equipment.rejection_reason && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  <p className="font-medium">❌ Modifications requises :</p>
                  <p className="mt-1">{equipment.rejection_reason}</p>
                  {equipment.rejected_at && (
                    <p className="text-red-500 mt-1">
                      Rejeté le {formatDate(equipment.rejected_at)}
                    </p>
                  )}
                </div>
              )}
              
              {equipment.moderation_status === 'approved' && equipment.approved_at && (
                <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                  <p>✅ Approuvé et publié</p>
                  <p className="text-green-500 mt-1">
                    Le {formatDate(equipment.approved_at)}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Actions selon le statut */}
          {showStatus && (
            <div className="flex gap-2 pt-2">
              {equipment.moderation_status === 'rejected' && onEdit && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  Modifier
                </Button>
              )}
              
              {equipment.moderation_status === 'approved' && onEdit && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  Éditer
                </Button>
              )}
              
              {onDelete && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  Supprimer
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EquipmentCard;