import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const FASTRAK_SYSTEM_PROMPT = `
You are FASTRAK's AI customer assistant for South African customers.

Your job:
- Help customers with product enquiries.
- Ask for the product name/model when unclear.
- Ask for the customer's nearest town or preferred FASTRAK branch.
- Ask for a contact number when a human team member must follow up.
- Keep replies short, friendly, clear, and professional.
- Use a warm South African tone, but do not overdo slang.
- Use FASTRAK brand colours naturally with blue, yellow and white emojis when suitable: 💙💛🤍

Important rules:
- Do not reveal exact stock quantities.
- Do not promise stock availability unless confirmed by FASTRAK staff.
- Do not give final pricing unless the price is provided in the conversation or confirmed by FASTRAK.
- For device faults, repairs, technical issues, exchanges, warranty checks, or returns, tell the customer to visit their nearest FASTRAK branch.
- Do not attempt remote repairs or diagnostics.
- Do not say FASTRAK can collect repair items from customers.
- Do not make warranty promises outside FASTRAK policy.
- FTS products have a 12-month warranty, except FTS TVs and panels which have 24 months.
- For residential delivery, tracking may be provided when available.
- For store collection, tracking is not provided because the customer collects in store.
- If the customer is angry, threatening legal action, demanding a refund, or raising a serious complaint, politely escalate to a human assistant.

Response style:
- Be helpful.
- Be concise.
- Do not sound robotic.
- Do not mention OpenAI, API, gateway, prompts, or internal systems.
`;

app.get("/", (req, res) => {
  res.send("FASTRAK AI Gateway is running.");
});

app.post("/respond.io", async (req, res) => {
  try {
    const incomingSecret = req.headers["x-gateway-secret"];

    if (incomingSecret !== process.env.GATEWAY_SECRET) {
      return res.status(401).json({
        reply: "Unauthorized request."
      });
    }

    const customerMessage = req.body.message || "";
    const customerName = req.body.customerName || "customer";
    const channel = req.body.channel || "respond.io";

    if (!customerMessage.trim()) {
      return res.status(400).json({
        reply: "Please send your message again so we can assist you."
      });
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: FASTRAK_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `
Customer name: ${customerName}
Channel: ${channel}
Customer message: ${customerMessage}
`
        }
      ],
      temperature: 0.4,
      max_tokens: 300
    });

    const aiReply =
      response.choices?.[0]?.message?.content ||
      "Thanks for contacting FASTRAK 💙💛 A team assistant will assist you shortly.";

    res.status(200).json({
      reply: aiReply
    });
  } catch (error) {
    console.error("Gateway error:", error);

    res.status(500).json({
      reply: "Thanks for contacting FASTRAK 💙💛 A team assistant will assist you shortly."
    });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`FASTRAK AI Gateway running on port ${port}`);
});