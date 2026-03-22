import { useEffect, useState } from "react";
import axios from "axios";
import { useToast } from "../components/Toast";
import { useLowStockNotification, useExpiryNotification } from "../components/NotificationSystem";

const GROCERY_KEY = "groceryList";
const CART_KEY    = "homehub_smartcart_v2";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";


const CAT_META = {
  Vegetables:{ icon:"🥦", color:"#2d7a4f", img:"https://images.unsplash.com/photo-1590779033100-9f17a209f87d?w=500&q=80" },
  Fruits:    { icon:"🍎", color:"#d32f2f", img:"https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&q=80" },
  Grains:    { icon:"🌾", color:"#e67e22", img:"https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&q=80" },
  Dairy:     { icon:"🥛", color:"#1565c0", img:"https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80" },
  Spices:    { icon:"🌶️", color:"#c0392b", img:"https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&q=80" },
  Proteins:  { icon:"🍗", color:"#7c3aed", img:"https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&q=80" },
  Oils:      { icon:"🫙", color:"#f59e0b", img:"https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&q=80" },
  Other:     { icon:"📦", color:"#5c4a35", img:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80" },
};
const CATEGORIES = Object.keys(CAT_META);
const UNITS = ["kg","g","L","ml","pieces","packets","dozen","bunches"];

// Per-100g nutrition reference database
const NUTRITION_DB = {
  "tomato":   {cal:18,  protein:0.9, carbs:3.9, fat:0.2, fiber:1.2, vitamin:"C, K",     benefit:"Antioxidant rich, heart health"},
  "onion":    {cal:40,  protein:1.1, carbs:9.3, fat:0.1, fiber:1.7, vitamin:"C, B6",    benefit:"Anti-inflammatory, immunity boost"},
  "potato":   {cal:77,  protein:2.0, carbs:17,  fat:0.1, fiber:2.2, vitamin:"C, B6",    benefit:"Energy source, potassium rich"},
  "spinach":  {cal:23,  protein:2.9, carbs:3.6, fat:0.4, fiber:2.2, vitamin:"K, A, C",  benefit:"Iron rich, bone strength"},
  "carrot":   {cal:41,  protein:0.9, carbs:10,  fat:0.2, fiber:2.8, vitamin:"A, K",     benefit:"Eye health, beta-carotene"},
  "rice":     {cal:130, protein:2.7, carbs:28,  fat:0.3, fiber:0.4, vitamin:"B1, B3",   benefit:"Quick energy, easy digestion"},
  "dal":      {cal:116, protein:9.0, carbs:20,  fat:0.4, fiber:8.0, vitamin:"B1, Iron", benefit:"High protein, gut health"},
  "wheat":    {cal:340, protein:13,  carbs:72,  fat:2.5, fiber:2.7, vitamin:"B1, Iron", benefit:"Energy, B vitamins"},
  "milk":     {cal:61,  protein:3.2, carbs:4.8, fat:3.3, fiber:0,   vitamin:"D, B12",   benefit:"Calcium, bone health"},
  "curd":     {cal:98,  protein:11,  carbs:3.4, fat:4.3, fiber:0,   vitamin:"B12, D",   benefit:"Probiotics, gut health"},
  "paneer":   {cal:265, protein:18,  carbs:1.2, fat:21,  fiber:0,   vitamin:"A, D",     benefit:"High protein, calcium"},
  "chicken":  {cal:239, protein:27,  carbs:0,   fat:14,  fiber:0,   vitamin:"B12, B3",  benefit:"Lean protein, muscle building"},
  "egg":      {cal:155, protein:13,  carbs:1.1, fat:11,  fiber:0,   vitamin:"D, B12",   benefit:"Complete protein, brain health"},
  "banana":   {cal:89,  protein:1.1, carbs:23,  fat:0.3, fiber:2.6, vitamin:"B6, C",    benefit:"Quick energy, potassium"},
  "apple":    {cal:52,  protein:0.3, carbs:14,  fat:0.2, fiber:2.4, vitamin:"C, B",     benefit:"Fiber, heart health"},
  "mango":    {cal:60,  protein:0.8, carbs:15,  fat:0.4, fiber:1.6, vitamin:"A, C",     benefit:"Immunity, vitamin A"},
  "ginger":   {cal:80,  protein:1.8, carbs:18,  fat:0.8, fiber:2.0, vitamin:"B6, C",    benefit:"Anti-nausea, anti-inflammatory"},
  "garlic":   {cal:149, protein:6.4, carbs:33,  fat:0.5, fiber:2.1, vitamin:"C, B6",    benefit:"Heart health, antibacterial"},
  "lemon":    {cal:29,  protein:1.1, carbs:9,   fat:0.3, fiber:2.8, vitamin:"C, B6",    benefit:"Vitamin C, digestion"},
  "oil":      {cal:884, protein:0,   carbs:0,   fat:100, fiber:0,   vitamin:"E, K",     benefit:"Essential fatty acids"},
};


// Smart auto-categorize based on item name
function smartCategory(name) {
  const n = (name || "").toLowerCase();
  if (/rice|dal|rajma|chana|lentil|flour|roti|bread|oat|wheat|barley|millet|rava|suji|poha|semolina|pasta|noodle|atta|maida|moong|masoor|toor|urad|kidney|chickpea|biscuit/.test(n)) return "Grains";
  if (/milk|curd|paneer|butter|cream|cheese|ghee|yogurt|lassi|dahi/.test(n)) return "Dairy";
  if (/chicken|egg|fish|mutton|prawn|meat|lamb|beef|pork|shrimp/.test(n)) return "Proteins";
  if (/onion|tomato|potato|spinach|carrot|cabbage|bean|pea|gourd|brinjal|birnjal|eggplant|okra|bhindi|ladyfinger|cauliflower|broccoli|capsicum|pepper|corn|pumpkin|cucumber|radish|beetroot|mushroom/.test(n)) return "Vegetables";
  if (/ginger|garlic|turmeric|chilli|chili|coriander|cumin|mustard|cardamom|cinnamon|clove|masala|spice|hing|ajwain|methi|saunf|paprika|oregano/.test(n)) return "Spices";
  if (/apple|banana|mango|orange|lemon|grapes|papaya|guava|pomegranate|watermelon|fruit|pear|cherry|strawberry|pineapple|coconut/.test(n)) return "Fruits";
  if (/oil|ghee|vinegar/.test(n)) return "Oils";
  return null; // keep as-is
}

function getNutrition(name) {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(NUTRITION_DB)) {
    if (lower.includes(key) || key.includes(lower)) return { ...val, name: key };
  }
  return null;
}

