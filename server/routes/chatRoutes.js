// server/routes/chatRoutes.js
// FIX: Recipe AI now works with built-in fallback when Gemini is unavailable
const express = require("express");
const router  = express.Router();
const axios   = require("axios");
const auth    = require("../middleware/authMiddleware");

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

// ── Full built-in recipe database (works 100% offline) ─────────────────
const RECIPES_DB = {
  "egg":       { name:"Egg Bhurji", cookingTime:"10 min", servings:2, tags:["Quick","Protein","Breakfast"], nutrition:{calories:280,protein:"18g",carbs:"8g",fat:"20g",fiber:"1g"}, ingredients:[{name:"Eggs",qty:"4"},{name:"Onion",qty:"1 medium"},{name:"Tomato",qty:"1 medium"},{name:"Green chilli",qty:"2"},{name:"Oil",qty:"1 tbsp"},{name:"Cumin seeds",qty:"½ tsp"},{name:"Turmeric powder",qty:"¼ tsp"},{name:"Red chilli powder",qty:"½ tsp"},{name:"Salt",qty:"to taste"},{name:"Coriander leaves",qty:"2 tbsp"}], steps:[{step:1,instruction:"Heat oil, add cumin seeds until they splutter. Add green chilli."},{step:2,instruction:"Add onion, fry until translucent (3 min)."},{step:3,instruction:"Add tomato, cook until soft. Add all spices and salt."},{step:4,instruction:"Crack eggs into pan. Scramble on medium heat keeping slightly moist."},{step:5,instruction:"Garnish with coriander. Serve with roti or toast."}] },
  "dal":       { name:"Dal Tadka", cookingTime:"25 min", servings:3, tags:["Protein","Comfort","Veg"], nutrition:{calories:280,protein:"14g",carbs:"38g",fat:"7g",fiber:"8g"}, ingredients:[{name:"Toor dal",qty:"1 cup"},{name:"Tomatoes, chopped",qty:"2"},{name:"Onion, chopped",qty:"1"},{name:"Garlic cloves",qty:"4"},{name:"Ginger",qty:"½ inch"},{name:"Ghee",qty:"2 tbsp"},{name:"Cumin seeds",qty:"1 tsp"},{name:"Turmeric",qty:"½ tsp"},{name:"Red chilli powder",qty:"1 tsp"},{name:"Garam masala",qty:"½ tsp"},{name:"Salt",qty:"to taste"}], steps:[{step:1,instruction:"Pressure cook dal with turmeric and salt for 3 whistles. Let release naturally."},{step:2,instruction:"Heat ghee, add cumin seeds, garlic, ginger — fry 1 min."},{step:3,instruction:"Add onion, fry golden-brown (5 min). Add tomatoes, cook until oil separates."},{step:4,instruction:"Add chilli powder and garam masala, cook 1 min."},{step:5,instruction:"Pour tadka over cooked dal, stir and simmer 3 min. Serve with rice or roti."}] },
  "poha":      { name:"Masala Poha", cookingTime:"15 min", servings:2, tags:["Breakfast","Quick","Light"], nutrition:{calories:250,protein:"5g",carbs:"42g",fat:"7g",fiber:"3g"}, ingredients:[{name:"Thick Poha (flattened rice)",qty:"2 cups"},{name:"Onion, chopped",qty:"1 large"},{name:"Green chilli",qty:"2"},{name:"Mustard seeds",qty:"1 tsp"},{name:"Curry leaves",qty:"10"},{name:"Turmeric",qty:"½ tsp"},{name:"Oil",qty:"1 tbsp"},{name:"Lemon juice",qty:"1 tbsp"},{name:"Salt",qty:"to taste"},{name:"Sev and coriander",qty:"for garnish"}], steps:[{step:1,instruction:"Rinse poha under water, drain, rest 5 min until soft but not mushy."},{step:2,instruction:"Heat oil, add mustard seeds until they pop. Add curry leaves and chilli."},{step:3,instruction:"Add onion, fry golden (3 min)."},{step:4,instruction:"Add turmeric and salt. Add poha, toss gently on low flame 2-3 min."},{step:5,instruction:"Squeeze lemon, garnish with sev and coriander. Serve immediately."}] },
  "paneer":    { name:"Paneer Butter Masala", cookingTime:"30 min", servings:3, tags:["Veg","Rich","Restaurant Style"], nutrition:{calories:420,protein:"18g",carbs:"22g",fat:"30g",fiber:"3g"}, ingredients:[{name:"Paneer, cubed",qty:"250g"},{name:"Tomatoes, pureed",qty:"3 large"},{name:"Onion",qty:"1 large"},{name:"Cashews, soaked",qty:"10"},{name:"Butter",qty:"3 tbsp"},{name:"Fresh cream",qty:"3 tbsp"},{name:"Ginger-garlic paste",qty:"1 tbsp"},{name:"Kashmiri chilli powder",qty:"2 tsp"},{name:"Garam masala",qty:"½ tsp"},{name:"Kasuri methi",qty:"1 tsp"},{name:"Sugar",qty:"1 tsp"},{name:"Salt",qty:"to taste"}], steps:[{step:1,instruction:"Blend tomatoes, onion, and soaked cashews into a completely smooth paste."},{step:2,instruction:"Heat butter. Sauté ginger-garlic paste 1 min. Add blended paste, cook 10-12 min stirring constantly."},{step:3,instruction:"Add kashmiri chilli, garam masala, sugar, salt. Cook 2 min until color deepens."},{step:4,instruction:"Reduce heat, add fresh cream. Add ½ cup water if too thick. Simmer 3-4 min."},{step:5,instruction:"Add paneer, fold gently. Crush kasuri methi and sprinkle over. Cook 3 min. Serve with naan."}] },
  "rice":      { name:"Veg Fried Rice", cookingTime:"20 min", servings:3, tags:["Quick","Rice","Indo-Chinese"], nutrition:{calories:380,protein:"10g",carbs:"65g",fat:"8g",fiber:"4g"}, ingredients:[{name:"Cooked rice (cooled)",qty:"2 cups"},{name:"Mixed veg (carrot, peas, corn, beans)",qty:"1 cup"},{name:"Onion, chopped",qty:"1"},{name:"Garlic, minced",qty:"4 cloves"},{name:"Soy sauce",qty:"2 tbsp"},{name:"Vinegar",qty:"1 tbsp"},{name:"Oil",qty:"2 tbsp"},{name:"Pepper powder",qty:"½ tsp"},{name:"Salt",qty:"to taste"}], steps:[{step:1,instruction:"Use cold day-old rice for best results — freshly cooked rice makes it mushy."},{step:2,instruction:"Heat oil on high flame. Fry garlic 30 sec. Add onion, stir-fry 2 min."},{step:3,instruction:"Add vegetables, stir-fry on high heat 3 min until slightly charred."},{step:4,instruction:"Add rice, spread flat. Let it sit 1 min without stirring to get slight crispiness."},{step:5,instruction:"Add soy sauce, vinegar, pepper. Toss quickly on high flame 2 min. Serve hot."}] },
  "chicken":   { name:"Butter Chicken", cookingTime:"40 min", servings:4, tags:["Non-veg","Rich","Classic"], nutrition:{calories:480,protein:"40g",carbs:"18g",fat:"28g",fiber:"3g"}, ingredients:[{name:"Chicken, boneless",qty:"500g"},{name:"Tomatoes, pureed",qty:"4 large"},{name:"Onion",qty:"2 large"},{name:"Ginger-garlic paste",qty:"2 tbsp"},{name:"Butter",qty:"4 tbsp"},{name:"Fresh cream",qty:"4 tbsp"},{name:"Kashmiri chilli powder",qty:"2 tsp"},{name:"Garam masala",qty:"1 tsp"},{name:"Kasuri methi",qty:"1 tsp"},{name:"Sugar",qty:"1 tsp"},{name:"Salt",qty:"to taste"}], steps:[{step:1,instruction:"Marinate chicken with yogurt, ginger-garlic paste, spices. Grill or pan-fry until charred. Set aside."},{step:2,instruction:"Melt butter, fry onions until golden. Add ginger-garlic paste, cook 2 min."},{step:3,instruction:"Add tomato puree, kashmiri chilli. Cook 10-12 min until butter separates."},{step:4,instruction:"Blend sauce smooth. Return to pan. Add cream, sugar, salt. Simmer 5 min."},{step:5,instruction:"Add grilled chicken, kasuri methi. Cook 8-10 min on low. Serve with butter naan."}] },
  "khichdi":   { name:"Moong Dal Khichdi", cookingTime:"20 min", servings:3, tags:["Comfort","Healthy","Easy"], nutrition:{calories:320,protein:"14g",carbs:"52g",fat:"7g",fiber:"6g"}, ingredients:[{name:"Rice",qty:"1 cup"},{name:"Yellow moong dal",qty:"½ cup"},{name:"Ghee",qty:"1 tbsp"},{name:"Cumin seeds",qty:"1 tsp"},{name:"Hing (asafoetida)",qty:"pinch"},{name:"Turmeric",qty:"½ tsp"},{name:"Ginger",qty:"1 inch"},{name:"Green chilli",qty:"1"},{name:"Salt",qty:"to taste"},{name:"Water",qty:"3 cups"}], steps:[{step:1,instruction:"Wash rice and dal together 3 times. Soak 10 min. Drain."},{step:2,instruction:"Heat ghee in pressure cooker. Add cumin and hing, let splutter."},{step:3,instruction:"Add ginger, green chilli, turmeric. Add rice-dal mixture, stir to coat."},{step:4,instruction:"Add 3 cups water and salt. Pressure cook 3 whistles on medium."},{step:5,instruction:"Let pressure release naturally. Mash lightly. Drizzle extra ghee. Serve with pickle and curd."}] },
  "upma":      { name:"Vegetable Upma", cookingTime:"15 min", servings:2, tags:["Breakfast","South Indian","Quick"], nutrition:{calories:230,protein:"7g",carbs:"38g",fat:"7g",fiber:"4g"}, ingredients:[{name:"Semolina (sooji/rava)",qty:"1 cup"},{name:"Mixed veg (carrot, peas, beans)",qty:"½ cup"},{name:"Onion",qty:"1 medium"},{name:"Mustard seeds",qty:"½ tsp"},{name:"Chana dal",qty:"1 tsp"},{name:"Curry leaves",qty:"8-10"},{name:"Green chilli",qty:"2"},{name:"Oil",qty:"1 tbsp"},{name:"Water",qty:"2 cups (hot)"},{name:"Lemon juice",qty:"1 tbsp"},{name:"Salt",qty:"to taste"}], steps:[{step:1,instruction:"Dry roast semolina on medium heat 3-4 min until aromatic and lightly golden. Set aside."},{step:2,instruction:"Heat oil. Add mustard seeds, chana dal, curry leaves, chilli — let splutter."},{step:3,instruction:"Add onion, fry until translucent. Add vegetables, cook 2 min."},{step:4,instruction:"Add 2 cups boiling water and salt. Bring to boil."},{step:5,instruction:"Add roasted rava slowly while stirring. Cover and cook on low 2-3 min. Squeeze lemon. Serve with chutney."}] },
  "chole":     { name:"Chole Masala", cookingTime:"40 min", servings:4, tags:["Veg","Protein","Punjab"], nutrition:{calories:360,protein:"18g",carbs:"52g",fat:"10g",fiber:"12g"}, ingredients:[{name:"Chickpeas, soaked overnight",qty:"2 cups"},{name:"Onions, finely chopped",qty:"2 large"},{name:"Tomatoes, pureed",qty:"3 large"},{name:"Ginger-garlic paste",qty:"2 tbsp"},{name:"Chole masala",qty:"2 tbsp"},{name:"Amchur (dry mango powder)",qty:"1 tsp"},{name:"Oil",qty:"3 tbsp"},{name:"Salt",qty:"to taste"}], steps:[{step:1,instruction:"Pressure cook chickpeas with salt for 6-8 whistles until soft. Reserve water."},{step:2,instruction:"Heat oil. Fry onions deep golden-brown on medium heat (10-12 min) — this is the key step."},{step:3,instruction:"Add ginger-garlic paste, cook 2 min. Add tomato puree, cook until oil separates (8-10 min)."},{step:4,instruction:"Add chole masala and amchur. Cook 2 min."},{step:5,instruction:"Add chickpeas with their water. Simmer 15 min. Mash some chickpeas to thicken. Serve with bhature."}] },
  "biryani":   { name:"Veg Biryani", cookingTime:"50 min", servings:4, tags:["Rice","Special","Veg"], nutrition:{calories:450,protein:"10g",carbs:"78g",fat:"10g",fiber:"5g"}, ingredients:[{name:"Basmati rice",qty:"2 cups"},{name:"Mixed vegetables",qty:"2 cups"},{name:"Onions, sliced thin",qty:"3 large"},{name:"Yogurt",qty:"½ cup"},{name:"Biryani masala",qty:"2 tbsp"},{name:"Ginger-garlic paste",qty:"2 tbsp"},{name:"Mint and coriander",qty:"½ cup each"},{name:"Saffron in warm milk",qty:"few strands + 3 tbsp milk"},{name:"Ghee",qty:"3 tbsp"},{name:"Oil",qty:"2 tbsp"},{name:"Salt",qty:"to taste"}], steps:[{step:1,instruction:"Soak basmati 30 min. Parboil with whole spices and salt until 70% cooked. Drain."},{step:2,instruction:"Fry onions in oil until deep golden-crispy (15 min). Drain. Keep half for garnish."},{step:3,instruction:"Mix vegetables with yogurt, ginger-garlic, biryani masala, half fried onions, salt. Marinate 20 min."},{step:4,instruction:"In a heavy pot, layer marinated veggies at bottom. Top with half rice, then mint-coriander. Add remaining rice."},{step:5,instruction:"Drizzle saffron milk, remaining onions, and ghee on top. Cover tight. Dum cook 5 min high + 20 min lowest flame. Rest 10 min."}] },
};

