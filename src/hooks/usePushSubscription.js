import { useState, useCallback } from 'react';
import notificationService from '../services/notificationService';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const usePushSubscription = () => {
  const [isSubscribing, setIsSubscribing] = useState(false);

  const subscribe = useCallback(async (options = {}) => {
    const { silent = false } = options;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      if (!silent) alert('Trình duyệt của bạn không hỗ trợ Push Notification.');
      return false;
    }

    try {
      setIsSubscribing(true);

      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission !== 'granted') {
        if (!silent) {
          alert('Trình duyệt đã từ chối quyền gửi thông báo (Trạng thái: ' + permission + '). Bạn cần vào Cài đặt trình duyệt để cấp quyền.');
        }
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      if (!registration) {
        if (!silent) alert('Lỗi: Không tìm thấy Service Worker.');
        return false;
      }

      const vapidRes = await notificationService.getVapidKey();
      if (!vapidRes || !vapidRes.success || !vapidRes.data || !vapidRes.data.publicKey) {
        if (!silent) alert('Lỗi: Không lấy được VAPID Key từ máy chủ.');
        return false;
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapidRes.data.publicKey);
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        await existingSubscription.unsubscribe();
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      await notificationService.subscribeToPushNotification({
        subscription: subscription.toJSON(),
        deviceName: window.navigator.userAgent,
        browser: 'Admin UI'
      });

      return true;

    } catch (err) {
      console.error('Failed to subscribe:', err);
      return false;
    } finally {
      setIsSubscribing(false);
    }
  }, []);

  return { subscribe, isSubscribing };
};

export default usePushSubscription;
