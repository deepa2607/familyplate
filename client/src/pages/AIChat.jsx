// AIChat.jsx — Fixed: No Gemini, no overlap, pure built-in chatbot, clean 3D UI
import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";

// ══════════════════════════════════════════════════════════════════════════
//  BUILT-IN FOOD AI — 100% offline, no quota issues, no Gemini needed
// ══════════════════════════════════════════════════════════════════════════
const BUILTIN_AI = {
  recipes: {
    poha:     {n:"Masala Poha",cal:250,time:"15 min",ing:["2 cups thick poha","1 onion chopped","1 green chilli","½ tsp mustard seeds","8 curry leaves","½ tsp turmeric","1 tbsp oil","salt","lemon juice","coriander","sev"],steps:["Wash poha, drain, rest 5 min","Heat oil, splutter mustard + curry leaves + chilli","Add onion, fry golden","Add turmeric + salt","Add poha, toss gently 3 min on low","Squeeze lemon, garnish coriander + sev"]},
    dal:      {n:"Dal Tadka",cal:280,time:"25 min",ing:["1 cup toor dal","2 tomatoes","1 onion","4 garlic cloves","1 tsp cumin","½ tsp turmeric","1 tsp red chilli","2 tbsp ghee","salt","coriander"],steps:["Pressure cook dal with turmeric 3 whistles","Heat ghee, add cumin till splutter","Add garlic + onion, fry golden","Add tomatoes, cook 5 min","Add spices, mix","Pour tadka over dal","Garnish coriander, serve with rice"]},
    biryani:  {n:"Veg Biryani",cal:450,time:"45 min",ing:["2 cups basmati rice","2 cups mixed veggies","2 onions sliced","2 tbsp biryani masala","½ cup yogurt","1 tbsp ginger-garlic paste","saffron in warm milk","3 tbsp ghee","whole spices","mint","fried onions"],steps:["Parboil rice with whole spices 70%","Marinate veggies in yogurt + masala 20 min","Fry onions crispy golden","Cook marinated veggies until half done","Layer rice, veggies, fried onions","Drizzle saffron milk + ghee + mint","Seal and dum cook 20 min low heat","Fluff gently, serve with raita"]},
    chicken:  {n:"Chicken Curry",cal:380,time:"35 min",ing:["500g chicken","2 onions","3 tomatoes pureed","1.5 tbsp ginger-garlic paste","2 tbsp chicken masala","½ tsp turmeric","1 tsp red chilli","3 tbsp yogurt","3 tbsp oil","½ tsp garam masala","coriander"],steps:["Heat oil, fry onions deep brown 10 min","Add ginger-garlic paste 2 min","Add tomato puree, cook till oil separates 8 min","Add all spices except garam masala","Add chicken, coat well with masala","Add ½ cup water, cover cook 15 min","Stir in yogurt, cook 5 min","Finish garam masala + coriander"]},
    paneer:   {n:"Paneer Butter Masala",cal:420,time:"30 min",ing:["250g paneer cubed","3 tomatoes blanched","2 onions","3 tbsp butter","½ cup cream","10 cashews soaked","1 tbsp ginger-garlic paste","2 tsp kashmiri red chilli","½ tsp garam masala","1 tsp kasuri methi","1 tsp sugar"],steps:["Blend tomatoes + onion + cashews smooth","Heat butter, add ginger-garlic paste 1 min","Add blended paste, cook 10 min","Add kashmiri chilli + garam masala + sugar + salt","Pour cream, stir, simmer 3 min","Add paneer cubes, fold gently 5 min","Crush kasuri methi on top","Serve with naan"]},
    egg:      {n:"Egg Bhurji",cal:280,time:"10 min",ing:["4 eggs","1 onion finely chopped","1 tomato chopped","1 green chilli","½ tsp cumin","¼ tsp turmeric","½ tsp red chilli","1 tbsp oil","salt","coriander"],steps:["Heat oil, splutter cumin","Add chilli + onion, fry golden 3 min","Add tomato, cook 2 min","Add turmeric + red chilli + salt","Crack eggs directly into pan","Scramble on medium, keep moist","Garnish coriander, serve with roti"]},
    khichdi:  {n:"Moong Dal Khichdi",cal:320,time:"20 min",ing:["1 cup rice","½ cup yellow moong dal","1 tbsp ghee","1 tsp cumin","½ tsp turmeric","½ tsp ginger grated","pinch asafoetida","salt","3 cups water"],steps:["Wash rice + dal, soak 10 min","Heat ghee in pressure cooker","Add cumin + asafoetida, splutter","Add ginger, sauté 30 sec","Add rice + dal + turmeric + salt","Add 3 cups water","Pressure cook 3 whistles","Mash lightly, drizzle ghee, serve with pickle + curd"]},
    rajma:    {n:"Rajma Masala",cal:380,time:"30 min",ing:["2 cups cooked kidney beans","2 onions finely chopped","3 tomatoes pureed","1 tbsp ginger-garlic paste","2 tsp rajma masala","1 tsp cumin","2 tbsp oil","½ tsp garam masala","coriander"],steps:["Heat oil, splutter cumin","Add onions, fry golden-brown 8 min","Add ginger-garlic paste 2 min","Add tomato puree, cook till oil separates","Add rajma masala + salt","Add rajma + ½ cup water","Simmer 10 min, mash some beans","Finish garam masala + coriander, serve with rice"]},
    palak:    {n:"Palak Paneer",cal:320,time:"30 min",ing:["3 cups spinach packed","200g paneer cubed","1 onion","4 garlic cloves","1 tsp ginger","1 green chilli","1 tbsp butter","½ tsp cumin","½ tsp garam masala","2 tbsp cream","salt"],steps:["Blanch spinach 2 min, ice bath immediately","Blend with green chilli smooth","Heat butter, add cumin + garlic + ginger + onion 5 min","Add spinach paste, cook 5 min","Add garam masala + salt","Add paneer cubes, fold gently","Swirl cream, serve with naan"]},
    upma:     {n:"Vegetable Upma",cal:230,time:"15 min",ing:["1 cup semolina dry-roasted","1 onion chopped","½ cup mixed veggies","½ tsp mustard seeds","10 curry leaves","1 green chilli","2 cups hot water","1 tbsp oil","salt","lemon"],steps:["Dry roast rava golden, set aside","Heat oil, splutter mustard + curry leaves + chilli","Add onion + veggies, cook 3 min","Add 2 cups hot water + salt, bring to boil","Pour rava slowly, stir continuously","Cook low 3 min till water absorbed","Squeeze lemon, serve with chutney"]},
    chole:    {n:"Chole Bhature",cal:620,time:"45 min",ing:["2 cups chickpeas (soaked overnight)","2 onions","3 tomatoes","2 tbsp chole masala","1 tbsp ginger-garlic paste","1 tsp amchur","tea bag","2 cups maida + yogurt (bhature)","oil for frying"],steps:["Pressure cook chickpeas with tea bag 5 whistles","Fry onions deep brown","Add ginger-garlic paste 2 min","Add tomatoes + masala + amchur, cook 10 min","Add chickpeas, mash some, simmer 10 min","Make bhature dough, rest 30 min","Roll and deep fry until puffy","Serve together with onion + chutney"]},
  },

  mealPlans: {
    weightloss: [
      {day:"Monday",b:"Oats Porridge 180cal",l:"Moong Dal Khichdi 260cal",d:"Veg Soup + Roti 240cal",s:"Cucumber 25cal"},
      {day:"Tuesday",b:"Fruit Bowl + Sprouts 160cal",l:"Palak Dal + Brown Rice 340cal",d:"Vegetable Soup + 1 Roti 220cal",s:"Green Tea 5cal"},
      {day:"Wednesday",b:"Moong Dal Chilla 200cal",l:"Veg Soup + 2 Rotis 280cal",d:"Stir Fry Paneer + Salad 260cal",s:"Fruits 80cal"},
      {day:"Thursday",b:"Idli + Sambar 260cal",l:"Brown Rice + Dal 300cal",d:"Grilled Veggies + Curd 220cal",s:"Roasted Chana 120cal"},
      {day:"Friday",b:"Poha light 230cal",l:"Palak Paneer + 1 Roti 290cal",d:"Vegetable Khichdi 280cal",s:"Coconut Water 45cal"},
      {day:"Saturday",b:"Vegetable Oats 180cal",l:"Rajma no rice + Salad 280cal",d:"Dal Soup + 1 Roti 240cal",s:"Fruits 80cal"},
      {day:"Sunday",b:"Sprouts + Curd 180cal",l:"Light Veg Biryani 350cal",d:"Clear Soup + Salad 180cal",s:"Makhana 100cal"},
    ],
    highprotein: [
      {day:"Monday",b:"3 Egg Omelette + Toast 300cal·28g",l:"Chicken Curry + Rice 550cal·42g",d:"Grilled Fish + Roti 380cal·35g",s:"Boiled Eggs 140cal·12g"},
      {day:"Tuesday",b:"Paneer Paratha + Curd 400cal·22g",l:"Dal Rice + Raita 450cal·20g",d:"Egg Curry + Roti 380cal·26g",s:"Roasted Chana 130cal·7g"},
      {day:"Wednesday",b:"Chicken Sandwich 380cal·28g",l:"Fish Curry + Rice 460cal·38g",d:"Paneer Tikka + Salad 340cal·28g",s:"Sprouts Chaat 150cal·10g"},
      {day:"Thursday",b:"Sprouts Bowl + Milk 220cal·18g",l:"Rajma Chawal 480cal·22g",d:"Grilled Chicken + Veggies 320cal·40g",s:"Greek Yogurt 120cal·15g"},
      {day:"Friday",b:"Egg Bhurji + Toast 300cal·24g",l:"Grilled Chicken Salad 320cal·35g",d:"Mutton Curry + 2 Rotis 500cal·38g",s:"Paneer Cubes 160cal·12g"},
      {day:"Saturday",b:"Paneer Bhurji + Roti 350cal·26g",l:"Chicken Biryani 580cal·38g",d:"Fish Fry + Rice 460cal·36g",s:"Boiled Eggs 140cal·12g"},
      {day:"Sunday",b:"3 Egg Omelette + 2 Toast 320cal·26g",l:"Dal Chicken + Rice 520cal·40g",d:"Grilled Salmon + Salad 380cal·42g",s:"Chicken Tikka 200cal·22g"},
    ],
    diabetic: [
      {day:"Monday",b:"Oats Porridge (Low GI) 200cal",l:"Brown Rice + Dal 380cal",d:"Roti + Dal + Salad 320cal",s:"Cucumber Sticks 30cal"},
      {day:"Tuesday",b:"Methi Paratha + Curd 280cal",l:"Palak Paneer + 2 Rotis 360cal",d:"Veg Soup + 1 Roti 220cal",s:"Roasted Chana 120cal"},
      {day:"Wednesday",b:"Idli + Sambar 260cal",l:"Moong Dal Khichdi 260cal",d:"Grilled Fish + Salad 280cal",s:"Sprouts 100cal"},
      {day:"Thursday",b:"Egg White Omelette 180cal",l:"Sabzi + 2 Rotis 300cal",d:"Dal + Brown Rice 300cal",s:"Low GI Fruits 90cal"},
      {day:"Friday",b:"Poha light oil 220cal",l:"Grilled Chicken Salad 280cal",d:"Khichdi 290cal",s:"Walnuts 100cal"},
      {day:"Saturday",b:"Oats Porridge 200cal",l:"Dal + Roti + Sabzi 340cal",d:"Stir Fry Veggies + Roti 250cal",s:"Cucumber 30cal"},
      {day:"Sunday",b:"Sprouts Chaat 160cal",l:"Brown Rice Rajma 380cal",d:"Vegetable Soup 160cal",s:"Almonds 80cal"},
    ],
  },

  nutrition: {
    paneer:  {cal:"265/100g",protein:"18g",fat:"21g",carbs:"1.2g",tip:"Best veg protein. Low carb, ideal for keto + muscle building."},
    chicken: {cal:"165/100g",protein:"31g",fat:"3.6g",carbs:"0g",  tip:"Lean protein king. Remove skin to cut fat by 50%."},
    egg:     {cal:"78 each", protein:"6g", fat:"5g",  carbs:"0.6g",tip:"Most bioavailable protein. Whites are pure protein, zero fat."},
    dal:     {cal:"116/100g",protein:"9g", fat:"0.4g",carbs:"20g", tip:"Great plant protein. Dal + rice = all essential amino acids."},
    rice:    {cal:"130/100g",protein:"2.7g",fat:"0.3g",carbs:"28g",tip:"Switch to brown rice for 3x more fiber and lower GI."},
    roti:    {cal:"80 each", protein:"3g", fat:"1g",  carbs:"16g", tip:"Whole wheat roti has more fiber. 2-3 per meal is ideal."},
    oats:    {cal:"389/100g",protein:"17g",fat:"7g",  carbs:"66g", tip:"Best breakfast for weight loss. High fiber keeps you full."},
    milk:    {cal:"61/100g", protein:"3.2g",fat:"3.3g",carbs:"4.8g",tip:"Full fat milk has more nutrition. Great for growing children."},
  },

  process(msg, pantry) {
    const q = msg.toLowerCase();

    for (const [key, r] of Object.entries(this.recipes)) {
      if (q.includes(key)) {
        return `## 🍽️ ${r.n}\n**⏱️ ${r.time}  •  🔥 ${r.cal} cal  •  Serves 2-3**\n\n### 📦 Ingredients\n${r.ing.map((i,n)=>`${n+1}. ${i}`).join('\n')}\n\n### 👨‍🍳 Step-by-Step Instructions\n${r.steps.map((s,n)=>`**${n+1}.** ${s}`).join('\n')}\n\n### 💡 Pro Tips\n- Taste and adjust salt before serving\n- Leftovers taste even better next day!`;
      }
    }

    if (q.includes('meal plan') || q.includes('diet plan') || q.includes('weekly') || q.includes('7 day')) {
      const type = q.includes('weight') || q.includes('lose') ? 'weightloss' : q.includes('protein') || q.includes('gym') ? 'highprotein' : q.includes('diabet') ? 'diabetic' : 'weightloss';
      const titles = {weightloss:'⚖️ 7-Day Weight Loss Meal Plan', highprotein:'💪 7-Day High Protein Plan', diabetic:'🩺 7-Day Diabetic-Friendly Plan'};
      return `## ${titles[type]}\n\n${this.mealPlans[type].map(d=>`### 📅 ${d.day}\n🌅 **Breakfast:** ${d.b}\n☀️ **Lunch:** ${d.l}\n🌙 **Dinner:** ${d.d}\n🍎 **Snack:** ${d.s}`).join('\n\n')}\n\n### 💡 Key Rules\n- **Drink 2-3 litres of water daily**\n- Eat dinner before 8 PM\n- Never skip breakfast`;
    }

    for (const [food, info] of Object.entries(this.nutrition)) {
      if ((q.includes('nutrition') || q.includes('calorie') || q.includes('protein in') || q.includes('healthy')) && q.includes(food)) {
        return `## 🥗 Nutrition: ${food.charAt(0).toUpperCase()+food.slice(1)}\n\n| Nutrient | Per 100g |\n|---|---|\n| 🔥 Calories | ${info.cal} |\n| 💪 Protein | ${info.protein} |\n| 🧈 Fat | ${info.fat} |\n| 🍞 Carbs | ${info.carbs} |\n\n### 💡 Expert Tip\n${info.tip}`;
      }
    }

    if (q.includes('cook today') || q.includes('what can i make') || q.includes('pantry') || q.includes('what to cook')) {
      const items = pantry ? pantry.replace('My pantry: ','').split(',').map(i=>i.trim().toLowerCase()) : [];
      const matches = [];
      if (items.some(i=>i.includes('poha'))) matches.push(this.recipes.poha);
      if (items.some(i=>i.includes('paneer'))) matches.push(this.recipes.paneer);
      if (items.some(i=>i.includes('egg'))) matches.push(this.recipes.egg);
      if (items.some(i=>i.includes('rice') || i.includes('dal'))) matches.push(this.recipes.dal);
      const show = matches.length > 0 ? matches.slice(0,3) : [this.recipes.dal, this.recipes.poha, this.recipes.egg];
      return `## 🍳 What You Can Cook Today!\n${items.length > 0 ? `\nYour pantry has: **${items.slice(0,6).join(', ')}**\n` : ''}\n${show.map((r,i)=>`### ${i+1}. ${r.n}\n⏱️ ${r.time} • 🔥 ${r.cal} cal\n**Quick steps:** ${r.steps.slice(0,3).join(' → ')}`).join('\n\n')}\n\n💡 Ask me **"How do I make [recipe name]?"** for full recipe!`;
    }

    if (q.includes('breakfast')) {
      return `## 🌅 5 Best Indian Breakfast Ideas\n\n### 1. 🫔 Masala Poha (250 cal, 15 min) ⭐\nWash poha, temper mustard+curry leaves, add onion, toss — done!\n\n### 2. 🥞 Moong Dal Chilla (200 cal, 20 min)\nProtein pancakes from soaked moong dal batter with veggies.\n\n### 3. 🍳 Egg Bhurji + Toast (300 cal, 10 min)\nSpiced scrambled eggs — fastest high-protein breakfast!\n\n### 4. 🫙 Sprouts Bowl (160 cal, 5 min)\nOvernight sprouted moong + cucumber + tomato + lemon.\n\n### 5. 🥣 Masala Oats (180 cal, 5 min)\nOats with veggies + cumin + green chilli.\n\n💡 **Rule:** Always eat within 1 hour of waking. Include protein!`;
    }

    if (q.includes('quick') || q.includes('fast') || q.includes('15 min') || q.includes('easy dinner')) {
      return `## ⏱️ 5 Dinners Under 15 Minutes\n\n### 1. 🥚 Egg Bhurji + Roti (10 min, 300 cal)\nScramble spiced eggs with onion-tomato. Quickest protein dinner.\n\n### 2. 🫔 Poha (15 min, 250 cal)\nWash, temper, cook. Done. Perfect when exhausted.\n\n### 3. 🥣 Khichdi (15 min, 320 cal)\nRice + moong dal + turmeric + ghee. One-pot comfort food.\n\n### 4. 🥗 Raita + Leftover Roti (5 min)\nCurd + cucumber + cumin. Pair with yesterday's rotis!\n\n### 5. 🫘 Dal + Rice (12 min)\nPressure cook dal, temper, serve. Always satisfying.\n\n💡 **Hack:** Cook dal+rice in bulk on Sunday!`;
    }

    if (q.includes('grocery') || q.includes('shopping') || q.includes('buy')) {
      return `## 🛒 Smart Weekly Grocery List (₹1,800–2,200)\n\n### 🥦 Vegetables & Fruits (₹400-500)\n- Onions 1kg ₹40 · Tomatoes 1kg ₹30 · Potatoes 500g ₹25\n- Spinach 2 bunches ₹30 · Cauliflower 1 ₹40\n- Seasonal fruits — bananas, apples, oranges ₹150\n\n### 🌾 Staples (₹500-600)\n- Basmati rice 2kg ₹160 · Atta 2kg ₹100\n- Toor dal 500g ₹70 · Moong dal 500g ₹80\n\n### 🧀 Proteins (₹400-500)\n- Eggs 12 pcs ₹80 · Paneer 250g ₹120 · Curd 500g ₹60\n- Chicken 500g ₹160 · Milk 2L ₹80\n\n💡 **Save 30-40%:** Buy vegetables from your local sabzi mandi!`;
    }

    if (q.includes('tip') || q.includes('trick') || q.includes('advice')) {
      return `## 💡 Pro Indian Cooking Tips\n\n### 🔥 Heat Management\n- Low and slow for dal — develops richer flavour\n- High heat for stir-fries — keeps veggies crisp\n- Always preheat pan before adding oil\n\n### 🧂 Seasoning Secrets\n- Add garam masala at the END, not beginning\n- Kasuri methi (dried fenugreek) elevates any curry instantly\n- Balance salt with a pinch of sugar in tomato-based curries\n\n### ⏰ Time-Saving Hacks\n- Meal prep dals and rice on Sunday in bulk\n- Freeze ginger-garlic paste in ice cube trays\n- Keep boiled eggs in fridge for instant protein\n\n### ❌ Beginner Mistakes to Avoid\n- Never add wet ingredients to very hot oil (splatter!)\n- Don't crowd the pan — it steams instead of sautés\n- Always taste before serving!`;
    }

    return `## 🤖 HomeHub AI Chef — Namaste! 🙏\n\nI'm your built-in kitchen assistant. Here's what I can help you with:\n\n### 🍽️ Full Recipes (just ask!)\nDal Tadka · Paneer Butter Masala · Chicken Biryani · Poha\nEgg Bhurji · Khichdi · Rajma · Palak Paneer · Upma · Chole Bhature\n\n### 📅 Meal Plans\n- *"7 day meal plan for weight loss"*\n- *"High protein 7 day plan for gym"*\n- *"Diabetic-friendly weekly diet"*\n\n### 🥗 Nutrition & More\n- *"Nutrition info for paneer"*\n- *"What can I cook today?"* — from your pantry\n- *"Budget grocery list for the week"*\n- *"Quick 15 minute dinner ideas"*\n- *"Healthy breakfast ideas"*\n- *"Pro cooking tips"*\n\nJust ask naturally — I understand plain English! 😊`;
  }
};

