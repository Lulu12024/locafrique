
import React, { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboard } from "@/hooks/useDashboard";
import { Loader2 } from "lucide-react";

// Optimisé avec memo pour éviter les rendus inutiles
const DashboardStats: React.FC = memo(() => {
  const { stats, isLoading } = useDashboard();

  // Afficher un état de chargement léger au lieu d'un squelette complet
  if (isLoading) {
    return (
      <Card className="mt-4">
        <CardContent className="p-3">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Chargement des statistiques...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null; // Ne rien afficher si pas de données
  }

  return (
    <Card className="mt-4">
      <CardContent className="p-3">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="py-2 px-1 border-r">
            <p className="text-sm text-muted-foreground">Réservations</p>
            <p className="text-lg font-medium">{stats.bookingCount}</p>
          </div>
          <div className="py-2 px-1">
            <p className="text-sm text-muted-foreground">Équipements</p>
            <p className="text-lg font-medium">{stats.equipmentCount}</p>
          </div>
          {stats.revenue !== undefined && (
            <div className="py-2 px-1 border-t border-r">
              <p className="text-sm text-muted-foreground">Revenus du mois</p>
              <p className="text-lg font-medium">{stats.revenue.toLocaleString()} FCFA</p>
            </div>
          )}
          {stats.expenses !== undefined && (
            <div className="py-2 px-1 border-t">
              <p className="text-sm text-muted-foreground">Dépenses du mois</p>
              <p className="text-lg font-medium">{stats.expenses.toLocaleString()} FCFA</p>
            </div>
          )}
          <div className="py-2 px-1 border-t col-span-2">
            <p className="text-sm text-muted-foreground">Notifications non lues</p>
            <p className="text-lg font-medium">{stats.unreadNotifications}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

DashboardStats.displayName = "DashboardStats";

export default DashboardStats;
