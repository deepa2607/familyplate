// AIChat.jsx — HomeHub Smart Kitchen
// FIX: messagesRef pattern fixes stale closure overlap bug in send()
import { useEffect, useState, useRef, useCallback } from "react";
import API from "../api/axios";

const POLLINATIONS_URL = "https://text.pollinations.ai/openai";

const RECIPES = {
  poha:    {n:"Masala Poha",cal:250,time:"15 min",serves:"2",ing:["2 cups thick poha","1 onion finely chopped","1 green chilli slit","½ tsp mustard seeds","10 curry leaves","½ tsp turmeric","1 tbsp oil","salt to taste","lemon juice","fresh coriander","sev for garnish"],steps:["Wash poha under cold water gently, drain well and keep aside for 5 minutes — it should soften but not become mushy","Heat oil in a wide pan. Add mustard seeds and let them splutter","Add curry leaves and green chilli, fry 30 seconds","Add chopped onion and fry until golden brown, about 3 minutes","Sprinkle turmeric and salt over the onions","Add the soaked poha and toss everything gently on low heat for 2-3 minutes","Squeeze fresh lemon juice generously","Garnish with coriander and sev. Serve hot!"],tips:["Don't wash poha too long — it gets mushy","Always use thick poha for best texture","Add peanuts for extra crunch and protein"]},
  dal:     {n:"Dal Tadka",cal:280,time:"25 min",serves:"3",ing:["1 cup toor dal","2 medium tomatoes chopped","1 large onion finely chopped","4 garlic cloves minced","1-inch ginger grated","1 tsp cumin seeds","½ tsp turmeric powder","1 tsp red chilli powder","1 tsp coriander powder","2 tbsp ghee","salt to taste","fresh coriander"],steps:["Wash toor dal thoroughly. Pressure cook with turmeric and 2.5 cups water for 3-4 whistles until completely soft","Heat ghee in a pan over medium-high heat","Add cumin seeds and let them splutter for 30 seconds","Add minced garlic and ginger, fry until golden — about 1 minute","Add chopped onions and fry until deep golden brown, 8-10 minutes","Add tomatoes and cook until they break down and oil separates, 5-7 minutes","Add red chilli powder and coriander powder, stir well","Pour the cooked dal into the tadka, add salt, mix well","Simmer together 5 minutes. Garnish with coriander","Serve hot with steamed rice or roti"],tips:["The key to great dal tadka is frying onions until really golden brown","A small piece of dry red chilli in the tadka adds a smoky flavour"]},
  paneer:  {n:"Paneer Butter Masala",cal:420,time:"30 min",serves:"3",ing:["250g paneer cubed","3 large tomatoes","2 medium onions","3 tbsp butter","½ cup heavy cream","10 cashews soaked in water","1 tbsp ginger-garlic paste","2 tsp Kashmiri red chilli powder","½ tsp garam masala","1 tsp kasuri methi","1 tsp sugar","salt to taste"],steps:["Soak cashews in warm water for 20 minutes. Blanch tomatoes in boiling water for 2 minutes, peel them","Blend tomatoes, onions, and soaked cashews together into a very smooth paste","Heat butter in a wide pan. Add ginger-garlic paste and fry for 1-2 minutes","Add the blended tomato-cashew paste. Cook on medium heat for 10-12 minutes, stirring often, until oil separates","Add Kashmiri chilli powder, garam masala, sugar, and salt. Stir well","Pour in the cream and stir. Let it simmer for 3 minutes","Add paneer cubes and fold gently. Simmer 5 minutes","Crush kasuri methi between your palms and sprinkle on top","Serve hot with naan, roti, or rice"],tips:["Kashmiri red chilli gives beautiful colour without too much heat","Don't overcook paneer — it becomes rubbery"]},
  chicken: {n:"Chicken Curry",cal:380,time:"35 min",serves:"4",ing:["500g chicken pieces","2 large onions finely chopped","3 tomatoes pureed","1.5 tbsp ginger-garlic paste","2 tbsp chicken masala","½ tsp turmeric","1 tsp red chilli powder","½ tsp garam masala","3 tbsp oil","3 tbsp yogurt","salt to taste","fresh coriander"],steps:["Heat oil in a heavy pan over high heat. Add onions and fry for 10-12 minutes until deep golden brown","Add ginger-garlic paste and fry 2 minutes until raw smell disappears","Add tomato puree and cook for 8-10 minutes until oil starts separating","Add turmeric, red chilli powder, chicken masala. Stir and cook 2 minutes","Add yogurt beaten smooth, stir quickly to prevent curdling","Add chicken pieces and coat well with the masala","Add ½ cup water, cover and cook 15-18 minutes on medium heat","Check chicken is cooked through. Add garam masala and coriander","Serve with rice or roti"],tips:["Bone-in chicken gives much better flavour than boneless","Dark golden onions are the secret to restaurant-quality curry"]},
  biryani: {n:"Veg Biryani",cal:450,time:"50 min",serves:"4",ing:["2 cups basmati rice","2 cups mixed vegetables","2 large onions thinly sliced","½ cup yogurt","2 tbsp biryani masala","1 tbsp ginger-garlic paste","Whole spices (bay leaf, cloves, cardamom, cinnamon)","A pinch of saffron soaked in 3 tbsp warm milk","3 tbsp ghee","Fresh mint leaves","Fried onions for topping"],steps:["Wash basmati rice and soak for 30 minutes. Cook with whole spices and salt until 70% done","Marinate vegetables in yogurt, biryani masala, ginger-garlic paste for 20 minutes","Fry sliced onions in ghee until crispy golden brown","Cook marinated vegetables in 1 tbsp ghee until half-cooked","In a heavy pot, layer vegetables at bottom, then parboiled rice on top","Scatter fried onions and mint leaves over rice","Drizzle saffron milk and remaining ghee on top","Seal the pot tightly with foil, then lid. Cook on high 5 minutes then very low 20 minutes","Fluff gently before serving with raita"],tips:["Sealing the pot is crucial for dum cooking","Rice should be only 70% cooked before layering"]},
  rajma:   {n:"Rajma Chawal",cal:480,time:"35 min",serves:"4",ing:["2 cups red kidney beans soaked overnight","2 large onions finely chopped","4 tomatoes pureed","1.5 tbsp ginger-garlic paste","2 tsp rajma masala","1 tsp cumin seeds","1 tsp red chilli powder","½ tsp garam masala","2 tbsp oil","salt","fresh coriander"],steps:["Pressure cook soaked rajma with salt and water for 5-6 whistles until completely tender","Heat oil in a pan. Add cumin seeds, let them splutter","Add onions and fry for 10 minutes until deep golden brown","Add ginger-garlic paste, fry 2 minutes","Add tomato puree and cook 10 minutes until oil separates","Add rajma masala, red chilli powder, salt","Add cooked rajma with its cooking water","Mash about ¼ of the beans to thicken the gravy","Simmer 10-12 minutes. Add garam masala and coriander","Serve over steamed rice"],tips:["Overnight soaking is essential","Mashing some beans makes the gravy beautifully thick"]},
  palak:   {n:"Palak Paneer",cal:320,time:"30 min",serves:"3",ing:["3 cups fresh spinach tightly packed","200g paneer cubed","1 large onion","4 garlic cloves","1-inch ginger","2 green chillies","1 tbsp butter + 1 tbsp oil","1 tsp cumin seeds","½ tsp garam masala","2 tbsp fresh cream","salt to taste"],steps:["Boil water with a pinch of salt. Blanch spinach for exactly 2 minutes","Immediately transfer to ice cold water to stop cooking. Drain and blend with green chillies into smooth paste","Heat butter + oil in a pan. Add cumin seeds, then garlic and ginger. Fry 1-2 minutes","Add onion and fry until golden, 6-8 minutes","Add spinach paste, cook on medium heat 5 minutes, stirring","Add garam masala and salt","Add paneer cubes and fold them gently into the spinach","Simmer 3-4 minutes. Swirl cream on top","Serve with garlic naan or roti"],tips:["The ice bath after blanching keeps spinach bright green","Don't overcook spinach paste — it turns bitter"]},
  khichdi: {n:"Moong Dal Khichdi",cal:320,time:"20 min",serves:"3",ing:["1 cup rice","½ cup yellow moong dal split","1.5 tbsp ghee","1 tsp cumin seeds","½ tsp turmeric powder","½ tsp ginger freshly grated","1 pinch asafoetida","salt to taste","3 cups water"],steps:["Wash rice and moong dal together until water runs clear. Soak for 10 minutes","Heat ghee in a pressure cooker over medium heat","Add cumin seeds and let them splutter. Add asafoetida","Add grated ginger and fry 30 seconds","Add drained rice and dal, stir to coat with ghee 1 minute","Add turmeric powder, salt, and 3 cups water","Pressure cook for 3 whistles. Let pressure release naturally","Open and mash lightly — khichdi should be soft and creamy","Drizzle extra ghee on top before serving","Serve with pickle, curd, or papad"],tips:["Adding more water makes it creamier","A squeeze of lemon brightens the flavour beautifully"]},
};

