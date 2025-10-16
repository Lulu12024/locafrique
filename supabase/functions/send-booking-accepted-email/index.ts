// supabase/functions/send-booking-accepted-email/index.ts
// Envoie un email au propriétaire avec toutes les infos du locataire quand il accepte

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

    // Récupérer TOUTES les infos de la réservation
    const { data: booking, error } = await supabaseService
      .from('bookings')
      .select(`
        *,
        equipment:equipments(
          title,
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
          phone_number,
          avatar_url
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

    const ownerFirstName = booking.equipment.owner.first_name || 'Propriétaire';
    const renterFullName = `${booking.renter.first_name} ${booking.renter.last_name}`;
    const equipmentTitle = booking.equipment.title;

    // Email HTML au propriétaire avec TOUTES les infos
    const emailHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
</head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;background-color:#f5f5f5;">
<div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.1);">

<div style="background:linear-gradient(135deg,#10b981,#3b82f6);color:#ffffff;padding:40px 30px;text-align:center;">
<h1 style="margin:0;font-size:28px;font-weight:700;">✅ Réservation confirmée</h1>
<p style="margin:10px 0 0 0;font-size:16px;">Coordonnées complètes du locataire</p>
</div>

<div style="padding:30px;">
<p style="font-size:18px;">Bonjour <strong>${ownerFirstName}</strong>,</p>
<p>Vous avez accepté la réservation pour <strong>${equipmentTitle}</strong>. Voici toutes les informations du locataire :</p>

<div style="background-color:#f9fafb;padding:25px;margin:25px 0;border-radius:10px;border-left:5px solid #10b981;">
<h3 style="margin:0 0 20px 0;color:#10b981;font-size:20px;">📋 Coordonnées du locataire</h3>

<table style="width:100%;border-collapse:collapse;">
<tr style="border-bottom:1px solid #e5e7eb;">
<td style="padding:12px 0;color:#6b7280;font-size:14px;">👤 Nom complet</td>
<td style="padding:12px 0;text-align:right;font-weight:600;color:#111827;">${renterFullName}</td>
</tr>
<tr style="border-bottom:1px solid #e5e7eb;">
<td style="padding:12px 0;color:#6b7280;font-size:14px;">📧 Email</td>
<td style="padding:12px 0;text-align:right;font-weight:600;color:#111827;">${booking.renter.email}</td>
</tr>
${booking.renter.phone_number ? `
<tr style="border-bottom:1px solid #e5e7eb;">
<td style="padding:12px 0;color:#6b7280;font-size:14px;">📞 Téléphone</td>
<td style="padding:12px 0;text-align:right;font-weight:600;color:#111827;">${booking.renter.phone_number}</td>
</tr>
` : ''}
<tr style="border-bottom:1px solid #e5e7eb;">
<td style="padding:12px 0;color:#6b7280;font-size:14px;">📅 Du</td>
<td style="padding:12px 0;text-align:right;font-weight:600;color:#111827;">${formatDate(booking.start_date)}</td>
</tr>
<tr style="border-bottom:1px solid #e5e7eb;">
<td style="padding:12px 0;color:#6b7280;font-size:14px;">📅 Au</td>
<td style="padding:12px 0;text-align:right;font-weight:600;color:#111827;">${formatDate(booking.end_date)}</td>
</tr>
<tr style="border-bottom:1px solid #e5e7eb;">
<td style="padding:12px 0;color:#6b7280;font-size:14px;">💰 Prix convenu</td>
<td style="padding:12px 0;text-align:right;font-weight:700;color:#10b981;font-size:18px;">${booking.total_price.toLocaleString()} FCFA</td>
</tr>
${booking.delivery_method ? `
<tr style="border-bottom:1px solid #e5e7eb;">
<td style="padding:12px 0;color:#6b7280;font-size:14px;">🚚 Livraison</td>
<td style="padding:12px 0;text-align:right;font-weight:600;color:#111827;">${booking.delivery_method === 'pickup' ? 'Retrait sur place' : 'Livraison - ' + (booking.delivery_address || '')}</td>
</tr>
` : ''}
${booking.identity_number ? `
<tr>
<td style="padding:12px 0;color:#6b7280;font-size:14px;">🪪 N° pièce d'identité</td>
<td style="padding:12px 0;text-align:right;font-weight:600;color:#111827;">${booking.identity_number}</td>
</tr>
` : ''}
</table>
</div>

${booking.special_requests ? `
<div style="background-color:#fef3c7;padding:20px;margin:25px 0;border-radius:8px;border-left:5px solid #f59e0b;">
<h4 style="margin:0 0 10px 0;color:#92400e;">💬 Demandes spéciales</h4>
<p style="margin:0;color:#78350f;">${booking.special_requests}</p>
</div>
` : ''}

${booking.identity_document_url ? `
<div style="background-color:#e0f2fe;padding:20px;margin:25px 0;border-radius:8px;border-left:5px solid #0284c7;">
<h4 style="margin:0 0 10px 0;color:#0c4a6e;">🪪 Document d'identité</h4>
<p style="margin:0 0 15px 0;color:#075985;">Le locataire a fourni une pièce d'identité :</p>
<a href="${booking.identity_document_url}" style="display:inline-block;background-color:#0284c7;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;">📄 Voir le document</a>
</div>
` : ''}

<div style="background-color:#dcfce7;padding:20px;margin:25px 0;border-radius:8px;text-align:center;">
<p style="margin:0;color:#166534;font-weight:600;">✅ La location est maintenant EN COURS</p>
<p style="margin:10px 0 0 0;color:#15803d;font-size:14px;">Vous pouvez contacter le locataire directement pour finaliser les détails.</p>
</div>

</div>

<div style="text-align:center;padding:25px;color:#6b7280;font-size:13px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
<p style="margin:5px 0;"><strong>3W-LOC</strong> - Plateforme de location de matériel</p>
<p style="margin:5px 0;">© 2025 3W-LOC. Tous droits réservés.</p>
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
      to: booking.equipment.owner.email,
      subject: `Reservation confirmee pour ${equipmentTitle}`,
      html: emailHTML,
      encoding: "base64",
    });

    await client.close();

    return new Response(
      JSON.stringify({ success: true, message: "Email envoyé" }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" }}
    );

  } catch (error: any) {
    console.error('Erreur:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});