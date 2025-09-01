
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { toast } from '@/hooks/use-toast';

export interface NotificationData {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  booking_id?: string;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user?.id) {
      console.log('No user found, skipping notification fetch');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Fetching notifications for user:', user.id);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }
      
      console.log('Fetched notifications:', data);
      const notifs = data || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (error: any) {
      console.error('Erreur lors du chargement des notifications:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les notifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;

    try {
      console.log('Marking notification as read:', notificationId);
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error('Erreur lors du marquage comme lu:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer la notification comme lue",
        variant: "destructive"
      });
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      console.log('Marking all notifications as read for user:', user.id);
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
      }
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      
      toast({
        title: "Succès",
        description: "Toutes les notifications ont été marquées comme lues"
      });
    } catch (error: any) {
      console.error('Erreur lors du marquage comme lu:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer toutes les notifications comme lues",
        variant: "destructive"
      });
    }
  };

  // Polling pour les nouvelles notifications au lieu du temps réel
  useEffect(() => {
    if (user?.id) {
      console.log('User authenticated, setting up notifications for:', user.id);
      fetchNotifications();
      
      // Polling toutes les 30 secondes pour les nouvelles notifications
      const pollInterval = setInterval(() => {
        fetchNotifications();
      }, 30000);

      return () => {
        console.log('Cleaning up notification polling');
        clearInterval(pollInterval);
      };
    } else {
      console.log('No user, clearing notifications');
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user?.id]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
};
