
import React from 'react';
import { Search, MessageSquare, User, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ConversationsListProps {
  conversations: any[];
  selectedConversation: any;
  setSelectedConversation: (conversation: any) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  loading: boolean;
  formatTime: (dateString: string) => string;
}

const ConversationsList = ({
  conversations,
  selectedConversation,
  setSelectedConversation,
  searchTerm,
  setSearchTerm,
  loading,
  formatTime
}: ConversationsListProps) => {
  return (
    <Card className="lg:col-span-1">
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
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Chargement...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">Aucune conversation trouvée</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conversation.participant.avatar} />
                    <AvatarFallback className="bg-green-600 text-white">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">
                        {conversation.participant.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {conversation.unreadCount > 0 && (
                          <Badge className="bg-green-600 text-white">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {conversation.lastMessage && formatTime(conversation.lastMessage.created_at)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {conversation.lastMessage?.content || 'Aucun message'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversationsList;
