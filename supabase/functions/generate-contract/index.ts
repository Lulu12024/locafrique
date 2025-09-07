
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

    // Fetch booking details with associated equipment and renter
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
    console.log("🔍 Récupération du propriétaire...");
    const { data: ownerProfile, error: ownerError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', equipment.owner_id)
      .single()

    if (ownerError) {
      console.error("❌ Erreur récupération propriétaire:", ownerError);
      throw ownerError;
    }

    console.log("✅ Propriétaire trouvé:", ownerProfile?.first_name, ownerProfile?.last_name);

    // ✅ ÉTAPE 5: Assembler les données complètes
    const bookingComplete = {
      ...booking,
      equipment: equipment,
      renter: renter
    };
    // Generate PDF contract
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
    doc.text(`Nom et Prénom: ${ownerProfile.first_name || ''} ${ownerProfile.last_name || ''}`, 30, 70)
    doc.text(`Téléphone: ${ownerProfile.phone_number || 'Non spécifié'}`, 30, 75)
    doc.text(`Adresse: ${ownerProfile.address || 'Non spécifiée'}`, 30, 80)
    doc.text(`Ville: ${ownerProfile.city || ''}, ${ownerProfile.country || ''}`, 30, 85)
    if (ownerProfile.id_number) {
      doc.text(`Pièce d'identité: ${ownerProfile.id_number}`, 30, 90)
    }
    
    // Renter information
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('LOCATAIRE (Preneur)', 20, 105)
    doc.setFont('helvetica', 'normal')
    doc.text(`Nom et Prénom: ${booking.renter.first_name || ''} ${booking.renter.last_name || ''}`, 30, 115)
    doc.text(`Téléphone: ${booking.renter.phone_number || 'Non spécifié'}`, 30, 120)
    doc.text(`Adresse: ${booking.renter.address || 'Non spécifiée'}`, 30, 125)
    doc.text(`Ville: ${booking.renter.city || ''}, ${booking.renter.country || ''}`, 30, 130)
    if (booking.renter.id_number) {
      doc.text(`Pièce d'identité: ${booking.renter.id_number}`, 30, 135)
    }
    
    // Equipment information
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('OBJET DE LA LOCATION', 20, 150)
    doc.setFont('helvetica', 'normal')
    doc.text(`Désignation: ${booking.equipment.title}`, 30, 160)
    doc.text(`Description: ${booking.equipment.description}`, 30, 165, { maxWidth: 160 })
    if (booking.equipment.brand) doc.text(`Marque: ${booking.equipment.brand}`, 30, 175)
    if (booking.equipment.year) doc.text(`Année: ${booking.equipment.year}`, 30, 180)
    doc.text(`État: ${booking.equipment.condition || 'Bon état'}`, 30, 185)
    
    // Rental terms
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('CONDITIONS DE LOCATION', 20, 200)
    doc.setFont('helvetica', 'normal')
    doc.text(`Période de location: du ${format(new Date(booking.start_date), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(booking.end_date), 'dd/MM/yyyy', { locale: fr })}`, 30, 210)
    doc.text(`Prix de location: ${booking.total_price} FCFA`, 30, 215)
    doc.text(`Caution (remboursable): ${booking.deposit_amount} FCFA`, 30, 220)
    doc.text(`Montant total à payer: ${booking.total_price + booking.deposit_amount} FCFA`, 30, 225)
    
    // Terms and conditions
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('CLAUSES ET CONDITIONS', 20, 240)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    
    const terms = [
      '1. Le locataire s\'engage à utiliser le matériel conformément à sa destination et dans les règles de l\'art.',
      '2. Le locataire est entièrement responsable du matériel pendant toute la durée de la location.',
      '3. Tout dommage, perte ou vol du matériel sera à la charge du locataire.',
      '4. La caution sera restituée après vérification du bon état du matériel lors de sa restitution.',
      '5. Tout retard dans la restitution entraînera des pénalités supplémentaires.',
      '6. Le locataire doit être couvert par une assurance responsabilité civile.',
      '7. Les parties conviennent de régler tout litige à l\'amiable avant tout recours judiciaire.'
    ]
    
    let yPosition = 250
    terms.forEach(term => {
      doc.text(term, 30, yPosition, { maxWidth: 150 })
      yPosition += 10
    })
    
    // Signatures
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('SIGNATURES', 20, yPosition + 20)
    
    // Signature boxes
    doc.setFont('helvetica', 'normal')
    doc.text('Le Propriétaire', 40, yPosition + 35)
    doc.text('Le Locataire', 140, yPosition + 35)
    
    // Date and location
    doc.text(`Fait à ${booking.equipment.city || ''}, le ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`, 20, yPosition + 50)
    
    // Generate Base64 PDF
    console.log("✅ PDF généré avec succès");
    const pdfBase64 = doc.output('datauristring')
    
    // Return the PDF Base64 string
    return new Response(
      JSON.stringify({
        pdf: pdfBase64
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('❌ Erreur génération contrat:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
