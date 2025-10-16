// supabase/functions/send-booking-notification-gmail/index.ts
// Envoie un email au propriétaire via Gmail SMTP quand une réservation est créée

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📧 Début envoi email notification propriétaire...");

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { booking_id } = await req.json();

    if (!booking_id) {
      throw new Error("booking_id requis");
    }

    console.log("🔍 Récupération de la réservation:", booking_id);

    // Récupérer les détails complets de la réservation
    const { data: booking, error: bookingError } = await supabaseService
      .from('bookings')
      .select(`
        *,
        equipment:equipments(
          id,
          title,
          daily_price,
          deposit_amount,
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

    console.log("✅ Réservation trouvée:", booking.equipment.title);

    // Vérifier que le propriétaire a un email
    if (!booking.equipment.owner.email) {
      throw new Error("Email du propriétaire manquant");
    }

    // Formatter les dates
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Contenu HTML de l'email
    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      max-width: 600px; 
      margin: 0 auto; 
      background: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header { 
      background: linear-gradient(135deg, #10b981, #3b82f6); 
      color: white; 
      padding: 30px; 
      text-align: center; 
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content { 
      padding: 30px; 
    }
    .card { 
      background: #f9fafb; 
      padding: 20px; 
      margin: 20px 0; 
      border-radius: 8px; 
      border-left: 4px solid #10b981;
    }
    .info-row { 
      display: flex; 
      justify-content: space-between; 
      padding: 10px 0; 
      border-bottom: 1px solid #e5e7eb; 
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button { 
      display: inline-block; 
      background: #10b981; 
      color: white; 
      padding: 12px 30px; 
      text-decoration: none; 
      border-radius: 6px; 
      font-weight: bold; 
      margin: 0 10px;
    }
    .button-reject { 
      background: #ef4444; 
    }
    .highlight { 
      color: #10b981; 
      font-weight: bold; 
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 12px;
      background: #f9fafb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Nouvelle demande de réservation</h1>
    </div>
    
    <div class="content">
      <p>Bonjour <strong>${booking.equipment.owner.first_name}</strong>,</p>
      
      <p>Bonne nouvelle ! Vous avez reçu une nouvelle demande de réservation pour votre équipement.</p>
      
      <div class="card">
        <h3 style="margin-top: 0; color: #10b981;">📋 Détails de la réservation</h3>
        
        <div class="info-row">
          <span>🏗️ Équipement :</span>
          <strong>${booking.equipment.title}</strong>
        </div>
        
        <div class="info-row">
          <span>👤 Locataire :</span>
          <strong>${booking.renter.first_name} ${booking.renter.last_name}</strong>
        </div>
        
        <div class="info-row">
          <span>📧 Email :</span>
          <span>${booking.renter.email}</span>
        </div>
        
        ${booking.renter.phone_number ? `
        <div class="info-row">
          <span>📞 Téléphone :</span>
          <span>${booking.renter.phone_number}</span>
        </div>
        ` : ''}
        
        <div class="info-row">
          <span>📅 Période :</span>
          <strong>${formatDate(booking.start_date)} au ${formatDate(booking.end_date)}</strong>
        </div>
        
        <div class="info-row">
          <span>💰 Prix total :</span>
          <strong class="highlight">${booking.total_price?.toLocaleString()} FCFA</strong>
        </div>
        
        <div class="info-row">
          <span>💳 Statut paiement :</span>
          <span style="color: #10b981; font-weight: bold;">✅ Payé</span>
        </div>
      </div>
      
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 6px;">
        <p style="margin: 0; color: #92400e;">
          ⚠️ <strong>Action requise :</strong> Veuillez vous connecter à votre tableau de bord pour <strong>accepter ou refuser</strong> cette réservation dans les plus brefs délais.
        </p>
      </div>
      
      <div class="button-container">
        <a href="https://votre-domaine.com/dashboard" class="button">
          Voir la demande
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        💡 <strong>Rappel :</strong> Le locataire a déjà effectué le paiement. Vous recevrez votre paiement une fois la location confirmée et terminée.
      </p>
    </div>
    
    <div class="footer">
      <p>Cet email a été envoyé automatiquement par 3W-LOC</p>
      <p>© 2025 3W-LOC - Plateforme de location de matériel</p>
    </div>
  </div>
</body>
</html>
    `;

    // Version texte brut (fallback)
    const emailText = `
Nouvelle demande de réservation - 3W-LOC

Bonjour ${booking.equipment.owner.first_name},

Vous avez reçu une nouvelle demande de réservation :

Équipement : ${booking.equipment.title}
Locataire : ${booking.renter.first_name} ${booking.renter.last_name}
Email : ${booking.renter.email}
${booking.renter.phone_number ? `Téléphone : ${booking.renter.phone_number}` : ''}
Dates : ${formatDate(booking.start_date)} au ${formatDate(booking.end_date)}
Prix total : ${booking.total_price?.toLocaleString()} FCFA
Statut : Payé ✅

Veuillez vous connecter à votre tableau de bord pour accepter ou refuser la réservation.

Cordialement,
L'équipe 3W-LOC
    `;

    // Configuration Gmail SMTP
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!gmailUser || !gmailPassword) {
      throw new Error("Variables GMAIL_USER ou GMAIL_APP_PASSWORD non configurées");
    }

    console.log("📤 Connexion au serveur SMTP Gmail...");

    // Créer le client SMTP
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: gmailUser,
          password: gmailPassword,
        },
      },
    });

    console.log("📨 Envoi de l'email à:", booking.equipment.owner.email);

    // Envoyer l'email
    await client.send({
      from: gmailUser,
      to: booking.equipment.owner.email,
      subject: `🔔 Nouvelle réservation pour "${booking.equipment.title}"`,
      content: "auto",
      html: emailHTML,
      text: emailText,
    });

    await client.close();

    console.log("✅ Email envoyé avec succès !");

    // Enregistrer le log d'email
    await supabaseService.from('email_logs').insert({
      booking_id: booking_id,
      email_type: 'booking_notification_owner',
      recipients: [booking.equipment.owner.email],
      status: 'success',
      sent_count: 1
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Email envoyé au propriétaire avec succès"
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Erreur envoi email:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});