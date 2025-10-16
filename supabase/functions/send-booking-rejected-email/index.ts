// supabase/functions/send-booking-rejected-email/index.ts
// Envoie un email au locataire quand sa demande est refusée

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

    const { data: booking, error } = await supabaseService
      .from('bookings')
      .select(`
        *,
        equipment:equipments(title),
        renter:profiles!bookings_renter_id_fkey(first_name, email)
      `)
      .eq('id', booking_id)
      .single();

    if (error || !booking) throw new Error("Réservation non trouvée");

    const emailHTML = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;background-color:#f5f5f5;">
<div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;">

<div style="background:linear-gradient(135deg,#ef4444,#dc2626);color:#ffffff;padding:40px 30px;text-align:center;">
<h1 style="margin:0;font-size:28px;">Demande non acceptée</h1>
</div>

<div style="padding:30px;">
<p>Bonjour <strong>${booking.renter.first_name}</strong>,</p>
<p>Nous regrettons de vous informer que votre demande de réservation pour <strong>${booking.equipment.title}</strong> n'a pas été acceptée par le propriétaire.</p>

<div style="background-color:#fef2f2;padding:20px;margin:25px 0;border-radius:8px;border-left:5px solid #ef4444;">
<p style="margin:0;color:#991b1b;"><strong>Ne vous découragez pas !</strong> Nous avons de nombreux autres équipements disponibles sur la plateforme.</p>
</div>

<div style="text-align:center;margin:30px 0;">
<a href="https://votre-domaine.com/search" style="display:inline-block;background-color:#10b981;color:#ffffff;padding:15px 30px;text-decoration:none;border-radius:8px;font-weight:600;">Voir d'autres équipements</a>
</div>

</div>

<div style="text-align:center;padding:20px;color:#6b7280;font-size:13px;background-color:#f9fafb;">
<p>© 2025 3W-LOC</p>
</div>

</div>
</body>
</html>`;

    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!gmailUser || !gmailPassword) throw new Error("Gmail non configuré");

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: { username: gmailUser, password: gmailPassword },
      },
    });

    await client.send({
      from: gmailUser,
      to: booking.renter.email,
      subject: `Demande non acceptee pour ${booking.equipment.title}`,
      html: emailHTML,
      encoding: "base64",
    });

    await client.close();

    return new Response(
      JSON.stringify({ success: true }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" }}
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});