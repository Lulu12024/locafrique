
import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useEquipmentDetail } from "@/hooks/useEquipmentDetail";
import Footer from "@/components/Footer";
import { AppStoreStyleDetailView } from "@/components/equipment-detail/AppStoreStyleDetailView";
import { useDeviceSize } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/auth";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const EquipmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { fetchEquipmentById, isLoading } = useEquipmentDetail();
  const [equipmentData, setEquipmentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { isMobile } = useDeviceSize();
  const { user } = useAuth();
  
  console.log('🔍 EquipmentDetail - ID depuis l\'URL:', id);
  console.log('📱 Est mobile:', isMobile);
  console.log('🔗 URL actuelle:', window.location.href);
  
  // Fetch equipment data with retry mechanism
  const fetchData = async () => {
    console.log('🚀 Début de fetchData avec ID:', id);
    
    if (!id) {
      console.error('❌ ID d\'équipement manquant dans l\'URL');
      setError("ID d'équipement manquant");
      return;
    }

    // Vérifier le format UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.error('❌ Format UUID invalide:', id);
      setError("Format d'ID invalide");
      return;
    }

    try {
      setError(null);
      console.log("🔍 Chargement des détails de l'équipement:", id);
      
      const data = await fetchEquipmentById(id);
      console.log("📦 Données reçues:", data);
      
      if (data.equipment && data.owner) {
        // Combine equipment and owner data
        const combinedData = {
          ...data.equipment,
          owner: data.owner
        };
        setEquipmentData(combinedData);
        console.log("✅ Données combinées:", combinedData);
      } else {
        console.error('❌ Données manquantes:', data);
        setError("Équipement non trouvé");
      }
    } catch (err: any) {
      console.error("❌ Erreur lors du chargement:", err);
      setError(err.message || "Erreur lors du chargement des détails");
    }
  };

  useEffect(() => {
    console.log('🔄 useEffect déclenché, ID:', id);
    fetchData();
  }, [id]);

  const handleRetry = () => {
    console.log('🔄 Retry déclenché');
    fetchData();
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Skeleton className="aspect-video rounded-lg" />
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-12 w-1/3" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );

  // Error component
  const ErrorComponent = () => (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Équipement non trouvé</h2>
        <p className="text-gray-600">{error}</p>
        <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
          <p><strong>Debug Info:</strong></p>
          <p>ID recherché: {id}</p>
          <p>Format UUID valide: {id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? 'Oui' : 'Non'}</p>
          <p>URL actuelle: {window.location.href}</p>
          <p>Mobile: {isMobile ? 'Oui' : 'Non'}</p>
        </div>
        <Button onClick={handleRetry} variant="outline" className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">      
      <main className="flex-grow">
        {isLoading ? (
          <div className="py-8">
            <Container>
              <LoadingSkeleton />
            </Container>
          </div>
        ) : error || !equipmentData ? (
          <div className="py-8">
            <Container>
              <ErrorComponent />
            </Container>
          </div>
        ) : (
          <AppStoreStyleDetailView 
            equipment={equipmentData} 
          />
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default EquipmentDetail;
