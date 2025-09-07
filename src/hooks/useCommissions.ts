// CRÉER le fichier : /src/hooks/useCommissions.ts
// Hook pour la gestion automatique des commissions de 5% fixe

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

// Constante pour la commission fixe
export const COMMISSION_RATE = 0.05; // 5% fixe
export const PLATFORM_FEE_RATE = 0.02; // 2% frais plateforme

// Interface pour les calculs de commission
interface CommissionCalculation {
  subtotal: number;
  commission: number;
  platformFee: number;
  ownerAmount: number;
  total: number;
}

// Interface pour les transactions de commission
interface CommissionTransaction {
  id: string;
  booking_id: string;
  owner_id: string;
  renter_id: string;
  gross_amount: number;
  commission_amount: number;
  net_amount: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export function useCommissions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculer les montants avec commission automatique
  const calculateCommission = useCallback((amount: number): CommissionCalculation => {
    const subtotal = amount;
    const commission = Math.round(subtotal * COMMISSION_RATE); // 5% commission
    const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE); // 2% frais plateforme
    const ownerAmount = subtotal - commission; // Montant net pour le propriétaire
    const total = subtotal + platformFee; // Total payé par le locataire

    return {
      subtotal,
      commission,
      platformFee,
      ownerAmount,
      total
    };
  }, []);

  // Calculer la commission pour plusieurs jours
  const calculateRentalCommission = useCallback((dailyPrice: number, numberOfDays: number): CommissionCalculation => {
    const subtotal = dailyPrice * numberOfDays;
    return calculateCommission(subtotal);
  }, [calculateCommission]);

  // Traiter une commission lors d'une réservation confirmée
  const processBookingCommission = async (
    bookingId: string,
    ownerId: string,
    renterId: string,
    grossAmount: number
  ) => {
    setLoading(true);
    setError(null);

    try {
      console.log('💰 Traitement de la commission pour la réservation:', bookingId);
      
      const calculation = calculateCommission(grossAmount);
      
      // Créer une transaction de commission dans les portefeuilles
      
      // 1. Débiter le locataire (montant total avec frais plateforme)
      const { data: renterWallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', renterId)
        .single();

      if (renterWallet) {
        // Insérer directement dans wallet_transactions en attendant la fonction RPC
        const { error: renterTransactionError } = await supabase
          .from('wallet_transactions')
          .insert({
            wallet_id: renterWallet.id,
            amount: -calculation.total,
            transaction_type: 'debit',
            description: `Paiement réservation - Commission 5% incluse`,
            reference_id: bookingId
          });

        if (renterTransactionError) {
          console.error('❌ Erreur transaction locataire:', renterTransactionError);
          throw renterTransactionError;
        }

        // Mettre à jour le solde du portefeuille locataire
        const { error: renterBalanceError } = await supabase
          .from('wallets')
          .update({ 
            balance: supabase.raw(`balance - ${calculation.total}`),
            updated_at: new Date().toISOString()
          })
          .eq('id', renterWallet.id);

        if (renterBalanceError) {
          console.error('❌ Erreur mise à jour solde locataire:', renterBalanceError);
        }
      }

      // 2. Créditer le propriétaire (montant net après commission)
      const { data: ownerWallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', ownerId)
        .single();

      if (ownerWallet) {
        const { error: ownerTransactionError } = await supabase
          .from('wallet_transactions')
          .insert({
            wallet_id: ownerWallet.id,
            amount: calculation.ownerAmount,
            transaction_type: 'credit',
            description: `Revenus location - Commission ${COMMISSION_RATE * 100}% déduite`,
            reference_id: bookingId
          });

        if (ownerTransactionError) {
          console.error('❌ Erreur transaction propriétaire:', ownerTransactionError);
          throw ownerTransactionError;
        }

        // 3. Créer une transaction de commission pour la plateforme
        const { error: commissionTransactionError } = await supabase
          .from('wallet_transactions')
          .insert({
            wallet_id: ownerWallet.id,
            amount: -calculation.commission,
            transaction_type: 'commission',
            description: `Commission plateforme (${COMMISSION_RATE * 100}% fixe)`,
            reference_id: bookingId
          });

        if (commissionTransactionError) {
          console.error('❌ Erreur transaction commission:', commissionTransactionError);
          throw commissionTransactionError;
        }

        // Mettre à jour le solde du portefeuille propriétaire
        const { error: ownerBalanceError } = await supabase
          .from('wallets')
          .update({ 
            balance: supabase.raw(`balance + ${calculation.ownerAmount} - ${calculation.commission}`),
            updated_at: new Date().toISOString()
          })
          .eq('id', ownerWallet.id);

        if (ownerBalanceError) {
          console.error('❌ Erreur mise à jour solde propriétaire:', ownerBalanceError);
        }
      }

      // 4. Mettre à jour la réservation avec les montants calculés
      const { error: bookingUpdateError } = await supabase
        .from('bookings')
        .update({
          commission_amount: calculation.commission,
          platform_fee: calculation.platformFee,
          payment_status: 'completed'
        })
        .eq('id', bookingId);

      if (bookingUpdateError) {
        console.error('❌ Erreur mise à jour réservation:', bookingUpdateError);
        throw bookingUpdateError;
      }

      console.log('✅ Commission traitée avec succès:', {
        grossAmount: calculation.subtotal,
        commission: calculation.commission,
        ownerAmount: calculation.ownerAmount
      });

      toast({
        title: "💰 Commission traitée",
        description: `Commission de ${calculation.commission.toLocaleString()} FCFA (5%) appliquée automatiquement.`,
      });

      return calculation;

    } catch (error) {
      console.error('❌ Erreur lors du traitement de la commission:', error);
      setError('Erreur lors du traitement de la commission');
      
      toast({
        title: "Erreur de commission",
        description: "Impossible de traiter la commission automatiquement.",
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Obtenir les statistiques de commission pour un utilisateur
  const getCommissionStats = async (userId: string, period: 'week' | 'month' | 'year' = 'month') => {
    try {
      console.log('📊 Chargement des statistiques de commission...');
      
      // Calculer la date de début selon la période
      const now = new Date();
      const startDate = new Date();
      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Récupérer les transactions de commission
      const { data: walletTransactions, error } = await supabase
        .from('wallet_transactions')
        .select(`
          amount,
          transaction_type,
          created_at,
          wallet:wallets!inner(user_id)
        `)
        .eq('wallets.user_id', userId)
        .eq('transaction_type', 'commission')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString());

      if (error) {
        console.error('❌ Erreur lors du chargement des stats:', error);
        throw error;
      }

      // Calculer les totaux
      const totalCommissionPaid = walletTransactions?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
      const transactionCount = walletTransactions?.length || 0;

      console.log('✅ Statistiques de commission chargées:', {
        totalCommissionPaid,
        transactionCount,
        period
      });

      return {
        totalCommissionPaid,
        transactionCount,
        averageCommission: transactionCount > 0 ? totalCommissionPaid / transactionCount : 0,
        period,
        commissionRate: COMMISSION_RATE
      };

    } catch (error) {
      console.error('❌ Erreur lors du chargement des statistiques:', error);
      return {
        totalCommissionPaid: 0,
        transactionCount: 0,
        averageCommission: 0,
        period,
        commissionRate: COMMISSION_RATE
      };
    }
  };

  // Simuler le calcul pour affichage (sans traitement)
  const previewCommission = useCallback((amount: number) => {
    const calculation = calculateCommission(amount);
    
    return {
      ...calculation,
      breakdown: {
        originalAmount: amount,
        commissionPercentage: COMMISSION_RATE * 100,
        platformFeePercentage: PLATFORM_FEE_RATE * 100,
        ownerReceives: calculation.ownerAmount,
        renterPays: calculation.total,
        platformCommission: calculation.commission,
        platformFee: calculation.platformFee
      }
    };
  }, [calculateCommission]);

  // Formater l'affichage des montants avec commission
  const formatCommissionDisplay = (amount: number) => {
    const calculation = calculateCommission(amount);
    
    return {
      display: `${amount.toLocaleString()} FCFA`,
      withCommission: `${calculation.total.toLocaleString()} FCFA (dont ${calculation.commission.toLocaleString()} FCFA de commission)`,
      breakdown: `Propriétaire reçoit: ${calculation.ownerAmount.toLocaleString()} FCFA • Commission: ${calculation.commission.toLocaleString()} FCFA (5%)`
    };
  };

  // Valider qu'un montant est suffisant pour couvrir les frais
  const validateMinimumAmount = (amount: number, minimumThreshold = 1000) => {
    const calculation = calculateCommission(amount);
    
    return {
      isValid: amount >= minimumThreshold,
      minimumAmount: minimumThreshold,
      calculation,
      message: amount < minimumThreshold 
        ? `Le montant minimum est de ${minimumThreshold.toLocaleString()} FCFA` 
        : null
    };
  };

  return {
    // Constants
    COMMISSION_RATE,
    PLATFORM_FEE_RATE,
    
    // States
    loading,
    error,
    
    // Calculation functions
    calculateCommission,
    calculateRentalCommission,
    previewCommission,
    
    // Processing functions
    processBookingCommission,
    
    // Statistics
    getCommissionStats,
    
    // Utilities
    formatCommissionDisplay,
    validateMinimumAmount
  };
}