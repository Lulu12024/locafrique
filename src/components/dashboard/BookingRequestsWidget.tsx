
// src/components/dashboard/BookingRequestsWidget.tsx - Widget pour les demandes de réservation

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Bell, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/hooks/auth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function BookingRequestsWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPendingBookings();
    }
  }, [user]);

  const loadPendingBookings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          start_date,
          end_date,
          total_price,
          created_at,
          payment_method,
          equipment:equipments!inner(
            id,
            title,
            owner_id
          ),
          renter:profiles!bookings_renter_id_fkey(
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('status', 'pending')
        .eq('equipment.owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      setPendingBookings(data || []);
    } catch (error) {
      console.error('Erreur chargement demandes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Demandes en attente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-24">
            <Clock className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingBookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Demandes en attente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-gray-600">Aucune demande en attente</p>
            <p className="text-sm text-gray-500">Toutes vos demandes sont traitées !</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Demandes en attente
            <Badge variant="destructive" className="ml-2">
              {pendingBookings.length}
            </Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/owner-dashboard')}
          >
            <Eye className="mr-1 h-3 w-3" />
            Tout voir
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {pendingBookings.map((booking) => (
          <div
            key={booking.id}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={booking.renter?.avatar_url} />
                <AvatarFallback>
                  {booking.renter?.first_name?.[0]}{booking.renter?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h4 className="font-medium text-sm">
                  {booking.renter?.first_name} {booking.renter?.last_name}
                </h4>
                <p className="text-xs text-gray-500">
                  {booking.equipment?.title}
                </p>
                <p className="text-xs text-gray-500">
                  {format(new Date(booking.start_date), 'dd MMM', { locale: fr })} - 
                  {format(new Date(booking.end_date), 'dd MMM', { locale: fr })}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-medium text-sm">
                {booking.total_price?.toLocaleString()} FCFA
              </p>
              <Badge variant="outline" className="text-xs">
                {booking.payment_method === 'wallet' ? 'Payé' : 'Paiement à venir'}
              </Badge>
            </div>
          </div>
        ))}
        
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate('/owner-dashboard')}
        >
          Gérer toutes les demandes
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}