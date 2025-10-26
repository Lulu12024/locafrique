// src/components/messaging/UnreadMessagesBadge.tsx
import React, { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface UnreadMessagesBadgeProps {
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
  variant?: 'default' | 'dot' | 'full';
}

/**
 * Composant Badge pour afficher le nombre de messages non lus
 * 
 * @example
 * // Badge simple avec compteur
 * <UnreadMessagesBadge />
 * 
 * @example
 * // Badge avec icône
 * <UnreadMessagesBadge showIcon variant="full" />
 * 
 * @example
 * // Petit point rouge (pour menu mobile)
 * <UnreadMessagesBadge variant="dot" />
 */
const UnreadMessagesBadge: React.FC<UnreadMessagesBadgeProps> = ({
  className = '',
  showIcon = false,
  showText = false,
  variant = 'default',
}) => {
  const navigate = useNavigate();
  const { unreadCount, fetchConversations } = useMessages();

  // Rafraîchir périodiquement le compteur
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
    }, 30000); // Toutes les 30 secondes

    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Ne rien afficher si pas de messages non lus
  if (unreadCount === 0) {
    if (showIcon) {
      return (
        <div className={cn('relative cursor-pointer', className)}>
          <MessageSquare className="h-5 w-5 text-gray-600" />
        </div>
      );
    }
    return null;
  }

  // Variant "dot" - Petit point rouge
  if (variant === 'dot') {
    return (
      <div className={cn('relative', className)}>
        {showIcon && <MessageSquare className="h-5 w-5 text-gray-600" />}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      </div>
    );
  }

  // Variant "full" - Badge complet avec texte
  if (variant === 'full') {
    return (
      <div
        className={cn(
          'flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity',
          className
        )}
        onClick={() => navigate('/messages')}
      >
        {showIcon && (
          <div className="relative">
            <MessageSquare className="h-5 w-5 text-gray-600" />
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          </div>
        )}
        {showText && (
          <span className="text-sm font-medium text-gray-700">
            {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''} message{unreadCount > 1 ? 's' : ''}
          </span>
        )}
        {!showIcon && !showText && (
          <Badge className="bg-red-500 text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </div>
    );
  }

  // Variant "default" - Badge simple
  return (
    <div className={cn('relative inline-block', className)}>
      {showIcon && (
        <MessageSquare className="h-5 w-5 text-gray-600" />
      )}
      <Badge
        className={cn(
          'bg-red-500 text-white',
          showIcon ? 'absolute -top-2 -right-2' : ''
        )}
      >
        {unreadCount > 99 ? '99+' : unreadCount}
      </Badge>
    </div>
  );
};

export default UnreadMessagesBadge;

/**
 * Hook personnalisé pour utiliser uniquement le compteur de non-lus
 * Utile si vous voulez juste le nombre sans le composant Badge
 * 
 * @example
 * const unreadCount = useUnreadMessagesCount();
 * return <span>{unreadCount} messages</span>;
 */
export const useUnreadMessagesCount = () => {
  const { unreadCount } = useMessages();
  return unreadCount;
};