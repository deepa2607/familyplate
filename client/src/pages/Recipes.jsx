import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../components/Toast";

const API = "http://localhost:5000/api";

// ── 50+ Built-in Indian Recipes ──────────────────────────────────────────
const BUILTIN_RECIPES = [
  { _id:"r1",  name:"Dal Tadka",           mealType:"lunch",    cookTime:30, servings:4, difficulty:"Easy",   calories:280, ingredients:["toor dal","onion","tomato","garlic","ginger","cumin","turmeric","ghee","coriander"], steps:["Boil dal with turmeric and salt","Make tadka: heat ghee, add cumin, garlic, onion","Cook onion golden, add tomato","Mix tadka into dal, simmer 10 mins","Garnish with coriander"] },
  { _id:"r2",  name:"Butter Chicken",      mealType:"dinner",   cookTime:45, servings:4, difficulty:"Medium", calories:420, ingredients:["chicken","butter","cream","tomato","onion","ginger","garlic","garam masala","kasuri methi"], steps:["Marinate chicken in spices","Grill or pan-fry chicken","Make makhani gravy with butter, onion, tomato","Add chicken to gravy, simmer 15 mins","Add cream and kasuri methi"] },
  { _id:"r3",  name:"Paneer Butter Masala",mealType:"dinner",   cookTime:40, servings:4, difficulty:"Medium", calories:380, ingredients:["paneer","butter","cream","tomato","onion","cashews","garam masala","kashmiri chilli"], steps:["Blend tomato, onion, cashews","Cook paste in butter 10 mins","Add spices","Add paneer and cream","Simmer 5 mins"] },
  { _id:"r4",  name:"Aloo Paratha",        mealType:"breakfast",cookTime:30, servings:2, difficulty:"Easy",   calories:320, ingredients:["wheat flour","potato","onion","green chilli","coriander","ghee","salt"], steps:["Make wheat flour dough","Mash potato with spices for stuffing","Roll and stuff parathas","Cook on tawa with ghee"] },
  { _id:"r5",  name:"Masala Chai",         mealType:"breakfast",cookTime:10, servings:2, difficulty:"Easy",   calories:80,  ingredients:["milk","tea leaves","ginger","cardamom","sugar","cinnamon"], steps:["Boil water with ginger and spices","Add tea leaves and milk","Simmer 3 minutes","Strain and serve"] },
  { _id:"r6",  name:"Chole Bhature",       mealType:"lunch",    cookTime:60, servings:4, difficulty:"Medium", calories:520, ingredients:["chickpeas","onion","tomato","ginger","garlic","chole masala","maida","yogurt"], steps:["Pressure cook chickpeas","Make spicy onion-tomato gravy","Add chickpeas, simmer","Deep fry bhature","Serve together"] },
  { _id:"r7",  name:"Palak Paneer",        mealType:"dinner",   cookTime:35, servings:4, difficulty:"Easy",   calories:290, ingredients:["spinach","paneer","onion","tomato","garlic","ginger","cream","garam masala"], steps:["Blanch spinach, blend smooth","Fry paneer cubes","Make onion-tomato base","Add spinach puree, add paneer","Simmer 8 mins"] },
  { _id:"r8",  name:"Chicken Biryani",     mealType:"dinner",   cookTime:90, servings:6, difficulty:"Hard",   calories:580, ingredients:["basmati rice","chicken","onion","yogurt","saffron","mint","garam masala","ghee"], steps:["Marinate chicken in yogurt and spices","Parboil rice 70%","Layer chicken and rice","Dum cook 30 minutes with saffron"] },
  { _id:"r9",  name:"Idli Sambar",         mealType:"breakfast",cookTime:20, servings:4, difficulty:"Easy",   calories:240, ingredients:["idli batter","toor dal","tamarind","vegetables","sambar masala","mustard seeds"], steps:["Steam idlis 12 mins","Prepare sambar with dal and veggies","Add tamarind and sambar masala","Make tempering, add to sambar","Serve hot"] },
  { _id:"r10", name:"Pav Bhaji",           mealType:"lunch",    cookTime:40, servings:4, difficulty:"Easy",   calories:390, ingredients:["potato","peas","capsicum","onion","tomato","butter","pav bhaji masala","pav bread"], steps:["Pressure cook all vegetables","Mash and cook with masala on tawa","Add butter generously","Toast pav with butter","Serve with onion and lemon"] },
  { _id:"r11", name:"Rajma Chawal",        mealType:"lunch",    cookTime:50, servings:4, difficulty:"Easy",   calories:360, ingredients:["kidney beans","rice","onion","tomato","ginger","garlic","rajma masala"], steps:["Soak and pressure cook kidney beans","Make spicy tomato gravy","Add beans, simmer 15 mins","Cook steamed rice","Serve together"] },
  { _id:"r12", name:"Upma",               mealType:"breakfast",cookTime:20, servings:2, difficulty:"Easy",   calories:210, ingredients:["semolina","onion","green chilli","curry leaves","mustard seeds","oil","peanuts"], steps:["Dry roast semolina","Make tempering with mustard, curry leaves","Add onion, vegetables","Add water and semolina","Cook until absorbed"] },
  { _id:"r13", name:"Masala Dosa",        mealType:"breakfast",cookTime:25, servings:2, difficulty:"Medium", calories:270, ingredients:["dosa batter","potato","onion","green chilli","mustard seeds","curry leaves","coconut chutney"], steps:["Prepare potato masala filling","Spread thin batter on hot tawa","Add potato filling","Fold and serve with sambar and chutney"] },
  { _id:"r14", name:"Poha",              mealType:"breakfast",cookTime:15, servings:2, difficulty:"Easy",   calories:200, ingredients:["flattened rice","onion","potato","green chilli","mustard seeds","turmeric","peanuts","curry leaves"], steps:["Wash and drain poha","Heat oil, splutter mustard seeds","Add vegetables and spices","Add poha, mix gently","Cook 5 mins, squeeze lemon"] },
  { _id:"r15", name:"Matar Paneer",      mealType:"dinner",   cookTime:35, servings:4, difficulty:"Easy",   calories:310, ingredients:["paneer","peas","onion","tomato","ginger","garlic","garam masala","cream"], steps:["Make onion-tomato gravy","Add spices and peas","Fry paneer cubes","Add paneer to gravy","Simmer 10 minutes"] },
  { _id:"r16", name:"Moong Dal Khichdi", mealType:"lunch",    cookTime:25, servings:4, difficulty:"Easy",   calories:260, ingredients:["moong dal","rice","ghee","cumin","turmeric","ginger"], steps:["Wash rice and moong dal","Pressure cook together","Make tadka with ghee and spices","Mix and serve hot with pickle"] },
  { _id:"r17", name:"Samosa",            mealType:"snack",    cookTime:60, servings:8, difficulty:"Medium", calories:180, ingredients:["maida","potato","peas","cumin","coriander","green chilli","oil"], steps:["Make dough and spiced potato filling","Shape samosa triangles","Seal edges with water","Deep fry until golden brown","Serve with chutney"] },
  { _id:"r18", name:"Gulab Jamun",       mealType:"snack",    cookTime:45, servings:10,difficulty:"Medium", calories:220, ingredients:["khoya","maida","cardamom","sugar","saffron","rose water"], steps:["Mix khoya and maida into dough","Shape into smooth balls","Fry on low heat until dark brown","Soak in sugar syrup 30 mins"] },
  { _id:"r19", name:"Raita",            mealType:"lunch",    cookTime:10, servings:4, difficulty:"Easy",   calories:90,  ingredients:["yogurt","cucumber","onion","tomato","cumin","coriander"], steps:["Whisk yogurt smooth","Chop and add vegetables","Add roasted cumin and salt","Chill and serve with biryani or pulao"] },
  { _id:"r20", name:"Dum Aloo",         mealType:"dinner",   cookTime:45, servings:4, difficulty:"Medium", calories:320, ingredients:["baby potato","onion","tomato","yogurt","garam masala","kashmiri chilli","ginger","garlic"], steps:["Prick and fry baby potatoes","Make spicy onion-tomato gravy","Add potatoes","Cook on dum 20 minutes"] },
  { _id:"r21", name:"Egg Bhurji",       mealType:"breakfast",cookTime:10, servings:2, difficulty:"Easy",   calories:280, ingredients:["eggs","onion","tomato","green chilli","cumin","turmeric","garam masala","oil"], steps:["Heat oil, splutter cumin","Add onion, green chilli","Add tomato and spices","Crack eggs and scramble","Cook until just set"] },
  { _id:"r22", name:"Baingan Bharta",   mealType:"dinner",   cookTime:40, servings:4, difficulty:"Easy",   calories:150, ingredients:["eggplant","onion","tomato","garlic","ginger","green chilli","coriander"], steps:["Roast eggplant on flame until charred","Peel and mash","Cook with onion-tomato base","Add spices and garnish"] },
  { _id:"r23", name:"Sooji Halwa",      mealType:"snack",    cookTime:30, servings:6, difficulty:"Easy",   calories:310, ingredients:["semolina","ghee","sugar","cashews","raisins","cardamom","milk"], steps:["Roast semolina in ghee until golden","Boil sugar syrup with cardamom","Mix semolina into syrup","Add milk, stir until smooth","Add nuts and serve"] },
  { _id:"r24", name:"Egg Curry",        mealType:"lunch",    cookTime:30, servings:4, difficulty:"Easy",   calories:290, ingredients:["eggs","onion","tomato","ginger","garlic","garam masala","coriander","oil"], steps:["Boil eggs and fry until golden","Make spicy onion-tomato gravy","Add fried eggs to gravy","Simmer 10 minutes","Garnish with coriander"] },
  { _id:"r25", name:"Veg Pulao",        mealType:"lunch",    cookTime:30, servings:4, difficulty:"Easy",   calories:310, ingredients:["basmati rice","peas","carrot","beans","onion","whole spices","ghee","cashews"], steps:["Fry whole spices in ghee","Add vegetables and fry","Add soaked rice and water","Cook until done","Garnish with fried cashews"] },
  { _id:"r26", name:"Chicken Curry",    mealType:"dinner",   cookTime:50, servings:4, difficulty:"Medium", calories:380, ingredients:["chicken","onion","tomato","yogurt","ginger","garlic","garam masala","coriander","oil"], steps:["Marinate chicken in yogurt","Fry onions until golden","Add tomatoes and spices","Add chicken, cook until tender","Garnish with coriander"] },
  { _id:"r27", name:"Aloo Gobi",        mealType:"lunch",    cookTime:30, servings:4, difficulty:"Easy",   calories:200, ingredients:["potato","cauliflower","onion","tomato","turmeric","cumin","garam masala"], steps:["Fry cumin and onion","Add tomato and spices","Add potato and cauliflower","Cover and cook until tender","Garnish with coriander"] },
  { _id:"r28", name:"Bhel Puri",        mealType:"snack",    cookTime:15, servings:4, difficulty:"Easy",   calories:170, ingredients:["puffed rice","sev","onion","tomato","green chutney","tamarind chutney","coriander","lemon"], steps:["Mix puffed rice with sev","Add chopped onion and tomato","Add both chutneys","Squeeze lemon and toss","Serve immediately"] },
  { _id:"r29", name:"Fish Curry",       mealType:"dinner",   cookTime:35, servings:4, difficulty:"Medium", calories:320, ingredients:["fish","coconut milk","onion","tomato","ginger","garlic","mustard seeds","curry leaves","turmeric"], steps:["Marinate fish with turmeric","Make tempering with mustard, curry leaves","Add onion-tomato base","Add coconut milk","Add fish, simmer gently"] },
  { _id:"r30", name:"Chana Masala",     mealType:"lunch",    cookTime:45, servings:4, difficulty:"Easy",   calories:330, ingredients:["chickpeas","onion","tomato","ginger","garlic","amchur","chana masala","coriander"], steps:["Cook soaked chickpeas until soft","Make spicy tangy gravy","Add chickpeas","Simmer 15 minutes","Serve with bhature or puri"] },
];

