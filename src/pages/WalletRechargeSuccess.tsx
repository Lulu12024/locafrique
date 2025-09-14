// src/pages/WalletRechargeSuccess.tsx

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Wallet, 
  ArrowRight, 
  Download,
  Mail,
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
  
  const sessionId = searchParams.get('session_id');
  const transactionId = searchParams.get('transaction_id');
  const paymentMethod = searchParams.get('payment_method') || 'stripe';

  useEffect(() => {
    if ((sessionId && paymentMethod === 'stripe') || (transactionId && paymentMethod === 'kakiapay')) {
      verifyPayment();
    } else {
      setVerificationStatus('failed');
      setIsLoading(false);
    }
  }, [sessionId, transactionId, paymentMethod]);

  const verifyPayment = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('verify-wallet-recharge', {
        body: {
          sessionId: sessionId,
          transactionId: transactionId,
          payment_method: paymentMethod
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success && data?.status === 'paid') {
        setVerificationStatus('success');
        setPaymentDetails(data);
        
        toast({
          title: "🎉 Recharge réussie !",
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
      console.error('Erreur vérification paiement:', error);
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

  const renderVerificationContent = () => {
    if (verificationStatus === 'verifying' || isLoading) {
      return (
        <div className="text-center py-12">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Vérification en cours...
          </h2>
          <p className="text-gray-600">
            Nous vérifions votre paiement. Cela peut prendre quelques instants.
          </p>
        </div>
      );
    }

    if (verificationStatus === 'success') {
      return (
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Recharge réussie !
          </h1>
          <p className="text-gray-600 mb-8">
            Votre portefeuille a été rechargé avec succès
          </p>

          {/* Détails du paiement */}
          <Card className="max-w-md mx-auto mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-center text-lg">
                <Wallet className="mr-2 h-5 w-5" />
                Détails de la recharge
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Montant rechargé:</span>
                <span className="font-bold text-green-600 text-lg">
                  +{paymentDetails?.amount?.toLocaleString()} FCFA
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Nouveau solde:</span>
                <span className="font-bold text-blue-600 text-lg">
                  {paymentDetails?.new_balance?.toLocaleString()} FCFA
                </span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Méthode:</span>
                <Badge variant="outline">
                  {paymentMethod === 'stripe' ? 'Stripe' : 'KakiaPay'}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Date:</span>
                <span className="text-sm">
                  {new Date().toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/my-wallet')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Voir mon portefeuille
            </Button>
            
            <Button
              onClick={() => navigate('/equipments')}
              variant="outline"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Parcourir les équipements
            </Button>
          </div>

          {/* Informations supplémentaires */}
          <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-left">
                <h4 className="font-medium text-blue-900">Confirmation par email</h4>
                <p className="text-blue-700 text-sm mt-1">
                  Un email de confirmation a été envoyé à votre adresse. 
                  Conservez-le comme justificatif de votre recharge.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Cas d'échec
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-12 w-12 text-red-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Échec de la recharge
        </h1>
        <p className="text-gray-600 mb-8">
          Nous n'avons pas pu confirmer votre paiement
        </p>

        <Card className="max-w-md mx-auto mb-8 border-red-200">
          <CardContent className="p-6">
            <div className="text-left space-y-3">
              <h4 className="font-medium text-red-900">Que s'est-il passé ?</h4>
              <ul className="text-red-700 text-sm space-y-1">
                <li>• Le paiement a peut-être été annulé</li>
                <li>• Une erreur technique s'est produite</li>
                <li>• Les informations de paiement étaient incorrectes</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Actions pour l'échec */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={verifyPayment}
            variant="outline"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 h-4 w-4" />
            )}
            Vérifier à nouveau
          </Button>
          
          <Button
            onClick={() => navigate('/my-wallet')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Wallet className="mr-2 h-4 w-4" />
            Retour au portefeuille
          </Button>
        </div>

        {/* Support */}
        <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">
            Si le problème persiste, contactez notre support à{' '}
            <a href="mailto:support@votre-plateforme.com" className="text-blue-600 hover:underline">
              support@votre-plateforme.com
            </a>
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {renderVerificationContent()}
      </div>
    </div>
  );
}
