
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Plus, ArrowLeft, Euro } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { Skeleton } from "@/components/ui/skeleton";

const MyWallet: React.FC = () => {
  const navigate = useNavigate();
  const { wallet, loading, error } = useWallet();

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
            <h1 className="text-2xl font-bold text-gray-900">Mon portefeuille</h1>
            <p className="text-gray-600">Gérez vos paiements et revenus</p>
          </div>
        </div>

        {/* Balance Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wallet className="h-5 w-5 text-green-600" />
              <span>Solde disponible</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-10 w-32 mb-4" />
            ) : (
              <div className="text-3xl font-bold text-green-600 mb-4">
                {wallet ? `${wallet.balance.toFixed(2)} €` : '0,00 €'}
              </div>
            )}
            <div className="flex space-x-4">
              <Button 
                className="bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Recharger
              </Button>
              <Button 
                variant="outline"
                disabled={loading || !wallet || wallet.balance <= 0}
              >
                <Euro className="h-4 w-4 mr-2" />
                Retirer
              </Button>
            </div>
            {error && (
              <p className="text-red-600 text-sm mt-2">{error}</p>
            )}
            {wallet && (
              <p className="text-gray-500 text-sm mt-2">
                ID Portefeuille: {wallet.id.slice(0, 8)}...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg font-medium mb-2">Aucune transaction</p>
              <p className="text-sm">Vos transactions apparaîtront ici</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyWallet;
