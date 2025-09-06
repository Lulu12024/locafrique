// import { useState } from 'react';
// import { supabase } from '@/integrations/supabase/client';
// import { toast } from '@/components/ui/use-toast';

// export interface ReservationFlowData {
//   equipmentId: string;
//   startDate: Date;
//   endDate: Date;
//   userInfo: {
//     firstName: string;
//     lastName: string;
//     email: string;
//     phone: string;
//     purpose: string;
//   };
//   paymentMethod: 'card' | 'mobile_money' | 'wallet';
//   totalAmount: number;
//   commission: number;
// }

// export function useModernReservationFlow() {
//   const [currentStep, setCurrentStep] = useState(1);
//   const [formData, setFormData] = useState<Partial<ReservationFlowData>>({});
//   const [isProcessing, setIsProcessing] = useState(false);

//   const updateFormData = (data: Partial<ReservationFlowData>) => {
//     setFormData(prev => ({ ...prev, ...data }));
//   };

//   const processReservation = async () => {
//     if (!formData.equipmentId || !formData.startDate || !formData.endDate) {
//       toast({
//         title: "Données manquantes",
//         description: "Veuillez compléter toutes les informations requises",
//         variant: "destructive",
//       });
//       return false;
//     }

//     setIsProcessing(true);
    
//     try {
//       // 1. Créer la réservation
//       const { data: booking, error: bookingError } = await supabase
//         .from('bookings')
//         .insert({
//           equipment_id: formData.equipmentId,
//           start_date: formData.startDate.toISOString(),
//           end_date: formData.endDate.toISOString(),
//           total_price: formData.totalAmount,
//           commission_amount: formData.commission, // Commission fixe 5%
//           status: 'pending',
//           payment_status: 'pending'
//         })
//         .select()
//         .single();

//       if (bookingError) throw bookingError;

//       // 2. Traiter le paiement avec commission automatique
//       const paymentResult = await processPaymentWithCommission(
//         booking.id,
//         formData.totalAmount!,
//         formData.paymentMethod!
//       );

//       if (paymentResult.success) {
//         toast({
//           title: "Réservation confirmée",
//           description: "Votre réservation a été créée avec succès",
//         });
//         return true;
//       }

//       throw new Error(paymentResult.error);
//     } catch (error) {
//       console.error('Erreur lors de la réservation:', error);
//       toast({
//         title: "Erreur",
//         description: "Impossible de créer la réservation",
//         variant: "destructive",
//       });
//       return false;
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   return {
//     currentStep,
//     setCurrentStep,
//     formData,
//     updateFormData,
//     processReservation,
//     isProcessing
//   };
// }