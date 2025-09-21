import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jsPDF } from 'https://esm.sh/jspdf@2.5.1'
import { format } from 'https://esm.sh/date-fns@2.30.0'
import { fr } from 'https://esm.sh/date-fns@2.30.0/locale'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("🔍 Début génération contrat");
    
    // Get the request body
    const { booking_id } = await req.json()
    if (!booking_id) {
      throw new Error('Booking ID is required')
    }

    console.log("📋 Booking ID:", booking_id);

    // Initialize Supabase client with the service key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // ✅ ÉTAPE 1: Récupérer la réservation
    console.log("🔍 Récupération des données de réservation...");
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single()

    if (bookingError) {
      console.error("❌ Erreur récupération réservation:", bookingError);
      throw bookingError;
    }
    if (!booking) {
      console.error("❌ Réservation non trouvée");
      throw new Error('Booking not found');
    }

    console.log("✅ Réservation trouvée:", booking.id);

    // ✅ ÉTAPE 2: Récupérer l'équipement
    const { data: equipment, error: equipmentError } = await supabaseAdmin
      .from('equipments')
      .select('*')
      .eq('id', booking.equipment_id)
      .single()

    if (equipmentError) {
      console.error("❌ Erreur récupération équipement:", equipmentError);
      throw equipmentError;
    }

    console.log("🏠 Équipement:", equipment?.title);

    // ✅ ÉTAPE 3: Récupérer le locataire
    const { data: renter, error: renterError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', booking.renter_id)
      .single()

    if (renterError) {
      console.error("❌ Erreur récupération locataire:", renterError);
      throw renterError;
    }

    console.log("👤 Locataire:", renter?.first_name, renter?.last_name);

    // ✅ ÉTAPE 4: Récupérer le propriétaire
    const { data: owner, error: ownerError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', equipment.owner_id)
      .single()

    if (ownerError) {
      console.error("❌ Erreur récupération propriétaire:", ownerError);
      throw ownerError;
    }

    console.log("✅ Propriétaire trouvé:", owner?.first_name, owner?.last_name);

    // ✅ ÉTAPE 5: Récupérer les emails depuis auth.users
    console.log("📧 Récupération des emails...");
    
    // Email du locataire
    const { data: renterUser, error: renterUserError } = await supabaseAdmin.auth.admin.getUserById(booking.renter_id)
    const renterEmail = renterUser?.user?.email
    
    if (renterUserError || !renterEmail) {
      console.error("❌ Erreur récupération email locataire:", renterUserError);
      throw new Error('Renter email not found');
    }

    // Email du propriétaire  
    const { data: ownerUser, error: ownerUserError } = await supabaseAdmin.auth.admin.getUserById(equipment.owner_id)
    const ownerEmail = ownerUser?.user?.email
    
    if (ownerUserError || !ownerEmail) {
      console.error("❌ Erreur récupération email propriétaire:", ownerUserError);
      throw new Error('Owner email not found');
    }

    console.log("✅ Emails récupérés:", { renterEmail, ownerEmail });

    // ✅ ÉTAPE 6: Génération du PDF
    console.log("📄 Génération du PDF...");
    const doc = new jsPDF()
    
    // Set up fonts and colors
    doc.setFont('helvetica')
    
    // Contract title
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('CONTRAT DE LOCATION DE MATÉRIEL', 105, 20, { align: 'center' })
    
    // Contract reference
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Référence: ${booking.id}`, 105, 30, { align: 'center' })
    doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`, 105, 35, { align: 'center' })
    
    // Parties information
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('PARTIES AU CONTRAT', 20, 50)
    
    // Owner information
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('PROPRIÉTAIRE (Bailleur)', 20, 60)
    doc.setFont('helvetica', 'normal')
    doc.text(`Nom et Prénom: ${owner?.first_name || ''} ${owner?.last_name || ''}`, 30, 70)
    doc.text(`Email: ${ownerEmail}`, 30, 75)
    doc.text(`Téléphone: ${owner?.phone_number || 'Non spécifié'}`, 30, 80)
    doc.text(`Adresse: ${owner?.address || 'Non spécifiée'}`, 30, 85)
    doc.text(`Ville: ${owner?.city || ''}, ${owner?.country || ''}`, 30, 90)
    if (owner?.id_number) {
      doc.text(`Pièce d'identité: ${owner.id_number}`, 30, 95)
    }
    
    // Renter information
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('LOCATAIRE (Preneur)', 20, 110)
    doc.setFont('helvetica', 'normal')
    doc.text(`Nom et Prénom: ${renter?.first_name || ''} ${renter?.last_name || ''}`, 30, 120)
    doc.text(`Email: ${renterEmail}`, 30, 125)
    doc.text(`Téléphone: ${renter?.phone_number || 'Non spécifié'}`, 30, 130)
    doc.text(`Adresse: ${renter?.address || 'Non spécifiée'}`, 30, 135)
    doc.text(`Ville: ${renter?.city || ''}, ${renter?.country || ''}`, 30, 140)
    if (renter?.id_number) {
      doc.text(`Pièce d'identité: ${renter.id_number}`, 30, 145)
    }
    
    // Equipment information
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('OBJET DE LA LOCATION', 20, 160)
    doc.setFont('helvetica', 'normal')
    doc.text(`Désignation: ${equipment?.title || ''}`, 30, 170)
    doc.text(`Description: ${equipment?.description || ''}`, 30, 175, { maxWidth: 160 })
    if (equipment?.brand) doc.text(`Marque: ${equipment.brand}`, 30, 185)
    if (equipment?.year) doc.text(`Année: ${equipment.year}`, 30, 190)
    doc.text(`État: ${equipment?.condition || 'Bon état'}`, 30, 195)
    
    // Rental terms
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('CONDITIONS DE LOCATION', 20, 210)
    doc.setFont('helvetica', 'normal')
    doc.text(`Période: du ${format(new Date(booking.start_date), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(booking.end_date), 'dd/MM/yyyy', { locale: fr })}`, 30, 220)
    doc.text(`Prix de location: ${booking.total_price || 0} FCFA`, 30, 225)
    doc.text(`Caution (remboursable): ${booking.deposit_amount || 0} FCFA`, 30, 230)
    doc.text(`Montant total: ${(booking.total_price || 0) + (booking.deposit_amount || 0)} FCFA`, 30, 235)
    
    // Terms and conditions
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('CLAUSES ET CONDITIONS', 20, 250)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    
    const terms = [
      '1. Le locataire s\'engage à utiliser le matériel conformément à sa destination.',
      '2. Le locataire est entièrement responsable du matériel pendant la location.',
      '3. Tout dommage, perte ou vol sera à la charge du locataire.',
      '4. La caution sera restituée après vérification de l\'état du matériel.',
      '5. Tout retard entraînera des pénalités supplémentaires.'
    ]
    
    let yPosition = 260
    terms.forEach(term => {
      doc.text(term, 30, yPosition, { maxWidth: 150 })
      yPosition += 7
    })

    // Signatures section
    yPosition += 10
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('SIGNATURES', 20, yPosition)
    
    yPosition += 15
    doc.setFont('helvetica', 'normal')
    doc.text('Le Propriétaire:', 30, yPosition)
    doc.text('Le Locataire:', 120, yPosition)

    // Generate PDF as base64
    const pdfOutput = doc.output('datauristring')
    
    console.log("✅ PDF généré avec succès");

    // ✅ ÉTAPE 7: Upload du PDF
    const fileName = `contract-${booking_id}-${Date.now()}.pdf`
    const contractPath = `contracts/${fileName}`
    const base64Data = pdfOutput.split(',')[1]
    
    console.log("📤 Upload du PDF...");
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('contracts')
      .upload(contractPath, Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)), {
        contentType: 'application/pdf'
      })

    if (uploadError) {
      console.error("❌ Erreur upload PDF:", uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('contracts')
      .getPublicUrl(contractPath)

    const contractUrl = publicUrlData.publicUrl

    console.log("✅ Contrat uploadé:", contractUrl);

    // ✅ ÉTAPE 8: Mise à jour de la réservation
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ contract_url: contractUrl })
      .eq('id', booking_id)

    if (updateError) {
      console.error("❌ Erreur mise à jour booking:", updateError);
    }

    // ✅ ÉTAPE 9: Envoi automatique de l'email
    console.log("📧 Envoi automatique du contrat par email...");
    
    try {
      const { data: emailData, error: emailError } = await supabaseAdmin.functions.invoke('send-contract-email', {
        body: {
          booking_id: booking_id,
          contract_url: contractUrl,
          renter_email: renterEmail,
          owner_email: ownerEmail,
          equipment_title: equipment?.title || 'Équipement'
        }
      });

      if (emailError) {
        console.error("❌ Erreur envoi email:", emailError);
        // Ne pas faire échouer toute la fonction pour un problème d'email
      } else {
        console.log("✅ Emails envoyés avec succès:", emailData);
      }
    } catch (emailErr) {
      console.error("❌ Erreur lors de l'envoi email:", emailErr);
      // Continue quand même, l'email n'est pas critique
    }

    console.log("🎉 Génération de contrat terminée avec succès!");

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        pdf: contractUrl,
        message: 'Contract generated and emailed successfully',
        details: {
          contract_url: contractUrl,
          renter_email: renterEmail,
          owner_email: ownerEmail,
          equipment_title: equipment?.title
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error("❌ Erreur génération contrat:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})