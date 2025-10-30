import { create, ev } from "@open-wa/wa-automate";
import fetch from "node-fetch";

// Replace with your actual n8n webhook URL
const N8N_WEBHOOK_URL =
  "https://enter your n8n webhook url";

create({
  sessionId: "79a47160-9af8-4a35-8813-feaa2408ee45",
  multiDevice: true,
  headless: true,
  useChrome: true,
  // executablePath: "/usr/bin/chromium",
  messagePreprocessor: "AUTO_DECRYPT_SAVE",
  qrTimeout: 0, // Wait forever for QR scan
}).then((client) => start(client));

function start(client) {
  console.log("🚀 WhatsApp client started! Listening for messages...");
  
  // Monitor connection status
  client.onStateChanged((state) => {
    console.log(`📱 WhatsApp state changed: ${state}`);
  });
  
  client.onMessage(async (message) => {
    if (message.body && !message.isGroupMsg) {
      console.log(
        `New message from ${message.sender.pushname}: ${message.body}`
      );
      const contact = await client.getContact(message.sender.id);
      const savedName =
        contact?.formattedName ||
        contact?.name ||
        message.sender.pushname ||
        message.sender.id;
      let fullImageBase64 = null;

      // Send to n8n webhook
      try {
        if (message.mimetype && message.type === "image") {
          console.log(
            `📷 Image received from ${savedName}. Downloading full image...`
          );
          fullImageBase64 = await client.downloadMedia(message);
        }
        let messageHistory = null;
        const date = new Date(message.timestamp * 1000); // Convert timestamp to milliseconds
        const formattedDate = date.toLocaleDateString(); // Format date
        const formattedTime = date.toLocaleTimeString(); // Format time
        try {
          messageHistory = await client.loadAndGetAllMessagesInChat(
            message.chatId,
            true,
            true
          );
        } catch (error) {
          console.error("Error loading message history:", error);
          messageHistory = [];
        }
        const payload = {
          from: message.sender.formattedName || message.sender.id,
          savedName,
          number: message.sender.id,
          timestamp: message.timestamp,
          filePath: message.filePath,
          message: message.body, // Include the message content
          messageHistory,
          phone: message.sender.id, // Include the sender's phone number
          type: message.type, // Include the message type
          chatId: message.chat.id, // Include the chat ID
          date: formattedDate, // Include the formatted date
          time: formattedTime, // Include the formatted time
        };
        if (fullImageBase64) {
          payload.image = fullImageBase64; // base64 string (data:image/jpeg;base64,...)
        }
        await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        console.log("Message sent to n8n webhook ✅");
      } catch (err) {
        console.error("❌ Failed to send message to webhook:", err);
      }
    }
  });
}
