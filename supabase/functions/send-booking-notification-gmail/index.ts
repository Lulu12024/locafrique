// supabase/functions/send-booking-notification-gmail/index.ts
// VERSION AVEC GMAIL API REST (Plus fiable que SMTP pour HTML)

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
      console.error("❌ Erreur récupération réservation:", bookingError);
      throw new Error(`Réservation non trouvée: ${bookingError?.message}`);
    }

    // ✅ LOG des données récupérées pour debugging
    console.log("📋 Données brutes de la réservation:", JSON.stringify({
      id: booking.id,
      has_equipment: !!booking.equipment,
      has_renter: !!booking.renter,
      equipment_title: booking.equipment?.title,
      owner_email: booking.equipment?.owner?.email,
      renter_email: booking.renter?.email
    }, null, 2));

    // ✅ VÉRIFICATIONS ROBUSTES des données
    console.log("📋 Vérification des données de la réservation...");
    
    if (!booking.equipment) {
      throw new Error("Données de l'équipement manquantes dans la réservation");
    }
    
    if (!booking.equipment.title) {
      throw new Error("Titre de l'équipement manquant");
    }
    
    if (!booking.equipment.owner) {
      throw new Error("Données du propriétaire manquantes");
    }
    
    if (!booking.equipment.owner.email) {
      throw new Error("Email du propriétaire manquant");
    }
    
    if (!booking.renter) {
      throw new Error("Données du locataire manquantes");
    }
    
    if (!booking.renter.first_name || !booking.renter.last_name) {
      throw new Error("Nom du locataire manquant");
    }

    console.log("✅ Réservation trouvée:", booking.equipment.title);
    console.log("✅ Propriétaire:", booking.equipment.owner.email);
    console.log("✅ Locataire:", booking.renter.email);

    // Formatter les dates avec vérification
    const formatDate = (dateString: string | undefined) => {
      if (!dateString) return 'Date non définie';
      try {
        return new Date(dateString).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (error) {
        console.error("Erreur formatage date:", error);
        return 'Date invalide';
      }
    };

    // Préparer les données de manière sécurisée
    const ownerFirstName = booking.equipment.owner.first_name || 'Propriétaire';
    const renterFirstName = booking.renter.first_name || '';
    const renterLastName = booking.renter.last_name || '';
    const renterFullName = `${renterFirstName} ${renterLastName}`.trim() || 'Locataire';
    const renterEmail = booking.renter.email || 'Email non disponible';
    const renterPhone = booking.renter.phone_number || null;
    const equipmentTitle = booking.equipment.title || 'Équipement';
    const totalPrice = booking.total_price || 0;
    const startDate = booking.start_date;
    const endDate = booking.end_date;
    const paymentStatus = booking.payment_status === 'paid' ? 'Payé' : 'En attente';

    // Configuration Gmail API
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!gmailUser || !gmailPassword) {
      throw new Error("Variables GMAIL_USER ou GMAIL_APP_PASSWORD non configurées");
    }

    // ✅ Contenu HTML simplifié et propre
    const emailHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;background-color:#f5f5f5;">
<div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.1);">

<div style="background:linear-gradient(135deg,#10b981,#3b82f6);color:#ffffff;padding:40px 30px;text-align:center;">
<h1 style="margin:0;font-size:28px;font-weight:700;">🔔 Nouvelle demande de réservation</h1>
<p style="margin:10px 0 0 0;font-size:16px;opacity:0.95;">Vous avez une réservation en attente de validation</p>
</div>

<div style="padding:30px;">
<p style="font-size:18px;margin-bottom:20px;">Bonjour <strong>${ownerFirstName}</strong>,</p>
<p>Bonne nouvelle ! Vous avez reçu une nouvelle demande de réservation pour votre équipement.</p>

<div style="background-color:#f9fafb;padding:25px;margin:25px 0;border-radius:10px;border-left:5px solid #10b981;">
<h3 style="margin:0 0 20px 0;color:#10b981;font-size:20px;">📋 Détails de la réservation</h3>

<table style="width:100%;border-collapse:collapse;">
<tr style="border-bottom:1px solid #e5e7eb;">
<td style="padding:12px 0;color:#6b7280;font-size:14px;">🏗️ Équipement</td>
<td style="padding:12px 0;text-align:right;font-weight:600;color:#111827;">${equipmentTitle}</td>
</tr>
<tr style="border-bottom:1px solid #e5e7eb;">
<td style="padding:12px 0;color:#6b7280;font-size:14px;">👤 Locataire</td>
<td style="padding:12px 0;text-align:right;font-weight:600;color:#111827;">${renterFullName}</td>
</tr>
<tr style="border-bottom:1px solid #e5e7eb;">
<td style="padding:12px 0;color:#6b7280;font-size:14px;">📧 Email</td>
<td style="padding:12px 0;text-align:right;font-weight:600;color:#111827;">${renterEmail}</td>
</tr>
${renterPhone ? `<tr style="border-bottom:1px solid #e5e7eb;">
<td style="padding:12px 0;color:#6b7280;font-size:14px;">📞 Téléphone</td>
<td style="padding:12px 0;text-align:right;font-weight:600;color:#111827;">${renterPhone}</td>
</tr>` : ''}
<tr style="border-bottom:1px solid #e5e7eb;">
<td style="padding:12px 0;color:#6b7280;font-size:14px;">📅 Date de début</td>
<td style="padding:12px 0;text-align:right;font-weight:600;color:#111827;">${formatDate(startDate)}</td>
</tr>
<tr style="border-bottom:1px solid #e5e7eb;">
<td style="padding:12px 0;color:#6b7280;font-size:14px;">📅 Date de fin</td>
<td style="padding:12px 0;text-align:right;font-weight:600;color:#111827;">${formatDate(endDate)}</td>
</tr>
<tr style="border-bottom:1px solid #e5e7eb;">
<td style="padding:12px 0;color:#6b7280;font-size:14px;">💰 Prix total</td>
<td style="padding:12px 0;text-align:right;font-weight:700;color:#10b981;font-size:18px;">${totalPrice.toLocaleString()} FCFA</td>
</tr>

