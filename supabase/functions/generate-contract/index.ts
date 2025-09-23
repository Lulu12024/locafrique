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

    // ✅ ÉTAPE 1: Récupérer les données de réservation avec profiles (sans email)
    console.log("🔍 Récupération des données de réservation...");
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        equipment:equipments!bookings_equipment_id_fkey(
          *,
          owner:profiles!equipments_owner_id_fkey(
            id,
            first_name,
            last_name,
            phone_number,
            address,
            city,
            country,
            id_number
          )
        ),
        renter:profiles!bookings_renter_id_fkey(
          id,
          first_name,
          last_name,
          phone_number,
          address,
          city,
          country,
          id_number
        )
      `)
      .eq('id', booking_id)
      .single()

    if (bookingError) {
      console.error("❌ Erreur récupération données:", bookingError);
      throw bookingError;
    }
    if (!booking) {
      console.error("❌ Réservation non trouvée");
      throw new Error('Booking not found');
    }

    console.log("✅ Données récupérées:", {
      bookingId: booking.id,
      equipmentTitle: booking.equipment?.title,
      renterName: `${booking.renter?.first_name} ${booking.renter?.last_name}`,
      ownerName: `${booking.equipment?.owner?.first_name} ${booking.equipment?.owner?.last_name}`
    });

    // ✅ ÉTAPE 2: Récupérer les emails depuis auth.users
    console.log("📧 Récupération des emails depuis auth.users...");
    
    // Email du locataire
    const { data: renterUser, error: renterUserError } = await supabaseAdmin.auth.admin.getUserById(booking.renter_id)
    const renterEmail = renterUser?.user?.email
    
    if (renterUserError || !renterEmail) {
      console.error("❌ Erreur récupération email locataire:", renterUserError);
      throw new Error(`Renter email not found: ${renterUserError?.message || 'No email returned'}`);
    }

    // Email du propriétaire  
    const { data: ownerUser, error: ownerUserError } = await supabaseAdmin.auth.admin.getUserById(booking.equipment.owner_id)
    const ownerEmail = ownerUser?.user?.email
    
    if (ownerUserError || !ownerEmail) {
      console.error("❌ Erreur récupération email propriétaire:", ownerUserError);
      throw new Error(`Owner email not found: ${ownerUserError?.message || 'No email returned'}`);
    }

    console.log("✅ Emails récupérés depuis auth.users:", { renterEmail, ownerEmail });

    //✅ ÉTAPE 3: Génération du PDF moderne (CORRIGÉ)
    // ✅ ÉTAPE 3: Génération du PDF sobre et professionnel
    console.log("📄 Génération du PDF professionnel...");
    const doc = new jsPDF()

    // Couleurs sobres et professionnelles
    const colors = {
      primary: [34, 197, 94],       // Vert plus naturel #22c55e
      accent: [71, 85, 105],        // Gris-bleu #475569
      text: [15, 23, 42],           // Gris très foncé #0f172a
      textLight: [100, 116, 139],   // Gris moyen #64748b
      border: [226, 232, 240],      // Gris clair #e2e8f0
      background: [248, 250, 252]   // Gris très clair #f8fafc
    }

    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height

    // En-tête simple et épuré
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2])
    doc.setLineWidth(0.8)
    doc.line(20, 25, pageWidth - 20, 25)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    doc.text('3W-LOC', 20, 20)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
    doc.text('Plateforme de location de matériel', 20, 35)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    doc.text('CONTRAT DE LOCATION', pageWidth - 20, 20, { align: 'right' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
    doc.text(`Réf: ${booking.id.slice(-8).toUpperCase()}`, pageWidth - 20, 28, { align: 'right' })
    doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`, pageWidth - 20, 33, { align: 'right' })

    let yPos = 50

    // Section Parties - Design épuré
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    doc.text('PARTIES AU CONTRAT', 20, yPos)

    // Ligne de séparation subtile
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
    doc.setLineWidth(0.5)
    doc.line(20, yPos + 2, 120, yPos + 2)

    yPos += 12

    // Propriétaire - Style tableau simple
    const owner = booking.equipment?.owner

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    doc.text('Propriétaire', 20, yPos)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])

    // Bordure simple autour des infos propriétaire
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
    doc.rect(20, yPos + 2, pageWidth - 40, 18)

    doc.text('Nom:', 25, yPos + 8)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    doc.text(`${owner?.first_name || ''} ${owner?.last_name || ''}`, 45, yPos + 8)

    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
    doc.text('Email:', 25, yPos + 13)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    doc.text(ownerEmail || 'Non spécifié', 45, yPos + 13, { maxWidth: 70 })

    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
    doc.text('Téléphone:', 120, yPos + 8)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    doc.text(owner?.phone_number || 'Non spécifié', 145, yPos + 8)

    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
    doc.text('Lieu:', 120, yPos + 13)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    doc.text(`${owner?.city || ''}, ${owner?.country || ''}`, 135, yPos + 13)

    yPos += 28

    // Locataire
    const renter = booking.renter

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    doc.text('Locataire', 20, yPos)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)

    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
    doc.rect(20, yPos + 2, pageWidth - 40, 18)

    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
    doc.text('Nom:', 25, yPos + 8)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    doc.text(`${renter?.first_name || ''} ${renter?.last_name || ''}`, 45, yPos + 8)

    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
    doc.text('Email:', 25, yPos + 13)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    doc.text(renterEmail || 'Non spécifié', 45, yPos + 13, { maxWidth: 70 })

    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
    doc.text('Téléphone:', 120, yPos + 8)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    doc.text(renter?.phone_number || 'Non spécifié', 145, yPos + 8)

    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
    doc.text('Lieu:', 120, yPos + 13)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    doc.text(`${renter?.city || ''}, ${renter?.country || ''}`, 135, yPos + 13)

    yPos += 35

    // Section Matériel
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    doc.text('MATÉRIEL LOUÉ', 20, yPos)

    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
    doc.line(20, yPos + 2, 95, yPos + 2)

    yPos += 12

    const equipment = booking.equipment

    // Encadré simple pour le matériel
    doc.setFillColor(colors.background[0], colors.background[1], colors.background[2])
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2])
    doc.setLineWidth(0.8)
    doc.rect(20, yPos, pageWidth - 40, 20, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    doc.text(equipment?.title || '', 25, yPos + 7)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])

    doc.text(`Marque: ${equipment?.brand || 'Non spécifié'}`, 25, yPos + 12)
    doc.text(`Année: ${equipment?.year || 'Non spécifié'}`, 80, yPos + 12)
    doc.text(`État: ${equipment?.condition || 'Bon état'}`, 125, yPos + 12)

    doc.setFontSize(8)
    doc.text(`Description: ${equipment?.description || ''}`, 25, yPos + 16, { maxWidth: pageWidth - 50 })

    yPos += 30

    // Section Conditions
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    doc.text('CONDITIONS DE LOCATION', 20, yPos)

    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
    doc.line(20, yPos + 2, 140, yPos + 2)

    yPos += 12

    // Période
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
    doc.text('Période:', 20, yPos)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    doc.text(`du ${format(new Date(booking.start_date), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(booking.end_date), 'dd/MM/yyyy', { locale: fr })}`, 40, yPos)

    yPos += 10

    // Tableau des prix - Style classique
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
    doc.setLineWidth(0.5)

    // En-tête tableau
    doc.setFillColor(colors.background[0], colors.background[1], colors.background[2])
    doc.rect(20, yPos, pageWidth - 40, 8, 'F')
    doc.rect(20, yPos, pageWidth - 40, 8)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    doc.text('Description', 25, yPos + 5)
    doc.text('Montant', pageWidth - 50, yPos + 5)

    yPos += 8

    // Lignes du tableau
    const priceItems = [
      { label: 'Prix de location', amount: booking.total_price || 0 },
      { label: 'Caution (remboursable)', amount: booking.deposit_amount || 0 }
    ]

    priceItems.forEach((item) => {
      doc.rect(20, yPos, pageWidth - 40, 6)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
      doc.text(item.label, 25, yPos + 4)
      doc.text(`${item.amount.toLocaleString()} FCFA`, pageWidth - 25, yPos + 4, { align: 'right' })
      
      yPos += 6
    })

    // Total
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2])
    doc.rect(20, yPos, pageWidth - 40, 8, 'F')
    doc.rect(20, yPos, pageWidth - 40, 8)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text('TOTAL', 25, yPos + 5)
    doc.text(`${((booking.total_price || 0) + (booking.deposit_amount || 0)).toLocaleString()} FCFA`, pageWidth - 25, yPos + 5, { align: 'right' })

    yPos += 20

    // Clauses - Style simple et lisible
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    doc.text('CLAUSES ET CONDITIONS', 20, yPos)

    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
    doc.line(20, yPos + 2, 140, yPos + 2)

    yPos += 12

    const clauses = [
      'Le locataire s\'engage à utiliser le matériel conformément à sa destination.',
      'Le locataire est responsable du matériel pendant toute la durée de location.',
      'Tout dommage sera à la charge du locataire selon évaluation.',
      'La caution sera restituée sous 7 jours après vérification.',
      'Tout retard entraîne des pénalités de 10% par jour.',
      'Contrat soumis au droit béninois, tribunaux de Cotonou compétents.'
    ]

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])

    clauses.forEach((clause, index) => {
      doc.text(`${index + 1}.`, 20, yPos)
      doc.text(clause, 26, yPos, { maxWidth: pageWidth - 50 })
      yPos += 5
    })

    yPos += 10

    // Signatures - Style classique
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
    doc.text('SIGNATURES', 20, yPos)

    yPos += 8

    // Tableau signatures
    const signWidth = (pageWidth - 50) / 2

    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
    doc.rect(20, yPos, signWidth, 20)
    doc.rect(30 + signWidth, yPos, signWidth, 20)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
    doc.text('Le Propriétaire', 25, yPos + 5)
    doc.text('Date et signature:', 25, yPos + 15)

    doc.text('Le Locataire', 35 + signWidth, yPos + 5)
    doc.text('Date et signature:', 35 + signWidth, yPos + 15)

    // Footer discret
    yPos = pageHeight - 20
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
    doc.setLineWidth(0.3)
    doc.line(20, yPos, pageWidth - 20, yPos)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
    doc.text('3W-LOC - Plateforme de location de matériel', 20, yPos + 5)
    doc.text(`Document généré le ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`, pageWidth - 20, yPos + 5, { align: 'right' })

    // Generate PDF as base64
    const pdfOutput = doc.output('datauristring')

    console.log("✅ PDF professionnel généré avec succès");

    // ✅ ÉTAPE 4: Upload du PDF
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

    // ✅ ÉTAPE 5: Mise à jour de la réservation
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ contract_url: contractUrl })
      .eq('id', booking_id)

    if (updateError) {
      console.error("❌ Erreur mise à jour booking:", updateError);
    }

    console.log("🎉 Génération de contrat terminée avec succès!");

    // Return success response avec les emails pour permettre l'envoi depuis le client
    return new Response(
      JSON.stringify({
        success: true,
        pdf: contractUrl,
        message: 'Contract generated successfully',
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