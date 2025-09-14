// src/components/booking/BookingApprovalCard.tsx

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
  Euro,
  FileText,
  Mail,
  Download,
  Eye,
  AlertTriangle,
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

  // Approuver la réservation
  const handleApprove = async () => {
    setIsProcessing(true);
    setActionType('approve');

    try {
      console.log('🟢 Approbation de la réservation:', booking.id);

      // 1. Mettre à jour le statut de la réservation
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          owner_approval: true
        })
        .eq('id', booking.id);

      if (updateError) {
        throw updateError;
      }

      // 2. Traitement du paiement si nécessaire
      if (booking.payment_method === 'card' && booking.payment_status === 'pending') {
        // Rediriger vers le paiement Stripe/KakiaPay
        const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
          body: {
            bookingId: booking.id,
            amount: booking.total_price,
            depositAmount: booking.deposit_amount,
            description: `Location ${booking.equipment?.title} - Approuvée`
          }
        });

        if (paymentError) {
          console.error('Erreur création paiement:', paymentError);
          toast({
            title: "Réservation approuvée",
            description: "Réservation approuvée mais erreur de paiement. Le locataire sera contacté.",
            variant: "destructive"
          });
        } else if (paymentData?.url) {
          // Envoyer le lien de paiement au locataire par notification
          await supabase.from('notifications').insert({
            user_id: booking.renter_id,
            type: 'payment_required',
            title: '💳 Paiement requis',
            message: `Votre réservation pour "${booking.equipment?.title}" a été approuvée ! Cliquez pour procéder au paiement.`,
            booking_id: booking.id,
            action_url: paymentData.url
          });
        }
      }

      // 3. Générer automatiquement le contrat
      console.log('📄 Génération automatique du contrat...');
      
      const { data: contractData, error: contractError } = await supabase.functions.invoke('generate-contract', {
        body: { booking_id: booking.id }
      });

      let contractUrl = null;
      if (contractError) {
        console.error('❌ Erreur génération contrat:', contractError);
        toast({
          title: "Contrat non généré",
          description: "Réservation approuvée mais le contrat n'a pas pu être généré automatiquement.",
          variant: "destructive"
        });
      } else if (contractData?.pdf) {
        contractUrl = contractData.pdf;
        
        // Mettre à jour la réservation avec l'URL du contrat
        await supabase
          .from('bookings')
          .update({ contract_pdf_url: contractUrl })
          .eq('id', booking.id);

        console.log('✅ Contrat généré avec succès');
      }

      // 4. Envoyer le contrat par email automatiquement
      if (contractUrl) {
        console.log('📧 Envoi automatique du contrat par email...');
        
        const { error: emailError } = await supabase.functions.invoke('send-contract-email', {
          body: {
            booking_id: booking.id,
            contract_url: contractUrl,
            renter_email: booking.renter?.email,
            owner_email: booking.equipment?.owner?.email,
            equipment_title: booking.equipment?.title
          }
        });

        if (emailError) {
          console.error('❌ Erreur envoi email:', emailError);
          toast({
            title: "Email non envoyé",
            description: "Contrat généré mais l'envoi automatique par email a échoué.",
            variant: "destructive"
          });
        } else {
          console.log('✅ Emails envoyés avec succès');
        }
      }

      // 5. Créer les notifications
      const notifications = [
        // Notification pour le propriétaire
        {
          user_id: booking.equipment?.owner_id,
          type: 'booking_approved_by_owner',
          title: '✅ Réservation approuvée',
          message: `Vous avez approuvé la réservation de "${booking.equipment?.title}". ${contractUrl ? 'Contrat envoyé par email.' : 'Le contrat sera généré prochainement.'}`,
          booking_id: booking.id
        },
        // Notification pour le locataire
        {
          user_id: booking.renter_id,
          type: 'booking_approved',
          title: '🎉 Réservation approuvée !',
          message: `Votre réservation pour "${booking.equipment?.title}" a été approuvée par le propriétaire. ${contractUrl ? 'Contrat PDF envoyé par email.' : 'Vous recevrez le contrat prochainement.'}`,
          booking_id: booking.id
        }
      ];

      await supabase.from('notifications').insert(notifications);

      toast({
        title: "🎉 Réservation approuvée !",
        description: contractUrl 
          ? "Contrat généré et envoyé automatiquement par email aux deux parties."
          : "Réservation approuvée avec succès.",
        duration: 5000
      });

      onStatusChange();

    } catch (error: any) {
      console.error('❌ Erreur approbation:', error);
      toast({
        title: "Erreur d'approbation",
        description: error.message || "Une erreur s'est produite lors de l'approbation.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setActionType(null);
    }
  };

  // Refuser la réservation
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

      // 2. Rembourser le portefeuille si paiement par wallet
      if (booking.payment_method === 'wallet' && booking.payment_status === 'paid') {
        console.log('💰 Remboursement du portefeuille...');
        
        const { data: walletData } = await supabase
          .from('wallets')
          .select('id')
          .eq('user_id', booking.renter_id)
          .single();

        if (walletData) {
          const { error: refundError } = await supabase.rpc('create_wallet_transaction', {
            p_wallet_id: walletData.id,
            p_amount: booking.total_price,
            p_transaction_type: 'refund',
            p_description: `Remboursement - Réservation refusée: ${booking.equipment?.title}`,
            p_reference_id: booking.id
          });

          if (refundError) {
            console.error('❌ Erreur remboursement:', refundError);
          } else {
            console.log('✅ Remboursement effectué');
          }
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
          message: `Le propriétaire a refusé votre demande de réservation pour "${booking.equipment?.title}". ${booking.payment_method === 'wallet' ? 'Montant remboursé sur votre portefeuille.' : ''}`,
          booking_id: booking.id
        }
      ];

      await supabase.from('notifications').insert(notifications);

      toast({
        title: "Réservation refusée",
        description: booking.payment_method === 'wallet' 
          ? "Réservation refusée et montant remboursé au locataire."
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
          <Badge variant={booking.status === 'pending' ? 'secondary' : 'default'}>
            {booking.status === 'pending' ? 'En attente' : booking.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Informations du locataire */}
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={booking.renter?.avatar_url} />
            <AvatarFallback>
              {booking.renter?.first_name?.[0]}{booking.renter?.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h4 className="font-medium">
              {booking.renter?.first_name} {booking.renter?.last_name}
            </h4>
            <p className="text-sm text-gray-500">{booking.renter?.email}</p>
            {booking.contact_phone && (
              <p className="text-sm text-gray-500 flex items-center">
                <Phone className="h-3 w-3 mr-1" />
                {booking.contact_phone}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Détails de la réservation */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium text-sm text-gray-700 mb-2">Période</h5>
            <div className="space-y-1">
              <p className="flex items-center text-sm">
                <Calendar className="h-3 w-3 mr-1" />
                {format(new Date(booking.start_date), 'dd MMM yyyy', { locale: fr })}
              </p>
              <p className="flex items-center text-sm">
                <Calendar className="h-3 w-3 mr-1" />
                {format(new Date(booking.end_date), 'dd MMM yyyy', { locale: fr })}
              </p>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-sm text-gray-700 mb-2">Montant</h5>
            <div className="space-y-1">
              <p className="flex items-center text-sm font-medium">
                <Euro className="h-3 w-3 mr-1" />
                {booking.total_price?.toLocaleString()} FCFA
              </p>
              <p className="text-xs text-gray-500">
                Paiement: {booking.payment_method === 'wallet' ? 'Portefeuille' : 'Carte bancaire'}
              </p>
            </div>
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

        {/* Actions */}
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
                  Approbation...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approuver
                </>
              )}
            </Button>
          </div>
        )}

        {/* Statut approuvé/refusé */}
        {booking.status !== 'pending' && (
          <Alert className={booking.status === 'approved' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <div className="flex items-center">
              {booking.status === 'approved' ? (
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600 mr-2" />
              )}
              <AlertDescription className={booking.status === 'approved' ? 'text-green-700' : 'text-red-700'}>
                {booking.status === 'approved' ? 'Réservation approuvée' : 'Réservation refusée'}
                {booking.contract_pdf_url && ' • Contrat généré et envoyé par email'}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Contrat disponible */}
        {booking.contract_pdf_url && (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <FileText className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm text-blue-700 font-medium">Contrat généré</span>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline">
                <Eye className="h-3 w-3 mr-1" />
                Voir
              </Button>
              <Button size="sm" variant="outline">
                <Download className="h-3 w-3 mr-1" />
                Télécharger
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}