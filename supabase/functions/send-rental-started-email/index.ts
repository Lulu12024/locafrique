// ========================================
// Fichier: supabase/functions/send-rental-started-email/index.ts
// Fonction Edge pour envoyer un email quand une location démarre
// VERSION PROPRE ET FINALE
// ========================================

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
    console.log('📧 Envoi email location démarrée');

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { booking_id } = await req.json();

    // Récupérer les données de la réservation
    const { data: booking, error } = await supabaseService
      .from('bookings')
      .select(`
        *,
        equipment:equipments(
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

    if (error || !booking) {
      console.error('❌ Erreur récupération booking:', error);
      throw new Error(`Réservation non trouvée: ${error?.message}`);
    }

    console.log('✅ Booking trouvé:', {
      equipment: booking.equipment.title,
      renter: booking.renter.email
    });

    // 🔔 CRÉER LA NOTIFICATION
    const { error: notifError } = await supabaseService
      .from('notifications')
      .insert({
        user_id: booking.renter.id,
        type: 'rental_started',
        title: 'Location demarree',
        message: `Votre location de "${booking.equipment.title}" a demarre.`,
        booking_id: booking_id,
        read: false
      });

    if (notifError) {
      console.error('⚠️ Erreur création notification:', notifError);
    } else {
      console.log('✅ Notification créée avec succès');
    }

    // Formater les dates
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

    // Email HTML au locataire
    const emailHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
</head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;background-color:#f5f5f5;">
<div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.1);">

<div style="background:linear-gradient(135deg,#10b981,#059669);color:#ffffff;padding:40px 30px;text-align:center;">
<h1 style="margin:0;font-size:28px;font-weight:700;">🎉 Votre location a demarre</h1>
<p style="margin:10px 0 0 0;font-size:16px;">Profitez bien de votre materiel</p>
</div>

<div style="padding:30px;">
<p style="font-size:18px;">Bonjour <strong>${renterFirstName}</strong>,</p>
<p>Bonne nouvelle ! Le proprietaire vient de confirmer que votre location de <strong>"${equipmentTitle}"</strong> a officiellement demarre.</p>

<div style="background-color:#f9fafb;padding:25px;margin:25px 0;border-radius:10px;border-left:5px solid #10b981;">
<h3 style="margin:0 0 20px 0;color:#10b981;font-size:20px;">📋 Details de la location</h3>

<table style="width:100%;border-collapse:collapse;">
<tr style="border-bottom:1px solid #e5e7eb;">
<td style="padding:12px 0;color:#6b7280;font-size:14px;">📦 Equipement</td>
<td style="padding:12px 0;text-align:right;font-weight:600;color:#111827;">${equipmentTitle}</td>
</tr>
<tr style="border-bottom:1px solid #e5e7eb;">
<td style="padding:12px 0;color:#6b7280;font-size:14px;">📅 Date de debut</td>
<td style="padding:12px 0;text-align:right;font-weight:600;color:#111827;">${formatDate(booking.start_date)}</td>
</tr>
<tr style="border-bottom:1px solid #e5e7eb;">
<td style="padding:12px 0;color:#6b7280;font-size:14px;">📅 Date de fin</td>
<td style="padding:12px 0;text-align:right;font-weight:600;color:#111827;">${formatDate(booking.end_date)}</td>
</tr>
<tr>
<td style="padding:12px 0;color:#6b7280;font-size:14px;">💰 Prix total</td>
<td style="padding:12px 0;text-align:right;font-weight:700;color:#10b981;font-size:18px;">${booking.total_price.toLocaleString()} FCFA</td>
</tr>
</table>
</div>

<div style="background-color:#fef3c7;padding:20px;margin:25px 0;border-radius:8px;border-left:5px solid #f59e0b;">
<h4 style="margin:0 0 10px 0;color:#92400e;">⚠️ Rappel important</h4>
<p style="margin:0;color:#78350f;">Prenez soin du materiel et restituez-le dans les memes conditions a la date prevue : <strong>${formatDate(booking.end_date)}</strong></p>
</div>

<p style="margin-top:25px;">Profitez bien de votre location ! Si vous avez des questions, n'hesitez pas a contacter le proprietaire.</p>

<div style="text-align:center;margin-top:30px;">
<a href="https://locafrique.onrender.com/my-bookings" style="display:inline-block;background-color:#10b981;color:#ffffff;padding:15px 40px;text-decoration:none;border-radius:8px;font-weight:600;">Voir ma reservation</a>
</div>

</div>

<div style="text-align:center;padding:25px;color:#6b7280;font-size:13px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
<p style="margin:5px 0;"><strong>3W-LOC</strong> - Plateforme de location de materiel</p>
<p style="margin:5px 0;">© 2025 3W-LOC. Tous droits reserves.</p>
</div>

</div>
</body>
</html>`;

    // Configuration Gmail
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!gmailUser || !gmailPassword) {
      throw new Error("Gmail non configure");
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
      subject: `🎉 Votre location a demarre - ${equipmentTitle}`,
      html: emailHTML,
    });

    await client.close();

    console.log('✅ Email envoyé avec succès');

    return new Response(
      JSON.stringify({ success: true, message: "Email envoye" }), 
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