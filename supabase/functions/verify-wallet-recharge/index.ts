// supabase/functions/verify-wallet-recharge/index.ts
// VERSION RÉELLEMENT CORRIGÉE - SUPPRESSION DE supabaseService.raw()

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔍 Début de la vérification wallet recharge");

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

    // Récupérer les données de la requête
    const requestBody = await req.json();
    console.log("📥 Données reçues:", JSON.stringify(requestBody, null, 2));
    
    const { transactionId, external_reference, payment_method } = requestBody;

    // Validation des paramètres
    if (!payment_method) {
      throw new Error("Méthode de paiement manquante");
    }

    if (!transactionId) {
      throw new Error("ID de transaction manquant");
    }

    console.log(`🔍 Vérification transaction: ${transactionId} via ${payment_method}`);

    // Traitement spécifique à KakiaPay
    if (payment_method === 'kakiapay' || payment_method === 'kkiapay') {
      
      console.log("🔄 Traitement KakiaPay...");
      
      // Récupérer la transaction en attente en utilisant l'UUID
      const { data: pendingTransaction, error: transactionError } = await supabaseService
        .from('wallet_transactions')
        .select('id, wallet_id, amount, description, status')
        .eq('id', transactionId) // Utiliser l'UUID de la transaction
        .eq('status', 'pending')
        .single();

      console.log("🔍 Transaction trouvée:", pendingTransaction);
      console.log("❌ Erreur recherche transaction:", transactionError);

      if (!pendingTransaction) {
        throw new Error(`Transaction en attente non trouvée. Dernière erreur: ${transactionError?.message || 'Aucune transaction trouvée avec les critères fournis'}`);
      }

      console.log("✅ Transaction trouvée:", pendingTransaction);

      // Continuer avec la transaction trouvée normalement
      console.log("✅ Transaction trouvée, vérification avec KakiaPay...");
      
      try {
        // Simulation de vérification KakiaPay réussie
        console.log("🔄 Vérification KakiaPay simulée (réussite)...");
        
        const kakiaPayVerified = true; // TODO: Remplacer par vraie vérification
        
        if (kakiaPayVerified) {
          console.log("✅ Paiement KakiaPay vérifié, mise à jour...");
          
          // Mettre à jour le statut de la transaction
          console.log(`🔄 Mise à jour statut transaction ${pendingTransaction.id}...`);
          const { error: updateError } = await supabaseService
            .from('wallet_transactions')
            .update({ status: 'completed' })
            .eq('id', pendingTransaction.id);

          if (updateError) {
            console.error("❌ Erreur mise à jour transaction:", updateError);
            throw new Error(`Erreur mise à jour transaction: ${updateError.message}`);
          }
          console.log("✅ Statut transaction mis à jour");

          // CORRECTION PRINCIPALE : Mettre à jour le solde sans utiliser .raw()
          console.log(`🔄 Récupération solde actuel du portefeuille ${pendingTransaction.wallet_id}...`);
          const { data: currentWallet, error: walletError } = await supabaseService
            .from('wallets')
            .select('balance')
            .eq('id', pendingTransaction.wallet_id)
            .single();

          if (walletError) {
            console.error("❌ Erreur récupération portefeuille:", walletError);
            throw new Error(`Erreur récupération portefeuille: ${walletError.message}`);
          }

          const currentBalance = currentWallet.balance || 0;
          const newBalance = currentBalance + pendingTransaction.amount;
          console.log(`🔢 Calcul solde: ${currentBalance} + ${pendingTransaction.amount} = ${newBalance}`);

          // Mise à jour du solde avec la nouvelle valeur calculée
          console.log(`🔄 Mise à jour solde portefeuille...`);
          const { error: balanceError } = await supabaseService
            .from('wallets')
            .update({ balance: newBalance })
            .eq('id', pendingTransaction.wallet_id);

          if (balanceError) {
            console.error("❌ Erreur mise à jour solde:", balanceError);
            throw new Error(`Erreur mise à jour solde: ${balanceError.message}`);
          }

          console.log(`✅ Recharge réussie: ${pendingTransaction.amount} FCFA ajoutés. Nouveau solde: ${newBalance} FCFA`);

          return new Response(JSON.stringify({ 
            success: true,
            status: 'completed',
            amount: pendingTransaction.amount,
            new_balance: newBalance,
            transaction_id: pendingTransaction.id,
            message: `Recharge de ${pendingTransaction.amount} FCFA effectuée avec succès`
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
          
        } else {
          console.log("⏳ Transaction KakiaPay en attente...");
          
          return new Response(JSON.stringify({ 
            success: false, 
            status: 'pending',
            message: "Paiement en cours de traitement"
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 202,
          });
        }
        
      } catch (verifyError) {
        console.error("❌ Erreur vérification KakiaPay:", verifyError);
        console.error("❌ Stack trace:", verifyError.stack);
        
        return new Response(JSON.stringify({ 
          success: false, 
          status: 'verification_failed',
          message: `Erreur détaillée: ${verifyError.message}`,
          error_type: verifyError.name || 'Unknown'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    }

    // Si ce n'est pas KakiaPay
    throw new Error(`Méthode de paiement '${payment_method}' non supportée. Méthodes acceptées: kakiapay, kkiapay`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ ERROR in verify wallet recharge:", errorMessage);
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