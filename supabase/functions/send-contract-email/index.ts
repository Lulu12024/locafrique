// supabase/functions/send-contract-email/index.ts

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CONTRACT-EMAIL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Contract email function started");

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // ✅ PARSING ROBUSTE DU JSON
    let requestBody;
    try {
      requestBody = await req.json();
      logStep("Request body parsed successfully", requestBody);
    } catch (parseError) {
      logStep("JSON parsing failed", { error: parseError.message });
      throw new Error(`Impossible de parser le JSON: ${parseError.message}`);
    }

    const { 
      booking_id, 
      contract_url, 
      renter_email, 
      owner_email, 
      equipment_title 
    } = requestBody;

    // ✅ VALIDATION DÉTAILLÉE DES PARAMÈTRES
    logStep("Validating parameters", {
      booking_id: !!booking_id,
      contract_url: !!contract_url,
      renter_email: !!renter_email,
      owner_email: !!owner_email,
      equipment_title: !!equipment_title,
      raw_data: { booking_id, contract_url, renter_email, owner_email, equipment_title }
    });

    const missingParams = [];
    if (!booking_id || booking_id === 'undefined' || booking_id === 'null') {
      missingParams.push('booking_id');
    }
    if (!contract_url || contract_url === 'undefined' || contract_url === 'null') {
      missingParams.push('contract_url');
    }
    if (!renter_email || renter_email === 'undefined' || renter_email === 'null') {
      missingParams.push('renter_email');
    }
    if (!owner_email || owner_email === 'undefined' || owner_email === 'null') {
      missingParams.push('owner_email');
    }

    if (missingParams.length > 0) {
      const errorMsg = `Paramètres manquants ou invalides: ${missingParams.join(', ')}`;
      logStep("Validation failed", { 
        missingParams, 
        receivedData: requestBody 
      });
      throw new Error(errorMsg);
    }

    logStep("All parameters validated successfully");

    // ✅ RÉCUPÉRATION DES DÉTAILS DE LA RÉSERVATION
    logStep("Fetching booking details");
    const { data: booking, error: bookingError } = await supabaseService
      .from('bookings')
      .select(`
        *,
        equipment:equipments(
          id,
          title,
          description,
          daily_price,
          deposit_amount,
          owner:profiles!equipments_owner_id_fkey(
            id,
            first_name,
            last_name
          )
        ),
        renter:profiles!bookings_renter_id_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      logStep("Booking fetch failed", { error: bookingError });
      throw new Error(`Réservation non trouvée: ${bookingError?.message || 'Booking not found'}`);
    }

    logStep("Booking details retrieved", { 
      equipmentTitle: booking.equipment?.title,
      renterName: `${booking.renter?.first_name} ${booking.renter?.last_name}`,
      ownerName: `${booking.equipment?.owner?.first_name} ${booking.equipment?.owner?.last_name}`
    });

    // ⚠️ ATTENTION: Clé API en dur - À CHANGER avant la production !
    const emailApiKey = "re_RJbkvx2N_5bKd4GSVWmrLaTyQTa2aubZo"; // Remplacez par votre vraie clé
    const emailService = "resend";
    
    // if (!emailApiKey || emailApiKey === "VOTRE_CLE_RESEND_ICI") {
    //   logStep("Email API key missing or not configured");
    //   throw new Error("Veuillez remplacer VOTRE_CLE_RESEND_ICI par votre vraie clé Resend");
    // }

    logStep("Email service configured", { service: emailService });

    // ✅ GÉNÉRATION DU CONTENU EMAIL
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const generateEmailContent = (isForRenter: boolean) => {
      const recipient = isForRenter ? booking.renter : booking.equipment?.owner;
      const role = isForRenter ? 'locataire' : 'propriétaire';
      
      return {
        subject: `🏠 Contrat de location - ${equipment_title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Contrat de location</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
              .highlight { color: #10b981; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🏠 Contrat de location généré</h1>
              <p>Félicitations ! Votre contrat est prêt</p>
            </div>
            <div class="content">
              <div class="card">
                <h2>Bonjour ${recipient?.first_name} ${recipient?.last_name},</h2>
                <p>Votre contrat de location en tant que <strong>${role}</strong> a été généré automatiquement.</p>
                
                <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0;">
                  <h3>📋 Détails de la réservation</h3>
                  <p><strong>Équipement :</strong> ${equipment_title}</p>
                  <p><strong>Période :</strong> Du ${formatDate(booking.start_date)} au ${formatDate(booking.end_date)}</p>
                  <p><strong>Prix total :</strong> ${booking.total_price?.toLocaleString()} FCFA</p>
                  <p><strong>Caution :</strong> ${booking.deposit_amount?.toLocaleString()} FCFA</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${contract_url}" class="button">📄 Télécharger le contrat</a>
                </div>
                
                <p><strong>Important :</strong> Veuillez lire attentivement le contrat et le conserver précieusement.</p>
              </div>
              
              <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
                <p>© 2025 3W-LOC - Plateforme de location de matériel</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Contrat de location - ${equipment_title}
          
          Bonjour ${recipient?.first_name} ${recipient?.last_name},
          
          Votre contrat de location a été généré automatiquement.
          
          Détails :
          - Équipement : ${equipment_title}
          - Période : Du ${formatDate(booking.start_date)} au ${formatDate(booking.end_date)}
          - Prix total : ${booking.total_price?.toLocaleString()} FCFA
          - Caution : ${booking.deposit_amount?.toLocaleString()} FCFA
          
          Téléchargez votre contrat : ${contract_url}
          
          Cordialement,
          L'équipe 3W-LOC
        `
      };
    };

    // ✅ PRÉPARATION DES EMAILS
    const renterEmail = generateEmailContent(true);
    const ownerEmail = generateEmailContent(false);

    let emailsSent = 0;
    const errors: string[] = [];

    // ✅ FONCTION D'ENVOI EMAIL
    const sendEmail = async (to: string, emailContent: any) => {
      logStep("Sending email", { to, service: emailService });
      
      if (emailService === "resend") {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${emailApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "onboarding@resend.dev", // Utilisez l'email par défaut de Resend
            to: [to],
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erreur Resend: ${errorText}`);
        }

        return await response.json();
      } else {
        throw new Error(`Service email ${emailService} non supporté`);
      }
    };

    // ✅ ENVOI AU LOCATAIRE (temporairement vers votre email pour test)
    try {
      logStep("Sending email to renter", { email: "deogratiasluc84@gmail.com" });
      await sendEmail("deogratiasluc84@gmail.com", renterEmail); // Test avec votre email
      emailsSent++;
      logStep("Email sent to renter successfully");
    } catch (error) {
      logStep("Error sending email to renter", { error: error.message });
      errors.push(`Locataire: ${error.message}`);
    }

    // ✅ ENVOI AU PROPRIÉTAIRE (temporairement vers votre email pour test)
    try {
      logStep("Sending email to owner", { email: "deogratiasluc84@gmail.com" });
      await sendEmail("deogratiasluc84@gmail.com", ownerEmail); // Test avec votre email
      emailsSent++;
      logStep("Email sent to owner successfully");
    } catch (error) {
      logStep("Error sending email to owner", { error: error.message });
      errors.push(`Propriétaire: ${error.message}`);
    }

    // ✅ ENREGISTREMENT DES LOGS
    await supabaseService.from('email_logs').insert({
      booking_id: booking_id,
      email_type: 'contract_delivery',
      recipients: [renter_email, owner_email],
      status: emailsSent === 2 ? 'success' : (emailsSent === 1 ? 'partial' : 'failed'),
      errors: errors.length > 0 ? errors : null,
      sent_count: emailsSent
    });

    const response = {
      success: emailsSent > 0,
      emails_sent: emailsSent,
      total_recipients: 2,
      errors: errors.length > 0 ? errors : null
    };

    logStep("Email sending completed", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: emailsSent > 0 ? 200 : 500,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in contract email sending", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});