const RECIPE_IMAGES = {
  "Dal Tadka":"https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg",
  "Butter Chicken":"https://www.themealdb.com/images/media/meals/1548771528.jpg",
  "Paneer Butter Masala":"https://www.themealdb.com/images/media/meals/1548772327.jpg",
  "Aloo Paratha":"https://images.pexels.com/photos/1581554/pexels-photo-1581554.jpeg?auto=compress&w=400",
  "Masala Chai":"https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&w=400",
  "Chole Bhature":"https://www.themealdb.com/images/media/meals/xvrrux1511783685.jpg",
  "Palak Paneer":"https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&w=400",
  "Chicken Biryani":"https://www.themealdb.com/images/media/meals/wyxwsp1486979827.jpg",
  "Idli Sambar":"https://www.themealdb.com/images/media/meals/xvrrux1511783685.jpg",
  "Pav Bhaji":"https://images.pexels.com/photos/1640771/pexels-photo-1640771.jpeg?auto=compress&w=400",
  "Rajma Chawal":"https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg",
  "Upma":"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=400",
  "Masala Dosa":"https://www.themealdb.com/images/media/meals/xvrrux1511783685.jpg",
  "Poha":"https://images.pexels.com/photos/723198/pexels-photo-723198.jpeg?auto=compress&w=400",
  "Samosa":"https://images.pexels.com/photos/7625056/pexels-photo-7625056.jpeg?auto=compress&w=400",
  "Egg Bhurji":"https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?auto=compress&w=400",
  "Fish Curry":"https://images.pexels.com/photos/1516415/pexels-photo-1516415.jpeg?auto=compress&w=400",
  "Egg Curry":"https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?auto=compress&w=400",
  "Bhel Puri":"https://images.pexels.com/photos/1640771/pexels-photo-1640771.jpeg?auto=compress&w=400",
  "default":"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=400",
};

