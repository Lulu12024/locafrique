// src/hooks/useBookedDates.ts
// VERSION CORRIGÉE - Sans erreur de subscription multiple
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, eachDayOfInterval, parseISO } from 'date-fns';

interface BookedDateRange {
  start_date: string;
  end_date: string;
  status: string;
}

/**
 * Hook pour récupérer et gérer les dates réservées d'un équipement
 * @param equipmentId - ID de l'équipement
 * @returns Object contenant les dates réservées et une fonction de vérification
 */
export const useBookedDates = (equipmentId: string | undefined) => {
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [bookedRanges, setBookedRanges] = useState<BookedDateRange[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!equipmentId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchBookedDates = async () => {
      try {
        if (!isMounted) return;
        
        setIsLoading(true);
        console.log('🔍 Chargement des dates réservées pour l\'équipement:', equipmentId);

        // Récupérer toutes les réservations actives (confirmées, en attente, en cours)
        const { data: bookings, error } = await supabase
          .from('bookings')
          .select('start_date, end_date, status')
          .eq('equipment_id', equipmentId)
          .in('status', ['confirmed', 'pending', 'in_progress']);

        if (error) {
          console.error('❌ Erreur lors de la récupération des réservations:', error);
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        if (!bookings || bookings.length === 0) {
          console.log('✅ Aucune réservation trouvée pour cet équipement');
          if (isMounted) {
            setBookedDates([]);
            setBookedRanges([]);
            setIsLoading(false);
          }
          return;
        }

        console.log(`✅ ${bookings.length} réservation(s) trouvée(s)`);

        // Stocker les plages de dates
        if (isMounted) {
          setBookedRanges(bookings);
        }

        // Convertir toutes les plages de dates en dates individuelles
        const allBookedDates: Date[] = [];
        
        bookings.forEach((booking) => {
          try {
            const startDate = startOfDay(parseISO(booking.start_date));
            const endDate = startOfDay(parseISO(booking.end_date));

            // Générer toutes les dates entre start et end (inclus)
            const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
            allBookedDates.push(...dateRange);

            console.log(`📅 Réservation ${booking.status}:`, {
              start: booking.start_date,
              end: booking.end_date,
              days: dateRange.length
            });
          } catch (err) {
            console.error('❌ Erreur lors du parsing des dates:', err);
          }
        });

        if (isMounted) {
          setBookedDates(allBookedDates);
          setIsLoading(false);
          console.log(`✅ Total de ${allBookedDates.length} jours réservés`);
        }

      } catch (error) {
        console.error('❌ Erreur lors du chargement des dates réservées:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Charger les données initiales
    fetchBookedDates();

    // S'abonner aux changements en temps réel
    try {
      const channelName = `bookings-${equipmentId}-${Date.now()}`;
      console.log('🔌 Création du canal Realtime:', channelName);
      
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: `equipment_id=eq.${equipmentId}`,
          },
          (payload) => {
            console.log('🔄 Mise à jour en temps réel des réservations:', payload);
            if (isMounted) {
              fetchBookedDates();
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Statut subscription:', status);
        });
    } catch (error) {
      console.error('❌ Erreur lors de la création du canal Realtime:', error);
    }

    // Fonction de nettoyage
    return () => {
      console.log('🧹 Nettoyage du hook useBookedDates');
      isMounted = false;
      
      if (channel) {
        try {
          console.log('🔌 Désinscription du canal Realtime');
          supabase.removeChannel(channel);
        } catch (error) {
          console.error('❌ Erreur lors de la désinscription:', error);
        }
      }
    };
  }, [equipmentId]);

  /**
   * Vérifie si une date est réservée
   */
  const isDateBooked = (date: Date): boolean => {
    const dateToCheck = startOfDay(date);
    return bookedDates.some(bookedDate => 
      startOfDay(bookedDate).getTime() === dateToCheck.getTime()
    );
  };

  /**
   * Vérifie si une plage de dates chevauche des réservations existantes
   */
  const hasOverlap = (startDate: Date, endDate: Date): boolean => {
    const start = startOfDay(startDate);
    const end = startOfDay(endDate);

    return bookedRanges.some(booking => {
      const bookingStart = startOfDay(parseISO(booking.start_date));
      const bookingEnd = startOfDay(parseISO(booking.end_date));

      // Vérifier le chevauchement
      return (start <= bookingEnd) && (end >= bookingStart);
    });
  };

  /**
   * Obtenir la prochaine date disponible après une date donnée
   */
  const getNextAvailableDate = (fromDate: Date): Date | null => {
    let currentDate = startOfDay(fromDate);
    const maxIterations = 365; // Limiter à 1 an
    let iterations = 0;

    while (iterations < maxIterations) {
      if (!isDateBooked(currentDate)) {
        return currentDate;
      }
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + 1);
      iterations++;
    }

    return null;
  };

  return {
    bookedDates,
    bookedRanges,
    isLoading,
    isDateBooked,
    hasOverlap,
    getNextAvailableDate,
  };
};