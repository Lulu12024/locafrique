
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, ArrowRight, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthStepProps {
  onNext: () => void;
}

export function AuthStep({ onNext }: AuthStepProps) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <User className="h-5 w-5 text-blue-500" />
          Connexion requise
        </CardTitle>
        <p className="text-gray-600">
          Pour continuer votre réservation, vous devez vous connecter ou créer un compte
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h3 className="font-medium text-yellow-800 mb-2">Pourquoi se connecter ?</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Sécuriser votre réservation</li>
            <li>• Générer le contrat de location</li>
            <li>• Suivre l'état de vos réservations</li>
            <li>• Communiquer avec le propriétaire</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild variant="outline" className="flex-1">
            <Link to="/auth?mode=signin">
              <LogIn className="mr-2 h-4 w-4" />
              Se connecter
            </Link>
          </Button>
          <Button asChild className="flex-1">
            <Link to="/auth?mode=signup">
              <User className="mr-2 h-4 w-4" />
              Créer un compte
            </Link>
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Vos données sont sécurisées et ne seront jamais partagées
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
