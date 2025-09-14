// src/pages/WalletRechargeSuccess.tsx
// PAGE DE CALLBACK POUR TRAITER LES SUCCÈS DE PAIEMENT KKIAPAY

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Wallet, 
  ArrowRight, 
  Clock,
  AlertCircle,
  Loader2,
  RefreshCcw
} from 'lucide-react';
import { useAuth } from '@/hooks/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export default function WalletRechargeSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Extraire les paramètres de l'URL
  const transactionId = searchParams.get('transaction_id') || searchParams.get('data');
  const amount = searchParams.get('amount');
  const status = searchParams.get('status');

  useEffect(() => {
    if (transactionId) {
      verifyKkiaPayPayment();
    } else {
      setVerificationStatus('failed');
      setIsLoading(false);
    }
  }, [transactionId]);

  const verifyKkiaPayPayment = async () => {
    try {
      setIsLoading(true);
      
      // Appeler la fonction de vérification côté serveur
      const { data, error } = await supabase.functions.invoke('verify-wallet-recharge', {
        body: {
          transactionId: transactionId,
          payment_method: 'kakiapay'
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success && data?.status === 'paid') {
        setVerificationStatus('success');
        setPaymentDetails(data);
        
        toast({
          title: "Recharge réussie !",
          description: `Votre portefeuille a été rechargé de ${data.amount?.toLocaleString()} FCFA`,
          duration: 5000
        });
      } else {
        setVerificationStatus('failed');
        toast({
          title: "Échec de la vérification",
          description: "Le paiement n'a pas pu être confirmé.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Erreur vérification paiement KkiaPay:', error);
      setVerificationStatus('failed');
      toast({
        title: "Erreur de vérification",
        description: error.message || "Une erreur s'est produite lors de la vérification.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setVerificationStatus('verifying');
    setIsLoading(true);
    verifyKkiaPayPayment();
  };

  const handleGoToWallet = () => {
    navigate('/my-wallet');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        
        {/* Statut de vérification */}
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              {verificationStatus === 'verifying' && (
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
              )}
              
              {verificationStatus === 'success' && (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              )}
              
              {verificationStatus === 'failed' && (
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              )}
            </div>
            
            <CardTitle className="text-xl">
              {verificationStatus === 'verifying' && 'Vérification en cours...'}
              {verificationStatus === 'success' && 'Paiement confirmé !'}
              {verificationStatus === 'failed' && 'Vérification échouée'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {verificationStatus === 'verifying' && (
              <div className="space-y-2">
                <p className="text-gray-600">
                  Nous vérifions votre paiement KkiaPay...
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Transaction ID: {transactionId}</span>
                </div>
              </div>
            )}
            
            {verificationStatus === 'success' && paymentDetails && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Montant rechargé:</span>
                      <span className="font-medium text-green-700">
                        {paymentDetails.amount?.toLocaleString()} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nouveau solde:</span>
                      <span className="font-medium text-green-700">
                        {paymentDetails.new_balance?.toLocaleString()} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transaction:</span>
                      <span className="font-mono text-xs">{transactionId}</span>
                    </div>
                  </div>
                </div>
                
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Paiement KkiaPay confirmé
                </Badge>
              </div>
            )}
            
            {verificationStatus === 'failed' && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Le paiement n'a pas pu être vérifié. Cela peut être temporaire.
                </p>
                
                <div className="text-sm text-gray-500">
                  {transactionId && (
                    <p>Transaction ID: {transactionId}</p>
                  )}
                  {amount && (
                    <p>Montant: {amount} FCFA</p>
                  )}
                </div>
                
                <Button 
                  onClick={handleRetry}
                  variant="outline"
                  disabled={isLoading}
                  className="w-full"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Réessayer la vérification
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          {verificationStatus === 'success' && (
            <Button 
              onClick={handleGoToWallet}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Voir mon portefeuille
            </Button>
          )}
          
          <Button 
            onClick={handleGoHome}
            variant="outline"
            className="w-full"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Button>
        </div>

        {/* Information de support */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-center text-sm text-blue-700">
              <p className="font-medium mb-1">Besoin d'aide ?</p>
              <p>
                Si vous rencontrez des problèmes, contactez notre support 
                avec votre ID de transaction.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}