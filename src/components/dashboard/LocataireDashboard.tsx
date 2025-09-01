
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  FileEdit,
  MessageSquare,
  MoreHorizontal,
} from "lucide-react";
import { RenterBooking } from "@/hooks/bookings/types";

interface LocataireDashboardProps {
  renterBookings: RenterBooking[] | undefined;
  isLoadingBookings: boolean;
  activeTab: string;
}

const LocataireDashboard: React.FC<LocataireDashboardProps> = ({
  renterBookings,
  isLoadingBookings,
  activeTab,
}) => {
  const navigate = useNavigate();

  // Render bookings as renter
  const renderRenterBookings = (bookings: RenterBooking[] = []) => {
    if (bookings.length === 0) {
      return (
        <div className="text-center py-10 text-muted-foreground">
          <p>Vous n'avez pas encore de réservations.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate("/equipments")}
          >
            Découvrir des équipements
          </Button>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bookings.map((booking) => (
          <Card key={booking.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium">{booking.equipment.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    booking.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                    booking.status === "approved" ? "bg-green-100 text-green-800" :
                    booking.status === "rejected" ? "bg-red-100 text-red-800" :
                    booking.status === "cancelled" ? "bg-gray-100 text-gray-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {booking.status === "pending" ? "En attente" :
                    booking.status === "approved" ? "Approuvé" :
                    booking.status === "rejected" ? "Refusé" :
                    booking.status === "cancelled" ? "Annulé" :
                    "Complété"}
                  </span>
                </div>
                
                <p className="text-sm mb-2">
                  <span className="font-medium">Prix total:</span> {booking.total_price} FCFA
                </p>
                
                <div className="flex justify-between mt-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                    onClick={() => booking.equipment?.id && navigate(`/equipments/details/${booking.equipment.id}`)}
                  >
                    Détails
                  </Button>
                  
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
                      {booking.status === "pending" && (
                        <DropdownMenuItem>
                          <FileEdit className="mr-2 h-4 w-4" /> Annuler
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <>
      {activeTab === "rentals" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Mes locations</CardTitle>
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
            {isLoadingBookings ? (
              <div className="text-center py-8">Chargement...</div>
            ) : (
              renderRenterBookings(renterBookings || [])
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default LocataireDashboard;