const QUICK_PROMPTS = [
  {label:"What can I cook today?",  icon:"🍳", prompt:"What can I cook today from my pantry?"},
  {label:"Weight loss meal plan",    icon:"⚖️", prompt:"Give me a 7-day meal plan for weight loss"},
  {label:"High protein plan",        icon:"💪", prompt:"7-day high protein meal plan for gym"},
  {label:"Diabetic meal plan",       icon:"🩺", prompt:"7-day diabetic-friendly meal plan"},
  {label:"Quick 15-min dinners",     icon:"⏱️", prompt:"Quick 15 minute dinner ideas"},
  {label:"Budget grocery list",      icon:"💰", prompt:"Create a budget grocery list under ₹2000"},
  {label:"Breakfast ideas",          icon:"🌅", prompt:"Give me 5 healthy breakfast ideas"},
  {label:"Dal Tadka recipe",         icon:"🫘", prompt:"How do I make dal tadka?"},
  {label:"Weight loss guide",        icon:"📊", prompt:"Complete weight loss guide for Indian diet"},
  {label:"Diabetic friendly meals",  icon:"🩺", prompt:"Best diabetic friendly Indian meals"},
  {label:"Paneer recipes",           icon:"🧀", prompt:"Give me the best paneer butter masala recipe"},
  {label:"Biryani recipe",           icon:"🍛", prompt:"How do I make chicken biryani step by step?"},
  {label:"Cooking tips",             icon:"💡", prompt:"Give me pro cooking tips and tricks"},
];

