import React, { useEffect, useState } from 'react';
import { Bell, Trash2, CheckCheck, X } from 'lucide-react';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface Props {
  onClose?: () => void;
}

const NotificationsScreen: React.FC<Props> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch('http://localhost:5000/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notificationId }),
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch('http://localhost:5000/api/notifications/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notificationId }),
      });

      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm('Delete all notifications?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch('http://localhost:5000/api/notifications/clear-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const playSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Bell className="mx-auto mb-4 text-pink-400 animate-bounce" size={48} />
          <p className="text-slate-500 font-bold">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800">📬 Inbox</h1>
          <p className="text-slate-500 font-bold">You have {unreadCount} unread notifications</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X size={24} className="text-slate-600" />
          </button>
        )}
      </div>

      {/* Clear All Button */}
      {notifications.length > 0 && (
        <button
          onClick={clearAllNotifications}
          className="w-full py-2 text-red-500 font-bold text-sm border-2 border-red-200 rounded-[15px] active:scale-95 transition-transform"
        >
          🗑️ Delete All Notifications
        </button>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="mx-auto mb-4 text-slate-300" size={64} />
          <p className="text-slate-500 font-bold text-lg">No notifications yet!</p>
          <p className="text-slate-400 text-sm">You'll get updates here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              className={`p-4 rounded-[20px] border-2 transition-all ${
                notif.isRead
                  ? 'bg-slate-50 border-slate-100'
                  : 'bg-blue-50 border-blue-200 shadow-md'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-slate-800">{notif.title}</h3>
                    {!notif.isRead && (
                      <span className="px-2 py-1 bg-blue-400 text-white text-xs font-bold rounded-full">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 font-medium mb-2">{notif.message}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(notif.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!notif.isRead && (
                    <button
                      onClick={() => {
                        markAsRead(notif._id);
                        playSound();
                      }}
                      className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full transition-colors active:scale-90"
                      title="Mark as read"
                    >
                      <CheckCheck size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notif._id)}
                    className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors active:scale-90"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsScreen;
