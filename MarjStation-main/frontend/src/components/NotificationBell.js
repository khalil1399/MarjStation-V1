import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Bell, 
  BellOff, 
  Check, 
  CheckCheck, 
  Trash2, 
  X,
  ShoppingBag,
  Store,
  UserCheck,
  Package,
  Sparkles,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    permissionStatus,
    isPushEnabled,
    isSupported,
    requestNotificationPermission,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    shouldPromptPermission,
    setPrompted
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    
    // Show permission prompt on first interaction if appropriate
    if (shouldPromptPermission() && !showPermissionPrompt) {
      setShowPermissionPrompt(true);
      setPrompted();
    }
  };

  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission();
    if (result.success) {
      setShowPermissionPrompt(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    const data = notification.data || {};
    switch (notification.type) {
      case 'new_order':
        navigate(data.isAdmin ? '/admin/orders' : '/seller');
        break;
      case 'order_status':
        navigate('/orders');
        break;
      case 'seller_request':
        navigate('/admin/seller-requests');
        break;
      case 'product_approval':
        navigate(data.status === 'approved' ? '/seller/restaurants' : '/seller/pending');
        break;
      case 'order_confirmation':
        navigate('/orders');
        break;
      default:
        if (data.url) navigate(data.url);
    }

    setIsOpen(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_order':
      case 'order_confirmation':
      case 'order_status':
        return <ShoppingBag className="h-5 w-5 text-orange-500" />;
      case 'seller_request':
        return <UserCheck className="h-5 w-5 text-blue-500" />;
      case 'product_approval':
        return <Package className="h-5 w-5 text-green-500" />;
      case 'promotion':
        return <Sparkles className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBellClick}
        className="relative"
        data-testid="notification-bell"
      >
        {isPushEnabled ? (
          <Bell className="h-5 w-5" />
        ) : (
          <BellOff className="h-5 w-5 text-gray-400" />
        )}
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <Card className="absolute right-0 top-full mt-2 w-80 md:w-96 z-50 shadow-xl max-h-[70vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="h-8 px-2 text-xs"
                      title="Mark all as read"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllNotifications}
                      className="h-8 px-2 text-xs text-red-600 hover:text-red-700"
                      title="Clear all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Permission Prompt */}
            {showPermissionPrompt && permissionStatus === 'default' && (
              <div className="p-4 bg-blue-50 border-b">
                <p className="text-sm text-blue-800 mb-2">
                  Enable push notifications to stay updated on orders and updates.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleEnableNotifications}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Enable
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPermissionPrompt(false)}
                  >
                    Not now
                  </Button>
                </div>
              </div>
            )}

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.slice(0, 20).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                      data-testid={`notification-${notification.id}`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm ${!notification.read ? 'font-semibold' : ''} text-gray-900`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">
                            {notification.body}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {!isPushEnabled && isSupported && permissionStatus !== 'denied' && (
              <div className="p-3 bg-gray-50 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEnableNotifications}
                  className="w-full"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Enable Push Notifications
                </Button>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
