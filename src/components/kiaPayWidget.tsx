// src/components/KkiaPayWidget.tsx
// VERSION CORRIGÉE - RÉSOUT L'ERREUR DataCloneError

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
    removeKkiapayListener: (event: string, callback: (response: any) => void) => void;
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
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [transactionRef, setTransactionRef] = useState<string>('');

  // Charger le script KkiaPay une seule fois
  useEffect(() => {
    // Vérifier si le script est déjà chargé
    if (window.kkiapay || document.querySelector('script[src*="kkiapay"]')) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.setAttribute('data-z-index', '999999');
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
      // Nettoyer seulement si nécessaire
      const existingScript = document.querySelector('script[src*="kkiapay"]');
      if (existingScript && document.head.contains(existingScript)) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  // Gestionnaires d'événements KkiaPay (définis en dehors du render pour éviter les re-créations)
  const handleSuccess = async (response: any) => {
    console.log('✅ Paiement KkiaPay réussi:', response);
    
    try {
      // Vérifier la transaction côté serveur
      const { data, error } = await supabase.functions.invoke('verify-wallet-recharge', {
        body: {
          transactionId: transactionRef,
          external_reference: response.transactionId || response.transaction_id,
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
        
        // Nettoyer les listeners
        cleanupListeners();
      } else {
        throw new Error(data?.message || 'Vérification échouée');
      }
    } catch (error: any) {
      console.error('❌ Erreur vérification:', error);
      onError(error);
      toast({
        title: "Erreur vérification",
        description: error.message || "Le paiement n'a pas pu être vérifié",
        variant: "destructive"
      });
    }
  };

  const handleFailure = (response: any) => {
    console.error('❌ Erreur paiement KkiaPay:', response);
    onError(response);
    toast({
      title: "Paiement échoué",
      description: response.message || "Une erreur s'est produite lors du paiement",
      variant: "destructive"
    });
    cleanupListeners();
  };

  const handlePending = (response: any) => {
    console.log('⏳ Paiement KkiaPay en attente:', response);
    toast({
      title: "Paiement en cours",
      description: "Votre paiement est en cours de traitement",
    });
  };

  // Fonction pour nettoyer les listeners
  const cleanupListeners = () => {
    if (window.removeKkiapayListener) {
      window.removeKkiapayListener('success', handleSuccess);
      window.removeKkiapayListener('failed', handleFailure);
      window.removeKkiapayListener('pending', handlePending);
    }
  };

  // Fonction principale pour gérer le paiement
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

      console.log('✅ Configuration KkiaPay reçue');
      const config = data.kkiapay_config;
      setTransactionRef(config.transaction_id);

      // Étape 2: Configurer les listeners AVANT de lancer le widget
      if (window.addKkiapayListener) {
        // Nettoyer les anciens listeners s'ils existent
        cleanupListeners();
        
        // Ajouter les nouveaux listeners
        window.addKkiapayListener('success', handleSuccess);
        window.addKkiapayListener('failed', handleFailure);
        window.addKkiapayListener('pending', handlePending);
      }

      // Étape 3: Lancer le widget KkiaPay SANS callback direct
      const widgetConfig = {
        amount: config.amount,
        api_key: config.api_key,
        sandbox: true, // Mode test - changez à false en production
        data: config.external_reference,
        name: user?.user_metadata?.full_name || user?.email || "Client",
        email: user?.email || "",
        phone: user?.user_metadata?.phone || "",
        reason: `Recharge portefeuille - ${config.amount} FCFA`,
        // ❌ PAS DE CALLBACK ICI - utilise les listeners à la place
        // callback: (response) => { ... } // SUPPRIMÉ pour éviter DataCloneError
      };

      console.log('🚀 Lancement widget KkiaPay...');

      // Essayer différentes méthodes de lancement
      if (window.openKkiapayWidget) {
        window.openKkiapayWidget(widgetConfig);
      } else if (window.kkiapay) {
        window.kkiapay(widgetConfig);
      } else {
        // Méthode alternative avec élément DOM
        const widgetElement = document.createElement('kkiapay-widget');
        widgetElement.setAttribute('amount', config.amount.toString());
        widgetElement.setAttribute('key', config.api_key);
        widgetElement.setAttribute('sandbox', 'true');
        widgetElement.setAttribute('data', config.external_reference);
        
        document.body.appendChild(widgetElement);
        
        // Nettoyer après un délai
        setTimeout(() => {
          if (document.body.contains(widgetElement)) {
            document.body.removeChild(widgetElement);
          }
        }, 100);
      }

      setIsLoading(false);

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

  // Nettoyer les listeners au démontage du composant
  useEffect(() => {
    return () => {
      cleanupListeners();
    };
  }, []);

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