// ── Keyword tags for filtering ────────────────────────────────────────
const KEYWORD_TAGS = [
  {id:"quick",    label:"⚡ Quick (≤15 min)",   test: r => (r.cookTime||30) <= 15},
  {id:"easy",     label:"😊 Easy",              test: r => r.difficulty === "Easy"},
  {id:"bfast",    label:"🌅 Breakfast",         test: r => r.mealType === "breakfast"},
  {id:"lunch",    label:"☀️ Lunch",             test: r => r.mealType === "lunch"},
  {id:"dinner",   label:"🌙 Dinner",            test: r => r.mealType === "dinner"},
  {id:"snack",    label:"🍪 Snack",             test: r => r.mealType === "snack"},
  {id:"highprot", label:"💪 High Protein",      test: r => (r.calories||0) >= 300 && ["chicken","egg","dal","paneer","rajma"].some(k=>r.name.toLowerCase().includes(k)||(r.ingredients||[]).some(i=>(typeof i==="string"?i:i.name||"").toLowerCase().includes(k)))},
  {id:"lowcal",   label:"🥗 Low Cal (<250)",    test: r => (r.calories||0) < 250},
  {id:"veg",      label:"🌿 Veg Only",          test: r => !["chicken","mutton","fish","egg","prawn"].some(m=>r.name.toLowerCase().includes(m))},
  {id:"paneer",   label:"🧀 Paneer",            test: r => r.name.toLowerCase().includes("paneer")||(r.ingredients||[]).some(i=>(typeof i==="string"?i:i.name||"").toLowerCase().includes("paneer"))},
  {id:"chicken",  label:"🍗 Chicken",           test: r => r.name.toLowerCase().includes("chicken")},
  {id:"rice",     label:"🍚 Rice dishes",       test: r => r.name.toLowerCase().includes("rice")||r.name.toLowerCase().includes("biryani")||r.name.toLowerCase().includes("pulao")},
  {id:"dal",      label:"🫘 Dal/Lentils",       test: r => r.name.toLowerCase().includes("dal")||r.name.toLowerCase().includes("chole")||r.name.toLowerCase().includes("rajma")},
];

const MEAL_TABS  = ["all","breakfast","lunch","dinner","snack"];
const MEAL_ICONS = { all:"🍽️", breakfast:"🌅", lunch:"☀️", dinner:"🌙", snack:"🍪" };

