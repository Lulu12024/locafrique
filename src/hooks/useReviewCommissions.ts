
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/auth';

export interface ReviewCommission {
  id: string;
  review_id: string;
  owner_id: string;
  amount: number;
  status: string; // Changé de union type strict à string
  due_date: string;
  paid_at?: string;
  created_at: string;
}

export function useReviewCommissions() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Récupérer les commissions d'un propriétaire
  const fetchOwnerCommissions = async (): Promise<ReviewCommission[]> => {
    if (!user) return [];

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('review_commissions')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(commission => ({
        id: commission.id,
        review_id: commission.review_id,
        owner_id: commission.owner_id,
        amount: commission.amount,
        status: commission.status || 'pending',
        due_date: commission.due_date,
        paid_at: commission.paid_at || undefined,
        created_at: commission.created_at
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des commissions:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Marquer une commission comme payée
  const markCommissionAsPaid = async (commissionId: string): Promise<{ success: boolean; error?: any }> => {
    if (!user) {
      return { success: false, error: "Utilisateur non connecté" };
    }

    try {
      setIsLoading(true);
      
      // Mettre à jour la commission
      const { error: commissionError } = await supabase
        .from('review_commissions')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', commissionId)
        .eq('owner_id', user.id);
      
      if (commissionError) throw commissionError;

      // Récupérer les détails de la commission pour mettre à jour l'avis
      const { data: commission, error: fetchError } = await supabase
        .from('review_commissions')
        .select('review_id')
        .eq('id', commissionId)
        .single();
      
      if (fetchError) throw fetchError;

      // Mettre à jour l'avis pour le publier
      const { error: reviewError } = await supabase
        .from('equipment_reviews')
        .update({
          status: 'published',
          commission_paid: true,
          commission_paid_at: new Date().toISOString()
        })
        .eq('id', commission.review_id);
      
      if (reviewError) throw reviewError;
      
      toast({
        title: "Commission payée",
        description: "La commission a été marquée comme payée et l'avis est maintenant publié.",
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Erreur lors du paiement de la commission:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer la commission comme payée.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchOwnerCommissions,
    markCommissionAsPaid,
    isLoading
  };
}
