
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth";
import { useUserRoles } from "@/hooks/auth/useUserRoles";
import { useDashboard } from "@/hooks/useDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardAnalytics from "@/components/dashboard/DashboardAnalytics";
import { 
  BarChart3, 
  Truck, 
  ShoppingCart, 
  Wallet, 
  Plus,
  TrendingUp,
  Users,
  Calendar
} from "lucide-react";

const Overview: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, authCheckComplete } = useAuth();
  const { isProprietaire } = useUserRoles(profile);
  const { stats, isLoading } = useDashboard();

  // Redirect if not logged in and auth check is complete
  React.useEffect(() => {
    if (!user && authCheckComplete) {
      navigate("/auth");
    }
  }, [user, navigate, authCheckComplete]);

  // Show loading state
  if (!authCheckComplete || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-equipment':
        navigate('/my-equipments');
        break;
      case 'view-bookings':
        navigate('/my-bookings');
        break;
      case 'view-rentals':
        navigate('/my-bookings');
        break;
      case 'wallet':
        navigate('/my-wallet');
        break;
      case 'search':
        navigate('/search');
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Vue d'ensemble
          </h1>
          <p className="text-gray-600">
            Bienvenue, {profile?.first_name} {profile?.last_name}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isProprietaire ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Mes équipements</CardTitle>
                  <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading ? "..." : stats?.equipmentCount || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Réservations</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading ? "..." : stats?.bookingCount || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenus du mois</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading ? "..." : `${stats?.revenue || 0} FCFA`}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Portefeuille</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading ? "..." : "0 FCFA"}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Mes locations</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading ? "..." : stats?.bookingCount || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Dépenses du mois</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading ? "..." : `${stats?.expenses || 0} FCFA`}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Favoris</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Portefeuille</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0 FCFA</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {isProprietaire ? (
                <>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center p-6 h-auto"
                    onClick={() => handleQuickAction('add-equipment')}
                  >
                    <Plus className="h-8 w-8 mb-2" />
                    <span>Ajouter équipement</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center p-6 h-auto"
                    onClick={() => handleQuickAction('view-bookings')}
                  >
                    <Calendar className="h-8 w-8 mb-2" />
                    <span>Mes réservations</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center p-6 h-auto"
                    onClick={() => handleQuickAction('wallet')}
                  >
                    <Wallet className="h-8 w-8 mb-2" />
                    <span>Portefeuille</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center p-6 h-auto"
                    onClick={() => navigate('/messaging')}
                  >
                    <Users className="h-8 w-8 mb-2" />
                    <span>Messages</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center p-6 h-auto"
                    onClick={() => handleQuickAction('search')}
                  >
                    <BarChart3 className="h-8 w-8 mb-2" />
                    <span>Rechercher</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center p-6 h-auto"
                    onClick={() => handleQuickAction('view-rentals')}
                  >
                    <ShoppingCart className="h-8 w-8 mb-2" />
                    <span>Mes locations</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center p-6 h-auto"
                    onClick={() => handleQuickAction('wallet')}
                  >
                    <Wallet className="h-8 w-8 mb-2" />
                    <span>Portefeuille</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center p-6 h-auto"
                    onClick={() => navigate('/messaging')}
                  >
                    <Users className="h-8 w-8 mb-2" />
                    <span>Messages</span>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Onglets pour vues détaillées */}
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="activity">Activité récente</TabsTrigger>
            <TabsTrigger value="analytics">Analyses</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Activité récente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <p>Aucune activité récente</p>
                  <p className="text-sm mt-2">
                    Vos dernières actions apparaîtront ici
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4 mt-6">
            <DashboardAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Overview;
