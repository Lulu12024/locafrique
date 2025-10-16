// src/components/booking/BookingApprovalCard.tsx
// VERSION CORRIGÉE avec rechargement du statut

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Phone, 
  MapPin,
  Calendar as CalendarIcon,
  DollarSign,
  Mail,
  Loader2,
  CalendarRange
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
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'propose' | null>(null);
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [showConfirmApprovalModal, setShowConfirmApprovalModal] = useState(false); // ✅ NOUVEAU
  const [proposedStartDate, setProposedStartDate] = useState<Date | undefined>();
  const [proposedEndDate, setProposedEndDate] = useState<Date | undefined>();

  // ✅ ACCEPTER LA RÉSERVATION - Afficher d'abord le modal de confirmation
  const handleApproveClick = () => {
    setShowConfirmApprovalModal(true);
  };

  const handleApproveConfirmed = async () => {
    setShowConfirmApprovalModal(false);
    setIsProcessing(true);
    setActionType('approve');

    try {
      console.log('✅ Démarrage acceptation de la réservation:', booking.id);

      // 1. Mettre à jour le statut avec 'confirmed' (pas 'approved')
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',  // ✅ CORRECTION: 'confirmed' au lieu de 'approved'
          approved_at: new Date().toISOString(),
          owner_approval: true
        })
        .eq('id', booking.id);

      if (updateError) {
        console.error('❌ Erreur lors de l\'update:', updateError);
        throw updateError;
      }

      console.log('✅ Statut mis à jour avec succès');

      // 2. Créer notification pour le locataire
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: booking.renter_id,
          type: 'booking_confirmed',
          title: 'Réservation confirmée',
          message: `Votre demande pour "${booking.equipment?.title}" a été acceptée.`,
          booking_id: booking.id,
          read: false
        });

      if (notifError) {
        console.error('⚠️ Erreur notification:', notifError);
      }

      // 3. Envoyer email
      try {
        await supabase.functions.invoke('send-booking-accepted-email', {
          body: { booking_id: booking.id }
        });
        console.log('✅ Email envoyé');
      } catch (emailError) {
        console.error('⚠️ Erreur email:', emailError);
      }

      toast({
        title: "✅ Réservation acceptée",
        description: "Le locataire a été notifié.",
        duration: 5000
      });

      console.log('✅ Appel de onStatusChange()');
      // ✅ Recharger les données
      await onStatusChange();

    } catch (error: any) {
      console.error('❌ Erreur complète:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'accepter la réservation",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setActionType(null);
    }
  };

  // ❌ REFUSER LA RÉSERVATION
  const handleReject = async () => {
    setIsProcessing(true);
    setActionType('reject');

    try {
      console.log('❌ Démarrage refus de la réservation:', booking.id);

      // 1. Mettre à jour le statut (sans .select() pour éviter erreur RLS)
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          owner_approval: false
        })
        .eq('id', booking.id);

      if (updateError) {
        console.error('❌ Erreur lors de l\'update:', updateError);
        throw updateError;
      }

      console.log('✅ Statut mis à jour avec succès');

      // 2. Créer notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: booking.renter_id,
          type: 'booking_rejected',
          title: 'Réservation refusée',
          message: `Votre demande pour "${booking.equipment?.title}" a été refusée.`,
          booking_id: booking.id,
          read: false
        });

      if (notifError) {
        console.error('⚠️ Erreur notification:', notifError);
      }

      // 3. Envoyer email
      try {
        await supabase.functions.invoke('send-booking-rejected-email', {
          body: { booking_id: booking.id }
        });
        console.log('✅ Email envoyé');
      } catch (emailError) {
        console.error('⚠️ Erreur email:', emailError);
      }

      toast({
        title: "Réservation refusée",
        description: "Le locataire a été notifié.",
        duration: 5000
      });

      console.log('✅ Appel de onStatusChange()');
      // ✅ Recharger les données
      await onStatusChange();

    } catch (error: any) {
      console.error('❌ Erreur complète:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de refuser la réservation",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setActionType(null);
    }
  };

  // 📅 PROPOSER UNE AUTRE DATE
  const handleProposeDate = () => {
    setShowProposeModal(true);
  };

  const submitProposedDates = async () => {
    if (!proposedStartDate || !proposedEndDate) {
      toast({
        title: "Dates requises",
        description: "Veuillez sélectionner les deux dates",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setActionType('propose');

    try {
      // Créer notification
      await supabase
        .from('notifications')
        .insert({
          user_id: booking.renter_id,
          type: 'date_proposal',
          title: 'Proposition de nouvelles dates',
          message: `Le propriétaire propose du ${format(proposedStartDate, 'dd/MM/yyyy')} au ${format(proposedEndDate, 'dd/MM/yyyy')} pour "${booking.equipment?.title}".`,
          booking_id: booking.id,
          read: false
        });

      // Envoyer email
      try {
        await supabase.functions.invoke('send-date-proposal-email', {
          body: {
            booking_id: booking.id,
            proposed_start_date: proposedStartDate.toISOString(),
            proposed_end_date: proposedEndDate.toISOString()
          }
        });
      } catch (emailError) {
        console.error('⚠️ Erreur email:', emailError);
      }

      toast({
        title: "Proposition envoyée",
        description: "Le locataire a reçu votre proposition.",
        duration: 5000
      });

      setShowProposeModal(false);
      setProposedStartDate(undefined);
      setProposedEndDate(undefined);

    } catch (error: any) {
      console.error('❌ Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la proposition",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setActionType(null);
    }
  };

  // ✅ VÉRIFIER LE STATUT ACTUEL
  const isPending = booking.status === 'pending';
  const isConfirmed = booking.status === 'confirmed';  // ✅ 'confirmed' au lieu de 'approved'
  const isRejected = booking.status === 'rejected';

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {booking.equipment?.title || 'Équipement'}
            </CardTitle>
            <Badge variant={
              booking.status === 'pending' ? 'secondary' : 
              booking.status === 'confirmed' ? 'default' :   // ✅ Vérifier le statut réel
              booking.status === 'rejected' ? 'destructive' : 
              'secondary'
            }>
              {booking.status === 'pending' ? '⏳ En attente' : 
               booking.status === 'confirmed' ? '✅ Confirmée' :   // ✅ Vérifier le statut réel
               booking.status === 'rejected' ? '❌ Refusée' : 
               booking.status}
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
              <h4 className="font-semibold">
                {booking.renter?.first_name} {booking.renter?.last_name}
              </h4>
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <Mail className="h-3 w-3 mr-1" />
                {booking.renter?.email || 'Email non disponible'}
              </div>
              {booking.contact_phone && (
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <Phone className="h-3 w-3 mr-1" />
                  {booking.contact_phone}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Détails de la réservation */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-sm text-gray-700 mb-1">Dates</h5>
              <div className="flex items-center text-sm">
                <CalendarIcon className="h-3 w-3 mr-1" />
                <span>
                  {format(new Date(booking.start_date), 'dd MMM', { locale: fr })} - 
                  {format(new Date(booking.end_date), 'dd MMM yyyy', { locale: fr })}
                </span>
              </div>
            </div>

            <div>
              <h5 className="font-medium text-sm text-gray-700 mb-1">Prix total</h5>
              <p className="text-sm font-semibold text-green-600">
                {booking.total_price?.toLocaleString()} FCFA
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

          {/* ✅ ACTIONS : Affichage conditionnel selon le statut */}
          {isPending && (
            <div className="space-y-2">
              <Button
                onClick={handleApproveClick}  // ✅ Ouvre le modal de confirmation
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isProcessing && actionType === 'approve' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Acceptation en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accepter la demande
                  </>
                )}
              </Button>

              <Button
                onClick={handleProposeDate}
                disabled={isProcessing}
                variant="outline"
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <CalendarRange className="mr-2 h-4 w-4" />
                Proposer une autre date
              </Button>

              <Button
                onClick={handleReject}
                disabled={isProcessing}
                variant="outline"
                className="w-full border-red-300 text-red-700 hover:bg-red-50"
              >
                {isProcessing && actionType === 'reject' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refus en cours...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Refuser
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Statut confirmé */}
          {isConfirmed && (
            <Alert className="border-green-200 bg-green-50">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <AlertDescription className="text-green-700">
                  ✅ Réservation confirmée - En cours
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Statut refusé */}
          {isRejected && (
            <Alert className="border-red-200 bg-red-50">
              <div className="flex items-center">
                <XCircle className="h-4 w-4 text-red-600 mr-2" />
                <AlertDescription className="text-red-700">
                  ❌ Réservation refusée
                </AlertDescription>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* ✅ MODAL DE CONFIRMATION AVANT APPROBATION */}
      <Dialog open={showConfirmApprovalModal} onOpenChange={setShowConfirmApprovalModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertDescription className="text-orange-600">⚠️</AlertDescription>
              <span>Confirmer l'acceptation</span>
            </DialogTitle>
          </DialogHeader>
          
          <Alert className="border-orange-200 bg-orange-50">
            <AlertDescription className="text-orange-900 space-y-3">
              <p className="font-semibold">
                La plateforme ne gère aucun paiement.
              </p>
              <p>
                Avant de remettre le bien, vérifiez toujours l'identité du locataire et assurez-vous que les conditions de location ont été clairement convenues.
              </p>
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium text-gray-700">Récapitulatif de la réservation :</p>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Locataire : <span className="font-medium">{booking.renter?.first_name} {booking.renter?.last_name}</span></p>
              <p>• Équipement : <span className="font-medium">{booking.equipment?.title}</span></p>
              <p>• Période : <span className="font-medium">
                {format(new Date(booking.start_date), 'dd/MM/yyyy')} - {format(new Date(booking.end_date), 'dd/MM/yyyy')}
              </span></p>
              <p>• Prix : <span className="font-medium text-green-600">{booking.total_price?.toLocaleString()} FCFA</span></p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmApprovalModal(false)}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              onClick={handleApproveConfirmed}
              disabled={isProcessing}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirmation...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Oui, j'ai compris et j'accepte
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal pour proposer une autre date */}
      <Dialog open={showProposeModal} onOpenChange={setShowProposeModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Proposer de nouvelles dates</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Date de début proposée</Label>
              <Calendar
                mode="single"
                selected={proposedStartDate}
                onSelect={setProposedStartDate}
                className="rounded-md border mt-2"
                disabled={(date) => date < new Date()}
              />
            </div>

            <div>
              <Label>Date de fin proposée</Label>
              <Calendar
                mode="single"
                selected={proposedEndDate}
                onSelect={setProposedEndDate}
                className="rounded-md border mt-2"
                disabled={(date) => !proposedStartDate || date <= proposedStartDate}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowProposeModal(false)}
              disabled={isProcessing}
            >
              Annuler
            </Button>
            <Button
              onClick={submitProposedDates}
              disabled={isProcessing || !proposedStartDate || !proposedEndDate}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                'Envoyer la proposition'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}