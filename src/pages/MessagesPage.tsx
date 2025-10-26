// src/pages/MessagesPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import {
  MessageSquare,
  Send,
  Search,
  User,
  ArrowLeft,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Conversation } from '@/hooks/useMessages';

const MessagesPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    conversations,
    loading: messagesLoading,
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

  // Charger les conversations au montage
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  // Scroll automatique vers le bas
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedConversation?.messages]);

  // ✅ CORRECTIF : Auto-refresh toutes les 3 secondes quand une conversation est ouverte
  useEffect(() => {
    if (!selectedConversation) return;
    
    const interval = setInterval(async () => {
      const fresh = await fetchConversations();
      const updated = fresh.find(
        c => c.participant.id === selectedConversation.participant.id
      );
      if (updated) {
        setSelectedConversation(updated);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [selectedConversation?.participant.id, fetchConversations]);

  // Rediriger si non connecté
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

  // ✅ FONCTION CORRIGÉE : Gérer le clic sur une conversation
  const handleConversationClick = async (conversation: Conversation) => {
    console.log('🔍 Ouverture conversation:', conversation.participant.name);
    console.log('📊 Messages non lus:', conversation.unreadCount);
    
    setSelectedConversation(conversation);
    
    // Si il y a des messages non lus, les marquer comme lus
    if (conversation.unreadCount > 0 && user) {
      console.log('🔄 Marquage des messages comme lus...');
      
      try {
        const { data, error } = await supabase
          .from('messages')
          .update({ read: true })
          .eq('receiver_id', user.id)
          .eq('sender_id', conversation.participant.id)
          .eq('read', false)
          .select();
        
        if (error) {
          console.error('❌ Erreur marquage:', error);
        } else {
          console.log('✅', data?.length || 0, 'messages marqués comme lus');
          
          // Recharger après 500ms
          setTimeout(async () => {
            const fresh = await fetchConversations();
            const updated = fresh.find(c => c.participant.id === conversation.participant.id);
            if (updated) {
              console.log('✅ Compteur mis à jour:', updated.unreadCount);
              setSelectedConversation(updated);
            }
          }, 500);
        }
      } catch (error) {
        console.error('❌ Erreur complète:', error);
      }
    }
  };

  // ✅ FONCTION CORRIGÉE : Envoyer un message
  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || isSending || !user) {
      console.log('❌ Impossible d\'envoyer (conditions non remplies)');
      return;
    }

    console.log('📤 ENVOI MESSAGE');
    
    setIsSending(true);
    const messageContent = newMessage.trim();
    const receiverId = selectedConversation.participant.id;
    
    console.log('📝 Contenu:', messageContent);
    console.log('👤 Destinataire:', receiverId);
    
    // Vider l'input immédiatement
    setNewMessage('');
    
    try {
      // Insérer directement dans Supabase
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content: messageContent,
          read: false,
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Erreur Supabase:', error);
        setNewMessage(messageContent);
        return;
      }
      
      console.log('✅ Message créé avec ID:', data.id);
      
      // Attendre 700ms pour que Supabase enregistre bien
      await new Promise(r => setTimeout(r, 700));
      
      console.log('🔄 Rechargement des conversations...');
      const freshConversations = await fetchConversations();
      console.log('✅', freshConversations.length, 'conversations chargées');
      
      const updated = freshConversations.find(c => c.participant.id === receiverId);
      if (updated) {
        console.log('✅ Conversation mise à jour');
        console.log('📊 Nombre de messages:', updated.messages.length);
        setSelectedConversation(updated);
      } else {
        console.warn('⚠️ Conversation non trouvée après refresh');
      }
      
    } catch (error) {
      console.error('❌ Erreur complète:', error);
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  // Filtrer les conversations
  const filteredConversations = conversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format de l'heure
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    }
  };

  // Loading state
  if (authLoading || messagesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="lg:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-600">
                    {unreadCount} message{unreadCount > 1 ? 's' : ''} non lu{unreadCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            <MessageSquare className="h-6 w-6 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Liste des conversations */}
          <Card className="lg:col-span-1 flex flex-col">
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher une conversation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">Aucune conversation</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationClick(conversation)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === conversation.id ? 'bg-green-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conversation.participant.avatar_url} />
                        <AvatarFallback className="bg-green-600 text-white">
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {conversation.participant.name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-green-600">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {conversation.lastMessage && formatTime(conversation.lastMessage.created_at)}
                            </span>
                          </div>
                        </div>
                        <p className={`text-sm truncate ${
                          conversation.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
                        }`}>
                          {conversation.lastMessage?.content || 'Aucun message'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Zone de chat */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Header conversation */}
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedConversation.participant.avatar_url} />
                        <AvatarFallback className="bg-green-600 text-white">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedConversation.participant.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {selectedConversation.participant.email}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    {selectedConversation.messages
                      .sort((a, b) => 
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                      )
                      .map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-2 rounded-lg ${
                              message.sender_id === user?.id
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            <p
                              className={`text-xs mt-1 ${
                                message.sender_id === user?.id
                                  ? 'text-green-100'
                                  : 'text-gray-500'
                              }`}
                            >
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    <div ref={messagesEndRef} />
                  </div>
                </CardContent>

                {/* Zone de saisie */}
                <div className="border-t p-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Tapez votre message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1"
                      disabled={isSending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Sélectionnez une conversation
                  </h3>
                  <p className="text-gray-600">
                    Choisissez une conversation pour commencer à échanger
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;