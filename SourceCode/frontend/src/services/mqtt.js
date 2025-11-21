import mqtt from 'mqtt';

const DEFAULT_URL = 'wss://e4b01f831a674150bbae2854b6f1735c.s1.eu.hivemq.cloud:8884/mqtt';
const DEFAULT_DEVICE_ID = 'petfeeder-feed-node-01';
const DEFAULT_USERNAME = 'quandotrung';
const DEFAULT_PASSWORD = 'Pass1235';

export const createMqttClient = ({
  deviceId,
  onTelemetry,
  onAck,
  onAlert,
  onStatusChange,
} = {}) => {
  const brokerUrl = import.meta.env.VITE_MQTT_URL || DEFAULT_URL;
  const resolvedDeviceId = deviceId || import.meta.env.VITE_DEVICE_ID || DEFAULT_DEVICE_ID;
  const clientId = `spf-web-${Math.random().toString(16).slice(2)}`;
  const username = import.meta.env.VITE_MQTT_USERNAME || DEFAULT_USERNAME;
  const password = import.meta.env.VITE_MQTT_PASSWORD || DEFAULT_PASSWORD;

  const client = mqtt.connect(brokerUrl, {
    clientId,
    clean: true,
    connectTimeout: 6000,
    reconnectPeriod: 5000,
    username,
    password,
  });

  client.on('connect', () => {
    onStatusChange?.('online');
    if (resolvedDeviceId) {
      client.subscribe(`feeder/${resolvedDeviceId}/telemetry`);
      client.subscribe(`feeder/${resolvedDeviceId}/ack`);
      client.subscribe(`feeder/${resolvedDeviceId}/alert`);
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
  const resolvedDeviceId = deviceId || import.meta.env.VITE_DEVICE_ID || DEFAULT_DEVICE_ID;
  if (!client || !resolvedDeviceId) return;
  const payload = JSON.stringify({ action: 'feed_now', ts: Date.now() });
  client.publish(`feeder/${resolvedDeviceId}/command`, payload);
};


