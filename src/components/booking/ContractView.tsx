
import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BookingData } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Check } from 'lucide-react';
import { SignatureCanvas } from './SignatureCanvas';
import { downloadContract, generateContractPDF, signContract } from '@/utils/contractUtils';

interface ContractViewProps {
  booking: BookingData;
  onContractSigned: () => void;
}

export function ContractView({ booking, onContractSigned }: ContractViewProps) {
  const [contractURL, setContractURL] = React.useState<string | null>(null);
  const [isSigning, setIsSigning] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSigned, setIsSigned] = React.useState(booking.renter_signature || false);
  
  // Generate contract PDF
  const handleGenerateContract = async () => {
    setIsGenerating(true);
    try {
      const url = await generateContractPDF(booking.id);
      setContractURL(url);
    } catch (error) {
      console.error("Error generating contract:", error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle signature submission
  const handleSignature = async (signatureData: string) => {
    setIsSigning(true);
    try {
      const success = await signContract(booking.id, signatureData, true);
      if (success) {
        setIsSigned(true);
        onContractSigned();
      }
    } catch (error) {
      console.error("Error signing contract:", error);
    } finally {
      setIsSigning(false);
    }
  };
  
  // Download contract
  const handleDownload = () => {
    if (contractURL) {
      downloadContract(contractURL, `contrat-location-${booking.id}.pdf`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Contrat de Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contract details */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Détails du contrat</h3>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-sm font-medium">Matériel:</span>
            <span className="text-sm">{booking.equipment?.title}</span>
            <span className="text-sm font-medium">Période:</span>
            <span className="text-sm">
              {format(new Date(booking.start_date), 'dd MMMM yyyy', { locale: fr })} - {' '}
              {format(new Date(booking.end_date), 'dd MMMM yyyy', { locale: fr })}
            </span>
            <span className="text-sm font-medium">Montant:</span>
            <span className="text-sm">{booking.total_price} FCFA</span>
            <span className="text-sm font-medium">Caution:</span>
            <span className="text-sm">{booking.deposit_amount} FCFA</span>
          </div>
        </div>
        
        {/* Contract document */}
        <div className="space-y-2">
          {!contractURL ? (
            <Button 
              onClick={handleGenerateContract} 
              disabled={isGenerating}
              variant="outline" 
              className="w-full"
            >
              {isGenerating ? 'Génération...' : 'Générer le contrat'}
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Document de contrat</span>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-1" />
                  Télécharger
                </Button>
              </div>
              <div className="border rounded-md p-4 bg-muted/30">
                <iframe 
                  src={contractURL} 
                  className="w-full h-60" 
                  title="Contrat de location"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Signature section */}
        {contractURL && !isSigned ? (
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Signature du contrat</h3>
            <p className="text-sm text-muted-foreground">
              Veuillez signer ci-dessous pour accepter les termes du contrat
            </p>
            <SignatureCanvas onSave={handleSignature} />
          </div>
        ) : isSigned ? (
          <div className="rounded-md p-4 bg-green-50 flex items-center">
            <Check className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-green-700">Contrat signé avec succès</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
