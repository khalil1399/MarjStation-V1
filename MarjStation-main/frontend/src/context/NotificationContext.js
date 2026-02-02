import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/firebase/notificationService';
import { toast } from '../hooks/use-toast';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [fcmToken, setFcmToken] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasPromptedPermission, setHasPromptedPermission] = useState(false);

  // Check if notifications are supported
  const isSupported = notificationService.isSupported();

  // Load notifications and preferences when user logs in
  useEffect(() => {
    if (currentUser) {
      loadNotifications();
      loadPreferences();
      checkPermissionStatus();
      setupForegroundListener();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setFcmToken(null);
      setPreferences(null);
      setLoading(false);
    }
  }, [currentUser]);

  // Set up real-time listener for notifications
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = notificationService.listenToNotifications(
      currentUser.uid,
      (notifs) => {
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const loadNotifications = async () => {
    if (!currentUser) return;
    
    try {
      const notifs = await notificationService.getUserNotifications(currentUser.uid);
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    if (!currentUser) return;
    
    try {
      const prefs = await notificationService.getPreferences(currentUser.uid);
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const checkPermissionStatus = () => {
    const status = notificationService.getPermissionStatus();
    setPermissionStatus(status);
    
    // Check if we already have a token
    if (status === 'granted' && currentUser) {
      notificationService.getUserToken(currentUser.uid).then(tokenData => {
        if (tokenData?.token) {
          setFcmToken(tokenData.token);
        }
      });
    }
  };

  const setupForegroundListener = useCallback(() => {
    notificationService.setupForegroundListener((payload) => {
      console.log('Foreground notification:', payload);
      
      // Show toast notification
      toast({
        title: payload.notification?.title || 'New Notification',
        description: payload.notification?.body,
      });

      // Show local notification if app is in background tab
      if (document.hidden) {
        notificationService.showLocalNotification(
          payload.notification?.title || 'HungerStation',
          {
            body: payload.notification?.body,
            data: payload.data
          }
        );
      }

      // Refresh notifications
      loadNotifications();
    });
  }, []);

  // Request permission and register for push notifications
  const requestNotificationPermission = async () => {
    if (!currentUser || !isSupported) {
      return { success: false, error: 'Not available' };
    }

    try {
      const permResult = await notificationService.requestPermission();
      setPermissionStatus(permResult.permission || 'denied');

      if (permResult.success) {
        const tokenResult = await notificationService.registerAndGetToken(currentUser.uid);
        if (tokenResult.success) {
          setFcmToken(tokenResult.token);
          toast({
            title: 'Notifications Enabled',
            description: 'You will now receive push notifications.'
          });
        }
        return tokenResult;
      }

      return permResult;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return { success: false, error: error.message };
    }
  };

  // Disable push notifications
  const disableNotifications = async () => {
    if (!currentUser) return { success: false };

    try {
      await notificationService.removeToken(currentUser.uid);
      setFcmToken(null);
      toast({
        title: 'Notifications Disabled',
        description: 'You will no longer receive push notifications.'
      });
      return { success: true };
    } catch (error) {
      console.error('Error disabling notifications:', error);
      return { success: false, error: error.message };
    }
  };

  // Update notification preferences
  const updatePreferences = async (newPreferences) => {
    if (!currentUser) return { success: false };

    try {
      await notificationService.savePreferences(currentUser.uid, newPreferences);
      setPreferences(newPreferences);
      return { success: true };
    } catch (error) {
      console.error('Error updating preferences:', error);
      return { success: false, error: error.message };
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (!currentUser) return;

    try {
      await notificationService.markAsRead(currentUser.uid, notificationId);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!currentUser) return;

    try {
      await notificationService.markAllAsRead(currentUser.uid);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    if (!currentUser) return;

    try {
      await notificationService.deleteNotification(currentUser.uid, notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    if (!currentUser) return;

    try {
      await notificationService.clearAllNotifications(currentUser.uid);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  // Send notification (for admin/seller actions)
  const sendNotification = async (targetUserId, notification) => {
    try {
      return await notificationService.queueNotification(targetUserId, notification);
    } catch (error) {
      console.error('Error sending notification:', error);
      return { success: false, error: error.message };
    }
  };

  // Notify admins
  const notifyAdmins = async (notification) => {
    try {
      return await notificationService.notifyAdmins(notification);
    } catch (error) {
      console.error('Error notifying admins:', error);
      return { success: false, error: error.message };
    }
  };

  // Check if should prompt for permission (smart timing)
  const shouldPromptPermission = () => {
    if (!isSupported) return false;
    if (permissionStatus !== 'default') return false;
    if (hasPromptedPermission) return false;
    return true;
  };

  const setPrompted = () => {
    setHasPromptedPermission(true);
  };

  const value = {
    // State
    notifications,
    unreadCount,
    permissionStatus,
    fcmToken,
    preferences,
    loading,
    isSupported,
    isPushEnabled: !!fcmToken,
    
    // Actions
    requestNotificationPermission,
    disableNotifications,
    updatePreferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    sendNotification,
    notifyAdmins,
    
    // Helpers
    shouldPromptPermission,
    setPrompted,
    refreshNotifications: loadNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
