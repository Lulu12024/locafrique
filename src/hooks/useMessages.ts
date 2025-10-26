// src/hooks/useMessages.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth';
import { toast } from '@/components/ui/use-toast';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  booking_id?: string | null;
}

export interface Conversation {
  id: string;
  participant: {
    id: string;
    name: string;
    avatar_url?: string;
    email?: string;
  };
  messages: Message[];
  lastMessage: Message | null;
  unreadCount: number;
}

export const useMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  // =============================================
  // CHARGER TOUS LES MESSAGES
  // =============================================
  const fetchUserMessages = useCallback(async (): Promise<Message[]> => {
    if (!user) return [];

    try {
      setLoading(true);
      console.log('📥 Chargement des messages pour:', user.id);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log('✅ Messages chargés:', data?.length || 0);
      setMessages(data || []);
      
      // Calculer les non lus
      const unread = (data || []).filter(
        msg => msg.receiver_id === user.id && !msg.read
      ).length;
      setUnreadCount(unread);

      return data || [];
    } catch (error: any) {
      console.error('❌ Erreur chargement messages:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // =============================================
  // CHARGER LES CONVERSATIONS
  // =============================================
  const fetchConversations = useCallback(async (): Promise<Conversation[]> => {
    if (!user) return [];

    try {
      setLoading(true);
      console.log('💬 Chargement des conversations...');

      // 1. Récupérer tous les messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // 2. Grouper par interlocuteur
      const conversationsMap = new Map<string, Conversation>();

      for (const message of messagesData || []) {
        const otherUserId = message.sender_id === user.id 
          ? message.receiver_id 
          : message.sender_id;

        if (!conversationsMap.has(otherUserId)) {
          // Récupérer le profil de l'interlocuteur
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, email')
            .eq('id', otherUserId)
            .single();

          conversationsMap.set(otherUserId, {
            id: otherUserId,
            participant: {
              id: otherUserId,
              name: profileData 
                ? `${profileData.first_name} ${profileData.last_name}`
                : 'Utilisateur',
              avatar_url: profileData?.avatar_url,
              email: profileData?.email,
            },
            messages: [],
            lastMessage: null,
            unreadCount: 0,
          });
        }

        const conversation = conversationsMap.get(otherUserId)!;
        conversation.messages.push(message);
        conversation.lastMessage = message;

        // Compter les non lus
        if (message.receiver_id === user.id && !message.read) {
          conversation.unreadCount++;
        }
      }

      // 3. Convertir en tableau et trier par date du dernier message
      const conversationsArray = Array.from(conversationsMap.values()).sort(
        (a, b) => {
          const dateA = a.lastMessage?.created_at || '';
          const dateB = b.lastMessage?.created_at || '';
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        }
      );

      console.log('✅ Conversations chargées:', conversationsArray.length);
      setConversations(conversationsArray);
      return conversationsArray;
    } catch (error: any) {
      console.error('❌ Erreur chargement conversations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les conversations",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // =============================================
  // ENVOYER UN MESSAGE
  // =============================================
  const sendMessage = useCallback(async (
    receiverId: string,
    content: string,
    bookingId?: string
  ): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Non connecté",
        description: "Vous devez être connecté pour envoyer un message",
        variant: "destructive",
      });
      return false;
    }

    if (!content.trim()) {
      toast({
        title: "Message vide",
        description: "Veuillez saisir un message",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log('📤 Envoi message à:', receiverId);

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content: content.trim(),
          booking_id: bookingId || null,
          read: false,
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Message envoyé:', data.id);

      // Ajouter le message localement pour mise à jour instantanée
      setMessages(prev => [...prev, data]);

      return true;
    } catch (error: any) {
      console.error('❌ Erreur envoi message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
      return false;
    }
  }, [user]);

  // =============================================
  // MARQUER COMME LU
  // =============================================
  const markMessageAsRead = useCallback(async (messageId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId)
        .eq('receiver_id', user.id);

      if (error) throw error;

      // Mettre à jour localement
      setMessages(prev =>
        prev.map(msg => msg.id === messageId ? { ...msg, read: true } : msg)
      );

      // Recalculer les non lus
      setUnreadCount(prev => Math.max(0, prev - 1));

      return true;
    } catch (error: any) {
      console.error('❌ Erreur marquage comme lu:', error);
      return false;
    }
  }, [user]);

  // =============================================
  // MARQUER TOUTE UNE CONVERSATION COMME LUE
  // =============================================
  const markConversationAsRead = useCallback(async (otherUserId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user.id)
        .eq('read', false);

      if (error) throw error;

      // Mettre à jour localement
      setMessages(prev =>
        prev.map(msg =>
          msg.sender_id === otherUserId && msg.receiver_id === user.id
            ? { ...msg, read: true }
            : msg
        )
      );

      // Recalculer les non lus
      await fetchUserMessages();

      return true;
    } catch (error: any) {
      console.error('❌ Erreur marquage conversation:', error);
      return false;
    }
  }, [user, fetchUserMessages]);

  // =============================================
  // SUPPRIMER UN MESSAGE
  // =============================================
  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) throw error;

      // Retirer localement
      setMessages(prev => prev.filter(msg => msg.id !== messageId));

      toast({
        title: "Message supprimé",
        description: "Le message a été supprimé avec succès",
      });

      return true;
    } catch (error: any) {
      console.error('❌ Erreur suppression message:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le message",
        variant: "destructive",
      });
      return false;
    }
  }, [user]);

  // =============================================
  // REAL-TIME SUBSCRIPTIONS
  // =============================================
  useEffect(() => {
    if (!user) return;

    console.log('🔌 Initialisation real-time messages...');

    // Créer le canal de souscription
    const channel = supabase
      .channel(`messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('📨 Nouveau message reçu:', payload.new);
          const newMessage = payload.new as Message;
          
          setMessages(prev => [...prev, newMessage]);
          setUnreadCount(prev => prev + 1);

          // Toast de notification
          toast({
            title: "Nouveau message",
            description: newMessage.content.substring(0, 50) + '...',
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('📝 Message mis à jour:', payload.new);
          const updatedMessage = payload.new as Message;
          
          setMessages(prev =>
            prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
          );
        }
      )
      .subscribe((status) => {
        console.log('📡 Statut real-time messages:', status);
      });

    setRealtimeChannel(channel);

    // Cleanup
    return () => {
      console.log('🔌 Déconnexion real-time messages');
      supabase.removeChannel(channel);
    };
  }, [user]);

  // =============================================
  // CHARGER AU MONTAGE
  // =============================================
  useEffect(() => {
    if (user) {
      fetchUserMessages();
    }
  }, [user, fetchUserMessages]);

  return {
    messages,
    conversations,
    loading,
    unreadCount,
    fetchUserMessages,
    fetchConversations,
    sendMessage,
    markMessageAsRead,
    markConversationAsRead,
    deleteMessage,
  };
};