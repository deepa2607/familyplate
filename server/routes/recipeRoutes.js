// routes/recipeRoutes.js  —  AI Recipe generator + built-in database
const express = require("express");
const router  = express.Router();
const axios   = require("axios");
const auth    = require("../middleware/authMiddleware");

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

// ── Full built-in recipe database ─────────────────────────────────────
const RECIPES_DB = {
  poha: {
    name:"Masala Poha", servings:2, cookingTime:"15 min",
    nutrition:{ calories:250, protein:"5g", carbs:"42g", fat:"7g", fiber:"3g" },
    tags:["Veg","Breakfast","Quick","Maharashtra"],
    ingredients:[
      {name:"Thick Poha (flattened rice)",qty:"2 cups"},
      {name:"Onion, finely chopped",qty:"1 large"},
      {name:"Green chilli",qty:"2"},
      {name:"Mustard seeds",qty:"1 tsp"},
      {name:"Curry leaves",qty:"10 leaves"},
      {name:"Turmeric powder",qty:"½ tsp"},
      {name:"Salt",qty:"to taste"},
      {name:"Oil",qty:"1 tbsp"},
      {name:"Lemon juice",qty:"1 tbsp"},
      {name:"Coriander leaves",qty:"2 tbsp"},
      {name:"Sev (optional)",qty:"for garnish"},
    ],
    steps:[
      {step:1,instruction:"Wash poha thoroughly under running water in a colander. Drain and let it rest for 5 minutes — it should be soft but not mushy."},
      {step:2,instruction:"Heat oil in a pan on medium flame. Add mustard seeds and wait for them to splutter."},
      {step:3,instruction:"Add curry leaves and green chilli, sauté 30 seconds. Add onion and fry until golden, about 3 minutes."},
      {step:4,instruction:"Add turmeric and salt, mix well. Add the drained poha and toss gently to combine everything."},
      {step:5,instruction:"Cook on low flame for 2-3 minutes, tossing occasionally. Don't stir too hard or poha will break."},
      {step:6,instruction:"Remove from heat. Squeeze lemon juice, garnish with coriander and sev. Serve immediately."},
    ],
  },
  "dal tadka": {
    name:"Dal Tadka", servings:3, cookingTime:"25 min",
    nutrition:{ calories:280, protein:"14g", carbs:"38g", fat:"7g", fiber:"8g" },
    tags:["Veg","Lunch","Protein","Classic"],
    ingredients:[
      {name:"Toor dal (split pigeon peas)",qty:"1 cup"},
      {name:"Tomatoes, chopped",qty:"2 medium"},
      {name:"Onion, chopped",qty:"1 medium"},
      {name:"Garlic cloves",qty:"4"},
      {name:"Ginger, grated",qty:"½ inch"},
      {name:"Cumin seeds",qty:"1 tsp"},
      {name:"Turmeric powder",qty:"½ tsp"},
      {name:"Red chilli powder",qty:"1 tsp"},
      {name:"Garam masala",qty:"½ tsp"},
      {name:"Ghee",qty:"2 tbsp"},
      {name:"Salt",qty:"to taste"},
      {name:"Coriander leaves",qty:"2 tbsp"},
    ],
    steps:[
      {step:1,instruction:"Wash dal thoroughly. Pressure cook with 2.5 cups water, turmeric, and salt for 3 whistles. Let pressure release naturally."},
      {step:2,instruction:"Heat ghee in a pan. Add cumin seeds and let them splutter. Add garlic and ginger, fry 1 minute."},
      {step:3,instruction:"Add onion, fry until golden-brown, about 5 minutes on medium flame."},
      {step:4,instruction:"Add tomatoes and cook until they become mushy and oil separates, about 5-6 minutes."},
      {step:5,instruction:"Add red chilli powder and garam masala, mix for 30 seconds."},
      {step:6,instruction:"Pour this tadka over the cooked dal, stir well. Simmer 3 minutes. Garnish with coriander. Serve with rice or roti."},
    ],
  },
  "chicken biryani": {
    name:"Chicken Biryani", servings:4, cookingTime:"60 min",
    nutrition:{ calories:580, protein:"38g", carbs:"68g", fat:"16g", fiber:"3g" },
    tags:["Non-veg","Rice","Special","Hyderabadi"],
    ingredients:[
      {name:"Basmati rice",qty:"2 cups"},
      {name:"Chicken, curry cut",qty:"500g"},
      {name:"Onions, thinly sliced",qty:"3 large"},
      {name:"Yogurt (curd)",qty:"½ cup"},
      {name:"Biryani masala",qty:"2 tbsp"},
      {name:"Ginger-garlic paste",qty:"2 tbsp"},
      {name:"Mint leaves",qty:"½ cup"},
      {name:"Coriander leaves",qty:"½ cup"},
      {name:"Saffron in warm milk",qty:"2 pinches saffron + 3 tbsp milk"},
      {name:"Ghee",qty:"3 tbsp"},
      {name:"Oil for frying",qty:"3 tbsp"},
      {name:"Whole spices (bay leaf, cardamom, cloves, cinnamon)",qty:"1 each"},
      {name:"Salt",qty:"to taste"},
    ],
    steps:[
      {step:1,instruction:"Soak basmati rice for 30 minutes. Parboil with whole spices and salt until 70% cooked (grains should still have a bite). Drain and set aside."},
      {step:2,instruction:"Fry onions in oil until deep golden-brown and crispy (15 min on medium). Drain on paper towel. Separate half for garnish."},
      {step:3,instruction:"Marinate chicken: mix with yogurt, ginger-garlic paste, biryani masala, half the fried onions, salt. Rest 20 minutes minimum."},
      {step:4,instruction:"In a heavy pot, layer chicken on bottom. Top with half the rice, then mint and coriander. Add remaining rice."},
      {step:5,instruction:"Drizzle saffron milk, remaining fried onions, and ghee over the top layer."},
      {step:6,instruction:"Seal pot with foil then lid. Cook on high 5 min, then lowest flame 20 min (dum). Let rest 10 min before opening. Fluff gently, serve with raita."},
    ],
  },
  "paneer butter masala": {
    name:"Paneer Butter Masala", servings:3, cookingTime:"30 min",
    nutrition:{ calories:420, protein:"18g", carbs:"22g", fat:"30g", fiber:"3g" },
    tags:["Veg","Rich","Restaurant Style"],
    ingredients:[
      {name:"Paneer, cubed",qty:"250g"},
      {name:"Tomatoes, pureed",qty:"3 large"},
      {name:"Onion, chopped",qty:"1 large"},
      {name:"Cashews, soaked 20 min",qty:"10"},
      {name:"Butter",qty:"3 tbsp"},
      {name:"Fresh cream",qty:"3 tbsp"},
      {name:"Ginger-garlic paste",qty:"1 tbsp"},
      {name:"Kashmiri red chilli powder",qty:"2 tsp"},
      {name:"Coriander powder",qty:"1 tsp"},
      {name:"Garam masala",qty:"½ tsp"},
      {name:"Kasuri methi (dried fenugreek)",qty:"1 tsp"},
      {name:"Sugar",qty:"1 tsp"},
      {name:"Salt",qty:"to taste"},
    ],
    steps:[
      {step:1,instruction:"Blend tomatoes, onion, and soaked cashews into a completely smooth paste. No chunks should remain."},
      {step:2,instruction:"Heat butter in a pan. Add ginger-garlic paste and sauté 1 minute until raw smell goes."},
      {step:3,instruction:"Add the blended paste. Cook on medium 10-12 minutes, stirring constantly, until color deepens and butter separates."},
      {step:4,instruction:"Add kashmiri chilli powder, coriander powder, garam masala, sugar, and salt. Stir and cook 2 minutes."},
      {step:5,instruction:"Reduce flame, add fresh cream and stir. Add ½ cup water if too thick. Simmer 3-4 minutes."},
      {step:6,instruction:"Add paneer cubes, fold gently. Crush kasuri methi between palms and sprinkle over. Cook 3 minutes. Serve with naan or rice."},
    ],
  },
  "egg bhurji": {
    name:"Egg Bhurji", servings:2, cookingTime:"10 min",
    nutrition:{ calories:280, protein:"18g", carbs:"8g", fat:"20g", fiber:"1g" },
    tags:["Non-veg","Breakfast","Quick","High Protein"],
    ingredients:[
      {name:"Eggs",qty:"4"},
      {name:"Onion, finely chopped",qty:"1 medium"},
      {name:"Tomato, finely chopped",qty:"1 medium"},
      {name:"Green chilli, chopped",qty:"2"},
      {name:"Ginger, grated",qty:"½ inch"},
      {name:"Cumin seeds",qty:"½ tsp"},
      {name:"Turmeric powder",qty:"¼ tsp"},
      {name:"Red chilli powder",qty:"½ tsp"},
      {name:"Garam masala",qty:"¼ tsp"},
      {name:"Oil",qty:"1 tbsp"},
      {name:"Salt",qty:"to taste"},
      {name:"Coriander leaves",qty:"2 tbsp"},
    ],
    steps:[
      {step:1,instruction:"Heat oil in a pan on medium flame. Add cumin seeds and let them splutter."},
      {step:2,instruction:"Add green chilli and ginger, sauté 30 seconds. Add onion and fry until translucent, about 3 minutes."},
      {step:3,instruction:"Add tomato, cook 2 minutes until soft. Add all spices and salt, mix well."},
      {step:4,instruction:"Crack eggs directly into the pan over the masala. Don't stir for 30 seconds."},
      {step:5,instruction:"Scramble on medium heat, breaking yolks and folding everything together. Keep it slightly moist — don't overcook."},
      {step:6,instruction:"Garnish with coriander leaves. Serve hot with roti or toast."},
    ],
  },
  khichdi: {
    name:"Moong Dal Khichdi", servings:3, cookingTime:"20 min",
    nutrition:{ calories:320, protein:"14g", carbs:"52g", fat:"7g", fiber:"6g" },
    tags:["Veg","Comfort","Healthy","Easy"],
    ingredients:[
      {name:"Rice",qty:"1 cup"},
      {name:"Yellow moong dal",qty:"½ cup"},
      {name:"Ghee",qty:"1 tbsp"},
      {name:"Cumin seeds",qty:"1 tsp"},
      {name:"Asafoetida (hing)",qty:"pinch"},
      {name:"Turmeric powder",qty:"½ tsp"},
      {name:"Ginger, grated",qty:"1 inch"},
      {name:"Green chilli",qty:"1"},
      {name:"Salt",qty:"to taste"},
      {name:"Water",qty:"3 cups"},
    ],
    steps:[
      {step:1,instruction:"Wash rice and dal together 3 times. Soak for 10 minutes. Drain."},
      {step:2,instruction:"Heat ghee in a pressure cooker. Add cumin seeds and asafoetida, let splutter 30 seconds."},
      {step:3,instruction:"Add ginger and green chilli, sauté 30 seconds. Add turmeric."},
      {step:4,instruction:"Add soaked rice and dal, stir to coat with ghee. Add 3 cups water and salt."},
      {step:5,instruction:"Pressure cook for 3 whistles on medium flame. Let pressure release naturally (10 min)."},
      {step:6,instruction:"Open and mash lightly with back of spoon. Consistency should be porridge-like. Drizzle extra ghee on top. Serve with pickle and curd."},
    ],
  },
  "rajma chawal": {
    name:"Rajma Chawal", servings:4, cookingTime:"40 min",
    nutrition:{ calories:480, protein:"22g", carbs:"78g", fat:"8g", fiber:"14g" },
    tags:["Veg","Lunch","Protein","Punjab"],
    ingredients:[
      {name:"Kidney beans (rajma), soaked overnight",qty:"2 cups"},
      {name:"Onions, finely chopped",qty:"2 large"},
      {name:"Tomatoes, pureed",qty:"3 large"},
      {name:"Ginger-garlic paste",qty:"2 tbsp"},
      {name:"Rajma masala",qty:"2 tsp"},
      {name:"Cumin seeds",qty:"1 tsp"},
      {name:"Coriander powder",qty:"1 tsp"},
      {name:"Red chilli powder",qty:"1 tsp"},
      {name:"Garam masala",qty:"½ tsp"},
      {name:"Oil",qty:"2 tbsp"},
      {name:"Salt",qty:"to taste"},
      {name:"Coriander for garnish",qty:"2 tbsp"},
    ],
    steps:[
      {step:1,instruction:"Pressure cook soaked rajma with water and salt for 6-7 whistles until completely tender. Reserve the cooking water."},
      {step:2,instruction:"Heat oil, add cumin seeds. Add onions and fry on medium-high until deep golden-brown, about 10 minutes — this is the key step."},
      {step:3,instruction:"Add ginger-garlic paste, cook 2 minutes. Add tomato puree, cook until oil separates, about 8-10 minutes."},
      {step:4,instruction:"Add all spices and salt, cook 2 more minutes."},
      {step:5,instruction:"Add cooked rajma along with its water. Simmer 10-12 minutes. Mash some beans against the pot for a thicker gravy."},
      {step:6,instruction:"Finish with garam masala. Garnish coriander. Serve with steamed basmati rice and sliced onion."},
    ],
  },
  "palak paneer": {
    name:"Palak Paneer", servings:3, cookingTime:"30 min",
    nutrition:{ calories:320, protein:"16g", carbs:"14g", fat:"24g", fiber:"4g" },
    tags:["Veg","Healthy","Iron-rich","Restaurant Style"],
    ingredients:[
      {name:"Spinach (palak), packed",qty:"3 cups"},
      {name:"Paneer, cubed",qty:"200g"},
      {name:"Onion",qty:"1 medium"},
      {name:"Garlic cloves",qty:"4"},
      {name:"Ginger",qty:"1 inch"},
      {name:"Green chilli",qty:"1"},
      {name:"Butter",qty:"1 tbsp"},
      {name:"Cumin seeds",qty:"½ tsp"},
      {name:"Garam masala",qty:"½ tsp"},
      {name:"Fresh cream",qty:"2 tbsp"},
      {name:"Salt",qty:"to taste"},
    ],
    steps:[
      {step:1,instruction:"Blanch spinach in boiling water for 2 minutes. Transfer immediately to ice-cold water — this preserves the bright green color. Drain well."},
      {step:2,instruction:"Blend spinach with green chilli into a smooth puree. Set aside."},
      {step:3,instruction:"Heat butter in a pan. Add cumin seeds. Add garlic, ginger, and onion, sauté until onion is soft and golden, about 6 minutes."},
      {step:4,instruction:"Add the spinach puree and cook for 4-5 minutes on medium flame."},
      {step:5,instruction:"Add garam masala and salt. Mix well. If too thick, add 2-3 tbsp water."},
      {step:6,instruction:"Add paneer cubes and fold gently. Drizzle cream, simmer 3 minutes. Don't overcook — paneer softens quickly. Serve with naan."},
    ],
  },
  upma: {
    name:"Vegetable Upma", servings:2, cookingTime:"15 min",
    nutrition:{ calories:230, protein:"7g", carbs:"38g", fat:"7g", fiber:"4g" },
    tags:["Veg","Breakfast","Quick","South Indian"],
    ingredients:[
      {name:"Semolina (sooji/rava)",qty:"1 cup"},
      {name:"Onion, chopped",qty:"1 medium"},
      {name:"Mixed vegetables (carrot, peas, beans)",qty:"½ cup"},
      {name:"Mustard seeds",qty:"½ tsp"},
      {name:"Chana dal",qty:"1 tsp"},
      {name:"Curry leaves",qty:"8-10"},
      {name:"Green chilli",qty:"2"},
      {name:"Ginger, grated",qty:"½ inch"},
      {name:"Oil",qty:"1 tbsp"},
      {name:"Water",qty:"2 cups (hot)"},
      {name:"Salt",qty:"to taste"},
      {name:"Lemon juice",qty:"1 tbsp"},
    ],
    steps:[
      {step:1,instruction:"Dry roast semolina in a pan on medium flame until light golden and aromatic, about 3-4 minutes. Keep stirring. Set aside."},
      {step:2,instruction:"Heat oil in same pan. Add mustard seeds and chana dal, let splutter. Add curry leaves, chilli, and ginger."},
      {step:3,instruction:"Add onion, sauté until translucent. Add vegetables and cook 2-3 minutes."},
      {step:4,instruction:"Add 2 cups hot water and salt, bring to a boil."},
      {step:5,instruction:"Reduce heat to low. Add roasted semolina slowly while stirring continuously to avoid lumps."},
      {step:6,instruction:"Cover and cook on low 2-3 minutes until water is absorbed. Squeeze lemon, fluff gently. Serve hot with coconut chutney."},
    ],
  },
  chole: {
    name:"Chole Bhature", servings:4, cookingTime:"45 min",
    nutrition:{ calories:620, protein:"22g", carbs:"88g", fat:"20g", fiber:"12g" },
    tags:["Veg","Heavy","Punjab","Street Food"],
    ingredients:[
      {name:"Chickpeas (chole), soaked overnight",qty:"2 cups"},
      {name:"Tea bags (for color)",qty:"2"},
      {name:"Onions, finely chopped",qty:"2 large"},
      {name:"Tomatoes, pureed",qty:"3"},
      {name:"Ginger-garlic paste",qty:"2 tbsp"},
      {name:"Chole masala",qty:"2 tbsp"},
      {name:"Amchur (dry mango powder)",qty:"1 tsp"},
      {name:"Cumin seeds",qty:"1 tsp"},
      {name:"Oil",qty:"3 tbsp"},
      {name:"Maida for bhature",qty:"2 cups"},
      {name:"Curd for bhature",qty:"4 tbsp"},
    ],
    steps:[
      {step:1,instruction:"Pressure cook chickpeas with tea bags and salt for 6-8 whistles until very soft. Remove tea bags. Reserve water."},
      {step:2,instruction:"Heat oil, fry onions deep brown (10-12 min, this is essential for flavor). Add ginger-garlic paste, 2 min."},
      {step:3,instruction:"Add tomato puree, cook until oil separates, 8-10 min. Add chole masala and amchur."},
      {step:4,instruction:"Add chickpeas with their water. Mash 20-25 chickpeas to thicken gravy. Simmer 15 min."},
      {step:5,instruction:"For bhature: mix maida, curd, salt, pinch of sugar. Knead soft dough, rest 30 min covered."},
      {step:6,instruction:"Roll bhature in oval shape. Deep fry in hot oil until puffed and golden. Drain. Serve chole and bhature together with onion, lemon, and pickle."},
    ],
  },
};

