// routes/recipeRoutes.js  —  Recipe generator + built-in database + pantry-based suggestions
const express = require("express");
const router  = express.Router();
const axios   = require("axios");
const auth    = require("../middleware/authMiddleware");

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

// ── Full built-in recipe database ─────────────────────────────────────────
const RECIPES_DB = {
  poha: {
    name:"Masala Poha", mealType:"breakfast", servings:2, cookingTime:"15 min",
    nutrition:{ calories:250, protein:"5g", carbs:"42g", fat:"7g", fiber:"3g" },
    tags:["Veg","Breakfast","Quick","Maharashtra"],
    ingredients:["thick poha","onion","green chilli","mustard seeds","curry leaves","turmeric powder","salt","oil","lemon juice","coriander leaves"],
    steps:["Wash poha thoroughly under running water, drain, rest 5 minutes","Heat oil, add mustard seeds and curry leaves, splutter","Add green chilli and onion, fry until golden","Add turmeric and salt, add drained poha, toss gently","Cook 2-3 minutes on low, squeeze lemon, garnish coriander"],
  },
  "dal tadka": {
    name:"Dal Tadka", mealType:"lunch", servings:3, cookingTime:"25 min",
    nutrition:{ calories:280, protein:"14g", carbs:"38g", fat:"7g", fiber:"8g" },
    tags:["Veg","Lunch","Protein","Classic"],
    ingredients:["toor dal","tomatoes","onion","garlic","ginger","cumin seeds","turmeric powder","red chilli powder","garam masala","ghee","coriander"],
    steps:["Pressure cook dal with turmeric and salt for 3 whistles","Heat ghee, splutter cumin, add garlic and ginger 1 min","Fry onion golden-brown, add tomatoes, cook till oil separates","Add red chilli and garam masala, pour tadka over dal","Simmer 3 minutes, garnish coriander"],
  },
  "chicken biryani": {
    name:"Chicken Biryani", mealType:"dinner", servings:4, cookingTime:"60 min",
    nutrition:{ calories:580, protein:"38g", carbs:"68g", fat:"16g", fiber:"3g" },
    tags:["Non-veg","Rice","Special","Hyderabadi"],
    ingredients:["basmati rice","chicken","onion","yogurt","biryani masala","ginger-garlic paste","saffron","mint","ghee","whole spices"],
    steps:["Soak rice 30 mins, parboil 70% with whole spices","Fry sliced onions crispy golden","Marinate chicken with yogurt, biryani masala, fried onions 20 min","Layer chicken and rice in pot","Drizzle saffron milk and ghee, dum cook 20 min on lowest flame"],
  },
  "paneer butter masala": {
    name:"Paneer Butter Masala", mealType:"dinner", servings:3, cookingTime:"30 min",
    nutrition:{ calories:420, protein:"18g", carbs:"22g", fat:"30g", fiber:"3g" },
    tags:["Veg","Rich","Restaurant Style"],
    ingredients:["paneer","tomatoes","onion","cashews","butter","fresh cream","ginger-garlic paste","kashmiri red chilli","garam masala","kasuri methi","sugar"],
    steps:["Blend tomatoes, onion, cashews into smooth paste","Heat butter, add ginger-garlic paste 1 min","Cook blended paste 10 min until oil separates","Add spices, cream, simmer 3 min","Add paneer, fold gently, crush kasuri methi on top"],
  },
  "egg bhurji": {
    name:"Egg Bhurji", mealType:"breakfast", servings:2, cookingTime:"10 min",
    nutrition:{ calories:280, protein:"18g", carbs:"8g", fat:"20g", fiber:"1g" },
    tags:["Non-veg","Breakfast","Quick","High Protein"],
    ingredients:["eggs","onion","tomato","green chilli","ginger","cumin seeds","turmeric","red chilli powder","garam masala","oil","coriander"],
    steps:["Heat oil, splutter cumin, add chilli and ginger","Add onion, fry until translucent 3 min","Add tomato and all spices, cook 2 min","Crack eggs directly in pan, scramble on medium","Keep moist, garnish coriander, serve with roti"],
  },
  khichdi: {
    name:"Moong Dal Khichdi", mealType:"lunch", servings:3, cookingTime:"20 min",
    nutrition:{ calories:320, protein:"14g", carbs:"52g", fat:"7g", fiber:"6g" },
    tags:["Veg","Comfort","Healthy","Easy"],
    ingredients:["rice","yellow moong dal","ghee","cumin seeds","asafoetida","turmeric","ginger","green chilli","salt"],
    steps:["Wash and soak rice and dal 10 min","Heat ghee, splutter cumin and asafoetida","Add ginger, chilli, turmeric","Add rice and dal, 3 cups water, salt","Pressure cook 3 whistles, mash lightly, drizzle ghee"],
  },
  "rajma chawal": {
    name:"Rajma Chawal", mealType:"lunch", servings:4, cookingTime:"40 min",
    nutrition:{ calories:480, protein:"22g", carbs:"78g", fat:"8g", fiber:"14g" },
    tags:["Veg","Lunch","Protein","Punjab"],
    ingredients:["kidney beans","rice","onion","tomatoes","ginger-garlic paste","rajma masala","cumin seeds","garam masala","oil","coriander"],
    steps:["Pressure cook soaked kidney beans until tender","Fry onions deep golden-brown 10 min","Add ginger-garlic paste, tomato puree, cook until oil separates","Add rajma masala, add beans with water","Simmer 10-12 min, mash some beans for thick gravy"],
  },
  "palak paneer": {
    name:"Palak Paneer", mealType:"dinner", servings:3, cookingTime:"30 min",
    nutrition:{ calories:320, protein:"16g", carbs:"14g", fat:"24g", fiber:"4g" },
    tags:["Veg","Healthy","Iron-rich","Restaurant Style"],
    ingredients:["spinach","paneer","onion","garlic","ginger","green chilli","butter","cumin","garam masala","cream","salt"],
    steps:["Blanch spinach 2 min, transfer to ice water immediately","Blend spinach and green chilli into smooth puree","Heat butter, sauté garlic, ginger, onion 6 min","Add spinach paste, garam masala, salt, cook 5 min","Add paneer, fold gently, drizzle cream, serve"],
  },
  upma: {
    name:"Vegetable Upma", mealType:"breakfast", servings:2, cookingTime:"15 min",
    nutrition:{ calories:230, protein:"7g", carbs:"38g", fat:"7g", fiber:"4g" },
    tags:["Veg","Breakfast","Quick","South Indian"],
    ingredients:["semolina","onion","mixed vegetables","mustard seeds","chana dal","curry leaves","green chilli","ginger","oil","salt","lemon"],
    steps:["Dry roast semolina until light golden, set aside","Heat oil, splutter mustard and chana dal, add curry leaves and chilli","Add onion and vegetables, cook 3 min","Add 2 cups hot water and salt, bring to boil","Add semolina slowly stirring, cook 3 min, squeeze lemon"],
  },
  chole: {
    name:"Chole Bhature", mealType:"lunch", servings:4, cookingTime:"45 min",
    nutrition:{ calories:620, protein:"22g", carbs:"88g", fat:"20g", fiber:"12g" },
    tags:["Veg","Heavy","Punjab","Street Food"],
    ingredients:["chickpeas","onions","tomatoes","ginger-garlic paste","chole masala","amchur","cumin seeds","oil","maida","curd"],
    steps:["Pressure cook chickpeas with tea bag and salt 6-8 whistles","Fry onions deep brown 10-12 min","Add ginger-garlic paste, tomato puree, cook until oil separates","Add chole masala and amchur, add chickpeas, simmer 15 min","Make bhature dough, rest 30 min, roll and deep fry"],
  },
};

