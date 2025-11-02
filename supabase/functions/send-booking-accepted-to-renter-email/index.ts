// supabase/functions/send-booking-accepted-to-renter-email/index.ts
// Envoie un email au LOCATAIRE pour l'informer que sa réservation a été ACCEPTÉE

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
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { booking_id } = await req.json();

    // Récupérer les infos de la réservation
    const { data: booking, error } = await supabaseService
      .from('bookings')
      .select(`
        *,
        equipment:equipments(
          title,
          location,
          owner:profiles!equipments_owner_id_fkey(
            id,
            first_name,
            last_name,
            email,
            phone_number
          )
        ),
        renter:profiles!bookings_renter_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', booking_id)
      .single();

    if (error || !booking) {
      throw new Error(`Réservation non trouvée: ${error?.message}`);
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const renterFirstName = booking.renter.first_name || 'Locataire';
    const equipmentTitle = booking.equipment.title;
    const ownerFullName = `${booking.equipment.owner.first_name} ${booking.equipment.owner.last_name}`;
    const ownerPhone = booking.equipment.owner.phone_number;
    const equipmentLocation = booking.equipment.location;

    // Email HTML au LOCATAIRE pour confirmer que sa réservation est acceptée
    const emailHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
</head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;background-color:#f5f5f5;">
<div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.1);">

<div style="background:linear-gradient(135deg,#10b981,#059669);color:#ffffff;padding:40px 30px;text-align:center;">
<h1 style="margin:0;font-size:28px;font-weight:700;">🎉 Réservation acceptée !</h1>
<p style="margin:10px 0 0 0;font-size:16px;">Bonne nouvelle, votre demande a été confirmée</p>
</div>

<div style="padding:30px;">
<p style="font-size:18px;">Bonjour <strong>${renterFirstName}</strong>,</p>
<p>Excellente nouvelle ! Le propriétaire a <strong>accepté</strong> votre demande de réservation pour <strong>"${equipmentTitle}"</strong>.</p>

<div style="background-color:#dcfce7;padding:25px;margin:25px 0;border-radius:10px;border-left:5px solid #10b981;">
<h3 style="margin:0 0 20px 0;color:#166534;font-size:20px;">📋 Détails de votre réservation</h3>

<table style="width:100%;border-collapse:collapse;">
<tr style="border-bottom:1px solid #bbf7d0;">
<td style="padding:12px 0;color:#166534;font-size:14px;">📦 Équipement</td>
<td style="padding:12px 0;text-align:right;font-weight:600;color:#15803d;">${equipmentTitle}</td>
</tr>
<tr style="border-bottom:1px solid #bbf7d0;">
<td style="padding:12px 0;color:#166534;font-size:14px;">📅 Date de début</td>
<td style="padding:12px 0;text-align:right;font-weight:600;color:#15803d;">${formatDate(booking.start_date)}</td>
</tr>
<tr style="border-bottom:1px solid #bbf7d0;">
<td style="padding:12px 0;color:#166534;font-size:14px;">📅 Date de fin</td>
<td style="padding:12px 0;text-align:right;font-weight:600;color:#15803d;">${formatDate(booking.end_date)}</td>
</tr>
<tr style="border-bottom:1px solid #bbf7d0;">
<td style="padding:12px 0;color:#166534;font-size:14px;">💰 Montant total</td>
<td style="padding:12px 0;text-align:right;font-weight:700;color:#10b981;font-size:18px;">${booking.total_price.toLocaleString()} FCFA</td>
</tr>
<tr style="border-bottom:1px solid #bbf7d0;">
<td style="padding:12px 0;color:#166534;font-size:14px;">📍 Localisation</td>
<td style="padding:12px 0;text-align:right;font-weight:600;color:#15803d;">${equipmentLocation}</td>
</tr>
${booking.delivery_method ? `
<tr>
<td style="padding:12px 0;color:#166534;font-size:14px;">🚚 Mode de récupération</td>
<td style="padding:12px 0;text-align:right;font-weight:600;color:#15803d;">${booking.delivery_method === 'pickup' ? 'Retrait sur place' : 'Livraison à domicile'}</td>
</tr>
` : ''}
</table>
</div>

<div style="background-color:#e0f2fe;padding:25px;margin:25px 0;border-radius:10px;border-left:5px solid #0284c7;">
<h3 style="margin:0 0 15px 0;color:#0c4a6e;font-size:18px;">👤 Coordonnées du propriétaire</h3>
<table style="width:100%;border-collapse:collapse;">
<tr style="border-bottom:1px solid #bae6fd;">
<td style="padding:10px 0;color:#0c4a6e;font-size:14px;">Nom</td>
<td style="padding:10px 0;text-align:right;font-weight:600;color:#075985;">${ownerFullName}</td>
</tr>
${ownerPhone ? `
<tr>
<td style="padding:10px 0;color:#0c4a6e;font-size:14px;">📞 Téléphone</td>
<td style="padding:10px 0;text-align:right;font-weight:600;color:#075985;">${ownerPhone}</td>
</tr>
` : ''}
</table>
<p style="margin:15px 0 0 0;color:#075985;font-size:13px;">💡 <em>Vous pouvez contacter le propriétaire pour convenir des détails de la remise du matériel.</em></p>
</div>

<div style="background-color:#fef3c7;padding:20px;margin:25px 0;border-radius:8px;border-left:5px solid #f59e0b;">
<h4 style="margin:0 0 10px 0;color:#92400e;font-size:16px;">⏰ Prochaines étapes</h4>
<ol style="margin:5px 0;padding-left:20px;color:#78350f;font-size:14px;">
<li style="margin-bottom:8px;">Contactez le propriétaire pour organiser la remise du matériel</li>
<li style="margin-bottom:8px;">Préparez le paiement convenu (${booking.total_price.toLocaleString()} FCFA)</li>
<li style="margin-bottom:8px;">Présentez-vous au lieu et à l'heure convenus</li>
<li>Profitez de votre location !</li>
</ol>
</div>

<div style="text-align:center;margin:30px 0;">
<p style="color:#6b7280;font-size:14px;margin:0 0 15px 0;">Gérez votre réservation depuis votre espace personnel</p>
<a href="https://locafrique.onrender.com/my-bookings" style="display:inline-block;background-color:#10b981;color:#ffffff;padding:15px 35px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Voir mes réservations</a>
</div>

</div>

<div style="text-align:center;padding:25px;color:#6b7280;font-size:13px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
<p style="margin:5px 0;"><strong>3W-LOC</strong> - Plateforme de location de matériel</p>
<p style="margin:5px 0;">© 2025 3W-LOC. Tous droits réservés.</p>
<p style="margin:10px 0 5px 0;font-size:11px;">Cet email a été envoyé automatiquement suite à l'acceptation de votre réservation.</p>
</div>

</div>
</body>
</html>`;

    // Configuration Gmail
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!gmailUser || !gmailPassword) {
      throw new Error("Gmail non configuré");
    }

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

    await client.send({
      from: gmailUser,
      to: booking.renter.email,
      subject: `🎉 Votre reservation pour ${equipmentTitle} est confirmee !`,
      html: emailHTML,
      encoding: "base64",
    });

    await client.close();

    console.log('✅ Email de confirmation envoyé au locataire');

    return new Response(
      JSON.stringify({ success: true, message: "Email envoyé au locataire" }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" }}
    );

  } catch (error: any) {
    console.error('❌ Erreur:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});