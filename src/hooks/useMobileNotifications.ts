import { useState, useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { useMobileCapabilities } from './useMobileCapabilities';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { toast } from '@/hooks/use-toast';

export interface NotificationPermissions {
  push: boolean;
  local: boolean;
}

export const useMobileNotifications = () => {
  const { isNative } = useMobileCapabilities();
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<NotificationPermissions>({
    push: false,
    local: false
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialiser les notifications natives
  const initializeNotifications = async () => {
    if (!isNative) return;

    try {
      // Demander les permissions
      const pushPermission = await PushNotifications.requestPermissions();
      const localPermission = await LocalNotifications.requestPermissions();

      setPermissions({
        push: pushPermission.receive === 'granted',
        local: localPermission.display === 'granted'
      });

      if (pushPermission.receive === 'granted') {
        // Enregistrer pour les notifications push
        await PushNotifications.register();
      }

      // Configurer les écouteurs
      setupNotificationListeners();
      setIsInitialized(true);

    } catch (error) {
      console.error('Erreur lors de l\'initialisation des notifications:', error);
    }
  };

  // Configurer les écouteurs de notifications
  const setupNotificationListeners = () => {
    if (!isNative) return;

    // Notification push reçue
    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('Notification push reçue:', notification);
      
      // Vibration pour attirer l'attention
      await Haptics.impact({ style: ImpactStyle.Medium });
      
      // Afficher une notification locale si l'app est au premier plan
      if (permissions.local) {
        await LocalNotifications.schedule({
          notifications: [{
            title: notification.title || 'Nouvelle notification',
            body: notification.body || '',
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 100) },
            sound: 'default',
            attachments: notification.data?.image ? [{ id: 'image', url: notification.data.image }] : undefined,
            actionTypeId: '',
            extra: notification.data
          }]
        });
      }
    });

    // Action sur notification push
    PushNotifications.addListener('pushNotificationActionPerformed', async (action) => {
      console.log('Action sur notification push:', action);
      await handleNotificationAction(action.notification.data);
    });

    // Action sur notification locale
    LocalNotifications.addListener('localNotificationActionPerformed', async (action) => {
      console.log('Action sur notification locale:', action);
      await handleNotificationAction(action.notification.extra);
    });

    // Token d'enregistrement
    PushNotifications.addListener('registration', async (token) => {
      console.log('Token push reçu:', token.value);
      
      // Sauvegarder le token dans la base de données
      if (user?.id) {
        await savePushToken(token.value);
      }
    });

    // Erreur d'enregistrement
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Erreur d\'enregistrement push:', error);
    });
  };

  // Sauvegarder le token push dans la base de données
  const savePushToken = async (token: string) => {
    if (!user?.id) return;

    try {
      // Temporairement commenté en attendant la mise à jour des types
      console.log('Token push à sauvegarder:', token, 'pour utilisateur:', user.id);
      // const { error } = await supabase
      //   .from('user_push_tokens')
      //   .upsert({
      //     user_id: user.id,
      //     token: token,
      //     platform: Capacitor.getPlatform(),
      //     updated_at: new Date().toISOString()
      //   });

      // if (error) {
      //   console.error('Erreur lors de la sauvegarde du token:', error);
      // }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du token:', error);
    }
  };

  // Gérer les actions sur les notifications
  const handleNotificationAction = async (data: any) => {
    console.log('Traitement de l\'action notification:', data);
    
    // Vibration de confirmation
    await Haptics.impact({ style: ImpactStyle.Light });
    
    // Rediriger selon le type de notification
    if (data?.type) {
      switch (data.type) {
        case 'booking_request':
          // Naviguer vers les réservations
          window.location.href = '/overview?tab=bookings';
          break;
        case 'message':
          // Naviguer vers les messages
          window.location.href = '/messaging';
          break;
        case 'commission_due':
          // Naviguer vers le portefeuille
          window.location.href = '/my-wallet';
          break;
        default:
          // Naviguer vers les notifications
          window.location.href = '/overview';
      }
    }
  };

  // Envoyer une notification locale
  const sendLocalNotification = async (title: string, body: string, data?: any) => {
    if (!isNative || !permissions.local) {
      // Fallback vers toast sur web
      toast({
        title,
        description: body
      });
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [{
          title,
          body,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 100) },
          sound: 'default',
          actionTypeId: '',
          extra: data
        }]
      });

      // Vibration légère
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification locale:', error);
    }
  };

  // Vérifier et demander les permissions
  const requestPermissions = async () => {
    if (!isNative) return false;

    try {
      const pushPermission = await PushNotifications.requestPermissions();
      const localPermission = await LocalNotifications.requestPermissions();

      const newPermissions = {
        push: pushPermission.receive === 'granted',
        local: localPermission.display === 'granted'
      };

      setPermissions(newPermissions);

      if (newPermissions.push && !isInitialized) {
        await PushNotifications.register();
      }

      return newPermissions.push && newPermissions.local;
    } catch (error) {
      console.error('Erreur lors de la demande de permissions:', error);
      return false;
    }
  };

  // Initialiser au montage
  useEffect(() => {
    if (isNative && user?.id) {
      initializeNotifications();
    }
  }, [isNative, user?.id]);

  return {
    permissions,
    isInitialized,
    isNative,
    initializeNotifications,
    requestPermissions,
    sendLocalNotification
  };
};