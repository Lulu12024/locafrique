// src/pages/OwnerDashboard.tsx - VERSION AVEC VALIDATION DE DATE

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/auth';
import { BookingApprovalCard } from '@/components/booking/BookingApprovalCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';  // ✅ AJOUT
import { 
  Bell, 
  Clock, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Calendar,
  Euro,
  Loader2,
  PlayCircle,
  CheckCircle2,
  Package,
  User,
  MapPin,
  AlertCircle  // ✅ AJOUT
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { startOfDay } from 'date-fns';  // ✅ AJOUT

interface BookingWithDetails {
  id: string;
  equipment_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  created_at: string;
  rental_started_at?: string;
  completed_at?: string;
  equipment?: {
    id: string;
    title: string;
    owner_id: string;
  };
  renter?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    phone_number?: string;
  };
}

export function OwnerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState({
    pending: [] as BookingWithDetails[],
    confirmed: [] as BookingWithDetails[],
    ongoing: [] as BookingWithDetails[],
    completed: [] as BookingWithDetails[],
    rejected: [] as BookingWithDetails[],
    all: [] as BookingWithDetails[]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [actionType, setActionType] = useState<'start' | 'complete' | null>(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingCount: 0,
    confirmedCount: 0,
    ongoingCount: 0,
    completedCount: 0,
    rejectedCount: 0
  });

  useEffect(() => {
    if (user) {
      loadOwnerBookings();
    }
  }, [user]);

  const loadOwnerBookings = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      console.log('🔄 Chargement des réservations pour:', user.id);

      // Récupérer les équipements du propriétaire
      const { data: userEquipments, error: equipError } = await supabase
        .from('equipments')
        .select('id')
        .eq('owner_id', user.id);

      if (equipError) throw equipError;

      const equipmentIds = userEquipments?.map(e => e.id) || [];
      
      if (equipmentIds.length === 0) {
        console.log('⚠️ Aucun équipement trouvé pour cet utilisateur');
        setBookings({ 
          pending: [], 
          confirmed: [], 
          ongoing: [],
          completed: [],
          rejected: [], 
          all: [] 
        });
        setStats({ 
          totalRevenue: 0, 
          pendingCount: 0, 
          confirmedCount: 0,
          ongoingCount: 0,
          completedCount: 0,
          rejectedCount: 0 
        });
        return;
      }

      console.log('🔍 IDs des équipements:', equipmentIds);

      // Récupérer les réservations
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          equipment:equipments!inner(
            id,
            title,
            owner_id
          ),
          renter:profiles!bookings_renter_id_fkey(
            id,
            first_name,
            last_name,
            avatar_url,
            phone_number
          )
        `)
        .in('equipment_id', equipmentIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur lors du chargement:', error);
        throw error;
      }

      console.log('✅ Réservations chargées:', data?.length || 0);

      const allBookings = data || [];
      
      setBookings({
        pending: allBookings.filter(b => b.status === 'pending'),
        confirmed: allBookings.filter(b => b.status === 'confirmed'),
        ongoing: allBookings.filter(b => b.status === 'ongoing'),
        completed: allBookings.filter(b => b.status === 'completed'),
        rejected: allBookings.filter(b => b.status === 'rejected'),
        all: allBookings
      });

      // Calculer les statistiques
      const newStats = {
        totalRevenue: allBookings
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (b.total_price || 0), 0),
        pendingCount: allBookings.filter(b => b.status === 'pending').length,
        confirmedCount: allBookings.filter(b => b.status === 'confirmed').length,
        ongoingCount: allBookings.filter(b => b.status === 'ongoing').length,
        completedCount: allBookings.filter(b => b.status === 'completed').length,
        rejectedCount: allBookings.filter(b => b.status === 'rejected').length
      };

      console.log('📈 Statistiques:', newStats);
      setStats(newStats);

    } catch (error) {
      console.error('❌ Erreur chargement réservations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les réservations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ NOUVELLE FONCTION : Vérifier si la date de début est atteinte
  const canStartRental = (booking: BookingWithDetails): boolean => {
    const today = startOfDay(new Date());
    const startDate = startOfDay(new Date(booking.start_date));
    return today >= startDate;
  };

  // ✅ NOUVELLE FONCTION : Calculer les jours avant le début
  const getDaysUntilStart = (booking: BookingWithDetails): number => {
    const today = startOfDay(new Date());
    const startDate = startOfDay(new Date(booking.start_date));
    const diffTime = startDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Fonction pour démarrer la location
  const handleStartRental = async () => {
    if (!selectedBooking) return;

    // ✅ AJOUT : Vérifier la date avant de démarrer
    if (!canStartRental(selectedBooking)) {
      toast({
        title: "Trop tôt",
        description: "La date de début de la location n'est pas encore atteinte.",
        variant: "destructive"
      });
      setActionType(null);
      return;
    }
    
    setIsProcessing(true);
    try {
      console.log('🚀 Démarrage de la location:', selectedBooking.id);

      // Mettre à jour le statut
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'ongoing',
          rental_started_at: new Date().toISOString()
        })
        .eq('id', selectedBooking.id);

      if (updateError) throw updateError;

      // Créer notification pour le locataire
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedBooking.renter_id,
          type: 'rental_started',
          title: 'Location démarrée',
          message: `Votre location de "${selectedBooking.equipment?.title}" a démarré.`,
          booking_id: selectedBooking.id,
          read: false
        });

      // Envoyer email
      try {
        await supabase.functions.invoke('send-rental-started-email', {
          body: { booking_id: selectedBooking.id }
        });
      } catch (emailError) {
        console.error('⚠️ Erreur email:', emailError);
      }

      toast({
        title: "✅ Location démarrée",
        description: "Le locataire a été notifié par email.",
        duration: 5000
      });

      setSelectedBooking(null);
      setActionType(null);
      loadOwnerBookings();
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de démarrer la location",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Fonction pour terminer la location
  const handleCompleteRental = async () => {
    if (!selectedBooking) return;
    
    setIsProcessing(true);
    try {
      console.log('🏁 Fin de la location:', selectedBooking.id);

      // Mettre à jour le statut
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', selectedBooking.id);

      if (updateError) throw updateError;

      // Créer notification pour demander l'évaluation
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedBooking.renter_id,
          type: 'rental_completed',
          title: 'Location terminée',
          message: `Merci d'avoir loué "${selectedBooking.equipment?.title}". N'oubliez pas de laisser votre avis !`,
          booking_id: selectedBooking.id,
          read: false
        });

      // Envoyer email
      try {
        await supabase.functions.invoke('send-rental-completed-email', {
          body: { booking_id: selectedBooking.id }
        });
      } catch (emailError) {
        console.error('⚠️ Erreur email:', emailError);
      }

      toast({
        title: "✅ Location terminée",
        description: "Le locataire a été notifié et peut laisser un avis.",
        duration: 5000
      });

      setSelectedBooking(null);
      setActionType(null);
      loadOwnerBookings();
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de terminer la location",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Formater les dates
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // ✅ MODIFIÉ : Composant de carte avec validation de date
  const BookingCardWithActions: React.FC<{ booking: BookingWithDetails }> = ({ booking }) => {
    const canStart = booking.status === 'confirmed';
    const canComplete = booking.status === 'ongoing';
    const showActions = canStart || canComplete;
    
    // ✅ AJOUT : Vérifier si on peut démarrer (date atteinte)
    const dateReached = canStartRental(booking);
    const daysUntilStart = getDaysUntilStart(booking);

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-semibold text-lg mb-2">
                {booking.equipment?.title || 'Équipement'}
              </h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>
                    {booking.renter?.first_name} {booking.renter?.last_name}
                    {booking.renter?.phone_number && ` - ${booking.renter.phone_number}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Du {formatDate(booking.start_date)} au {formatDate(booking.end_date)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span className="font-semibold text-green-600">
                    {booking.total_price.toLocaleString()} FCFA
                  </span>
                </div>
              </div>
            </div>
            <Badge 
              className={
                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                booking.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                booking.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }
            >
              {booking.status === 'pending' ? 'En attente' :
               booking.status === 'confirmed' ? 'Confirmée' :
               booking.status === 'ongoing' ? 'En cours' :
               booking.status === 'completed' ? 'Terminée' :
               'Refusée'}
            </Badge>
          </div>

          {/* ✅ AJOUT : Alerte si la date n'est pas atteinte */}
          {canStart && !dateReached && (
            <Alert className="mb-3 border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-sm text-orange-900">
                <p className="font-medium">📅 La location commence dans {daysUntilStart} jour{daysUntilStart > 1 ? 's' : ''}</p>
                <p className="text-xs mt-1">Le bouton sera disponible le {formatDate(booking.start_date)}.</p>
              </AlertDescription>
            </Alert>
          )}

          {showActions && (
            <div className="flex gap-2 mt-3 pt-3 border-t">
              {canStart && (
                <Button
                  onClick={() => {
                    setSelectedBooking(booking);
                    setActionType('start');
                  }}
                  disabled={isProcessing || !dateReached}  // ✅ MODIFIÉ : Désactiver si date pas atteinte
                  className={`flex-1 ${
                    dateReached 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  size="sm"
                >
                  {!dateReached ? (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Disponible le {new Date(booking.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Démarrer la location
                    </>
                  )}
                </Button>
              )}

              {canComplete && (
                <Button
                  onClick={() => {
                    setSelectedBooking(booking);
                    setActionType('complete');
                  }}
                  disabled={isProcessing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marquer terminée
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tableau de bord propriétaire</h1>
        <Button onClick={loadOwnerBookings} variant="outline" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Actualisation...
            </>
          ) : (
            'Actualiser'
          )}
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">En attente</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Confirmées</p>
                <p className="text-2xl font-bold text-blue-600">{stats.confirmedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">En cours</p>
                <p className="text-2xl font-bold text-green-600">{stats.ongoingCount}</p>
              </div>
              <PlayCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Terminées</p>
                <p className="text-2xl font-bold text-gray-600">{stats.completedCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Revenus totaux</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.totalRevenue.toLocaleString()} F
                </p>
              </div>
              <Euro className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets des réservations */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pending">
            En attente ({stats.pendingCount})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Confirmées ({stats.confirmedCount})
          </TabsTrigger>
          <TabsTrigger value="ongoing">
            En cours ({stats.ongoingCount})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Terminées ({stats.completedCount})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Refusées ({stats.rejectedCount})
          </TabsTrigger>
        </TabsList>

        {/* Onglet En attente */}
        <TabsContent value="pending" className="space-y-4 mt-4">
          {bookings.pending.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune réservation en attente</p>
              </CardContent>
            </Card>
          ) : (
            bookings.pending.map((booking) => (
              <BookingApprovalCard
                key={booking.id}
                booking={booking}
                onStatusChange={loadOwnerBookings}
              />
            ))
          )}
        </TabsContent>

        {/* Onglet Confirmées */}
        <TabsContent value="confirmed" className="space-y-4 mt-4">
          {bookings.confirmed.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune réservation confirmée</p>
              </CardContent>
            </Card>
          ) : (
            bookings.confirmed.map((booking) => (
              <BookingCardWithActions key={booking.id} booking={booking} />
            ))
          )}
        </TabsContent>

        {/* Onglet En cours */}
        <TabsContent value="ongoing" className="space-y-4 mt-4">
          {bookings.ongoing.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <PlayCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune location en cours</p>
              </CardContent>
            </Card>
          ) : (
            bookings.ongoing.map((booking) => (
              <BookingCardWithActions key={booking.id} booking={booking} />
            ))
          )}
        </TabsContent>

        {/* Onglet Terminées */}
        <TabsContent value="completed" className="space-y-4 mt-4">
          {bookings.completed.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune location terminée</p>
              </CardContent>
            </Card>
          ) : (
            bookings.completed.map((booking) => (
              <BookingCardWithActions key={booking.id} booking={booking} />
            ))
          )}
        </TabsContent>

        {/* Onglet Refusées */}
        <TabsContent value="rejected" className="space-y-4 mt-4">
          {bookings.rejected.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune réservation refusée</p>
              </CardContent>
            </Card>
          ) : (
            bookings.rejected.map((booking) => (
              <BookingCardWithActions key={booking.id} booking={booking} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de confirmation pour démarrer */}
      <AlertDialog 
        open={actionType === 'start'} 
        onOpenChange={(open) => !open && setActionType(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Démarrer la location</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmez-vous que le matériel a été remis au locataire et que la location démarre maintenant ?
              <br /><br />
              Le statut passera à "En cours" et le locataire sera notifié par email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStartRental}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? 'Traitement...' : 'Confirmer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmation pour terminer */}
      <AlertDialog 
        open={actionType === 'complete'} 
        onOpenChange={(open) => !open && setActionType(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminer la location</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmez-vous que le matériel a été restitué et que la location est terminée ?
              <br /><br />
              Le locataire recevra une notification pour laisser une évaluation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCompleteRental}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? 'Traitement...' : 'Confirmer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
