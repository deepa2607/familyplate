// routes/nutritionRoutes.js  —  Full Indian food nutrition database
const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");

// ── Complete Indian food nutrition database ───────────────────────────
const NUTRITION_DB = {
  // ── Rice & Grains ──
  rice:         { name:"Rice (cooked)",      per100g:{ cal:130, protein:2.7,  fat:0.3, carbs:28,  fiber:0.4  }, serving:"1 cup = 186g", tip:"Switch to brown rice for 3x more fiber and lower glycemic index." },
  "brown rice": { name:"Brown Rice (cooked)",per100g:{ cal:111, protein:2.6,  fat:0.9, carbs:23,  fiber:1.8  }, serving:"1 cup = 195g", tip:"Lower GI than white rice. Better for diabetes and weight loss." },
  roti:         { name:"Whole Wheat Roti",   per100g:{ cal:297, protein:8.7,  fat:2.4, carbs:61,  fiber:2.7  }, serving:"1 roti = 35g (104 cal)", tip:"Made from whole wheat — has more fiber than maida. 2-3 per meal is ideal." },
  paratha:      { name:"Plain Paratha",      per100g:{ cal:326, protein:7.7,  fat:11,  carbs:49,  fiber:3.1  }, serving:"1 paratha = 70g (228 cal)", tip:"Add ajwain or methi to improve digestion." },
  poha:         { name:"Poha (cooked)",      per100g:{ cal:130, protein:2.6,  fat:2.9, carbs:25,  fiber:1.5  }, serving:"1 bowl = 150g (195 cal)", tip:"Light and easy to digest. Great pre-workout breakfast." },
  oats:         { name:"Rolled Oats (dry)",  per100g:{ cal:389, protein:16.9, fat:6.9, carbs:66,  fiber:10.6 }, serving:"½ cup dry = 40g (155 cal)", tip:"Most filling breakfast. Beta-glucan fiber lowers cholesterol." },
  rava:         { name:"Semolina (Sooji)",   per100g:{ cal:360, protein:12.7, fat:1.1, carbs:73,  fiber:3.9  }, serving:"as needed", tip:"High in B vitamins. Use for upma, idli, or halwa." },
  "maida":      { name:"Refined Flour",      per100g:{ cal:364, protein:10,   fat:1,   carbs:76,  fiber:2.7  }, serving:"as needed", tip:"Low fiber, high GI. Replace with whole wheat flour for better nutrition." },

  // ── Pulses & Legumes ──
  dal:          { name:"Toor Dal (cooked)",  per100g:{ cal:116, protein:8.6,  fat:0.4, carbs:20,  fiber:8    }, serving:"1 bowl = 180g (209 cal)", tip:"Dal + rice = complete protein with all essential amino acids." },
  "moong dal":  { name:"Moong Dal (cooked)", per100g:{ cal:105, protein:7.0,  fat:0.4, carbs:19,  fiber:7.6  }, serving:"1 bowl = 180g (189 cal)", tip:"Most digestible dal. Ideal for sick days and weight loss." },
  rajma:        { name:"Kidney Beans (cooked)",per100g:{ cal:127, protein:8.7, fat:0.5, carbs:22.8,fiber:6.4 }, serving:"1 bowl = 180g (228 cal)", tip:"Very high fiber. Keeps blood sugar stable for hours." },
  chole:        { name:"Chickpeas (cooked)", per100g:{ cal:164, protein:8.9,  fat:2.6, carbs:27,  fiber:7.6  }, serving:"1 cup = 164g (269 cal)", tip:"High in iron and folate. Soak overnight to improve digestibility." },
  lentils:      { name:"Red Lentils",        per100g:{ cal:116, protein:9,    fat:0.4, carbs:20,  fiber:8    }, serving:"1 cup cooked = 200g", tip:"Fastest cooking pulse. Rich in iron and plant protein." },

  // ── Dairy ──
  milk:         { name:"Full Fat Milk",      per100g:{ cal:61,  protein:3.2,  fat:3.3, carbs:4.8, fiber:0    }, serving:"1 glass = 250ml (152 cal)", tip:"Complete protein source. Full fat milk is more satiating than skim." },
  curd:         { name:"Curd (Yogurt)",      per100g:{ cal:98,  protein:11,   fat:4.3, carbs:3.4, fiber:0    }, serving:"1 katori = 100g (98 cal)", tip:"Probiotics aid digestion. Best eaten at lunch, not dinner." },
  paneer:       { name:"Paneer (Cottage Cheese)",per100g:{ cal:265, protein:18.3, fat:20.8, carbs:1.2, fiber:0 }, serving:"100g = 265 cal", tip:"Best vegetarian protein. Low carb — great for keto and weight loss." },
  ghee:         { name:"Pure Ghee",          per100g:{ cal:900, protein:0,    fat:99.7,carbs:0,   fiber:0    }, serving:"1 tsp = 5g (45 cal)", tip:"In small amounts, ghee improves fat-soluble vitamin absorption. 1-2 tsp/day is fine." },
  butter:       { name:"Butter",             per100g:{ cal:717, protein:0.9,  fat:81,  carbs:0.1, fiber:0    }, serving:"1 tsp = 5g (36 cal)", tip:"Use sparingly. Ghee is a healthier alternative." },
  cheese:       { name:"Processed Cheese",   per100g:{ cal:371, protein:23,   fat:30,  carbs:1.3, fiber:0    }, serving:"1 slice = 20g (74 cal)", tip:"High sodium. Choose cheddar over processed cheese." },

  // ── Proteins ──
  chicken:      { name:"Chicken Breast (cooked)",per100g:{ cal:165, protein:31,   fat:3.6, carbs:0,   fiber:0    }, serving:"100g = 165 cal", tip:"Leanest non-veg protein. Remove skin to cut fat by 50%." },
  egg:          { name:"Whole Egg",           per100g:{ cal:155, protein:13,   fat:11,  carbs:1.1, fiber:0    }, serving:"1 large egg = 50g (78 cal)", tip:"Most bioavailable protein. Eat whole egg — yolk has vitamins D, B12, and choline." },
  "egg white":  { name:"Egg White",           per100g:{ cal:52,  protein:11,   fat:0.2, carbs:0.7, fiber:0    }, serving:"1 egg white = 33g (17 cal)", tip:"Pure protein, zero fat. Perfect post-workout." },
  fish:         { name:"Fish (average)",      per100g:{ cal:136, protein:20,   fat:6,   carbs:0,   fiber:0    }, serving:"1 portion = 150g (204 cal)", tip:"Omega-3 fatty acids reduce inflammation. Aim for 2-3 servings per week." },
  mutton:       { name:"Mutton/Lamb",         per100g:{ cal:294, protein:25,   fat:21,  carbs:0,   fiber:0    }, serving:"150g = 441 cal", tip:"High in iron and B12. Limit to 1-2 times per week." },
  sprouts:      { name:"Mixed Sprouts",       per100g:{ cal:81,  protein:8.5,  fat:0.5, carbs:13,  fiber:3.8  }, serving:"1 katori = 100g (81 cal)", tip:"Sprouting increases protein, vitamin C, and enzyme content dramatically." },

  // ── Vegetables ──
  spinach:      { name:"Spinach (palak)",     per100g:{ cal:23,  protein:2.9,  fat:0.4, carbs:3.6, fiber:2.2  }, serving:"1 cup raw = 30g (7 cal)", tip:"Highest iron leafy vegetable. Eat with vitamin C to improve iron absorption." },
  tomato:       { name:"Tomato",              per100g:{ cal:18,  protein:0.9,  fat:0.2, carbs:3.9, fiber:1.2  }, serving:"1 medium = 120g (22 cal)", tip:"Rich in lycopene — cancer-protective antioxidant that increases when cooked." },
  onion:        { name:"Onion",               per100g:{ cal:40,  protein:1.1,  fat:0.1, carbs:9.3, fiber:1.7  }, serving:"1 medium = 110g (44 cal)", tip:"Quercetin in onions has anti-inflammatory properties." },
  potato:       { name:"Potato (boiled)",     per100g:{ cal:87,  protein:1.9,  fat:0.1, carbs:20,  fiber:1.8  }, serving:"1 medium = 150g (131 cal)", tip:"Not as bad as its reputation — resistant starch when cooled improves gut health." },
  carrot:       { name:"Carrot",              per100g:{ cal:41,  protein:0.9,  fat:0.2, carbs:10,  fiber:2.8  }, serving:"1 medium = 61g (25 cal)", tip:"Beta-carotene converts to Vitamin A. Eating cooked with fat improves absorption." },
  cauliflower:  { name:"Cauliflower (gobi)",  per100g:{ cal:25,  protein:1.9,  fat:0.3, carbs:5,   fiber:2    }, serving:"1 cup = 107g (27 cal)", tip:"Low carb, high fiber. Great keto substitute for rice." },

  // ── Fruits ──
  banana:       { name:"Banana",             per100g:{ cal:89,  protein:1.1,  fat:0.3, carbs:23,  fiber:2.6  }, serving:"1 medium = 120g (107 cal)", tip:"Best pre-workout fruit for quick energy. Potassium prevents muscle cramps." },
  apple:        { name:"Apple",              per100g:{ cal:52,  protein:0.3,  fat:0.2, carbs:14,  fiber:2.4  }, serving:"1 medium = 182g (95 cal)", tip:"Pectin fiber feeds good gut bacteria. Eat with peel for maximum fiber." },
  mango:        { name:"Mango (ripe)",       per100g:{ cal:60,  protein:0.8,  fat:0.4, carbs:15,  fiber:1.6  }, serving:"1 cup = 165g (99 cal)", tip:"High in vitamin C and beta-carotene. Eat in moderation if watching sugar." },
  papaya:       { name:"Papaya",             per100g:{ cal:43,  protein:0.5,  fat:0.3, carbs:11,  fiber:1.7  }, serving:"1 cup = 145g (62 cal)", tip:"Papain enzyme aids protein digestion. Excellent for gut health." },

  // ── Nuts & Seeds ──
  almonds:      { name:"Almonds",            per100g:{ cal:579, protein:21,   fat:50,  carbs:22,  fiber:12.5 }, serving:"10 almonds = 14g (81 cal)", tip:"Soak overnight to remove enzyme inhibitors and improve nutrient absorption." },
  walnuts:      { name:"Walnuts",            per100g:{ cal:654, protein:15,   fat:65,  carbs:14,  fiber:6.7  }, serving:"5-6 halves = 15g (98 cal)", tip:"Highest omega-3 nut. Just 7 walnuts meets daily omega-3 needs." },
  cashews:      { name:"Cashews",            per100g:{ cal:553, protein:18,   fat:44,  carbs:30,  fiber:3.3  }, serving:"10 cashews = 15g (83 cal)", tip:"Good source of magnesium and zinc. Lower fat than other nuts." },

  // ── Oils & Fats ──
  "coconut oil":{ name:"Coconut Oil",        per100g:{ cal:862, protein:0,    fat:100, carbs:0,   fiber:0    }, serving:"1 tsp = 5g (43 cal)", tip:"MCT fats are quickly used for energy. Use for cooking, not as a health drink." },
  "olive oil":  { name:"Olive Oil",          per100g:{ cal:884, protein:0,    fat:100, carbs:0,   fiber:0    }, serving:"1 tsp = 5g (40 cal)", tip:"Monounsaturated fats protect heart. Use for salads, not high-heat cooking." },
  "mustard oil":{ name:"Mustard Oil",        per100g:{ cal:884, protein:0,    fat:100, carbs:0,   fiber:0    }, serving:"1 tsp = 5g (40 cal)", tip:"Traditional Indian cooking oil. High smoke point, good for frying." },
};

