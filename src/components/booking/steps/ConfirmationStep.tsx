
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, MessageCircle, FileText, Calendar } from 'lucide-react';
import { BookingData } from '@/types/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ConfirmationStepProps {
  booking: BookingData;
  onContactOwner: () => void;
  onViewContract: () => void;
}

export function ConfirmationStep({ booking, onContactOwner, onViewContract }: ConfirmationStepProps) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl text-green-600">
          Réservation confirmée !
        </CardTitle>
        <p className="text-gray-600">
          Votre demande de location a été enregistrée avec succès
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <h3 className="font-medium text-green-800 mb-3">Récapitulatif de votre réservation</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Numéro de réservation:</span>
              <span className="font-mono font-medium">{booking.id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Matériel:</span>
              <span className="font-medium">{booking.equipment?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Période:</span>
              <span className="font-medium">
                {format(new Date(booking.start_date), 'dd MMM', { locale: fr })} - {format(new Date(booking.end_date), 'dd MMM yyyy', { locale: fr })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Statut:</span>
              <span className="text-orange-600 font-medium">En attente de validation</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Prochaines étapes</h3>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Le propriétaire va examiner votre demande</li>
            <li>Vous recevrez une notification de confirmation</li>
            <li>Le contrat sera finalisé et signé</li>
            <li>Vous pourrez récupérer le matériel aux dates convenues</li>
          </ol>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button onClick={onContactOwner} variant="outline" className="w-full">
            <MessageCircle className="mr-2 h-4 w-4" />
            Contacter le propriétaire
          </Button>
          <Button onClick={onViewContract} variant="outline" className="w-full">
            <FileText className="mr-2 h-4 w-4" />
            Voir le contrat
          </Button>
        </div>

        <div className="text-center">
          <Button asChild variant="default" size="lg" className="w-full sm:w-auto">
            <a href="/dashboard">
              <Calendar className="mr-2 h-4 w-4" />
              Voir mes réservations
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