// ── All recipes as array (for suggest endpoint) ──────────────────────────
const ALL_RECIPES_ARRAY = Object.entries(RECIPES_DB).map(([key, r]) => ({
  _id: key,
  name: r.name,
  mealType: r.mealType || "any",
  cookTime: parseInt(r.cookingTime) || 30,
  servings: r.servings || 2,
  difficulty: "Easy",
  calories: r.nutrition?.calories || 0,
  pantryMatchPercent: 0, // will be calculated by frontend
  ingredients: r.ingredients || [],
  steps: r.steps || [],
  tags: r.tags || [],
}));

// ── Gemini recipe generation ───────────────────────────────────────────────
async function generateWithGemini(query, pantry, diet) {
  if (!GEMINI_KEY) return null;

  const prompt = `You are a professional Indian chef. Create a complete recipe for: "${query}".
${pantry ? `Available ingredients: ${pantry}` : ""}
${diet ? `Diet type: ${diet}` : ""}

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks, no extra text):
{
  "name": "Recipe Name",
  "mealType": "lunch",
  "servings": 2,
  "cookingTime": "30 min",
  "nutrition": { "calories": 350, "protein": "12g", "carbs": "45g", "fat": "8g", "fiber": "4g" },
  "tags": ["Veg", "Quick"],
  "ingredients": ["ingredient 1", "ingredient 2"],
  "steps": ["Step 1 instructions", "Step 2 instructions"]
}`;

  const response = await axios.post(GEMINI_URL, {
    contents: [{ role:"user", parts:[{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 2000, temperature: 0.4 },
  }, { timeout: 25000 });

  const raw   = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const clean = raw.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
  return JSON.parse(clean);
}

// ── Find built-in recipe by fuzzy match ───────────────────────────────────
function findBuiltIn(query) {
  const q = query.toLowerCase().replace(/recipe|how to make|make|how do i/g,"").trim();
  for (const [key, recipe] of Object.entries(RECIPES_DB)) {
    if (q.includes(key) || key.includes(q)) {
      return { ...recipe, aiGenerated: false, source: "builtin" };
    }
  }
  return null;
}

// ══════════════════════════════════════════════════════════════════════════
//  GET /api/recipe/suggest/:householdId
//  Called by GroceryList.jsx and Recipes.jsx to get pantry-based suggestions
// ══════════════════════════════════════════════════════════════════════════
router.get("/suggest/:householdId", auth, async (req, res) => {
  try {
    // Try to load pantry items to compute match percentages
    let pantryNames = [];
    try {
      const Pantry = require("../models/Pantry");
      const items  = await Pantry.find({ householdId: req.params.householdId });
      pantryNames  = items.map(i => (i.name || "").toLowerCase());
    } catch {
      // Pantry model may not exist — return built-in recipes without match %
    }

    const recipesWithMatch = ALL_RECIPES_ARRAY.map(r => {
      const ings  = r.ingredients || [];
      const match = ings.length === 0 ? 0
        : Math.round((ings.filter(ing => {
            const n = ing.toLowerCase();
            return pantryNames.some(p => p.includes(n) || n.includes(p));
          }).length / ings.length) * 100);
      return { ...r, pantryMatchPercent: match };
    });

    // Sort: 100% match first, then by descending match
    recipesWithMatch.sort((a, b) => b.pantryMatchPercent - a.pantryMatchPercent);
    res.json(recipesWithMatch);
  } catch (err) {
    console.error("Recipe suggest error:", err.message);
    // Return all built-in recipes even on error so the frontend always has data
    res.json(ALL_RECIPES_ARRAY);
  }
});

// ══════════════════════════════════════════════════════════════════════════
//  POST /api/recipe/ai  — Generate recipe with Gemini or built-in fallback
// ══════════════════════════════════════════════════════════════════════════
router.post("/ai", auth, async (req, res) => {
  try {
    const { query, pantry, diet } = req.body;
    if (!query) return res.status(400).json({ message: "Query is required" });

    // 1. Try Gemini AI
    if (GEMINI_KEY) {
      try {
        const recipe = await generateWithGemini(query, pantry, diet);
        if (recipe?.name) return res.json({ ...recipe, aiGenerated: true, source: "gemini" });
      } catch (e) {
        if (e.response?.status === 429) return res.status(429).json({ message: "AI is busy. Try again in 30 seconds." });
        console.log("Gemini recipe failed:", e.message);
      }
    }

    // 2. Check built-in database
    const builtin = findBuiltIn(query);
    if (builtin) return res.json(builtin);

    // 3. Generic fallback
    res.json({
      name:        `${query.charAt(0).toUpperCase() + query.slice(1)} Recipe`,
      servings:    2, cookingTime: "30 min", aiGenerated: false, source: "fallback",
      nutrition:   { calories:300, protein:"12g", carbs:"40g", fat:"8g", fiber:"4g" },
      tags:        ["Homemade"],
      ingredients: ["Main ingredient","Oil — 2 tbsp","Onion — 1","Tomato — 1","Spices to taste"],
      steps:       ["Prepare all ingredients","Heat oil, sauté onion until golden","Add tomato and spices, cook until oil separates","Add main ingredient, cook thoroughly","Adjust seasoning and serve hot"],
      note:        "Configure GEMINI_API_KEY in server .env for personalised AI recipes!",
    });
  } catch (err) {
    console.error("Recipe AI error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
//  GET /api/recipe/popular  — Popular recipes list (for Recipes page header)
// ══════════════════════════════════════════════════════════════════════════
router.get("/popular", auth, (req, res) => {
  const list = Object.entries(RECIPES_DB).map(([key, r]) => ({
    id:          key,
    name:        r.name,
    cookingTime: r.cookingTime,
    calories:    r.nutrition?.calories,
    tags:        r.tags,
    servings:    r.servings,
  }));
  res.json(list);
});

// ══════════════════════════════════════════════════════════════════════════
//  GET /api/recipe/builtin/:key  — Get specific built-in recipe
// ══════════════════════════════════════════════════════════════════════════
router.get("/builtin/:key", auth, (req, res) => {
  const recipe = RECIPES_DB[req.params.key.toLowerCase()];
  if (!recipe) return res.status(404).json({ message: "Recipe not found" });
  res.json({ ...recipe, source: "builtin" });
});

module.exports = router;