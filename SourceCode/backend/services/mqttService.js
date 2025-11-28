import dotenv from "dotenv";
dotenv.config();

import mqtt from "mqtt";

const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
const topic = process.env.MQTT_FEED_TOPIC || "petfeeder/feed";
const username = process.env.MQTT_USERNAME;
const password = process.env.MQTT_PASSWORD;

if (!brokerUrl || !username || !password) {
  console.warn("MQTT configuration incomplete. Check your .env file:");
  console.warn(`  MQTT_BROKER_URL: ${brokerUrl ? "✓" : "✗"}`);
  console.warn(`  MQTT_USERNAME: ${username ? "✓" : "✗"}`);
  console.warn(`  MQTT_PASSWORD: ${password ? "✓" : "✗"}`);
}

let isConnected = false;
const clientId = `petfeeder-backend-${Date.now()}-${Math.random().toString(36).substring(7)}`;

const options = {
  clientId,
  username,
  password,
  reconnectPeriod: 5000,
  connectTimeout: 10000,
  ...(brokerUrl.startsWith("mqtts://") && {
    protocol: "mqtts",
    rejectUnauthorized: true,
  }),
};

console.log(`Attempting MQTT connection to: ${brokerUrl.replace(/\/\/.*@/, "//***:***@")}`);
console.log(`Client ID: ${clientId}`);

const client = mqtt.connect(brokerUrl, options);

// pending ACKs map: key = issuedAt (string) -> { resolve, reject, timeoutId }
const pendingAcks = new Map();
const DEFAULT_ACK_TIMEOUT = 15000; // 15s

client.on("connect", () => {
  isConnected = true;
  console.log("✅ MQTT connected successfully");
  console.log(`   Broker: ${brokerUrl.replace(/\/\/.*@/, "//***:***@")}`);
  console.log(`   Client ID: ${clientId}`);

  // Subscribe to all device ack topics so backend can receive feed ACKs from ESP32 devices
  // ack topic pattern on device: feeder/{deviceId}/ack
  client.subscribe("feeder/+/ack", { qos: 1 }, (err, granted) => {
    if (err) {
      console.error("Failed to subscribe to ack topics:", err);
    } else {
      console.log("Subscribed to ack topics:", granted.map(g => g.topic).join(", "));
    }
  });
});

client.on("reconnect", () => {
  console.log("🔄 MQTT reconnecting...");
});

client.on("error", (error) => {
  isConnected = false;
  console.error("❌ MQTT error:", error.message);
  console.error("   Full error:", error);
});

client.on("close", () => {
  isConnected = false;
  console.log("🔌 MQTT connection closed");
});

client.on("offline", () => {
  isConnected = false;
  console.log("📴 MQTT client went offline");
});

// global message handler - route feeding ACKs to pending promises
client.on("message", (topicName, payload) => {
  try {
    const str = payload.toString();
    const parsed = JSON.parse(str);

    // expecting type "feeding_complete" and an issuedAt to correlate
    const issuedAt = parsed?.issuedAt;
    const type = parsed?.type;

    if (type === "feeding_complete" && issuedAt != null) {
      const key = String(issuedAt);
      const pending = pendingAcks.get(key);
      if (pending) {
        clearTimeout(pending.timeoutId);
        pendingAcks.delete(key);
        pending.resolve(parsed);
      } else {
        // No pending waiter — still log for debugging
        console.log("Received feeding_complete but no pending request for issuedAt:", issuedAt);
      }
    } else {
      // Not an ack of interest; ignore or log
      // console.log("MQTT message received on", topicName, "-", str);
    }
  } catch (err) {
    console.error("Failed to parse MQTT message:", err);
  }
});

/**
 * Publish a feed command and wait for device ACK (feeding_complete) correlated by issuedAt.
 * payload should include issuedAt (ms timestamp). If missing, this function will add one.
 * Resolves with parsed ACK object from device, or rejects on publish error / timeout / not connected.
 */
export const publishFeedCommand = (payload = {}, { timeoutMs = DEFAULT_ACK_TIMEOUT } = {}) =>
  new Promise((resolve, reject) => {
    if (!isConnected) {
      return reject(new Error("MQTT client is not connected"));
    }

    // Ensure issuedAt correlation id
    const issuedAt = payload.issuedAt || Date.now();
    payload.issuedAt = issuedAt;

    const message = JSON.stringify(payload);

    // store pending ack before publishing to avoid race
    const key = String(issuedAt);
    const timeoutId = setTimeout(() => {
      if (pendingAcks.has(key)) {
        pendingAcks.delete(key);
        reject(new Error("ACK timeout"));
      }
    }, timeoutMs);

    pendingAcks.set(key, { resolve, reject, timeoutId });

    client.publish(topic, message, { qos: 1 }, (error) => {
      if (error) {
        clearTimeout(timeoutId);
        pendingAcks.delete(key);
        return reject(error);
      }
      // published successfully — now waiting for ACK (resolve occurs in client.on('message'))
    });
  });

