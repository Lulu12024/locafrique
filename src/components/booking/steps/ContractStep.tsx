
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Check, ArrowRight, Loader2 } from 'lucide-react';
import { BookingData } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface ContractStepProps {
  booking: BookingData;
  onNext: () => void;
}

export function ContractStep({ booking, onNext }: ContractStepProps) {
  const [contractURL, setContractURL] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isContractReady, setIsContractReady] = useState(false);

  const generateContract = async () => {
    setIsGenerating(true);
    try {
      console.log("🔍 Génération du contrat pour la réservation:", booking.id);
      
      const { data, error } = await supabase.functions.invoke('generate-contract', {
        body: { booking_id: booking.id }
      });

      if (error) {
        console.error("❌ Erreur fonction edge:", error);
        throw error;
      }

      if (data && data.pdf) {
        console.log("✅ Contrat généré avec succès");
        setContractURL(data.pdf);
        setIsContractReady(true);
        toast({
          title: "Contrat généré",
          description: "Le contrat de location a été créé avec succès",
        });
      } else {
        throw new Error("Aucun PDF reçu");
      }
    } catch (error: any) {
      console.error("❌ Erreur génération contrat:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le contrat",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadContract = () => {
    if (contractURL) {
      const link = document.createElement('a');
      link.href = contractURL;
      link.download = `contrat-location-${booking.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          Contrat de location
        </CardTitle>
        <p className="text-gray-600">
          Génération et validation du contrat pour votre location
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Détails de la réservation</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Matériel:</strong> {booking.equipment?.title}</p>
            <p><strong>Période:</strong> du {new Date(booking.start_date).toLocaleDateString()} au {new Date(booking.end_date).toLocaleDateString()}</p>
            <p><strong>Prix total:</strong> {booking.total_price} FCFA</p>
            <p><strong>Caution:</strong> {booking.deposit_amount} FCFA</p>
          </div>
        </div>

        {!contractURL && !isGenerating && (
          <Button onClick={generateContract} className="w-full" size="lg">
            <FileText className="mr-2 h-5 w-5" />
            Générer le contrat de location
          </Button>
        )}

        {isGenerating && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Génération du contrat en cours...</p>
          </div>
        )}

        {contractURL && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <Check className="h-5 w-5" />
                <span className="font-medium">Contrat généré avec succès</span>
              </div>
              <p className="text-sm text-green-600">
                Votre contrat de location est prêt. Vous pouvez le télécharger et le consulter.
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium">Document de contrat</span>
                <Button variant="outline" size="sm" onClick={downloadContract}>
                  <Download className="h-4 w-4 mr-1" />
                  Télécharger
                </Button>
              </div>
              <div className="bg-gray-100 rounded border h-40 flex items-center justify-center">
                <iframe 
                  src={contractURL} 
                  className="w-full h-full border-0" 
                  title="Aperçu du contrat"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={onNext} size="lg" className="min-w-32">
                Valider et continuer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