// ── Find recipe from query ──────────────────────────────────────────────
function findBuiltIn(query) {
  const q = query.toLowerCase();
  for (const [key, recipe] of Object.entries(RECIPES_DB)) {
    if (q.includes(key) || key.includes(q.replace(/recipe|how to make|make|simple|easy|quick|healthy|protein|rich/g,"").trim())) {
      return recipe;
    }
  }
  return null;
}

// ── Call Gemini for recipe ──────────────────────────────────────────────
async function callGeminiRecipe(query, pantryList, dietPref) {
  if (!GEMINI_KEY) return null;

  const prompt = `You are a professional Indian chef. Create a COMPLETE recipe for: "${query}".
${pantryList ? `Available ingredients: ${pantryList}` : ""}
${dietPref ? `Diet preference: ${dietPref}` : ""}

IMPORTANT: Respond ONLY with a valid JSON object. No markdown, no code blocks, no extra text.
Use this EXACT structure:
{
  "name": "Recipe Name",
  "cookingTime": "25 min",
  "servings": 2,
  "tags": ["Quick", "Veg"],
  "nutrition": { "calories": 300, "protein": "12g", "carbs": "40g", "fat": "8g", "fiber": "4g" },
  "ingredients": [
    { "name": "Rice", "qty": "1 cup" },
    { "name": "Water", "qty": "2 cups" }
  ],
  "steps": [
    { "step": 1, "instruction": "First step details here." },
    { "step": 2, "instruction": "Second step details here." }
  ]
}`;

  const res = await axios.post(GEMINI_URL, {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 2000, temperature: 0.4 },
  }, { timeout: 25000 });

  const raw   = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(clean);
}

