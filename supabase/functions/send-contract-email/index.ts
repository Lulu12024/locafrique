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

    const { 
      booking_id, 
      contract_url, 
      renter_email, 
      owner_email, 
      equipment_title 
    } = await req.json();

    if (!booking_id || !contract_url || !renter_email || !owner_email) {
      throw new Error("Données manquantes pour l'envoi d'email");
    }

    logStep("Email data received", { 
      booking_id, 
      renter_email, 
      owner_email, 
      equipment_title 
    });

    // Récupérer les détails complets de la réservation
    const { data: booking, error: bookingError } = await supabaseService
      .from('bookings')
      .select(`
        *,
        equipment:equipments(
          id,
          title,
          description,
          daily_price,
          deposit_amount
        ),
        renter:profiles!bookings_renter_id_fkey(
          id,
          first_name,
          last_name,
          email
        ),
        owner:profiles!bookings_owner_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error("Réservation non trouvée");
    }

    logStep("Booking details retrieved", { 
      equipmentTitle: booking.equipment?.title,
      renterName: `${booking.renter?.first_name} ${booking.renter?.last_name}`,
      ownerName: `${booking.owner?.first_name} ${booking.owner?.last_name}`
    });

    // Configuration email (Resend, SendGrid, ou autre service d'email)
    const emailApiKey = Deno.env.get("RESEND_API_KEY") || Deno.env.get("SENDGRID_API_KEY");
    const emailService = Deno.env.get("EMAIL_SERVICE") || "resend"; // ou "sendgrid"
    
    if (!emailApiKey) {
      throw new Error("Clé API email non configurée");
    }

    // Générer le contenu des emails
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const generateEmailContent = (isForRenter: boolean) => {
      const recipient = isForRenter ? booking.renter : booking.owner;
      const role = isForRenter ? 'locataire' : 'propriétaire';
      
      return {
        subject: `🏠 Contrat de location - ${booking.equipment?.title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Contrat de location</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
              .details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
              .detail-item { padding: 10px; background: #f3f4f6; border-radius: 6px; }
              .highlight { color: #10b981; font-weight: bold; }
              .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏠 Contrat de location généré</h1>
                <p>Félicitations ! Votre contrat de location est prêt</p>
              </div>
              
              <div class="content">
                <h2>Bonjour ${recipient?.first_name} ${recipient?.last_name},</h2>
                
                <p>Nous avons le plaisir de vous informer que le contrat de location pour <strong>"${booking.equipment?.title}"</strong> a été généré automatiquement et est maintenant disponible.</p>
                
                <div class="card">
                  <h3>📋 Détails de la réservation</h3>
                  <div class="details">
                    <div class="detail-item">
                      <strong>Équipement :</strong><br>
                      ${booking.equipment?.title}
                    </div>
                    <div class="detail-item">
                      <strong>Période :</strong><br>
                      Du ${formatDate(booking.start_date)}<br>
                      Au ${formatDate(booking.end_date)}
                    </div>
                    <div class="detail-item">
                      <strong>Prix total :</strong><br>
                      <span class="highlight">${booking.total_price?.toLocaleString()} FCFA</span>
                    </div>
                    <div class="detail-item">
                      <strong>Caution :</strong><br>
                      ${booking.deposit_amount?.toLocaleString()} FCFA
                    </div>
                  </div>
                </div>
                
                <div class="card">
                  <h3>📄 Votre contrat</h3>
                  <p>Le contrat de location a été pré-rempli avec toutes les informations nécessaires et validé automatiquement avec vos pièces d'identité.</p>
                  
                  <div style="text-align: center; margin: 20px 0;">
                    <a href="${contract_url}" class="button">
                      📥 Télécharger le contrat PDF
                    </a>
                  </div>
                  
                  <div class="warning">
                    <strong>⚠️ Important :</strong> Veuillez télécharger et conserver ce contrat. Il contient toutes les conditions de location et les informations légales nécessaires.
                  </div>
                </div>
                
                ${isForRenter ? `
                <div class="card">
                  <h3>🎯 Prochaines étapes</h3>
                  <ul>
                    <li>✅ Téléchargez et lisez attentivement votre contrat</li>
                    <li>📅 Respectez les dates de location convenues</li>
                    <li>📞 Contactez le propriétaire pour organiser la remise de l'équipement</li>
                    <li>💰 Le paiement a été traité selon la méthode choisie</li>
                  </ul>
                </div>
                ` : `
                <div class="card">
                  <h3>🎯 En tant que propriétaire</h3>
                  <ul>
                    <li>✅ La réservation a été confirmée automatiquement</li>
                    <li>📅 Préparez votre équipement pour les dates convenues</li>
                    <li>📞 Le locataire vous contactera pour organiser la remise</li>
                    <li>💰 Le paiement sera traité selon nos conditions</li>
                  </ul>
                </div>
                `}
                
                <div class="card">
                  <h3>📞 Besoin d'aide ?</h3>
                  <p>Si vous avez des questions concernant ce contrat ou votre réservation, n'hésitez pas à nous contacter :</p>
                  <ul>
                    <li>📧 Email : support@votre-plateforme.com</li>
                    <li>📱 Téléphone : +229 XX XX XX XX</li>
                    <li>💬 Chat en ligne sur notre site web</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 14px;">
                    Cet email a été envoyé automatiquement par notre système.<br>
                    © 2025 Votre Plateforme de Location - Tous droits réservés
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Contrat de location - ${booking.equipment?.title}
          
          Bonjour ${recipient?.first_name} ${recipient?.last_name},
          
          Le contrat de location pour "${booking.equipment?.title}" a été généré automatiquement.
          
          Détails de la réservation :
          - Équipement : ${booking.equipment?.title}
          - Période : Du ${formatDate(booking.start_date)} au ${formatDate(booking.end_date)}
          - Prix total : ${booking.total_price?.toLocaleString()} FCFA
          - Caution : ${booking.deposit_amount?.toLocaleString()} FCFA
          
          Téléchargez votre contrat : ${contract_url}
          
          Pour toute question, contactez-nous à support@votre-plateforme.com
          
          Cordialement,
          L'équipe Votre Plateforme de Location
        `
      };
    };

    // Préparer les emails pour les deux parties
    const renterEmail = generateEmailContent(true);
    const ownerEmail = generateEmailContent(false);

    let emailsSent = 0;
    const errors = [];

    // Fonction d'envoi selon le service
    const sendEmail = async (to: string, emailContent: any) => {
      if (emailService === "resend") {
        // RESEND
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${emailApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Contrats <contrats@votre-plateforme.com>",
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

      } else if (emailService === "sendgrid") {
        // SENDGRID
        const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${emailApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { email: "contrats@votre-plateforme.com", name: "Contrats Location" },
            subject: emailContent.subject,
            content: [
              { type: "text/html", value: emailContent.html },
              { type: "text/plain", value: emailContent.text }
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erreur SendGrid: ${errorText}`);
        }

        return { success: true };
      }
    };

    // Envoyer l'email au locataire
    try {
      logStep("Sending email to renter", { email: renter_email });
      await sendEmail(renter_email, renterEmail);
      emailsSent++;
      logStep("Email sent to renter successfully");
    } catch (error) {
      logStep("Error sending email to renter", { error: error.message });
      errors.push(`Locataire: ${error.message}`);
    }

    // Envoyer l'email au propriétaire
    try {
      logStep("Sending email to owner", { email: owner_email });
      await sendEmail(owner_email, ownerEmail);
      emailsSent++;
      logStep("Email sent to owner successfully");
    } catch (error) {
      logStep("Error sending email to owner", { error: error.message });
      errors.push(`Propriétaire: ${error.message}`);
    }

    // Enregistrer l'activité d'envoi d'email
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
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
