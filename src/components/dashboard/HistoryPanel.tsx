
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth";
import { useBookings } from "@/hooks/useBookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  Euro, 
  Package, 
  User,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

const HistoryPanel: React.FC = () => {
  const { user } = useAuth();
  const { fetchUserBookings } = useBookings();
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      if (user) {
        try {
          const data = await fetchUserBookings(user.id);
          // Combine all bookings and sort by date
          const combined = [
            ...data.renterBookings.map(booking => ({ ...booking, type: 'rental' })),
            ...data.ownerBookings.map(booking => ({ ...booking, type: 'booking' }))
          ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          
          setAllBookings(combined);
        } catch (error) {
          console.error("Erreur lors du chargement de l'historique:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadHistory();
  }, [user, fetchUserBookings]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approuvé</Badge>;
      case 'pending':
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Refusé</Badge>;
      case 'cancelled':
        return <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" />Annulé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'rental' ? (
      <Package className="w-4 h-4 text-blue-500" />
    ) : (
      <User className="w-4 h-4 text-green-500" />
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Historique des activités
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p>Chargement de l'historique...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Historique des activités
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allBookings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucune activité trouvée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allBookings.map((booking, index) => (
              <div key={booking.id}>
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getTypeIcon(booking.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-sm">
                          {booking.type === 'rental' ? 'Location' : 'Demande reçue'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {booking.equipment?.title || 'Équipement'}
                        </p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {format(new Date(booking.start_date), 'dd MMM yyyy', { locale: fr })}
                          {' - '}
                          {format(new Date(booking.end_date), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Euro className="w-3 h-3" />
                        <span>{booking.total_price} FCFA</span>
                      </div>
                    </div>
                    
                    {booking.type === 'rental' && booking.owner && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Propriétaire: {booking.owner.first_name} {booking.owner.last_name}
                      </p>
                    )}
                    
                    {booking.type === 'booking' && booking.renter && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Locataire: {booking.renter.first_name} {booking.renter.last_name}
                      </p>
                    )}
                  </div>
                </div>
                
                {index < allBookings.length - 1 && (
                  <Separator className="my-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HistoryPanel;
