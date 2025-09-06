// src/pages/MyEquipments.tsx - Version corrigée avec modal

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Package, ArrowLeft, Loader2 } from "lucide-react";
import AddEquipmentModal from "@/components/AddEquipmentModal";
import { useEquipments } from "@/hooks/useEquipments";
import { EquipmentData } from "@/types/supabase";

const MyEquipments: React.FC = () => {
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mes équipements</h1>
              <p className="text-gray-600">Gérez vos équipements en location</p>
            </div>
          </div>
          <Button 
            onClick={handleOpenModal}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un équipement
          </Button>
        </div>

        {/* Contenu principal */}
        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-green-600" />
                <p className="text-gray-600">Chargement de vos équipements...</p>
              </div>
            ) : equipments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {equipments.map((equipment) => (
                  <Card 
                    key={equipment.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleEquipmentClick(equipment.id)}
                  >
                    <div className="aspect-video bg-gray-100 rounded-t-lg">
                      {/* Image de l'équipement */}
                      {Array.isArray(equipment.images) && equipment.images.length > 0 ? (
                        <img 
                          src={equipment.images[0].image_url} 
                          alt={equipment.title}
                          className="w-full h-full object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2 truncate">{equipment.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{equipment.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-green-600 font-bold">
                          {equipment.daily_price.toLocaleString()} FCFA/jour
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {equipment.status}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium mb-2">Aucun équipement trouvé</p>
                <p className="text-sm text-gray-600 mb-6">Commencez par ajouter votre premier équipement</p>
                <Button 
                  onClick={handleOpenModal}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter mon premier équipement
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal d'ajout d'équipement */}
      <AddEquipmentModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />
    </div>
  );
};

export default MyEquipments;