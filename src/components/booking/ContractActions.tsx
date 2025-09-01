
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Mail,
  User
} from 'lucide-react';
import { BookingData } from '@/types/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ContractActionsProps {
  booking: BookingData;
  isCurrentUserOwner: boolean;
  onGenerateContract: () => void;
  onDownloadContract: () => void;
  onSignContract: () => void;
  isGenerating: boolean;
  contractUrl?: string;
}

export function ContractActions({ 
  booking, 
  isCurrentUserOwner,
  onGenerateContract,
  onDownloadContract,
  onSignContract,
  isGenerating,
  contractUrl 
}: ContractActionsProps) {
  const getContractStatus = () => {
    if (!contractUrl) {
      return {
        status: 'not_generated',
        label: 'Non généré',
        color: 'bg-gray-500',
        icon: FileText
      };
    }

    if (booking.renter_signature && booking.owner_signature) {
      return {
        status: 'completed',
        label: 'Signé par les deux parties',
        color: 'bg-green-500',
        icon: CheckCircle
      };
    }

    if (isCurrentUserOwner) {
      if (booking.owner_signature) {
        return {
          status: 'waiting_renter',
          label: 'En attente de signature du locataire',
          color: 'bg-yellow-500',
          icon: Clock
        };
      } else {
        return {
          status: 'pending_owner',
          label: 'À signer par vous',
          color: 'bg-blue-500',
          icon: AlertTriangle
        };
      }
    } else {
      if (booking.renter_signature) {
        return {
          status: 'waiting_owner',
          label: 'En attente de signature du propriétaire',
          color: 'bg-yellow-500',
          icon: Clock
        };
      } else {
        return {
          status: 'pending_renter',
          label: 'À signer par vous',
          color: 'bg-blue-500',
          icon: AlertTriangle
        };
      }
    }
  };

  const contractStatus = getContractStatus();
  const StatusIcon = contractStatus.icon;
  const currentUserHasSigned = isCurrentUserOwner ? booking.owner_signature : booking.renter_signature;
  const canSign = contractUrl && !currentUserHasSigned;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contrat de location
          </CardTitle>
          <Badge className={`${contractStatus.color} text-white`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {contractStatus.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Contract details summary */}
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-600">Matériel:</span>
            <span className="font-medium">{booking.equipment?.title}</span>
            
            <span className="text-gray-600">Période:</span>
            <span>
              {format(new Date(booking.start_date), 'dd MMM', { locale: fr })} - {' '}
              {format(new Date(booking.end_date), 'dd MMM yyyy', { locale: fr })}
            </span>
            
            <span className="text-gray-600">Montant:</span>
            <span className="font-medium">{booking.total_price} FCFA</span>
            
            <span className="text-gray-600">Caution:</span>
            <span>{booking.deposit_amount} FCFA</span>
          </div>
        </div>

        {/* Signature status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">État des signatures</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-400" />
              <span>Propriétaire:</span>
              {booking.owner_signature ? (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Signé
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                  <Clock className="h-3 w-3 mr-1" />
                  En attente
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-400" />
              <span>Locataire:</span>
              {booking.renter_signature ? (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Signé
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                  <Clock className="h-3 w-3 mr-1" />
                  En attente
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          {!contractUrl ? (
            <Button 
              onClick={onGenerateContract}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Générer le contrat
                </>
              )}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onDownloadContract}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
              
              {canSign && (
                <Button onClick={onSignContract} className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Signer le contrat
                </Button>
              )}
              
              {currentUserHasSigned && !canSign && (
                <Button variant="secondary" disabled className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Vous avez signé
                </Button>
              )}
            </>
          )}
        </div>

        {/* Next steps information */}
        {contractUrl && (
          <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
            {contractStatus.status === 'completed' ? (
              <p>✅ Contrat complètement signé. La réservation est confirmée.</p>
            ) : contractStatus.status === 'pending_owner' && isCurrentUserOwner ? (
              <p>📋 Veuillez signer le contrat pour confirmer la réservation.</p>
            ) : contractStatus.status === 'pending_renter' && !isCurrentUserOwner ? (
              <p>📋 Veuillez signer le contrat pour confirmer votre réservation.</p>
            ) : contractStatus.status === 'waiting_renter' ? (
              <p>⏳ En attente de la signature du locataire.</p>
            ) : contractStatus.status === 'waiting_owner' ? (
              <p>⏳ En attente de la signature du propriétaire.</p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
