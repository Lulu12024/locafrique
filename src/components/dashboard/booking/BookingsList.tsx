
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { OwnerBooking } from "@/hooks/bookings/types";
import BookingCard from "./BookingCard";

interface BookingsListProps {
  bookings: OwnerBooking[] | undefined;
  isLoading: boolean;
  onApprove: (bookingId: string) => void;
  onReject: (bookingId: string) => void;
  handleCreateEquipment: () => void;
}

const BookingsList: React.FC<BookingsListProps> = ({
  bookings,
  isLoading,
  onApprove,
  onReject,
  handleCreateEquipment,
}) => {
  const renderBookings = (bookings: OwnerBooking[] = []) => {
    if (bookings.length === 0) {
      return (
        <div className="text-center py-10 text-muted-foreground">
          <p>Vous n'avez pas encore reçu de demandes de réservation.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={handleCreateEquipment}
          >
            Ajouter un équipement
          </Button>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bookings.map((booking) => (
          <BookingCard 
            key={booking.id} 
            booking={booking}
            onApprove={onApprove}
            onReject={onReject}
          />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Demandes reçues</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Filtrer <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Statut</DropdownMenuLabel>
            <DropdownMenuItem>En attente</DropdownMenuItem>
            <DropdownMenuItem>Approuvées</DropdownMenuItem>
            <DropdownMenuItem>Refusées</DropdownMenuItem>
            <DropdownMenuItem>Terminées</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Toutes</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : (
          renderBookings(bookings || [])
        )}
      </CardContent>
    </Card>
  );
};

export default BookingsList;
