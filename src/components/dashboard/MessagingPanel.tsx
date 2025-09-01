
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/hooks/useMessages";
import { MessageSquare, Send, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/auth";
import { useUserRoles } from "@/hooks/auth/useUserRoles";
import { MessageData } from "@/types/supabase";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";

const MessagingPanel: React.FC = () => {
  const { fetchUserMessages, markMessageAsRead, loading: hookLoading } = useMessages();
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const { user, profile } = useAuth();
  const { isProprietaire } = useUserRoles(profile);
  
  // Load messages when component mounts
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        console.log("Chargement des messages...");
        const fetchedMessages = await fetchUserMessages();
        console.log("Messages récupérés:", fetchedMessages);
        setMessages(fetchedMessages);
        
        // Mark unread messages as read
        for (const message of fetchedMessages) {
          if (!message.read && message.receiver_id === user?.id) {
            console.log("Marquage du message comme lu:", message.id);
            await markMessageAsRead(message.id);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des messages:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les messages.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      console.log("Utilisateur connecté, chargement des messages");
      loadMessages();
    } else {
      console.log("Aucun utilisateur connecté, messages non chargés");
      setIsLoading(false);
    }
  }, [user, fetchUserMessages, markMessageAsRead, toast]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    
    toast({
      title: "Fonctionnalité à venir",
      description: "L'envoi de messages sera bientôt disponible."
    });
    
    setNewMessage("");
  };

  // Group messages by conversation partner
  const groupMessagesByConversation = () => {
    if (!user) return [];
    
    const conversationPartners = new Set<string>();
    messages.forEach(msg => {
      const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      conversationPartners.add(partnerId);
    });
    
    return Array.from(conversationPartners).map(partnerId => {
      const conversation = messages.filter(msg => 
        msg.sender_id === partnerId || msg.receiver_id === partnerId
      ).sort((a, b) => 
        new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
      );
      
      return {
        partnerId,
        messages: conversation,
        lastMessage: conversation[conversation.length - 1],
        unreadCount: conversation.filter(msg => !msg.read && msg.receiver_id === user.id).length
      };
    });
  };

  const conversations = groupMessagesByConversation();

  return (
    <Card className="h-[calc(100vh-16rem)]">
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center text-lg">
          <MessageSquare className="h-5 w-5 mr-2" />
          Messages
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex flex-col h-full">
        {isLoading ? (
          <div className="flex-1 p-4 space-y-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-64" />
              </div>
            </div>
            <div className="flex items-start gap-3 justify-end">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 ml-auto" />
                <Skeleton className="h-16 w-56" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/60 mb-2" />
                  <h3 className="font-medium mb-1">Pas de messages</h3>
                  <p className="text-sm text-muted-foreground">
                    Aucune conversation n'a été démarrée pour le moment.
                    <br />
                    {isProprietaire ? 
                      "Vous recevrez des notifications lorsque des locataires vous contacteront." :
                      "Contactez les propriétaires pour démarrer une conversation."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isCurrentUser = message.sender_id === user?.id;
                    return (
                      <div 
                        key={message.id} 
                        className={`flex items-start gap-3 ${isCurrentUser ? 'justify-end' : ''}`}
                      >
                        {!isCurrentUser && (
                          <div className="bg-gray-100 h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5" />
                          </div>
                        )}
                        
                        <div className={`max-w-[80%] ${isCurrentUser ? 'text-right' : ''}`}>
                          <div className="text-xs text-muted-foreground mb-1">
                            {isCurrentUser ? 'Vous' : 'Utilisateur'}
                            {message.created_at && (
                              <span className="ml-2">
                                {formatDistanceToNow(new Date(message.created_at), { 
                                  addSuffix: true,
                                  locale: fr
                                })}
                              </span>
                            )}
                          </div>
                          
                          <div 
                            className={`p-3 rounded-lg text-sm ${
                              isCurrentUser 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                        
                        {isCurrentUser && (
                          <div className="bg-primary h-10 w-10 rounded-full flex items-center justify-center text-primary-foreground flex-shrink-0">
                            <User className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <form onSubmit={handleSendMessage} className="border-t p-3 mt-auto">
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez un message..."
                  className="flex-1 resize-none min-h-[60px] max-h-[120px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <Button type="submit" size="sm" className="h-10">
                  <Send className="h-4 w-4 mr-2" />
                  <span>Envoyer</span>
                </Button>
              </div>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MessagingPanel;
