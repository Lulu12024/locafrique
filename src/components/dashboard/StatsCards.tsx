
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, ShoppingBag, DollarSign } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { useAuth } from "@/hooks/auth";
import { useUserRoles } from "@/hooks/auth/useUserRoles";

const StatsCards: React.FC = () => {
  const { stats, isLoading } = useDashboard();
  const { profile } = useAuth();
  const { isProprietaire } = useUserRoles(profile);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 sm:p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = isProprietaire ? [
    {
      title: "Revenus totaux",
      value: `${stats?.totalRevenue || 0} FCFA`,
      icon: DollarSign,
      trend: "+12%",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Équipements",
      value: stats?.totalEquipments || 0,
      icon: TrendingUp,
      trend: "+2%",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Réservations",
      value: stats?.totalBookings || 0,
      icon: ShoppingBag,
      trend: "+8%",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Clients actifs",
      value: stats?.activeClients || 0,
      icon: Users,
      trend: "+5%",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ] : [
    {
      title: "Mes locations",
      value: stats?.myRentals || 0,
      icon: ShoppingBag,
      trend: "+3%",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Dépenses",
      value: `${stats?.totalSpent || 0} FCFA`,
      icon: DollarSign,
      trend: "+15%",
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "Équipements favoris",
      value: stats?.favoriteEquipments || 0,
      icon: TrendingUp,
      trend: "+1%",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Évaluations",
      value: stats?.myReviews || 0,
      icon: Users,
      trend: "+2%",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                  {card.title}
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                  {card.value}
                </p>
                <p className={`text-xs sm:text-sm ${card.color} mt-1`}>
                  {card.trend} ce mois
                </p>
              </div>
              <div className={`p-2 sm:p-3 rounded-lg ${card.bgColor} flex-shrink-0`}>
                <card.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
