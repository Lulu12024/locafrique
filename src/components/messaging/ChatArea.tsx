
import React from 'react';
import { Send, User, Clock, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatAreaProps {
  selectedConversation: any;
  user: any;
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => void;
  formatTime: (dateString: string) => string;
}

const ChatArea = ({
  selectedConversation,
  user,
  newMessage,
  setNewMessage,
  handleSendMessage,
  formatTime
}: ChatAreaProps) => {
  return (
    <Card className="lg:col-span-2">
      {selectedConversation ? (
        <>
          {/* Header de la conversation */}
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedConversation.participant.avatar} />
                <AvatarFallback className="bg-green-600 text-white">
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-gray-900">
                  {selectedConversation.participant.name}
                </h3>
                <p className="text-sm text-gray-500">En ligne</p>
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 p-4">
            <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
              {selectedConversation.messages
                .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                .map((message: any) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_id === user?.id
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-end mt-1 space-x-1">
                      <Clock className="h-3 w-3 opacity-70" />
                      <span className="text-xs opacity-70">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Zone de saisie */}
            <div className="flex items-center space-x-2 border-t border-gray-100 pt-4">
              <Input
                placeholder="Tapez votre message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
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
  );
};

export default ChatArea;
