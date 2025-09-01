
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/auth';
import { useBookingProcess } from '@/hooks/useBookingProcess';
import { BookingData, EquipmentData } from '@/types/supabase';
import { addDays } from 'date-fns';
import { BookingSteps } from './BookingSteps';
import { DatesStep } from './steps/DatesStep';
import { AuthStep } from './steps/AuthStep';
import { InfoStep } from './steps/InfoStep';
import { ContractStep } from './steps/ContractStep';
import { ConfirmationStep } from './steps/ConfirmationStep';

interface ImprovedBookingFlowProps {
  equipment: EquipmentData;
  onComplete?: () => void;
}

export function ImprovedBookingFlow({ equipment, onComplete }: ImprovedBookingFlowProps) {
  const { user, profile, refreshProfile, loading: authLoading, authCheckComplete } = useAuth();
  const { createBooking } = useBookingProcess();
  
  const [currentStep, setCurrentStep] = useState<string>('dates');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [booking, setBooking] = useState<BookingData | null>(null);
  
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to?: Date;
  }>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });

  // Auto-advance to appropriate step based on auth state
  useEffect(() => {
    if (authCheckComplete && currentStep === 'auth') {
      if (user) {
        handleStepComplete('auth');
        setCurrentStep('info');
      }
    }
  }, [authCheckComplete, user, currentStep]);

  const handleStepComplete = (step: string) => {
    setCompletedSteps(prev => {
      if (!prev.includes(step)) {
        return [...prev, step];
      }
      return prev;
    });
  };

  const handleDatesNext = () => {
    handleStepComplete('dates');
    if (user) {
      setCurrentStep('info');
    } else {
      setCurrentStep('auth');
    }
  };

  const handleAuthNext = () => {
    handleStepComplete('auth');
    setCurrentStep('info');
  };

  const handleInfoNext = async () => {
    if (dateRange.from && dateRange.to) {
      const rentalDays = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      const result = await createBooking(
        equipment.id,
        dateRange.from,
        dateRange.to,
        rentalDays
      );
      
      if (result) {
        setBooking(result);
        handleStepComplete('info');
        setCurrentStep('contract');
      }
    }
  };

  const handleContractNext = () => {
    handleStepComplete('contract');
    setCurrentStep('confirmation');
  };

  const handleProfileComplete = async () => {
    setShowProfileForm(false);
    await refreshProfile();
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'dates':
        return (
          <DatesStep
            dateRange={dateRange}
            setDateRange={setDateRange}
            onNext={handleDatesNext}
          />
        );
      
      case 'auth':
        return <AuthStep onNext={handleAuthNext} />;
      
      case 'info':
        return (
          <InfoStep
            onNext={handleInfoNext}
            onShowProfileForm={() => setShowProfileForm(true)}
            showProfileForm={showProfileForm}
            onProfileComplete={handleProfileComplete}
          />
        );
      
      case 'contract':
        if (!booking) return null;
        return (
          <ContractStep
            booking={booking}
            onNext={handleContractNext}
          />
        );
      
      case 'confirmation':
        if (!booking) return null;
        return (
          <ConfirmationStep
            booking={booking}
            onContactOwner={() => console.log('Contact owner')}
            onViewContract={() => setCurrentStep('contract')}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-center mb-2">
            Réserver {equipment.title}
          </h1>
          <p className="text-gray-600 text-center">
            Suivez les étapes pour finaliser votre réservation
          </p>
        </div>

        <BookingSteps
          currentStep={currentStep}
          completedSteps={completedSteps}
        />

        <div className="max-w-4xl mx-auto">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
}
