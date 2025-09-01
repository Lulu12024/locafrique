
import React from 'react';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  label: string;
  description: string;
}

interface BookingStepsProps {
  currentStep: string;
  completedSteps: string[];
}

const steps: Step[] = [
  {
    id: 'dates',
    label: 'Dates',
    description: 'Sélectionner les dates'
  },
  {
    id: 'auth',
    label: 'Connexion',
    description: 'Se connecter ou s\'inscrire'
  },
  {
    id: 'info',
    label: 'Informations',
    description: 'Compléter vos informations'
  },
  {
    id: 'contract',
    label: 'Contrat',
    description: 'Valider le contrat'
  },
  {
    id: 'confirmation',
    label: 'Confirmation',
    description: 'Réservation confirmée'
  }
];

export function BookingSteps({ currentStep, completedSteps }: BookingStepsProps) {
  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isUpcoming = !isCompleted && !isCurrent;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    {
                      "bg-green-500 border-green-500 text-white": isCompleted,
                      "bg-blue-500 border-blue-500 text-white": isCurrent,
                      "bg-gray-100 border-gray-300 text-gray-400": isUpcoming,
                    }
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" fill="currentColor" />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div
                    className={cn(
                      "text-sm font-medium transition-colors",
                      {
                        "text-green-600": isCompleted,
                        "text-blue-600": isCurrent,
                        "text-gray-400": isUpcoming,
                      }
                    )}
                  >
                    {step.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 max-w-20">
                    {step.description}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4 transition-colors",
                    {
                      "bg-green-500": completedSteps.includes(steps[index + 1]?.id),
                      "bg-gray-200": !completedSteps.includes(steps[index + 1]?.id),
                    }
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
