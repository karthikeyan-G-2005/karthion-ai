import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

const API_KEY = process.env.OPENROUTER_API_KEY;

// chat endpoint
app.post("/api/chat", async (req, res) => {

  try {

    const messages = req.body.messages;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ reply: "No message provided" });
    }

    // convert frontend messages to OpenRouter format
    const formattedMessages = messages.map(m => ({
      role: m.type === "user" ? "user" : "assistant",
      content: m.text
    }));

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openrouter/free",
        messages: formattedMessages
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = response.data.choices?.[0]?.message?.content || "No response";

    res.json({ reply });

  } catch (error) {

    console.error(error.response?.data || error.message);

    res.status(500).json({
      reply: "⚠ AI service error"
    });

  }

});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
