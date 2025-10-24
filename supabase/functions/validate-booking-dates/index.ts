// supabase/functions/validate-booking-dates/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { equipment_id, start_date, end_date, booking_id } = await req.json();

    console.log("🔍 Validation des dates de réservation:", {
      equipment_id,
      start_date,
      end_date,
      booking_id
    });

    // Validation des données
    if (!equipment_id || !start_date || !end_date) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Données manquantes" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Vérifier que end_date > start_date
    const startDateTime = new Date(start_date).getTime();
    const endDateTime = new Date(end_date).getTime();

    if (endDateTime <= startDateTime) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "La date de fin doit être après la date de début" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Construire la requête pour chercher les chevauchements
    let query = supabase
      .from('bookings')
      .select('id, start_date, end_date, status')
      .eq('equipment_id', equipment_id)
      .in('status', ['confirmed', 'pending', 'in_progress']);

    // Exclure la réservation actuelle si on modifie une réservation existante
    if (booking_id) {
      query = query.neq('id', booking_id);
    }

    const { data: existingBookings, error } = await query;

    if (error) {
      console.error("❌ Erreur lors de la recherche des réservations:", error);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Erreur lors de la validation" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log(`📋 ${existingBookings?.length || 0} réservation(s) existante(s) trouvée(s)`);

    // Vérifier les chevauchements
    const hasOverlap = existingBookings?.some(booking => {
      const bookingStart = new Date(booking.start_date).getTime();
      const bookingEnd = new Date(booking.end_date).getTime();

      // Chevauchement si :
      // - La nouvelle réservation commence pendant une réservation existante
      // - La nouvelle réservation se termine pendant une réservation existante
      // - La nouvelle réservation englobe complètement une réservation existante
      const overlap = (
        (startDateTime <= bookingEnd && endDateTime >= bookingStart) ||
        (startDateTime >= bookingStart && startDateTime <= bookingEnd) ||
        (endDateTime >= bookingStart && endDateTime <= bookingEnd) ||
        (startDateTime <= bookingStart && endDateTime >= bookingEnd)
      );

      if (overlap) {
        console.log("❌ Chevauchement détecté avec la réservation:", {
          booking_id: booking.id,
          booking_start: booking.start_date,
          booking_end: booking.end_date,
          booking_status: booking.status
        });
      }

      return overlap;
    }) || false;

    if (hasOverlap) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Ces dates se chevauchent avec une réservation existante",
          conflicting_bookings: existingBookings?.filter(booking => {
            const bookingStart = new Date(booking.start_date).getTime();
            const bookingEnd = new Date(booking.end_date).getTime();
            return (startDateTime <= bookingEnd && endDateTime >= bookingStart);
          })
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
      );
    }

    console.log("✅ Dates valides, aucun chevauchement détecté");

    return new Response(
      JSON.stringify({ 
        valid: true, 
        message: "Dates disponibles" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Erreur:", error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: error.message 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});