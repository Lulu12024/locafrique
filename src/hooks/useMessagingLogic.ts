
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/auth';
import { useMessages } from '@/hooks/useMessages';

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

  const loadMessages = async () => {
    try {
      const messages = await fetchUserMessages();
      const groupedConversations = groupMessagesByConversation(messages);
      setConversations(groupedConversations);
    } catch (error) {
      console.error("Erreur lors du chargement des messages:", error);
    }
  };

  const groupMessagesByConversation = (messages: any[]) => {
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
            name: 'Utilisateur',
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

    return Object.values(grouped).sort((a: any, b: any) => 
      new Date(b.lastMessage?.created_at || 0).getTime() - new Date(a.lastMessage?.created_at || 0).getTime()
    );
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    console.log("Envoi du message:", newMessage);
    setNewMessage('');
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
    formatTime
  };
};
