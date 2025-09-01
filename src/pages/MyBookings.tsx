
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, ArrowLeft } from "lucide-react";

const MyBookings: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
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
            <h1 className="text-2xl font-bold text-gray-900">Mes réservations</h1>
            <p className="text-gray-600">Suivez l'état de vos réservations</p>
          </div>
        </div>

        {/* Empty State */}
        <Card className="p-8 text-center">
          <div className="text-gray-500 mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium mb-2">Aucune réservation trouvée</p>
            <p className="text-sm">Vos futures réservations apparaîtront ici</p>
          </div>
          <Button 
            onClick={() => navigate('/')}
            className="bg-green-600 hover:bg-green-700"
          >
            Explorer les équipements
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default MyBookings;
