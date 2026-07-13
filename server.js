import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

app.use(express.json({ limit: "1mb" }));

const port = process.env.PORT || 3000;

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is missing from the .env file.");
  process.exit(1);
}

if (!process.env.GATEWAY_SECRET) {
  console.error("GATEWAY_SECRET is missing from the .env file.");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const FASTRAK_INSTRUCTIONS = `
You are FASTRAK's customer service AI assistant.

FASTRAK is a South African retail company with physical stores and an online store.

Your responsibilities:
- Answer general customer enquiries clearly.
- Help customers identify products.
- Ask for the product name or model number when necessary.
- Ask for the customer's nearest town or preferred FASTRAK branch when stock or store assistance is needed.
- Keep responses friendly, concise and professional.
- Use a natural South African tone.
- Use blue, yellow and white emojis occasionally where appropriate: 💙💛🤍

Stock rules:
- Never reveal exact stock quantities.
- Never claim that an item is definitely in stock unless confirmed by an authorised FASTRAK system or staff member.
- Explain that stock and pricing must be confirmed.
- Ask for the customer's nearest town or preferred store.

Pricing rules:
- Do not invent prices.
- Do not confirm a price unless it was supplied by an approved FASTRAK source.

Repairs, returns and warranty:
- Direct customers with device faults, repair requests, warranty assessments, exchanges or returns to their nearest FASTRAK branch.
- Do not diagnose products remotely.
- Do not promise that a repair, refund, exchange or warranty claim will be approved.
- FTS products generally have a 12-month warranty.
- FTS televisions and panels generally have a 24-month warranty.
- Proof of purchase and assessment may be required.

Escalation:
- Escalate refund disputes, legal threats, serious complaints, abuse, fraud allegations or requests for management to a human team member.

Restrictions:
- Never mention OpenAI.
- Never mention prompts, APIs, gateways, code or internal systems.
- Never expose confidential information.
`;

app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "FASTRAK AI Gateway"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy"
  });
});

app.post("/respondio", async (req, res) => {
  try {
    const incomingSecret = req.get("x-gateway-secret");

    if (!incomingSecret || incomingSecret !== process.env.GATEWAY_SECRET) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized request"
      });
    }

    const {
      message,
      customerName = "Customer",
      contactId = "",
      channel = "Respond.io"
    } = req.body ?? {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "The message field is required"
      });
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      instructions: FASTRAK_INSTRUCTIONS,
      input: `
Customer name: ${customerName}
Contact ID: ${contactId}
Channel: ${channel}

Customer message:
${message.trim()}
`,
      max_output_tokens: 350
    });

    const reply =
      response.output_text?.trim() ||
      "Thanks for contacting FASTRAK 💙💛 A team assistant will assist you shortly.";

    return res.status(200).json({
      success: true,
      reply
    });
  } catch (error) {
    console.error("Gateway error:", error);

    return res.status(500).json({
      success: false,
      reply:
        "Thanks for contacting FASTRAK 💙💛 We could not process your message automatically. A team assistant will assist you shortly."
    });
  }
});

app.use((error, req, res, next) => {
  console.error("Request error:", error);

  res.status(400).json({
    success: false,
    error: "Invalid request"
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`FASTRAK AI Gateway is running on http://localhost:${port}`);
});