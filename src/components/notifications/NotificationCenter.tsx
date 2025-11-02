// src/components/notifications/NotificationCenter.tsx
// VERSION AVEC NAVIGATION VERS LES BONNES PAGES

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  BellRing, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  Star, 
  Package, 
  MessageSquare,
  Eye,
  Trash2,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications } from '@/hooks/useNotifications';
import { getNotificationRoute } from '@/utils/notificationNavigation';

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const navigate = useNavigate();
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
      booking_rejected: <AlertCircle className="h-5 w-5 text-red-600" />,
      booking_cancelled: <AlertCircle className="h-5 w-5 text-red-600" />,
      rental_started: <CheckCircle className="h-5 w-5 text-green-600" />,
      rental_completed: <Star className="h-5 w-5 text-purple-600" />,
      payment_received: <DollarSign className="h-5 w-5 text-green-600" />,
      review_received: <Star className="h-5 w-5 text-yellow-600" />,
      maintenance_reminder: <Package className="h-5 w-5 text-orange-600" />,
      message_received: <MessageSquare className="h-5 w-5 text-purple-600" />,
      equipment_approved: <CheckCircle className="h-5 w-5 text-green-600" />,
      equipment_rejected: <AlertCircle className="h-5 w-5 text-red-600" />,
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

  // ✅ FONCTION DE NAVIGATION SELON LE TYPE DE NOTIFICATION
  const handleNotificationClick = (notification: any) => {
    // Marquer comme lu
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Fermer le popover
    setIsOpen(false);
    
    // Naviguer vers la bonne page selon le type
    const route = getNotificationRoute(notification.type);
    console.log('📍 Navigation vers:', route, 'pour notification type:', notification.type);
    navigate(route);
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
      
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-lg">
          {/* Header */}
          <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {unreadCount > 0 
                    ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` 
                    : 'Tout est à jour'}
                </p>
              </div>
              
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  Tout marquer comme lu
                </Button>
              )}
            </div>
          </div>
          
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-sm text-gray-500">Chargement...</p>
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600">Aucune notification</p>
                <p className="text-xs text-gray-500 mt-1">Vous êtes à jour !</p>
              </div>
            ) : (
              <div className="max-h-[28rem] overflow-y-auto">
                {displayedNotifications.map((notification, index) => (
                  <div key={notification.id}>
                    <div
                      className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors group ${
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
                        navigate('/overview'); // Ou une page dédiée aux notifications
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
                navigate('/settings/notifications');
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