// ══════════════════════════════════════════════════════════════════
//  POST /api/chat/recipe  —  Main AI recipe endpoint
// ══════════════════════════════════════════════════════════════════
router.post("/recipe", auth, async (req, res) => {
  const { query, pantryItems, dietPreference } = req.body;
  if (!query?.trim()) return res.status(400).json({ message: "Query is required" });

  const pantryList = Array.isArray(pantryItems)
    ? pantryItems.map(i => `${i.name}(${i.quantity}${i.unit || ""})`).join(", ")
    : null;

  // 1️⃣  Try Gemini first
  if (GEMINI_KEY) {
    try {
      const recipe = await callGeminiRecipe(query, pantryList, dietPreference);
      if (recipe?.name && recipe?.steps?.length > 0) {
        return res.json({ ...recipe, source: "gemini", aiGenerated: true });
      }
    } catch (err) {
      if (err.response?.status === 429) {
        // Rate limited — fall through to built-in
        console.log("[Recipe AI] Gemini rate limited, using built-in");
      } else {
        console.log("[Recipe AI] Gemini failed:", err.message);
      }
    }
  }

  // 2️⃣  Try built-in database
  const builtin = findBuiltIn(query);
  if (builtin) {
    return res.json({ ...builtin, source: "builtin", aiGenerated: false });
  }

  // 3️⃣  Generate a generic recipe from the query name
  const name = query.charAt(0).toUpperCase() + query.slice(1).toLowerCase();
  return res.json({
    name,
    cookingTime: "25 min",
    servings:    2,
    source:      "generated",
    aiGenerated: false,
    tags:        ["Homemade"],
    nutrition:   { calories: 300, protein: "12g", carbs: "40g", fat: "8g", fiber: "4g" },
    ingredients: [
      { name: "Main ingredient", qty: "as needed" },
      { name: "Oil",             qty: "2 tbsp"    },
      { name: "Onion",           qty: "1 medium"  },
      { name: "Tomato",          qty: "1 medium"  },
      { name: "Ginger-garlic paste", qty: "1 tsp" },
      { name: "Spices (turmeric, chilli, garam masala)", qty: "to taste" },
      { name: "Salt",            qty: "to taste"  },
    ],
    steps: [
      { step: 1, instruction: "Prepare all ingredients. Chop onion and tomato finely." },
      { step: 2, instruction: "Heat oil in a pan on medium flame. Add onion and fry until golden (4-5 min)." },
      { step: 3, instruction: "Add ginger-garlic paste and fry 1 min. Add tomato and cook until oil separates." },
      { step: 4, instruction: "Add all spices and salt. Mix well and cook 2 min." },
      { step: 5, instruction: "Add the main ingredient. Cook covered on medium heat until done. Garnish and serve hot." },
    ],
    note: !GEMINI_KEY
      ? "Add GEMINI_API_KEY to server/.env for detailed AI-generated recipes!"
      : "Tip: Be more specific (e.g. 'egg bhurji', 'dal tadka', 'paneer butter masala') for best results.",
  });
});

