import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(bodyParser.json());

const { WHATSAPP_TOKEN, PHONE_NUMBER_ID, VERIFY_TOKEN } = process.env;

// Verify webhook (Meta requirement)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Handle messages
app.post("/webhook", async (req, res) => {
  const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (message) {
    const from = message.from;
    const text = message.text?.body?.toLowerCase();

    let reply = "";

    if (text.includes("feedback")) {
      reply = "Please rate our recent event from 1 to 5 ⭐";
    } else if (["1", "2", "3", "4", "5"].includes(text)) {
      reply = "Thank you for your rating! Would you like to leave a comment?";
    } else if (text.includes("yes")) {
      reply = "You'll now receive updates for future events 🎉";
    } else if (text.includes("update")) {
      reply = "📢 Upcoming Event: Tech Fest 2025, 10th Nov at City Hall!";
    } else {
      reply = "👋 Welcome! Type 'feedback' to share feedback or 'update' for event info.";
    }

    await axios.post(
      `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: from,
        text: { body: reply },
      },
      {
        headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
      }
    );
  }

  res.sendStatus(200);
});

app.listen(3000, () => console.log("✅ WhatsApp bot running on port 3000"));
