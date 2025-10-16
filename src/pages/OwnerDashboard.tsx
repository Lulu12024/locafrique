// src/pages/OwnerDashboard.tsx - CORRIGÉ

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/auth';
import { BookingApprovalCard } from '@/components/booking/BookingApprovalCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Clock, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Calendar,
  Euro,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function OwnerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState({
    pending: [],
    approved: [],
    rejected: [],
    all: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingCount: 0,
    approvedCount: 0,
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

      // ✅ REQUÊTE CORRIGÉE - Méthode 1: Filtrer sur la table equipment
      const { data: userEquipments, error: equipError } = await supabase
        .from('equipments')
        .select('id')
        .eq('owner_id', user.id);

      if (equipError) throw equipError;

      const equipmentIds = userEquipments?.map(e => e.id) || [];
      
      if (equipmentIds.length === 0) {
        console.log('⚠️ Aucun équipement trouvé pour cet utilisateur');
        setBookings({ pending: [], approved: [], rejected: [], all: [] });
        setStats({ totalRevenue: 0, pendingCount: 0, approvedCount: 0, rejectedCount: 0 });
        return;
      }

      console.log('🔍 IDs des équipements:', equipmentIds);

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
            avatar_url
          )
        `)
        .in('equipment_id', equipmentIds)  // ✅ CORRECTION: Filtrer sur equipment_id
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur lors du chargement:', error);
        throw error;
      }

      console.log('✅ Réservations chargées:', data?.length || 0);
      console.log('📊 Statuts:', data?.map(b => b.status));

      const allBookings = data || [];
      
      setBookings({
        pending: allBookings.filter(b => b.status === 'pending'),
        approved: allBookings.filter(b => b.status === 'confirmed'),  // ✅ 'confirmed'
        rejected: allBookings.filter(b => b.status === 'rejected'),
        all: allBookings
      });

      // Calculer les statistiques
      const newStats = {
        totalRevenue: allBookings
          .filter(b => b.status === 'confirmed')  // ✅ 'confirmed'
          .reduce((sum, b) => sum + (b.total_price || 0), 0),
        pendingCount: allBookings.filter(b => b.status === 'pending').length,
        approvedCount: allBookings.filter(b => b.status === 'confirmed').length,  // ✅ 'confirmed'
        rejectedCount: allBookings.filter(b => b.status === 'rejected').length
      };

      console.log('📈 Statistiques:', newStats);
      setStats(newStats);

    } catch (error) {
      console.error('❌ Erreur chargement réservations:', error);
    } finally {
      setIsLoading(false);
    }
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-sm text-gray-500">Approuvées</p>
                <p className="text-2xl font-bold text-green-600">{stats.approvedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Refusées</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejectedCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Revenus totaux</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalRevenue.toLocaleString()} FCFA
                </p>
              </div>
              <Euro className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets des réservations */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>En attente</span>
            {stats.pendingCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Approuvées</span>
            {stats.approvedCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.approvedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center space-x-2">
            <XCircle className="h-4 w-4" />
            <span>Refusées</span>
            {stats.rejectedCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.rejectedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">Toutes ({bookings.all.length})</TabsTrigger>
        </TabsList>

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

        <TabsContent value="approved" className="space-y-4 mt-4">
          {bookings.approved.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune réservation approuvée</p>
              </CardContent>
            </Card>
          ) : (
            bookings.approved.map((booking) => (
              <BookingApprovalCard
                key={booking.id}
                booking={booking}
                onStatusChange={loadOwnerBookings}
              />
            ))
          )}
        </TabsContent>

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
              <BookingApprovalCard
                key={booking.id}
                booking={booking}
                onStatusChange={loadOwnerBookings}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-4">
          {bookings.all.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune réservation</p>
              </CardContent>
            </Card>
          ) : (
            bookings.all.map((booking) => (
              <BookingApprovalCard
                key={booking.id}
                booking={booking}
                onStatusChange={loadOwnerBookings}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}