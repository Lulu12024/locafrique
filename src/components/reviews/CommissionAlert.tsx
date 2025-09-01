
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, CreditCard } from 'lucide-react';

interface CommissionAlertProps {
  commissionAmount: number;
  rating: number;
  onPayCommission: () => void;
  isLoading?: boolean;
}

export function CommissionAlert({ 
  commissionAmount, 
  rating, 
  onPayCommission, 
  isLoading = false 
}: CommissionAlertProps) {
  const isPendingPayment = rating >= 4;

  return (
    <Alert className={`mb-4 ${isPendingPayment ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
      <AlertCircle className={`h-4 w-4 ${isPendingPayment ? 'text-amber-600' : 'text-blue-600'}`} />
      <AlertTitle className={isPendingPayment ? 'text-amber-800' : 'text-blue-800'}>
        {isPendingPayment ? 'Commission requise' : 'Commission à régulariser'}
      </AlertTitle>
      <AlertDescription className={`${isPendingPayment ? 'text-amber-700' : 'text-blue-700'} space-y-3`}>
        <p>
          {isPendingPayment 
            ? `Cette évaluation de ${rating} étoiles nécessite le paiement d'une commission de ${commissionAmount} FCFA pour être publiée publiquement.`
            : `Une commission de ${commissionAmount} FCFA est due pour cette évaluation de ${rating} étoiles (pour suivi et régularisation).`
          }
        </p>
        
        {isPendingPayment && (
          <Button
            onClick={onPayCommission}
            disabled={isLoading}
            className="bg-amber-600 hover:bg-amber-700 text-white"
            size="sm"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {isLoading ? 'Traitement...' : `Payer ${commissionAmount} FCFA`}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
