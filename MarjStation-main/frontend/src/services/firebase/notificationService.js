import { getToken, onMessage, deleteToken } from 'firebase/messaging';
import { ref, set, get, update, remove, push, onValue, off } from 'firebase/database';
import { database, getMessagingInstance, VAPID_KEY } from '../../config/firebase';

export const notificationService = {
  // Check if notifications are supported
  isSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  },

  // Get current permission status
  getPermissionStatus() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission; // 'granted', 'denied', or 'default'
  },

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported()) {
      console.log('Push notifications not supported');
      return { success: false, error: 'Not supported' };
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return { success: permission === 'granted', permission };
    } catch (error) {
      console.error('Error requesting permission:', error);
      return { success: false, error: error.message };
    }
  },

  // Register service worker and get FCM token
  async registerAndGetToken(userId) {
    if (!this.isSupported()) {
      return { success: false, error: 'Not supported' };
    }

    if (Notification.permission !== 'granted') {
      return { success: false, error: 'Permission not granted' };
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered:', registration);

      // Get messaging instance
      const messaging = await getMessagingInstance();
      if (!messaging) {
        return { success: false, error: 'Messaging not available' };
      }

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (token) {
        console.log('FCM Token:', token);
        // Save token to database
        await this.saveToken(userId, token);
        return { success: true, token };
      } else {
        return { success: false, error: 'No token received' };
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return { success: false, error: error.message };
    }
  },

  // Save FCM token to Firebase database
  async saveToken(userId, token) {
    try {
      const tokenRef = ref(database, `fcmTokens/${userId}`);
      const deviceInfo = this.getDeviceInfo();
      
      await set(tokenRef, {
        token,
        deviceInfo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log('FCM token saved to database');
      return { success: true };
    } catch (error) {
      console.error('Error saving token:', error);
      throw error;
    }
  },

  // Get device info for token management
  getDeviceInfo() {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop';

    // Detect browser
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    // Detect OS
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    // Detect device type
    if (ua.includes('Mobile') || ua.includes('Android')) device = 'Mobile';
    else if (ua.includes('Tablet') || ua.includes('iPad')) device = 'Tablet';

    return { browser, os, device };
  },

  // Remove FCM token (when user logs out or disables notifications)
  async removeToken(userId) {
    try {
      const messaging = await getMessagingInstance();
      if (messaging) {
        await deleteToken(messaging);
      }

      const tokenRef = ref(database, `fcmTokens/${userId}`);
      await remove(tokenRef);

      console.log('FCM token removed');
      return { success: true };
    } catch (error) {
      console.error('Error removing token:', error);
      throw error;
    }
  },

  // Get user's FCM token
  async getUserToken(userId) {
    try {
      const tokenRef = ref(database, `fcmTokens/${userId}`);
      const snapshot = await get(tokenRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    } catch (error) {
      console.error('Error getting user token:', error);
      return null;
    }
  },

  // Get all tokens for a list of user IDs
  async getTokensForUsers(userIds) {
    try {
      const tokens = [];
      for (const userId of userIds) {
        const tokenData = await this.getUserToken(userId);
        if (tokenData?.token) {
          tokens.push({ userId, token: tokenData.token });
        }
      }
      return tokens;
    } catch (error) {
      console.error('Error getting tokens for users:', error);
      return [];
    }
  },

  // Save notification preferences
  async savePreferences(userId, preferences) {
    try {
      const prefsRef = ref(database, `notificationPreferences/${userId}`);
      await set(prefsRef, {
        ...preferences,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
    }
  },

  // Get notification preferences
  async getPreferences(userId) {
    try {
      const prefsRef = ref(database, `notificationPreferences/${userId}`);
      const snapshot = await get(prefsRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      
      // Default preferences
      return {
        enabled: true,
        orderUpdates: true,
        promotions: false,
        sellerUpdates: true,
        adminAlerts: true
      };
    } catch (error) {
      console.error('Error getting preferences:', error);
      return null;
    }
  },

  // Listen to foreground messages
  setupForegroundListener(callback) {
    getMessagingInstance().then(messaging => {
      if (messaging) {
        onMessage(messaging, (payload) => {
          console.log('Foreground message received:', payload);
          callback(payload);
        });
      }
    });
  },

  // Store notification in database for in-app display
  async storeNotification(userId, notification) {
    try {
      const notificationsRef = ref(database, `notifications/${userId}`);
      const newNotificationRef = push(notificationsRef);
      
      await set(newNotificationRef, {
        ...notification,
        read: false,
        createdAt: new Date().toISOString()
      });

      return { success: true, id: newNotificationRef.key };
    } catch (error) {
      console.error('Error storing notification:', error);
      throw error;
    }
  },

  // Get user notifications
  async getUserNotifications(userId, limit = 50) {
    try {
      const notificationsRef = ref(database, `notifications/${userId}`);
      const snapshot = await get(notificationsRef);
      
      if (snapshot.exists()) {
        const notifications = [];
        snapshot.forEach((child) => {
          notifications.push({ id: child.key, ...child.val() });
        });
        return notifications
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, limit);
      }
      return [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  },

  // Listen to user notifications in real-time
  listenToNotifications(userId, callback) {
    const notificationsRef = ref(database, `notifications/${userId}`);
    const listener = onValue(notificationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const notifications = [];
        snapshot.forEach((child) => {
          notifications.push({ id: child.key, ...child.val() });
        });
        callback(notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } else {
        callback([]);
      }
    });
    return () => off(notificationsRef, 'value', listener);
  },

  // Mark notification as read
  async markAsRead(userId, notificationId) {
    try {
      const notificationRef = ref(database, `notifications/${userId}/${notificationId}`);
      await update(notificationRef, { read: true, readAt: new Date().toISOString() });
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark all notifications as read
  async markAllAsRead(userId) {
    try {
      const notifications = await this.getUserNotifications(userId);
      const updates = {};
      
      notifications.forEach(n => {
        if (!n.read) {
          updates[`notifications/${userId}/${n.id}/read`] = true;
          updates[`notifications/${userId}/${n.id}/readAt`] = new Date().toISOString();
        }
      });

      if (Object.keys(updates).length > 0) {
        const rootRef = ref(database);
        await update(rootRef, updates);
      }

      return { success: true };
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  },

  // Delete notification
  async deleteNotification(userId, notificationId) {
    try {
      const notificationRef = ref(database, `notifications/${userId}/${notificationId}`);
      await remove(notificationRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Clear all notifications
  async clearAllNotifications(userId) {
    try {
      const notificationsRef = ref(database, `notifications/${userId}`);
      await remove(notificationsRef);
      return { success: true };
    } catch (error) {
      console.error('Error clearing notifications:', error);
      throw error;
    }
  },

  // Get unread count
  async getUnreadCount(userId) {
    try {
      const notifications = await this.getUserNotifications(userId);
      return notifications.filter(n => !n.read).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  },

  // Queue notification for sending via Cloud Function
  async queueNotification(targetUserId, notification) {
    try {
      const queueRef = ref(database, 'notificationQueue');
      const newQueueRef = push(queueRef);
      
      await set(newQueueRef, {
        targetUserId,
        notification: {
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/logo192.png',
          data: notification.data || {}
        },
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      // Also store in user's notifications for in-app display
      await this.storeNotification(targetUserId, {
        title: notification.title,
        body: notification.body,
        type: notification.data?.type || 'general',
        data: notification.data || {}
      });

      return { success: true, id: newQueueRef.key };
    } catch (error) {
      console.error('Error queueing notification:', error);
      throw error;
    }
  },

  // Send notification to admin users
  async notifyAdmins(notification) {
    try {
      // Get all admin users
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const promises = [];
        snapshot.forEach((child) => {
          const user = child.val();
          if (user.role === 'admin' || user.isAdmin) {
            promises.push(this.queueNotification(child.key, notification));
          }
        });
        await Promise.all(promises);
      }

      return { success: true };
    } catch (error) {
      console.error('Error notifying admins:', error);
      throw error;
    }
  },

  // Send notification to sellers
  async notifySellers(notification, sellerIds = null) {
    try {
      if (sellerIds) {
        // Notify specific sellers
        const promises = sellerIds.map(id => this.queueNotification(id, notification));
        await Promise.all(promises);
      } else {
        // Notify all sellers
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        
        if (snapshot.exists()) {
          const promises = [];
          snapshot.forEach((child) => {
            const user = child.val();
            if (user.isSeller) {
              promises.push(this.queueNotification(child.key, notification));
            }
          });
          await Promise.all(promises);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error notifying sellers:', error);
      throw error;
    }
  },

  // Show local notification (for foreground messages)
  showLocalNotification(title, options = {}) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/logo192.png',
        badge: '/logo192.png',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        if (options.data?.url) {
          window.location.href = options.data.url;
        }
        notification.close();
      };

      return notification;
    }
  }
};
