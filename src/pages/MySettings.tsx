
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, User, Bell, Shield, ArrowLeft } from "lucide-react";

const MySettings: React.FC = () => {
  const navigate = useNavigate();

  const settingsCategories = [
    {
      title: "Profil",
      description: "Gérez vos informations personnelles",
      icon: User,
      onClick: () => navigate('/dashboard?tab=profile')
    },
    {
      title: "Notifications",
      description: "Configurez vos préférences de notification",
      icon: Bell,
      onClick: () => {}
    },
    {
      title: "Sécurité",
      description: "Mot de passe et authentification",
      icon: Shield,
      onClick: () => {}
    }
  ];

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
            <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
            <p className="text-gray-600">Personnalisez votre expérience</p>
          </div>
        </div>

        {/* Settings Categories */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {settingsCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={category.onClick}
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Icon className="h-5 w-5 text-green-600" />
                    </div>
                    <span>{category.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{category.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MySettings;
