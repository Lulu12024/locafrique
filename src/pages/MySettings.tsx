// src/pages/MySettings.tsx - Version mise à jour
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Bell, Shield, ArrowLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const MySettings: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const settingsCategories = [
    {
      title: "Profil",
      description: "Gérez vos informations personnelles",
      icon: User,
      onClick: () => navigate('/settings/profile'),
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Notifications",
      description: "Configurez vos préférences de notification",
      icon: Bell,
      onClick: () => navigate('/settings/notifications'),
      color: "text-green-600", 
      bgColor: "bg-green-100"
    },
    {
      title: "Sécurité",
      description: "Mot de passe et authentification",
      icon: Shield,
      onClick: () => navigate('/settings/security'),
      color: "text-red-600",
      bgColor: "bg-red-100"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {isMobile ? (
        // VERSION MOBILE
        <div>
          {/* Header mobile */}
          <div className="bg-white border-b border-gray-200 px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Paramètres</h1>
                <p className="text-sm text-gray-600">Personnalisez votre expérience</p>
              </div>
            </div>
          </div>

          {/* Settings categories mobile */}
          <div className="p-4 space-y-3">
            {settingsCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={category.onClick}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${category.bgColor} rounded-full flex items-center justify-center`}>
                          <Icon className={`h-6 w-6 ${category.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{category.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        // VERSION DESKTOP
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header desktop */}
          <div className="flex items-center gap-6 mb-8">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
              <p className="text-gray-600">Personnalisez votre expérience sur 3W-LOC</p>
            </div>
          </div>

          {/* Settings categories desktop */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl">
            {settingsCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                  onClick={category.onClick}
                >
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-4">
                      <div className={`w-14 h-14 ${category.bgColor} rounded-xl flex items-center justify-center`}>
                        <Icon className={`h-7 w-7 ${category.color}`} />
                      </div>
                      <span className="text-xl">{category.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-600 mb-4">{category.description}</p>
                    <div className="flex items-center text-sm text-blue-600 font-medium">
                      <span>Configurer</span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Additional info desktop */}
          <div className="mt-12 p-6 bg-blue-50 rounded-xl border border-blue-200">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Besoin d'aide ?</h2>
            <p className="text-blue-800 mb-4">
              Si vous avez des questions sur la configuration de vos paramètres, consultez notre centre d'aide 
              ou contactez notre équipe de support.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="bg-white hover:bg-blue-50">
                Centre d'aide
              </Button>
              <Button variant="outline" className="bg-white hover:bg-blue-50">
                Contacter le support
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySettings;