// src/components/NotificationBell.tsx
// VERSION AVEC NAVIGATION VERS LES BONNES PAGES

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getNotificationRoute } from '@/utils/notificationNavigation';

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  console.log('NotificationBell render:', { notifications, unreadCount, loading });

  // ✅ FONCTION DE NAVIGATION SELON LE TYPE DE NOTIFICATION
  const handleNotificationClick = (notificationId: string, read: boolean, type: string) => {
    console.log('Notification clicked:', notificationId, 'read:', read, 'type:', type);
    
    // Marquer comme lu
    if (!read) {
      markAsRead(notificationId);
    }
    
    // Fermer le popover
    setIsOpen(false);
    
    // Naviguer vers la bonne page selon le type
    const route = getNotificationRoute(type);
    console.log('📍 Navigation vers:', route);
    navigate(route);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Tout marquer comme lu
              </Button>
            )}
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
              <p className="text-sm">Chargement...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => handleNotificationClick(notification.id, notification.read, notification.type)}
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className={`text-sm font-medium ${
                    !notification.read ? 'text-blue-900 font-semibold' : 'text-gray-900'
                  }`}>
                    {notification.title}
                  </h4>
                  {!notification.read && (
                    <span className="flex h-2 w-2 rounded-full bg-blue-600 mt-1 ml-2"></span>
                  )}
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {notification.message}
                </p>
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <span>
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: fr
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
        
        {notifications.length > 10 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                setIsOpen(false);
                navigate('/overview');
              }}
            >
              Voir toutes les notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;