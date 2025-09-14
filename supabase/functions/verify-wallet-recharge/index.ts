
// supabase/functions/verify-wallet-recharge/index.ts

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { sessionId, transactionId, payment_method } = await req.json();
    
    if (!sessionId && !transactionId) {
      throw new Error("ID de session ou transaction requis");
    }

    if (payment_method === 'stripe' && sessionId) {
      // VERIFICATION STRIPE
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) {
        throw new Error("STRIPE_SECRET_KEY non configuré");
      }

      const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === 'paid' && session.metadata?.wallet_recharge === 'true') {
        const userId = session.metadata.user_id;
        const amountFcfa = parseFloat(session.metadata.amount_fcfa || '0');

        if (!userId || !amountFcfa) {
          throw new Error("Métadonnées de session incomplètes");
        }

        // Trouver le portefeuille de l'utilisateur
        const { data: wallet } = await supabaseService
          .from('wallets')
          .select('id, balance')
          .eq('user_id', userId)
          .single();

        if (!wallet) {
          throw new Error("Portefeuille non trouvé");
        }

        // Utiliser la fonction sécurisée pour créer la transaction
        const { data: transactionData, error: transactionError } = await supabaseService.rpc(
          'create_wallet_transaction',
          {
            p_wallet_id: wallet.id,
            p_amount: amountFcfa,
            p_transaction_type: 'credit',
            p_description: `Recharge Stripe confirmée - ${amountFcfa.toLocaleString()} FCFA`,
            p_reference_id: sessionId
          }
        );

        if (transactionError) {
          throw transactionError;
        }

        // Marquer la transaction en attente comme complétée
        await supabaseService
          .from('wallet_transactions')
          .update({ status: 'completed' })
          .eq('reference_id', sessionId)
          .eq('status', 'pending');

        return new Response(JSON.stringify({ 
          success: true, 
          status: 'paid',
          amount: amountFcfa,
          new_balance: wallet.balance + amountFcfa
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    } else if (payment_method === 'kakiapay' && transactionId) {
      // VERIFICATION KAKIAPAY
      const kakiaPayApiKey = Deno.env.get("KAKIAPAY_API_KEY");
      
      if (!kakiaPayApiKey) {
        throw new Error("Clés KakiaPay non configurées");
      }

      // Vérifier le statut de la transaction KakiaPay
      const kakiaPayResponse = await fetch(`https://api.kakiapay.com/v1/payment/status/${transactionId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${kakiaPayApiKey}`,
        }
      });

      if (!kakiaPayResponse.ok) {
        throw new Error("Erreur lors de la vérification KakiaPay");
      }

      const kakiaPayData = await kakiaPayResponse.json();

      if (kakiaPayData.status === 'SUCCESS' && kakiaPayData.metadata?.wallet_recharge) {
        const userId = kakiaPayData.metadata.user_id;
        const amount = parseFloat(kakiaPayData.metadata.amount || '0');

        if (!userId || !amount) {
          throw new Error("Métadonnées KakiaPay incomplètes");
        }

        // Trouver le portefeuille de l'utilisateur
        const { data: wallet } = await supabaseService
          .from('wallets')
          .select('id, balance')
          .eq('user_id', userId)
          .single();

        if (!wallet) {
          throw new Error("Portefeuille non trouvé");
        }

        // Utiliser la fonction sécurisée pour créer la transaction
        const { data: transactionData, error: transactionError } = await supabaseService.rpc(
          'create_wallet_transaction',
          {
            p_wallet_id: wallet.id,
            p_amount: amount,
            p_transaction_type: 'credit',
            p_description: `Recharge KakiaPay confirmée - ${amount.toLocaleString()} FCFA`,
            p_reference_id: transactionId
          }
        );

        if (transactionError) {
          throw transactionError;
        }

        // Marquer la transaction en attente comme complétée
        await supabaseService
          .from('wallet_transactions')
          .update({ status: 'completed' })
          .eq('reference_id', transactionId)
          .eq('status', 'pending');

        return new Response(JSON.stringify({ 
          success: true, 
          status: 'paid',
          amount: amount,
          new_balance: wallet.balance + amount
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: false, 
      status: 'pending' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("ERROR in wallet recharge verification:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});