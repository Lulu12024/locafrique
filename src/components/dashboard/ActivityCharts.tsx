
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp, Calendar } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { useAuth } from "@/hooks/auth";
import { useUserRoles } from "@/hooks/auth/useUserRoles";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ActivityData {
  date: string;
  bookings: number;
  revenue: number;
  views: number;
}

const ActivityCharts: React.FC = () => {
  const { stats, isLoading } = useDashboard();
  const { user, profile } = useAuth();
  const { isProprietaire } = useUserRoles(profile);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    const fetchActivityData = async () => {
      if (!user) return;

      try {
        // Générer les 7 derniers jours
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date.toISOString().split('T')[0];
        });

        // Récupérer les données d'activité
        const activityPromises = last7Days.map(async (date) => {
          const startDate = new Date(date);
          const endDate = new Date(date);
          endDate.setHours(23, 59, 59, 999);

          // Réservations du jour
          let bookingsQuery;
          if (isProprietaire) {
            bookingsQuery = supabase
              .from('bookings')
              .select(`
                *,
                equipment:equipment_id(owner_id)
              `)
              .eq('equipment.owner_id', user.id)
              .gte('created_at', startDate.toISOString())
              .lte('created_at', endDate.toISOString());
          } else {
            bookingsQuery = supabase
              .from('bookings')
              .select('*')
              .eq('renter_id', user.id)
              .gte('created_at', startDate.toISOString())
              .lte('created_at', endDate.toISOString());
          }

          const { data: bookings } = await bookingsQuery;
          const bookingCount = bookings?.length || 0;

          // Revenus du jour (simulation basée sur les réservations)
          const revenue = bookings?.reduce((sum, booking) => sum + (Number(booking.total_price) || 0), 0) || 0;

          // Vues simulées (pour la démo)
          const views = Math.floor(Math.random() * 50) + 10;

          return {
            date: startDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
            bookings: bookingCount,
            revenue: isProprietaire ? revenue : 0,
            views
          };
        });

        const results = await Promise.all(activityPromises);
        setActivityData(results);
      } catch (error) {
        console.error("Erreur lors de la récupération des données d'activité:", error);
      } finally {
        setChartLoading(false);
      }
    };

    fetchActivityData();
  }, [user, isProprietaire]);

  const chartConfig = {
    bookings: {
      label: "Réservations",
      color: "#10b981",
    },
    revenue: {
      label: "Revenus (FCFA)",
      color: "#3b82f6",
    },
    views: {
      label: "Vues",
      color: "#8b5cf6",
    },
  };

  if (isLoading || chartLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-96 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-xl">
          <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
          Graphiques d'activité
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Graphique combiné pour les propriétaires */}
        {isProprietaire && (
          <div className="border rounded-lg p-4">
            <h4 className="text-sm font-medium mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-green-600" />
              Vue d'ensemble de l'activité
            </h4>
            <ChartContainer config={chartConfig} className="h-80">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis fontSize={10} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="bookings" 
                  stroke={chartConfig.bookings.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke={chartConfig.views.color}
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        )}

        {/* Pour les locataires, afficher un graphique simple */}
        {!isProprietaire && (
          <div className="border rounded-lg p-4">
            <h4 className="text-sm font-medium mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-green-600" />
              Activité de navigation
            </h4>
            <ChartContainer config={chartConfig} className="h-80">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis fontSize={10} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke={chartConfig.views.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityCharts;
