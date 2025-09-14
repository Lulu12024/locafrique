// supabase/functions/create-kakiapay-recharge/index.ts
// VERSION CORRIGÉE AVEC LOGS DÉTAILLÉS

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
    console.log("🚀 Début de la fonction create-kakiapay-recharge");

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

    console.log(`✅ Utilisateur authentifié: ${user.email}`);

    const { amount, currency = 'xof' } = await req.json();
    console.log(`💰 Montant demandé: ${amount} ${currency}`);
    
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
      console.log("📝 Création d'un nouveau portefeuille...");
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
    
    console.log(`🔑 API Key présente: ${!!kakiaPayApiKey}`);
    console.log(`🔑 Secret présent: ${!!kakiaPaySecret}`);
    
    if (!kakiaPayApiKey || !kakiaPaySecret) {
      throw new Error("Clés KakiaPay non configurées dans les variables d'environnement");
    }

    // Préparer les données pour Kkiapay
    const requestBody = {
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
    };

    console.log("📤 Données envoyées à Kkiapay:", JSON.stringify(requestBody, null, 2));

    // Créer une transaction KakiaPay avec différentes méthodes d'authentification
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-API-KEY": kakiaPayApiKey, // Essayer X-API-KEY en premier
      "Authorization": `Bearer ${kakiaPaySecret}` // Puis Bearer avec secret
    };

    console.log("📤 Headers envoyés:", JSON.stringify(headers, null, 2));

    // Essayer l'URL principale de l'API Kkiapay
    let kakiaPayResponse = await fetch("https://api.kkiapay.me/v1/transaction/initialize", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    // Si ça échoue, essayer l'ancienne URL
    if (!kakiaPayResponse.ok) {
      console.log("❌ Première URL échouée, essai de l'ancienne URL...");
      
      kakiaPayResponse = await fetch("https://api.kakiapay.com/v1/payment/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${kakiaPayApiKey}`,
          "X-API-KEY": kakiaPaySecret
        },
        body: JSON.stringify(requestBody)
      });
    }

    console.log(`📡 Statut réponse Kkiapay: ${kakiaPayResponse.status}`);

    if (!kakiaPayResponse.ok) {
      const errorText = await kakiaPayResponse.text();
      console.error("❌ Erreur Kkiapay:", errorText);
      throw new Error(`Erreur KakiaPay (${kakiaPayResponse.status}): ${errorText}`);
    }

    const kakiaPayData = await kakiaPayResponse.json();
    console.log("✅ Réponse Kkiapay:", JSON.stringify(kakiaPayData, null, 2));

    // Vérifier les différents champs possibles pour l'URL de checkout
    const checkoutUrl = kakiaPayData.checkout_url || 
                       kakiaPayData.payment_url || 
                       kakiaPayData.redirect_url ||
                       kakiaPayData.url;

    if (!checkoutUrl) {
      console.error("❌ Aucune URL de paiement trouvée dans:", kakiaPayData);
      throw new Error("URL de paiement KakiaPay non reçue");
    }

    console.log(`✅ URL de checkout trouvée: ${checkoutUrl}`);

    // Enregistrer la transaction de recharge en pending
    const transactionId = kakiaPayData.transaction_id || 
                         kakiaPayData.payment_id || 
                         kakiaPayData.id || 
                         `wallet_${user.id}_${Date.now()}`;

    await supabaseService
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet?.id || newWallet?.id,
        amount: amount,
        transaction_type: 'credit',
        description: `Recharge KakiaPay - ${amount.toLocaleString()} FCFA`,
        status: 'pending',
        reference_id: transactionId
      });

    console.log(`✅ Transaction enregistrée avec ID: ${transactionId}`);

    return new Response(JSON.stringify({ 
      checkout_url: checkoutUrl,
      transaction_id: transactionId,
      success: true
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ ERROR in KakiaPay recharge:", errorMessage);
    console.error("❌ Stack trace:", error);
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: "Vérifiez les logs de la fonction Edge dans Supabase Dashboard"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});