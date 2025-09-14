// supabase/functions/create-kakiapay-recharge/index.ts
// VERSION CORRIGÉE - SANS CONFLIT UUID

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

    let walletId = wallet?.id;

    if (walletError) {
      console.log("📝 Création d'un nouveau portefeuille...");
      // Créer un portefeuille si inexistant
      const { data: newWallet, error: createError } = await supabaseService
        .from('wallets')
        .insert({ user_id: user.id, balance: 0 })
        .select('id')
        .single();
      
      if (createError || !newWallet) throw new Error("Impossible de créer le portefeuille");
      walletId = newWallet.id;
    }

    // KAKIAPAY CONFIGURATION
    const kakiaPayApiKey = Deno.env.get("KAKIAPAY_API_KEY");
    
    if (!kakiaPayApiKey) {
      throw new Error("Clé KkiaPay non configurée dans les variables d'environnement");
    }

    console.log(`🔑 API Key présente: ${!!kakiaPayApiKey}`);

    // Générer un ID de référence externe pour KkiaPay (non-UUID)
    const externalReference = `wallet_${user.id}_${Date.now()}`;
    
    // Enregistrer la transaction de recharge en pending (reference_id reste NULL)
    const { data: insertedTransaction, error: insertError } = await supabaseService
      .from('wallet_transactions')
      .insert({
        wallet_id: walletId,
        amount: amount,
        transaction_type: 'credit',
        description: `Recharge KkiaPay - ${amount.toLocaleString()} FCFA - Ref: ${externalReference}`,
        status: 'pending'
        // payment_method n'existe pas dans cette table
        // reference_id reste NULL (auto-généré UUID si besoin)
        // On stocke la référence externe dans la description
      })
      .select('id')
      .single();

    if (insertError || !insertedTransaction) {
      throw new Error(`Erreur lors de l'enregistrement: ${insertError?.message || 'Transaction non créée'}`);
    }

    console.log(`✅ Transaction pré-enregistrée avec UUID: ${insertedTransaction.id}, Ref externe: ${externalReference}`);

    // Retourner les informations pour le widget KkiaPay côté client
    return new Response(JSON.stringify({ 
      success: true,
      kkiapay_config: {
        amount: amount,
        currency: currency.toUpperCase(),
        api_key: kakiaPayApiKey,
        transaction_id: insertedTransaction.id, // UUID de la transaction en DB
        external_reference: externalReference, // Référence externe pour KkiaPay
        callback_url: `${req.headers.get("origin")}/wallet-recharge-success?transaction_id=${insertedTransaction.id}`,
        data: JSON.stringify({
          user_id: user.id,
          wallet_id: walletId,
          transaction_id: insertedTransaction.id,
          external_reference: externalReference
        })
      },
      message: "Configuration KkiaPay générée avec succès"
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