// src/pages/MyEquipments.tsx - VERSION FINALE AVEC BOUTON MODIFIER

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, ArrowLeft, Loader2, Edit } from "lucide-react";
import AddEquipmentModal from "@/components/AddEquipmentModal";
import { useEquipments } from "@/hooks/useEquipments";
import { EquipmentData } from "@/types/supabase";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const MyEquipments: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [equipments, setEquipments] = useState<EquipmentData[]>([]);
  const { fetchUserEquipments, isLoading } = useEquipments();

  // ✅ Charger les équipements avec images
  useEffect(() => {
    const loadEquipments = async () => {
      try {
        console.log('📦 Chargement des équipements...');
        const userEquipments = await fetchUserEquipments();
        
        // ✅ Charger les images pour chaque équipement
        if (userEquipments && userEquipments.length > 0) {
          const equipmentsWithImages = await Promise.all(
            userEquipments.map(async (equipment) => {
              const { data: images } = await supabase
                .from('equipment_images')
                .select('*')
                .eq('equipment_id', equipment.id)
                .order('is_primary', { ascending: false });
              
              return {
                ...equipment,
                images: images || []
              };
            })
          );
          
          console.log('✅ Équipements avec images:', equipmentsWithImages);
          setEquipments(equipmentsWithImages);
        } else {
          setEquipments([]);
        }
      } catch (error) {
        console.error("❌ Erreur lors du chargement des équipements:", error);
      }
    };

    loadEquipments();
  }, [fetchUserEquipments]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = async () => {
    setIsModalOpen(false);
    // Recharger les équipements après ajout
    const userEquipments = await fetchUserEquipments();
    if (userEquipments) {
      const equipmentsWithImages = await Promise.all(
        userEquipments.map(async (equipment) => {
          const { data: images } = await supabase
            .from('equipment_images')
            .select('*')
            .eq('equipment_id', equipment.id);
          return { ...equipment, images: images || [] };
        })
      );
      setEquipments(equipmentsWithImages);
    }
  };

  const handleEquipmentClick = (equipmentId: string) => {
    navigate(`/equipments/details/${equipmentId}`);
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${isMobile ? 'pb-safe-bottom' : ''}`}>
      {/* Header responsive */}
      <div className={`
        ${isMobile 
          ? 'pt-safe-top px-4 py-4 bg-white border-b sticky top-0 z-10' 
          : 'max-w-7xl mx-auto px-4 py-8'
        }
      `}>
        <div className={`
          flex items-center justify-between
          ${isMobile ? 'mb-0' : 'mb-8'}
        `}>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              size={isMobile ? "sm" : "default"}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour</span>
            </Button>
            <div>
              <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                Mes équipements
              </h1>
              {!isMobile && (
                <p className="text-gray-600">Gérez vos équipements </p>
              )}
            </div>
          </div>
          
          {/* Bouton d'ajout responsive */}
          {isMobile ? (
            <Button 
              onClick={handleOpenModal}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleOpenModal}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un équipement
            </Button>
          )}
        </div>
      </div>

      {/* Contenu principal responsive */}
      <div className={`${isMobile ? 'px-4 py-4' : 'max-w-7xl mx-auto px-4'}`}>
        <Card className={`${isMobile ? 'border-0 shadow-none bg-transparent' : ''}`}>
          <CardContent className={`${isMobile ? 'p-0' : 'p-6'}`}>
            {isLoading ? (
              <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
                <Loader2 className={`mx-auto mb-4 animate-spin text-green-600 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
                <p className="text-gray-600">Chargement de vos équipements...</p>
              </div>
            ) : equipments.length > 0 ? (
              /* Liste des équipements responsive */
              <div className={`
                grid gap-4
                ${isMobile 
                  ? 'grid-cols-1' 
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }
              `}>
                {equipments.map((equipment) => (
                  <EquipmentCard 
                    key={equipment.id} 
                    equipment={equipment}
                    isMobile={isMobile}
                    onClick={() => handleEquipmentClick(equipment.id)}
                    onEdit={() => navigate(`/edit-equipment/${equipment.id}`)}
                  />
                ))}
              </div>
            ) : (
              /* État vide responsive */
              <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
                <div className={`
                  p-4 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center
                  ${isMobile ? 'w-16 h-16' : 'w-20 h-20'}
                `}>
                  <Package className={`text-gray-400 ${isMobile ? 'h-8 w-8' : 'h-10 w-10'}`} />
                </div>
                
                <h3 className={`font-semibold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                  Aucun équipement trouvé
                </h3>
                
                <p className={`
                  text-gray-600 mb-6 max-w-md mx-auto
                  ${isMobile ? 'text-sm px-4' : ''}
                `}>
                  Commencez par ajouter votre premier équipement
                </p>
                
                <Button 
                  onClick={handleOpenModal} 
                  size={isMobile ? "default" : "lg"} 
                  className={`
                    flex items-center gap-2 bg-green-600 hover:bg-green-700
                    ${isMobile ? 'w-full max-w-xs mx-auto' : ''}
                  `}
                >
                  <Plus className="h-5 w-5" /> 
                  Ajouter mon premier équipement
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal d'ajout */}
      <AddEquipmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

// ✅ Composant Card d'équipement avec bouton Modifier
interface EquipmentCardProps {
  equipment: EquipmentData;
  isMobile: boolean;
  onClick: () => void;
  onEdit: () => void;
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({ equipment, isMobile, onClick, onEdit }) => {
  // ✅ Gestion des images
  const images = Array.isArray(equipment.images) ? equipment.images : [];
  const primaryImage = images.find(img => img.is_primary) || images[0];

  // ✅ Badge de statut
  const getStatusBadge = () => {
    if (equipment.moderation_status === 'pending') {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">⏳ En attente</Badge>;
    }
    if (equipment.moderation_status === 'rejected') {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">❌ Rejeté</Badge>;
    }
    if (equipment.moderation_status === 'approved') {
      if (equipment.status === 'disponible') {
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">✅ Disponible</Badge>;
      }
      if (equipment.status === 'loue') {
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">📦 Loué</Badge>;
      }
      if (equipment.status === 'indisponible') {
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">❌ Indisponible</Badge>;
      }
    }
    return <Badge variant="outline" className="text-xs">{equipment.status}  En attente</Badge>;
  };

  return (
    <Card 
      className={`
        hover:shadow-md transition-shadow
        ${isMobile ? 'border-gray-200' : ''}
      `}
    >
      <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
        {/* Image réelle ou placeholder */}
        <div 
          className={`
            rounded-lg mb-3 overflow-hidden relative cursor-pointer
            ${isMobile ? 'h-32' : 'h-40'}
          `}
          onClick={onClick}
        >
          {primaryImage ? (
            <img
              src={primaryImage.image_url}
              alt={equipment.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          )}
          
          {/* Badge sur l'image */}
          <div className="absolute top-2 right-2">
            {getStatusBadge()}
          </div>
        </div>
        
        {/* Message de rejet */}
        {equipment.moderation_status === 'rejected' && equipment.rejection_reason && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-medium text-red-800">Raison du rejet:</p>
            <p className="text-xs text-red-700 mt-1 line-clamp-2">{equipment.rejection_reason}</p>
          </div>
        )}
        
        {/* Contenu */}
        <div className="space-y-2" onClick={onClick}>
          <h3 className={`font-semibold line-clamp-2 cursor-pointer ${isMobile ? 'text-sm' : 'text-base'}`}>
            {equipment.title}
          </h3>
          
          <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {equipment.location}
          </p>
          
          <div className="flex items-center justify-between">
            <span className={`font-bold text-green-600 ${isMobile ? 'text-sm' : 'text-base'}`}>
              {equipment.daily_price?.toLocaleString()} FCFA/jour
            </span>
          </div>
          
          {equipment.condition && (
            <span className="text-xs text-gray-500">
              État: {equipment.condition}
            </span>
          )}
        </div>

        {/* ✅ Bouton Modifier (toujours visible) */}
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-3"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </CardContent>
    </Card>
  );
};

export default MyEquipments;