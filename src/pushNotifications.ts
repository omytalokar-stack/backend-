/**
 * Push Notification Service
 * Handles registration and management of browser push notifications
 */

export const PushNotificationService = {
  /**
   * Request permission and register for push notifications
   */
  async registerForPushNotifications(): Promise<boolean> {
    try {
      // Check if browser supports service workers
      if (!('serviceWorker' in navigator)) {
        console.warn('⚠️ Service Workers not supported');
        return false;
      }

      // Check if browser supports push notifications
      if (!('Notification' in window)) {
        console.warn('⚠️ Notifications not supported');
        return false;
      }

      // Request permission
      if (Notification.permission === 'denied') {
        console.warn('⚠️ Notification permission denied');
        return false;
      }

      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('⚠️ Notification permission not granted');
          return false;
        }
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('✅ Service Worker registered for push notifications');

      // Store registration status
      localStorage.setItem('pushNotificationEnabled', 'true');
      return true;
    } catch (error) {
      console.error('❌ Failed to register for push notifications:', error);
      return false;
    }
  },

  /**
   * Check if push notifications are enabled
   */
  isPushEnabled(): boolean {
    return localStorage.getItem('pushNotificationEnabled') === 'true' &&
           Notification.permission === 'granted';
  },

  /**
   * Send a local notification (for testing)
   */
  async sendLocalNotification(title: string, options?: NotificationOptions): Promise<void> {
    try {
      if (!Notification.permission || Notification.permission !== 'granted') {
        console.warn('⚠️ Notification permission not granted');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      if (registration.showNotification) {
        await registration.showNotification(title, {
          icon: '/icons/icon-192.svg',
          badge: '/icons/icon-192.svg',
          vibrate: [100, 50, 100],
          ...options
        });
        console.log('✅ Local notification sent:', title);
      }
    } catch (error) {
      console.error('❌ Failed to send notification:', error);
    }
  },

  /**
   * Request notification for a booking
   */
  async notifyBooking(bookingId: string, serviceName: string, time: string): Promise<void> {
    try {
      if (!this.isPushEnabled()) {
        console.log('⚠️ Push notifications not enabled');
        return;
      }

      const title = 'Booking Reminder - Princess Parlor';
      const options: NotificationOptions = {
        body: `Your ${serviceName} booking is at ${time}. See you soon! ✨`,
        icon: '/icons/icon-192.svg',
        badge: '/icons/icon-192.svg',
        tag: `booking-${bookingId}`,
        requireInteraction: true,
        vibrate: [100, 50, 100, 50, 100]
      };

      await this.sendLocalNotification(title, options);
    } catch (error) {
      console.error('❌ Failed to notify booking:', error);
    }
  },

  /**
   * Send admin notification via backend
   */
  async sendAdminNotification(userId: string, message: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_URL || '';

      if (!token) {
        console.warn('⚠️ No authentication token');
        return false;
      }

      const response = await fetch(`${API_BASE}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          message,
          title: 'Princess Parlor Service',
          icon: '/icons/icon-192.svg'
        }),
        credentials: 'include'
      });

      if (response.ok) {
        console.log('✅ Notification sent successfully');
        return true;
      } else {
        console.error('❌ Failed to send notification:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      return false;
    }
  },

  /**
   * Initialize push notifications on app load
   */
  async initialize(): Promise<void> {
    try {
      // Auto-register if permission was previously granted
      if (Notification.permission === 'granted') {
        const success = await this.registerForPushNotifications();
        if (success) {
          console.log('✅ Push notifications ready');
          // Send a test notification to confirm
          // await this.sendLocalNotification('Push Notifications Enabled', {
          //   body: 'You will receive booking updates'
          // });
        }
      }
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
    }
  }
};

export default PushNotificationService;