</table>
</div>

<div style="background-color:#fef3c7;border-left:5px solid #f59e0b;padding:20px;margin:25px 0;border-radius:8px;">
<p style="margin:0;color:#92400e;font-size:15px;">⚠️ <strong>Action requise :</strong> Veuillez vous connecter à votre tableau de bord pour <strong>accepter ou refuser</strong> cette réservation dans les plus brefs délais.</p>
</div>

<div style="text-align:center;margin:30px 0;">
<a href="https://locafrique.onrender.com/received-bookings" style="display:inline-block;background-color:#10b981;color:#ffffff;padding:15px 40px;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;">Voir la demande</a>
</div>

<p style="color:#6b7280;font-size:15px;margin-top:30px;padding:20px;background-color:#f9fafb;border-radius:8px;">💡 <strong>Rappel :</strong> ${paymentStatus === 'Payé' ? 'Le locataire a déjà effectué le paiement. Vous recevrez votre paiement une fois la location confirmée et terminée.' : 'Le paiement sera effectué lors de la remise du matériel.'}</p>
</div>

<div style="text-align:center;padding:25px;color:#6b7280;font-size:13px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
<p style="margin:5px 0;"><strong>3W-LOC</strong> - Plateforme de location de matériel</p>
<p style="margin:5px 0;">© 2025 3W-LOC. Tous droits réservés.</p>
<p style="margin:10px 0 5px 0;font-size:11px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
</div>

</div>
</body>
</html>`;

    // ✅ Créer l'email au format MIME avec Base64
    const emailContent = [
      `From: 3W-LOC <${gmailUser}>`,
      `To: ${booking.equipment.owner.email}`,
      `Subject: Nouvelle reservation pour ${equipmentTitle}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      btoa(unescape(encodeURIComponent(emailHTML)))
    ].join('\r\n');

    // ✅ Encoder en base64 pour Gmail API
    const encodedEmail = btoa(emailContent).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    console.log("📤 Envoi via Gmail API...");

    // ✅ OPTION 1: Utiliser Gmail API avec OAuth2 (recommandé en production)
    // Pour l'instant, utilisons SMTP mais avec un encodage correct
    
    // Importer la bibliothèque SMTP
    const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");

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

    // ✅ Envoi avec encoding forcé en base64
    await client.send({
      from: gmailUser,
      to: booking.equipment.owner.email,
      subject: `Nouvelle reservation pour ${equipmentTitle}`,
      html: emailHTML,
      encoding: "base64", // ✅ FORCER BASE64 au lieu de quoted-printable
    });

    await client.close();

    console.log("✅ Email envoyé avec succès !");

    // ✅ CRÉER LA NOTIFICATION ICI (avec service_role, contourne RLS)
    console.log("📬 Création de la notification pour le propriétaire...");
    
    try {
      const ownerId = booking.equipment.owner?.id;
      
      if (!ownerId) {
        console.warn('⚠️ owner_id manquant, notification non créée');
      } else {
        const safeMessage = JSON.stringify({  // Enveloppez si message est JSON
          text: `${renterFullName || 'Inconnu'} a réservé ${equipmentTitle || 'Équipement'} du ${formatDate(startDate)} au ${formatDate(endDate)} pour ${totalPrice.toLocaleString()} FCFA. ${paymentStatus === 'Payé' ? 'Paiement confirmé.' : 'Paiement à la livraison.'}`
        });
        
        const notificationData = {
          user_id: ownerId,
          type: 'new_booking',
          title: 'Nouvelle réservation',
          message: safeMessage,  // Utilisez la version enveloppée
          booking_id: booking_id,
          read: false
        };
        
        console.log('📋 Données notification:', JSON.stringify(notificationData, null, 2));
        
        const { data: insertedNotif, error: notifError } = await supabaseService
          .from('notifications')
          .insert(notificationData)
          .select();
        
        if (notifError) {
          console.error('⚠️ Erreur création notification:', notifError);
          console.error('⚠️ Code erreur:', notifError.code);
          console.error('⚠️ Détails:', notifError.details);
        } else {
          console.log('✅ Notification créée avec succès:', insertedNotif);
        }
      }
    } catch (notifErr) {
      console.error('⚠️ Exception notification:', notifErr);
      // Gérer l'erreur globalement
    }

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
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Erreur envoi email:', error);
    console.error('❌ Stack trace:', error.stack);
    
    if (error.message) {
      console.error('Message d\'erreur:', error.message);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Erreur inconnue lors de l\'envoi de l\'email',
        details: error.stack
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
        status: 500,
      }
    );
  }
});