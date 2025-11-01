import React from 'react';
import { ArrowLeft, Send, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useMessagingLogic } from '@/hooks/useMessagingLogic';

const MobileMessaging = () => {
  const {
    user,
    loading,
    conversations,
    selectedConversation,
    setSelectedConversation,
    newMessage,
    setNewMessage,
    searchTerm,
    setSearchTerm,
    handleSendMessage,
    formatTime,
    loadMessages
  } = useMessagingLogic();

  // Vue de conversation spécifique (style Messenger avec couleurs vertes)
  if (selectedConversation) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col h-screen bg-white">
        {/* Header de conversation */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedConversation(null);
                // ✅ Rafraîchir les conversations après retour
                loadMessages();
              }}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedConversation.participant.avatar} />
              <AvatarFallback className="bg-green-600 text-white">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">
                {selectedConversation.participant.name}
              </h3>
              <p className="text-xs text-green-500">En ligne</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-2 bg-gray-50">
          <div className="space-y-2">
            {selectedConversation.messages
              .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              .map((message: any) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                    message.sender_id === user?.id
                      ? 'bg-green-600 text-white rounded-br-md'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div className="text-xs opacity-70 mt-1">
                    {formatTime(message.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone de saisie */}
        <div className="px-4 py-3 bg-white border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-100 rounded-full px-4 py-2">
              <Input
                placeholder="Écrivez un message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="border-0 bg-transparent focus:ring-0 p-0 text-sm"
              />
            </div>
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              size="sm"
              className="bg-green-600 hover:bg-green-700 rounded-full p-2 h-10 w-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Vue liste des conversations (style Messenger avec couleurs vertes)
  return (
    <div className="flex flex-col h-screen bg-white pb-20">
      {/* Header */}
      <div className="px-4 py-4 bg-white border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Messages</h1>
        
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
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <User className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Pas de messages
            </h3>
            <p className="text-gray-600 text-center">
              Vous n'avez pas encore de conversations.
            </p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation)}
              className="flex items-center px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
            >
              <div className="relative">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={conversation.participant.avatar} />
                  <AvatarFallback className="bg-green-600 text-white">
                    <User className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                {/* Indicateur en ligne */}
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
              </div>
              
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {conversation.participant.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {conversation.unreadCount > 0 && (
                      <Badge className="bg-green-600 text-white rounded-full min-w-[20px] h-5 text-xs flex items-center justify-center">
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
          ))
        )}
      </div>
    </div>
  );
};

export default MobileMessaging;