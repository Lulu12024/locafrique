
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  Calendar,
  Phone,
  Mail,
  User,
  Euro
} from 'lucide-react';
import { BookingData } from '@/types/supabase';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BookingConfirmationProps {
  booking: BookingData;
  onContactOwner?: () => void;
  onViewContract?: () => void;
}

export function BookingConfirmation({ 
  booking, 
  onContactOwner,
  onViewContract 
}: BookingConfirmationProps) {
  const rentalDays = differenceInDays(new Date(booking.end_date), new Date(booking.start_date)) + 1;
  
  const getStatusBadge = () => {
    switch (booking.status) {
      case 'en_attente':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'confirmée':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Confirmée</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500"><CheckCircle className="h-3 w-3 mr-1" />Approuvée</Badge>;
      default:
        return <Badge variant="secondary">{booking.status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Success message */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-green-800">Réservation créée avec succès !</h3>
              <p className="text-sm text-green-600">
                Votre demande de réservation a été envoyée au propriétaire
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Détails de votre réservation</CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Equipment info */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
            <div className="flex-1">
              <h4 className="font-medium">{booking.equipment?.title}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {booking.equipment?.description}
              </p>
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                <MapPin className="h-3 w-3" />
                <span>{booking.equipment?.location}</span>
              </div>
            </div>
          </div>

          {/* Rental period */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Période de location</p>
                <p className="text-xs text-gray-600">
                  {format(new Date(booking.start_date), 'dd MMM', { locale: fr })} - {' '}
                  {format(new Date(booking.end_date), 'dd MMM yyyy', { locale: fr })}
                </p>
                <p className="text-xs text-gray-500">{rentalDays} jour{rentalDays > 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Montant total</p>
                <p className="text-lg font-bold text-green-600">{booking.total_price} FCFA</p>
                <p className="text-xs text-gray-500">+ {booking.deposit_amount} FCFA de caution</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Owner contact */}
      {booking.owner && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Propriétaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="font-medium">
                  {booking.owner.first_name} {booking.owner.last_name}
                </p>
                {booking.owner.phone_number && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-3 w-3" />
                    <span>{booking.owner.phone_number}</span>
                  </div>
                )}
              </div>
              
              {onContactOwner && (
                <Button variant="outline" size="sm" onClick={onContactOwner}>
                  <Mail className="h-4 w-4 mr-2" />
                  Contacter le propriétaire
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next steps */}
      <Card>
        <CardHeader>
          <CardTitle>Prochaines étapes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-blue-600">1</span>
              </div>
              <div>
                <p className="font-medium">Attente de confirmation</p>
                <p className="text-gray-600">Le propriétaire va examiner votre demande</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-gray-600">2</span>
              </div>
              <div>
                <p className="font-medium">Génération du contrat</p>
                <p className="text-gray-600">Un contrat de location sera généré</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-gray-600">3</span>
              </div>
              <div>
                <p className="font-medium">Signature du contrat</p>
                <p className="text-gray-600">Vous et le propriétaire devrez signer le contrat</p>
              </div>
            </div>
          </div>

          {onViewContract && (
            <div className="mt-4 pt-4 border-t">
              <Button onClick={onViewContract} className="w-full">
                Voir le contrat
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
