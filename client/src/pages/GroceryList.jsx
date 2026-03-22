import { useEffect, useState } from "react";
import axios from "axios";
import { useToast } from "../components/Toast";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";


const CAT_META = {
  Vegetables:{ icon:"🥦", color:"#2d7a4f", img:"https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&q=80" },
  Fruits:    { icon:"🍎", color:"#d32f2f", img:"https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&q=80" },
  Dairy:     { icon:"🥛", color:"#1565c0", img:"https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&q=80" },
  Grains:    { icon:"🌾", color:"#e67e22", img:"https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80" },
  Spices:    { icon:"🌶️", color:"#c0392b", img:"https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&q=80" },
  Proteins:  { icon:"🍗", color:"#7c3aed", img:"https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=300&q=80" },
  Snacks:    { icon:"🍪", color:"#f59e0b", img:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&q=80" },
  Other:     { icon:"📦", color:"#5c4a35", img:"https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80" },
};

const SMART_CART_KEY = "homehub_smartcart_v2";
const GROCERY_KEY    = "groceryList"; // base key — actual key uses householdId
const CHECKED_KEY    = "groceryChecked";

const SMART_SUGGESTIONS = [
  { name:"Onions",      cat:"Vegetables", qty:"2",  unit:"kg",     icon:"🧅",  est:40  },
  { name:"Tomatoes",    cat:"Vegetables", qty:"1",  unit:"kg",     icon:"🍅",  est:30  },
  { name:"Potatoes",    cat:"Vegetables", qty:"2",  unit:"kg",     icon:"🥔",  est:40  },
  { name:"Spinach",     cat:"Vegetables", qty:"500",unit:"g",      icon:"🥬",  est:25  },
  { name:"Carrots",     cat:"Vegetables", qty:"500",unit:"g",      icon:"🥕",  est:25  },
  { name:"Rice",        cat:"Grains",     qty:"5",  unit:"kg",     icon:"🍚",  est:250 },
  { name:"Dal",         cat:"Grains",     qty:"500",unit:"g",      icon:"🫘",  est:60  },
  { name:"Wheat Flour", cat:"Grains",     qty:"2",  unit:"kg",     icon:"🌾",  est:80  },
  { name:"Milk",        cat:"Dairy",      qty:"2",  unit:"L",      icon:"🥛",  est:60  },
  { name:"Curd",        cat:"Dairy",      qty:"500",unit:"g",      icon:"🫙",  est:30  },
  { name:"Paneer",      cat:"Dairy",      qty:"200",unit:"g",      icon:"🧀",  est:80  },
  { name:"Eggs",        cat:"Proteins",   qty:"12", unit:"pieces", icon:"🥚",  est:75  },
  { name:"Chicken",     cat:"Proteins",   qty:"500",unit:"g",      icon:"🍗",  est:150 },
  { name:"Bananas",     cat:"Fruits",     qty:"6",  unit:"pieces", icon:"🍌",  est:30  },
  { name:"Apples",      cat:"Fruits",     qty:"500",unit:"g",      icon:"🍎",  est:60  },
  { name:"Ginger",      cat:"Spices",     qty:"100",unit:"g",      icon:"🫚",  est:15  },
  { name:"Garlic",      cat:"Spices",     qty:"100",unit:"g",      icon:"🧄",  est:20  },
  { name:"Turmeric",    cat:"Spices",     qty:"100",unit:"g",      icon:"🌿",  est:25  },
  { name:"Cooking Oil", cat:"Other",      qty:"1",  unit:"L",      icon:"🫗",  est:120 },
  { name:"Sugar",       cat:"Other",      qty:"1",  unit:"kg",     icon:"🍬",  est:45  },
  { name:"Salt",        cat:"Other",      qty:"1",  unit:"kg",     icon:"🧂",  est:20  },
  { name:"Bread",       cat:"Grains",     qty:"1",  unit:"packet", icon:"🍞",  est:35  },
  { name:"Biscuits",    cat:"Snacks",     qty:"2",  unit:"packets",icon:"🍪",  est:40  },
];

const UNITS = ["kg","g","L","ml","pieces","packets","bunches","dozen"];

function ingName(ing) {
  if (!ing) return "";
  if (typeof ing === "string") return ing.toLowerCase();
  return (ing.name || "").toLowerCase();
}

function guessCategory(name = "") {
  const n = name.toLowerCase();
  if (/rice|dal|flour|bread|roti|oat|wheat/.test(n)) return "Grains";
  if (/milk|curd|paneer|butter|cream|cheese|ghee/.test(n)) return "Dairy";
  if (/chicken|egg|fish|mutton|prawn|meat/.test(n)) return "Proteins";
  if (/onion|tomato|potato|spinach|carrot|cabbage|bean|pea|gourd/.test(n)) return "Vegetables";
  if (/ginger|garlic|turmeric|chilli|pepper|coriander|cumin|masala|spice/.test(n)) return "Spices";
  if (/apple|banana|mango|orange|lemon|fruit/.test(n)) return "Fruits";
  if (/biscuit|chip|snack|namkeen|chocolate/.test(n)) return "Snacks";
  return "Other";
}

function getMarketPrice(name) {
  const prices = {
    "onions":60,"tomatoes":50,"potatoes":40,"spinach":30,"carrots":40,
    "rice":80,"dal":100,"wheat flour":50,"milk":60,"curd":50,"paneer":180,"butter":55,
    "eggs":8,"chicken":200,"fish":250,
    "ginger":80,"garlic":60,"turmeric":30,"cooking oil":130,"sugar":45,"salt":20,
    "bananas":50,"apples":120,"bread":40,"biscuits":30,
  };
  const lower = name.toLowerCase();
  const key = Object.keys(prices).find(k => lower.includes(k) || k.includes(lower));
  return key ? prices[key] : 0;
}

export default function GroceryList() {
  const toast = useToast();
  const [household, setHousehold]   = useState(null);
  const [pantryLowStock, setPantryLowStock] = useState([]);
  const [recipes, setRecipes]       = useState([]);
  const [householdKey, setHouseholdKey] = useState(GROCERY_KEY); // becomes groceryList_<hhId>
  const [checkedKey, setCheckedKey]     = useState("groceryChecked");
  const [groceryList, setGroceryList]   = useState([]);
  const [checked, setChecked]           = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState({ name:"", cat:"Vegetables", qty:"1", unit:"kg", est:"" });
  const [filter, setFilter]         = useState("all");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showRecipes, setShowRecipes]         = useState(true);
  const [loading, setLoading]       = useState(true);
  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { load(); }, []);

  // ── Sync SmartCart checkout events to grocery "Got" list ──────────
  useEffect(() => {
    // Check immediately on mount (handles navigation-after-checkout case)
    const checkAndSync = () => {
      const raw = localStorage.getItem("homehub_cart_checkout");
      if (!raw) return;
      try {
        const cartItems = JSON.parse(raw);
        if (!cartItems.length) return;
        syncCartCheckoutToGrocery(cartItems);
        localStorage.removeItem("homehub_cart_checkout");
        localStorage.removeItem("homehub_cart_checkout_ts");
      } catch {}
    };
    checkAndSync(); // run immediately
    const interval = setInterval(checkAndSync, 800);
    return () => clearInterval(interval);
  }, [groceryList]);

  const syncCartCheckoutToGrocery = (cartItems) => {
    const cartNames = cartItems.map(ci => ci.name.toLowerCase());
    setChecked(prev => {
      const newChecked = [...prev];
      let added = 0;
      groceryList.forEach(gi => {
        if (cartNames.some(cn => cn.includes(gi.name.toLowerCase()) || gi.name.toLowerCase().includes(cn))) {
          if (!newChecked.includes(gi.id)) { newChecked.push(gi.id); added++; }
        }
      });
      if (added > 0) {
        localStorage.setItem(CHECKED_KEY, JSON.stringify(newChecked));
        toast(`${added} grocery item${added>1?"s":""} moved to Got ✅`, "success");
      }
      return newChecked;
    });
  };

  const load = async () => {
    try {
      const res = await axios.get(`${API}/household/myhousehold`, { headers });
      if (res.data) {
        setHousehold(res.data);
        // Set per-household localStorage keys so each household has its own grocery list
        const hhKey  = `groceryList_${res.data._id}`;
        const chKey  = `groceryChecked_${res.data._id}`;
        setHouseholdKey(hhKey);
        setCheckedKey(chKey);
        // Load this household's saved grocery list
        try {
          const saved = JSON.parse(localStorage.getItem(hhKey) || "[]");
          setGroceryList(saved);
          const savedCh = JSON.parse(localStorage.getItem(chKey) || "[]");
          setChecked(savedCh);
        } catch {}
        const [pRes, rRes] = await Promise.all([
          axios.get(`${API}/pantry/${res.data._id}`, { headers }),
          axios.get(`${API}/recipe/suggest/${res.data._id}`, { headers }).catch(() => ({ data: [] })),
        ]);
        const pItems = pRes.data || [];
        setPantryLowStock(pItems.filter(i => i.quantity <= (i.lowStockThreshold || 1)));
        const pNames = pItems.map(i => (i.name || "").toLowerCase());
        const recs = (rRes.data || [])
          .filter(r => Array.isArray(r.ingredients) && r.ingredients.length > 0)
          .map(r => {
            const missing = r.ingredients.filter(ing =>
              !pNames.some(p => p.includes(ingName(ing)) || ingName(ing).includes(p))
            );
            return { ...r, missingCount: missing.length, missingIngredients: missing };
          })
          .filter(r => r.missingCount > 0)
          .sort((a, b) => a.missingCount - b.missingCount);
        setRecipes(recs);
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const saveList    = (list) => { setGroceryList(list); localStorage.setItem(householdKey||GROCERY_KEY, JSON.stringify(list)); };
  const saveChecked = (ch)   => { setChecked(ch); localStorage.setItem(checkedKey||"groceryChecked", JSON.stringify(ch)); };

  // ── ADD ITEM (form submit) ────────────────────────────────────────────────
  const addItem = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast("Enter item name", "warning"); return; }
    const price = parseFloat(form.est) || getMarketPrice(form.name);
    const item = {
      id: Date.now(),
      name: form.name.trim(),
      cat: form.cat,
      qty: form.qty || "1",
      unit: form.unit,
      est: price,
    };
    saveList([...groceryList, item]);
    toast(`${form.name} added to grocery list!`, "success");
    setShowForm(false);
    setForm({ name:"", cat:"Vegetables", qty:"1", unit:"kg", est:"" });
  };

  // ── QUICK ADD from suggestion ─────────────────────────────────────────────
  const quickAdd = (sug) => {
    if (groceryList.find(i => i.name.toLowerCase() === sug.name.toLowerCase())) {
      toast(`${sug.name} already in list`, "info"); return;
    }
    saveList([...groceryList, { id: Date.now(), name: sug.name, cat: sug.cat, qty: sug.qty, unit: sug.unit, est: sug.est }]);
    toast(`${sug.name} added!`, "success");
  };

  // ── ADD FROM PANTRY LOW STOCK ─────────────────────────────────────────────
  const addFromPantry = (pantryItem) => {
    if (groceryList.find(i => i.name.toLowerCase() === pantryItem.name.toLowerCase())) {
      toast(`${pantryItem.name} already in list`, "info"); return;
    }
    const cat = Object.keys(CAT_META).find(c => c === pantryItem.category) || guessCategory(pantryItem.name);
    saveList([...groceryList, { id: Date.now(), name: pantryItem.name, cat, qty: "1", unit: pantryItem.unit || "pieces", est: getMarketPrice(pantryItem.name) }]);
    toast(`${pantryItem.name} added from pantry!`, "success");
  };

  // ── ADD ALL MISSING INGREDIENTS FROM RECIPE ───────────────────────────────
  const addMissingForRecipe = (recipe) => {
    const existing = groceryList.map(i => i.name.toLowerCase());
    const toAdd = recipe.missingIngredients
      .filter(ing => !existing.some(e => e.includes(ingName(ing)) || ingName(ing).includes(e)))
      .map(ing => ({
        id: Date.now() + Math.random(),
        name: typeof ing === "string" ? ing : ing.name,
        cat: guessCategory(ingName(ing)),
        qty: typeof ing === "object" && ing.quantity ? String(ing.quantity) : "1",
        unit: typeof ing === "object" && ing.unit ? ing.unit : "pieces",
        est: getMarketPrice(ingName(ing)),
        fromRecipe: recipe.name,
      }));
    if (toAdd.length === 0) { toast("All ingredients already in list!", "info"); return; }
    saveList([...groceryList, ...toAdd]);
    toast(`${toAdd.length} items from "${recipe.name}" added! 🍳`, "success");
  };

  // ── ADD GROCERY ITEM TO SMART CART ───────────────────────────────────────
  const addItemToCart = (item) => {
    try {
      const cartItems = JSON.parse(localStorage.getItem(SMART_CART_KEY) || "[]");
      if (cartItems.find(c => c.name.toLowerCase() === item.name.toLowerCase())) {
        toast(`${item.name} already in cart`, "info"); return;
      }
      const price = item.est || getMarketPrice(item.name) || 0;
      const catIcon = CAT_META[item.cat]?.icon || "📦";
      // qty=1 always; encode "250g" or "1cup" into unit label
      const rawQty = item.qty ? String(item.qty).trim() : "";
      const rawUnit = item.unit || "pieces";
      const unitLabel = rawQty && rawQty !== "1" ? `${rawQty}${rawUnit}` : rawUnit;
      const newItem = { id: Date.now(), name: item.name, cat: item.cat, qty: 1, unit: unitLabel, price, icon: catIcon };
      const updated = [...cartItems, newItem];
      localStorage.setItem(SMART_CART_KEY, JSON.stringify(updated));
      toast(`${item.name} added to Smart Cart! ⚡`, "success");
    } catch (e) { toast("Could not add to cart", "error"); }
  };

  // ── ADD ALL GROCERY LIST ITEMS TO SMART CART ─────────────────────────────
  const addAllToCart = () => {
    try {
      const cartItems = JSON.parse(localStorage.getItem(SMART_CART_KEY) || "[]");
      let added = 0;
      const newCart = [...cartItems];
      const toGet = groceryList.filter(i => !checked.includes(i.id));
      toGet.forEach(item => {
        if (!newCart.find(c => c.name.toLowerCase() === item.name.toLowerCase())) {
          const rawQty  = item.qty ? String(item.qty).trim() : "";
          const rawUnit = item.unit || "pieces";
          const unitLabel = rawQty && rawQty !== "1" ? `${rawQty}${rawUnit}` : rawUnit;
          newCart.push({ id: Date.now() + Math.random(), name: item.name, cat: item.cat, qty: 1, unit: unitLabel, price: item.est||getMarketPrice(item.name)||0, icon: CAT_META[item.cat]?.icon||"📦" });
          added++;
        }
      });
      localStorage.setItem(SMART_CART_KEY, JSON.stringify(newCart));
      if (added > 0) toast(`${added} items sent to Smart Cart! ⚡`, "success");
      else toast("All items already in cart", "info");
    } catch { toast("Error adding to cart", "error"); }
  };

  const removeItem   = (id) => { saveList(groceryList.filter(i => i.id !== id)); saveChecked(checked.filter(c => c !== id)); };
  const toggleCheck  = (id) => {
    setChecked(prev => {
      const next = prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id];
      localStorage.setItem(CHECKED_KEY, JSON.stringify(next));
      return next;
    });
  };
  const clearChecked = () => { saveList(groceryList.filter(i => !checked.includes(i.id))); saveChecked([]); toast("Checked items removed!", "success"); };

  let displayed = filter === "all" ? groceryList : filter === "got" ? groceryList.filter(i => checked.includes(i.id)) : groceryList.filter(i => !checked.includes(i.id));
  const totalEst  = groceryList.reduce((s, i) => s + (i.est || 0), 0);
  const gotEst    = groceryList.filter(i => checked.includes(i.id)).reduce((s, i) => s + (i.est || 0), 0);
  const pct       = groceryList.length > 0 ? Math.round((checked.length / groceryList.length) * 100) : 0;
  const toGetCount = groceryList.length - checked.length;

  const byCat = Object.keys(CAT_META).map(cat => ({
    cat, ...CAT_META[cat],
    items: displayed.filter(i => i.cat === cat),
  })).filter(c => c.items.length > 0);

  if (loading) return (
    <div style={s.loader}>
      <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80" style={s.loaderImg} alt=""/>
      <p style={s.loaderText}>Loading your grocery list...</p>
    </div>
  );

  return (
    <div style={s.page}>

      {/* HERO */}
      <div style={s.hero}>
        <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80" alt="" style={s.heroBg}/>
        <div style={s.heroOverlay}/>
        <div style={s.heroContent}>
          <div>
            <h1 style={s.heroTitle}>Grocery List</h1>
            <p style={s.heroSub}>{household?.name || "Your household"} · Smart shopping</p>
          </div>
          <div style={s.heroRight}>
            <div style={s.heroStat}><span style={s.heroNum}>{groceryList.length}</span><span style={s.heroLab}>Items</span></div>
            <div style={s.heroStat}><span style={{...s.heroNum,color:"#a5d6a7"}}>{checked.length}</span><span style={s.heroLab}>Got</span></div>
            <div style={s.heroStat}><span style={{...s.heroNum,color:"#c9a96e"}}>₹{totalEst}</span><span style={s.heroLab}>Est. Cost</span></div>
            <button onClick={() => setShowForm(true)} style={s.heroBtn}>+ Add</button>
          </div>
        </div>
      </div>

      {/* PROGRESS BAR */}
      {groceryList.length > 0 && (
        <div style={s.progressCard}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
            <span style={{fontSize:"14px",fontWeight:"700",color:"#1a1410"}}>{checked.length} of {groceryList.length} items collected</span>
            <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
              {checked.length > 0 && <button onClick={clearChecked} style={s.clearCheckedBtn}>✓ Remove got items</button>}
              <span style={{fontSize:"13px",fontWeight:"700",color:"#ff6b2b"}}>{pct}%</span>
            </div>
          </div>
          <div style={s.progressBar}>
            <div style={{...s.progressFill, width:`${pct}%`}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:"8px",flexWrap:"wrap",gap:"8px"}}>
            <span style={{fontSize:"12px",color:"#9c8672"}}>Got: <b style={{color:"#2d7a4f"}}>₹{gotEst}</b> · Remaining: <span style={{fontWeight:800}}>₹{totalEst - gotEst}</span></span>
            {toGetCount > 0 && (
              <button onClick={addAllToCart} style={{background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",border:"none",borderRadius:"10px",padding:"5px 14px",fontSize:"12px",fontWeight:"700",cursor:"pointer",boxShadow:"0 3px 10px rgba(255,107,43,0.3)"}}>
                ⚡ Add all to Smart Cart
              </button>
            )}
          </div>
        </div>
      )}

      {/* RECIPE MISSING ITEMS */}
      {recipes.length > 0 && (
        <div style={s.recipeAlertCard}>
          <img src="https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800&q=70" alt="" style={s.alertBg}/>
          <div style={s.alertOvl}/>
          <div style={s.recipeAlertContent}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <h3 style={s.alertTitle}>🍳 Shop for Recipes — Missing Ingredients</h3>
                <p style={{fontSize:"12px",color:"rgba(255,255,255,0.55)",margin:"4px 0 0"}}>
                  Tap "Add missing" to add all missing ingredients to your list
                </p>
              </div>
              <button onClick={() => setShowRecipes(!showRecipes)} style={s.toggleBtn}>
                {showRecipes ? "Hide ▲" : "Show ▼"}
              </button>
            </div>
            {showRecipes && (
              <div style={s.recipeList}>
                {recipes.slice(0, 6).map(recipe => {
                  const allAdded = recipe.missingIngredients.every(ing =>
                    groceryList.some(g => g.name.toLowerCase() === ingName(ing))
                  );
                  return (
                    <div key={recipe._id || recipe.name} style={s.recipeChip}>
                      <div style={{flex:1}}>
                        <p style={{margin:0,fontSize:"13px",fontWeight:"800",color:"white"}}>{recipe.name}</p>
                        <p style={{margin:"2px 0 0",fontSize:"11px",color:"rgba(255,255,255,0.5)"}}>
                          {allAdded ? "✅ All added" : `${recipe.missingCount} ingredient${recipe.missingCount!==1?"s":""} missing`}
                        </p>
                        <div style={{display:"flex",gap:"5px",marginTop:"5px",flexWrap:"wrap"}}>
                          {recipe.missingIngredients.slice(0,3).map((ing,i)=>(
                            <span key={i} style={s.missingTag}>
                              {typeof ing === "string" ? ing : ing.name}
                            </span>
                          ))}
                          {recipe.missingIngredients.length > 3 && (
                            <span style={s.missingTag}>+{recipe.missingIngredients.length-3} more</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => addMissingForRecipe(recipe)}
                        disabled={allAdded}
                        style={{...s.addMissingBtn, opacity:allAdded?0.5:1, background:allAdded?"rgba(76,175,61,0.3)":"rgba(255,107,43,0.9)"}}
                      >
                        {allAdded ? "✅" : "🛒 Add missing"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PANTRY LOW STOCK */}
      {pantryLowStock.length > 0 && (
        <div style={s.pantryAlert}>
          <h3 style={s.pantryAlertTitle}>🔔 Pantry Running Low — Add to List</h3>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginTop:"10px"}}>
            {pantryLowStock.map(item => {
              const inList = groceryList.find(g => g.name.toLowerCase() === (item.name||"").toLowerCase());
              return (
                <button key={item._id} onClick={() => addFromPantry(item)} disabled={!!inList} style={{display:"flex",alignItems:"center",gap:"6px",padding:"8px 14px",background:inList?"rgba(45,122,79,0.1)":"rgba(255,107,43,0.08)",border:`1px solid ${inList?"rgba(45,122,79,0.2)":"rgba(255,107,43,0.2)"}`,borderRadius:"50px",cursor:"pointer",opacity:inList?0.7:1,}}>
                  <span style={{fontSize:"14px"}}>{CAT_META[item.category]?.icon||"📦"}</span>
                  <span style={{fontSize:"12px",fontWeight:"700",color:"#1a1410"}}>{item.name}</span>
                  <span style={{fontSize:"10px",color:"#9c8672"}}>{item.quantity}{item.unit} left</span>
                  {inList && <span style={{fontSize:"10px",color:"#2d7a4f"}}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* QUICK ADD SUGGESTIONS */}
      <div style={s.sugCard}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
          <h3 style={s.sugTitle}>⚡ Quick Add — Common Items</h3>
          <button onClick={() => setShowSuggestions(!showSuggestions)} style={s.toggleBtn2}>
            {showSuggestions ? "Hide ▲" : "Show ▼"}
          </button>
        </div>
        {showSuggestions && (
          <div style={s.sugGrid}>
            {SMART_SUGGESTIONS.map(sug => {
              const inList = groceryList.find(i => i.name.toLowerCase() === sug.name.toLowerCase());
              return (
                <button key={sug.name} onClick={() => quickAdd(sug)} disabled={!!inList} style={{...s.sugItem,background: inList ? "rgba(45,122,79,0.08)" : "white",border: `1.5px solid ${inList?"rgba(45,122,79,0.25)":"rgba(139,94,60,0.1)"}`,opacity: inList ? 0.7 : 1,}}>
                  <span style={{fontSize:"18px"}}>{sug.icon}</span>
                  <span style={{fontSize:"11px",fontWeight:"700",color:"#1a1410"}}>{sug.name}</span>
                  <span style={{fontSize:"10px",color:"#9c8672"}}>{sug.qty}{sug.unit}</span>
                  {sug.est > 0 && <span style={{fontSize:"10px",color:"#ff6b2b",fontWeight:"700"}}>~₹{sug.est}</span>}
                  {inList && <span style={{fontSize:"10px",color:"#2d7a4f",fontWeight:"800"}}>✓ Added</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* FILTER TABS */}
      {groceryList.length > 0 && (
        <div style={{display:"flex",gap:"8px",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}>
          <div style={{display:"flex",gap:"8px"}}>
            {[["all",`All (${groceryList.length})`],["todo",`To Get (${toGetCount})`],["got",`Got (${checked.length})`]].map(([v,l])=>(
              <button key={v} onClick={() => setFilter(v)} style={{...s.filterTab,background: filter===v ? "#1a1410" : "white",color: filter===v ? "white" : "#5c4a35",boxShadow: filter===v ? "0 3px 10px rgba(26,20,16,0.2)" : "0 1px 4px rgba(139,94,60,0.1)",}}>{l}</button>
            ))}
          </div>
          <button onClick={() => { if(window.confirm("Clear entire list?")){ saveList([]); saveChecked([]); toast("List cleared","info"); } }} style={s.clearAllBtn}>
            🗑️ Clear All
          </button>
        </div>
      )}

      {/* ITEMS BY CATEGORY */}
      {groceryList.length === 0 ? (
        <div style={s.empty}>
          <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80" alt="" style={s.emptyImg}/>
          <div style={s.emptyOvl}/>
          <div style={s.emptyContent}>
            <span style={{fontSize:"48px",display:"block",marginBottom:"12px"}}>🛒</span>
            <p style={{fontSize:"18px",fontWeight:"800",color:"white",marginBottom:"6px"}}>List is empty</p>
            <p style={{fontSize:"13px",color:"rgba(255,255,255,0.6)",marginBottom:"20px"}}>Quick add items above or tap "+ Add" to start</p>
            <button onClick={() => setShowForm(true)} style={{padding:"12px 20px",background:"#ff6b2b",color:"white",border:"none",borderRadius:"12px",fontSize:"14px",fontWeight:"700",cursor:"pointer"}}>+ Add First Item</button>
          </div>
        </div>
      ) : displayed.length === 0 ? (
        <div style={{background:"white",borderRadius:"16px",padding:"30px",textAlign:"center",boxShadow:"0 3px 14px rgba(139,94,60,0.07)"}}>
          <span style={{fontSize:"32px",display:"block",marginBottom:"8px"}}>✅</span>
          <p style={{fontSize:"14px",fontWeight:"700",color:"#1a1410",margin:0}}>
            {filter==="todo" ? "All items collected! 🎉" : "Nothing here yet."}
          </p>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
          {byCat.map(c => (
            <div key={c.cat} style={s.catSection}>
              <div style={s.catSectionHdr}>
                <div style={{...s.catIcon,background:`${c.color}12`,color:c.color}}>{c.icon}</div>
                <h3 style={s.catTitle}>{c.cat}</h3>
                <span style={{...s.catBadge,background:`${c.color}10`,color:c.color}}>{c.items.length}</span>
                {c.items.some(i=>i.est>0) && (
                  <span style={{marginLeft:"auto",fontSize:"12px",color:"#9c8672",fontWeight:"600"}}>
                    ~₹{c.items.reduce((s,i)=>s+(i.est||0),0)}
                  </span>
                )}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                {c.items.map(item => {
                  const isChecked = checked.includes(item.id);
                  return (
                    <div key={item.id} style={{...s.item, opacity:isChecked?0.6:1, background:isChecked?"rgba(45,122,79,0.04)":"white"}}>
                      {/* Checkbox */}
                      <button onClick={() => toggleCheck(item.id)} style={{...s.checkCircle,background: isChecked ? c.color : "white",border: `2px solid ${c.color}60`,flexShrink: 0,}}>
                        {isChecked && <span style={{color:"white",fontSize:"11px",fontWeight:"800"}}>✓</span>}
                      </button>
                      {/* Icon */}
                      <div style={{...s.catItemIcon,background:`${c.color}12`,color:c.color,flexShrink:0}}>{c.icon}</div>
                      {/* Info */}
                      <div style={{flex:1,minWidth:0}}>
                        <span style={{fontSize:"14px",fontWeight:"700",color:"#1a1410",textDecoration:isChecked?"line-through":"none",display:"block"}}>
                          {item.name}
                        </span>
                        <div style={{display:"flex",gap:"8px",marginTop:"2px",alignItems:"center",flexWrap:"wrap"}}>
                          {item.qty && <span style={{fontSize:"11px",color:"#9c8672"}}>{item.qty} {item.unit}</span>}
                          {item.fromRecipe && <span style={{fontSize:"10px",color:"#7c3aed",fontWeight:"600",background:"rgba(124,58,237,0.08)",borderRadius:"50px",padding:"1px 7px"}}>🍳 {item.fromRecipe}</span>}
                        </div>
                      </div>
                      {/* Est cost */}
                      {item.est > 0 && <span style={{fontSize:"13px",fontWeight:"700",color:c.color,flexShrink:0}}>₹{item.est}</span>}
                      {/* Add to Cart */}
                      {!isChecked && (
                        <button
                          onClick={() => addItemToCart(item)}
                          title="Add to Smart Cart"
                          style={{...s.cartBtn, flexShrink:0}}
                        >
                          ⚡
                        </button>
                      )}
                      {/* Remove */}
                      <button onClick={() => removeItem(item.id)} style={{...s.removeBtn, flexShrink:0}}>✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD ITEM MODAL */}
      {showForm && (
        <div style={s.modalBg} onClick={e => e.target===e.currentTarget && setShowForm(false)}>
          <div style={s.modal}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
              <h3 style={s.modalTitle}>➕ Add to Grocery List</h3>
              <button style={s.modalX} onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={addItem} style={{display:"flex",flexDirection:"column",gap:"14px"}}>
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                <label style={s.mLbl}>Item Name *</label>
                <input
                  placeholder="e.g. Onions, Rice..."
                  value={form.name}
                  onChange={e => setForm({...form, name:e.target.value, cat:guessCategory(e.target.value)})}
                  style={s.mInput}
                  required
                  autoFocus
                />
              </div>
              <div style={{display:"flex",gap:"12px"}}>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:"6px"}}>
                  <label style={s.mLbl}>Category</label>
                  <select value={form.cat} onChange={e => setForm({...form,cat:e.target.value})} style={s.mInput}>
                    {Object.keys(CAT_META).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:"6px"}}>
                  <label style={s.mLbl}>Unit</label>
                  <select value={form.unit} onChange={e => setForm({...form,unit:e.target.value})} style={s.mInput}>
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:"flex",gap:"12px"}}>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:"6px"}}>
                  <label style={s.mLbl}>Quantity</label>
                  <input
                    placeholder="e.g. 2, 500"
                    value={form.qty}
                    onChange={e => setForm({...form,qty:e.target.value})}
                    style={s.mInput}
                  />
                </div>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:"6px"}}>
                  <label style={s.mLbl}>Est. Cost (₹)</label>
                  <input
                    type="number"
                    placeholder={`Auto: ~₹${getMarketPrice(form.name)||0}`}
                    value={form.est}
                    onChange={e => setForm({...form,est:e.target.value})}
                    style={s.mInput}
                  />
                </div>
              </div>
              <button type="submit" style={{padding:"14px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",border:"none",borderRadius:"14px",fontSize:"15px",fontWeight:"700",cursor:"pointer",boxShadow:"0 6px 20px rgba(255,107,43,0.3)"}}>
                Add to List
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        input:focus, select:focus { outline:none!important; border-color:#ff6b2b!important; box-shadow:0 0 0 3px rgba(255,107,43,0.1)!important; }
      `}</style>
    </div>
  );
}

const s = {
  page:{display:"flex",flexDirection:"column",gap:"20px",paddingBottom:"32px"},
  loader:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:"16px"},
  loaderImg:{width:"120px",height:"120px",borderRadius:"50%",objectFit:"cover"},
  loaderText:{fontSize:"16px",color:"#5c4a35",fontWeight:"600"},
  hero:{position:"relative",borderRadius:"24px",overflow:"hidden",height:"200px",boxShadow:"0 16px 48px rgba(0,0,0,0.18)"},
  heroBg:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"},
  heroOverlay:{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(26,20,16,0.88),rgba(26,20,16,0.5))"},
  heroContent:{position:"relative",zIndex:2,padding:"32px 40px",height:"100%",display:"flex",justifyContent:"space-between",alignItems:"center"},
  heroTitle:{fontFamily:"'Playfair Display',serif",fontSize:"36px",fontWeight:"800",color:"white",margin:"0 0 6px"},
  heroSub:{fontSize:"12px",color:"rgba(255,255,255,0.5)"},
  heroRight:{display:"flex",gap:"20px",alignItems:"center"},
  heroStat:{textAlign:"center"},
  heroNum:{display:"block",fontSize:"20px",fontWeight:"800",color:"#ffaa70"},
  heroLab:{display:"block",fontSize:"10px",color:"rgba(255,255,255,0.45)",fontWeight:"500",marginTop:"2px"},
  heroBtn:{padding:"12px 18px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",border:"none",borderRadius:"12px",fontSize:"14px",fontWeight:"700",cursor:"pointer",boxShadow:"0 4px 14px rgba(255,107,43,0.35)"},
  progressCard:{background:"white",borderRadius:"16px",padding:"16px 20px",boxShadow:"0 3px 14px rgba(139,94,60,0.07)"},
  progressBar:{height:"10px",background:"rgba(139,94,60,0.08)",borderRadius:"10px",overflow:"hidden"},
  progressFill:{height:"100%",background:"linear-gradient(90deg,#ff6b2b,#ff8c54)",borderRadius:"10px",transition:"width 0.5s ease"},
  clearCheckedBtn:{padding:"5px 12px",background:"rgba(45,122,79,0.1)",color:"#2d7a4f",border:"1px solid rgba(45,122,79,0.2)",borderRadius:"10px",fontSize:"12px",fontWeight:"700",cursor:"pointer"},
  recipeAlertCard:{position:"relative",borderRadius:"20px",overflow:"hidden",boxShadow:"0 8px 28px rgba(0,0,0,0.15)"},
  alertBg:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"},
  alertOvl:{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(26,20,16,0.92),rgba(44,24,8,0.88))"},
  recipeAlertContent:{position:"relative",zIndex:2,padding:"22px 26px"},
  alertTitle:{fontSize:"15px",fontWeight:"800",color:"white",margin:0,fontFamily:"'Playfair Display',serif"},
  toggleBtn:{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.7)",borderRadius:"10px",padding:"5px 12px",fontSize:"12px",cursor:"pointer"},
  recipeList:{display:"flex",flexDirection:"column",gap:"10px",marginTop:"14px"},
  recipeChip:{display:"flex",alignItems:"flex-start",gap:"12px",padding:"12px 14px",background:"rgba(255,255,255,0.06)",borderRadius:"12px",border:"1px solid rgba(255,255,255,0.1)"},
  missingTag:{background:"rgba(239,83,80,0.2)",color:"rgba(255,255,255,0.8)",borderRadius:"50px",padding:"2px 8px",fontSize:"10px",fontWeight:"600"},
  addMissingBtn:{padding:"8px 14px",border:"none",borderRadius:"10px",color:"white",fontSize:"12px",fontWeight:"700",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0},
  pantryAlert:{background:"white",borderRadius:"16px",padding:"16px 20px",boxShadow:"0 3px 14px rgba(139,94,60,0.07)"},
  pantryAlertTitle:{fontSize:"14px",fontWeight:"800",color:"#1a1410",margin:0},
  sugCard:{background:"white",borderRadius:"18px",padding:"18px 22px",boxShadow:"0 3px 14px rgba(139,94,60,0.07)"},
  sugTitle:{fontSize:"15px",fontWeight:"800",color:"#1a1410",margin:0,fontFamily:"'Playfair Display',serif"},
  toggleBtn2:{background:"rgba(139,94,60,0.06)",border:"none",color:"#9c8672",borderRadius:"10px",padding:"5px 12px",fontSize:"12px",cursor:"pointer",fontWeight:"600"},
  sugGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:"8px",marginTop:"4px"},
  sugItem:{display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",padding:"10px 6px",borderRadius:"14px",cursor:"pointer",transition:"all 0.2s",textAlign:"center"},
  filterTab:{padding:"8px 16px",border:"none",borderRadius:"50px",fontSize:"12px",fontWeight:"700",cursor:"pointer",transition:"all 0.2s"},
  clearAllBtn:{background:"rgba(220,53,69,0.08)",color:"#d32f2f",border:"none",borderRadius:"10px",padding:"7px 14px",fontSize:"12px",fontWeight:"700",cursor:"pointer"},
  catSection:{background:"white",borderRadius:"18px",padding:"16px 20px",boxShadow:"0 3px 14px rgba(139,94,60,0.07)"},
  catSectionHdr:{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px"},
  catIcon:{width:"32px",height:"32px",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px"},
  catTitle:{fontSize:"13px",fontWeight:"800",color:"#1a1410",flex:1,margin:0},
  catBadge:{borderRadius:"50px",padding:"2px 9px",fontSize:"11px",fontWeight:"700"},
  item:{display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",borderRadius:"12px",border:"1px solid rgba(139,94,60,0.06)",transition:"all 0.2s"},
  checkCircle:{width:"22px",height:"22px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.2s"},
  catItemIcon:{width:"34px",height:"34px",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px"},
  cartBtn:{background:"rgba(255,107,43,0.1)",color:"#ff6b2b",border:"none",borderRadius:"8px",width:"28px",height:"28px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",transition:"all 0.2s"},
  removeBtn:{background:"none",border:"none",cursor:"pointer",fontSize:"13px",opacity:0.35,padding:"4px"},
  empty:{position:"relative",borderRadius:"20px",overflow:"hidden",height:"240px"},
  emptyImg:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"},
  emptyOvl:{position:"absolute",inset:0,background:"rgba(26,20,16,0.75)"},
  emptyContent:{position:"relative",zIndex:2,height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"},
  modalBg:{position:"fixed",inset:0,background:"rgba(26,20,16,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"},
  modal:{background:"white",borderRadius:"24px",padding:"28px",width:"100%",maxWidth:"460px",boxShadow:"0 32px 80px rgba(0,0,0,0.25)",margin:"20px",maxHeight:"90vh",overflowY:"auto"},
  modalTitle:{fontSize:"18px",fontWeight:"800",color:"#1a1410",margin:0,fontFamily:"'Playfair Display',serif"},
  modalX:{background:"rgba(139,94,60,0.08)",border:"none",borderRadius:"50%",width:"32px",height:"32px",cursor:"pointer",fontSize:"14px"},
  mLbl:{fontSize:"12px",fontWeight:"700",color:"#5c4a35",textTransform:"uppercase",letterSpacing:"0.04em"},
  mInput:{padding:"12px 14px",border:"1.5px solid rgba(139,94,60,0.15)",borderRadius:"12px",fontSize:"14px",background:"#fdf8f3",color:"#1a1410",width:"100%",boxSizing:"border-box"},
};