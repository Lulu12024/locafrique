import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import NotificationBell from '@/components/NotificationBell';

// Mock du hook useNotifications
const mockUseNotifications = {
  notifications: [
    {
      id: '1',
      title: 'Test Notification',
      message: 'Test message',
      read: false,
      created_at: new Date().toISOString(),
      type: 'booking_request'
    }
  ],
  unreadCount: 1,
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  loading: false
};

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => mockUseNotifications,
}));

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le nombre de notifications non lues', () => {
    render(<NotificationBell />);
    
    const badge = screen.getByText('1');
    expect(badge).toBeInTheDocument();
  });

  it('affiche les notifications dans le popover', async () => {
    render(<NotificationBell />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test Notification')).toBeInTheDocument();
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  it('marque une notification comme lue au clic', async () => {
    render(<NotificationBell />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      const notification = screen.getByText('Test Notification');
      fireEvent.click(notification);
    });

    expect(mockUseNotifications.markAsRead).toHaveBeenCalledWith('1');
  });

  it('marque toutes les notifications comme lues', async () => {
    render(<NotificationBell />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    await waitFor(() => {
      const markAllButton = screen.getByText('Tout marquer comme lu');
      fireEvent.click(markAllButton);
    });

    expect(mockUseNotifications.markAllAsRead).toHaveBeenCalled();
  });

  it('affiche un état de chargement', () => {
    vi.mocked(mockUseNotifications).loading = true;
    
    render(<NotificationBell />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('affiche un état vide quand il n\'y a pas de notifications', () => {
    vi.mocked(mockUseNotifications).notifications = [];
    vi.mocked(mockUseNotifications).unreadCount = 0;
    
    render(<NotificationBell />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    expect(screen.getByText('Aucune notification')).toBeInTheDocument();
  });
});