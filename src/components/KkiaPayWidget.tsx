// src/components/KkiaPayWidget.tsx
// COMPOSANT REACT CORRIGÉ POUR LE WIDGET KKIAPAY

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface KkiaPayWidgetProps {
  amount: number;
  onSuccess: (response: any) => void;
  onError: (error: any) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

// Déclaration TypeScript pour le widget KkiaPay global
declare global {
  interface Window {
    openKkiapayWidget: (config: any) => void;
    addKkiapayListener: (event: string, callback: (response: any) => void) => void;
    kkiapay: any;
  }
}

export const KkiaPayWidget: React.FC<KkiaPayWidgetProps> = ({
  amount,
  onSuccess,
  onError,
  onCancel,
  disabled = false
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [kkiapayConfig, setKkiapayConfig] = useState<any>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Charger le script KkiaPay
  useEffect(() => {
    // Vérifier si le script est déjà chargé
    if (window.kkiapay) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.kkiapay.me/k.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ Script KkiaPay chargé');
      setScriptLoaded(true);
    };
    script.onerror = () => {
      console.error('❌ Erreur chargement script KkiaPay');
      onError(new Error('Impossible de charger le widget KkiaPay'));
    };
    
    document.head.appendChild(script);

    return () => {
      // Nettoyer le script lors du démontage
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [onError]);

  // Préparer la configuration KkiaPay et lancer le widget
  const handlePayment = async () => {
    if (!scriptLoaded) {
      toast({
        title: "Widget non prêt",
        description: "Le widget KkiaPay est en cours de chargement",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Étape 1: Préparer la transaction côté serveur
      console.log('🔄 Préparation de la transaction KkiaPay...');
      
      const { data, error } = await supabase.functions.invoke('create-kakiapay-recharge', {
        body: {
          amount: amount,
          currency: 'xof'
        }
      });

      if (error) throw error;

      if (!data?.kkiapay_config) {
        throw new Error('Configuration KkiaPay non reçue');
      }

      console.log('✅ Configuration KkiaPay reçue:', data.kkiapay_config);
      setKkiapayConfig(data.kkiapay_config);

      // Étape 2: Lancer le widget KkiaPay immédiatement
      launchKkiapayWidget(data.kkiapay_config);

    } catch (error: any) {
      console.error('❌ Erreur préparation KkiaPay:', error);
      onError(error);
      toast({
        title: "Erreur configuration",
        description: error.message || "Impossible de préparer le paiement",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Lancer le widget KkiaPay avec la configuration
  const launchKkiapayWidget = (config: any) => {
    try {
      console.log('🚀 Lancement du widget KkiaPay...');

      // Configuration du widget KkiaPay
      const widgetConfig = {
        amount: config.amount,
        api_key: config.api_key, 
        sandbox: true, // Mode test - changez à false en production
        data: config.external_reference, // Utiliser la référence externe
        name: user?.user_metadata?.full_name || user?.email || "Client",
        email: user?.email || "",
        phone: user?.user_metadata?.phone || "",
        reason: `Recharge portefeuille - ${config.amount} FCFA`,
        callback: (response: any) => {
          console.log('📞 Callback KkiaPay:', response);
          handleKkiapayCallback(response, config);
        }
      };

      console.log('📤 Configuration widget:', widgetConfig);

      // Méthode 1: Essayer openKkiapayWidget si disponible
      if (window.openKkiapayWidget) {
        window.openKkiapayWidget(widgetConfig);
      } 
      // Méthode 2: Essayer avec l'objet kkiapay global
      else if (window.kkiapay) {
        window.kkiapay(widgetConfig);
      }
      // Méthode 3: Créer le widget manuellement
      else {
        // Fallback: créer un élément kkiapay-widget
        const widgetElement = document.createElement('kkiapay-widget');
        widgetElement.setAttribute('amount', config.amount.toString());
        widgetElement.setAttribute('key', config.api_key);
        widgetElement.setAttribute('sandbox', 'true');
        widgetElement.setAttribute('data', config.external_reference);
        
        // Ajouter temporairement à la page pour déclencher le widget
        document.body.appendChild(widgetElement);
        
        // Nettoyer après 100ms
        setTimeout(() => {
          if (document.body.contains(widgetElement)) {
            document.body.removeChild(widgetElement);
          }
        }, 100);
      }

      setIsLoading(false);

    } catch (widgetError) {
      console.error('❌ Erreur lancement widget:', widgetError);
      onError(widgetError);
      setIsLoading(false);
    }
  };

  // Gestionnaire de callback KkiaPay
  const handleKkiapayCallback = async (response: any, config: any) => {
    console.log('🔄 Traitement du callback KkiaPay:', response);

    try {
      // Déterminer le statut basé sur la réponse KkiaPay
      const isSuccess = response.status === 'success' || 
                       response.status === 'SUCCESS' || 
                       response.status === 'PAID' ||
                       response.transactionId;

      if (isSuccess) {
        console.log('✅ Paiement KkiaPay réussi, vérification côté serveur...');
        
        // Vérifier la transaction côté serveur
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-wallet-recharge', {
          body: {
            transactionId: config.transaction_id, // UUID de la transaction en base
            payment_method: 'kakiapay'
          }
        });

        if (verifyError) throw verifyError;

        if (verifyData?.success) {
          onSuccess(verifyData);
          toast({
            title: "Recharge réussie !",
            description: `Votre portefeuille a été rechargé de ${verifyData.amount?.toLocaleString()} FCFA`,
          });
        } else {
          throw new Error(verifyData?.message || 'Vérification échouée');
        }
      } else if (response.status === 'failed' || response.status === 'FAILED') {
        throw new Error('Paiement échoué');
      } else if (response.status === 'pending' || response.status === 'PENDING') {
        toast({
          title: "Paiement en cours",
          description: "Votre paiement est en cours de traitement",
        });
      } else {
        // Paiement annulé ou autre statut
        console.log('🚫 Paiement annulé ou statut inconnu:', response.status);
        if (onCancel) onCancel();
      }
    } catch (error: any) {
      console.error('❌ Erreur callback:', error);
      onError(error);
      toast({
        title: "Erreur paiement",
        description: error.message || "Une erreur s'est produite lors du paiement",
        variant: "destructive"
      });
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || isLoading || !scriptLoaded}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Lancement KkiaPay...
        </>
      ) : !scriptLoaded ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Chargement widget...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          Payer avec KkiaPay - {amount.toLocaleString()} FCFA
        </>
      )}
    </Button>
  );
};

export default KkiaPayWidget;