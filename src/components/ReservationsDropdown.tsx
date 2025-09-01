
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronDown, Check, X, MessageSquare, ExternalLink, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/auth";
import { useBookings } from "@/hooks/useBookings";
import { useUserRoles } from "@/hooks/auth/useUserRoles";
import { OwnerBooking, RenterBooking } from "@/hooks/bookings/types";

const ReservationsDropdown: React.FC = () => {
  const { user, profile } = useAuth();
  const { isProprietaire } = useUserRoles(profile);
  const { fetchUserBookings, updateBookingStatus } = useBookings();
  const [bookingsData, setBookingsData] = useState<{
    renterBookings: RenterBooking[];
    ownerBookings: OwnerBooking[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user && isOpen && !bookingsData) {
      loadBookings();
    }
  }, [user, isOpen]);

  const loadBookings = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const data = await fetchUserBookings(user.id);
      setBookingsData(data);
    } catch (error) {
      console.error("Erreur lors du chargement des réservations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'approved' | 'rejected') => {
    try {
      await updateBookingStatus({ bookingId, status: action });
      // Recharger les données après l'action
      await loadBookings();
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }
  };

  if (!user) return null;

  // Filtrer les réservations par statut
  const getFilteredBookings = () => {
    const allBookings = [
      ...(bookingsData?.renterBookings || []),
      ...(bookingsData?.ownerBookings || [])
    ];

    return {
      pending: allBookings.filter(b => b.status === 'pending' || b.status === 'en_attente'),
      negotiating: allBookings.filter(b => b.status === 'negotiating' || b.status === 'en_cours'),
      published: isProprietaire ? (bookingsData?.ownerBookings || []).filter(b => b.status === 'approved' || b.status === 'confirmée') : [],
      completed: allBookings.filter(b => b.status === 'completed' || b.status === 'cancelled' || b.status === 'refusée')
    };
  };

  const filteredBookings = bookingsData ? getFilteredBookings() : {
    pending: [],
    negotiating: [],
    published: [],
    completed: []
  };

  const totalCount = Object.values(filteredBookings).reduce((acc, bookings) => acc + bookings.length, 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'en_attente':
        return 'bg-orange-100 text-orange-800';
      case 'approved':
      case 'confirmée':
        return 'bg-green-100 text-green-800';
      case 'rejected':
      case 'refusée':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'negotiating':
      case 'en_cours':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const BookingCard = ({ booking, showActions = false }: { 
    booking: RenterBooking | OwnerBooking; 
    showActions?: boolean 
  }) => (
    <div className="p-3 border border-gray-200 rounded-lg mb-2 bg-white hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-sm text-gray-900 truncate flex-1">
          {booking.equipment.title}
        </h4>
        <Badge className={`text-xs ml-2 ${getStatusColor(booking.status)}`}>
          {booking.status}
        </Badge>
      </div>
      
      <div className="text-xs text-gray-600 mb-2">
        <div>Du {formatDate(booking.start_date)} au {formatDate(booking.end_date)}</div>
        <div className="font-medium text-green-600">{booking.total_amount} FCFA</div>
      </div>

      {showActions && booking.status === 'pending' && isProprietaire && (
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            onClick={() => handleBookingAction(booking.id, 'approved')}
            className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-700"
          >
            <Check className="h-3 w-3 mr-1" />
            Confirmer
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleBookingAction(booking.id, 'rejected')}
            className="flex-1 h-7 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Refuser
          </Button>
        </div>
      )}

      {(booking.status === 'negotiating' || booking.status === 'en_cours') && (
        <Button
          size="sm"
          variant="outline"
          className="w-full h-7 text-xs mt-2"
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          Voir conversation
        </Button>
      )}
    </div>
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative hover:bg-gray-100 transition-colors"
        >
          <Calendar className="h-5 w-5 text-gray-600" />
          {totalCount > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">{totalCount}</span>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-96 max-h-[500px] overflow-hidden bg-white border border-gray-200 shadow-lg z-50"
        align="end"
        sideOffset={8}
      >
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Mes réservations</h3>
          <p className="text-sm text-gray-600">Gérez vos réservations en cours</p>
        </div>

        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Chargement...</p>
          </div>
        ) : (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-4 p-1 m-2 bg-gray-100 rounded-lg">
              <TabsTrigger value="pending" className="text-xs flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                En cours ({filteredBookings.pending.length})
              </TabsTrigger>
              <TabsTrigger value="negotiating" className="text-xs">
                Négociation ({filteredBookings.negotiating.length})
              </TabsTrigger>
              {isProprietaire && (
                <TabsTrigger value="published" className="text-xs">
                  Publiées ({filteredBookings.published.length})
                </TabsTrigger>
              )}
              <TabsTrigger value="completed" className="text-xs">
                Terminées ({filteredBookings.completed.length})
              </TabsTrigger>
            </TabsList>

            <div className="max-h-80 overflow-y-auto p-3">
              <TabsContent value="pending" className="mt-0">
                {filteredBookings.pending.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    Aucune réservation en attente
                  </div>
                ) : (
                  <div>
                    {filteredBookings.pending.map((booking) => (
                      <BookingCard 
                        key={booking.id} 
                        booking={booking} 
                        showActions={true}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="negotiating" className="mt-0">
                {filteredBookings.negotiating.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    Aucune négociation en cours
                  </div>
                ) : (
                  <div>
                    {filteredBookings.negotiating.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {isProprietaire && (
                <TabsContent value="published" className="mt-0">
                  {filteredBookings.published.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      Aucune réservation publiée
                    </div>
                  ) : (
                    <div>
                      {filteredBookings.published.map((booking) => (
                        <BookingCard key={booking.id} booking={booking} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              )}

              <TabsContent value="completed" className="mt-0">
                {filteredBookings.completed.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    Aucune réservation terminée
                  </div>
                ) : (
                  <div>
                    {filteredBookings.completed.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        )}

        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs"
            onClick={() => {
              setIsOpen(false);
              // Naviguer vers la vue d'ensemble
              window.location.href = '/overview';
            }}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Voir toutes les réservations
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ReservationsDropdown;
