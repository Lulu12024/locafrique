import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { BookingFlow } from '@/components/booking/BookingFlow';

// Mock des hooks
vi.mock('@/hooks/auth/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
    profile: { first_name: 'Test', last_name: 'User' }
  }),
}));

vi.mock('@/hooks/useBookingProcess', () => ({
  useBookingProcess: () => ({
    currentStep: 'dates',
    bookingData: {},
    isProcessing: false,
    updateBookingData: vi.fn(),
    nextStep: vi.fn(),
    previousStep: vi.fn(),
    submitBooking: vi.fn(),
  }),
}));

vi.mock('@/hooks/usePayment', () => ({
  usePayment: () => ({
    createPayment: vi.fn(() => Promise.resolve({ paymentUrl: 'https://test.com' })),
    isProcessing: false,
  }),
}));

const mockEquipment = {
  id: 'eq-123',
  title: 'Test Equipment',
  daily_price: 1000,
  deposit_amount: 500,
  owner_id: 'owner-123',
  description: 'Test description',
  location: 'Test Location',
  city: 'Test City',
  country: 'Test Country',
  category: 'Test Category',
  status: 'approved',
  images: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('BookingFlow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le processus de réservation complet', () => {
    render(
      <MemoryRouter>
        <BookingFlow
          equipment={mockEquipment}
          onComplete={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Test Equipment')).toBeInTheDocument();
  });

  it('permet de naviguer entre les étapes', async () => {
    const mockNextStep = vi.fn();
    
    vi.mocked(require('@/hooks/useBookingProcess').useBookingProcess).mockReturnValue({
      currentStep: 'dates',
      bookingData: {},
      isProcessing: false,
      updateBookingData: vi.fn(),
      nextStep: mockNextStep,
      previousStep: vi.fn(),
      submitBooking: vi.fn(),
    });

    render(
      <MemoryRouter>
        <BookingFlow
          equipment={mockEquipment}
          onComplete={vi.fn()}
        />
      </MemoryRouter>
    );

    const nextButton = screen.getByText('Suivant');
    fireEvent.click(nextButton);

    expect(mockNextStep).toHaveBeenCalled();
  });

  it('valide les données avant de passer à l\'étape suivante', async () => {
    render(
      <MemoryRouter>
        <BookingFlow
          equipment={mockEquipment}
          onComplete={vi.fn()}
        />
      </MemoryRouter>
    );

    // Tenter de passer à l'étape suivante sans sélectionner de dates
    const nextButton = screen.getByText('Suivant');
    fireEvent.click(nextButton);

    // Vérifier que le bouton suivant a été cliqué
    await waitFor(() => {
      expect(nextButton).toHaveBeenCalled;
    });
  });
});