// ══════════════════════════════════════════════════════════════════
//  POST /api/chat  —  General AI chat (Gemini with built-in fallback)
// ══════════════════════════════════════════════════════════════════
const MEAL_PLANS = {
  "weight loss": {
    title: "7-Day Weight Loss Meal Plan",
    calories: "1400-1600/day",
    days: [
      { day: "Monday",    breakfast: "Oats porridge + banana",          lunch: "Dal + 2 roti + salad",      dinner: "Grilled chicken/paneer + vegetables" },
      { day: "Tuesday",   breakfast: "Egg whites (3) + whole wheat toast", lunch: "Khichdi + curd",          dinner: "Soup + salad + 1 roti" },
      { day: "Wednesday", breakfast: "Poha + green tea",                 lunch: "Rajma + rice (½ cup)",      dinner: "Stir-fried vegetables + dal" },
      { day: "Thursday",  breakfast: "Moong dal chilla + chutney",       lunch: "Chicken salad bowl",        dinner: "Vegetable soup + 2 roti" },
      { day: "Friday",    breakfast: "Greek yogurt + berries",           lunch: "Chole + 1 bhature",         dinner: "Fish curry + ½ cup rice" },
      { day: "Saturday",  breakfast: "Upma + buttermilk",               lunch: "Mixed veg sabzi + 2 roti",  dinner: "Paneer tikka + salad" },
      { day: "Sunday",    breakfast: "Idli (3) + sambar",               lunch: "Biryani (small portion)",   dinner: "Light khichdi + curd" },
    ],
  },
  "high protein": {
    title: "7-Day High Protein Meal Plan",
    calories: "2000-2200/day",
    days: [
      { day: "Monday",    breakfast: "4 eggs + oats + milk",           lunch: "Chicken breast + rice + dal",  dinner: "Paneer bhurji + roti + curd" },
      { day: "Tuesday",   breakfast: "Greek yogurt + nuts + banana",   lunch: "Rajma chawal + buttermilk",    dinner: "Grilled fish + vegetables" },
      { day: "Wednesday", breakfast: "Moong sprouts + eggs (2)",       lunch: "Egg curry + 3 roti",           dinner: "Chicken tikka + salad" },
      { day: "Thursday",  breakfast: "Protein shake + poha",           lunch: "Chole + bhature + lassi",      dinner: "Dal makhani + 2 roti" },
      { day: "Friday",    breakfast: "Omelette (3 eggs) + toast",      lunch: "Mutton curry + rice",          dinner: "Paneer sabzi + roti + curd" },
      { day: "Saturday",  breakfast: "Dahi + nuts + fruit bowl",       lunch: "Chicken biryani",              dinner: "Fish fry + dal + roti" },
      { day: "Sunday",    breakfast: "Idli + sambar (protein-rich)",   lunch: "Mixed dal + rice",             dinner: "Egg bhurji + paratha" },
    ],
  },
  "diabetic": {
    title: "7-Day Diabetic-Friendly Meal Plan",
    calories: "1600-1800/day",
    days: [
      { day: "Monday",    breakfast: "Oats + chia seeds + nuts",         lunch: "Moong dal + 2 small roti + salad",  dinner: "Grilled fish/paneer + vegetables" },
      { day: "Tuesday",   breakfast: "Vegetable upma + buttermilk",      lunch: "Rajma + brown rice (½ cup)",        dinner: "Chicken soup + 2 roti" },
      { day: "Wednesday", breakfast: "Moong dal chilla + green chutney", lunch: "Mixed vegetables + dal + 2 roti",   dinner: "Grilled paneer + salad" },
      { day: "Thursday",  breakfast: "Egg white omelette + multigrain toast", lunch: "Chole + 2 roti (no bhature)", dinner: "Dal + vegetables + 1 roti" },
      { day: "Friday",    breakfast: "Greek yogurt (unsweetened) + berries", lunch: "Fish curry + ½ cup rice",     dinner: "Vegetable soup + 1 roti" },
      { day: "Saturday",  breakfast: "Poha (less oil) + green tea",      lunch: "Dal tadka + 2 roti",               dinner: "Chicken tikka + salad" },
      { day: "Sunday",    breakfast: "Idli (3) + sambar + coconut chutney", lunch: "Mixed dal khichdi",            dinner: "Paneer sabzi + 1 roti" },
    ],
  },
};

