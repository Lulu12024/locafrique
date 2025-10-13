// supabase/functions/send-booking-notification-email/index.ts
// Envoie un email au propriétaire dès qu'une nouvelle réservation est créée

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

    const { booking_id } = await req.json();

    if (!booking_id) {
      throw new Error("booking_id requis");
    }

    // Récupérer les détails de la réservation
    const { data: booking, error: bookingError } = await supabaseService
      .from('bookings')
      .select(`
        *,
        equipment:equipments(
          id,
          title,
          daily_price,
          owner:profiles!equipments_owner_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        ),
        renter:profiles!bookings_renter_id_fkey(
          id,
          first_name,
          last_name,
          email,
          phone_number
        )
      `)
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error(`Réservation non trouvée: ${bookingError?.message}`);
    }

    // Configuration email (Resend)
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY non configurée");
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Contenu de l'email pour le propriétaire
    const emailContent = {
      subject: `🔔 Nouvelle réservation pour "${booking.equipment.title}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; }
            .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 5px; }
            .button-reject { background: #ef4444; }
            .highlight { color: #10b981; font-weight: bold; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔔 Nouvelle demande de réservation</h1>
          </div>
          
          <div class="content">
            <p>Bonjour <strong>${booking.equipment.owner.first_name}</strong>,</p>
            
            <p>Vous avez reçu une nouvelle demande de réservation pour votre équipement.</p>
            
            <div class="card">
              <h3 style="margin-top: 0;">📋 Détails de la réservation</h3>
              
              <div class="info-row">
                <span>Équipement :</span>
                <strong>${booking.equipment.title}</strong>
              </div>
              
              <div class="info-row">
                <span>Locataire :</span>
                <strong>${booking.renter.first_name} ${booking.renter.last_name}</strong>
              </div>
              
              <div class="info-row">
                <span>Email :</span>
                <span>${booking.renter.email}</span>
              </div>
              
              ${booking.contact_phone ? `
              <div class="info-row">
                <span>Téléphone :</span>
                <span>${booking.contact_phone}</span>
              </div>
              ` : ''}
              
              <div class="info-row">
                <span>Dates :</span>
                <strong>${formatDate(booking.start_date)} → ${formatDate(booking.end_date)}</strong>
              </div>
              
              <div class="info-row">
                <span>Prix total :</span>
                <strong class="highlight">${booking.total_price?.toLocaleString()} FCFA</strong>
              </div>
              
              <div class="info-row">
                <span>Statut paiement :</span>
                <span style="color: #10b981; font-weight: bold;">✅ Payé</span>
              </div>
            </div>

            ${booking.special_requests ? `
            <div class="card" style="background: #fef3c7;">
              <h4 style="margin-top: 0;">💬 Demandes spéciales</h4>
              <p style="margin: 0;">${booking.special_requests}</p>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-weight: bold;">Action requise :</p>
              <a href="${Deno.env.get("SITE_URL")}/dashboard/bookings" class="button">
                ✅ Confirmer la réservation
              </a>
              <a href="${Deno.env.get("SITE_URL")}/dashboard/bookings" class="button button-reject">
                ❌ Refuser la réservation
              </a>
            </div>
            
            <div class="card" style="background: #e0f2fe;">
              <p style="margin: 0; font-size: 14px;">
                ℹ️ <strong>Important :</strong> Le locataire a déjà effectué le paiement. 
                Veuillez confirmer ou refuser rapidement la réservation. 
                En cas de refus, le montant sera remboursé automatiquement.
              </p>
            </div>
            
            <p style="margin-top: 30px;">
              Cordialement,<br>
              <strong>L'équipe 3W-LOC</strong>
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Nouvelle demande de réservation
        
        Bonjour ${booking.equipment.owner.first_name},
        
        Vous avez reçu une nouvelle demande de réservation pour "${booking.equipment.title}".
        
        Locataire : ${booking.renter.first_name} ${booking.renter.last_name}
        Email : ${booking.renter.email}
        Dates : ${formatDate(booking.start_date)} au ${formatDate(booking.end_date)}
        Prix total : ${booking.total_price?.toLocaleString()} FCFA
        Statut : Payé ✅
        
        Veuillez confirmer ou refuser la réservation depuis votre tableau de bord.
        
        Cordialement,
        L'équipe 3W-LOC
      `
    };

    // Envoi de l'email via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "3W-LOC <notifications@3w-loc.com>",
        to: [booking.equipment.owner.email],
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur Resend: ${errorText}`);
    }

    // Enregistrer le log d'email
    await supabaseService.from('email_logs').insert({
      booking_id: booking_id,
      email_type: 'booking_notification_owner',
      recipients: [booking.equipment.owner.email],
      status: 'success',
      sent_count: 1
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: "Email envoyé au propriétaire"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Erreur:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});