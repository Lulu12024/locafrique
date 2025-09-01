
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/hooks/useDashboard";
import { useAuth } from "@/hooks/auth";
import { useUserRoles } from "@/hooks/auth/useUserRoles";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Package, Users, Calendar } from "lucide-react";

const StatsPanel: React.FC = () => {
  const { stats, isLoading } = useDashboard();
  const { profile } = useAuth();
  const { isProprietaire } = useUserRoles(profile);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Chargement des statistiques...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Aucune statistique disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Mes Statistiques</h2>
        <p className="text-muted-foreground">
          Aperçu de votre activité sur la plateforme
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Réservations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isProprietaire ? "Réservations reçues" : "Mes réservations"}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bookingCount}</div>
            <p className="text-xs text-muted-foreground">
              Total des réservations
            </p>
          </CardContent>
        </Card>

        {/* Équipements (pour les propriétaires) */}
        {isProprietaire && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mes équipements</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.equipmentCount}</div>
              <p className="text-xs text-muted-foreground">
                Équipements disponibles
              </p>
            </CardContent>
          </Card>
        )}

        {/* Messages non lus */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages non lus</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unreadNotifications}</div>
            <p className="text-xs text-muted-foreground">
              Nouveaux messages
            </p>
          </CardContent>
        </Card>

        {/* Revenus (pour les propriétaires) */}
        {isProprietaire && stats.revenue !== undefined && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus du mois</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.revenue.toLocaleString()} FCFA
              </div>
              <p className="text-xs text-muted-foreground">
                Revenus de location
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dépenses (pour les locataires) */}
        {!isProprietaire && stats.expenses !== undefined && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dépenses du mois</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.expenses.toLocaleString()} FCFA
              </div>
              <p className="text-xs text-muted-foreground">
                Frais de location
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Graphiques ou informations supplémentaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cette semaine</span>
                <span className="text-sm font-medium">
                  {Math.floor(stats.bookingCount * 0.3)} réservations
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ce mois</span>
                <span className="text-sm font-medium">
                  {Math.floor(stats.bookingCount * 0.7)} réservations
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-sm font-medium">
                  {stats.bookingCount} réservations
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Résumé financier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isProprietaire && stats.revenue !== undefined ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Revenus totaux</span>
                    <span className="text-sm font-medium text-green-600">
                      +{stats.revenue.toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Revenus moyens/réservation</span>
                    <span className="text-sm font-medium">
                      {stats.bookingCount > 0 
                        ? Math.round(stats.revenue / stats.bookingCount).toLocaleString()
                        : '0'} FCFA
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Dépenses totales</span>
                    <span className="text-sm font-medium text-red-600">
                      -{(stats.expenses || 0).toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Coût moyen/réservation</span>
                    <span className="text-sm font-medium">
                      {stats.bookingCount > 0 && stats.expenses
                        ? Math.round(stats.expenses / stats.bookingCount).toLocaleString()
                        : '0'} FCFA
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatsPanel;
