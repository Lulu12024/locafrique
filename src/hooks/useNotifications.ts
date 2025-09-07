// CRÉER le fichier : /src/hooks/useNotifications.ts
// Hook pour la gestion automatique des notifications avec vraies données

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

// Interface pour les notifications
interface NotificationData {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  booking_id?: string;
  created_at: string;
}

// Interface pour les paramètres de notification
interface NotificationSettings {
  email: {
    newBooking: boolean;
    bookingConfirmed: boolean;
    bookingCancelled: boolean;
    paymentReceived: boolean;
    reviewReceived: boolean;
    maintenanceReminder: boolean;
  };
  push: {
    newBooking: boolean;
    bookingConfirmed: boolean;
    bookingCancelled: boolean;
    paymentReceived: boolean;
    reviewReceived: boolean;
    maintenanceReminder: boolean;
  };
  sms: {
    newBooking: boolean;
    bookingConfirmed: boolean;
    bookingCancelled: boolean;
    paymentReceived: boolean;
    reviewReceived: boolean;
    maintenanceReminder: boolean;
  };
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      newBooking: true,
      bookingConfirmed: true,
      bookingCancelled: true,
      paymentReceived: true,
      reviewReceived: true,
      maintenanceReminder: true,
    },
    push: {
      newBooking: true,
      bookingConfirmed: true,
      bookingCancelled: true,
      paymentReceived: false,
      reviewReceived: true,
      maintenanceReminder: false,
    },
    sms: {
      newBooking: false,
      bookingConfirmed: true,
      bookingCancelled: true,
      paymentReceived: false,
      reviewReceived: false,
      maintenanceReminder: false,
    }
  });

  // Charger les notifications
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      setupRealtimeSubscription();
    }
  }, [user?.id]);

  // Charger les notifications depuis la base de données
  const loadNotifications = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔔 Chargement des notifications...');
      
      const { data, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (notifError) {
        console.error('❌ Erreur lors du chargement des notifications:', notifError);
        throw notifError;
      }

      console.log('✅ Notifications chargées:', data?.length || 0);
      setNotifications(data || []);
      
      // Calculer le nombre de non lues
      const unread = (data || []).filter(n => !n.read).length;
      setUnreadCount(unread);
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des notifications:', error);
      setError('Impossible de charger les notifications');
    } finally {
      setLoading(false);
    }
  };

  // Configuration de l'écoute en temps réel
  const setupRealtimeSubscription = () => {
    if (!user?.id) return;

    console.log('🔄 Configuration de l\'écoute temps réel des notifications...');
    
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Nouvelle notification reçue:', payload.new);
          
          const newNotification = payload.new as NotificationData;
          
          // Ajouter à la liste
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Afficher un toast pour les notifications importantes
          if (settings.push[newNotification.type as keyof typeof settings.push]) {
            toast({
              title: newNotification.title,
              description: newNotification.message,
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔇 Arrêt de l\'écoute temps réel');
      subscription.unsubscribe();
    };
  };

  // Créer une nouvelle notification
  const createNotification = async (
    recipientId: string,
    type: string,
    title: string,
    message: string,
    bookingId?: string
  ) => {
    try {
      console.log('📤 Création d\'une notification:', { recipientId, type, title });
      
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: recipientId,
          type,
          title,
          message,
          booking_id: bookingId,
          read: false
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la création de la notification:', error);
        throw error;
      }

      console.log('✅ Notification créée:', data);
      
      // Simuler l'envoi d'email si activé
      if (settings.email[type as keyof typeof settings.email]) {
        console.log('📧 Envoi d\'email simulé pour:', title);
        // Ici, vous pourriez intégrer un service d'email réel
      }
      
      // Simuler l'envoi de SMS si activé
      if (settings.sms[type as keyof typeof settings.sms]) {
        console.log('📱 Envoi de SMS simulé pour:', title);
        // Ici, vous pourriez intégrer un service SMS réel
      }

      return data;
    } catch (error) {
      console.error('❌ Erreur lors de la création de la notification:', error);
      throw error;
    }
  };

  // Marquer une notification comme lue
  const markAsRead = async (notificationId: string) => {
    try {
      console.log('👁️ Marquage comme lue:', notificationId);
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('❌ Erreur lors du marquage:', error);
        throw error;
      }

      // Mettre à jour localement
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('❌ Erreur lors du marquage comme lue:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer la notification comme lue.",
        variant: "destructive"
      });
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      console.log('👁️ Marquage de toutes les notifications comme lues');
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('❌ Erreur lors du marquage global:', error);
        throw error;
      }

      // Mettre à jour localement
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      
      setUnreadCount(0);
      
      toast({
        title: "✅ Notifications marquées",
        description: "Toutes les notifications ont été marquées comme lues.",
      });
      
    } catch (error) {
      console.error('❌ Erreur lors du marquage global:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer toutes les notifications comme lues.",
        variant: "destructive"
      });
    }
  };

  // Supprimer une notification
  const deleteNotification = async (notificationId: string) => {
    try {
      console.log('🗑️ Suppression de la notification:', notificationId);
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        throw error;
      }

      // Mettre à jour localement
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la notification.",
        variant: "destructive"
      });
    }
  };

  // Notifications prédéfinies pour le système de réservation
  const notificationTemplates = {
    newBooking: (renterName: string, equipmentTitle: string, dates: string) => ({
      type: 'new_booking',
      title: 'Nouvelle demande de réservation',
      message: `${renterName} souhaite réserver "${equipmentTitle}" ${dates}. Commission automatique de 5% appliquée.`
    }),
    
    bookingConfirmed: (equipmentTitle: string, ownerName: string) => ({
      type: 'booking_confirmed',
      title: 'Réservation confirmée',
      message: `Votre réservation pour "${equipmentTitle}" a été confirmée par ${ownerName}.`
    }),
    
    paymentReceived: (amount: number, commission: number) => ({
      type: 'payment_received',
      title: 'Paiement reçu',
      message: `Vous avez reçu ${amount.toLocaleString()} FCFA. Commission: ${commission.toLocaleString()} FCFA (5%).`
    }),
    
    bookingCancelled: (equipmentTitle: string, reason?: string) => ({
      type: 'booking_cancelled',
      title: 'Réservation annulée',
      message: `La réservation pour "${equipmentTitle}" a été annulée.${reason ? ` Raison: ${reason}` : ''}`
    }),
    
    reviewReceived: (rating: number, reviewerName: string) => ({
      type: 'review_received',
      title: 'Nouvel avis reçu',
      message: `${reviewerName} a laissé un avis ${rating} étoile${rating > 1 ? 's' : ''} sur votre service.`
    }),
    
    maintenanceReminder: (equipmentTitle: string, date: string) => ({
      type: 'maintenance_reminder',
      title: 'Rappel de maintenance',
      message: `N'oubliez pas la maintenance de "${equipmentTitle}" prévue le ${date}.`
    })
  };

  // Fonctions utilitaires pour créer des notifications spécifiques
  const notifyNewBooking = (ownerId: string, renterName: string, equipmentTitle: string, dates: string, bookingId: string) => {
    const template = notificationTemplates.newBooking(renterName, equipmentTitle, dates);
    return createNotification(ownerId, template.type, template.title, template.message, bookingId);
  };

  const notifyBookingConfirmed = (renterId: string, equipmentTitle: string, ownerName: string, bookingId: string) => {
    const template = notificationTemplates.bookingConfirmed(equipmentTitle, ownerName);
    return createNotification(renterId, template.type, template.title, template.message, bookingId);
  };

  const notifyPaymentReceived = (ownerId: string, amount: number, commission: number, bookingId: string) => {
    const template = notificationTemplates.paymentReceived(amount, commission);
    return createNotification(ownerId, template.type, template.title, template.message, bookingId);
  };

  // Mettre à jour les paramètres de notification
  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
    
    // Ici, vous pourriez sauvegarder les paramètres en base de données
    console.log('⚙️ Paramètres de notification mis à jour:', newSettings);
  };

  return {
    // États
    notifications,
    loading,
    error,
    unreadCount,
    settings,
    
    // Actions
    loadNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateSettings,
    
    // Helpers pour les notifications spécifiques
    notifyNewBooking,
    notifyBookingConfirmed,
    notifyPaymentReceived,
    
    // Templates
    notificationTemplates
  };
}