const ITEM_IMGS = {
  // ── Vegetables ────────────────────────────────────────────────────────────
  "tomato":      "https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&w=300",
  "onion":       "https://images.pexels.com/photos/144248/onion-vegetables-garden-green-144248.jpeg?auto=compress&w=300",
  "potato":      "https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&w=300",
  "spinach":     "https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?auto=compress&w=300",
  "carrot":      "https://images.pexels.com/photos/1640771/pexels-photo-1640771.jpeg?auto=compress&w=300",
  "capsicum":    "https://images.pexels.com/photos/175728/pexels-photo-175728.jpeg?auto=compress&w=300",
  "cauliflower": "https://images.pexels.com/photos/1359326/pexels-photo-1359326.jpeg?auto=compress&w=300",
  "cucumber":    "https://images.pexels.com/photos/37528/cucumber-salad-food-healthy-37528.jpeg?auto=compress&w=300",
  "cabbage":     "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=300&q=80",
  "broccoli":    "https://images.unsplash.com/photo-1628773822503-930a7eaecf80?w=300&q=80",
  "mushroom":    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=80",
  "pea":         "https://images.unsplash.com/photo-1587334274328-64186a80aeee?w=300&q=80",
  "corn":        "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=300&q=80",
  "pumpkin":     "https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=300&q=80",
  "radish":      "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=300&q=80",
  "beetroot":    "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&q=80",
  "beans":       "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=300&q=80",
  "bhindi":      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&q=80",
  "okra":        "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&q=80",
  "brinjal":     "https://images.pexels.com/photos/321551/pexels-photo-321551.jpeg?auto=compress&w=300",
  "birnjal":     "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=300&q=80",
  "eggplant":    "https://images.pexels.com/photos/321551/pexels-photo-321551.jpeg?auto=compress&w=300",
  "baingan":     "https://images.pexels.com/photos/321551/pexels-photo-321551.jpeg?auto=compress&w=300",
  "gourd":       "https://images.unsplash.com/photo-1598515213692-b1e87db9a6e2?w=300&q=80",
  "lauki":       "https://images.unsplash.com/photo-1598515213692-b1e87db9a6e2?w=300&q=80",
  "methi":       "https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?auto=compress&w=300",
  "palak":       "https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?auto=compress&w=300",
  // ── Grains & Pulses ───────────────────────────────────────────────────────
  "rice":        "https://images.pexels.com/photos/723198/pexels-photo-723198.jpeg?auto=compress&w=300",
  "basmati":     "https://images.pexels.com/photos/723198/pexels-photo-723198.jpeg?auto=compress&w=300",
  "wheat":       "https://images.pexels.com/photos/1082343/pexels-photo-1082343.jpeg?auto=compress&w=300",
  "atta":        "https://images.pexels.com/photos/1082343/pexels-photo-1082343.jpeg?auto=compress&w=300",
  "maida":       "https://images.pexels.com/photos/1082343/pexels-photo-1082343.jpeg?auto=compress&w=300",
  "dal":         "https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg",
  "lentil":      "https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg",
  "moong":       "https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg",
  "masoor":      "https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg",
  "toor":        "https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg",
  "urad":        "https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg",
  "chana":       "https://www.themealdb.com/images/media/meals/xvrrux1511783685.jpg",
  "rajma":       "https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg",
  "kidney":      "https://images.unsplash.com/photo-1619221882220-947b3d3c8861?w=300&q=80",
  "chickpea":    "https://www.themealdb.com/images/media/meals/xvrrux1511783685.jpg",
  "bread":       "https://images.pexels.com/photos/209206/pexels-photo-209206.jpeg?auto=compress&w=300",
  "oat":         "https://images.unsplash.com/photo-1614961909049-7f03c28a0de0?w=300&q=80",
  "pasta":       "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=300&q=80",
  "noodle":      "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300&q=80",
  "poha":        "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=300&q=80",
  "rava":        "https://images.pexels.com/photos/1082343/pexels-photo-1082343.jpeg?auto=compress&w=300",
  "suji":        "https://images.pexels.com/photos/1082343/pexels-photo-1082343.jpeg?auto=compress&w=300",
  "semolina":    "https://images.pexels.com/photos/1082343/pexels-photo-1082343.jpeg?auto=compress&w=300",
  "millet":      "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&q=80",
  "roti":        "https://www.themealdb.com/images/media/meals/1548772327.jpg",
  "chapati":     "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&q=80",
  // ── Dairy ─────────────────────────────────────────────────────────────────
  "milk":        "https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&w=300",
  "curd":        "https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&w=300",
  "dahi":        "https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&w=300",
  "yogurt":      "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&q=80",
  "paneer":      "https://www.themealdb.com/images/media/meals/1548772327.jpg",
  "butter":      "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&q=80",
  "cheese":      "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300&q=80",
  "ghee":        "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&q=80",
  "cream":       "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80",
  "lassi":       "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&q=80",
  // ── Proteins ──────────────────────────────────────────────────────────────
  "egg":         "https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?auto=compress&w=300",
  "chicken":     "https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&w=300",
  "fish":        "https://images.pexels.com/photos/1516415/pexels-photo-1516415.jpeg?auto=compress&w=300",
  "mutton":      "https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&w=300",
  "prawn":       "https://images.pexels.com/photos/566344/pexels-photo-566344.jpeg?auto=compress&w=300",
  "shrimp":      "https://images.pexels.com/photos/566344/pexels-photo-566344.jpeg?auto=compress&w=300",
  "tofu":        "https://images.unsplash.com/photo-1546069901-5ec6a79120b0?w=300&q=80",
  // ── Fruits ────────────────────────────────────────────────────────────────
  "banana":      "https://images.pexels.com/photos/1093038/pexels-photo-1093038.jpeg?auto=compress&w=300",
  "apple":       "https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&w=300",
  "mango":       "https://images.pexels.com/photos/918643/pexels-photo-918643.jpeg?auto=compress&w=300",
  "orange":      "https://images.pexels.com/photos/327098/pexels-photo-327098.jpeg?auto=compress&w=300",
  "lemon":       "https://images.pexels.com/photos/1313140/pexels-photo-1313140.jpeg?auto=compress&w=300",
  "grapes":      "https://images.pexels.com/photos/46174/pexels-photo-46174.jpeg?auto=compress&w=300",
  "watermelon":  "https://images.pexels.com/photos/1313972/pexels-photo-1313972.jpeg?auto=compress&w=300",
  "papaya":      "https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=300&q=80",
  "guava":       "https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=300&q=80",
  "pomegranate": "https://images.pexels.com/photos/65882/pexels-photo-65882.jpeg?auto=compress&w=300",
  "pineapple":   "https://images.pexels.com/photos/947879/pexels-photo-947879.jpeg?auto=compress&w=300",
  "strawberry":  "https://images.pexels.com/photos/89778/strawberries-frisch-ripe-sweet-89778.jpeg?auto=compress&w=300",
  "coconut":     "https://images.unsplash.com/photo-1580984969071-a8da5656c2fb?w=300&q=80",
  "pear":        "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=300&q=80",
  // ── Spices ────────────────────────────────────────────────────────────────
  "ginger":      "https://images.pexels.com/photos/1340116/pexels-photo-1340116.jpeg?auto=compress&w=300",
  "garlic":      "https://images.pexels.com/photos/1340116/pexels-photo-1340116.jpeg?auto=compress&w=300",
  "turmeric":    "https://images.pexels.com/photos/1340116/pexels-photo-1340116.jpeg?auto=compress&w=300",
  "haldi":       "https://images.pexels.com/photos/1340116/pexels-photo-1340116.jpeg?auto=compress&w=300",
  "chilli":      "https://images.pexels.com/photos/867470/pexels-photo-867470.jpeg?auto=compress&w=300",
  "chili":       "https://images.pexels.com/photos/867470/pexels-photo-867470.jpeg?auto=compress&w=300",
  "mirchi":      "https://images.pexels.com/photos/867470/pexels-photo-867470.jpeg?auto=compress&w=300",
  "coriander":   "https://images.pexels.com/photos/2802527/pexels-photo-2802527.jpeg?auto=compress&w=300",
  "dhaniya":     "https://images.pexels.com/photos/2802527/pexels-photo-2802527.jpeg?auto=compress&w=300",
  "cumin":       "https://images.pexels.com/photos/1340116/pexels-photo-1340116.jpeg?auto=compress&w=300",
  "jeera":       "https://images.pexels.com/photos/1340116/pexels-photo-1340116.jpeg?auto=compress&w=300",
  "mustard":     "https://images.pexels.com/photos/1340116/pexels-photo-1340116.jpeg?auto=compress&w=300",
  "cardamom":    "https://images.pexels.com/photos/1340116/pexels-photo-1340116.jpeg?auto=compress&w=300",
  "elaichi":     "https://images.pexels.com/photos/1340116/pexels-photo-1340116.jpeg?auto=compress&w=300",
  "cinnamon":    "https://images.pexels.com/photos/1340116/pexels-photo-1340116.jpeg?auto=compress&w=300",
  "clove":       "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=300&q=80",
  "masala":      "https://images.pexels.com/photos/1340116/pexels-photo-1340116.jpeg?auto=compress&w=300",
  "pepper":      "https://images.pexels.com/photos/1340116/pexels-photo-1340116.jpeg?auto=compress&w=300",
  "paprika":     "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&q=80",
  "hing":        "https://images.pexels.com/photos/1340116/pexels-photo-1340116.jpeg?auto=compress&w=300",
  "ajwain":      "https://images.pexels.com/photos/1340116/pexels-photo-1340116.jpeg?auto=compress&w=300",
  // ── Oils & Essentials ─────────────────────────────────────────────────────
  "oil":         "https://images.pexels.com/photos/1022385/pexels-photo-1022385.jpeg?auto=compress&w=300",
  "olive":       "https://images.pexels.com/photos/1022385/pexels-photo-1022385.jpeg?auto=compress&w=300",
  "sunflower":   "https://images.pexels.com/photos/1022385/pexels-photo-1022385.jpeg?auto=compress&w=300",
  "sugar":       "https://images.pexels.com/photos/3621231/pexels-photo-3621231.jpeg?auto=compress&w=300",
  "jaggery":     "https://images.pexels.com/photos/3621231/pexels-photo-3621231.jpeg?auto=compress&w=300",
  "salt":        "https://images.pexels.com/photos/4110252/pexels-photo-4110252.jpeg?auto=compress&w=300",
  "namak":       "https://images.pexels.com/photos/4110252/pexels-photo-4110252.jpeg?auto=compress&w=300",
  "tea":         "https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&w=300",
  "chai":        "https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&w=300",
  "coffee":      "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&w=300",
  "biscuit":     "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&q=80",
  "cookie":      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&q=80",
  "snack":       "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300&q=80",
  "chips":       "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300&q=80",
  "namkeen":     "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300&q=80",
  "vinegar":     "https://images.pexels.com/photos/1022385/pexels-photo-1022385.jpeg?auto=compress&w=300",
  "sauce":       "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=300&q=80",
  "ketchup":     "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=300&q=80",
  "honey":       "https://images.pexels.com/photos/302163/pexels-photo-302163.jpeg?auto=compress&w=300",
  "jam":         "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&q=80",
  "pickle":      "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=300&q=80",
  "achar":       "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=300&q=80",
  "water":       "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300&q=80",
  "juice":       "https://images.unsplash.com/photo-1546171753-97d7676e4602?w=300&q=80",
  "coconut water":"https://images.unsplash.com/photo-1580984969071-a8da5656c2fb?w=300&q=80",
  "soap":        "https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=300&q=80",
  "shampoo":     "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=300&q=80",
};

