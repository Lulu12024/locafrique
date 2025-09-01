
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, TrendingUp, Users, Package } from "lucide-react";
import { useAuth } from "@/hooks/auth";
import { useUserRoles } from "@/hooks/auth/useUserRoles";

const RecentActivity: React.FC = () => {
  const { profile } = useAuth();
  const { isProprietaire } = useUserRoles(profile);

  const activities = isProprietaire ? [
    {
      id: 1,
      type: "booking",
      title: "Nouvelle réservation reçue",
      description: "Pelleteuse hydraulique - Jean Dupont",
      time: "Il y a 2 heures",
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      id: 2,
      type: "revenue",
      title: "Paiement reçu",
      description: "250 000 FCFA - Réservation #12345",
      time: "Il y a 4 heures",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      id: 3,
      type: "review",
      title: "Nouvel avis client",
      description: "5 étoiles sur votre grue mobile",
      time: "Il y a 1 jour",
      icon: Users,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    }
  ] : [
    {
      id: 1,
      type: "booking",
      title: "Réservation confirmée",
      description: "Excavatrice - 3 jours",
      time: "Il y a 1 heure",
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      id: 2,
      type: "payment",
      title: "Paiement effectué",
      description: "150 000 FCFA - Réservation #67890",
      time: "Il y a 3 heures",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      id: 3,
      type: "favorite",
      title: "Nouvel équipement ajouté aux favoris",
      description: "Bulldozer Caterpillar D6T",
      time: "Il y a 2 jours",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center text-lg sm:text-xl">
          <Clock className="h-5 w-5 mr-2 text-green-600" />
          Activité récente
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 sm:space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div className={`p-2 rounded-lg ${activity.bgColor} flex-shrink-0`}>
                <activity.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${activity.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-medium text-gray-900 truncate">
                  {activity.title}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
