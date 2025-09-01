import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Payment verification started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY non configuré");
    }

    // Créer le client Supabase avec la clé de service
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Parser les données de la requête
    const { sessionId } = await req.json();
    if (!sessionId) {
      throw new Error("sessionId requis");
    }
    logStep("Session ID received", { sessionId });

    // Initialiser Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Récupérer les détails de la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Stripe session retrieved", { 
      status: session.payment_status,
      bookingId: session.metadata?.booking_id 
    });

    if (session.payment_status === 'paid') {
      const bookingId = session.metadata?.booking_id;
      const userId = session.metadata?.user_id;
      const amount = parseFloat(session.metadata?.amount || '0');
      const depositAmount = parseFloat(session.metadata?.deposit_amount || '0');

      if (!bookingId || !userId) {
        throw new Error("Métadonnées de session incomplètes");
      }

      // Mettre à jour le statut du paiement
      const { error: paymentUpdateError } = await supabaseService
        .from('payments')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('transaction_id', sessionId);

      if (paymentUpdateError) {
        logStep("Warning: Could not update payment status", { error: paymentUpdateError.message });
      }

      // Mettre à jour le statut de la réservation
      const { error: bookingUpdateError } = await supabaseService
        .from('bookings')
        .update({ 
          payment_status: 'paid',
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (bookingUpdateError) {
        logStep("Error updating booking", { error: bookingUpdateError.message });
        throw bookingUpdateError;
      }

      // Créer une transaction dans le portefeuille du locataire (débit)
      const { data: renterWallet } = await supabaseService
        .from('wallets')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (renterWallet) {
        await supabaseService.rpc('create_wallet_transaction', {
          p_wallet_id: renterWallet.id,
          p_amount: -(amount + depositAmount),
          p_transaction_type: 'debit',
          p_description: `Paiement réservation ${bookingId}`,
          p_reference_id: bookingId
        });
      }

      // Récupérer les détails de l'équipement pour créditer le propriétaire
      const { data: equipment } = await supabaseService
        .from('equipments')
        .select('owner_id')
        .eq('id', (await supabaseService
          .from('bookings')
          .select('equipment_id')
          .eq('id', bookingId)
          .single()).data?.equipment_id)
        .single();

      if (equipment) {
        const { data: ownerWallet } = await supabaseService
          .from('wallets')
          .select('id')
          .eq('user_id', equipment.owner_id)
          .single();

        if (ownerWallet) {
          // Créer une transaction dans le portefeuille du propriétaire (crédit, moins les frais)
          const ownerAmount = amount * 0.95; // Commission de 5%
          await supabaseService.rpc('create_wallet_transaction', {
            p_wallet_id: ownerWallet.id,
            p_amount: ownerAmount,
            p_transaction_type: 'credit',
            p_description: `Revenus location ${bookingId}`,
            p_reference_id: bookingId
          });
        }
      }

      logStep("Payment verification completed successfully");

      return new Response(JSON.stringify({ 
        success: true,
        status: 'paid',
        bookingId 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else {
      return new Response(JSON.stringify({ 
        success: false,
        status: session.payment_status 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in payment verification", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});