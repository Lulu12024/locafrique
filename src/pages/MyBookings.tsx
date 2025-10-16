// REMPLACER COMPLÈTEMENT le fichier : /src/pages/MyBookings.tsx
// Version corrigée qui évite les jointures problématiques

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react'; 

import { 
  Calendar,
  Package,
  Users,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Settings,
  TrendingUp,
  CalendarDays,
  Filter,
  Loader2,
  Percent
} from 'lucide-react';
import { useAuth } from '@/hooks/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

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
  userType?: 'renter' | 'owner';
  
  // Relations optionnelles
  equipment?: {
    id: string;
    title: string;
    daily_price: number;
    location: string;
    owner_id: string;
  };
  renter?: {
    id: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
  };
  owner?: {
    id: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
  };
}

interface EquipmentData {
  id: string;
  title: string;
  category: string;
  daily_price: number;
  status: string;
  location: string;
  owner_id: string;
  created_at: string;
  images?: any[];
}

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [equipments, setEquipments] = useState<EquipmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadAllData();
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
          loadAllData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);
  
  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📊 Chargement des données de réservation...');
      
      await Promise.all([
        loadBookings(),
        loadEquipments()
      ]);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    if (!user?.id) return;

    try {
      console.log('📅 Chargement des réservations...');
      
      // ✅ ÉTAPE 1: Réservations où je suis locataire (SANS jointures)
      const { data: renterBookings, error: renterError } = await supabase
        .from('bookings')
        .select('*')
        .eq('renter_id', user.id)
        .order('created_at', { ascending: false });

      if (renterError) {
        console.error('❌ Erreur réservations locataire:', renterError);
        throw renterError;
      }

      // ✅ ÉTAPE 2: Récupérer mes équipements
      const { data: myEquipments, error: equipmentError } = await supabase
        .from('equipments')
        .select('*')
        .eq('owner_id', user.id);

      if (equipmentError) {
        console.error('❌ Erreur équipements:', equipmentError);
        throw equipmentError;
      }

      // ✅ ÉTAPE 3: Réservations pour mes équipements
      let ownerBookings: any[] = [];
      if (myEquipments && myEquipments.length > 0) {
        const equipmentIds = myEquipments.map(eq => eq.id);
        
        const { data: ownerBookingsData, error: ownerError } = await supabase
          .from('bookings')
          .select('*')
          .in('equipment_id', equipmentIds)
          .order('created_at', { ascending: false });

        if (ownerError) {
          console.error('❌ Erreur réservations propriétaire:', ownerError);
          throw ownerError;
        }

        ownerBookings = ownerBookingsData || [];
      }

      // ✅ ÉTAPE 4: Récupérer tous les équipements nécessaires
      const allEquipmentIds = [
        ...(renterBookings || []).map(b => b.equipment_id),
        ...(ownerBookings || []).map(b => b.equipment_id)
      ];
      const uniqueEquipmentIds = [...new Set(allEquipmentIds)];

      const { data: allEquipments, error: allEquipmentError } = await supabase
        .from('equipments')
        .select('id, title, daily_price, location, owner_id')
        .in('id', uniqueEquipmentIds);

      if (allEquipmentError) {
        console.error('❌ Erreur équipements:', allEquipmentError);
      }

      // ✅ ÉTAPE 5: Récupérer tous les profils nécessaires
      const allUserIds = [
        ...(renterBookings || []).map(b => b.renter_id),
        ...(ownerBookings || []).map(b => b.renter_id),
        ...(allEquipments || []).map(eq => eq.owner_id)
      ];
      const uniqueUserIds = [...new Set(allUserIds)].filter(id => id !== user.id);

      const { data: allProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, phone_number')
        .in('id', uniqueUserIds);

      if (profileError) {
        console.error('❌ Erreur profils:', profileError);
      }

      // ✅ ÉTAPE 6: Combiner toutes les données côté client
      const allBookings: BookingData[] = [];

      // Traiter les réservations en tant que locataire
      (renterBookings || []).forEach(booking => {
        const equipment = (allEquipments || []).find(eq => eq.id === booking.equipment_id);
        const owner = (allProfiles || []).find(p => p.id === equipment?.owner_id);

        allBookings.push({
          ...booking,
          userType: 'renter',
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
        });
      });

      // Traiter les réservations en tant que propriétaire
      (ownerBookings || []).forEach(booking => {
        const equipment = (allEquipments || []).find(eq => eq.id === booking.equipment_id);
        const renter = (allProfiles || []).find(p => p.id === booking.renter_id);

        allBookings.push({
          ...booking,
          userType: 'owner',
          equipment: equipment ? {
            id: equipment.id,
            title: equipment.title,
            daily_price: equipment.daily_price,
            location: equipment.location,
            owner_id: equipment.owner_id
          } : undefined,
          renter: renter ? {
            id: renter.id,
            first_name: renter.first_name,
            last_name: renter.last_name,
            phone_number: renter.phone_number
          } : undefined
        });
      });

      console.log('✅ Réservations chargées:', allBookings.length);
      setBookings(allBookings);

    } catch (error) {
      console.error('❌ Erreur lors du chargement des réservations:', error);
      throw error;
    }
  };

  const loadEquipments = async () => {
    if (!user?.id) return;

    try {
      console.log('🏗️ Chargement des équipements...');
      
      const { data, error } = await supabase
        .from('equipments')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur équipements:', error);
        throw error;
      }

      console.log('✅ Équipements chargés:', data?.length || 0);
      setEquipments(data || []);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des équipements:', error);
      throw error;
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
          <Button onClick={loadAllData} className="mt-4">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  const renterBookings = bookings.filter(b => b.userType === 'renter');
  const ownerBookings = bookings.filter(b => b.userType === 'owner');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Mes Réservations</h1>
        <Button
          onClick={loadAllData}
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
          <p className="text-gray-500 mt-2">Vous n'avez pas encore de réservations</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Réservations en tant que locataire */}
          {renterBookings.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <Users className="h-6 w-6 mr-2" />
                En tant que locataire ({renterBookings.length})
              </h2>
              <div className="grid gap-4">
                {renterBookings.map((booking) => (
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
            </section>
          )}

          {/* Réservations en tant que propriétaire */}
          {ownerBookings.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <Package className="h-6 w-6 mr-2" />
                En tant que propriétaire ({ownerBookings.length})
              </h2>
              <div className="grid gap-4">
                {ownerBookings.map((booking) => (
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
                            Locataire: {booking.renter ? `${booking.renter.first_name} ${booking.renter.last_name}` : 'Inconnu'}
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
            </section>
          )}
        </div>
      )}
    </div>
  );
}