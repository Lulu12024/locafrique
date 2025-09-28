import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Package, ArrowLeft, Loader2, MoreVertical } from "lucide-react";
import AddEquipmentModal from "@/components/AddEquipmentModal";
import { useEquipments } from "@/hooks/useEquipments";
import { EquipmentData } from "@/types/supabase";
import { useIsMobile } from "@/hooks/use-mobile";

const MyEquipments: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [equipments, setEquipments] = useState<EquipmentData[]>([]);
  const { fetchUserEquipments, isLoading } = useEquipments();

  // Charger les équipements de l'utilisateur
  useEffect(() => {
    const loadEquipments = async () => {
      try {
        const userEquipments = await fetchUserEquipments();
        setEquipments(userEquipments);
      } catch (error) {
        console.error("Erreur lors du chargement des équipements:", error);
      }
    };

    loadEquipments();
  }, [fetchUserEquipments]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Recharger les équipements après ajout
    fetchUserEquipments().then(setEquipments);
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
                <p className="text-gray-600">Gérez vos équipements en location</p>
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
        onSuccess={handleCloseModal}
      />
    </div>
  );
};

// Composant Card d'équipement responsive
interface EquipmentCardProps {
  equipment: EquipmentData;
  isMobile: boolean;
  onClick: () => void;
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({ equipment, isMobile, onClick }) => {
  return (
    <Card 
      className={`
        cursor-pointer hover:shadow-md transition-shadow
        ${isMobile ? 'border-gray-200' : ''}
      `}
      onClick={onClick}
    >
      <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
        {/* Image placeholder */}
        <div className={`
          bg-gray-200 rounded-lg mb-3 flex items-center justify-center
          ${isMobile ? 'h-32' : 'h-40'}
        `}>
          <Package className="h-8 w-8 text-gray-400" />
        </div>
        
        {/* Contenu */}
        <div className="space-y-2">
          <h3 className={`font-semibold line-clamp-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
            {equipment.title}
          </h3>
          
          <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {equipment.location}
          </p>
          
          <div className="flex items-center justify-between">
            <span className={`font-bold text-green-600 ${isMobile ? 'text-sm' : 'text-base'}`}>
              {equipment.daily_price.toLocaleString()} FCFA/jour
            </span>
            
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  // Menu d'actions
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Badge d'état */}
          <div className="flex justify-between items-center">
            <span className={`
              px-2 py-1 rounded-full text-xs font-medium
              ${equipment.status === 'disponible' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
              }
            `}>
              {equipment.status === 'disponible' ? 'Disponible' : 'Non disponible'}
            </span>
            
            {equipment.condition && (
              <span className={`text-xs text-gray-500 ${isMobile ? '' : 'ml-2'}`}>
                État: {equipment.condition}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyEquipments;