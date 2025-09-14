// supabase/functions/create-wallet-recharge/index.ts

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

    const { amount, payment_method, currency = 'xof' } = await req.json();
    
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

    if (payment_method === 'stripe') {
      // STRIPE RECHARGE
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) {
        throw new Error("STRIPE_SECRET_KEY non configuré");
      }

      const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

      // Créer ou récupérer le client Stripe
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      let customerId;
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { supabase_user_id: user.id }
        });
        customerId = customer.id;
      }

      // Créer la session de paiement
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price_data: {
              currency: "eur", // Stripe utilise EUR, conversion en FCFA côté client
              product_data: { 
                name: "Recharge de portefeuille",
                description: `Recharge de ${amount.toLocaleString()} FCFA`
              },
              unit_amount: Math.round((amount / 655.957) * 100), // Conversion FCFA -> EUR en centimes
            },
            quantity: 1,
          }
        ],
        mode: "payment",
        success_url: `${req.headers.get("origin")}/wallet-recharge-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get("origin")}/my-wallet?recharge=cancelled`,
        metadata: {
          wallet_recharge: 'true',
          user_id: user.id,
          amount_fcfa: amount.toString(),
          payment_method: 'stripe'
        }
      });

      // Enregistrer la transaction de recharge en pending
      await supabaseService
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet?.id || newWallet?.id,
          amount: amount,
          transaction_type: 'credit',
          description: `Recharge Stripe - ${amount.toLocaleString()} FCFA`,
          status: 'pending',
          reference_id: session.id
        });

      return new Response(JSON.stringify({ 
        url: session.url,
        sessionId: session.id 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Méthode de paiement non supportée");

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("ERROR in wallet recharge:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// =========================================================================


// =========================================================================
