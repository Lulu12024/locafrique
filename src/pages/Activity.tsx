
import React from 'react';
import { Activity as ActivityIcon, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Activity = () => {
  const activities = [
    {
      id: 1,
      type: 'booking',
      title: 'Demande de réservation envoyée',
      description: 'Excavatrrice CAT 320D',
      time: 'Il y a 2 heures',
      status: 'pending',
    },
    {
      id: 2,
      type: 'favorite',
      title: 'Ajouté aux favoris',
      description: 'Pelleteuse Volvo EC200D',
      time: 'Il y a 1 jour',
      status: 'completed',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'completed':
        return 'Terminé';
      default:
        return 'Inconnu';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Mon Activité</h1>
          <p className="text-gray-600">Suivez vos actions récentes</p>
        </div>

        {/* Activities List */}
        <div className="space-y-4">
          {activities.map((activity) => (
            <Card key={activity.id}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {activity.type === 'booking' ? (
                      <Clock className="h-5 w-5 text-blue-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {activity.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {activity.time}
                      </span>
                      <Badge className={getStatusColor(activity.status)}>
                        {getStatusText(activity.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State si pas d'activités */}
        {activities.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <ActivityIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucune activité récente
              </h3>
              <p className="text-gray-600">
                Vos actions récentes apparaîtront ici
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Activity;
