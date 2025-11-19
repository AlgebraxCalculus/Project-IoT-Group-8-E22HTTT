import mqtt from 'mqtt';

const DEFAULT_URL = 'wss://broker.hivemq.com:8884/mqtt';

export const createMqttClient = ({
  deviceId,
  onTelemetry,
  onAck,
  onAlert,
  onStatusChange,
} = {}) => {
  const brokerUrl = import.meta.env.VITE_MQTT_URL || DEFAULT_URL;
  const clientId = `spf-web-${Math.random().toString(16).slice(2)}`;

  const client = mqtt.connect(brokerUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 5000,
  });

  client.on('connect', () => {
    onStatusChange?.('online');
    if (deviceId) {
      client.subscribe(`feeder/${deviceId}/telemetry`);
      client.subscribe(`feeder/${deviceId}/ack`);
      client.subscribe(`feeder/${deviceId}/alert`);
    }
  });

  client.on('reconnect', () => onStatusChange?.('reconnecting'));
  client.on('close', () => onStatusChange?.('offline'));
  client.on('error', () => onStatusChange?.('offline'));

  client.on('message', (topic, payload) => {
    try {
      const data = JSON.parse(payload.toString());
      if (topic.includes('/telemetry')) {
        onTelemetry?.(data);
      } else if (topic.includes('/ack')) {
        onAck?.(data);
      } else if (topic.includes('/alert')) {
        onAlert?.(data);
      }
    } catch (err) {
      console.error('Failed to parse MQTT payload', err);
    }
  });

  return client;
};

export const publishFeedNow = (client, deviceId) => {
  if (!client || !deviceId) return;
  const payload = JSON.stringify({ action: 'feed_now', ts: Date.now() });
  client.publish(`feeder/${deviceId}/command`, payload);
};


