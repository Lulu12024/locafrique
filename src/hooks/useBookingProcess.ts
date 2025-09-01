import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth';
import { toast } from "@/components/ui/use-toast";
import { BookingData, EquipmentData, PaymentData, ContractData, MockTables, ProfileData } from '@/types/supabase';
import { addDays, format } from 'date-fns';

// Mock database for simulation since these tables don't exist in Supabase yet
const mockDb: MockTables = {
  payments: [],
  contracts: []
};

export function useBookingProcess() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'details' | 'payment' | 'contract' | 'complete'>('details');
  
  // Function to calculate the total rental price
  const calculateRentalPrice = (equipment: EquipmentData, days: number): number => {
    if (days >= 7 && equipment.weekly_price) {
      // Calculate price using weekly rate for weeks and daily rate for remaining days
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      return (weeks * equipment.weekly_price) + (remainingDays * equipment.daily_price);
    } else {
      // Calculate price using only daily rate
      return days * equipment.daily_price;
    }
  };
  
  // Function to create a booking
  const createBooking = async (
    equipmentId: string, 
    startDate: Date, 
    endDate: Date, 
    rentalDays: number
  ): Promise<BookingData | null> => {
    console.log("🚀 Début createBooking - Utilisateur:", user?.email);
    console.log("🚀 Profil utilisateur:", profile?.first_name, profile?.last_name);
    
    if (!user) {
      console.error("❌ Pas d'utilisateur dans useBookingProcess");
      toast({
        title: "Erreur d'authentification",
        description: "Votre session a expiré. Veuillez vous reconnecter.",
        variant: "destructive",
      });
      return null;
    }
    
    setLoading(true);
    
    try {
      // Get equipment details
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipments')
        .select('*, owner:profiles(*)')
        .eq('id', equipmentId)
        .single();
      
      if (equipmentError) throw equipmentError;
      
      // Ensure owner.user_type is cast to the correct type
      const ownerWithCorrectType = equipment.owner ? {
        ...equipment.owner,
        user_type: equipment.owner.user_type as "locataire" | "proprietaire"
      } : undefined;
      
      // We need to add the images field to the equipment data because it's required
      const equipmentWithImages = {
        ...equipment,
        images: [] as any, // Mock empty images array
        owner: ownerWithCorrectType // Use the properly cast owner
      };
      
      // Calculate total price and deposit
      const totalPrice = calculateRentalPrice(equipmentWithImages, rentalDays);
      const depositAmount = equipment.deposit_amount;
      
      console.log("💰 Prix calculé:", totalPrice, "FCFA");
      console.log("🏦 Caution:", depositAmount, "FCFA");
      
      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          equipment_id: equipmentId,
          renter_id: user.id,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          total_price: totalPrice,
          deposit_amount: depositAmount,
          status: 'en_attente',
          payment_status: 'en_attente',
          owner_signature: false,
          renter_signature: false
        })
        .select('*, equipment:equipments(*), renter:profiles(*), owner:profiles(*)')
        .single();
        
      if (bookingError) {
        console.error("❌ Erreur création réservation:", bookingError);
        throw bookingError;
      }
      
      console.log("✅ Réservation créée avec succès:", booking.id);
      
      // After retrieving the booking, add the images to the equipment and ensure owner user_type is correct
      const bookingWithEquipmentImages = {
        ...booking,
        equipment: {
          ...booking.equipment,
          images: [] as any // Mock empty images array
        },
        owner: booking.owner ? {
          ...booking.owner,
          user_type: booking.owner.user_type as "locataire" | "proprietaire" 
        } : undefined,
        renter: booking.renter ? {
          ...booking.renter,
          user_type: booking.renter.user_type as "locataire" | "proprietaire"
        } : undefined
      };
      
      toast({
        title: "Réservation créée",
        description: "Votre demande de réservation a été créée avec succès",
      });
      
      setCurrentStep('payment');
      return bookingWithEquipmentImages;
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
  
  // Function to process payment for booking
  const processPayment = async (
    booking: BookingData, 
    paymentMethod: 'card' | 'mobile_money' | 'wallet'
  ): Promise<PaymentData | null> => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour effectuer un paiement",
        variant: "destructive",
      });
      return null;
    }
    
    setLoading(true);
    
    try {
      // In a real scenario, we would integrate with Stripe, Mobile Money APIs, etc.
      // For demo purposes, we'll simulate a successful payment
      
      // Create payment record (using mock database since the table doesn't exist yet)
      const paymentData: PaymentData = {
        id: `payment_${Date.now()}`,
        booking_id: booking.id,
        amount: booking.total_price,
        deposit_amount: booking.deposit_amount || 0,
        payment_method: paymentMethod,
        status: 'completed', // In a real app, this would initially be 'pending' until confirmed
        transaction_id: `DEMO-${Date.now()}`, // This would be provided by the payment processor
        created_at: new Date().toISOString()
      };
      
      mockDb.payments.push(paymentData);
        
      // Update booking payment status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          payment_status: 'payé',
          status: 'confirmée'
        })
        .eq('id', booking.id);
        
      if (updateError) throw updateError;
      
      toast({
        title: "Paiement effectué",
        description: "Votre paiement a été traité avec succès",
      });
      
      setCurrentStep('contract');
      return paymentData;
    } catch (error) {
      console.error("Erreur lors du paiement:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du paiement",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Function to generate a rental contract
  const generateContract = async (booking: BookingData): Promise<ContractData | null> => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour générer un contrat",
        variant: "destructive",
      });
      return null;
    }
    
    setLoading(true);
    
    try {
      // In a real scenario, we would generate a PDF using a library
      // For demo purposes, we'll just create a contract record
      
      // Create contract record (using mock database since the table doesn't exist yet)
      const contractData: ContractData = {
        id: `contract_${Date.now()}`,
        booking_id: booking.id,
        file_url: `https://example.com/contracts/demo-contract-${booking.id}.pdf`, // This would be a real URL in production
        status: 'pending_renter',
        created_at: new Date().toISOString()
      };
      
      mockDb.contracts.push(contractData);
        
      toast({
        title: "Contrat généré",
        description: "Le contrat de location a été généré avec succès",
      });
      
      return contractData;
    } catch (error) {
      console.error("Erreur lors de la génération du contrat:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération du contrat",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Function to sign a contract (renter or owner)
  const signContract = async (
    contractId: string, 
    signatureData: string, 
    isRenter: boolean
  ): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour signer un contrat",
        variant: "destructive",
      });
      return false;
    }
    
    setLoading(true);
    
    try {
      // Find the contract in the mock database
      const contractIndex = mockDb.contracts.findIndex(c => c.id === contractId);
      if (contractIndex === -1) {
        throw new Error("Contract not found");
      }
      
      const contract = mockDb.contracts[contractIndex];
      
      // Update the contract with the signature
      mockDb.contracts[contractIndex] = {
        ...contract,
        [isRenter ? 'renter_signature_url' : 'owner_signature_url']: signatureData,
        status: isRenter ? 'pending_owner' : 'completed'
      };
      
      // Update booking with signature status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          [isRenter ? 'renter_signature' : 'owner_signature']: true
        })
        .eq('id', contract.booking_id);
        
      if (updateError) throw updateError;
      
      toast({
        title: "Contrat signé",
        description: "Le contrat a été signé avec succès",
      });
      
      if (!isRenter) {
        setCurrentStep('complete');
      }
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la signature du contrat:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la signature du contrat",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Function to finalize the rental at the end of the period
  const finalizeRental = async (
    bookingId: string, 
    equipmentCondition: 'good' | 'damaged', 
    notes?: string
  ): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour finaliser une location",
        variant: "destructive",
      });
      return false;
    }
    
    setLoading(true);
    
    try {
      const { data: booking, error: getError } = await supabase
        .from('bookings')
        .select('deposit_amount, equipment_id, owner_id, renter_id')
        .eq('id', bookingId)
        .single();
        
      if (getError) throw getError;
      
      // Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'completed'
        })
        .eq('id', bookingId);
        
      if (updateError) throw updateError;
      
      // In a real app, we would create a dispute record if the equipment is damaged
      if (equipmentCondition === 'damaged') {
        toast({
          title: "Litige créé",
          description: "Un litige a été créé concernant l'état du matériel",
        });
      } else {
        toast({
          title: "Location finalisée",
          description: "La caution a été libérée et la location est maintenant terminée",
        });
      }
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la finalisation de la location:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la finalisation de la location",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    currentStep,
    setCurrentStep,
    calculateRentalPrice,
    createBooking,
    processPayment,
    generateContract,
    signContract,
    finalizeRental,
  };
}