const CAT_MAP = {
  "rice":"Staples & Grains","dal":"Staples & Grains","flour":"Staples & Grains","oats":"Staples & Grains",
  "milk":"Dairy & Eggs","curd":"Dairy & Eggs","paneer":"Dairy & Eggs","butter":"Dairy & Eggs","cream":"Dairy & Eggs","egg":"Dairy & Eggs",
  "chicken":"Meat & Seafood","mutton":"Meat & Seafood","fish":"Meat & Seafood",
  "onion":"Vegetables & Fruits","tomato":"Vegetables & Fruits","potato":"Vegetables & Fruits","spinach":"Vegetables & Fruits",
  "ginger":"Vegetables & Fruits","garlic":"Vegetables & Fruits",
};
function guessCategory(name="") {
  const n = name.toLowerCase();
  const key = Object.keys(CAT_MAP).find(k => n.includes(k));
  return key ? CAT_MAP[key] : "Staples & Grains";
}
function ingName(ing) { return typeof ing==="string" ? ing.toLowerCase() : (ing.name||"").toLowerCase(); }
function ingDisplay(ing) { return typeof ing==="string" ? ing : `${ing.name}${ing.quantity?` — ${ing.quantity}${ing.unit||""}`:""}`; }
function getImg(name="") {
  const k = Object.keys(RECIPE_IMAGES).find(k => name.toLowerCase().includes(k.toLowerCase())||k.toLowerCase().includes(name.toLowerCase()));
  return RECIPE_IMAGES[k||"default"];
}
function getPantryPct(recipe, pantryNames) {
  const ings = recipe.ingredients||[];
  if (ings.length===0) return 0;
  return Math.round((ings.filter(i=>pantryNames.some(p=>p.includes(ingName(i))||ingName(i).includes(p))).length/ings.length)*100);
}
function getMissing(recipe, pantryNames) {
  return (recipe.ingredients||[]).filter(i=>!pantryNames.some(p=>p.includes(ingName(i))||ingName(i).includes(p)));
}

