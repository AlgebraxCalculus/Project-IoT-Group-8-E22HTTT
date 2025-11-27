import { useEffect, useRef, useState } from 'react';
import { createMqttClient } from '../services/mqtt.js';
import { useNotifications } from '../hooks/useNotifications.jsx';
import { extractAckAmount, isScheduledAckPayload } from '../utils/notificationHelpers.js';

const NotificationMqttBridge = () => {
  const { addNotification } = useNotifications();
  const [locale, setLocale] = useState('vi-VN');
  const localeRef = useRef(locale);
  const clientRef = useRef(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setLocale(navigator.language?.toLowerCase().startsWith('vi') ? 'vi-VN' : 'en-US');
    }
  }, []);

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  useEffect(() => {
    clientRef.current = createMqttClient({
      onAck: (payload) => {
        if (!isScheduledAckPayload(payload)) return;
        const lang = localeRef.current;
        const amount = extractAckAmount(payload, 10);
        addNotification({
          method: 'scheduled',
          amount,
          type: 'info',
          message:
            lang === 'vi-VN'
              ? `Lịch cho ăn ${amount}g đã được thực thi`
              : `Scheduled feed ${amount}g executed`,
          meta: {
            scheduleId: payload.scheduleId || payload.schedule || payload.meta?.scheduleId,
            issuedAt: payload.issuedAt,
          },
        });
      },
    });

    return () => clientRef.current?.end(true);
  }, [addNotification]);

  return null;
};

export default NotificationMqttBridge;


