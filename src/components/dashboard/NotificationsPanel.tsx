
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X, Calendar, MessageSquare, Truck } from "lucide-react";

const NotificationsPanel: React.FC = () => {
  const notifications = [
    {
      id: 1,
      type: "booking",
      title: "Nouvelle demande de réservation",
      message: "Jean Dupont souhaite louer votre pelleteuse pour 3 jours",
      time: "Il y a 2 heures",
      unread: true,
      icon: Calendar
    },
    {
      id: 2,
      type: "message",
      title: "Nouveau message",
      message: "Marie Martin a envoyé un message concernant la location",
      time: "Il y a 4 heures",
      unread: true,
      icon: MessageSquare
    },
    {
      id: 3,
      type: "equipment",
      title: "Équipement approuvé",
      message: "Votre tracteur a été approuvé et est maintenant visible",
      time: "Hier",
      unread: false,
      icon: Truck
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Bell className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-gray-600">Restez informé de toute l'activité</p>
        </div>
        <Badge variant="secondary" className="ml-auto">
          {notifications.filter(n => n.unread).length} nouvelles
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <Check className="h-4 w-4 mr-2" />
          Marquer tout comme lu
        </Button>
        <Button variant="outline" size="sm">
          <X className="h-4 w-4 mr-2" />
          Supprimer tout
        </Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card key={notification.id} className={`${notification.unread ? 'border-blue-200 bg-blue-50/50' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${notification.unread ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <notification.icon className={`h-5 w-5 ${notification.unread ? 'text-blue-600' : 'text-gray-600'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{notification.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                    </div>
                    {notification.unread && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state si aucune notification */}
      {notifications.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune notification</h3>
            <p className="text-gray-600">Vous êtes à jour ! Aucune nouvelle notification.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotificationsPanel;
