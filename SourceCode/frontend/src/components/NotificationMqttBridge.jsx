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
        // Skip scheduled feeds - they're handled by polling in useNotifications
        // Only handle manual/voice feeds from MQTT
        if (isScheduledAckPayload(payload)) {
          // Scheduled feeds are handled by polling feed history
          // This prevents duplicate notifications
          return;
        }
        // Manual/voice feeds can still be handled here if needed
      },
    });

    return () => clientRef.current?.end(true);
  }, [addNotification]);

  return null;
};

export default NotificationMqttBridge;


