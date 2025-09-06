// import { supabase } from "@/integrations/supabase/client";
// import { useState } from "react";

// export interface ExtractedIdentity {
//   name: string;
//   idNumber: string;
//   dateOfBirth: string;
//   placeOfBirth: string;
//   documentType: string;
//   confidence: number;
// }

// export function useIdentityVerification() {
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [extractedData, setExtractedData] = useState<ExtractedIdentity | null>(null);

//   const processIdDocument = async (imageFile: File): Promise<ExtractedIdentity | null> => {
//     setIsProcessing(true);
    
//     try {
//       // Upload de l'image
//       const { data: uploadData, error: uploadError } = await supabase.storage
//         .from('identity-documents')
//         .upload(`temp/${Date.now()}-${imageFile.name}`, imageFile);

//       if (uploadError) throw uploadError;

//       // Traitement OCR via Edge Function
//       const { data: ocrResult, error: ocrError } = await supabase.functions
//         .invoke('process-identity-document', {
//           body: { imagePath: uploadData.path }
//         });

//       if (ocrError) throw ocrError;

//       const extracted: ExtractedIdentity = {
//         name: ocrResult.name || '',
//         idNumber: ocrResult.idNumber || '',
//         dateOfBirth: ocrResult.dateOfBirth || '',
//         placeOfBirth: ocrResult.placeOfBirth || '',
//         documentType: ocrResult.documentType || 'Carte d\'identité',
//         confidence: ocrResult.confidence || 0
//       };

//       setExtractedData(extracted);
//       return extracted;
//     } catch (error) {
//       console.error('Erreur lors du traitement OCR:', error);
//       toast({
//         title: "Erreur de traitement",
//         description: "Impossible d'extraire les informations du document",
//         variant: "destructive",
//       });
//       return null;
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const generateContractWithIdentity = async (bookingId: string) => {
//     try {
//       const { data, error } = await supabase.functions
//         .invoke('generate-contract-with-identity', {
//           body: { 
//             booking_id: bookingId,
//             auto_validation: true,
//             commission_rate: 0.05 // 5% fixe
//           }
//         });

//       if (error) throw error;

//       // Envoi automatique par email
//       await supabase.functions.invoke('send-contract-email', {
//         body: { 
//           booking_id: bookingId,
//           contract_url: data.contractUrl 
//         }
//       });

//       return { success: true, contractUrl: data.contractUrl };
//     } catch (error) {
//       console.error('Erreur génération contrat:', error);
//       return { success: false, error: error.message };
//     }
//   };

//   return {
//     isProcessing,
//     extractedData,
//     processIdDocument,
//     generateContractWithIdentity
//   };
// }