const BUILT_IN_RESPONSES = {
  "what can i cook":  "Based on common pantry items, here are quick options:\n\n🍽️ **Today's Suggestions:**\n- **Dal Rice** — toor dal + rice (30 min)\n- **Egg Bhurji** — eggs + onion + tomato (10 min)\n- **Poha** — flattened rice + onion + spices (15 min)\n- **Upma** — sooji + vegetables (15 min)\n- **Khichdi** — rice + moong dal (20 min)\n\nTip: Add items to your **Pantry** to get personalized suggestions!",
  "nutrition":        "📊 **Quick Nutrition Reference (per 100g):**\n- **Rice (cooked):** 130 cal, 2.7g protein\n- **Roti (wheat):** 297 cal, 8.7g protein, 2.4g fat\n- **Dal (toor):** 116 cal, 8.6g protein, 8g fiber\n- **Paneer:** 265 cal, 18g protein, 20g fat\n- **Eggs:** 155 cal, 13g protein, 11g fat\n- **Chicken breast:** 165 cal, 31g protein, 3.6g fat\n\nFor detailed info, check the **Nutrition** page!",
  "grocery":          "🛒 **Smart Grocery Planning Tips:**\n\n1. Check your **Pantry** before shopping\n2. Plan your **weekly meals** first\n3. Buy staples in bulk (dal, rice, atta, oil)\n4. Fresh vegetables 2-3 times/week\n5. Keep these always stocked:\n   - Onions, tomatoes, garlic, ginger\n   - Toor dal, moong dal, chana dal\n   - Rice, atta, oil, ghee\n   - Eggs (non-veg) or paneer (veg)\n   - Basic spices kit",
  "breakfast":        "🌅 **Quick Indian Breakfast Ideas:**\n\n⚡ **Under 15 min:**\n- Egg Bhurji with toast\n- Poha with sev\n- Upma with chutney\n\n⏰ **Under 30 min:**\n- Moong dal chilla\n- Vegetable paratha with curd\n- Besan cheela with mint chutney\n\n🏋️ **High Protein:**\n- Omelette (3 eggs) with multigrain toast\n- Paneer bhurji with roti\n- Greek yogurt with nuts and fruits",
};