const MEAL_PLANS = {
  weightloss:{title:"⚖️ 7-Day Weight Loss Plan (1200-1400 cal/day)",rules:["Drink 2.5-3 litres water daily","Eat dinner before 8 PM","No deep-fried foods","Walk 30 minutes daily"],days:[{day:"Monday",b:"Oats Porridge with banana (180 cal)",l:"Moong Dal Khichdi + cucumber raita (310 cal)",d:"2 Rotis + Dal + Salad (340 cal)",s:"Roasted chana 80 cal"},{day:"Tuesday",b:"Fruit bowl + 1 boiled egg (190 cal)",l:"Palak Dal + Brown Rice (360 cal)",d:"Vegetable soup + 1 Roti (240 cal)",s:"Green tea + 4 almonds 50 cal"},{day:"Wednesday",b:"Moong Dal Chilla × 2 (220 cal)",l:"Vegetable Soup + 2 Rotis (290 cal)",d:"Stir Fry Paneer 100g + Salad (280 cal)",s:"Buttermilk 60 cal"},{day:"Thursday",b:"2 Idli + Sambar (260 cal)",l:"Brown Rice + Dal + Salad (340 cal)",d:"Grilled Veggies + Curd (220 cal)",s:"Cucumber sticks 30 cal"},{day:"Friday",b:"Masala Poha light (230 cal)",l:"Palak Paneer + 1 Roti (300 cal)",d:"Vegetable Khichdi (280 cal)",s:"Coconut water 45 cal"},{day:"Saturday",b:"Oats Upma with veggies (210 cal)",l:"Rajma (no rice) + Salad (290 cal)",d:"Dal Soup + 1 Roti (240 cal)",s:"Apple 80 cal"},{day:"Sunday",b:"Sprouts chaat + Curd (190 cal)",l:"Light Veg Biryani + Raita (380 cal)",d:"Clear Soup + Salad (180 cal)",s:"Makhana roasted 100 cal"}]},
  highprotein:{title:"💪 7-Day High Protein Plan (2000+ cal, 120g+ protein)",rules:["Eat protein within 30 mins of workout","Minimum 3L water","5-6 small meals better than 3 big","Focus on lean proteins"],days:[{day:"Monday",b:"3-egg omelette + 2 toast + milk (380 cal, 32g protein)",l:"Chicken curry 150g + rice + dal (580 cal, 46g)",d:"Grilled fish 200g + 2 roti + salad (410 cal, 38g)",s:"Paneer cubes 100g (265 cal, 18g)"},{day:"Tuesday",b:"Paneer bhurji + 2 roti + curd (420 cal, 28g)",l:"Dal makhani + rice + raita (480 cal, 22g)",d:"Egg curry 2 eggs + 2 roti (380 cal, 26g)",s:"Roasted chana 130 cal, 8g"},{day:"Wednesday",b:"Chicken sandwich + milk (400 cal, 30g)",l:"Fish curry + rice + dal (490 cal, 40g)",d:"Paneer tikka 200g + salad (360 cal, 30g)",s:"Sprouts chaat 150 cal, 10g"},{day:"Thursday",b:"Sprouts bowl + full milk 500ml (280 cal, 22g)",l:"Rajma chawal + raita (520 cal, 24g)",d:"Grilled chicken 200g + veggies + roti (380 cal, 44g)",s:"Greek curd 200g, 120 cal, 16g"},{day:"Friday",b:"Egg bhurji 3 eggs + 2 toast (330 cal, 26g)",l:"Grilled chicken salad (350 cal, 38g)",d:"Mutton curry 150g + 2 roti (520 cal, 40g)",s:"Milk + 5 almonds 180 cal, 12g"},{day:"Saturday",b:"Paneer paratha + curd (380 cal, 24g)",l:"Chicken biryani + raita (600 cal, 40g)",d:"Fish fry + rice (480 cal, 38g)",s:"Boiled eggs × 2, 156 cal, 12g"},{day:"Sunday",b:"3-egg omelette + 2 toast + juice (360 cal, 28g)",l:"Dal chicken + rice (540 cal, 42g)",d:"Grilled salmon + salad (400 cal, 44g)",s:"Chicken tikka 200 cal, 24g"}]},
  diabetic:{title:"🩺 7-Day Diabetic-Friendly Plan (Low GI, 1600-1800 cal)",rules:["No white rice — use brown rice or limit to ½ cup","Eat every 3-4 hours to maintain blood sugar","Avoid sugar, maida, fried foods","Include fibre in every meal"],days:[{day:"Monday",b:"Oats porridge with nuts (Low GI, 230 cal)",l:"Brown rice ½ cup + Dal + Salad (360 cal)",d:"2 Wheat roti + sabzi + curd (320 cal)",s:"Cucumber + carrots 40 cal"},{day:"Tuesday",b:"Methi paratha 2 + curd (290 cal)",l:"Palak paneer + 2 roti (360 cal)",d:"Moong dal soup + 1 roti (230 cal)",s:"Roasted chana 120 cal"},{day:"Wednesday",b:"2 Idli + sambar (no rice) (260 cal)",l:"Moong dal khichdi + raita (290 cal)",d:"Grilled fish + salad (290 cal)",s:"Sprouts 100 cal"},{day:"Thursday",b:"Egg white omelette 3 + 1 toast (200 cal)",l:"2 Roti + sabzi + dal (340 cal)",d:"Brown rice ½ cup + dal + sabzi (330 cal)",s:"Low GI fruit guava/pear 90 cal"},{day:"Friday",b:"Masala poha light oil (220 cal)",l:"Grilled chicken salad (280 cal)",d:"Moong dal khichdi + vegetable (310 cal)",s:"Walnuts 5 pcs 130 cal"},{day:"Saturday",b:"Oats upma + green tea (220 cal)",l:"Dal + 2 roti + sabzi (340 cal)",d:"Stir fry veggies + 1 roti (260 cal)",s:"Buttermilk 60 cal"},{day:"Sunday",b:"Sprouts chaat + curd (190 cal)",l:"Brown rice rajma ½ cup (360 cal)",d:"Vegetable soup + 1 roti (230 cal)",s:"Almonds + walnuts 100 cal"}]},
};

