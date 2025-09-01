import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";

export interface PaymentData {
  bookingId: string;
  amount: number;
  depositAmount?: number;
  description?: string;
}

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPayment = async (paymentData: PaymentData) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Creating payment session...', paymentData);

      const { data, error: invokeError } = await supabase.functions.invoke('create-payment', {
        body: paymentData
      });

      if (invokeError) {
        throw invokeError;
      }

      if (!data?.url) {
        throw new Error('URL de paiement non reçue');
      }

      console.log('Payment session created:', data);

      // Rediriger vers Stripe Checkout dans un nouvel onglet
      window.open(data.url, '_blank');

      return {
        success: true,
        sessionId: data.sessionId,
        url: data.url
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création du paiement';
      setError(errorMessage);
      console.error('Payment creation error:', error);
      
      toast({
        variant: "destructive",
        title: "Erreur de paiement",
        description: errorMessage
      });

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Verifying payment...', sessionId);

      const { data, error: invokeError } = await supabase.functions.invoke('verify-payment', {
        body: { sessionId }
      });

      if (invokeError) {
        throw invokeError;
      }

      console.log('Payment verification result:', data);

      if (data?.success && data?.status === 'paid') {
        toast({
          title: "Paiement confirmé",
          description: "Votre paiement a été traité avec succès."
        });

        return {
          success: true,
          status: 'paid',
          bookingId: data.bookingId
        };
      } else {
        throw new Error('Paiement non confirmé');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la vérification du paiement';
      setError(errorMessage);
      console.error('Payment verification error:', error);
      
      toast({
        variant: "destructive",
        title: "Erreur de vérification",
        description: errorMessage
      });

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    createPayment,
    verifyPayment,
    loading,
    error
  };
}