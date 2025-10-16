// src/hooks/useBookingProcess.ts
// VERSION MODIFIÉE : Suppression du wallet + Email au propriétaire dès la création

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth';
import { toast } from "@/components/ui/use-toast";
import { BookingData, EquipmentData } from '@/types/supabase';

type BookingStep = 'dates' | 'payment' | 'contract' | 'complete';

export function useBookingProcess() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<BookingStep>('dates');

  // Calculer le prix de location
  const calculateRentalPrice = (equipment: EquipmentData, days: number) => {
    const basePrice = equipment.daily_price * days;
    const commission = basePrice * 0.05; // 5% commission
    return {
      basePrice,
      commission,
      total: basePrice + commission
    };
  };

  // Créer une réservation
  const createBooking = async (
    equipmentId: string,
    startDate: Date,
    endDate: Date,
    rentalDays: number
  ): Promise<BookingData | null> => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour effectuer une réservation",
        variant: "destructive",
      });
      return null;
    }
    
    setLoading(true);
    
    try {
      // Récupérer l'équipement pour le prix
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipments')
        .select('*')
        .eq('id', equipmentId)
        .single();

      if (equipmentError || !equipment) {
        throw new Error("Équipement non trouvé");
      }

      const { total } = calculateRentalPrice(equipment, rentalDays);

      // Créer la réservation avec statut "pending"
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          equipment_id: equipmentId,
          renter_id: user.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          total_price: total,
          deposit_amount: equipment.deposit_amount || 0,
          status: 'pending', // En attente de validation du propriétaire
          payment_status: 'paid', // ✅ Déjà payé via KakiaPay
          payment_method: 'kakiapay',
          commission_amount: total * 0.05,
          platform_fee: 0
        })
        .select()
        .single();

      if (bookingError) {
        throw bookingError;
      }

      console.log('✅ Réservation créée:', booking.id);

      // ✅ CRÉER LA NOTIFICATION IN-APP POUR LE PROPRIÉTAIRE
      const notificationData = {
        user_id: equipment.owner_id,
        type: 'new_booking',
        title: '🔔 Nouvelle demande de réservation',
        message: `${user.email} souhaite réserver "${equipment.title}". Montant: ${total.toLocaleString()} FCFA (déjà payé).`,
        booking_id: booking.id
      };

      await supabase.from('notifications').insert(notificationData);
      console.log('✅ Notification in-app créée pour le propriétaire');

      // ✅ ENVOYER L'EMAIL AU PROPRIÉTAIRE
      try {
        console.log('📧 Tentative d\'envoi email au propriétaire...');
        
        const { data: emailResult, error: emailError } = await supabase.functions.invoke(
          'send-booking-notification-gmail', // ← Nouvelle fonction Gmail
          {
            body: { booking_id: booking.id }
          }
        );

        if (emailError) {
          console.error('⚠️ Erreur envoi email au propriétaire:', emailError);
          // On continue quand même, l'email n'est pas critique pour le succès de la réservation
        } else if (emailResult?.success) {
          console.log('✅ Email envoyé avec succès au propriétaire:', emailResult.message);
        } else {
          console.warn('⚠️ Email non envoyé:', emailResult);
        }
      } catch (emailError: any) {
        console.error('⚠️ Exception lors de l\'envoi email:', emailError.message);
        // Ne pas faire échouer la réservation si l'email ne part pas
      }
      
      toast({
        title: "✅ Réservation créée avec succès",
        description: "Le propriétaire a été notifié et va examiner votre demande.",
      });
      
      setCurrentStep('complete');
      return booking as BookingData;

    } catch (error) {
      console.error("❌ Erreur lors de la création de la réservation:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de la réservation",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    currentStep,
    setCurrentStep,
    calculateRentalPrice,
    createBooking
  };
}