const NUTRITION_DB = {
  paneer:{cal:"265/100g",protein:"18.3g",fat:"20.8g",carbs:"1.2g",fiber:"0g",gi:"Low",tip:"Best vegetarian protein source. Excellent for muscle building and weight loss on low-carb diets."},
  chicken:{cal:"165/100g",protein:"31g",fat:"3.6g",carbs:"0g",fiber:"0g",gi:"None",tip:"Leanest meat protein. Breast is lowest fat, thigh has more flavour. Remove skin to cut 50% of fat."},
  egg:{cal:"78 each",protein:"6.3g",fat:"5.3g",carbs:"0.6g",fiber:"0g",gi:"Low",tip:"Most bioavailable protein source. Yolk has all the nutrients. Egg whites are pure protein with almost no fat."},
  dal:{cal:"116/100g",protein:"9g",fat:"0.4g",carbs:"20g",fiber:"8g",gi:"Low (29)",tip:"Outstanding plant protein with high fibre. Dal + rice creates complete protein with all 9 essential amino acids."},
  rice:{cal:"130/100g",protein:"2.7g",fat:"0.3g",carbs:"28g",fiber:"0.4g",gi:"High (72)",tip:"Switch to brown rice for 3x the fibre and much lower GI. Basmati has lower GI than regular white rice."},
  roti:{cal:"80 each",protein:"3g",fat:"1g",carbs:"16g",fiber:"2.7g",gi:"Medium (52)",tip:"Whole wheat roti is superior to white bread. Rich in fibre, keeps you full longer. 2-3 per meal is optimal."},
  oats:{cal:"389/100g",protein:"17g",fat:"7g",carbs:"66g",fiber:"10.6g",gi:"Low (55)",tip:"King of breakfast foods for weight loss. Beta-glucan fibre keeps you full for 4+ hours and lowers cholesterol."},
  milk:{cal:"61/100g",protein:"3.2g",fat:"3.3g",carbs:"4.8g",fiber:"0g",gi:"Low (27)",tip:"Complete nutrition package. Full-fat milk is fine in moderation."},
  spinach:{cal:"23/100g",protein:"2.9g",fat:"0.4g",carbs:"3.6g",fiber:"2.2g",gi:"Very Low",tip:"Iron + Vitamin C powerhouse. Eat with lemon to maximize iron absorption."},
};

