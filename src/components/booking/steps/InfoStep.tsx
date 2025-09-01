
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ArrowRight, AlertTriangle } from 'lucide-react';
import { ProfileCompletionForm } from '../ProfileCompletionForm';
import { useAuth } from '@/hooks/auth';

interface InfoStepProps {
  onNext: () => void;
  onShowProfileForm: () => void;
  showProfileForm: boolean;
  onProfileComplete: () => void;
}

export function InfoStep({ onNext, onShowProfileForm, showProfileForm, onProfileComplete }: InfoStepProps) {
  const { profile } = useAuth();
  
  const isProfileComplete = profile && 
    profile.first_name && 
    profile.last_name && 
    profile.phone_number && 
    profile.address && 
    profile.city && 
    profile.country && 
    profile.id_number;

  if (showProfileForm) {
    return (
      <div className="max-w-2xl mx-auto">
        <ProfileCompletionForm
          onComplete={onProfileComplete}
          onCancel={() => onShowProfileForm()}
        />
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Check className="h-5 w-5 text-blue-500" />
          Vérification de vos informations
        </CardTitle>
        <p className="text-gray-600">
          Ces informations sont nécessaires pour établir le contrat de location
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {isProfileComplete ? (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 mb-3">
              <Check className="h-5 w-5" />
              <span className="font-medium">Profil complet</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Nom complet:</span>
                <p className="font-medium">{profile?.first_name} {profile?.last_name}</p>
              </div>
              <div>
                <span className="text-gray-600">Téléphone:</span>
                <p className="font-medium">{profile?.phone_number}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Adresse:</span>
                <p className="font-medium">
                  {profile?.address}, {profile?.city}, {profile?.country}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Pièce d'identité:</span>
                <p className="font-medium">{profile?.id_number}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-700 mb-3">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Informations incomplètes</span>
            </div>
            <p className="text-sm text-yellow-600 mb-4">
              Vous devez compléter vos informations personnelles pour générer le contrat de location.
            </p>
            <Button onClick={onShowProfileForm} variant="outline" className="w-full">
              Compléter mes informations
            </Button>
          </div>
        )}

        {isProfileComplete && (
          <div className="flex justify-end">
            <Button onClick={onNext} className="min-w-32">
              Continuer
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
