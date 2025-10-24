// supabase/functions/validate-booking-dates/index.ts
// VERSION CORRIGÉE - Sans les réservations "pending"

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
    const { equipment_id, start_date, end_date } = await req.json()

    console.log('🔍 Validation demandée pour:', {
      equipment_id,
      start_date,
      end_date
    })

    // Vérifier que toutes les données nécessaires sont présentes
    if (!equipment_id || !start_date || !end_date) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Données manquantes: equipment_id, start_date et end_date sont requis'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Vérifier que la date de fin est après la date de début
    if (new Date(end_date) <= new Date(start_date)) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'La date de fin doit être après la date de début'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // ✅ MODIFIÉ : Vérifier les chevauchements avec les réservations confirmées et en cours uniquement
    // Les réservations "pending" (en attente) ne bloquent pas les dates
    const { data: conflictingBookings, error } = await supabaseClient
      .from('bookings')
      .select('id, start_date, end_date, status')
      .eq('equipment_id', equipment_id)
      .in('status', ['confirmed', 'in_progress']) // ✅ SANS 'pending'
      .or(`and(start_date.lte.${end_date},end_date.gte.${start_date})`)

    if (error) {
      console.error('❌ Erreur lors de la vérification des chevauchements:', error)
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

    // S'il y a des réservations en conflit
    if (conflictingBookings && conflictingBookings.length > 0) {
      console.log('❌ Chevauchement détecté:', conflictingBookings)
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Ces dates se chevauchent avec une réservation confirmée',
          conflicting_bookings: conflictingBookings
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Pas de conflit - dates disponibles
    console.log('✅ Dates disponibles')
    return new Response(
      JSON.stringify({
        valid: true,
        message: 'Ces dates sont disponibles'
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