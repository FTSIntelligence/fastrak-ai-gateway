# FASTRAK AI Gateway

Production-oriented Node.js gateway connecting Respond.io webhooks to OpenAI and sending the generated reply back through Respond.io.

## The webhook URL

Use:

```text
https://fastrak-ai-gateway.onrender.com/respondio
```

## Render settings

- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/health`

## Required Render environment variables

Add these under **Render > fastrak-ai-gateway > Environment**:

```text
OPENAI_API_KEY=<real OpenAI API key>
OPENAI_MODEL=gpt-5-mini
RESPONDIO_API_TOKEN=<real Respond.io Developer API token>
RESPONDIO_API_BASE_URL=https://api.respond.io/v2
RESPONDIO_WEBHOOK_SECRET=<Respond.io webhook signing key>
GATEWAY_SECRET=<different long random secret>
MAX_HISTORY_MESSAGES=16
```

Do not add quotation marks. Do not commit `.env`.

## Respond.io webhook configuration

1. Open **Workspace Settings > Integrations > Webhooks**.
2. Add a webhook.
3. Endpoint URL:
   `https://fastrak-ai-gateway.onrender.com/respondio`
4. Event: **New Incoming Message**
5. Start with **Text** only during the first test.
6. Copy the webhook signing key shown by Respond.io.
7. Put that exact signing key into Render as `RESPONDIO_WEBHOOK_SECRET`.
8. Save the webhook.

## Respond.io Developer API token

1. Open **Workspace Settings > Integrations > Developer API**.
2. Create an access token.
3. Copy it once.
4. Store it in Render as `RESPONDIO_API_TOKEN`.

The API base URL must be:

```text
https://api.respond.io/v2
```

## First deployment test

Open:

```text
https://fastrak-ai-gateway.onrender.com/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "fastrak-ai-gateway"
}
```

Then send a plain text message from a real connected customer channel.

Watch **Render > Logs**. A successful flow ends with:

```text
AI reply sent to Respond.io contact ...
```

## Important first-test settings

Use only the Respond.io **Text** message type at first. Attachments, locations, product messages and story replies require separate handling. Once text works, those can be added safely.

## Preventing double replies

Disable any Respond.io AI Agent or Workflow that also replies to the same incoming messages. Otherwise the customer may receive both the external OpenAI reply and an internal Respond.io reply.

## Render free-instance warning

A free Render service may sleep after inactivity. The first request after sleeping can be delayed. Respond.io requires the webhook to return HTTP 200 within five seconds and may retry delayed requests. For live customer support, use an always-on Render instance after testing.

## Local protected AI test

The `/test-ai` endpoint tests OpenAI without sending anything through Respond.io.

Example:

```bash
curl -X POST "https://fastrak-ai-gateway.onrender.com/test-ai" \
  -H "Content-Type: application/json" \
  -H "X-Gateway-Secret: YOUR_GATEWAY_SECRET" \
  -d '{"message":"Do you have Bluetooth speakers?"}'
```

## Security design

- Respond.io webhooks are verified with `X-Webhook-Signature`.
- Verification uses HMAC-SHA256 and the exact raw JSON body.
- The server acknowledges valid webhooks immediately.
- OpenAI work happens after the HTTP 200 response.
- Respond.io API calls use Bearer authentication.
- Duplicate webhook deliveries are ignored temporarily.
