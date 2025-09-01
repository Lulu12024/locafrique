
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Shield, Users, BarChart3, Megaphone } from "lucide-react";

const SubscriptionPanel: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg">
          <Crown className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Abonnement Premium</h1>
          <p className="text-gray-600">Débloquez tout le potentiel de votre activité</p>
        </div>
        <Badge variant="secondary" className="ml-auto">
          Nouveau
        </Badge>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Plan Gratuit */}
        <Card className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Plan Gratuit</CardTitle>
              <Badge variant="outline">Actuel</Badge>
            </div>
            <div className="text-3xl font-bold">0 FCFA</div>
            <p className="text-sm text-gray-600">Pour commencer</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Jusqu'à 3 équipements</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Gestion des réservations</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Support par email</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full" disabled>
              Plan actuel
            </Button>
          </CardContent>
        </Card>

        {/* Plan Premium */}
        <Card className="relative border-2 border-gradient-to-r from-yellow-400 to-orange-500 shadow-lg">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
              Recommandé
            </Badge>
          </div>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Plan Premium
              </CardTitle>
            </div>
            <div className="text-3xl font-bold">3,150 FCFA</div>
            <p className="text-sm text-gray-600">par mois</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Tous les avantages du plan gratuit</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Équipements illimités</span>
              </li>
              <li className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Mise en avant prioritaire</span>
              </li>
              <li className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Analyses avancées</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm">Support prioritaire 24/7</span>
              </li>
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-500" />
                <span className="text-sm">Gestion multi-utilisateurs</span>
              </li>
              <li className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Publicité illimitée</span>
              </li>
            </ul>
            <Button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600">
              Passer à Premium
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Fonctionnalités détaillées */}
      <Card>
        <CardHeader>
          <CardTitle>Pourquoi passer à Premium ?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Visibilité accrue</h3>
                  <p className="text-sm text-gray-600">
                    Vos équipements apparaissent en priorité dans les résultats de recherche
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Analyses détaillées</h3>
                  <p className="text-sm text-gray-600">
                    Tableaux de bord avancés pour optimiser vos revenus
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Megaphone className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Publicité illimitée</h3>
                  <p className="text-sm text-gray-600">
                    Boostez vos équipements sans limite de budget publicitaire
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Support prioritaire</h3>
                  <p className="text-sm text-gray-600">
                    Assistance dédiée disponible 24h/24 et 7j/7
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Gestion d'équipe</h3>
                  <p className="text-sm text-gray-600">
                    Ajoutez des collaborateurs pour gérer vos équipements
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Questions fréquentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium">Puis-je annuler à tout moment ?</h4>
              <p className="text-sm text-gray-600">
                Oui, vous pouvez annuler votre abonnement à tout moment depuis cette page.
              </p>
            </div>
            <div>
              <h4 className="font-medium">Que se passe-t-il si j'annule ?</h4>
              <p className="text-sm text-gray-600">
                Vous conservez l'accès aux fonctionnalités Premium jusqu'à la fin de votre période de facturation.
              </p>
            </div>
            <div>
              <h4 className="font-medium">Y a-t-il une période d'essai ?</h4>
              <p className="text-sm text-gray-600">
                Oui, profitez de 14 jours d'essai gratuit pour tester toutes les fonctionnalités Premium.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionPanel;