function getItemImg(name, category) {
  const lower = (name || "").toLowerCase();
  if (ITEM_IMGS[lower]) return ITEM_IMGS[lower];
  for (const [key, img] of Object.entries(ITEM_IMGS)) {
    if (lower.includes(key) || key.includes(lower)) return img;
  }
  const catFallbacks = {
    Vegetables: "https://images.unsplash.com/photo-1590779033100-9f17a209f87d?w=300&q=80",
    Fruits:     "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&q=80",
    Grains:     "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=300&q=80",
    Dairy:      "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80",
    Spices:     "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&q=80",
    Proteins:   "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=300&q=80",
    Oils:       "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&q=80",
    Other:      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80",
  };
  return catFallbacks[category] || catFallbacks.Other;
}

export default function Pantry() {
  const toast = useToast();
  const notifyLowStock = useLowStockNotification();
  const notifyExpiry = useExpiryNotification();
  const [household, setHousehold] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState({ name:"", category:"Vegetables", quantity:"", unit:"kg", lowStockThreshold:"1" });
  const [submitting, setSubmitting] = useState(false);
  const token = localStorage.getItem("token");
  const headers = { Authorization:`Bearer ${token}` };

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const res = await axios.get(`${API}/household/myhousehold`, { headers });
      if (res.data) {
        setHousehold(res.data);
        const pRes = await axios.get(`${API}/pantry/${res.data._id}`, { headers });
        // Auto-fix categories for items stored as "Other"
        const rawItems = pRes.data || [];
        const fixed = rawItems.map(item => {
          if (item.category === "Other" || !item.category) {
            const guessed = smartCategory(item.name);
            if (guessed) return { ...item, category: guessed };
          }
          return item;
        });
        setItems(fixed);
        // Trigger notifications for low stock and expiry
        notifyLowStock(fixed);
        notifyExpiry(fixed);
      }
    } catch(e){ console.error(e); }
    setLoading(false);
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast("Enter item name","warning"); return; }
    setSubmitting(true);
    try {
      await axios.post(`${API}/pantry`, {
        household: household._id, name: form.name,
        category: form.category, quantity: parseFloat(form.quantity)||1,
        unit: form.unit, lowStockThreshold: parseFloat(form.lowStockThreshold)||1,
      }, { headers });
      toast(`${form.name} added!`,"success");
      setShowForm(false);
      setForm({ name:"", category:"Vegetables", quantity:"", unit:"kg", lowStockThreshold:"1" });
      load();
    } catch(err){ toast(err.response?.data?.message||"Error","error"); }
    setSubmitting(false);
  };

  const deleteItem = async (id, name) => {
    if (!window.confirm(`Remove ${name}?`)) return;
    await axios.delete(`${API}/pantry/${id}`, { headers });
    toast(`${name} removed`,"info"); load();
  };

  const updateQty = async (id, qty) => {
    if (qty < 0) return;
    try { await axios.put(`${API}/pantry/${id}`, { quantity: qty }, { headers }); load(); } catch {}
  };

  let filtered = [...items];
  if (filter !== "All") filtered = filtered.filter(i=>i.category===filter);
  if (search) filtered = filtered.filter(i=>i.name.toLowerCase().includes(search.toLowerCase()));
  // Sort: low stock first, then alphabetically within category
  filtered.sort((a,b) => {
    const aLow = a.quantity<=(a.lowStockThreshold||1) ? 0 : 1;
    const bLow = b.quantity<=(b.lowStockThreshold||1) ? 0 : 1;
    if (aLow !== bLow) return aLow - bLow;
    return (a.category||"").localeCompare(b.category||"") || (a.name||"").localeCompare(b.name||"");
  });

  const lowStock = items.filter(i=>i.quantity<=(i.lowStockThreshold||1));
  const byCategory = CATEGORIES.map(cat=>({cat,...CAT_META[cat],items:items.filter(i=>i.category===cat)})).filter(c=>c.items.length>0);

  if (loading) return (
    <div style={s.loader}><img src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&q=80" style={s.loaderImg} alt=""/><p style={s.loaderText}>Loading pantry...</p></div>
  );

  const selNutr = selectedItem ? getNutrition(selectedItem.name) : null;
  const selImg  = selectedItem ? getItemImg(selectedItem.name, selectedItem.category) : null;
  const catColor = selectedItem ? CAT_META[selectedItem.category]?.color : "#ff6b2b";

  return (
    <div style={s.page}>

      {/* HERO */}
      <div style={s.hero}>
        <img src="https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1200&q=80" alt="" style={s.heroBg}/>
        <div style={s.heroOverlay}/>
        <div style={s.heroContent}>
          <div>
            <h1 style={s.heroTitle}>Pantry</h1>
            <p style={s.heroSub}>{household?.name} · Your kitchen inventory</p>
          </div>
          <div style={s.heroRight}>
            <div style={s.heroStat}><span style={s.heroNum}>{items.length}</span><span style={s.heroLab}>Total Items</span></div>
            <div style={s.heroStat}><span style={{...s.heroNum,color:lowStock.length>0?"#ef9a9a":"#a5d6a7"}}>{lowStock.length}</span><span style={s.heroLab}>Low Stock</span></div>
            <div style={s.heroStat}><span style={{...s.heroNum,color:"#c9a96e"}}>{byCategory.length}</span><span style={s.heroLab}>Categories</span></div>
            <button onClick={()=>setShowForm(true)} style={s.heroBtn}>+ Add Item</button>
          </div>
        </div>
      </div>

      {/* LOW STOCK ALERT */}
      {lowStock.length > 0 && (
        <div style={s.alertCard}>
          <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=70" alt="" style={s.alertBg}/>
          <div style={s.alertOverlay}/>
          <div style={s.alertContent}>
            <h3 style={s.alertTitle}>⚠️ Low Stock Alert — {lowStock.length} item{lowStock.length!==1?"s":""} running low</h3>
            <div style={s.alertGrid}>
              {lowStock.slice(0,8).map(item=>{
                const cat = CAT_META[item.category]||CAT_META.Other;
                const pct = Math.round((item.quantity/(item.lowStockThreshold||1))*100);
                return (
                  <div key={item._id} style={{...s.alertItem,flexDirection:"column",gap:6,alignItems:"flex-start",minWidth:140}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,width:"100%"}}>
                      <span style={s.alertItemIcon}>{cat.icon}</span>
                      <div style={{flex:1}}>
                        <span style={s.alertItemName}>{item.name}</span>
                        <span style={{...s.alertItemQty,display:"block"}}>{item.quantity} {item.unit} left</span>
                        <div style={s.alertBar}><div style={{...s.alertBarFill,width:`${Math.min(100,pct)}%`,background:pct<30?"#ef5350":"#ffa726"}}/></div>
                      </div>
                      {pct===0&&<span style={s.outBadge}>OUT</span>}
                    </div>
                    {/* Action buttons */}
                    <div style={{display:"flex",gap:5,width:"100%"}}>
                      <button onClick={()=>{
                        const GROCERY_KEY="groceryList";
                        const existing=(() => { try{ return JSON.parse(localStorage.getItem(GROCERY_KEY)||"[]"); }catch{ return []; } })();
                        if(existing.some(e=>e.name.toLowerCase()===item.name.toLowerCase())){ toast(`${item.name} already in grocery list`,"info"); return; }
                        const newList=[...existing,{id:Date.now()+Math.random(),name:item.name,cat:item.category,qty:"1",unit:item.unit,est:0,fromPantry:true}];
                        localStorage.setItem(GROCERY_KEY,JSON.stringify(newList));
                        toast(`${item.name} added to Grocery List 🛒`,"success");
                      }} style={{flex:1,padding:"5px 6px",borderRadius:7,border:"1px solid rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.1)",color:"white",fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
                        🛒 Grocery
                      </button>
                      <button onClick={()=>{
                        const CART_KEY="homehub_smartcart_v2";
                        const existing=(() => { try{ return JSON.parse(localStorage.getItem(CART_KEY)||"[]"); }catch{ return []; } })();
                        if(existing.some(e=>e.name.toLowerCase()===item.name.toLowerCase())){ toast(`${item.name} already in cart`,"info"); return; }
                        const newCart=[...existing,{id:Date.now()+Math.random(),name:item.name,icon:cat.icon||"📦",price:0,qty:1,unit:item.unit,cat:item.category,fromPantry:true}];
                        localStorage.setItem(CART_KEY,JSON.stringify(newCart));
                        toast(`${item.name} added to Smart Cart ⚡`,"success");
                      }} style={{flex:1,padding:"5px 6px",borderRadius:7,border:"1px solid rgba(255,165,0,0.4)",background:"rgba(255,107,43,0.25)",color:"white",fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
                        ⚡ Cart
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY IMAGE TILES */}
      {byCategory.length > 0 && (
        <>
          <h3 style={s.sectionTitle}>🗂️ By Category</h3>
          <div style={s.catGrid}>
            {byCategory.map(c=>(
              <button key={c.cat} onClick={()=>setFilter(filter===c.cat?"All":c.cat)} style={{...s.catCard,border: filter===c.cat?`2.5px solid ${c.color}`:"2.5px solid transparent",transform: filter===c.cat?"scale(1.04)":"scale(1)",}}>
                <img src={c.img} alt={c.cat} style={s.catImg}/>
                <div style={{...s.catOvl,background:`linear-gradient(180deg,transparent 30%,${c.color}ee 100%)`}}/>
                <div style={s.catBody}>
                  <span style={{display:"block",fontSize:"18px",marginBottom:"2px"}}>{c.icon}</span>
                  <span style={{display:"block",fontSize:"12px",fontWeight:"800",color:"white"}}>{c.cat}</span>
                  <span style={{fontSize:"10px",color:"rgba(255,255,255,0.75)"}}>{c.items.length} item{c.items.length!==1?"s":""}</span>
                </div>
                {filter===c.cat&&<div style={{position:"absolute",top:"8px",right:"8px",width:"20px",height:"20px",borderRadius:"50%",background:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:"800"}}>✓</div>}
              </button>
            ))}
          </div>
        </>
      )}

      {/* SEARCH + FILTER ROW */}
      <div style={s.searchRow}>
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>🔍</span>
          <input placeholder="Search items..." value={search} onChange={e=>setSearch(e.target.value)} style={s.searchInput}/>
        </div>
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
          {["All",...CATEGORIES].map(cat=>(
            <button key={cat} onClick={()=>setFilter(cat)} style={{...s.filterBtn,background: filter===cat?"#ff6b2b":"rgba(139,94,60,0.06)",color: filter===cat?"white":"#5c4a35",}}>{cat==="All"?"All Items":CAT_META[cat]?.icon+" "+cat}</button>
          ))}
        </div>
      </div>

      {/* ITEM GRID — grouped by category when All selected */}
      {filtered.length === 0 ? (
        <div style={s.empty}>
          <span style={{fontSize:"48px",display:"block",marginBottom:"12px"}}>{search?"🔍":"🫙"}</span>
          <p style={{fontSize:"18px",fontWeight:"800",color:"#1a1410",marginBottom:"6px"}}>{search?"No results found":"Pantry is empty"}</p>
          <p style={{fontSize:"13px",color:"#9c8672",marginBottom:"20px"}}>{search?"Try a different search term":"Add groceries to start tracking your inventory"}</p>
          {!search&&<button onClick={()=>setShowForm(true)} style={s.emptyBtn}>+ Add First Item</button>}
        </div>
      ) : filter !== "All" ? (
        <div style={s.itemGrid}>
          {filtered.map(item=>{
            const cat = CAT_META[item.category]||CAT_META.Other;
            const nutr = getNutrition(item.name);
            const img  = getItemImg(item.name, item.category);
            const threshold = item.lowStockThreshold||1;
            const pct = Math.min(100, Math.round((item.quantity/Math.max(threshold*3,item.quantity))*100));
            const isLow = item.quantity <= threshold;
            const isEmpty = item.quantity === 0;
            return (
              <div key={item._id} style={{...s.itemCard, border:`1.5px solid ${isLow?"rgba(220,53,69,0.2)":"rgba(139,94,60,0.06)"}`}}>
                {/* Item photo — always shown */}
                <div style={s.itemImgWrap}>
                  <img src={img} alt={item.name} style={s.itemImg}/>
                  <div style={{...s.itemImgOvl,background:`linear-gradient(180deg,transparent 50%,${cat.color}cc 100%)`}}/>
                  {isLow && <div style={s.lowBadgePill}>{isEmpty?"OUT":"LOW"}</div>}
                  <button style={{position:"absolute",top:"6px",right:"6px",background:"rgba(0,0,0,0.45)",border:"none",borderRadius:"50%",width:"22px",height:"22px",cursor:"pointer",fontSize:"11px",color:"white",zIndex:3,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>deleteItem(item._id,item.name)}>✕</button>
                </div>
                <div style={s.itemBody}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"4px"}}>
                    <div>
                      <p style={s.itemName}>{item.name}</p>
                      <p style={s.itemCat}>{cat.icon} {item.category}</p>
                    </div>
                  </div>
                  {/* Quantity controls */}
                  <div style={s.qtyRow}>
                    <button style={s.qtyBtn} onClick={()=>updateQty(item._id, Math.max(0,item.quantity-1))}>−</button>
                    <span style={s.qtyVal}>{item.quantity}<span style={s.qtyUnit}>{item.unit}</span></span>
                    <button style={s.qtyBtn} onClick={()=>updateQty(item._id, item.quantity+1)}>+</button>
                  </div>
                  {/* Stock bar */}
                  <div style={s.stockBar}><div style={{...s.stockFill,width:`${pct}%`,background:isEmpty?"#ef5350":isLow?"#ffa726":cat.color}}/></div>
                  <p style={{fontSize:"10px",color:"#9c8672",textAlign:"center",margin:"0 0 8px"}}>Alert below {threshold} {item.unit}</p>
                  {/* NUTRITION PANEL */}
                  {nutr && (
                    <div style={s.nutrPanel}>
                      <div style={s.nutrHeader}>
                        <span style={s.nutrTitle}>📊 Nutrition per 100g</span>
                        <span style={{fontSize:"10px",color:`${cat.color}`,fontWeight:"700",background:`${cat.color}12`,padding:"2px 8px",borderRadius:"50px"}}>ℹ️ {nutr.benefit}</span>
                      </div>
                      <div style={s.nutrGrid}>
                        {[
                          {label:"Calories", val:`${nutr.cal}`, unit:"kcal", emoji:"🔥", color:"#ff6b2b"},
                          {label:"Protein",  val:`${nutr.protein}g`, unit:"",   emoji:"💪", color:"#7c3aed"},
                          {label:"Carbs",    val:`${nutr.carbs}g`,   unit:"",   emoji:"⚡", color:"#1565c0"},
                          {label:"Fat",      val:`${nutr.fat}g`,     unit:"",   emoji:"🫧", color:"#e67e22"},
                          {label:"Fiber",    val:`${nutr.fiber}g`,   unit:"",   emoji:"🌿", color:"#2d7a4f"},
                        ].map(n=>(
                          <div key={n.label} style={s.nutrItem}>
                            <span style={s.nutrEmoji}>{n.emoji}</span>
                            <span style={{...s.nutrVal,color:n.color}}>{n.val}</span>
                            <span style={s.nutrLab}>{n.label}</span>
                          </div>
                        ))}
                      </div>
                      <div style={s.nutrVit}>🧪 Vitamins: <span style={{fontWeight:700}}>{nutr.vitamin}</span></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {/* Add more card */}
          <button onClick={()=>setShowForm(true)} style={s.addMoreCard}>
            <span style={{fontSize:"32px",color:"#ff6b2b"}}>+</span>
            <span style={{fontSize:"13px",color:"#ff6b2b",fontWeight:"700"}}>Add Item</span>
          </button>
        </div>
      ) : (
        /* All items grouped by category */
        <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
          {CATEGORIES.map(cat => {
            const catItems = filtered.filter(i => i.category === cat);
            if (catItems.length === 0) return null;
            const meta = CAT_META[cat];
            return (
              <div key={cat}>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px",padding:"10px 14px",background:`${meta.color}08`,borderRadius:"12px",border:`1px solid ${meta.color}20`}}>
                  <span style={{fontSize:"20px"}}>{meta.icon}</span>
                  <h3 style={{margin:0,fontSize:"14px",fontWeight:"800",color:meta.color,fontFamily:"'Playfair Display',serif"}}>{cat}</h3>
                  <span style={{marginLeft:"auto",background:`${meta.color}15`,color:meta.color,borderRadius:"50px",padding:"2px 10px",fontSize:"11px",fontWeight:"700"}}>{catItems.length} item{catItems.length!==1?"s":""}</span>
                </div>
                <div style={s.itemGrid}>
                  {catItems.map(item => {
                    const catM = CAT_META[item.category]||CAT_META.Other;
                    const nutr = getNutrition(item.name);
                    const img  = getItemImg(item.name, item.category);
                    const threshold = item.lowStockThreshold||1;
                    const pct = Math.min(100, Math.round((item.quantity/Math.max(threshold*3,item.quantity))*100));
                    const isLow = item.quantity <= threshold;
                    const isEmpty = item.quantity === 0;
                    return (
                      <div key={item._id} style={{...s.itemCard, border:`1.5px solid ${isLow?"rgba(220,53,69,0.2)":"rgba(139,94,60,0.06)"}`}}>
                        <div style={s.itemImgWrap}>
                          <img src={img} alt={item.name} style={s.itemImg}/>
                          <div style={{...s.itemImgOvl,background:`linear-gradient(180deg,transparent 50%,${catM.color}cc 100%)`}}/>
                          {isLow && <div style={s.lowBadgePill}>{isEmpty?"OUT":"LOW"}</div>}
                          <button style={{position:"absolute",top:"6px",right:"6px",background:"rgba(0,0,0,0.45)",border:"none",borderRadius:"50%",width:"22px",height:"22px",cursor:"pointer",fontSize:"11px",color:"white",zIndex:3,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>deleteItem(item._id,item.name)}>✕</button>
                        </div>
                        <div style={s.itemBody}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"4px"}}>
                            <div>
                              <p style={s.itemName}>{item.name}</p>
                              <p style={s.itemCat}>{catM.icon} {item.category}</p>
                            </div>
                          </div>
                          <div style={s.qtyRow}>
                            <button style={s.qtyBtn} onClick={()=>updateQty(item._id, Math.max(0,item.quantity-1))}>−</button>
                            <span style={s.qtyVal}>{item.quantity}<span style={s.qtyUnit}>{item.unit}</span></span>
                            <button style={s.qtyBtn} onClick={()=>updateQty(item._id, item.quantity+1)}>+</button>
                          </div>
                          <div style={s.stockBar}><div style={{...s.stockFill,width:`${pct}%`,background:isEmpty?"#ef5350":isLow?"#ffa726":catM.color}}/></div>
                          <p style={{fontSize:"10px",color:"#9c8672",textAlign:"center",margin:"0 0 8px"}}>Alert below {threshold} {item.unit}</p>
                          {nutr && (
                            <div style={s.nutrPanel}>
                              <div style={s.nutrHeader}>
                                <span style={s.nutrTitle}>📊 Nutrition per 100g</span>
                                <span style={{fontSize:"10px",color:`${catM.color}`,fontWeight:"700",background:`${catM.color}12`,padding:"2px 8px",borderRadius:"50px"}}>ℹ️ {nutr.benefit}</span>
                              </div>
                              <div style={s.nutrGrid}>
                                {[
                                  {label:"Calories", val:`${nutr.cal}`, emoji:"🔥", color:"#ff6b2b"},
                                  {label:"Protein",  val:`${nutr.protein}g`, emoji:"💪", color:"#7c3aed"},
                                  {label:"Carbs",    val:`${nutr.carbs}g`, emoji:"⚡", color:"#1565c0"},
                                  {label:"Fat",      val:`${nutr.fat}g`, emoji:"🫧", color:"#e67e22"},
                                  {label:"Fiber",    val:`${nutr.fiber}g`, emoji:"🌿", color:"#2d7a4f"},
                                ].map(n=>(
                                  <div key={n.label} style={s.nutrItem}>
                                    <span style={s.nutrEmoji}>{n.emoji}</span>
                                    <span style={{...s.nutrVal,color:n.color}}>{n.val}</span>
                                    <span style={s.nutrLab}>{n.label}</span>
                                  </div>
                                ))}
                              </div>
                              <div style={s.nutrVit}>🧪 Vitamins: <span style={{fontWeight:700}}>{nutr.vitamin}</span></div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={()=>setShowForm(true)} style={s.addMoreCard}>
                    <span style={{fontSize:"24px",color:meta.color}}>+</span>
                    <span style={{fontSize:"11px",color:meta.color,fontWeight:"700"}}>Add {cat}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD ITEM MODAL */}
      {showForm&&(
        <div style={s.modalBg} onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div style={s.modal}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"24px"}}>
              <h3 style={{fontSize:"20px",fontWeight:"800",color:"#1a1410",margin:0,fontFamily:"'Playfair Display',serif"}}>🫙 Add to Pantry</h3>
              <button style={s.modalX} onClick={()=>setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={addItem} style={{display:"flex",flexDirection:"column",gap:"16px"}}>
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                <label style={s.mLbl}>Item Name *</label>
                <input placeholder="e.g. Tomatoes, Rice, Milk..." value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={s.mInput} required/>
                {form.name && getNutrition(form.name) && (
                  <div style={{background:"rgba(45,122,79,0.08)",border:"1px solid rgba(45,122,79,0.15)",borderRadius:"10px",padding:"10px 12px",fontSize:"12px",color:"#2d7a4f",fontWeight:"600"}}>
                    ✅ Nutrition data available for this item
                  </div>
                )}
              </div>
              <div style={{display:"flex",gap:"14px"}}>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:"6px"}}>
                  <label style={s.mLbl}>Category</label>
                  <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={s.mInput}>
                    {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:"6px"}}>
                  <label style={s.mLbl}>Unit</label>
                  <select value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} style={s.mInput}>
                    {UNITS.map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:"flex",gap:"14px"}}>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:"6px"}}>
                  <label style={s.mLbl}>Quantity</label>
                  <input type="number" step="0.1" placeholder="1" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} style={s.mInput}/>
                </div>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:"6px"}}>
                  <label style={s.mLbl}>Low stock alert</label>
                  <input type="number" step="0.1" placeholder="1" value={form.lowStockThreshold} onChange={e=>setForm({...form,lowStockThreshold:e.target.value})} style={s.mInput}/>
                </div>
              </div>
              <button type="submit" disabled={submitting} style={{padding:"15px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",border:"none",borderRadius:"14px",fontSize:"15px",fontWeight:"700",cursor:"pointer",boxShadow:"0 6px 20px rgba(255,107,43,0.3)"}}>{submitting?"Adding...":"Add to Pantry"}</button>
            </form>
          </div>
        </div>
      )}
      <style>{`input:focus,select:focus{outline:none!important;border-color:#ff6b2b!important;box-shadow:0 0 0 3px rgba(255,107,43,0.1)!important;}`}</style>
    </div>
  );
}

const s = {
  page:{display:"flex",flexDirection:"column",gap:"22px",paddingBottom:"32px"},
  loader:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:"16px"},
  loaderImg:{width:"120px",height:"120px",borderRadius:"50%",objectFit:"cover"},
  loaderText:{fontSize:"16px",color:"#5c4a35",fontWeight:"600"},
  hero:{position:"relative",borderRadius:"24px",overflow:"hidden",height:"200px",boxShadow:"0 16px 48px rgba(0,0,0,0.18)"},
  heroBg:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"},
  heroOverlay:{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(26,20,16,0.88),rgba(26,20,16,0.5))"},
  heroContent:{position:"relative",zIndex:2,padding:"32px 40px",height:"100%",display:"flex",justifyContent:"space-between",alignItems:"center"},
  heroTitle:{fontFamily:"'Playfair Display',serif",fontSize:"36px",fontWeight:"800",color:"white",margin:"0 0 6px"},
  heroSub:{fontSize:"13px",color:"rgba(255,255,255,0.55)"},
  heroRight:{display:"flex",gap:"24px",alignItems:"center"},
  heroStat:{textAlign:"center"},
  heroNum:{display:"block",fontSize:"22px",fontWeight:"800",color:"#ffaa70"},
  heroLab:{display:"block",fontSize:"10px",color:"rgba(255,255,255,0.45)",fontWeight:"500",marginTop:"2px"},
  heroBtn:{padding:"12px 20px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",border:"none",borderRadius:"12px",fontSize:"14px",fontWeight:"700",cursor:"pointer",boxShadow:"0 4px 16px rgba(255,107,43,0.35)"},
  alertCard:{position:"relative",borderRadius:"20px",overflow:"hidden",boxShadow:"0 8px 28px rgba(0,0,0,0.15)"},
  alertBg:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"},
  alertOverlay:{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(180,30,30,0.92),rgba(200,80,20,0.88))"},
  alertContent:{position:"relative",zIndex:2,padding:"24px 28px"},
  alertTitle:{fontSize:"16px",fontWeight:"800",color:"white",margin:"0 0 16px",fontFamily:"'Playfair Display',serif"},
  alertGrid:{display:"flex",flexWrap:"wrap",gap:"10px"},
  alertItem:{display:"flex",alignItems:"center",gap:"10px",background:"rgba(255,255,255,0.1)",borderRadius:"12px",padding:"10px 12px"},
  alertItemIcon:{fontSize:"22px",flexShrink:0},
  alertItemInfo:{flex:1},
  alertItemName:{display:"block",fontSize:"13px",fontWeight:"700",color:"white"},
  alertItemQty:{display:"block",fontSize:"11px",color:"rgba(255,255,255,0.65)"},
  alertBar:{height:"4px",background:"rgba(255,255,255,0.2)",borderRadius:"4px",overflow:"hidden",marginTop:"4px"},
  alertBarFill:{height:"100%",borderRadius:"4px",transition:"width 0.6s ease"},
  outBadge:{background:"rgba(255,255,255,0.2)",color:"white",borderRadius:"50px",padding:"2px 8px",fontSize:"10px",fontWeight:"800"},
  sectionTitle:{fontSize:"16px",fontWeight:"800",color:"#1a1410",margin:0,fontFamily:"'Playfair Display',serif"},
  catGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:"12px"},
  catCard:{position:"relative",borderRadius:"14px",overflow:"hidden",height:"110px",cursor:"pointer",background:"white",boxShadow:"0 3px 12px rgba(0,0,0,0.1)",transition:"all 0.25s",padding:0},
  catImg:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"},
  catOvl:{position:"absolute",inset:0},
  catBody:{position:"absolute",bottom:0,left:0,right:0,padding:"10px",textAlign:"left"},
  searchRow:{display:"flex",flexDirection:"column",gap:"12px"},
  searchWrap:{position:"relative",display:"flex",alignItems:"center"},
  searchIcon:{position:"absolute",left:"14px",fontSize:"16px",zIndex:1},
  searchInput:{width:"100%",padding:"12px 12px 12px 44px",border:"1.5px solid rgba(139,94,60,0.15)",borderRadius:"14px",fontSize:"14px",background:"white",color:"#1a1410"},
  filterBtn:{padding:"8px 14px",borderRadius:"50px",border:"none",fontSize:"12px",fontWeight:"700",cursor:"pointer",transition:"all 0.2s"},
  empty:{background:"white",borderRadius:"20px",padding:"60px",textAlign:"center",boxShadow:"0 4px 20px rgba(139,94,60,0.08)"},
  emptyBtn:{padding:"12px 24px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",border:"none",borderRadius:"50px",fontSize:"14px",fontWeight:"700",cursor:"pointer"},
  itemGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:"16px"},
  itemCard:{background:"white",borderRadius:"18px",overflow:"hidden",boxShadow:"0 4px 16px rgba(139,94,60,0.08)",transition:"transform 0.2s,box-shadow 0.2s"},
  itemImgWrap:{position:"relative",height:"120px",overflow:"hidden"},
  itemImg:{width:"100%",height:"100%",objectFit:"cover"},
  itemImgOvl:{position:"absolute",inset:0},
  lowBadgePill:{position:"absolute",top:"8px",right:"8px",background:"rgba(220,53,69,0.85)",color:"white",borderRadius:"50px",padding:"3px 10px",fontSize:"10px",fontWeight:"800"},
  itemBody:{padding:"16px"},
  itemTop:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px"},
  itemIconBox:{width:"44px",height:"44px",borderRadius:"12px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px"},
  lowBadge:{borderRadius:"50px",padding:"2px 8px",fontSize:"10px",fontWeight:"800"},
  itemDel:{background:"none",border:"none",cursor:"pointer",fontSize:"13px",opacity:0.35,color:"#5c4a35",padding:"4px"},
  itemName:{fontSize:"15px",fontWeight:"800",color:"#1a1410",margin:"0 0 2px"},
  itemCat:{fontSize:"11px",color:"#9c8672",margin:"0 0 10px"},
  qtyRow:{display:"flex",alignItems:"center",gap:"10px",marginBottom:"8px"},
  qtyBtn:{width:"28px",height:"28px",borderRadius:"50%",border:"1.5px solid rgba(139,94,60,0.15)",background:"white",cursor:"pointer",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"600",color:"#5c4a35"},
  qtyVal:{flex:1,textAlign:"center",fontSize:"16px",fontWeight:"800",color:"#1a1410"},
  qtyUnit:{fontSize:"11px",fontWeight:"500",color:"#9c8672",marginLeft:"2px"},
  stockBar:{height:"5px",background:"rgba(139,94,60,0.08)",borderRadius:"5px",overflow:"hidden",marginBottom:"6px"},
  stockFill:{height:"100%",borderRadius:"5px",transition:"width 0.6s ease"},
  nutrPanel:{background:"rgba(45,122,79,0.05)",border:"1px solid rgba(45,122,79,0.12)",borderRadius:"12px",padding:"12px"},
  nutrHeader:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px",gap:"8px",flexWrap:"wrap"},
  nutrTitle:{fontSize:"11px",fontWeight:"800",color:"#2d7a4f",textTransform:"uppercase",letterSpacing:"0.04em"},
  nutrGrid:{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"6px",marginBottom:"8px"},
  nutrItem:{display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",background:"white",borderRadius:"8px",padding:"6px 4px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"},
  nutrEmoji:{fontSize:"13px"},
  nutrVal:{fontSize:"10px",fontWeight:"800"},
  nutrLab:{fontSize:"9px",color:"#9c8672",textAlign:"center"},
  nutrVit:{fontSize:"10px",color:"#2d7a4f",fontWeight:"600"},
  addMoreCard:{background:"rgba(255,107,43,0.04)",border:"2px dashed rgba(255,107,43,0.25)",borderRadius:"18px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"8px",cursor:"pointer",padding:"40px 20px",transition:"all 0.2s",minHeight:"180px"},
  modalBg:{position:"fixed",inset:0,background:"rgba(26,20,16,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"},
  modal:{background:"white",borderRadius:"24px",padding:"32px",width:"100%",maxWidth:"480px",boxShadow:"0 32px 80px rgba(0,0,0,0.25)",margin:"20px",maxHeight:"90vh",overflowY:"auto"},
  modalX:{background:"rgba(139,94,60,0.08)",border:"none",borderRadius:"50%",width:"32px",height:"32px",cursor:"pointer",fontSize:"14px"},
  mLbl:{fontSize:"12px",fontWeight:"700",color:"#5c4a35",textTransform:"uppercase",letterSpacing:"0.04em"},
  mInput:{padding:"12px 14px",border:"1.5px solid rgba(139,94,60,0.15)",borderRadius:"12px",fontSize:"14px",background:"#fdf8f3",color:"#1a1410",transition:"all 0.2s",width:"100%"},
};