export default function Recipes() {
  const toast = useToast();
  const navigate = useNavigate();
  const [household, setHousehold] = useState(null);
  const [pantryItems, setPantryItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [mealType, setMealType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState("");
  const [activeKeywords, setActiveKeywords] = useState([]);
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [missingModal, setMissingModal] = useState(null);
  const [addingToGrocery, setAddingToGrocery] = useState(false);
  const [cartFlash, setCartFlash] = useState(""); // recipe name that was just added

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/household/myhousehold`, { headers });
      if (res.data) {
        setHousehold(res.data);
        const panRes = await axios.get(`${API}/pantry/${res.data._id}`, { headers }).catch(()=>({data:[]}));
        setPantryItems(panRes.data||[]);
        const recRes = await axios.get(`${API}/recipe/suggest/${res.data._id}`, { headers }).catch(()=>({data:[]}));
        let recs = (recRes.data||[]).map(r=>({...r,ingredients:Array.isArray(r.ingredients)?r.ingredients:[]}));
        setRecipes(recs.length>0 ? recs : BUILTIN_RECIPES);
      }
    } catch { setRecipes(BUILTIN_RECIPES); }
    setLoading(false);
  };

  const pantryNames = pantryItems.map(i=>(i.name||"").toLowerCase());

  // Filter recipes
  let filtered = mealType==="all" ? [...recipes] : recipes.filter(r=>r.mealType===mealType);
  if (search.trim()) filtered = filtered.filter(r=>(r.name||"").toLowerCase().includes(search.toLowerCase()));
  if (activeKeywords.length>0) {
    const activeTags = KEYWORD_TAGS.filter(t=>activeKeywords.includes(t.id));
    filtered = filtered.filter(r=>activeTags.every(tag=>tag.test(r)));
  }

  const readyToCook = recipes.filter(r=>getPantryPct(r,pantryNames)===100);

  // ── Add missing to cart (SmartCart) ──────────────────────────────────
  const addMissingToCart = (recipe) => {
    const missing = getMissing(recipe, pantryNames);
    if (missing.length===0) { toast("You have all ingredients! ✅","success"); return; }
    const existing = (() => { try { return JSON.parse(localStorage.getItem("homehub_smartcart_v2")||"[]"); } catch { return []; } })();
    const newItems = missing
      .filter(ing=>!existing.some(e=>e.name.toLowerCase()===ingName(ing)))
      .map(ing=>({
        id: `recipe_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        name: typeof ing==="string" ? ing : ing.name,
        cat: guessCategory(ingName(ing)),
        qty: 1,
        unit: typeof ing==="object"&&ing.quantity ? `${ing.quantity}${ing.unit||""}` : "as needed",
        price: 0,
        fromRecipe: recipe.name,
      }));
    const updated = [...existing, ...newItems];
    localStorage.setItem("homehub_smartcart_v2", JSON.stringify(updated));
    // Dispatch storage event so SmartCart page updates live
    window.dispatchEvent(new Event("storage"));
    setCartFlash(recipe.name);
    setTimeout(()=>setCartFlash(""), 4000);
    toast(`${newItems.length} items added to Smart Cart! 🛒`, "success");
  };

  // ── Add missing to grocery list ───────────────────────────────────────
  const addMissingToGrocery = (recipe) => {
    const missing = getMissing(recipe, pantryNames);
    if (missing.length===0) { toast("You have all ingredients! ✅","success"); return; }
    setMissingModal({ recipe, missingList: missing });
  };

  const confirmAddToGrocery = () => {
    if (!missingModal) return;
    setAddingToGrocery(true);
    const existing = (() => { try { return JSON.parse(localStorage.getItem("groceryList")||"[]"); } catch { return []; } })();
    const newItems = missingModal.missingList
      .filter(ing=>!existing.some(e=>e.name.toLowerCase()===ingName(ing)))
      .map(ing=>({ id:Date.now()+Math.random(), name:typeof ing==="string"?ing:ing.name, cat:guessCategory(ingName(ing)), qty:"1", unit:"pieces", est:0, fromRecipe:missingModal.recipe.name }));
    localStorage.setItem("groceryList", JSON.stringify([...existing,...newItems]));
    toast(`${newItems.length} items added to Grocery List! 🛒`, "success");
    setMissingModal(null);
    setAddingToGrocery(false);
  };

  // ── Add to Meal Planner ────────────────────────────────────────────────
  const addToMealPlanner = (recipe) => {
    // Store recipe suggestion in localStorage and navigate
    localStorage.setItem("homehub_planner_suggestion", JSON.stringify({ name:recipe.name, cal:recipe.calories||0, img:getImg(recipe.name), mealType:recipe.mealType||"lunch", tag:recipe.difficulty||"Easy" }));
    navigate("/planner");
    toast(`Opening Meal Planner for ${recipe.name}! 📅`, "success");
  };

  if (loading) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:16}}>
      <div style={{width:48,height:48,borderRadius:"50%",border:"4px solid rgba(255,107,43,0.2)",borderTopColor:"#ff6b2b",animation:"spin 0.8s linear infinite"}}/>
      <p style={{color:"#5c4a35",fontWeight:600}}>Loading recipes from pantry...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:24,paddingBottom:32}}>

      {/* ── HERO ── */}
      <div style={{position:"relative",borderRadius:24,overflow:"hidden",height:200,boxShadow:"0 16px 48px rgba(0,0,0,0.2)"}}>
        <img src="https://images.unsplash.com/photo-1567337710282-00832b415979?w=1400&q=80" alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(26,20,16,0.88),rgba(26,20,16,0.45))"}}/>
        <div style={{position:"relative",zIndex:2,padding:"40px",height:"100%",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{display:"inline-block",background:"rgba(255,107,43,0.25)",border:"1px solid rgba(255,107,43,0.4)",color:"#ffaa70",borderRadius:50,padding:"5px 14px",fontSize:12,fontWeight:700,marginBottom:10}}>
              🍛 {recipes.length} Built-in Recipes · Pantry-based
            </div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:38,fontWeight:800,color:"white",margin:"0 0 6px"}}>Recipes</h1>
            <p style={{fontSize:13,color:"rgba(255,255,255,0.55)"}}>Suggestions based on what's in your pantry</p>
          </div>
          <div style={{display:"flex",gap:28}}>
            {[{n:recipes.length,l:"Recipes",c:"#ffaa70"},{n:readyToCook.length,l:"Ready",c:"#a5d6a7"},{n:pantryItems.length,l:"In Pantry",c:"#c9a96e"}].map(({n,l,c})=>(
              <div key={l} style={{textAlign:"center"}}>
                <span style={{display:"block",fontSize:26,fontWeight:800,color:c}}>{n}</span>
                <span style={{display:"block",fontSize:11,color:"rgba(255,255,255,0.45)",fontWeight:500,marginTop:2}}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CART FLASH BANNER ── */}
      {cartFlash && (
        <div style={{background:"#dcfce7",border:"1px solid #bbf7d0",borderRadius:14,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 4px 16px rgba(34,197,94,0.15)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>🛒</span>
            <div>
              <div style={{fontWeight:800,fontSize:14,color:"#166534"}}>Ingredients added to Smart Cart!</div>
              <div style={{fontSize:12,color:"#166534",opacity:0.8}}>Missing items from "{cartFlash}" are in your cart</div>
            </div>
          </div>
          <button onClick={()=>navigate("/cart")} style={{padding:"8px 16px",background:"#16a34a",color:"white",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>
            View Cart →
          </button>
        </div>
      )}

      {/* ── SMART RECIPE FINDER (replaces AI) ── */}
      <div style={{background:"white",borderRadius:20,padding:"20px 24px",boxShadow:"0 4px 20px rgba(139,94,60,0.08)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <div>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:800,color:"#1a1410",margin:"0 0 4px"}}>
              🔍 Smart Recipe Finder
            </h3>
            <p style={{fontSize:12,color:"#9c8672",margin:0}}>Click tags to filter · Search by name · Browse {recipes.length} Indian recipes</p>
          </div>
          {activeKeywords.length>0 && (
            <button onClick={()=>setActiveKeywords([])} style={{padding:"6px 14px",background:"rgba(211,47,47,0.1)",border:"none",borderRadius:50,color:"#d32f2f",fontSize:12,fontWeight:700,cursor:"pointer"}}>
              ✕ Clear {activeKeywords.length} filter{activeKeywords.length>1?"s":""}
            </button>
          )}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
          {KEYWORD_TAGS.map(tag=>{
            const active = activeKeywords.includes(tag.id);
            return (
              <button key={tag.id}
                onClick={()=>setActiveKeywords(prev=>active?prev.filter(k=>k!==tag.id):[...prev,tag.id])}
                style={{padding:"7px 14px",borderRadius:50,border:active?"none":"1px solid rgba(139,94,60,0.15)",
                  background:active?"#ff6b2b":"rgba(139,94,60,0.05)",color:active?"white":"#5c4a35",
                  fontSize:12,fontWeight:700,cursor:"pointer",transition:"all 0.15s",
                  boxShadow:active?"0 3px 12px rgba(255,107,43,0.3)":"none"}}>
                {tag.label}
              </button>
            );
          })}
        </div>
        {/* Active filter result count */}
        {activeKeywords.length>0 && (
          <div style={{fontSize:12,color:"#ff6b2b",fontWeight:700}}>
            Showing {filtered.length} recipe{filtered.length!==1?"s":""} matching your filters
          </div>
        )}
      </div>

      {/* ── READY TO COOK ── */}
      {readyToCook.length > 0 && (
        <div>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:800,color:"#1a1410",margin:"0 0 14px"}}>
            ✅ Ready to Cook — You Have All Ingredients!
          </h3>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16}}>
            {readyToCook.map(r=>(
              <div key={r._id||r.name} style={{position:"relative",borderRadius:20,overflow:"hidden",height:180,boxShadow:"0 8px 28px rgba(0,0,0,0.15)",cursor:"pointer"}} onClick={()=>setActiveRecipe(r)}>
                <img src={getImg(r.name)} alt={r.name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
                <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,transparent 20%,rgba(26,20,16,0.88) 100%)"}}/>
                <div style={{position:"absolute",bottom:0,left:0,right:0,padding:16}}>
                  <span style={{background:"rgba(76,175,61,0.85)",color:"white",borderRadius:50,padding:"3px 10px",fontSize:10,fontWeight:700}}>✅ Ready</span>
                  <h3 style={{fontSize:16,fontWeight:800,color:"white",margin:"4px 0"}}>{r.name}</h3>
                  <div style={{display:"flex",gap:8}}>
                    {[`🔥 ${r.calories||0} cal`,`⏱ ${r.cookTime||30} min`,`👥 ${r.servings||4}`].map(t=>(
                      <span key={t} style={{fontSize:11,color:"rgba(255,255,255,0.7)",background:"rgba(0,0,0,0.3)",borderRadius:50,padding:"2px 8px"}}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MEAL TYPE TABS + SEARCH ── */}
      <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {MEAL_TABS.map(t=>(
            <button key={t} onClick={()=>setMealType(t)} style={{padding:"8px 16px",borderRadius:50,border:"none",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all 0.2s",background:mealType===t?"#ff6b2b":"rgba(139,94,60,0.06)",color:mealType===t?"white":"#5c4a35",boxShadow:mealType===t?"0 4px 12px rgba(255,107,43,0.3)":"none"}}>
              {MEAL_ICONS[t]} {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>
        <div style={{flex:1,position:"relative",minWidth:180}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14}}>🔍</span>
          <input placeholder="Search recipes..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:"100%",padding:"10px 14px 10px 36px",border:"1.5px solid rgba(139,94,60,0.15)",borderRadius:12,fontSize:13,background:"white",color:"#1a1410",outline:"none"}}/>
        </div>
      </div>

      {/* ── RECIPE GRID ── */}
      {filtered.length===0 ? (
        <div style={{position:"relative",borderRadius:20,overflow:"hidden",height:220}}>
          <img src="https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&q=80" alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
          <div style={{position:"absolute",inset:0,background:"rgba(26,20,16,0.75)"}}/>
          <div style={{position:"relative",zIndex:2,height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}}>
            <span style={{fontSize:48}}>👨‍🍳</span>
            <p style={{fontSize:18,fontWeight:800,color:"white",marginBottom:6}}>No recipes found</p>
            <p style={{fontSize:13,color:"rgba(255,255,255,0.65)"}}>Try different filters or search terms</p>
            <button onClick={()=>{setActiveKeywords([]);setSearch("");setMealType("all");}} style={{marginTop:8,padding:"8px 20px",background:"rgba(255,107,43,0.9)",color:"white",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>
              Reset Filters
            </button>
          </div>
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:20}}>
          {filtered.map(r=>{
            const pct      = r.pantryMatchPercent ?? getPantryPct(r, pantryNames);
            const isOpen   = expanded===(r._id||r.name);
            const pctColor = pct===100?"#4caf7d":pct>=60?"#ff9800":"#ef5350";
            const missing  = getMissing(r, pantryNames);

            return (
              <div key={r._id||r.name} style={{background:"white",borderRadius:20,overflow:"hidden",boxShadow:"0 4px 20px rgba(139,94,60,0.09)",display:"flex",flexDirection:"column",transition:"transform 0.2s, box-shadow 0.2s"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 12px 40px rgba(139,94,60,0.16)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 20px rgba(139,94,60,0.09)";}}>
                {/* Image */}
                <div style={{position:"relative",height:180,overflow:"hidden",cursor:"pointer"}} onClick={()=>setActiveRecipe(r)}>
                  <img src={getImg(r.name)} alt={r.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,transparent 50%,rgba(26,20,16,0.5) 100%)"}}/>
                  <div style={{position:"absolute",top:10,left:10,borderRadius:50,padding:"4px 10px",fontSize:11,fontWeight:700,color:"white",background:pctColor}}>
                    {pct===100?"✅ Ready":`${pct}% match`}
                  </div>
                  <div style={{position:"absolute",top:10,right:10,background:"rgba(26,20,16,0.55)",borderRadius:50,padding:"4px 10px",fontSize:11,fontWeight:700,color:"white"}}>
                    {MEAL_ICONS[r.mealType]||"🍽️"} {r.mealType||"any"}
                  </div>
                </div>

                {/* Body */}
                <div style={{padding:16,display:"flex",flexDirection:"column",gap:10,flex:1}}>
                  <h3 style={{fontSize:16,fontWeight:800,color:"#1a1410",margin:0,fontFamily:"'Playfair Display',serif"}}>{r.name}</h3>

                  <div style={{display:"flex",gap:12}}>
                    {[{i:"🔥",v:r.calories||0,l:"cal"},{i:"⏱",v:`${r.cookTime||30}m`,l:""},{i:"👥",v:r.servings||4,l:"srv"},{i:"📊",v:r.difficulty||"Easy",l:""}].map(({i,v,l})=>(
                      <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                        <span>{i}</span>
                        <span style={{fontSize:12,fontWeight:800,color:"#1a1410"}}>{v}{l}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:11,color:"#9c8672",fontWeight:600,whiteSpace:"nowrap"}}>Pantry</span>
                    <div style={{flex:1,height:6,background:"rgba(139,94,60,0.1)",borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",borderRadius:3,background:pctColor,width:`${pct}%`,transition:"width 0.5s ease"}}/>
                    </div>
                    <span style={{fontSize:12,fontWeight:700,color:pctColor,minWidth:35,textAlign:"right"}}>{pct}%</span>
                  </div>

                  {/* Action buttons */}
                  <div style={{display:"flex",gap:8,marginTop:"auto"}}>
                    <button onClick={()=>setActiveRecipe(r)} style={{flex:1,padding:"8px 0",background:"rgba(139,94,60,0.06)",border:"1px solid rgba(139,94,60,0.12)",borderRadius:10,color:"#5c4a35",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                      📖 View
                    </button>
                    <button onClick={()=>addMissingToCart(r)} style={{flex:1,padding:"8px 0",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",border:"none",borderRadius:10,color:"white",fontSize:12,fontWeight:700,cursor:"pointer",boxShadow:"0 3px 10px rgba(255,107,43,0.25)"}}>
                      🛒 {missing.length>0?`Cart (${missing.length})`:"Cart"}
                    </button>
                    <button onClick={()=>addToMealPlanner(r)} style={{padding:"8px 10px",background:"rgba(21,101,192,0.1)",border:"1px solid rgba(21,101,192,0.2)",borderRadius:10,color:"#1565c0",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                      📅
                    </button>
                  </div>

                  <button onClick={()=>setExpanded(isOpen?null:(r._id||r.name))} style={{padding:"6px 0",background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#ff6b2b",fontWeight:700,textAlign:"left"}}>
                    {isOpen?"Hide details ▲":"See ingredients ▼"}
                  </button>

                  {isOpen && (
                    <div style={{display:"flex",flexDirection:"column",gap:14}}>
                      {/* Ingredients */}
                      {(r.ingredients||[]).length>0 && (
                        <div>
                          <div style={{fontSize:12,fontWeight:800,color:"#1a1410",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>🧾 Ingredients</div>
                          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:6}}>
                            {(r.ingredients||[]).map((ing,i)=>{
                              const inPantry=pantryNames.some(p=>p.includes(ingName(ing))||ingName(ing).includes(p));
                              return (
                                <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",borderRadius:8,border:`1px solid ${inPantry?"#4caf7d":"rgba(139,94,60,0.1)"}`,background:inPantry?"rgba(76,175,61,0.06)":"rgba(139,94,60,0.03)"}}>
                                  <span>{inPantry?"✅":"⬜"}</span>
                                  <span style={{fontSize:12,color:"#1a1410"}}>{ingDisplay(ing)}</span>
                                </div>
                              );
                            })}
                          </div>
                          {missing.length>0 && (
                            <div style={{display:"flex",gap:10,marginTop:8}}>
                              <button onClick={()=>addMissingToGrocery(r)} style={{flex:1,padding:10,background:"rgba(255,107,43,0.08)",border:"1px solid rgba(255,107,43,0.2)",borderRadius:10,color:"#ff6b2b",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                                🛒 Add {missing.length} missing to Grocery
                              </button>
                              <button onClick={()=>addMissingToCart(r)} style={{flex:1,padding:10,background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",border:"none",borderRadius:10,color:"white",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                                🧺 Add {missing.length} to Smart Cart
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Steps */}
                      {(r.steps||[]).length>0 && (
                        <div style={{background:"rgba(255,107,43,0.03)",borderRadius:10,padding:"12px 14px"}}>
                          <div style={{fontSize:12,fontWeight:800,color:"#1a1410",marginBottom:12,textTransform:"uppercase",letterSpacing:"0.05em"}}>👨‍🍳 How to Cook</div>
                          {(r.steps||[]).map((step,i)=>(
                            <div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
                              <div style={{width:24,height:24,borderRadius:"50%",background:"linear-gradient(135deg,#ff6b2b,#ff9a5c)",color:"white",fontSize:11,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
                              <p style={{fontSize:13,color:"#3d2e1e",margin:0,lineHeight:1.6}}>{step}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MISSING ITEMS MODAL ── */}
      {missingModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(26,20,16,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)",padding:20}} onClick={e=>e.target===e.currentTarget&&setMissingModal(null)}>
          <div style={{background:"white",borderRadius:24,padding:28,width:"100%",maxWidth:460,boxShadow:"0 32px 80px rgba(0,0,0,0.25)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
              <div>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:800,color:"#1a1410",margin:0}}>🛒 Missing for {missingModal.recipe.name}</h3>
                <p style={{fontSize:12,color:"#9c8672",margin:"4px 0 0"}}>These will be added to your Grocery List</p>
              </div>
              <button onClick={()=>setMissingModal(null)} style={{background:"rgba(139,94,60,0.08)",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:14}}>✕</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
              {missingModal.missingList.map((ing,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"rgba(239,83,80,0.05)",borderRadius:10,border:"1px solid rgba(239,83,80,0.15)"}}>
                  <span style={{fontSize:16}}>⬜</span>
                  <span style={{fontSize:14,fontWeight:600,color:"#1a1410",flex:1}}>{ingDisplay(ing)}</span>
                  <span style={{fontSize:11,color:"#ef5350",fontWeight:700}}>Missing</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:12}}>
              <button onClick={()=>setMissingModal(null)} style={{flex:1,padding:13,background:"white",border:"1.5px solid rgba(139,94,60,0.15)",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",color:"#5c4a35"}}>Cancel</button>
              <button onClick={confirmAddToGrocery} disabled={addingToGrocery} style={{flex:2,padding:13,background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",border:"none",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer"}}>
                🛒 Add All to Grocery List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RECIPE DETAIL MODAL ── */}
      {activeRecipe && (
        <div style={{position:"fixed",inset:0,background:"rgba(10,8,6,0.85)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)",padding:20}} onClick={e=>e.target===e.currentTarget&&setActiveRecipe(null)}>
          <div style={{background:"white",borderRadius:24,width:"100%",maxWidth:560,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 32px 80px rgba(0,0,0,0.4)"}}>
            <div style={{position:"relative",height:200,overflow:"hidden",borderRadius:"24px 24px 0 0"}}>
              <img src={getImg(activeRecipe.name)} alt={activeRecipe.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.75),transparent)"}}/>
              <button onClick={()=>setActiveRecipe(null)} style={{position:"absolute",top:12,right:12,width:34,height:34,borderRadius:"50%",background:"rgba(0,0,0,0.55)",border:"none",cursor:"pointer",fontSize:18,color:"white",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
              <div style={{position:"absolute",bottom:16,left:20}}>
                <h2 style={{margin:0,color:"white",fontWeight:900,fontSize:22,fontFamily:"'Playfair Display',serif"}}>{activeRecipe.name}</h2>
                <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
                  {[{i:"⏱️",v:`${activeRecipe.cookTime||30} min`},{i:"🍽️",v:`Serves ${activeRecipe.servings||4}`},{i:"🔥",v:`${activeRecipe.calories||0} kcal`},{i:"📊",v:activeRecipe.difficulty||"Easy"}].map(({i,v})=>(
                    <span key={v} style={{background:"rgba(255,255,255,0.2)",backdropFilter:"blur(4px)",color:"white",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700}}>{i} {v}</span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{padding:24}}>
              <h3 style={{margin:"0 0 12px",fontSize:16,fontWeight:800,color:"#1a1410",fontFamily:"'Playfair Display',serif"}}>🧂 Ingredients</h3>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:24}}>
                {(activeRecipe.ingredients||[]).map((ing,i)=>{
                  const have=pantryNames.some(p=>p.includes(ingName(ing))||ingName(ing).includes(p));
                  return (
                    <span key={i} style={{background:have?"rgba(45,122,79,0.1)":"rgba(198,40,40,0.07)",color:have?"#2d7a4f":"#c62828",border:`1px solid ${have?"rgba(45,122,79,0.25)":"rgba(198,40,40,0.2)"}`,borderRadius:20,padding:"5px 12px",fontSize:12,fontWeight:600}}>
                      {have?"✓":"+"} {ingDisplay(ing)}
                    </span>
                  );
                })}
              </div>
              <h3 style={{margin:"0 0 16px",fontSize:16,fontWeight:800,color:"#1a1410",fontFamily:"'Playfair Display',serif"}}>👨‍🍳 How to Make</h3>
              <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:24}}>
                {(activeRecipe.steps||[]).map((step,i)=>(
                  <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start"}}>
                    <div style={{width:30,height:30,borderRadius:"50%",flexShrink:0,background:"linear-gradient(135deg,#ff6b2b,#ff9a5c)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:900,fontSize:13}}>{i+1}</div>
                    <div style={{background:"#faf8f5",borderRadius:10,padding:"10px 14px",flex:1,fontSize:13,color:"#3d2c22",lineHeight:1.65,border:"1px solid rgba(139,94,60,0.08)"}}>{step}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:12,justifyContent:"flex-end",flexWrap:"wrap"}}>
                <button onClick={()=>{addToMealPlanner(activeRecipe);setActiveRecipe(null);}} style={{padding:"10px 16px",borderRadius:12,background:"rgba(21,101,192,0.1)",color:"#1565c0",border:"1px solid rgba(21,101,192,0.2)",cursor:"pointer",fontSize:13,fontWeight:700}}>
                  📅 Add to Planner
                </button>
                <button onClick={()=>{addMissingToCart(activeRecipe);setActiveRecipe(null);}} style={{padding:"10px 16px",borderRadius:12,background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",border:"none",cursor:"pointer",fontSize:13,fontWeight:700,boxShadow:"0 4px 14px rgba(255,107,43,0.3)"}}>
                  🛒 Add Missing to Cart
                </button>
                <button onClick={()=>setActiveRecipe(null)} style={{padding:"10px 16px",borderRadius:12,background:"rgba(139,94,60,0.08)",color:"#5c4a35",border:"1px solid rgba(139,94,60,0.15)",cursor:"pointer",fontSize:13,fontWeight:700}}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`input:focus{outline:none!important;border-color:#ff6b2b!important;box-shadow:0 0 0 3px rgba(255,107,43,0.1)!important;}`}</style>
    </div>
  );
}