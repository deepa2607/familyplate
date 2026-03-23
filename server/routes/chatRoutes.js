// routes/chatRoutes.js  —  Server-side AI chat proxy (no CORS issues)
const express = require("express");
const router  = express.Router();
const axios   = require("axios");
const auth    = require("../middleware/authMiddleware");

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_CHAT_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

// ══════════════════════════════════════
//  POST /api/chat
//  Called by AIChat.jsx to get AI responses
// ══════════════════════════════════════
router.post("/", auth, async (req, res) => {
  try {
    const { message, pantry, history = [] } = req.body;
    if (!message) return res.status(400).json({ message: "Message required" });

    const systemContext = `You are HomeHub AI Chef — a friendly, knowledgeable Indian cooking assistant.
You specialise in Indian recipes, meal plans, nutrition advice, and grocery budgeting.
${pantry ? `The user's current pantry items: ${pantry}` : ""}
Always give practical, step-by-step responses. Use emojis to make responses friendly.
Keep answers concise and helpful. Respond in plain text with markdown formatting.`;

    // 1. Try Gemini AI
    if (GEMINI_KEY) {
      try {
        const contents = [
          { role:"user", parts:[{ text: systemContext + "\n\nUser: " + message }] },
        ];
        // Add conversation history (last 6 turns)
        const histSlice = history.slice(-6);
        if (histSlice.length > 0) {
          contents[0].parts[0].text = systemContext;
          histSlice.forEach(h => {
            contents.push({ role: h.role === "assistant" ? "model" : "user", parts:[{ text: h.content }] });
          });
          contents.push({ role:"user", parts:[{ text: message }] });
        }

        const response = await axios.post(GEMINI_CHAT_URL, {
          contents,
          generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
        }, { timeout: 20000 });

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.length > 5) {
          return res.json({ reply: text, source: "gemini" });
        }
      } catch (e) {
        if (e.response?.status === 429) {
          return res.status(429).json({ message: "AI is busy, please try again shortly." });
        }
        console.log("Gemini chat failed:", e.message);
      }
    }

    // 2. Try Pollinations.ai as free fallback (server-side — no CORS issue)
    try {
      const messages = [
        { role: "system", content: `You are HomeHub AI Chef — a friendly Indian cooking assistant. ${pantry ? "User's pantry: " + pantry : ""} Give practical step-by-step responses with emojis.` },
        ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
        { role: "user", content: message },
      ];

      const resp = await axios.post("https://text.pollinations.ai/openai", {
        model:      "openai-large",
        messages,
        max_tokens: 800,
        seed:       42,
      }, { timeout: 15000 });

      const txt = resp.data?.choices?.[0]?.message?.content;
      if (txt && txt.length > 5) {
        return res.json({ reply: txt, source: "pollinations" });
      }
    } catch (e) {
      console.log("Pollinations chat failed:", e.message);
    }

    // 3. No AI available — return null so frontend falls back to built-in
    res.json({ reply: null });

  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;