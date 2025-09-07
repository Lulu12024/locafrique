import { supabase } from '@/integrations/supabase/client';
import { BookingData } from '@/types/supabase';
import { toast } from '@/hooks/use-toast';

// Function to generate a contract PDF
export const generateContractPDF = async (bookingId: string): Promise<string | null> => {
  try {
    // Call the Supabase Edge Function to generate the PDF
    const { data, error } = await supabase.functions.invoke('generate-contract', {
      body: { booking_id: bookingId }
    });
    
    if (error) throw error;
    
    // Update booking with contract URL
    if (data?.pdf) {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ contract_url: data.pdf })
        .eq('id', bookingId);
        
      if (updateError) {
        console.error("Error updating booking with contract URL:", updateError);
      } else {
        toast({
          title: "Contrat généré",
          description: "Le contrat de location a été créé avec succès",
        });
      }
    }
    
    return data?.pdf || null;
  } catch (error) {
    console.error("Erreur lors de la génération du contrat:", error);
    toast({
      title: "Erreur",
      description: "Impossible de générer le contrat",
      variant: "destructive",
    });
    return null;
  }
};

// Function to sign a contract with renter or owner signature
export const signContract = async (
  bookingId: string,
  signatureData: string,
  isRenter: boolean
): Promise<boolean> => {
  try {
    // Update the booking with signature status
    const { error } = await supabase
      .from('bookings')
      .update({
        [isRenter ? 'renter_signature' : 'owner_signature']: true,
        // Also update the status if both parties have signed
        ...(isRenter ? {} : { status: 'approved' })
      })
      .eq('id', bookingId);
    
    if (error) throw error;
    
    // Check if both parties have signed to update final status
    if (!isRenter) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('renter_signature, owner_signature')
        .eq('id', bookingId)
        .single();
        
      if (booking?.renter_signature && booking?.owner_signature) {
        await supabase
          .from('bookings')
          .update({ status: 'approved' })
          .eq('id', bookingId);
      }
    }
    
    toast({
      title: "Contrat signé",
      description: isRenter 
        ? "Vous avez signé le contrat avec succès" 
        : "Le contrat a été approuvé et signé",
    });
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la signature du contrat:", error);
    toast({
      title: "Erreur",
      description: "Impossible de signer le contrat",
      variant: "destructive",
    });
    return false;
  }
};

// Function to download a contract as PDF
export const downloadContract = (pdfBase64: string, filename: string): void => {
  try {
    // Remove the data URI prefix if present
    const base64Content = pdfBase64.startsWith('data:') 
      ? pdfBase64
      : `data:application/pdf;base64,${pdfBase64}`;
    
    // Create a link element
    const link = document.createElement('a');
    link.href = base64Content;
    link.download = filename;
    
    // Append the link to the body
    document.body.appendChild(link);
    
    // Click the link and then remove it
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Téléchargement démarré",
      description: "Le contrat va être téléchargé",
    });
  } catch (error) {
    console.error("Erreur lors du téléchargement:", error);
    toast({
      title: "Erreur",
      description: "Impossible de télécharger le contrat",
      variant: "destructive",
    });
  }
};

// Function to get booking with full details for contract
export const getBookingForContract = async (bookingId: string): Promise<BookingData | null> => {
  try {
    console.log('🔍 Récupération booking pour contrat:', bookingId);
    
    // ✅ ÉTAPE 1: Récupérer le booking de base
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
    
    if (bookingError) {
      console.error('❌ Erreur booking:', bookingError);
      throw bookingError;
    }

    if (!booking) {
      console.error('❌ Booking non trouvé');
      return null;
    }

    // ✅ ÉTAPE 2: Récupérer l'équipement
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipments')
      .select('*')
      .eq('id', booking.equipment_id)
      .single();
    
    if (equipmentError) {
      console.error('❌ Erreur équipement:', equipmentError);
      throw equipmentError;
    }

    // ✅ ÉTAPE 3: Récupérer les images de l'équipement
    const { data: images, error: imagesError } = await supabase
      .from('equipment_images')
      .select('*')
      .eq('equipment_id', booking.equipment_id);

    if (imagesError) {
      console.error('❌ Erreur images:', imagesError);
      // Ne pas faire échouer, continuer sans images
    }

    // ✅ ÉTAPE 4: Récupérer le propriétaire (owner)
    const { data: owner, error: ownerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', equipment.owner_id)
      .single();

    if (ownerError) {
      console.error('❌ Erreur propriétaire:', ownerError);
      throw ownerError;
    }

    // ✅ ÉTAPE 5: Récupérer le locataire (renter)
    const { data: renter, error: renterError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', booking.renter_id)
      .single();

    if (renterError) {
      console.error('❌ Erreur locataire:', renterError);
      throw renterError;
    }

    // ✅ ÉTAPE 6: Transformer et combiner toutes les données
    const transformedData: BookingData = {
      ...booking,
      equipment: equipment ? {
        ...equipment,
        images: images || [],
        owner: owner ? {
          ...owner,
          user_type: owner.user_type as 'locataire' | 'proprietaire'
        } : undefined
      } : undefined,
      owner: owner ? {
        ...owner,
        user_type: owner.user_type as 'locataire' | 'proprietaire'
      } : undefined,
      renter: renter ? {
        ...renter,
        user_type: renter.user_type as 'locataire' | 'proprietaire'
      } : undefined
    };
    
    console.log('✅ Booking complet récupéré pour contrat');
    return transformedData;
    
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de la réservation:", error);
    return null;
  }
};

// Function to validate booking for contract generation
export const validateBookingForContract = (booking: BookingData): boolean => {
  // Check if booking is in correct status
  if (!['confirmée', 'approved'].includes(booking.status)) {
    toast({
      title: "Statut invalide",
      description: "La réservation doit être confirmée pour générer un contrat",
      variant: "destructive",
    });
    return false;
  }
  
  // Check if payment is completed
  if (booking.payment_status !== 'payé') {
    toast({
      title: "Paiement requis",
      description: "Le paiement doit être effectué avant la génération du contrat",
      variant: "destructive",
    });
    return false;
  }
  
  // Check if all required data is present
  if (!booking.equipment || !booking.renter || !booking.owner) {
    toast({
      title: "Données manquantes",
      description: "Informations incomplètes pour générer le contrat",
      variant: "destructive",
    });
    return false;
  }
  
  return true;
};
