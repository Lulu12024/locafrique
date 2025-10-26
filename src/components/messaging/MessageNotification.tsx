// src/components/messaging/MessageNotification.tsx
import React, { useEffect } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, MessageSquare } from 'lucide-react';
import type { Message } from '../../types/messaging';
/**
 * Composant pour gérer les notifications de nouveaux messages
 * À placer dans le layout principal de l'application
 * 
 * @example
 * // Dans App.tsx ou Layout.tsx
 * <MessageNotificationHandler />
 */
const MessageNotificationHandler = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lastMessageId, setLastMessageId] = React.useState<string | null>(null);

  // Écouter les nouveaux messages via Supabase realtime
  useEffect(() => {
    if (!user) return;

    const { supabase } = require('@/integrations/supabase/client');

    const channel = supabase
      .channel(`messages-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload: any) => {
          const newMessage = payload.new as Message;
          
          // Éviter les doublons
          if (newMessage.id === lastMessageId) return;
          setLastMessageId(newMessage.id);

          // Récupérer les infos de l'expéditeur
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('id', newMessage.sender_id)
            .single();

          const senderName = senderProfile
            ? `${senderProfile.first_name} ${senderProfile.last_name}`
            : 'Un utilisateur';

          // Afficher la notification
          showMessageNotification(
            newMessage,
            senderName,
            senderProfile?.avatar_url
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, lastMessageId]);

  const showMessageNotification = (
    message: Message,
    senderName: string,
    senderAvatar?: string
  ) => {
    // Son de notification (optionnel)
    playNotificationSound();

    // Toast notification avec action
    toast({
      title: (
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={senderAvatar} />
            <AvatarFallback className="bg-green-600 text-white">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold">{senderName}</span>
        </div>
      ) as any,
      description: (
        <div className="mt-2">
          <p className="text-sm text-gray-700 line-clamp-2">
            {message.content}
          </p>
          <button
            onClick={() => navigate('/messages')}
            className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Voir le message →
          </button>
        </div>
      ) as any,
      duration: 5000,
    });

    // Notification navigateur (si autorisée)
    showBrowserNotification(message, senderName);
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Ignorer les erreurs de lecture audio
      });
    } catch (error) {
      console.log('Son de notification non disponible');
    }
  };

  const showBrowserNotification = (message: Message, senderName: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`Nouveau message de ${senderName}`, {
          body: message.content.substring(0, 100),
          icon: '/logo.png',
          tag: message.id,
          requireInteraction: false,
          silent: false,
        });
      } catch (error) {
        console.log('Notification navigateur non disponible');
      }
    }
  };

  return null; // Ce composant ne rend rien visuellement
};

export default MessageNotificationHandler;

/**
 * Composant pour demander la permission des notifications navigateur
 * À afficher une fois au chargement de l'app
 */
export const NotificationPermissionRequest: React.FC<{
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}> = ({ onPermissionGranted, onPermissionDenied }) => {
  const [showRequest, setShowRequest] = React.useState(false);
  const [permissionStatus, setPermissionStatus] = React.useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
      
      // Afficher la demande si pas encore décidé
      if (Notification.permission === 'default') {
        // Attendre 5 secondes avant de demander
        const timer = setTimeout(() => {
          setShowRequest(true);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      setShowRequest(false);
      
      if (permission === 'granted') {
        onPermissionGranted?.();
        toast({
          title: "Notifications activées",
          description: "Vous recevrez des notifications pour les nouveaux messages",
        });
      } else {
        onPermissionDenied?.();
      }
    }
  };

  if (!showRequest || permissionStatus !== 'default') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <MessageSquare className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Activer les notifications de messages
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Recevez des alertes lorsque vous recevez de nouveaux messages
            </p>
            <div className="flex space-x-2">
              <button
                onClick={requestPermission}
                className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
              >
                Activer
              </button>
              <button
                onClick={() => setShowRequest(false)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
              >
                Plus tard
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowRequest(false)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook pour gérer les notifications de messages
 */
export const useMessageNotifications = () => {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      return permission === 'granted';
    }
    return false;
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (notificationsEnabled && 'Notification' in window) {
      new Notification(title, {
        icon: '/logo.png',
        badge: '/logo.png',
        ...options,
      });
    }
  };

  return {
    notificationsEnabled,
    requestPermission,
    showNotification,
  };
};