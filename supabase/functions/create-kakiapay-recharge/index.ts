
// supabase/functions/create-kakiapay-recharge/index.ts

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

    // Authentifier l'utilisateur
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Aucun header d'autorisation fourni");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
    if (userError) throw new Error(`Erreur d'authentification: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) {
      throw new Error("Utilisateur non authentifié");
    }

    const { amount, currency = 'xof' } = await req.json();
    
    if (!amount || amount < 1000) {
      throw new Error("Montant invalide (minimum 1000 FCFA)");
    }

    // Vérifier que l'utilisateur a un portefeuille
    const { data: wallet, error: walletError } = await supabaseService
      .from('wallets')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (walletError) {
      // Créer un portefeuille si inexistant
      const { data: newWallet } = await supabaseService
        .from('wallets')
        .insert({ user_id: user.id, balance: 0 })
        .select('id')
        .single();
      
      if (!newWallet) throw new Error("Impossible de créer le portefeuille");
    }

    // KAKIAPAY INTEGRATION
    const kakiaPayApiKey = Deno.env.get("KAKIAPAY_API_KEY");
    const kakiaPaySecret = Deno.env.get("KAKIAPAY_SECRET");
    
    if (!kakiaPayApiKey || !kakiaPaySecret) {
      throw new Error("Clés KakiaPay non configurées");
    }

    // Créer une transaction KakiaPay
    const kakiaPayResponse = await fetch("https://api.kakiapay.com/v1/payment/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${kakiaPayApiKey}`,
        "X-API-KEY": kakiaPaySecret
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency.toUpperCase(),
        description: `Recharge de portefeuille - ${amount.toLocaleString()} FCFA`,
        callback_url: `${req.headers.get("origin")}/wallet-recharge-success`,
        return_url: `${req.headers.get("origin")}/my-wallet`,
        cancel_url: `${req.headers.get("origin")}/my-wallet?recharge=cancelled`,
        merchant_transaction_id: `wallet_${user.id}_${Date.now()}`,
        metadata: {
          user_id: user.id,
          wallet_recharge: true,
          amount: amount
        }
      })
    });

    if (!kakiaPayResponse.ok) {
      const errorData = await kakiaPayResponse.text();
      throw new Error(`Erreur KakiaPay: ${errorData}`);
    }

    const kakiaPayData = await kakiaPayResponse.json();

    if (!kakiaPayData.checkout_url) {
      throw new Error("URL de paiement KakiaPay non reçue");
    }

    // Enregistrer la transaction de recharge en pending
    await supabaseService
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet?.id || newWallet?.id,
        amount: amount,
        transaction_type: 'credit',
        description: `Recharge KakiaPay - ${amount.toLocaleString()} FCFA`,
        status: 'pending',
        reference_id: kakiaPayData.transaction_id || kakiaPayData.payment_id
      });

    return new Response(JSON.stringify({ 
      checkout_url: kakiaPayData.checkout_url,
      transaction_id: kakiaPayData.transaction_id || kakiaPayData.payment_id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("ERROR in KakiaPay recharge:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});