// CRÉER le fichier : /src/components/notifications/NotificationCenter.tsx
// Composant pour afficher les notifications en temps réel dans la navbar

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Bell,
  BellRing,
  Calendar,
  DollarSign,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Package,
  Star,
  Settings,
  X,
  Eye,
  MoreHorizontal,
  Trash2
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const { 
    notifications, 
    loading, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    const iconMap = {
      new_booking: <Calendar className="h-5 w-5 text-blue-600" />,
      booking_confirmed: <CheckCircle className="h-5 w-5 text-green-600" />,
      booking_cancelled: <AlertCircle className="h-5 w-5 text-red-600" />,
      payment_received: <DollarSign className="h-5 w-5 text-green-600" />,
      review_received: <Star className="h-5 w-5 text-yellow-600" />,
      maintenance_reminder: <Package className="h-5 w-5 text-orange-600" />,
      message_received: <MessageSquare className="h-5 w-5 text-purple-600" />
    };
    return iconMap[type] || <Bell className="h-5 w-5 text-gray-600" />;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    
    if (diffInHours < 1) {
      return `Il y a ${Math.floor(diffInHours * 60)} min`;
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)} h`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short'
      });
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Ici, vous pourriez naviguer vers la page appropriée
    console.log('Navigation vers:', notification.booking_id);
  };

  const handleDeleteNotification = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    deleteNotification(notificationId);
  };

  // Limiter l'affichage aux 10 dernières notifications
  const displayedNotifications = notifications.slice(0, 10);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative ${className}`}
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notifications
                {unreadCount > 0 && (
                  <Badge 
                    className="ml-2 bg-red-100 text-red-800 hover:bg-red-100"
                  >
                    {unreadCount} nouvelles
                  </Badge>
                )}
              </CardTitle>
              
              <div className="flex items-center space-x-1">
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
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Chargement...</p>
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Aucune notification</p>
                <p className="text-sm text-gray-500">Vous êtes à jour !</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {displayedNotifications.map((notification, index) => (
                  <div key={notification.id}>
                    <div
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-1 rounded-full ${
                          !notification.read ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className={`text-sm font-medium text-gray-900 ${
                                !notification.read ? 'font-semibold' : ''
                              }`}>
                                {notification.title}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center mt-2 space-x-2">
                                <span className="text-xs text-gray-500">
                                  {getTimeAgo(notification.created_at)}
                                </span>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                            
                            {/* Menu d'actions */}
                            <div className="flex items-center space-x-1 ml-2">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700"
                                onClick={(e) => handleDeleteNotification(e, notification.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {index < displayedNotifications.length - 1 && (
                      <Separator />
                    )}
                  </div>
                ))}
                
                {notifications.length > 10 && (
                  <div className="p-4 border-t bg-gray-50">
                    <Button
                      variant="ghost"
                      className="w-full text-sm"
                      onClick={() => {
                        setIsOpen(false);
                        // Ici, naviguer vers la page complète des notifications
                        console.log('Navigation vers la page des notifications');
                      }}
                    >
                      Voir toutes les notifications ({notifications.length})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          
          {/* Footer avec paramètres */}
          <div className="border-t p-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                setIsOpen(false);
                // Ici, naviguer vers les paramètres de notification
                console.log('Navigation vers les paramètres');
              }}
            >
              <Settings className="h-3 w-3 mr-2" />
              Paramètres de notification
            </Button>
          </div>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;