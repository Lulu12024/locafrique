// supabase/functions/validate-booking-approval/index.ts
// Valide qu'une réservation peut être acceptée sans conflit

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Gérer les requêtes OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Récupérer les données de la requête
    const { booking_id } = await req.json()

    console.log('🔍 Validation acceptation réservation:', booking_id)

    if (!booking_id) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'booking_id est requis'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // 1. Récupérer les détails de la réservation à accepter
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('id, equipment_id, start_date, end_date, status')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      console.error('❌ Réservation non trouvée:', bookingError)
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Réservation non trouvée'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    // 2. Vérifier que le statut est bien "pending"
    if (booking.status !== 'pending') {
      return new Response(
        JSON.stringify({
          valid: false,
          error: `Cette réservation ne peut pas être acceptée (statut actuel: ${booking.status})`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('📅 Dates de la réservation:', {
      start: booking.start_date,
      end: booking.end_date
    })

    // 3. Vérifier les chevauchements avec d'autres réservations confirmées ou en cours
    const { data: conflictingBookings, error: conflictError } = await supabaseClient
      .from('bookings')
      .select('id, start_date, end_date, status, renter:profiles!bookings_renter_id_fkey(first_name, last_name)')
      .eq('equipment_id', booking.equipment_id)
      .in('status', ['confirmed', 'in_progress', 'ongoing']) // ✅ Vérifier contre confirmées et en cours
      .neq('id', booking_id) // Ne pas vérifier contre elle-même
      .or(`and(start_date.lte.${booking.end_date},end_date.gte.${booking.start_date})`)

    if (conflictError) {
      console.error('❌ Erreur vérification conflits:', conflictError)
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Erreur lors de la vérification des disponibilités'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // 4. S'il y a des conflits, refuser l'acceptation
    if (conflictingBookings && conflictingBookings.length > 0) {
      console.log('❌ Conflit détecté:', conflictingBookings)
      
      // Formater les informations des réservations en conflit
      const conflicts = conflictingBookings.map(c => ({
        id: c.id,
        start_date: c.start_date,
        end_date: c.end_date,
        status: c.status,
        renter_name: c.renter ? `${c.renter.first_name} ${c.renter.last_name}` : 'Inconnu'
      }))

      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Conflit de dates détecté',
          message: `Ces dates chevauchent ${conflictingBookings.length} réservation(s) déjà confirmée(s) ou en cours.`,
          conflicting_bookings: conflicts
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // 5. Pas de conflit - l'acceptation est autorisée
    console.log('✅ Aucun conflit - Acceptation autorisée')
    return new Response(
      JSON.stringify({
        valid: true,
        message: 'Cette réservation peut être acceptée sans conflit'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Erreur dans la fonction:', error)
    return new Response(
      JSON.stringify({
        valid: false,
        error: error.message || 'Erreur interne du serveur'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})