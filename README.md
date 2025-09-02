# Automate WhatsApp Webhook

A minimal Node.js app that listens to WhatsApp messages via `@open-wa/wa-automate` and forwards them to an n8n Webhook.

## What it does

- Runs a headless WhatsApp Web client (multi-device).
- Receives inbound messages (non-group).
- If the message contains an image, downloads the full image (base64).
- Sends a JSON payload to your n8n Webhook with sender info, message, timestamps, chatId, message history, and optional image base64.

See [index.js](http://_vscodecontentref_/10) for details.

## Requirements

- Node.js 18+
- Google Chrome or Chromium installed
- An n8n instance with a Webhook workflow
- A phone with WhatsApp (to link via QR)

## Setup

1. Install dependencies

```bash
npm install
```

2. Configure the Webhook URL

Edit [index.js](http://_vscodecontentref_/11) and set your [N8N_WEBHOOK_URL](http://_vscodecontentref_/12) constant to the Production URL of your n8n Webhook node.

> Optional: If you need Chromium, set `executablePath` to your Chromium binary path and set [useChrome: false](http://_vscodecontentref_/13).

3. Run the app

```bash
node index.js
# or
npm start
```

Scan the QR code with WhatsApp when prompted (first run). The app will keep running and forward messages to n8n.

## Payload schema (POST to n8n)

```json
{
  "from": "string",
  "savedName": "string",
  "number": "string",
  "timestamp": 1717777777,
  "filePath": "string|null",
  "message": "string",
  "messageHistory": [ ... ],
  "phone": "string",
  "type": "chat|image|... ",
  "chatId": "string",
  "date": "string",
  "time": "string",
  "image": "data:image/jpeg;base64,.... (optional)"
}
```

## n8n workflow (step-by-step)

1. Create a new workflow.
2. Add a Webhook node
   - Method: `POST`
   - Path: `whatsapp-inbound` (or any path)
   - Respond: On Received, with 200 and `{ "status": "ok" }`
   - Copy the Production URL and put it in [index.js](http://_vscodecontentref_/14)
3. (Optional) Branch by message type with a Switch node on `{{$json["type"]}}`.
4. To save images:
   - Add a Function node to convert [image](http://_vscodecontentref_/15) base64 data URL into binary property:

```javascript
const items = $input.all();
return items.map((item) => {
  const img = item.json.image;
  if (img && typeof img === 'string' && img.startsWith('data:')) {
    const [meta, b64] = img.split(',');
    const match = meta.match(/data:(.*);base64/);
    const mimeType = match ? match[1] : 'image/jpeg';
    const data = Buffer.from(b64, 'base64');

    item.binary = item.binary || {};
    item.binary.image = {
      data,
      mimeType,
      fileName: `wa_${item.json.timestamp}.jpg`,
    };
  }
  return item;
});
```

   - Add a Write Binary File node to persist the file (Binary Property: [image](http://_vscodecontentref_/16)).
5. Store or forward data (DB, Google Sheets, HTTP, etc.).
6. Execute and send a WhatsApp message to test.

## Troubleshooting

- If Chrome fails to launch, set `executablePath` and/or ensure Chrome/Chromium is installed.
- If QR doesn’t show, maximize your terminal or re-run the app.
- If images are large, consider removing [messageHistory](http://_vscodecontentref_/17) to reduce payload size.
- Avoid committing your production webhook URL to public repos.

## Run 24/7 (Windows)

### Option A: PM2 (recommended)
```powershell
cd "C:\MyPersonelProjects\automate whatsapp webhook"
npm i -g pm2 pm2-windows-startup

# Start with ecosystem file (uses name: automate-whatsapp-webhook)
npm run pm2:start

# Persist across reboots
pm2 save
pm2-startup install

# Manage
pm2 ls
npm run pm2:logs    # or: pm2 logs automate-whatsapp-webhook
npm run pm2:restart # or: pm2 restart automate-whatsapp-webhook
npm run pm2:stop    # or: pm2 stop automate-whatsapp-webhook
npm run pm2:delete  # or: pm2 delete automate-whatsapp-webhook
```

Alternative (no ecosystem file):
```powershell
pm2 start index.js --name automate-whatsapp-webhook --time
```

### Option B: Windows Service (NSSM)
```powershell
choco install nssm -y
nssm install WhatsAppWebhook "C:\Program Files\nodejs\node.exe" "C:\MyPersonelProjects\automate whatsapp webhook\index.js"
nssm start WhatsAppWebhook
```

> Keep the machine awake (disable sleep) and ensure Chrome/Chromium is installed.

## License

ISC (see [package.json](http://_vscodecontentref_/18))