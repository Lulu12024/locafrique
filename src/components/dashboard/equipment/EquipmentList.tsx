import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Loader2, Edit, Trash2, Package, TrendingUp, RefreshCw } from "lucide-react";
import { useEquipments } from "@/hooks/useEquipments";
import { EquipmentData } from "@/types/supabase";
import { Badge } from "@/components/ui/badge";

interface EquipmentListProps {
  handleCreateEquipment: () => void;
}

const EquipmentItem: React.FC<{
  equipment: EquipmentData;
  onDelete: (id: string) => void;
}> = ({ equipment, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Récupérer l'image principale ou la première image disponible
  const mainImage = Array.isArray(equipment.images) 
    ? equipment.images.find(img => img.is_primary) || equipment.images[0]
    : null;
    
  const handleDelete = async () => {
    if (window.confirm(`Voulez-vous vraiment supprimer l'équipement "${equipment.title}" ?`)) {
      setIsDeleting(true);
      await onDelete(equipment.id);
    }
  };

  const getConditionBadge = (condition: string) => {
    const conditionMap = {
      'neuf': { label: 'Neuf', variant: 'default' as const },
      'tres_bon': { label: 'Très bon', variant: 'secondary' as const },
      'bon': { label: 'Bon état', variant: 'secondary' as const },
      'usage': { label: 'Usagé', variant: 'outline' as const },
      'a_reparer': { label: 'À réparer', variant: 'destructive' as const }
    };
    
    const conditionInfo = conditionMap[condition as keyof typeof conditionMap] || 
      { label: 'Non spécifié', variant: 'outline' as const };
    
    return (
      <Badge variant={conditionInfo.variant} className="text-xs">
        {conditionInfo.label}
      </Badge>
    );
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group">
      <div className="aspect-video relative bg-gray-100">
        {mainImage ? (
          <img 
            src={mainImage.image_url} 
            alt={equipment.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          {getConditionBadge(equipment.condition)}
        </div>
        <div className="absolute bottom-3 left-3">
          <Badge variant="secondary" className="bg-white/90 text-xs">
            {equipment.category}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg truncate group-hover:text-blue-600 transition-colors">
              {equipment.title}
            </h3>
            {equipment.brand && (
              <p className="text-sm text-gray-500">{equipment.brand}</p>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-green-600">
                {equipment.daily_price.toLocaleString()} FCFA
              </p>
              <p className="text-xs text-gray-500">par jour</p>
            </div>
            
            {equipment.booking_count !== undefined && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <TrendingUp className="h-4 w-4" />
                <span>{equipment.booking_count} location{equipment.booking_count !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" disabled={isDeleting}>
              <Edit className="h-4 w-4 mr-1" />
              Modifier
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EquipmentList: React.FC<EquipmentListProps> = ({
  handleCreateEquipment,
}) => {
  const { fetchUserEquipments, deleteEquipment } = useEquipments();
  const [equipments, setEquipments] = useState<EquipmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Charger les équipements au montage du composant
  useEffect(() => {
    console.log("🔄 EquipmentList: Chargement initial des équipements");
    loadEquipments();
  }, []);
  
  const loadEquipments = async () => {
    console.log("📦 Début du chargement des équipements");
    setIsLoading(true);
    const data = await fetchUserEquipments();
    console.log("📦 Équipements chargés:", data);
    setEquipments(data);
    setIsLoading(false);
  };
  
  const handleRefresh = async () => {
    console.log("🔄 Actualisation manuelle des équipements");
    setIsRefreshing(true);
    const data = await fetchUserEquipments();
    setEquipments(data);
    setIsRefreshing(false);
  };
  
  const handleDeleteEquipment = async (id: string) => {
    const result = await deleteEquipment(id);
    if (result.success) {
      // Mettre à jour la liste sans recharger
      setEquipments(prev => prev.filter(item => item.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Package className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Mes équipements</h1>
            <p className="text-gray-600">
              {equipments.length} équipement{equipments.length !== 1 ? 's' : ''} disponible{equipments.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> 
            Actualiser
          </Button>
          <Button onClick={handleCreateEquipment} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> 
            Ajouter un équipement
          </Button>
        </div>
      </div>

      {/* Debug info */}
      <div className="bg-gray-100 p-4 rounded-lg text-sm">
        <p><strong>Debug:</strong> {equipments.length} équipements trouvés</p>
        <p><strong>État:</strong> {isLoading ? 'Chargement...' : 'Chargé'}</p>
      </div>

      {/* Statistiques rapides */}
      {equipments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total équipements</p>
                  <p className="text-2xl font-bold">{equipments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Revenus potentiels/jour</p>
                  <p className="text-2xl font-bold">
                    {equipments.reduce((sum, eq) => sum + eq.daily_price, 0).toLocaleString()} FCFA
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Upload className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">En état neuf</p>
                  <p className="text-2xl font-bold">
                    {equipments.filter(eq => eq.condition === 'neuf').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste des équipements */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-600" />
              <p className="text-gray-600">Chargement de vos équipements...</p>
            </div>
          ) : equipments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {equipments.map((equipment) => (
                <EquipmentItem 
                  key={equipment.id} 
                  equipment={equipment}
                  onDelete={handleDeleteEquipment}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Package className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Aucun équipement</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Vous n'avez pas encore ajouté d'équipement à louer. Commencez dès maintenant et générez des revenus !
              </p>
              <Button onClick={handleCreateEquipment} size="lg" className="flex items-center gap-2">
                <Plus className="h-5 w-5" /> 
                Ajouter votre premier équipement
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EquipmentList;
