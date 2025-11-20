import dotenv from "dotenv";
dotenv.config();

import mqtt from "mqtt";

const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
const topic = process.env.MQTT_FEED_TOPIC || "petfeeder/feed";
const username = process.env.MQTT_USERNAME;
const password = process.env.MQTT_PASSWORD;

// Validate environment variables
if (!brokerUrl || !username || !password) {
  console.warn("MQTT configuration incomplete. Check your .env file:");
  console.warn(`  MQTT_BROKER_URL: ${brokerUrl ? "✓" : "✗"}`);
  console.warn(`  MQTT_USERNAME: ${username ? "✓" : "✗"}`);
  console.warn(`  MQTT_PASSWORD: ${password ? "✓" : "✗"}`);
}

let isConnected = false;

// Generate unique client ID
const clientId = `petfeeder-backend-${Date.now()}-${Math.random().toString(36).substring(7)}`;

const options = {
  clientId,
  username,
  password,
  reconnectPeriod: 5000, // Increase reconnect delay to 5 seconds
  connectTimeout: 10000, // 10 seconds timeout
  // TLS options for mqtts:// (secure connection)
  ...(brokerUrl.startsWith("mqtts://") && {
    protocol: "mqtts",
    rejectUnauthorized: true, // Verify server certificate
  }),
};

console.log(`Attempting MQTT connection to: ${brokerUrl.replace(/\/\/.*@/, "//***:***@")}`);
console.log(`Client ID: ${clientId}`);

const client = mqtt.connect(brokerUrl, options);

client.on("connect", () => {
  isConnected = true;
  console.log("✅ MQTT connected successfully");
  console.log(`   Broker: ${brokerUrl.replace(/\/\/.*@/, "//***:***@")}`);
  console.log(`   Client ID: ${clientId}`);
});

client.on("reconnect", () => {
  console.log("🔄 MQTT reconnecting...");
});

client.on("error", (error) => {
  isConnected = false;
  console.error("❌ MQTT error:", error.message);
  console.error("   Full error:", error);
  // Log helpful debugging info
  if (error.message.includes("ECONNREFUSED")) {
    console.error("   → Check if broker URL and port are correct");
  } else if (error.message.includes("ENOTFOUND")) {
    console.error("   → Check if broker hostname is correct");
  } else if (error.message.includes("certificate") || error.message.includes("TLS")) {
    console.error("   → TLS/SSL certificate issue. Check broker URL uses mqtts://");
  } else if (error.message.includes("Not authorized") || error.message.includes("401")) {
    console.error("   → Authentication failed. Check username and password");
  }
});

client.on("close", () => {
  isConnected = false;
  console.log("🔌 MQTT connection closed");
});

client.on("offline", () => {
  isConnected = false;
  console.log("📴 MQTT client went offline");
});

export const publishFeedCommand = (payload) =>
  new Promise((resolve, reject) => {
    if (!isConnected) {
      return reject(new Error("MQTT client is not connected"));
    }

    const message = JSON.stringify(payload);
    client.publish(topic, message, { qos: 1 }, (error) => {
      if (error) {
        return reject(error);
      }
      return resolve();
    });
  });

