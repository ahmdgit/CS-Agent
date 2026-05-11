import { useState, useCallback, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { playAlertSound } from '../lib/audioAlert';

export function useDesktopNotifications() {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  
  // Keep track of which notifications have been sent to avoid spamming
  const notified5Min = useRef<Set<string>>(new Set());
  const notifiedNow = useRef<Set<string>>(new Set());

  // Request Notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }
  }, []);

  const requestPermissionManually = useCallback(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
        if (permission === 'granted') {
          toast.success('Desktop notifications enabled!');
        } else {
          toast.error(
            'Notifications denied. If you are in a preview window, please open the app in a new tab. Also check your OS settings (Focus Assist/Do Not Disturb).',
            { duration: 8000 }
          );
        }
      });
    }
  }, []);

  const sendNotification = useCallback((title: string, body: string) => {
    // Attempt to play sound (will work if user has interacted with the page)
    playAlertSound();
    
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, { 
        body, 
        icon: '/vite.svg',
        requireInteraction: true // Keep notification on screen until user interacts
      });
      // Try to focus window when clicked
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } else {
      toast.success(`${title} - ${body}`, { icon: '🔔', duration: 15000 });
    }
  }, []);

  const clearNotificationCache = useCallback(() => {
    notified5Min.current.clear();
    notifiedNow.current.clear();
  }, []);

  return {
    notificationPermission,
    requestPermissionManually,
    sendNotification,
    notified5Min,
    notifiedNow,
    clearNotificationCache
  };
}
