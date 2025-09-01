
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth";
import { useBookings } from "@/hooks/useBookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Euro
} from "lucide-react";
import { downloadContract, generateContractPDF } from "@/utils/contractUtils";

const ContractsPanel: React.FC = () => {
  const { user } = useAuth();
  const { fetchUserBookings } = useBookings();
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadContracts = async () => {
      if (user) {
        try {
          const data = await fetchUserBookings(user.id);
          // Filter bookings that have contracts or are approved
          const contractBookings = [
            ...data.renterBookings.filter(booking => 
              booking.status === 'approved' || booking.contract_url
            ).map(booking => ({ ...booking, type: 'rental' })),
            ...data.ownerBookings.filter(booking => 
              booking.status === 'approved' || booking.contract_url
            ).map(booking => ({ ...booking, type: 'booking' }))
          ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          
          setContracts(contractBookings);
        } catch (error) {
          console.error("Erreur lors du chargement des contrats:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadContracts();
  }, [user, fetchUserBookings]);

  const getContractStatus = (booking: any) => {
    if (booking.contract_url) {
      if (booking.renter_signature && booking.owner_signature) {
        return { status: 'completed', label: 'Signé', icon: CheckCircle, color: 'bg-green-500' };
      } else if (booking.renter_signature || booking.owner_signature) {
        return { status: 'partially_signed', label: 'Partiellement signé', icon: Clock, color: 'bg-yellow-500' };
      } else {
        return { status: 'pending_signature', label: 'En attente de signature', icon: AlertTriangle, color: 'bg-orange-500' };
      }
    } else {
      return { status: 'pending_generation', label: 'À générer', icon: Clock, color: 'bg-blue-500' };
    }
  };

  const handleDownloadContract = (booking: any) => {
    if (booking.contract_url) {
      downloadContract(booking.contract_url, `contrat-${booking.id}.pdf`);
    }
  };

  const handleGenerateContract = async (booking: any) => {
    const url = await generateContractPDF(booking.id);
    if (url) {
      // Refresh contracts list
      const data = await fetchUserBookings(user!.id);
      const contractBookings = [
        ...data.renterBookings.filter(b => 
          b.status === 'approved' || b.contract_url
        ).map(b => ({ ...b, type: 'rental' })),
        ...data.ownerBookings.filter(b => 
          b.status === 'approved' || b.contract_url
        ).map(b => ({ ...b, type: 'booking' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setContracts(contractBookings);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Mes Contrats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p>Chargement des contrats...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Mes Contrats
        </CardTitle>
      </CardHeader>
      <CardContent>
        {contracts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun contrat trouvé</p>
            <p className="text-sm">Les contrats apparaîtront ici une fois vos réservations approuvées</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract, index) => {
              const contractStatus = getContractStatus(contract);
              const StatusIcon = contractStatus.icon;
              
              return (
                <div key={contract.id}>
                  <div className="flex items-start gap-3 p-4 border rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-sm">
                            Contrat de {contract.type === 'rental' ? 'location' : 'mise à disposition'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {contract.equipment?.title || 'Équipement'}
                          </p>
                        </div>
                        <Badge variant="secondary" className={`${contractStatus.color} text-white`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {contractStatus.label}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {format(new Date(contract.start_date), 'dd MMM yyyy', { locale: fr })}
                            {' - '}
                            {format(new Date(contract.end_date), 'dd MMM yyyy', { locale: fr })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Euro className="w-3 h-3" />
                          <span>{contract.total_price} FCFA</span>
                        </div>
                      </div>
                      
                      {contract.type === 'rental' && contract.owner && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Propriétaire: {contract.owner.first_name} {contract.owner.last_name}
                        </p>
                      )}
                      
                      {contract.type === 'booking' && contract.renter && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Locataire: {contract.renter.first_name} {contract.renter.last_name}
                        </p>
                      )}
                      
                      <div className="flex gap-2">
                        {contract.contract_url ? (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleDownloadContract(contract)}>
                              <Download className="w-3 h-3 mr-1" />
                              Télécharger
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-3 h-3 mr-1" />
                              Voir
                            </Button>
                          </>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => handleGenerateContract(contract)}>
                            <FileText className="w-3 h-3 mr-1" />
                            Générer le contrat
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {index < contracts.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContractsPanel;
