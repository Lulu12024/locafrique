// supabase/functions/send-date-proposal-email/index.ts
// Envoie un email au locataire avec proposition de nouvelles dates

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

    const { booking_id, proposed_start_date, proposed_end_date } = await req.json();

    const { data: booking, error } = await supabaseService
      .from('bookings')
      .select(`
        *,
        equipment:equipments(
          title,
          owner:profiles!equipments_owner_id_fkey(first_name, last_name)
        ),
        renter:profiles!bookings_renter_id_fkey(first_name, email)
      `)
      .eq('id', booking_id)
      .single();

    if (error || !booking) throw new Error("Réservation non trouvée");

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    };

    const ownerName = `${booking.equipment.owner.first_name} ${booking.equipment.owner.last_name}`;

    const emailHTML = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;background-color:#f5f5f5;">
<div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;">

<div style="background:linear-gradient(135deg,#3b82f6,#2563eb);color:#ffffff;padding:40px 30px;text-align:center;">
<h1 style="margin:0;font-size:28px;">📅 Proposition de nouvelles dates</h1>
</div>

<div style="padding:30px;">
<p>Bonjour <strong>${booking.renter.first_name}</strong>,</p>
<p><strong>${ownerName}</strong> vous propose d'autres dates pour la réservation de <strong>${booking.equipment.title}</strong> :</p>

<div style="background-color:#dbeafe;padding:25px;margin:25px 0;border-radius:10px;border-left:5px solid #3b82f6;">
<h3 style="margin:0 0 15px 0;color:#1e40af;">Dates proposées</h3>
<table style="width:100%;">
<tr>
<td style="padding:8px 0;color:#1e3a8a;">📅 Du :</td>
<td style="padding:8px 0;text-align:right;font-weight:700;color:#1e3a8a;">${formatDate(proposed_start_date)}</td>
</tr>
<tr>
<td style="padding:8px 0;color:#1e3a8a;">📅 Au :</td>
<td style="padding:8px 0;text-align:right;font-weight:700;color:#1e3a8a;">${formatDate(proposed_end_date)}</td>
</tr>
</table>
</div>

<div style="background-color:#fef3c7;padding:20px;margin:25px 0;border-radius:8px;border-left:5px solid #f59e0b;">
<p style="margin:0;color:#92400e;"><strong>💡 Action requise</strong> : Contactez le propriétaire pour discuter de ces nouvelles dates ou faire une nouvelle réservation.</p>
</div>

<div style="text-align:center;margin:30px 0;">
<a href="https://votre-domaine.com/equipment/${booking.equipment_id}" style="display:inline-block;background-color:#10b981;color:#ffffff;padding:15px 30px;text-decoration:none;border-radius:8px;font-weight:600;">Réserver avec les nouvelles dates</a>
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
      subject: `Proposition de nouvelles dates - ${booking.equipment.title}`,
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