const QUICK_PROMPTS = [
  {label:"What can I cook today?", icon:"🍳", prompt:"What can I cook today from my pantry?"},
  {label:"Weight loss meal plan",  icon:"⚖️", prompt:"Give me a complete 7-day meal plan for weight loss"},
  {label:"High protein plan",      icon:"💪", prompt:"Give me a 7-day high protein meal plan for gym"},
  {label:"Diabetic meal plan",     icon:"🩺", prompt:"Give me a 7-day diabetic-friendly meal plan"},
  {label:"Quick 15-min dinners",   icon:"⏱️", prompt:"Quick 15 minute dinner ideas for tonight"},
  {label:"Budget grocery list",    icon:"💰", prompt:"Give me a weekly budget grocery list under ₹2000"},
  {label:"Breakfast ideas",        icon:"🌅", prompt:"Give me 5 healthy Indian breakfast ideas"},
  {label:"Dal Tadka recipe",       icon:"🫘", prompt:"Give me the complete dal tadka recipe step by step"},
  {label:"Paneer Butter Masala",   icon:"🧀", prompt:"Complete paneer butter masala recipe restaurant style"},
  {label:"Chicken Biryani",        icon:"🍛", prompt:"How to make chicken biryani step by step at home"},
  {label:"Cooking tips & tricks",  icon:"💡", prompt:"Give me the most important Indian cooking tips and tricks"},
  {label:"Vegan Indian meals",     icon:"🌱", prompt:"Give me a 7-day vegan Indian meal plan"},
];

