// src/hooks/useEnhancedWallet-polling.ts - Version avec polling uniquement

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export interface WalletTransaction {
  id: string;
  amount: number;
  transaction_type: 'credit' | 'debit' | 'commission' | 'refund';
  description: string;
  reference_id?: string;
  booking_id?: string;
  commission_amount?: number;
  platform_fee?: number;
  payment_method?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface WalletData {
  id: string;
  balance: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function useEnhancedWalletPolling() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecharging, setIsRecharging] = useState(false);

  // Charger les données du portefeuille
  const loadWalletData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Créer ou récupérer le portefeuille
      const { data: walletData, error: walletError } = await supabase.rpc(
        'ensure_user_wallet',
        { p_user_id: user.id }
      );

      if (walletError) {
        throw walletError;
      }

      // Récupérer les détails du portefeuille
      const { data: walletDetails, error: detailsError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (detailsError) {
        throw detailsError;
      }

      setWallet(walletDetails);

      // Charger les transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletDetails.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionsError) {
        throw transactionsError;
      }

      setTransactions(transactionsData || []);

    } catch (error: any) {
      console.error('Erreur chargement portefeuille:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du portefeuille",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Recharger le portefeuille
  const rechargeWallet = async (amount: number, paymentMethod: 'stripe' | 'kakiapay') => {
    if (!user || amount <= 0) {
      toast({
        title: "Données invalides",
        description: "Montant invalide ou utilisateur non connecté",
        variant: "destructive"
      });
      return { success: false };
    }

    setIsRecharging(true);
    try {
      const functionName = paymentMethod === 'stripe' 
        ? 'create-wallet-recharge' 
        : 'create-kakiapay-recharge';

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          amount: amount,
          payment_method: paymentMethod,
          currency: 'xof'
        }
      });

      if (error) {
        throw error;
      }

      if (data?.url || data?.checkout_url) {
        // Ouvrir l'URL de paiement
        const paymentUrl = data.url || data.checkout_url;
        window.open(paymentUrl, '_blank');
        
        toast({
          title: "Redirection vers le paiement",
          description: `Redirection vers ${paymentMethod === 'stripe' ? 'Stripe' : 'KakiaPay'}`,
        });

        return { success: true, url: paymentUrl };
      } else {
        throw new Error("URL de paiement non reçue");
      }

    } catch (error: any) {
      console.error('Erreur recharge:', error);
      toast({
        title: "Erreur de recharge",
        description: error.message || "Une erreur s'est produite",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setIsRecharging(false);
    }
  };

  // Effectuer une transaction (débit/crédit)
  const createTransaction = async (
    amount: number,
    type: WalletTransaction['transaction_type'],
    description: string,
    referenceId?: string,
    bookingId?: string
  ) => {
    if (!user || !wallet) {
      throw new Error("Utilisateur non connecté ou portefeuille non trouvé");
    }

    try {
      const { data, error } = await supabase.rpc('create_wallet_transaction_secure', {
        p_wallet_id: wallet.id,
        p_amount: amount,
        p_transaction_type: type,
        p_description: description,
        p_reference_id: referenceId,
        p_booking_id: bookingId
      });

      if (error) {
        throw error;
      }

      // Recharger les données après la transaction
      await loadWalletData();

      return data;
    } catch (error: any) {
      console.error('Erreur transaction:', error);
      throw error;
    }
  };

  // Vérifier si le solde est suffisant
  const hasSufficientBalance = (amount: number): boolean => {
    return wallet ? wallet.balance >= amount : false;
  };

  // Calculer les statistiques
  const getStats = () => {
    const totalCredits = transactions
      .filter(t => t.transaction_type === 'credit' || t.transaction_type === 'refund')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalDebits = transactions
      .filter(t => t.transaction_type === 'debit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalCommissions = transactions
      .reduce((sum, t) => sum + (t.commission_amount || 0), 0);

    return {
      currentBalance: wallet?.balance || 0,
      totalCredits,
      totalDebits,
      totalCommissions,
      transactionCount: transactions.length,
      lastTransactionDate: transactions[0]?.created_at
    };
  };

  // Utiliser uniquement le polling, pas de WebSocket
  useEffect(() => {
    if (!user) return;

    console.log('🔄 Configuration du polling pour le portefeuille (mode sans WebSocket)');
    
    // Charger les données immédiatement
    loadWalletData();

    // Configurer le polling toutes les 30 secondes
    const pollingInterval = setInterval(() => {
      loadWalletData();
    }, 30000);

    // Polling plus fréquent quand la page est visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadWalletData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Nettoyage
    return () => {
      clearInterval(pollingInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, loadWalletData]);

  return {
    wallet,
    transactions,
    isLoading,
    isRecharging,
    stats: getStats(),
    loadWalletData,
    rechargeWallet,
    createTransaction,
    hasSufficientBalance
  };
}