function formatMessage(c) {
  if (!c) return "";
  return c
    .replace(/\*\*(.*?)\*\*/g,'<strong style="font-weight:800;color:#1a1410">$1</strong>')
    .replace(/^### (.+)$/gm,'<div style="font-size:13px;font-weight:800;color:#ff6b2b;margin:12px 0 5px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid rgba(255,107,43,0.12);padding-bottom:3px">$1</div>')
    .replace(/^## (.+)$/gm,'<div style="font-size:17px;font-weight:900;color:#1a1410;margin:14px 0 7px;font-family:\'Playfair Display\',serif">$1</div>')
    .replace(/^\| (.+) \|$/gm,'').replace(/^\|---.*$/gm,'')
    .replace(/^(\d+)\. \*\*(.+?)\*\*(.*)$/gm,'<div style="display:flex;gap:10px;margin:7px 0;align-items:flex-start"><span style="background:linear-gradient(135deg,#ff6b2b,#ff8c54);color:white;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:11px;flex-shrink:0">$1</span><div><strong style="color:#1a1410">$2</strong>$3</div></div>')
    .replace(/^(\d+)\. (.+)$/gm,'<div style="display:flex;gap:10px;margin:5px 0;align-items:flex-start"><span style="background:rgba(255,107,43,0.12);color:#ff6b2b;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;flex-shrink:0">$1</span><span>$2</span></div>')
    .replace(/^[•\-] \*\*(.+?)\*\*(.*)$/gm,'<div style="display:flex;gap:8px;margin:5px 0"><span style="color:#ff6b2b;font-weight:700">▸</span><div><strong style="color:#1a1410">$1</strong>$2</div></div>')
    .replace(/^[•\-] (.+)$/gm,'<div style="display:flex;gap:8px;margin:4px 0"><span style="color:#ff6b2b">•</span><span>$1</span></div>')
    .replace(/`([^`]+)`/g,'<code style="background:rgba(255,107,43,0.08);padding:1px 6px;border-radius:4px;font-family:monospace;font-size:12px;color:#c2410c">$1</code>')
    .replace(/\n\n/g,'<div style="height:8px"/>').replace(/\n/g,'<br/>');
}

const timeStr = d => new Date(d).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});

export default function AIChat() {
  const [messages, setMessages] = useState([{
    id:1, role:"assistant",
    content:`## 🤖 HomeHub AI Kitchen Chef\n\nNamaste! 🙏 I'm your **AI Chef** — 100% built-in, works offline!\n\n**I can help with:**\n• **Full recipes** with ingredients & step-by-step instructions\n• **7-day meal plans** — weight loss, high protein, diabetic\n• **Nutrition info** for all common Indian foods\n• **Budget grocery lists** for the week\n• **Quick dinner ideas** in 15 minutes or less\n\n👇 **Try the Quick Ask buttons or ask me anything!**`,
    time:new Date(), reactions:{up:0,down:0},
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [household, setHousehold] = useState(null);
  const [pantryCtx, setPantryCtx] = useState("");
  const [pantryItems, setPantryItems] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const msgId     = useRef(2);
  const token     = localStorage.getItem("token");
  const headers   = { Authorization:`Bearer ${token}` };

  useEffect(()=>{
    axios.get(`${API}/household/myhousehold`,{headers}).then(r=>{
      setHousehold(r.data);
      axios.get(`${API}/pantry/${r.data._id}`,{headers}).then(p=>{
        const items = p.data||[];
        setPantryItems(items);
        if(items.length>0) setPantryCtx(`My pantry: ${items.map(i=>`${i.name}(${i.quantity}${i.unit||''})`).join(', ')}`);
      }).catch(()=>{});
    }).catch(()=>{});
  },[]);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  const sendMessage = useCallback(async (text)=>{
    const msg = (text||input).trim();
    if(!msg||loading) return;
    setInput("");

    const uid = msgId.current++;
    const aid = msgId.current++;
    setMessages(prev=>[...prev,{id:uid,role:"user",content:msg,time:new Date()}]);
    setLoading(true);

    // Small delay for natural feel
    await new Promise(r => setTimeout(r, 600));

    // Built-in AI — always works, no API needed
    const reply = BUILTIN_AI.process(msg, pantryCtx);

    setMessages(prev=>[...prev,{id:aid,role:"assistant",content:reply,time:new Date(),reactions:{up:0,down:0}}]);
    setLoading(false);
    setTimeout(()=>inputRef.current?.focus(),100);
  },[input,loading,pantryCtx]);

  const react=(id,type)=>setMessages(prev=>prev.map(m=>m.id===id?{...m,reactions:{...m.reactions,[type]:(m.reactions?.[type]||0)+1}}:m));
  const clearChat=()=>{
    setMessages([{id:msgId.current++,role:"assistant",content:"Chat cleared! 🧹 What would you like to cook or plan today?",time:new Date(),reactions:{up:0,down:0}}]);
  };
  const copyMsg=(id,c)=>{
    const p=c.replace(/\*{1,3}(.*?)\*{1,3}/g,"$1").replace(/^#+\s/gm,"").replace(/<[^>]+>/g,"");
    navigator.clipboard.writeText(p).then(()=>{setCopiedId(id);setTimeout(()=>setCopiedId(null),2000);});
  };

  return (
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 130px)",fontFamily:"'Plus Jakarta Sans',sans-serif",gap:12,overflow:"hidden",position:"relative"}}>

      {/* ── HERO — fixed height, no overflow ── */}
      <div style={{position:"relative",borderRadius:20,overflow:"hidden",height:110,flexShrink:0,boxShadow:"0 8px 32px rgba(0,0,0,0.15)"}}>
        <img src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80" alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(26,20,16,0.92),rgba(26,20,16,0.5))"}}/>
        <div style={{position:"relative",zIndex:2,padding:"16px 28px",height:"100%",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(45,122,79,0.3)",border:"1px solid rgba(45,122,79,0.5)",color:"#a5d6a7",borderRadius:50,padding:"3px 12px",fontSize:11,fontWeight:700,marginBottom:6}}>
              🧠 Smart AI Mode — Built-in & Offline
            </div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:800,color:"white",margin:"0 0 2px"}}>AI Kitchen Assistant</h1>
            <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:0}}>Recipes, meal plans, nutrition & cooking advice</p>
          </div>
          <div style={{textAlign:"right",fontSize:11,color:"rgba(255,255,255,0.45)"}}>
            {pantryCtx ? `🫙 ${pantryItems.length} pantry items loaded` : "Add items to your pantry for personalised recipes"}
          </div>
        </div>
      </div>

      {/* ── MAIN GRID — sidebar + chat, no overlap ── */}
      <div style={{display:"grid",gridTemplateColumns:"min(210px,30%) 1fr",gap:12,flex:1,minHeight:0,overflow:"hidden",position:"relative"}}>

        {/* Sidebar */}
        <div style={{background:"white",borderRadius:16,padding:12,boxShadow:"0 4px 20px rgba(139,94,60,0.08)",overflowY:"auto",display:"flex",flexDirection:"column",gap:5,minWidth:0,position:"relative",zIndex:1}}>
          <div style={{fontWeight:800,fontSize:13,color:"#1a1410",marginBottom:4}}>✨ Quick Ask</div>
          {QUICK_PROMPTS.map((q,i)=>(
            <button key={i} onClick={()=>sendMessage(q.prompt)} disabled={loading}
              style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:"rgba(139,94,60,0.04)",border:"1px solid rgba(139,94,60,0.1)",borderRadius:10,cursor:"pointer",textAlign:"left",width:"100%",opacity:loading?0.5:1,transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,107,43,0.08)";e.currentTarget.style.borderColor="rgba(255,107,43,0.2)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(139,94,60,0.04)";e.currentTarget.style.borderColor="rgba(139,94,60,0.1)";}}>
              <span style={{fontSize:14,flexShrink:0}}>{q.icon}</span>
              <span style={{flex:1,fontSize:11,fontWeight:600,color:"#1a1410",lineHeight:1.3}}>{q.label}</span>
              <span style={{width:6,height:6,borderRadius:"50%",background:"#ff6b2b",flexShrink:0,opacity:0.5}}/>
            </button>
          ))}
          <div style={{marginTop:8,background:"rgba(45,122,79,0.05)",border:"1px solid rgba(45,122,79,0.15)",borderRadius:12,padding:10}}>
            <div style={{fontSize:11,fontWeight:700,color:"#2d7a4f",marginBottom:3}}>🧠 Smart AI Mode</div>
            <div style={{fontSize:10,color:"#5c7a60",lineHeight:1.5}}>
              Built-in AI with {Object.keys(BUILTIN_AI.recipes).length} recipes, 3 meal plan types & nutrition data. Works offline!
            </div>
          </div>
        </div>

        {/* Chat panel */}
        <div style={{display:"flex",flexDirection:"column",background:"white",borderRadius:16,overflow:"hidden",boxShadow:"0 4px 20px rgba(139,94,60,0.08)",minHeight:0,minWidth:0,position:"relative",zIndex:2}}>
          {/* Chat header */}
          <div style={{padding:"10px 16px",borderBottom:"1px solid rgba(139,94,60,0.07)",display:"flex",justifyContent:"space-between",alignItems:"center",background:"linear-gradient(135deg,#fffaf5,white)",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🤖</div>
              <div>
                <div style={{fontWeight:700,fontSize:13,color:"#1a1410"}}>HomeHub AI Chef</div>
                <div style={{fontSize:10,color:loading?"#ff6b2b":"#2d7a4f",fontWeight:600,display:"flex",alignItems:"center",gap:4}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:loading?"#ff6b2b":"#2d7a4f",display:"inline-block"}}/>
                  {loading?"Cooking up an answer…":"Smart AI Mode 🧠"}
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontSize:11,color:"#9c8672"}}>{messages.filter(m=>m.role==="user").length} messages</span>
              <button onClick={clearChat} style={{padding:"5px 10px",borderRadius:8,border:"1px solid rgba(139,94,60,0.15)",background:"rgba(139,94,60,0.04)",color:"#9c8672",fontSize:11,fontWeight:700,cursor:"pointer"}}>🧹 Clear</button>
            </div>
          </div>

          {/* Messages — scrollable */}
          <div style={{flex:1,overflowY:"auto",padding:"14px 16px",display:"flex",flexDirection:"column",gap:14}}>
            {messages.map(msg=>(
              <div key={msg.id} style={{display:"flex",gap:10,alignItems:"flex-end",flexDirection:msg.role==="user"?"row-reverse":"row"}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:msg.role==="user"?"linear-gradient(135deg,#ff6b2b,#ff8c54)":"linear-gradient(135deg,#1a1410,#3d2c1e)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>
                  {msg.role==="user"?"👤":"🤖"}
                </div>
                <div style={{maxWidth:"80%",display:"flex",flexDirection:"column",alignItems:msg.role==="user"?"flex-end":"flex-start",gap:4,minWidth:0}}>
                  <div style={{padding:"12px 16px",borderRadius:msg.role==="user"?"20px 20px 4px 20px":"20px 20px 20px 4px",background:msg.role==="user"?"linear-gradient(135deg,#ff6b2b,#ff8c54)":"white",color:msg.role==="user"?"white":"#1a1410",border:msg.role==="assistant"?"1px solid rgba(139,94,60,0.08)":"none",boxShadow:msg.role==="user"?"0 4px 16px rgba(255,107,43,0.3)":"0 2px 12px rgba(139,94,60,0.06)"}}>
                    <div style={{fontSize:14,lineHeight:1.75,wordBreak:"break-word",overflowWrap:"break-word",minWidth:0}} dangerouslySetInnerHTML={{__html:formatMessage(msg.content)}}/>
                    <div style={{fontSize:10,marginTop:8,color:msg.role==="user"?"rgba(255,255,255,0.65)":"#b0a090"}}>{timeStr(msg.time)}</div>
                  </div>
                  {msg.role==="assistant"&&(
                    <div style={{display:"flex",gap:5,paddingLeft:4,flexWrap:"wrap"}}>
                      <button onClick={()=>copyMsg(msg.id,msg.content)} style={{padding:"3px 8px",borderRadius:7,border:"1px solid rgba(139,94,60,0.12)",background:"rgba(139,94,60,0.04)",color:"#9c8672",fontSize:10,fontWeight:600,cursor:"pointer"}}>{copiedId===msg.id?"✓ Copied!":"📋 Copy"}</button>
                      <button onClick={()=>react(msg.id,"up")} style={{padding:"3px 8px",borderRadius:7,border:"1px solid rgba(139,94,60,0.12)",background:"rgba(139,94,60,0.04)",color:"#9c8672",fontSize:10,fontWeight:600,cursor:"pointer"}}>👍{msg.reactions?.up>0?` ${msg.reactions.up}`:""}</button>
                      <button onClick={()=>react(msg.id,"down")} style={{padding:"3px 8px",borderRadius:7,border:"1px solid rgba(139,94,60,0.12)",background:"rgba(139,94,60,0.04)",color:"#9c8672",fontSize:10,fontWeight:600,cursor:"pointer"}}>👎{msg.reactions?.down>0?` ${msg.reactions.down}`:""}</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading&&(
              <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#1a1410,#3d2c1e)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🤖</div>
                <div style={{padding:"14px 18px",borderRadius:"20px 20px 20px 4px",background:"white",border:"1px solid rgba(139,94,60,0.08)"}}>
                  <div style={{display:"flex",gap:5,alignItems:"center"}}>
                    {[0,1,2].map(i=><span key={i} style={{width:8,height:8,borderRadius:"50%",background:"rgba(255,107,43,0.45)",display:"inline-block",animation:`bounce 1.2s infinite ${i*0.15}s`}}/>)}
                    <span style={{fontSize:11,color:"#9c8672",marginLeft:6}}>Cooking up an answer…</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input area — always at bottom */}
          <div style={{padding:"10px 16px",borderTop:"1px solid rgba(139,94,60,0.07)",flexShrink:0,background:"white"}}>
            <div style={{display:"flex",gap:10}}>
              <input ref={inputRef} value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),sendMessage())}
                placeholder="Ask about recipes, meal plans, nutrition, groceries…"
                disabled={loading}
                style={{flex:1,padding:"12px 16px",border:"1.5px solid rgba(139,94,60,0.15)",borderRadius:50,fontSize:13,background:"#fdf8f3",color:"#1a1410",outline:"none"}}/>
              <button onClick={()=>sendMessage()} disabled={loading||!input.trim()}
                style={{padding:"12px 22px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",border:"none",borderRadius:50,fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px rgba(255,107,43,0.3)",opacity:(loading||!input.trim())?0.5:1,whiteSpace:"nowrap",transition:"all 0.2s"}}>
                {loading?"…":"Send ↑"}
              </button>
            </div>
            <div style={{fontSize:10,color:"#b0a090",marginTop:6}}>Enter to send · Built-in AI works offline</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
        input:focus{outline:none!important;}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(139,94,60,0.15);border-radius:2px}
      `}</style>
    </div>
  );
}