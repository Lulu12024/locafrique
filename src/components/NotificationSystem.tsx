import React, { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useMobileNotifications } from '@/hooks/useMobileNotifications';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';

export function NotificationSystem() {
  const { user } = useAuth();
  const { notifications, loadNotifications } = useNotifications(); // ✅ Changé refetch en loadNotifications
  const { sendLocalNotification, isNative } = useMobileNotifications();

  useEffect(() => {
    if (!user?.id) return;

    try {
      // Écouter les nouvelles notifications en temps réel
      const channel = supabase
        .channel('notifications_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          async (payload) => {
            console.log('Nouvelle notification reçue:', payload);
            
            const notification = payload.new;
            
            // Afficher la notification immédiatement
            if (isNative) {
              // Notification native sur mobile
              try {
                await sendLocalNotification(
                  notification.title,
                  notification.message,
                  { 
                    type: notification.type,
                    booking_id: notification.booking_id,
                    id: notification.id
                  }
                );
              } catch (error) {
                console.log('Erreur notification native:', error);
              }
            } else {
              // Toast sur web
              toast({
                title: notification.title,
                description: notification.message,
                duration: 5000
              });
            }
            
            // Rafraîchir la liste des notifications
            loadNotifications(); // ✅ Changé refetch() en loadNotifications()
          }
        );

      // S'abonner au channel
      channel.subscribe();

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.log('Erreur lors de la déconnexion du channel:', error);
        }
      };
    } catch (error) {
      console.log('Erreur lors de la configuration des notifications en temps réel:', error);
    }
  }, [user?.id, loadNotifications, sendLocalNotification, isNative]); // ✅ Changé refetch en loadNotifications dans les dépendances

  // Ce composant ne rend rien visuellement, il gère seulement les notifications
  return null;
}