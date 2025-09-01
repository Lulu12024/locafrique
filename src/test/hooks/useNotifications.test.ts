import { renderHook } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useNotifications } from '@/hooks/useNotifications';

// Mock de useAuth
const mockUser = { id: 'user-123' };
vi.mock('@/hooks/auth/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock de supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => Promise.resolve({ 
      data: [
        {
          id: '1',
          title: 'Test',
          message: 'Test message',
          read: false,
          created_at: new Date().toISOString(),
          type: 'booking_request'
        }
      ], 
      error: null 
    })),
    update: vi.fn(() => Promise.resolve({ data: [], error: null })),
    eq: vi.fn(() => ({ eq: vi.fn() })),
    order: vi.fn(() => ({ limit: vi.fn() })),
    limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
  })),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('charge les notifications au montage', async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.unreadCount).toBe(1);
  });

  it('marque une notification comme lue', async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.markAsRead('1');

    expect(mockSupabase.from().update).toHaveBeenCalledWith({ read: true });
  });

  it('marque toutes les notifications comme lues', async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.markAllAsRead();

    expect(mockSupabase.from().update).toHaveBeenCalledWith({ read: true });
  });
});