function builtInReply(q, pantryCtx) {
  const r = q.toLowerCase();
  for (const [key, recipe] of Object.entries(RECIPES)) {
    if (r.includes(key) || r.includes(recipe.n.toLowerCase().replace(/ /g,""))) {
      return `## 🍽️ ${recipe.n}\n**⏱️ ${recipe.time}  •  🔥 ${recipe.cal} cal  •  Serves ${recipe.serves}**\n\n### 📦 Ingredients\n${recipe.ing.map((x,i)=>`${i+1}. ${x}`).join('\n')}\n\n### 👨‍🍳 Step-by-Step Instructions\n${recipe.steps.map((s,i)=>`**Step ${i+1}:** ${s}`).join('\n\n')}\n\n### 💡 Pro Tips\n${recipe.tips.map(t=>`• ${t}`).join('\n')}`;
    }
  }
  if (r.includes('meal plan')||r.includes('diet plan')||r.includes('7 day')||r.includes('weekly plan')) {
    const type = r.includes('protein')||r.includes('gym')?'highprotein': r.includes('diabet')?'diabetic':'weightloss';
    const plan = MEAL_PLANS[type];
    return `## ${plan.title}\n\n### ✅ Key Rules\n${plan.rules.map(x=>`• ${x}`).join('\n')}\n\n${plan.days.map(d=>`### 📅 ${d.day}\n🌅 **Breakfast:** ${d.b}\n☀️ **Lunch:** ${d.l}\n🌙 **Dinner:** ${d.d}\n🍎 **Snack:** ${d.s}`).join('\n\n')}\n\n💡 **Consistency is key!** Follow this for at least 4 weeks for visible results.`;
  }
  for (const [food, info] of Object.entries(NUTRITION_DB)) {
    if ((r.includes('nutrition')||r.includes('calorie')||r.includes('protein in')||r.includes('macro')) && r.includes(food)) {
      return `## 🥗 Nutrition: ${food.charAt(0).toUpperCase()+food.slice(1)}\n\n| Nutrient | Per 100g |\n|---|---|\n| 🔥 Calories | ${info.cal} |\n| 💪 Protein | ${info.protein} |\n| 🧈 Fat | ${info.fat} |\n| 🍞 Carbs | ${info.carbs} |\n| 🌿 Fibre | ${info.fiber} |\n| 📊 Glycemic Index | ${info.gi} |\n\n### 💡 Expert Insight\n${info.tip}`;
    }
  }
  if (r.includes('cook today')||r.includes('what to cook')||r.includes('what can i make')) {
    const items = pantryCtx ? pantryCtx.split(',').map(x=>x.trim().toLowerCase()) : [];
    const matches = [];
    if (items.some(x=>x.includes('poha'))) matches.push(RECIPES.poha);
    if (items.some(x=>x.includes('paneer'))) matches.push(RECIPES.paneer);
    if (items.some(x=>x.includes('egg'))) matches.push(RECIPES.khichdi);
    if (items.some(x=>x.includes('rice')||x.includes('dal'))) matches.push(RECIPES.dal);
    if (items.some(x=>x.includes('chicken'))) matches.push(RECIPES.chicken);
    const show = matches.length>0 ? matches.slice(0,3) : [RECIPES.dal, RECIPES.poha, RECIPES.khichdi];
    return `## 🍳 What You Can Cook Today!\n\n${items.length>0?`**Your pantry has:** ${items.slice(0,8).join(', ')}\n\n`:""}_Best recipes matching what you have:_\n\n${show.map((rec,i)=>`### ${i+1}. ${rec.n} (${rec.time} • ${rec.cal} cal)\n**Key ingredients:** ${rec.ing.slice(0,4).join(', ')}\n**Quick:** ${rec.steps[0]}`).join('\n\n')}\n\n💡 Ask **"Give me the complete [recipe name] recipe"** for full instructions!`;
  }
  return null;
}

