
import React from 'react';
import { useToast } from "@/components/ui/use-toast";
import { OwnerBooking } from "@/hooks/bookings/types";
import EquipmentList from './equipment/EquipmentList';
import BookingsList from './booking/BookingsList';

interface ProprietaireDashboardProps {
  ownerBookings: OwnerBooking[] | undefined;
  isLoadingBookings: boolean;
  activeTab: string;
  handleCreateEquipment: () => void;
}

const ProprietaireDashboard: React.FC<ProprietaireDashboardProps> = ({
  ownerBookings,
  isLoadingBookings,
  activeTab,
  handleCreateEquipment,
}) => {
  const { toast } = useToast();

  const handleApproveBooking = (bookingId: string) => {
    toast({
      title: "Fonctionnalité en cours de développement",
      description: "L'approbation des réservations sera bientôt disponible.",
    });
  };

  const handleRejectBooking = (bookingId: string) => {
    toast({
      title: "Fonctionnalité en cours de développement",
      description: "Le refus des réservations sera bientôt disponible.",
    });
  };

  return (
    <>
      {activeTab === "equipment" && (
        <EquipmentList handleCreateEquipment={handleCreateEquipment} />
      )}
      
      {activeTab === "bookings" && (
        <BookingsList
          bookings={ownerBookings}
          isLoading={isLoadingBookings}
          onApprove={handleApproveBooking}
          onReject={handleRejectBooking}
          handleCreateEquipment={handleCreateEquipment}
        />
      )}
    </>
  );
};

export default ProprietaireDashboard;
