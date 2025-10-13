// src/components/booking/BookingApprovalCard.tsx
// VERSION SIMPLIFIÉE : Paiement KakiaPay direct + Pas de contrat + Email au propriétaire

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Phone, 
  MapPin,
  Calendar,
  DollarSign,
  Mail,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface BookingApprovalCardProps {
  booking: any;
  onStatusChange: () => void;
}

export function BookingApprovalCard({ booking, onStatusChange }: BookingApprovalCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  // ✅ Approuver la réservation (SIMPLIFIÉ - SANS CONTRAT)
  const handleApprove = async () => {
    setIsProcessing(true);
    setActionType('approve');

    try {
      console.log('🟢 Approbation de la réservation:', booking.id);

      // 1. Mettre à jour le statut de la réservation
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed', // ✅ Directement "confirmed" car déjà payé
          approved_at: new Date().toISOString(),
          owner_approval: true
        })
        .eq('id', booking.id);

      if (updateError) {
        throw updateError;
      }

      // 2. Calculer et enregistrer la commission (5%)
      const commission = booking.total_price * 0.05;
      console.log('💰 Commission calculée:', commission, 'FCFA');

      // 3. Créer les notifications in-app
      const notifications = [
        // Notification pour le propriétaire
        {
          user_id: booking.equipment?.owner_id,
          type: 'booking_confirmed',
          title: '✅ Réservation confirmée',
          message: `Vous avez confirmé la réservation de "${booking.equipment?.title}". Le locataire sera notifié.`,
          booking_id: booking.id
        },
        // Notification pour le locataire
        {
          user_id: booking.renter_id,
          type: 'booking_confirmed',
          title: '🎉 Réservation confirmée !',
          message: `Votre réservation pour "${booking.equipment?.title}" a été confirmée par le propriétaire.`,
          booking_id: booking.id
        }
      ];

      await supabase.from('notifications').insert(notifications);

      // 4. Envoyer les emails de confirmation
      try {
        const { error: emailError } = await supabase.functions.invoke('send-booking-confirmation-email', {
          body: {
            booking_id: booking.id,
            equipment_title: booking.equipment?.title,
            renter_email: booking.renter?.email,
            owner_email: booking.equipment?.owner?.email
          }
        });

        if (emailError) {
          console.error('⚠️ Erreur envoi email:', emailError);
        } else {
          console.log('✅ Emails de confirmation envoyés');
        }
      } catch (emailError) {
        console.error('⚠️ Erreur envoi email:', emailError);
      }

      toast({
        title: "🎉 Réservation confirmée !",
        description: "La réservation a été confirmée avec succès. Commission de 5% prélevée.",
        duration: 5000
      });

      onStatusChange();

    } catch (error: any) {
      console.error('❌ Erreur confirmation:', error);
      toast({
        title: "Erreur de confirmation",
        description: error.message || "Une erreur s'est produite lors de la confirmation.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setActionType(null);
    }
  };

  // ✅ Refuser la réservation avec REMBOURSEMENT KAKIAPAY
  const handleReject = async () => {
    setIsProcessing(true);
    setActionType('reject');

    try {
      console.log('🔴 Refus de la réservation:', booking.id);

      // 1. Mettre à jour le statut
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          owner_approval: false
        })
        .eq('id', booking.id);

      if (updateError) {
        throw updateError;
      }

      // 2. ✅ Déclencher le remboursement KakiaPay (si payé)
      if (booking.payment_status === 'paid') {
        console.log('💸 Déclenchement du remboursement KakiaPay...');
        
        try {
          const { data: refundData, error: refundError } = await supabase.functions.invoke('refund-kakiapay-payment', {
            body: {
              booking_id: booking.id,
              amount: booking.total_price,
              reason: 'Réservation refusée par le propriétaire'
            }
          });

          if (refundError) {
            console.error('❌ Erreur remboursement:', refundError);
            toast({
              title: "Réservation refusée",
              description: "Réservation refusée mais erreur lors du remboursement. Le support va traiter le remboursement manuellement.",
              variant: "destructive"
            });
          } else {
            console.log('✅ Remboursement KakiaPay initié');
            
            // Mettre à jour le statut de paiement
            await supabase
              .from('bookings')
              .update({ payment_status: 'refunded' })
              .eq('id', booking.id);
          }
        } catch (refundError) {
          console.error('❌ Erreur remboursement:', refundError);
        }
      }

      // 3. Créer les notifications
      const notifications = [
        {
          user_id: booking.equipment?.owner_id,
          type: 'booking_rejected_by_owner',
          title: '❌ Réservation refusée',
          message: `Vous avez refusé la réservation de "${booking.equipment?.title}".`,
          booking_id: booking.id
        },
        {
          user_id: booking.renter_id,
          type: 'booking_rejected',
          title: '😞 Réservation refusée',
          message: `Le propriétaire a refusé votre demande de réservation pour "${booking.equipment?.title}". ${booking.payment_status === 'paid' ? 'Le remboursement sera traité sous 3-5 jours ouvrables.' : ''}`,
          booking_id: booking.id
        }
      ];

      await supabase.from('notifications').insert(notifications);

      // 4. Envoyer email de refus au locataire
      try {
        await supabase.functions.invoke('send-booking-rejection-email', {
          body: {
            booking_id: booking.id,
            equipment_title: booking.equipment?.title,
            renter_email: booking.renter?.email,
            refund_amount: booking.total_price
          }
        });
      } catch (emailError) {
        console.error('⚠️ Erreur envoi email de refus:', emailError);
      }

      toast({
        title: "Réservation refusée",
        description: booking.payment_status === 'paid' 
          ? "Réservation refusée. Le locataire sera remboursé sous 3-5 jours."
          : "Réservation refusée avec succès.",
        duration: 5000
      });

      onStatusChange();

    } catch (error: any) {
      console.error('❌ Erreur refus:', error);
      toast({
        title: "Erreur de refus",
        description: error.message || "Une erreur s'est produite lors du refus.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setActionType(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Demande de réservation
          </CardTitle>
          <Badge variant={
            booking.status === 'pending' ? 'secondary' : 
            booking.status === 'confirmed' ? 'default' : 
            'destructive'
          }>
            {booking.status === 'pending' ? 'En attente' : 
             booking.status === 'confirmed' ? 'Confirmée' : 
             'Refusée'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informations du locataire */}
        <div className="flex items-start space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={booking.renter?.avatar_url} />
            <AvatarFallback>
              {booking.renter?.first_name?.[0]}{booking.renter?.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h4 className="font-medium">
              {booking.renter?.first_name} {booking.renter?.last_name}
            </h4>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <Mail className="h-3 w-3 mr-1" />
              {booking.renter?.email}
            </div>
            {booking.contact_phone && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-3 w-3 mr-1" />
                {booking.contact_phone}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Détails de la réservation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium text-sm text-gray-700 mb-1">Dates</h5>
            <p className="flex items-center text-sm">
              <Calendar className="h-3 w-3 mr-1" />
              {format(new Date(booking.start_date), 'dd MMM', { locale: fr })} - 
              {format(new Date(booking.end_date), 'dd MMM yyyy', { locale: fr })}
            </p>
          </div>

          <div>
            <h5 className="font-medium text-sm text-gray-700 mb-1">Prix total</h5>
            <p className="flex items-center text-sm font-semibold text-green-600">
              <DollarSign className="h-3 w-3 mr-1" />
              {booking.total_price?.toLocaleString()} FCFA
            </p>
          </div>

          <div>
            <h5 className="font-medium text-sm text-gray-700 mb-1">Statut paiement</h5>
            <p className="text-sm">
              <Badge variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}>
                {booking.payment_status === 'paid' ? '✅ Payé' : '⏳ En attente'}
              </Badge>
            </p>
          </div>

          <div>
            <h5 className="font-medium text-sm text-gray-700 mb-1">Méthode de paiement</h5>
            <p className="text-sm">
              {booking.payment_method === 'card' ? 'Carte bancaire' : 
               booking.payment_method === 'kakiapay' ? 'KakiaPay' : 
               'Mobile Money'}
            </p>
          </div>
        </div>

        {/* Méthode de livraison */}
        {booking.delivery_method && (
          <div>
            <h5 className="font-medium text-sm text-gray-700 mb-1">Livraison</h5>
            <p className="flex items-center text-sm">
              <MapPin className="h-3 w-3 mr-1" />
              {booking.delivery_method === 'pickup' ? 'Retrait sur place' : 'Livraison'}
              {booking.delivery_address && ` - ${booking.delivery_address}`}
            </p>
          </div>
        )}

        {/* Demandes spéciales */}
        {booking.special_requests && (
          <div>
            <h5 className="font-medium text-sm text-gray-700 mb-1">Demandes spéciales</h5>
            <p className="text-sm bg-gray-50 p-2 rounded">
              {booking.special_requests}
            </p>
          </div>
        )}

        {/* Actions - Seulement si en attente */}
        {booking.status === 'pending' && (
          <div className="flex space-x-3">
            <Button
              onClick={handleReject}
              variant="outline"
              disabled={isProcessing}
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            >
              {isProcessing && actionType === 'reject' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refus...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Refuser
                </>
              )}
            </Button>
            
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isProcessing && actionType === 'approve' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirmation...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirmer
                </>
              )}
            </Button>
          </div>
        )}

        {/* Statut confirmé/refusé */}
        {booking.status !== 'pending' && (
          <Alert className={booking.status === 'confirmed' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <div className="flex items-center">
              {booking.status === 'confirmed' ? (
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600 mr-2" />
              )}
              <AlertDescription className={booking.status === 'confirmed' ? 'text-green-700' : 'text-red-700'}>
                {booking.status === 'confirmed' ? 'Réservation confirmée' : 'Réservation refusée'}
                {booking.status === 'rejected' && booking.payment_status === 'refunded' && ' • Remboursement en cours'}
              </AlertDescription>
            </div>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}