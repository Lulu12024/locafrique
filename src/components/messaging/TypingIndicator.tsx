// src/components/messaging/TypingIndicator.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth';

interface TypingIndicatorProps {
  conversationId: string;
  otherUserId: string;
  className?: string;
}

/**
 * Composant d'indicateur "En train d'écrire..."
 * Affiche quand l'autre utilisateur tape un message
 */
const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  conversationId,
  otherUserId,
  className = '',
}) => {
  const { user } = useAuth();
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;

    // Écouter les événements de saisie via un canal Supabase
    const channel = supabase
      .channel(`typing-${conversationId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.userId === otherUserId && payload.payload.isTyping) {
          setIsTyping(true);
          
          // Arrêter l'indicateur après 3 secondes
          if (typingTimeout) clearTimeout(typingTimeout);
          const timeout = setTimeout(() => setIsTyping(false), 3000);
          setTypingTimeout(timeout);
        } else if (payload.payload.userId === otherUserId && !payload.payload.isTyping) {
          setIsTyping(false);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [conversationId, otherUserId, user]);

  if (!isTyping) return null;

  return (
    <div className={`flex items-center space-x-2 text-sm text-gray-500 ${className}`}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-xs">En train d'écrire...</span>
    </div>
  );
};

export default TypingIndicator;

/**
 * Hook pour gérer l'indicateur de saisie
 * À utiliser dans le composant de chat
 */
export const useTypingIndicator = (conversationId: string, otherUserId: string) => {
  const { user } = useAuth();
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  const sendTypingEvent = (isTyping: boolean) => {
    if (!user) return;

    const channel = supabase.channel(`typing-${conversationId}`);
    
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: user.id,
        isTyping,
        timestamp: Date.now(),
      },
    });
  };

  const handleTyping = () => {
    // Envoyer "typing = true"
    sendTypingEvent(true);

    // Annuler le timeout précédent
    if (debounceTimeout) clearTimeout(debounceTimeout);

    // Envoyer "typing = false" après 2 secondes d'inactivité
    const timeout = setTimeout(() => {
      sendTypingEvent(false);
    }, 2000);

    setDebounceTimeout(timeout);
  };

  const stopTyping = () => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    sendTypingEvent(false);
  };

  return {
    handleTyping,
    stopTyping,
  };
};

/**
 * Exemple d'utilisation dans un composant de chat
 */
export const ChatInputWithTyping: React.FC<{
  conversationId: string;
  otherUserId: string;
  onSend: (message: string) => void;
}> = ({ conversationId, otherUserId, onSend }) => {
  const [message, setMessage] = useState('');
  const { handleTyping, stopTyping } = useTypingIndicator(conversationId, otherUserId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    handleTyping(); // Déclencher l'indicateur
  };

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage('');
      stopTyping(); // Arrêter l'indicateur
    }
  };

  return (
    <div>
      <TypingIndicator
        conversationId={conversationId}
        otherUserId={otherUserId}
        className="mb-2"
      />
      <input
        type="text"
        value={message}
        onChange={handleChange}
        onBlur={stopTyping}
        placeholder="Tapez votre message..."
      />
      <button onClick={handleSend}>Envoyer</button>
    </div>
  );
};