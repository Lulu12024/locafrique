import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/auth';
import { useMessages } from '@/hooks/useMessages';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export const useMessagingLogic = () => {
  const { user } = useAuth();
  const { fetchUserMessages, loading } = useMessages();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadMessages();
    }
  }, [user]);

  // ✅ CORRECTION 1: Marquer comme lu quand on sélectionne une conversation
  useEffect(() => {
    if (selectedConversation && user) {
      markMessagesAsRead(selectedConversation.id);
    }
  }, [selectedConversation, user]);

  const loadMessages = async () => {
    try {
      const messages = await fetchUserMessages();
      const groupedConversations = await groupMessagesByConversation(messages);
      setConversations(groupedConversations);
    } catch (error) {
      console.error("Erreur lors du chargement des messages:", error);
    }
  };

  // ✅ CORRECTION 2: Charger les vrais profils depuis la base
  const groupMessagesByConversation = async (messages: any[]) => {
    const grouped = messages.reduce((acc, message) => {
      const otherUserId = message.sender_id === user?.id ? message.receiver_id : message.sender_id;
      if (!acc[otherUserId]) {
        acc[otherUserId] = {
          id: otherUserId,
          messages: [],
          lastMessage: null,
          unreadCount: 0,
          participant: {
            id: otherUserId,
            name: 'Utilisateur', // Temporaire, sera remplacé
            avatar: null
          }
        };
      }
      acc[otherUserId].messages.push(message);
      if (!acc[otherUserId].lastMessage || new Date(message.created_at) > new Date(acc[otherUserId].lastMessage.created_at)) {
        acc[otherUserId].lastMessage = message;
      }
      if (!message.read && message.receiver_id === user?.id) {
        acc[otherUserId].unreadCount++;
      }
      return acc;
    }, {});

    const conversationsArray = Object.values(grouped);

    // ✅ Charger les profils réels pour chaque participant
    const conversationsWithProfiles = await Promise.all(
      conversationsArray.map(async (conv: any) => {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url')
            .eq('id', conv.participant.id)
            .single();

          if (error || !profile) {
            console.error('Erreur chargement profil:', error);
            return conv;
          }

          return {
            ...conv,
            participant: {
              id: profile.id,
              name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Utilisateur',
              avatar: profile.avatar_url
            }
          };
        } catch (error) {
          console.error('Erreur profil:', error);
          return conv;
        }
      })
    );

    return conversationsWithProfiles.sort((a: any, b: any) => 
      new Date(b.lastMessage?.created_at || 0).getTime() - new Date(a.lastMessage?.created_at || 0).getTime()
    );
  };

  // ✅ CORRECTION 3: Vraiment envoyer le message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) {
      console.log('❌ Conditions non remplies:', { 
        hasMessage: !!newMessage.trim(), 
        hasConversation: !!selectedConversation,
        hasUser: !!user 
      });
      return;
    }
    
    try {
      console.log('📤 Envoi du message à:', selectedConversation.participant.id);
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedConversation.participant.id,
          content: newMessage.trim(),
          read: false
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur envoi:', error);
        toast({
          title: "Erreur",
          description: "Impossible d'envoyer le message",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Message envoyé:', data);

      // Ajouter le message à la conversation actuelle
      setSelectedConversation((prev: any) => ({
        ...prev,
        messages: [...prev.messages, data],
        lastMessage: data
      }));

      // Mettre à jour la liste des conversations
      setConversations((prev) => 
        prev.map((conv) => 
          conv.id === selectedConversation.id 
            ? { ...conv, lastMessage: data, messages: [...conv.messages, data] }
            : conv
        ).sort((a, b) => 
          new Date(b.lastMessage?.created_at || 0).getTime() - new Date(a.lastMessage?.created_at || 0).getTime()
        )
      );

      setNewMessage('');
      
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès"
      });
    } catch (error) {
      console.error('❌ Erreur inattendue:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    }
  };

  // ✅ CORRECTION 4: Marquer les messages comme lus
  const markMessagesAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', conversationId)
        .eq('read', false);

      if (error) {
        console.error('❌ Erreur marquage comme lu:', error);
        return;
      }

      console.log('✅ Messages marqués comme lus');

      // Mettre à jour le compteur de non-lus
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );

      if (selectedConversation?.id === conversationId) {
        setSelectedConversation((prev: any) => ({
          ...prev,
          unreadCount: 0
        }));
      }
    } catch (error) {
      console.error('❌ Erreur inattendue marquage:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.participant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    user,
    loading,
    conversations: filteredConversations,
    selectedConversation,
    setSelectedConversation,
    newMessage,
    setNewMessage,
    searchTerm,
    setSearchTerm,
    handleSendMessage,
    formatTime,
    loadMessages // ✅ Exposer pour rafraîchir
  };
};