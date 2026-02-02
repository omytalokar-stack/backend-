/**
 * Push Notification Service
 * Handles registration and management of browser push notifications with sound & vibration
 */

// Extend NotificationOptions to support custom properties
interface CustomNotificationOptions extends NotificationOptions {
  sound?: boolean;
  vibrate?: number[];
}

declare global {
  interface ImportMeta {
    env: {
      VITE_PUSH_PUBLIC_KEY?: string;
      VITE_API_URL?: string;
    };
  }
}

// Notification sound helper - plays triple beep
const playNotificationSound = async () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // First beep: 800Hz
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
    
    // Second beep: 600Hz
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.15);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
    oscillator.start(audioContext.currentTime + 0.15);
    oscillator.stop(audioContext.currentTime + 0.25);
    
    // Third beep: 800Hz
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.3);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    oscillator.start(audioContext.currentTime + 0.3);
    oscillator.stop(audioContext.currentTime + 0.4);
  } catch (err) {
    console.warn('⚠️ Could not play notification sound:', err);
  }
};

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

      // Request permission if not already asked
      if (Notification.permission === 'denied') {
        console.warn('⚠️ Notification permission denied by user');
        return false;
      }

      if (Notification.permission === 'default') {
        console.log('🔔 Requesting notification permission from user...');
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('⚠️ User denied notification permission');
          return false;
        }
        console.log('✅ User granted notification permission');
      } else if (Notification.permission === 'granted') {
        console.log('✅ Notification permission already granted');
      }

      // Register service worker for background notifications
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('✅ Service Worker registered for push notifications');

      // Subscribe to PushManager (VAPID public key must be provided via env)
      try {
        const publicKey = (import.meta.env.VITE_PUSH_PUBLIC_KEY || '') as string;
        if (!publicKey) {
          console.warn('⚠️ VAPID public key not provided, skipping push subscription');
          localStorage.setItem('pushNotificationEnabled', 'true');
          return true;
        }

        const converted = urlBase64ToUint8Array(publicKey);
        const existing = await registration.pushManager.getSubscription();
        let sub = existing;
        if (!existing) {
          sub = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: converted });
          console.log('✅ Push subscription created');
        } else {
          console.log('✅ Existing push subscription found');
        }

        // Send subscription to backend to store for admin notifications
        const token = localStorage.getItem('token');
        if (sub && token) {
          await fetch(`${(import.meta.env.VITE_API_URL || '')}/api/notifications/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            credentials: 'include',
            body: JSON.stringify({ subscription: sub })
          }).catch(err => console.warn('⚠️ Failed to send subscription to server', err));
        }

        localStorage.setItem('pushNotificationEnabled', 'true');
        return true;
      } catch (err) {
        console.warn('⚠️ Push subscription failed:', err);
        localStorage.setItem('pushNotificationEnabled', 'false');
        return false;
      }
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
   * Send a local notification with sound and vibration
   */
  async sendLocalNotification(title: string, options?: CustomNotificationOptions): Promise<void> {
    try {
      if (!Notification.permission || Notification.permission !== 'granted') {
        console.warn('⚠️ Notification permission not granted');
        return;
      }

      // Play notification sound
      if (options?.sound !== false) {
        await playNotificationSound();
      }

      // Vibrate device if available
      const vibrationPattern = options?.vibrate || [100, 50, 100, 50, 100];
      if ('vibrate' in navigator) {
        navigator.vibrate(vibrationPattern);
        console.log('📳 Device vibrated with pattern:', vibrationPattern);
      }

      const registration = await navigator.serviceWorker.ready;
      
      if (registration.showNotification) {
        const notificationOptions: any = {
          icon: '/icons/icon-192.svg',
          badge: '/icons/icon-192.svg',
          tag: 'notification',
          requireInteraction: true,
          vibrate: vibrationPattern,
          ...options
        };

        // Remove sound property before passing to showNotification (not standard)
        delete notificationOptions.sound;
        
        await registration.showNotification(title, notificationOptions);
        console.log('✅ Browser notification sent:', title);
      }
    } catch (error) {
      console.error('❌ Failed to send notification:', error);
    }
  },

  // Listen for messages from service worker to play sound types
  listenForWorkerMessages() {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (ev: any) => {
          try {
            const data = ev.data || {};
            if (data && data.type) {
              if (data.type === 'booking') {
                // play bell-like sound
                playBellSound();
              } else if (data.type === 'comment') {
                // play ping sound
                playPingSound();
              }
            }
          } catch (e) { console.error(e); }
        });
      }
    } catch (e) {}
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

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Play bell sound using Web Audio
async function playBellSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = audioContext.createOscillator();
    const g = audioContext.createGain();
    o.connect(g); g.connect(audioContext.destination);
    o.type = 'sine'; o.frequency.value = 660;
    g.gain.setValueAtTime(0.3, audioContext.currentTime);
    o.start(); o.stop(audioContext.currentTime + 0.3);
  } catch (e) { console.warn(e); }
}

// Play ping sound using Web Audio
async function playPingSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = audioContext.createOscillator();
    const g = audioContext.createGain();
    o.connect(g); g.connect(audioContext.destination);
    o.type = 'triangle'; o.frequency.value = 1200;
    g.gain.setValueAtTime(0.25, audioContext.currentTime);
    o.start(); o.stop(audioContext.currentTime + 0.12);
  } catch (e) { console.warn(e); }
}

export default PushNotificationService;
