// Run this to see which Gemini models are available for your API key
// node checkModels.js

require("dotenv").config();
const axios = require("axios");

async function listModels() {
  const key = process.env.GEMINI_API_KEY;
  console.log("Using key:", key ? key.substring(0, 10) + "..." : "NOT FOUND");
  
  try {
    const res = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
    );
    console.log("\nAvailable models:");
    res.data.models.forEach(m => {
      if (m.supportedGenerationMethods?.includes("generateContent")) {
        console.log("✅", m.name);
      }
    });
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
}

listModels();