// ══════════════════════════════════════
//  GET /api/nutrition/search?q=rice  — Search food
// ══════════════════════════════════════
router.get("/search", auth, (req, res) => {
  const q = (req.query.q || "").toLowerCase().trim();
  if (!q) return res.json([]);

  const results = Object.entries(NUTRITION_DB)
    .filter(([key, val]) =>
      key.includes(q) || val.name.toLowerCase().includes(q)
    )
    .slice(0, 10)
    .map(([key, val]) => ({
      id:      key,
      name:    val.name,
      cal:     val.per100g.cal,
      protein: val.per100g.protein,
      serving: val.serving,
    }));

  res.json(results);
});

// ══════════════════════════════════════
//  GET /api/nutrition/:food  — Get full nutrition info
// ══════════════════════════════════════
router.get("/:food", auth, (req, res) => {
  const key = req.params.food.toLowerCase().trim();
  const info = NUTRITION_DB[key];

  if (!info) {
    // Try partial match
    const partial = Object.entries(NUTRITION_DB).find(([k]) => k.includes(key) || key.includes(k));
    if (partial) return res.json({ id: partial[0], ...partial[1] });
    return res.status(404).json({ message: `Nutrition info not found for "${key}". Try searching with a different term.` });
  }

  res.json({ id: key, ...info });
});

// ══════════════════════════════════════
//  GET /api/nutrition  — List all foods
// ══════════════════════════════════════
router.get("/", auth, (req, res) => {
  const list = Object.entries(NUTRITION_DB).map(([key, val]) => ({
    id:      key,
    name:    val.name,
    cal:     val.per100g.cal,
    protein: val.per100g.protein,
    fat:     val.per100g.fat,
    carbs:   val.per100g.carbs,
    serving: val.serving,
  }));
  res.json(list);
});

module.exports = router;