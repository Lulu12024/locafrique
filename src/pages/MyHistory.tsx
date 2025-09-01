
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { History, ArrowLeft } from "lucide-react";

const MyHistory: React.FC = () => {
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
            <h1 className="text-2xl font-bold text-gray-900">Mon historique</h1>
            <p className="text-gray-600">Consultez vos activités passées</p>
          </div>
        </div>

        {/* Empty State */}
        <Card className="p-8 text-center">
          <div className="text-gray-500 mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <History className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium mb-2">Aucun historique trouvé</p>
            <p className="text-sm">Vos activités passées apparaîtront ici</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MyHistory;
