// REMPLACER COMPLÈTEMENT le fichier : /src/pages/MyBookings.tsx
// Version simplifiée - Uniquement les réservations en tant que locataire

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Loader2 } from 'lucide-react'; 
import { Calendar, Package, Users, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/auth';
import { supabase } from '@/integrations/supabase/client';

// Types locaux pour ce composant
interface BookingData {
  id: string;
  equipment_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  commission_amount?: number;
  platform_fee?: number;
  status: string;
  contact_phone?: string;
  delivery_method?: 'pickup' | 'delivery';
  delivery_address?: string;
  special_requests?: string;
  automatic_validation?: boolean;
  created_at: string;
  updated_at?: string;
  
  // Relations optionnelles
  equipment?: {
    id: string;
    title: string;
    daily_price: number;
    location: string;
    owner_id: string;
  };
  owner?: {
    id: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
  };
}

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadBookings();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    // ✅ Écouter les changements en temps réel sur les réservations
    const subscription = supabase
      .channel('booking-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Écouter tous les événements (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'bookings',
          filter: `renter_id=eq.${user.id}` // Uniquement mes réservations
        },
        (payload) => {
          console.log('🔔 Changement détecté sur une réservation:', payload);
          // Recharger toutes les données
          loadBookings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);
  
  const loadBookings = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      console.log('📅 Chargement des réservations en tant que locataire...');
      
      // ✅ ÉTAPE 1: Récupérer mes réservations (SANS jointures)
      const { data: myBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('renter_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('❌ Erreur réservations:', bookingsError);
        throw bookingsError;
      }

      if (!myBookings || myBookings.length === 0) {
        console.log('ℹ️ Aucune réservation trouvée');
        setBookings([]);
        return;
      }

      // ✅ ÉTAPE 2: Récupérer les équipements associés
      const equipmentIds = myBookings.map(b => b.equipment_id);
      const uniqueEquipmentIds = [...new Set(equipmentIds)];

      const { data: equipments, error: equipmentError } = await supabase
        .from('equipments')
        .select('id, title, daily_price, location, owner_id')
        .in('id', uniqueEquipmentIds);

      if (equipmentError) {
        console.error('❌ Erreur équipements:', equipmentError);
      }

      // ✅ ÉTAPE 3: Récupérer les profils des propriétaires
      const ownerIds = [...new Set((equipments || []).map(eq => eq.owner_id))];

      const { data: owners, error: ownersError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, phone_number')
        .in('id', ownerIds);

      if (ownersError) {
        console.error('❌ Erreur profils propriétaires:', ownersError);
      }

      // ✅ ÉTAPE 4: Combiner toutes les données côté client
      const enrichedBookings: BookingData[] = myBookings.map(booking => {
        const equipment = (equipments || []).find(eq => eq.id === booking.equipment_id);
        const owner = (owners || []).find(p => p.id === equipment?.owner_id);

        return {
          ...booking,
          equipment: equipment ? {
            id: equipment.id,
            title: equipment.title,
            daily_price: equipment.daily_price,
            location: equipment.location,
            owner_id: equipment.owner_id
          } : undefined,
          owner: owner ? {
            id: owner.id,
            first_name: owner.first_name,
            last_name: owner.last_name,
            phone_number: owner.phone_number
          } : undefined
        };
      });

      console.log('✅ Réservations chargées:', enrichedBookings.length);
      setBookings(enrichedBookings);

    } catch (error) {
      console.error('❌ Erreur lors du chargement des réservations:', error);
      setError('Impossible de charger les réservations');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      en_attente: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      confirmée: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      annulée: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      terminée: 'bg-blue-100 text-blue-800',
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: 'En attente',
      en_attente: 'En attente',
      confirmed: 'Confirmée',
      confirmée: 'Confirmée',
      cancelled: 'Annulée',
      annulée: 'Annulée',
      completed: 'Terminée',
      terminée: 'Terminée',
    };
    return texts[status.toLowerCase()] || status;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement de vos réservations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Erreur</h2>
          <p className="text-gray-600">{error}</p>
          <Button onClick={loadBookings} className="mt-4">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Mes Réservations</h1>
        <Button
          onClick={loadBookings}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Chargement...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </>
          )}
        </Button>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">Aucune réservation</h2>
          <p className="text-gray-500 mt-2">Vous n'avez pas encore effectué de réservations</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <Users className="h-6 w-6 mr-2" />
            Mes locations ({bookings.length})
          </h2>
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="w-full">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      {booking.equipment?.title || 'Équipement inconnu'}
                    </CardTitle>
                    <Badge className={getStatusColor(booking.status)}>
                      {getStatusText(booking.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {booking.equipment?.location || 'Location inconnue'}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        Propriétaire: {booking.owner ? `${booking.owner.first_name} ${booking.owner.last_name}` : 'Inconnu'}
                      </div>
                    </div>
                    <div className="flex flex-col justify-between">
                      <div className="text-lg font-semibold">
                        {formatPrice(booking.total_price)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}