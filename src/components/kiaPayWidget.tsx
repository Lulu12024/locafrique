// src/components/KkiaPayWidget.tsx
// COMPOSANT REACT POUR LE WIDGET KKIAPAY

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
    const script = document.createElement('script');
    script.src = 'https://cdn.kkiapay.me/k.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ Script KkiaPay chargé');
      setScriptLoaded(true);
      
      // Configurer les listeners KkiaPay
      if (window.addKkiapayListener) {
        window.addKkiapayListener('success', handleKkiapaySuccess);
        window.addKkiapayListener('failed', handleKkiapayError);
        window.addKkiapayListener('pending', handleKkiapayPending);
      }
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
  }, []);

  // Préparer la configuration KkiaPay
  const prepareKkiapayConfig = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('create-kakiapay-recharge', {
        body: {
          amount: amount,
          currency: 'xof'
        }
      });

      if (error) throw error;

      if (data?.kkiapay_config) {
        setKkiapayConfig(data.kkiapay_config);
        console.log('✅ Configuration KkiaPay préparée:', data.kkiapay_config);
      } else {
        throw new Error('Configuration KkiaPay non reçue');
      }
    } catch (error: any) {
      console.error('❌ Erreur préparation KkiaPay:', error);
      onError(error);
      toast({
        title: "Erreur configuration",
        description: error.message || "Impossible de préparer le paiement",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Gestionnaires d'événements KkiaPay
  const handleKkiapaySuccess = async (response: any) => {
    console.log('✅ Paiement KkiaPay réussi:', response);
    
    try {
      // Vérifier la transaction côté serveur
      const { data, error } = await supabase.functions.invoke('verify-wallet-recharge', {
        body: {
          transactionId: response.transactionId || kkiapayConfig?.transaction_id,
          payment_method: 'kakiapay'
        }
      });

      if (error) throw error;

      if (data?.success) {
        onSuccess(data);
        toast({
          title: "Recharge réussie !",
          description: `Votre portefeuille a été rechargé de ${data.amount?.toLocaleString()} FCFA`,
        });
      } else {
        throw new Error(data?.message || 'Vérification échouée');
      }
    } catch (error: any) {
      console.error('❌ Erreur vérification:', error);
      onError(error);
      toast({
        title: "Erreur vérification",
        description: "Le paiement n'a pas pu être vérifié",
        variant: "destructive"
      });
    }
  };

  const handleKkiapayError = (response: any) => {
    console.error('❌ Erreur paiement KkiaPay:', response);
    onError(response);
    toast({
      title: "Paiement échoué",
      description: "Une erreur s'est produite lors du paiement",
      variant: "destructive"
    });
  };

  const handleKkiapayPending = (response: any) => {
    console.log('⏳ Paiement KkiaPay en attente:', response);
    toast({
      title: "Paiement en cours",
      description: "Votre paiement est en cours de traitement",
    });
  };

  // Ouvrir le widget KkiaPay
  const openKkiapayWidget = () => {
    if (!scriptLoaded) {
      toast({
        title: "Widget non prêt",
        description: "Le widget KkiaPay est en cours de chargement",
        variant: "destructive"
      });
      return;
    }

    if (!kkiapayConfig) {
      prepareKkiapayConfig().then(() => {
        if (kkiapayConfig) {
          launchWidget();
        }
      });
    } else {
      launchWidget();
    }
  };

  const launchWidget = () => {
    if (window.openKkiapayWidget && kkiapayConfig) {
      console.log('🚀 Lancement widget KkiaPay avec config:', kkiapayConfig);
      
      window.openKkiapayWidget({
        amount: kkiapayConfig.amount,
        api_key: kkiapayConfig.api_key,
        sandbox: true, // Changez à false en production
        data: kkiapayConfig.data,
        callback: kkiapayConfig.callback_url,
        theme: "#0095ff",
        name: user?.user_metadata?.full_name || "Client",
        email: user?.email || "",
        phone: user?.user_metadata?.phone || ""
      });
    } else {
      console.error('❌ Widget KkiaPay non disponible ou configuration manquante');
      onError(new Error('Widget KkiaPay non disponible'));
    }
  };

  return (
    <Button
      onClick={openKkiapayWidget}
      disabled={disabled || isLoading}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Préparation...
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