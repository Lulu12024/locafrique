// supabase/functions/refund-kakiapay-payment/index.ts
// Gère le remboursement via KakiaPay en cas de refus de réservation

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

    const { booking_id, amount, reason } = await req.json();

    if (!booking_id || !amount) {
      throw new Error("booking_id et amount requis");
    }

    console.log('💸 Demande de remboursement:', { booking_id, amount });

    // Récupérer les détails de la réservation et le paiement
    const { data: booking, error: bookingError } = await supabaseService
      .from('bookings')
      .select(`
        *,
        equipment:equipments(title),
        renter:profiles!bookings_renter_id_fkey(email, first_name, last_name)
      `)
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error(`Réservation non trouvée: ${bookingError?.message}`);
    }

    // Vérifier qu'un paiement existe pour cette réservation
    const { data: payment, error: paymentError } = await supabaseService
      .from('payments')
      .select('*')
      .eq('booking_id', booking_id)
      .eq('status', 'completed')
      .single();

    if (paymentError || !payment) {
      console.warn('⚠️ Aucun paiement trouvé pour cette réservation');
      // On continue quand même pour marquer la réservation comme remboursée
    }

    // Configuration KakiaPay
    const kakiaPayApiKey = Deno.env.get("KAKIAPAY_API_KEY");
    const kakiaPaySecret = Deno.env.get("KAKIAPAY_SECRET");
    const isSandbox = Deno.env.get("KAKIAPAY_SANDBOX") === "true";

    if (!kakiaPayApiKey || !kakiaPaySecret) {
      throw new Error("Configuration KakiaPay manquante");
    }

    const kakiaPayBaseUrl = isSandbox 
      ? "https://sandbox-api.kkiapay.me" 
      : "https://api.kkiapay.me";

    // Effectuer le remboursement via KakiaPay API
    let refundResult;
    try {
      if (payment?.transaction_id) {
        console.log('🔄 Appel API KakiaPay pour remboursement...');
        
        const refundResponse = await fetch(`${kakiaPayBaseUrl}/api/v1/transactions/${payment.transaction_id}/refund`, {
          method: "POST",
          headers: {
            "X-API-KEY": kakiaPayApiKey,
            "X-SECRET-KEY": kakiaPaySecret,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: amount,
            reason: reason || "Réservation refusée par le propriétaire"
          }),
        });

        if (!refundResponse.ok) {
          const errorText = await refundResponse.text();
          console.error('❌ Erreur KakiaPay:', errorText);
          throw new Error(`Erreur KakiaPay: ${errorText}`);
        }

        refundResult = await refundResponse.json();
        console.log('✅ Remboursement KakiaPay réussi:', refundResult);
      } else {
        console.warn('⚠️ Pas de transaction_id, remboursement manuel requis');
        refundResult = { 
          status: 'pending_manual', 
          message: 'Remboursement nécessite traitement manuel' 
        };
      }
    } catch (kakiaPayError) {
      console.error('❌ Erreur lors du remboursement KakiaPay:', kakiaPayError);
      // On continue pour enregistrer la demande de remboursement
      refundResult = { 
        status: 'failed', 
        error: kakiaPayError.message 
      };
    }

    // Mettre à jour le statut du paiement
    if (payment) {
      await supabaseService
        .from('payments')
        .update({ 
          status: 'refunded',
          refund_reason: reason,
          refund_date: new Date().toISOString()
        })
        .eq('id', payment.id);
    }

    // Mettre à jour la réservation
    await supabaseService
      .from('bookings')
      .update({ 
        payment_status: 'refunded',
        refund_initiated_at: new Date().toISOString()
      })
      .eq('id', booking_id);

    // Créer une notification pour le locataire
    await supabaseService.from('notifications').insert({
      user_id: booking.renter_id,
      type: 'refund_initiated',
      title: '💰 Remboursement en cours',
      message: `Le remboursement de ${amount.toLocaleString()} FCFA pour "${booking.equipment.title}" a été initié. Vous serez crédité sous 3-5 jours ouvrables.`,
      booking_id: booking_id
    });

    // Enregistrer le log de remboursement
    await supabaseService.from('refund_logs').insert({
      booking_id: booking_id,
      payment_id: payment?.id,
      amount: amount,
      reason: reason,
      status: refundResult.status || 'initiated',
      kakiapay_response: refundResult
    }).catch(err => console.warn('Erreur log remboursement:', err));

    return new Response(JSON.stringify({ 
      success: true,
      refund_status: refundResult.status || 'initiated',
      message: "Remboursement initié avec succès",
      details: refundResult
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Erreur remboursement:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});