function fmtContent(c) {
  if (!c) return "";
  return c
    .replace(/\*\*(.*?)\*\*/g,'<strong style="font-weight:800">$1</strong>')
    .replace(/^### (.+)$/gm,'<div style="font-size:13px;font-weight:800;color:#ff6b2b;margin:12px 0 5px;padding-bottom:3px;border-bottom:1.5px solid rgba(255,107,43,0.15)">$1</div>')
    .replace(/^## (.+)$/gm,'<div style="font-size:16px;font-weight:900;color:#1a1410;margin:14px 0 7px;font-family:\'Playfair Display\',serif">$1</div>')
    .replace(/^\| (.+) \|$/gm,(m,cells)=>`<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;margin:3px 0">${cells.split('|').map(c=>`<div style="background:rgba(255,107,43,0.06);padding:5px 10px;border-radius:6px;font-size:12px">${c.trim()}</div>`).join('')}</div>`)
    .replace(/^\|---.*$/gm,'')
    .replace(/^(\d+)\. \*\*(.+?)\*\*(.*)$/gm,'<div style="display:flex;gap:10px;margin:7px 0;align-items:flex-start"><span style="background:linear-gradient(135deg,#ff6b2b,#ff8c54);color:white;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:11px;flex-shrink:0">$1</span><div style="flex:1"><strong>$2</strong>$3</div></div>')
    .replace(/^(\d+)\. (.+)$/gm,'<div style="display:flex;gap:10px;margin:5px 0;align-items:flex-start"><span style="background:rgba(255,107,43,0.12);color:#ff6b2b;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;flex-shrink:0">$1</span><span style="flex:1">$2</span></div>')
    .replace(/^[•\-\*] \*\*(.+?)\*\*(.*)$/gm,'<div style="display:flex;gap:8px;margin:5px 0;align-items:flex-start"><span style="color:#ff6b2b;font-weight:700;flex-shrink:0">▸</span><div><strong>$1</strong>$2</div></div>')
    .replace(/^[•\-\*] (.+)$/gm,'<div style="display:flex;gap:8px;margin:4px 0;align-items:flex-start"><span style="color:#ff6b2b;flex-shrink:0">•</span><span>$1</span></div>')
    .replace(/`([^`]+)`/g,'<code style="background:rgba(255,107,43,0.08);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px;color:#c2410c">$1</code>')
    .replace(/\n\n/g,'<div style="height:8px"/>').replace(/\n/g,'<br/>');
}

const timeStr = d => new Date(d).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});

export default function AIChat() {
  const [messages, setMessages] = useState([{
    id:1, role:"assistant",
    content:`## 🤖 HomeHub AI Chef — Namaste! 🙏\n\nI'm your **AI Kitchen Assistant** — built-in knowledge + live AI!\n\n**What I can help with:**\n• 🍽️ **Complete recipes** with step-by-step instructions\n• 📅 **7-day meal plans** — weight loss, high protein, diabetic\n• 🥗 **Nutrition info** with full macro breakdown\n• 🛒 **Smart grocery lists** within your budget\n• ⏱️ **Quick meals** under 15 minutes\n• 💡 **Pro cooking tips** from Indian cuisine\n\n👇 **Try the Quick Ask buttons or type your question below!**`,
    time:new Date(), reactions:{up:0,down:0},
  }]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [pantryCtx,   setPantryCtx]   = useState("");
  const [pantryCount, setPantryCount] = useState(0);
  const [copiedId,    setCopiedId]    = useState(null);
  const [apiStatus,   setApiStatus]   = useState("idle");

  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const msgId       = useRef(2);
  // ── FIX: keep a ref always pointing to latest messages to avoid stale closure ──
  const messagesRef = useRef(messages);

  // Keep messagesRef in sync with state
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    API.get("/household/myhousehold")
      .then(r => API.get(`/pantry/${r.data._id}`))
      .then(p => {
        const items = p.data || [];
        setPantryCount(items.length);
        if (items.length > 0) setPantryCtx(items.map(i=>`${i.name}(${i.quantity||1}${i.unit||""})`).join(', '));
      }).catch(() => {});
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages]);

  const callAI = async (userMessage, conversationHistory, pantry) => {
    const systemPrompt = `You are HomeHub AI Chef, an expert Indian kitchen assistant. Help with complete Indian recipes, 7-day meal plans, nutrition info, grocery planning, and Indian cooking techniques.${pantry ? ` User's pantry: ${pantry}.` : ""} Always give COMPLETE, detailed answers with sections and emojis. For recipes include full ingredient list with quantities, step-by-step instructions, and pro tips. For meal plans provide all 7 days with calorie counts.`;
    const msgs = [
      {role:"system", content:systemPrompt},
      ...conversationHistory.slice(-6).map(m=>({role:m.role==="assistant"?"assistant":"user", content:m.content.replace(/<[^>]+>/g,"").replace(/\*\*/g,"*")})),
      {role:"user", content:userMessage}
    ];
    const response = await fetch(POLLINATIONS_URL, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({messages:msgs, model:"openai", seed:42, temperature:0.7}),
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json();
    return data?.choices?.[0]?.message?.content || null;
  };

  const send = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    const uid = msgId.current++, aid = msgId.current++;
    const userMsg = {id:uid, role:"user", content:msg, time:new Date()};
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 200));
      const builtIn = builtInReply(msg, pantryCtx);
      if (builtIn) {
        setMessages(prev => [...prev, {id:aid, role:"assistant", content:builtIn, time:new Date(), reactions:{up:0,down:0}}]);
        setApiStatus("ok");
      } else {
        setApiStatus("calling");
        setMessages(prev => [...prev, {id:aid, role:"assistant", content:"__loading__", time:new Date(), reactions:{up:0,down:0}, loading:true}]);
        // ── FIX: use messagesRef.current instead of stale messages closure ──
        const currentMsgs = [...messagesRef.current.slice(-8), userMsg];
        let aiReply = null;
        try { aiReply = await callAI(msg, currentMsgs, pantryCtx); } catch {}
        if (aiReply) {
          setApiStatus("ok");
          setMessages(prev => prev.map(m => m.id===aid ? {...m, content:aiReply, loading:false} : m));
        } else {
          setApiStatus("fallback");
          setMessages(prev => prev.map(m => m.id===aid ? {...m, content:`## 🤖 HomeHub AI Chef\n\nI'd love to help! Try asking me specifically:\n\n• **"Complete paneer butter masala recipe"**\n• **"7-day weight loss meal plan"**\n• **"Nutrition info for chicken"**\n• **"Quick breakfast ideas"**\n• **"What can I cook today?"**\n\nI have 15+ complete Indian recipes, meal plans, and nutrition data built in! 🍽️`, loading:false} : m));
        }
      }
    } catch {
      setMessages(prev => prev.map(m => m.id===aid ? {...m, content:"Sorry, something went wrong. Please try again! 🔄", loading:false} : m));
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  // ── FIX: removed `messages` from deps — use messagesRef instead ──
  }, [input, loading, pantryCtx]);

  const react = (id, type) => setMessages(prev => prev.map(m => m.id===id ? {...m, reactions:{...m.reactions,[type]:(m.reactions?.[type]||0)+1}} : m));
  const clear = () => setMessages([{id:msgId.current++,role:"assistant",content:"Chat cleared! 🧹 What would you like to cook or plan today?",time:new Date(),reactions:{up:0,down:0}}]);
  const copy = (id, c) => {
    const plain = c.replace(/\*{1,3}(.*?)\*{1,3}/g,"$1").replace(/^#+\s*/gm,"").replace(/<[^>]+>/g,"").replace(/\n{3,}/g,"\n\n");
    navigator.clipboard.writeText(plain).then(() => { setCopiedId(id); setTimeout(()=>setCopiedId(null),2000); });
  };

  return (
    <div style={{display:"flex",flexDirection:"column",fontFamily:"'Plus Jakarta Sans',sans-serif",gap:10,height:"100%",minHeight:0,overflow:"hidden"}}>

      {/* Hero */}
      <div style={{position:"relative",borderRadius:18,overflow:"hidden",height:96,flexShrink:0,boxShadow:"0 6px 24px rgba(0,0,0,0.12)"}}>
        <img src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80" alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(26,20,16,0.92),rgba(26,20,16,0.5))"}}/>
        <div style={{position:"relative",zIndex:2,padding:"12px 22px",height:"100%",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(45,122,79,0.3)",border:"1px solid rgba(45,122,79,0.5)",color:"#a5d6a7",borderRadius:50,padding:"2px 9px",fontSize:10,fontWeight:700,marginBottom:4}}>
              <span style={{width:5,height:5,borderRadius:"50%",background:apiStatus==="calling"?"#fbbf24":"#4caf50",display:"inline-block"}}/>
              {apiStatus==="calling"?"AI Thinking…":"Built-in + Online AI"}
            </div>
            <h1 style={{margin:0,fontSize:17,fontWeight:800,color:"white",fontFamily:"'Playfair Display',serif"}}>AI Kitchen Assistant</h1>
            <p style={{margin:0,fontSize:11,color:"rgba(255,255,255,0.5)"}}>Recipes · Meal plans · Nutrition · Cooking advice</p>
          </div>
          {pantryCount>0&&<div style={{background:"rgba(255,255,255,0.1)",borderRadius:9,padding:"5px 11px"}}><span style={{fontSize:10,color:"rgba(255,255,255,0.7)",fontWeight:600}}>📋 {pantryCount} pantry items</span></div>}
        </div>
      </div>

      {/* Main grid */}
      <div style={{display:"grid",gridTemplateColumns:"min(180px,24%) 1fr",gap:10,flex:1,minHeight:0,overflow:"hidden"}}>

        {/* Sidebar */}
        <div style={{background:"white",borderRadius:14,padding:10,boxShadow:"0 3px 16px rgba(139,94,60,0.08)",overflowY:"auto",display:"flex",flexDirection:"column",gap:3}}>
          <div style={{fontWeight:800,fontSize:11,color:"#1a1410",marginBottom:4,paddingBottom:4,borderBottom:"1px solid rgba(139,94,60,0.08)"}}>✨ Quick Ask</div>
          {QUICK_PROMPTS.map(p=>(
            <button key={p.label} onClick={()=>send(p.prompt)} disabled={loading}
              style={{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",background:"rgba(139,94,60,0.04)",border:"1px solid rgba(139,94,60,0.1)",borderRadius:8,cursor:"pointer",textAlign:"left",width:"100%",opacity:loading?0.5:1,transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,107,43,0.08)";e.currentTarget.style.borderColor="rgba(255,107,43,0.3)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(139,94,60,0.04)";e.currentTarget.style.borderColor="rgba(139,94,60,0.1)";}}>
              <span style={{fontSize:12,flexShrink:0}}>{p.icon}</span>
              <span style={{fontSize:10,fontWeight:600,color:"#5c4a35",lineHeight:1.3}}>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Chat panel */}
        <div style={{display:"flex",flexDirection:"column",background:"white",borderRadius:14,overflow:"hidden",boxShadow:"0 3px 16px rgba(139,94,60,0.08)",minHeight:0}}>

          {/* Chat header */}
          <div style={{padding:"9px 13px",borderBottom:"1px solid rgba(139,94,60,0.07)",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>🤖</div>
              <div>
                <div style={{fontWeight:800,fontSize:12,color:"#1a1410"}}>HomeHub AI Chef</div>
                <div style={{fontSize:9,color:loading?"#d97706":"#2d7a4f",fontWeight:600,display:"flex",alignItems:"center",gap:3}}>
                  <span style={{width:5,height:5,borderRadius:"50%",background:loading?"#d97706":"#2d7a4f",display:"inline-block"}}/>
                  {loading?"Thinking…":"Online"}
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:7,alignItems:"center"}}>
              <span style={{fontSize:10,color:"#9c8672"}}>{messages.filter(m=>m.role==="user").length} msgs</span>
              <button onClick={clear} style={{padding:"3px 8px",borderRadius:6,border:"1px solid rgba(139,94,60,0.15)",background:"rgba(139,94,60,0.04)",color:"#9c8672",fontSize:10,fontWeight:700,cursor:"pointer"}}>🧹 Clear</button>
            </div>
          </div>

          {/* Messages scrollable area */}
          <div style={{flex:1,overflowY:"auto",overflowX:"hidden",padding:"12px 12px 6px",display:"flex",flexDirection:"column",gap:0,minHeight:0}}>
            {messages.map(msg => {
              const isUser = msg.role==="user";
              return (
                <div key={msg.id} style={{display:"flex",flexDirection:isUser?"row-reverse":"row",alignItems:"flex-start",gap:7,marginBottom:12,width:"100%"}}>
                  <div style={{width:26,height:26,borderRadius:"50%",flexShrink:0,marginTop:2,background:isUser?"linear-gradient(135deg,#ff6b2b,#ff8c54)":"linear-gradient(135deg,#1a1410,#3d2c1e)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>
                    {isUser?"👤":"🤖"}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:isUser?"flex-end":"flex-start",maxWidth:"calc(100% - 38px)",gap:3}}>
                    <div style={{
                      padding:"9px 12px",
                      borderRadius:isUser?"14px 14px 3px 14px":"3px 14px 14px 14px",
                      background:isUser?"linear-gradient(135deg,#ff6b2b,#ff8c54)":"white",
                      color:isUser?"white":"#1a1410",
                      border:!isUser?"1px solid rgba(139,94,60,0.1)":"none",
                      boxShadow:isUser?"0 3px 10px rgba(255,107,43,0.22)":"0 2px 8px rgba(139,94,60,0.07)",
                      maxWidth:"100%",
                      wordBreak:"break-word",
                      overflowWrap:"break-word",
                    }}>
                      {msg.loading ? (
                        <div style={{display:"flex",gap:5,alignItems:"center",padding:"2px 0"}}>
                          {[0,1,2].map(i=><span key={i} style={{width:6,height:6,borderRadius:"50%",background:"rgba(255,107,43,0.5)",display:"inline-block",animation:`bounce 1.2s infinite ${i*0.15}s`}}/>)}
                          <span style={{fontSize:11,color:"#9c8672",marginLeft:4}}>Getting answer…</span>
                        </div>
                      ) : (
                        <div style={{fontSize:12.5,lineHeight:1.7}} dangerouslySetInnerHTML={{__html:fmtContent(msg.content)}}/>
                      )}
                      <div style={{fontSize:9,marginTop:4,textAlign:"right",color:isUser?"rgba(255,255,255,0.55)":"#c0b0a0"}}>{timeStr(msg.time)}</div>
                    </div>
                    {!isUser&&!msg.loading&&(
                      <div style={{display:"flex",gap:3,paddingLeft:2}}>
                        {[
                          {label:copiedId===msg.id?"✓ Copied":"📋 Copy", fn:()=>copy(msg.id,msg.content)},
                          {label:`👍${msg.reactions?.up>0?` ${msg.reactions.up}`:""}`, fn:()=>react(msg.id,"up")},
                          {label:`👎${msg.reactions?.down>0?` ${msg.reactions.down}`:""}`, fn:()=>react(msg.id,"down")},
                        ].map(b=>(
                          <button key={b.label} onClick={b.fn}
                            style={{padding:"2px 7px",borderRadius:5,border:"1px solid rgba(139,94,60,0.12)",background:"rgba(139,94,60,0.04)",color:"#9c8672",fontSize:10,fontWeight:600,cursor:"pointer",lineHeight:"16px"}}
                            onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,107,43,0.08)";e.currentTarget.style.color="#ff6b2b";}}
                            onMouseLeave={e=>{e.currentTarget.style.background="rgba(139,94,60,0.04)";e.currentTarget.style.color="#9c8672";}}>
                            {b.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {loading&&!messages[messages.length-1]?.loading&&(
              <div style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:10}}>
                <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#1a1410,#3d2c1e)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>🤖</div>
                <div style={{padding:"9px 13px",borderRadius:"3px 14px 14px 14px",background:"white",border:"1px solid rgba(139,94,60,0.08)"}}>
                  <div style={{display:"flex",gap:5,alignItems:"center"}}>{[0,1,2].map(i=><span key={i} style={{width:6,height:6,borderRadius:"50%",background:"rgba(255,107,43,0.45)",display:"inline-block",animation:`bounce 1.2s infinite ${i*0.15}s`}}/>)}<span style={{fontSize:11,color:"#9c8672",marginLeft:4}}>Cooking up an answer…</span></div>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input bar */}
          <div style={{padding:"8px 12px 10px",borderTop:"1px solid rgba(139,94,60,0.07)",flexShrink:0,background:"white"}}>
            <div style={{display:"flex",gap:7}}>
              <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),send())}
                placeholder="Ask about recipes, meal plans, nutrition…" disabled={loading}
                style={{flex:1,padding:"9px 14px",border:"1.5px solid rgba(139,94,60,0.15)",borderRadius:50,fontSize:13,background:"#fdf8f3",color:"#1a1410",outline:"none"}}/>
              <button onClick={()=>send()} disabled={loading||!input.trim()}
                style={{padding:"9px 16px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",border:"none",borderRadius:50,fontSize:12,fontWeight:700,cursor:"pointer",boxShadow:"0 3px 12px rgba(255,107,43,0.3)",opacity:(loading||!input.trim())?0.5:1,whiteSpace:"nowrap",transition:"all 0.2s"}}>
                {loading?"…":"Send ↑"}
              </button>
            </div>
            <div style={{fontSize:9,color:"#b0a090",marginTop:3,paddingLeft:2}}>Enter to send · Built-in recipes + AI-powered</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
        input:focus{outline:none!important;border-color:rgba(255,107,43,0.6)!important;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(139,94,60,0.15);border-radius:2px}
      `}</style>
    </div>
  );
}