router.post("/", auth, async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ message: "Message is required" });

  const q = message.toLowerCase();

  // 1️⃣  Try Gemini
  if (GEMINI_KEY) {
    try {
      const r = await axios.post(GEMINI_URL, {
        contents: [{ role: "user", parts: [{ text: `You are HomeHub AI Kitchen Assistant. Answer this kitchen/food/recipe query in a helpful, concise way: "${message}". Keep response under 300 words. Use emojis and formatting.` }] }],
        generationConfig: { maxOutputTokens: 800, temperature: 0.7 },
      }, { timeout: 20000 });

      const reply = r.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply?.trim()) return res.json({ reply, source: "gemini" });
    } catch (err) {
      console.log("[Chat] Gemini failed:", err.message);
    }
  }

  // 2️⃣  Meal plan responses
  for (const [key, plan] of Object.entries(MEAL_PLANS)) {
    if (q.includes(key)) {
      const table = plan.days.map(d =>
        `**${d.day}:** Breakfast: ${d.breakfast} | Lunch: ${d.lunch} | Dinner: ${d.dinner}`
      ).join("\n");
      return res.json({ reply: `🗓️ **${plan.title}** (${plan.calories} cal/day)\n\n${table}\n\n💡 *Adjust portions based on your specific health goals and doctor's advice.*`, source: "builtin" });
    }
  }

  // 3️⃣  Built-in keyword responses
  for (const [key, reply] of Object.entries(BUILT_IN_RESPONSES)) {
    if (q.includes(key.split(" ")[0])) {
      return res.json({ reply, source: "builtin" });
    }
  }

  // 4️⃣  Check if it's a recipe query
  const builtin = findBuiltIn(q);
  if (builtin) {
    const steps = builtin.steps.map(s => `${s.step}. ${s.instruction}`).join("\n");
    const ings  = builtin.ingredients.map(i => `• ${i.name} — ${i.qty}`).join("\n");
    return res.json({ reply: `🍽️ **${builtin.name}**\n⏱️ ${builtin.cookingTime} | 👥 Serves ${builtin.servings} | 🔥 ${builtin.nutrition.calories} cal\n\n**Ingredients:**\n${ings}\n\n**Steps:**\n${steps}`, source: "builtin" });
  }

  // 5️⃣  Generic fallback
  return res.json({
    reply: `I can help with recipes, meal plans, and nutrition! Try asking:\n\n- "How to make egg bhurji"\n- "Weight loss meal plan"\n- "High protein breakfast ideas"\n- "What can I cook today"\n- "Nutrition info for dal"\n\n💡 *Add GEMINI_API_KEY to server/.env for full AI capabilities!*`,
    source: "fallback",
  });
});

// ── Health check ────────────────────────────────────────────────────────
router.get("/test", (req, res) => {
  res.json({
    status:   "ok",
    gemini:   GEMINI_KEY ? "configured" : "missing — add to server/.env",
    builtIn:  `${Object.keys(RECIPES_DB).length} recipes available`,
    mealPlans: Object.keys(MEAL_PLANS).join(", "),
  });
});

module.exports = router;