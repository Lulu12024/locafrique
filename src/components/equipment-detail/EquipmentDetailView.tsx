
import React, { useState } from 'react';
import { EquipmentData } from '@/types/supabase';
import { useDeviceSize } from '@/hooks/use-mobile';
import { ImageGallery } from './ImageGallery';
import { RentalPanel } from './RentalPanel';
import { EquipmentInfo } from './EquipmentInfo';
import { HostInfo } from './HostInfo';
import { LocationInfo } from './LocationInfo';
import { EquipmentFeatures } from './EquipmentFeatures';
import { EquipmentReviews } from './EquipmentReviews';
import { ScrollBookingHeader } from './ScrollBookingHeader';
import { FixedBookingFooter } from './FixedBookingFooter';
import { MobileEquipmentDetailView } from './MobileEquipmentDetailView';
import { Container } from '@/components/ui/container';

interface EquipmentDetailViewProps {
  equipment: EquipmentData;
}

export function EquipmentDetailView({ equipment }: EquipmentDetailViewProps) {
  const { isMobile } = useDeviceSize();
  const [showScrollHeader, setShowScrollHeader] = useState(false);

  const handleReservationClick = () => {
    // TODO: Implémenter la logique de réservation
    console.log('Réservation cliquée pour équipement:', equipment.id);
  };

  const handleOwnerClick = () => {
    // TODO: Implémenter la logique d'affichage du profil propriétaire
    console.log('Profil propriétaire cliqué:', equipment.owner?.id);
  };

  if (isMobile) {
    return <MobileEquipmentDetailView equipment={equipment} />;
  }

  // Gérer les images en toute sécurité
  const images = Array.isArray(equipment.images) ? equipment.images : [];

  return (
    <>
      <ScrollBookingHeader 
        equipment={equipment}
        onReservationClick={handleReservationClick}
        isVisible={showScrollHeader}
      />
      
      <Container className="py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-8">
            <ImageGallery 
              images={images}
              equipmentTitle={equipment.title}
            />
            <EquipmentInfo 
              equipment={equipment}
              onOwnerClick={handleOwnerClick}
            />
            {equipment.owner && (
              <HostInfo 
                owner={equipment.owner}
                onOwnerClick={handleOwnerClick}
              />
            )}
            <EquipmentFeatures equipment={equipment} />
            <LocationInfo 
              city={equipment.city}
              country={equipment.country}
            />
            {equipment.owner && (
              <EquipmentReviews 
                equipmentId={equipment.id} 
                ownerId={equipment.owner.id} 
              />
            )}
          </div>

          {/* Panneau de réservation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <RentalPanel equipment={equipment} />
            </div>
          </div>
        </div>
      </Container>

      <FixedBookingFooter 
        equipment={equipment}
        onReservationClick={handleReservationClick}
      />
    </>
  );
}
