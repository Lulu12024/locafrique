
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Wallet, CreditCard, History, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const WalletPanel: React.FC = () => {
  const { wallet, loading, reloadWallet } = useWallet();
  const { toast } = useToast();
  
  const handleDeposit = () => {
    toast({
      title: "Fonctionnalité à venir",
      description: "Le dépôt de fonds sera bientôt disponible.",
    });
  };
  
  const handleWithdraw = () => {
    toast({
      title: "Fonctionnalité à venir",
      description: "Le retrait de fonds sera bientôt disponible.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wallet className="h-5 w-5 mr-2" />
          Mon portefeuille
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
            </div>
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-terracotta to-ocean rounded-lg p-5 mb-4 text-white">
              <div className="mb-1 text-sm opacity-80">Solde disponible</div>
              <div className="text-3xl font-bold mb-4">
                {wallet?.balance?.toLocaleString()} FCFA
              </div>
              <div className="flex items-center text-xs opacity-80">
                <CreditCard className="h-3 w-3 mr-1" />
                ID: {wallet?.id ? wallet.id.substring(0, 8) + '...' : 'Non disponible'}
              </div>
            </div>
            
            <div className="flex gap-2 mb-6">
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700" 
                onClick={handleDeposit}
              >
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Déposer
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-50"
                onClick={handleWithdraw}
              >
                <ArrowDownCircle className="h-4 w-4 mr-2" />
                Retirer
              </Button>
            </div>
            
            <div>
              <div className="flex items-center mb-3">
                <History className="h-4 w-4 mr-2 text-muted-foreground" />
                <h3 className="text-sm font-medium">Transactions récentes</h3>
              </div>
              
              <div className="text-center py-6 text-muted-foreground">
                <p>Aucune transaction récente</p>
                <p className="text-xs mt-1">Les transactions s'afficheront ici</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletPanel;