// ── Gemini recipe generation ───────────────────────────────────────────
async function generateWithGemini(query, pantry, diet) {
  if (!GEMINI_KEY) return null;

  const prompt = `You are a professional Indian chef and nutritionist. Create a complete recipe for: "${query}".
${pantry ? `Available ingredients: ${pantry}` : ""}
${diet ? `Diet type: ${diet}` : ""}

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks, no extra text):
{
  "name": "Recipe Name",
  "servings": 2,
  "cookingTime": "30 min",
  "nutrition": {
    "calories": 350,
    "protein": "12g",
    "carbs": "45g",
    "fat": "8g",
    "fiber": "4g"
  },
  "tags": ["Veg", "Quick", "Healthy"],
  "ingredients": [
    { "name": "Rice", "qty": "1 cup" },
    { "name": "Water", "qty": "2 cups" }
  ],
  "steps": [
    { "step": 1, "instruction": "Detailed step here" },
    { "step": 2, "instruction": "Next step here" }
  ]
}`;

  const response = await axios.post(GEMINI_URL, {
    contents: [{ role:"user", parts:[{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 2000, temperature: 0.4 },
  }, { timeout: 25000 });

  const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const clean = raw.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
  return JSON.parse(clean);
}

// ── Find built-in recipe by fuzzy match ───────────────────────────────
function findBuiltIn(query) {
  const q = query.toLowerCase();
  for (const [key, recipe] of Object.entries(RECIPES_DB)) {
    if (q.includes(key) || key.includes(q.replace(/recipe|how to make|make/g,"").trim())) {
      return { ...recipe, aiGenerated: false, source: "builtin" };
    }
  }
  return null;
}

// ══════════════════════════════════════
//  POST /api/recipe/ai  — Generate recipe
// ══════════════════════════════════════
router.post("/ai", auth, async (req, res) => {
  try {
    const { query, pantry, diet } = req.body;
    if (!query) return res.status(400).json({ message: "Query is required" });

    // 1. Try Gemini AI first
    if (GEMINI_KEY) {
      try {
        const recipe = await generateWithGemini(query, pantry, diet);
        if (recipe?.name) {
          return res.json({ ...recipe, aiGenerated: true, source: "gemini" });
        }
      } catch (e) {
        if (e.response?.status === 429) {
          return res.status(429).json({ message: "AI is busy. Try again in 30 seconds." });
        }
        console.log("Gemini recipe failed:", e.message);
      }
    }

    // 2. Check built-in database
    const builtin = findBuiltIn(query);
    if (builtin) return res.json(builtin);

    // 3. Return generic fallback
    res.json({
      name:        `${query.charAt(0).toUpperCase() + query.slice(1)} Recipe`,
      servings:    2,
      cookingTime: "30 min",
      aiGenerated: false,
      source:      "fallback",
      nutrition:   { calories: 300, protein:"12g", carbs:"40g", fat:"8g", fiber:"4g" },
      tags:        ["Homemade"],
      ingredients: [
        { name:"Main ingredient", qty:"as needed" },
        { name:"Oil", qty:"2 tbsp" },
        { name:"Onion", qty:"1" },
        { name:"Tomato", qty:"1" },
        { name:"Spices (turmeric, chilli, salt)", qty:"to taste" },
      ],
      steps:[
        { step:1, instruction:"Prepare all ingredients. Chop vegetables finely." },
        { step:2, instruction:"Heat oil in a pan, sauté onion until golden." },
        { step:3, instruction:"Add tomato and spices, cook until oil separates." },
        { step:4, instruction:"Add the main ingredient and cook thoroughly." },
        { step:5, instruction:"Adjust seasoning, garnish, and serve hot." },
      ],
      note: "Could not find an exact recipe. Configure your GEMINI_API_KEY in .env for personalized AI recipes!",
    });
  } catch (err) {
    console.error("Recipe AI error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  GET /api/recipe/popular  — Popular recipes list
// ══════════════════════════════════════
router.get("/popular", auth, (req, res) => {
  const list = Object.entries(RECIPES_DB).map(([key, r]) => ({
    id:          key,
    name:        r.name,
    cookingTime: r.cookingTime,
    calories:    r.nutrition.calories,
    tags:        r.tags,
    servings:    r.servings,
  }));
  res.json(list);
});

// ══════════════════════════════════════
//  GET /api/recipe/builtin/:key  — Get specific built-in recipe
// ══════════════════════════════════════
router.get("/builtin/:key", auth, (req, res) => {
  const recipe = RECIPES_DB[req.params.key.toLowerCase()];
  if (!recipe) return res.status(404).json({ message: "Recipe not found" });
  res.json({ ...recipe, source: "builtin" });
});

module.exports = router;