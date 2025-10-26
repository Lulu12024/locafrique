// src/components/messaging/MobileMessagesView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Send,
  Search,
  User,
  MessageSquare,
  MoreVertical,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Conversation } from '@/hooks/useMessages';

const MobileMessagesView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    conversations,
    loading,
    fetchConversations,
    sendMessage,
    markConversationAsRead,
    unreadCount,
  } = useMessages();

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Charger les conversations
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  // Marquer comme lu
  useEffect(() => {
    if (selectedConversation && selectedConversation.unreadCount > 0) {
      markConversationAsRead(selectedConversation.participant.id);
    }
  }, [selectedConversation, markConversationAsRead]);

  // Focus automatique sur l'input
  useEffect(() => {
    if (selectedConversation) {
      inputRef.current?.focus();
    }
  }, [selectedConversation]);

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || isSending) return;

    setIsSending(true);
    const success = await sendMessage(selectedConversation.participant.id, newMessage);
    
    if (success) {
      setNewMessage('');
      await fetchConversations();
    }
    
    setIsSending(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'À l\'instant';
    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // =============================================
  // VUE CONVERSATION (quand une conversation est sélectionnée)
  // =============================================
  if (selectedConversation) {
    return (
      <div className="flex flex-col h-screen bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm sticky top-0 z-10">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedConversation(null)}
              className="p-2 -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={selectedConversation.participant.avatar_url} />
              <AvatarFallback className="bg-green-600 text-white">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {selectedConversation.participant.name}
              </h3>
              <p className="text-xs text-green-500">En ligne</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="p-2">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-2 bg-gray-50">
          <div className="space-y-3">
            {selectedConversation.messages
              .sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              )
              .map((message, index) => {
                const isOwn = message.sender_id === user?.id;
                const showAvatar = index === 0 || 
                  selectedConversation.messages[index - 1].sender_id !== message.sender_id;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end gap-2`}
                  >
                    {!isOwn && (
                      <Avatar className={`h-8 w-8 ${showAvatar ? '' : 'invisible'}`}>
                        <AvatarImage src={selectedConversation.participant.avatar_url} />
                        <AvatarFallback className="bg-gray-300">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div
                      className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                        isOwn
                          ? 'bg-green-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwn ? 'text-green-100' : 'text-gray-500'
                        }`}
                      >
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Zone de saisie */}
        <div className="px-4 py-3 bg-white border-t">
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-100 rounded-full px-4 py-2">
              <Input
                ref={inputRef}
                placeholder="Écrivez un message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="border-0 bg-transparent focus:ring-0 p-0 text-sm"
                disabled={isSending}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              size="sm"
              className="bg-green-600 hover:bg-green-700 rounded-full p-3 h-10 w-10"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // =============================================
  // VUE LISTE DES CONVERSATIONS
  // =============================================
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="px-4 py-4 bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white">
              {unreadCount}
            </Badge>
          )}
        </div>
        
        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-100 border-0 rounded-full"
          />
        </div>
      </div>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun message
            </h3>
            <p className="text-gray-600 text-center">
              Vous n'avez pas encore de conversations.
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation)}
              className="flex items-center px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
            >
              <div className="relative flex-shrink-0">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={conversation.participant.avatar_url} />
                  <AvatarFallback className="bg-green-600 text-white">
                    <User className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                {/* Indicateur en ligne */}
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full" />
              </div>
              
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {conversation.participant.name}
                  </h3>
                  <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                    {conversation.unreadCount > 0 && (
                      <Badge className="bg-green-600 text-white rounded-full min-w-[20px] h-5 text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500">
                      {conversation.lastMessage && formatTime(conversation.lastMessage.created_at)}
                    </span>
                  </div>
                </div>
                <p
                  className={`text-sm truncate ${
                    conversation.unreadCount > 0
                      ? 'text-gray-900 font-medium'
                      : 'text-gray-600'
                  }`}
                >
                  {conversation.lastMessage?.content || 'Aucun message'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MobileMessagesView;