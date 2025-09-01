
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MoreHorizontal, MessageSquare } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OwnerBooking } from "@/hooks/bookings/types";

interface BookingCardProps {
  booking: OwnerBooking;
  onApprove: (bookingId: string) => void;
  onReject: (bookingId: string) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onApprove,
  onReject,
}) => {
  const getStatusClass = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "En attente";
      case "approved": return "Approuvé";
      case "rejected": return "Refusé";
      case "cancelled": return "Annulé";
      default: return "Complété";
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-medium">{booking.equipment.title}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
              </p>
            </div>
            
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusClass(booking.status)}`}>
              {getStatusText(booking.status)}
            </span>
          </div>
          
          <p className="text-sm mb-1">
            <span className="font-medium">Locataire:</span> {booking.renter?.first_name} {booking.renter?.last_name}
          </p>
          <p className="text-sm mb-2">
            <span className="font-medium">Prix total:</span> {booking.total_price} FCFA
          </p>
          
          <div className="flex justify-between mt-3">
            {booking.status === "pending" && (
              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  size="sm"
                  className="text-xs bg-green-600 hover:bg-green-700"
                  onClick={() => onApprove(booking.id)}
                >
                  Approuver
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => onReject(booking.id)}
                >
                  Refuser
                </Button>
              </div>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <MessageSquare className="mr-2 h-4 w-4" /> Contacter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingCard;
