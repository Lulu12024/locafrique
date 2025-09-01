import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Payment function started");

    // Vérifier les variables d'environnement
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY non configuré");
    }
    logStep("Stripe key verified");

    // Créer le client Supabase avec la clé de service
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
      throw new Error("Utilisateur non authentifié ou email non disponible");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parser les données de la requête
    const { bookingId, amount, depositAmount, description } = await req.json();
    
    if (!bookingId || !amount) {
      throw new Error("bookingId et amount sont requis");
    }
    logStep("Payment data received", { bookingId, amount, depositAmount });

    // Vérifier que la réservation existe et appartient à l'utilisateur
    const { data: booking, error: bookingError } = await supabaseService
      .from('bookings')
      .select('*, equipment:equipments(*)')
      .eq('id', bookingId)
      .eq('renter_id', user.id)
      .single();

    if (bookingError || !booking) {
      throw new Error("Réservation non trouvée ou accès non autorisé");
    }
    logStep("Booking verified", { bookingId: booking.id, equipmentTitle: booking.equipment?.title });

    // Initialiser Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Vérifier ou créer un client Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing Stripe customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id }
      });
      customerId = customer.id;
      logStep("New Stripe customer created", { customerId });
    }

    // Créer la session de paiement
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { 
              name: `Location: ${booking.equipment?.title || 'Équipement'}`,
              description: description || `Réservation du ${booking.start_date} au ${booking.end_date}`
            },
            unit_amount: Math.round(amount * 100), // Convertir en centimes
          },
          quantity: 1,
        },
        ...(depositAmount ? [{
          price_data: {
            currency: "eur",
            product_data: { 
              name: "Caution",
              description: "Caution remboursable"
            },
            unit_amount: Math.round(depositAmount * 100),
          },
          quantity: 1,
        }] : [])
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: `${req.headers.get("origin")}/booking/${bookingId}?payment=cancelled`,
      metadata: {
        booking_id: bookingId,
        user_id: user.id,
        amount: amount.toString(),
        deposit_amount: (depositAmount || 0).toString()
      }
    });
    logStep("Stripe session created", { sessionId: session.id, url: session.url });

    // Enregistrer le paiement en base avec le statut pending
    const { error: paymentError } = await supabaseService
      .from('payments')
      .insert({
        booking_id: bookingId,
        payer_id: user.id,
        amount: amount,
        deposit_amount: depositAmount || 0,
        status: 'pending',
        transaction_id: session.id
      });

    if (paymentError) {
      logStep("Warning: Could not save payment record", { error: paymentError.message });
      // Ne pas faire échouer la session pour cette erreur
    }

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in payment creation", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});