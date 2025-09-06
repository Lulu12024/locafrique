// import { useState, useEffect } from 'react';
// import { useAuth } from '@/hooks/auth';
// import { supabase } from '@/integrations/supabase/client';

// export interface WalletTransaction {
//   id: string;
//   amount: number;
//   type: 'credit' | 'debit' | 'commission' | 'refund';
//   description: string;
//   reference_id?: string;
//   commission_amount?: number;
//   status: 'pending' | 'completed' | 'failed';
//   created_at: string;
//   payment_method?: string;
// }

// export function useEnhancedWallet() {
//   const { user } = useAuth();
//   const [wallet, setWallet] = useState(null);
//   const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
//   const [isLoading, setIsLoading] = useState(false);

//   const loadWalletData = async () => {
//     if (!user) return;
    
//     setIsLoading(true);
//     try {
//       // Charger le portefeuille
//       const { data: walletData, error: walletError } = await supabase
//         .from('wallets')
//         .select('*')
//         .eq('user_id', user.id)
//         .single();

//       if (walletError && walletError.code === 'PGRST116') {
//         // Créer un nouveau portefeuille si inexistant
//         const { data: newWallet } = await supabase
//           .from('wallets')
//           .insert({ user_id: user.id, balance: 0 })
//           .select()
//           .single();
//         setWallet(newWallet);
//       } else {
//         setWallet(walletData);
//       }

//       // Charger les transactions
//       const { data: transactionsData } = await supabase
//         .from('wallet_transactions')
//         .select('*')
//         .eq('wallet_id', walletData?.id || newWallet?.id)
//         .order('created_at', { ascending: false })
//         .limit(50);

//       setTransactions(transactionsData || []);
//     } catch (error) {
//       console.error('Erreur lors du chargement du portefeuille:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const createTransaction = async (
//     amount: number,
//     type: WalletTransaction['type'],
//     description: string,
//     referenceId?: string
//   ) => {
//     if (!wallet) return { success: false, error: 'Portefeuille non trouvé' };

//     try {
//       const { data, error } = await supabase.rpc('create_wallet_transaction', {
//         p_wallet_id: wallet.id,
//         p_amount: amount,
//         p_transaction_type: type,
//         p_description: description,
//         p_reference_id: referenceId
//       });

//       if (error) throw error;

//       // Recharger les données
//       await loadWalletData();
      
//       return { success: true, data };
//     } catch (error) {
//       console.error('Erreur lors de la création de transaction:', error);
//       return { success: false, error: error.message };
//     }
//   };

//   useEffect(() => {
//     loadWalletData();
//   }, [user]);

//   return {
//     wallet,
//     transactions,
//     isLoading,
//     createTransaction,
//     refreshWallet: loadWalletData
//   };
// }