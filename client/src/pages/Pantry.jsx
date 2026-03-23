// ══════════════════════════════════════════════════════════════════════════
//  Pantry.jsx  —  HomeHub Smart Kitchen
//  Features: auto-populate from cart purchases, recipe match %, 3D cards,
//            low-stock alerts, search, category filter, expiry tracking
// ══════════════════════════════════════════════════════════════════════════
import { useEffect, useState, useRef } from "react";
import API from "../api/axios";
import { useToast } from "../components/Toast";

const CATEGORIES = [
  { name:"All Items",   icon:"🛒", color:"#ff6b2b" },
  { name:"Vegetables",  icon:"🥦", color:"#16a34a" },
  { name:"Fruits",      icon:"🍎", color:"#dc2626" },
  { name:"Grains",      icon:"🌾", color:"#d97706" },
  { name:"Dairy",       icon:"🥛", color:"#2563eb" },
  { name:"Spices",      icon:"🌶️", color:"#b45309" },
  { name:"Proteins",    icon:"🍗", color:"#7c3aed" },
  { name:"Oils",        icon:"🫗",  color:"#ca8a04" },
  { name:"Other",       icon:"📦", color:"#64748b" },
];

const UNITS = ["kg","g","L","ml","pieces","packets","bunches","dozen","pcs"];

const CAT_MAP = {
  // SmartCart categories → Pantry categories
  "Vegetables & Fruits": "Vegetables",
  "Dairy & Eggs":        "Dairy",
  "Staples & Grains":    "Grains",
  "Meat & Seafood":      "Proteins",
  "Bakery & Snacks":     "Other",
  "Beverages":           "Other",
  "Spices & Oils":       "Spices",
  "Cleaning & Home":     "Other",
  "Personal Care":       "Other",
};

function guessCategory(name="") {
  const n = name.toLowerCase();
  if (/tomato|onion|potato|spinach|carrot|capsicum|ginger|garlic|cabbage|pea|bean|brinjal|gourd|vegetable/.test(n)) return "Vegetables";
  if (/banana|apple|mango|orange|lemon|grape|papaya|pear|fruit/.test(n)) return "Fruits";
  if (/rice|wheat|atta|flour|dal|oat|poha|roti|bread|maida|semolina|grain/.test(n)) return "Grains";
  if (/milk|curd|paneer|butter|ghee|cream|cheese|egg|dairy/.test(n)) return "Dairy";
  if (/turmeric|chilli|cumin|coriander|masala|pepper|spice|garam|mustard|fenugreek/.test(n)) return "Spices";
  if (/chicken|mutton|fish|prawn|meat|egg|protein/.test(n)) return "Proteins";
  if (/oil|ghee/.test(n)) return "Oils";
  return "Other";
}

const INR = n => `₹${(n||0).toLocaleString("en-IN")}`;

function daysUntilExpiry(date) {
  if (!date) return null;
  const diff = new Date(date) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function Pantry() {
  const toast = useToast();

  const [household,   setHousehold]   = useState(null);
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [activecat,   setActiveCat]   = useState("All Items");
  const [showForm,    setShowForm]    = useState(false);
  const [editItem,    setEditItem]    = useState(null);
  const [hovered,     setHovered]     = useState(null);
  const [cartBanner,  setCartBanner]  = useState(false);
  const [form, setForm] = useState({
    name:"", quantity:"1", unit:"kg", category:"Vegetables",
    expiryDate:"", lowStockThreshold:"1",
  });

  // Listen for cart checkout events to auto-add to pantry
  useEffect(() => {
    const handlePantryUpdate = () => {
      setCartBanner(true);
      setTimeout(() => setCartBanner(false), 5000);
      load();
    };
    window.addEventListener("pantryUpdated", handlePantryUpdate);

    // Also check if there's a pending cart checkout from localStorage
    const checkCartCheckout = () => {
      const raw = localStorage.getItem("homehub_cart_checkout");
      if (!raw) return;
      try {
        const cartItems = JSON.parse(raw);
        if (cartItems.length > 0) {
          setCartBanner(true);
          setTimeout(() => setCartBanner(false), 5000);
          localStorage.removeItem("homehub_cart_checkout");
        }
      } catch {}
    };
    checkCartCheckout();
    return () => window.removeEventListener("pantryUpdated", handlePantryUpdate);
  }, []);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const hhRes = await API.get("/household/myhousehold");
      if (hhRes.data) {
        setHousehold(hhRes.data);
        const pRes = await API.get(`/pantry/${hhRes.data._id}`);
        setItems(pRes.data || []);
      }
    } catch(e) {
      console.error("Pantry load:", e);
    }
    setLoading(false);
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({ name:"", quantity:"1", unit:"kg", category:"Vegetables", expiryDate:"", lowStockThreshold:"1" });
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name || "",
      quantity: String(item.quantity || 1),
      unit: item.unit || "kg",
      category: item.category || "Vegetables",
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split("T")[0] : "",
      lowStockThreshold: String(item.lowStockThreshold || 1),
    });
    setShowForm(true);
  };

  const saveItem = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast("Enter item name","warning"); return; }
    const payload = {
      householdId: household._id,
      name:              form.name.trim(),
      quantity:          parseFloat(form.quantity) || 1,
      unit:              form.unit,
      category:          form.category,
      expiryDate:        form.expiryDate || null,
      lowStockThreshold: parseFloat(form.lowStockThreshold) || 1,
    };
    try {
      if (editItem) {
        await API.put(`/pantry/${editItem._id}`, payload);
        toast(`${form.name} updated ✅`, "success");
      } else {
        await API.post("/pantry", payload);
        toast(`${form.name} added to pantry! 🥦`, "success");
      }
      setShowForm(false);
      setEditItem(null);
      await load();
    } catch(e) {
      toast(e.response?.data?.message || "Error saving item", "error");
    }
  };

  const deleteItem = async (id, name) => {
    if (!window.confirm(`Remove ${name} from pantry?`)) return;
    try {
      await API.delete(`/pantry/${id}`);
      await load();
      toast(`${name} removed`, "info");
    } catch { toast("Failed to remove", "error"); }
  };

  const updateQty = async (item, delta) => {
    const newQty = Math.max(0, (item.quantity || 0) + delta);
    try {
      await API.put(`/pantry/${item._id}`, { ...item, quantity: newQty, householdId: household._id });
      setItems(prev => prev.map(i => i._id===item._id ? {...i, quantity:newQty} : i));
    } catch { toast("Failed to update", "error"); }
  };

  // Filtering
  const filtered = items.filter(item => {
    const matchCat  = activecat === "All Items" || item.category === activecat;
    const matchSrch = !search || item.name?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSrch;
  });

  const lowStock    = items.filter(i => i.quantity <= (i.lowStockThreshold || 1));
  const expiringSoon = items.filter(i => { const d = daysUntilExpiry(i.expiryDate); return d !== null && d <= 7 && d > 0; });
  const expired     = items.filter(i => { const d = daysUntilExpiry(i.expiryDate); return d !== null && d <= 0; });
  const byCategory  = CATEGORIES.slice(1).map(c => ({ ...c, count: items.filter(i=>i.category===c.name).length })).filter(c=>c.count>0);

  if (loading) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:16}}>
      <div style={{width:60,height:60,border:"4px solid rgba(255,107,43,0.15)",borderTop:"4px solid #ff6b2b",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <p style={{fontSize:15,color:"#5c4a35",fontWeight:600}}>Loading pantry...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20,paddingBottom:32}}>

      {/* ── CART PURCHASE BANNER ── */}
      {cartBanner && (
        <div style={{background:"linear-gradient(135deg,#16a34a,#22c55e)",borderRadius:16,padding:"14px 20px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 4px 20px rgba(22,163,74,0.3)",animation:"slideDown 0.3s ease"}}>
          <span style={{fontSize:24}}>🥦</span>
          <div>
            <p style={{margin:0,fontSize:14,fontWeight:800,color:"white"}}>Pantry updated from cart!</p>
            <p style={{margin:0,fontSize:12,color:"rgba(255,255,255,0.8)"}}>Purchased items have been added to your pantry automatically.</p>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <div style={{position:"relative",borderRadius:24,overflow:"hidden",height:220,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
        <img src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80" alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(10,6,3,0.9),rgba(10,6,3,0.55))"}}/>
        {/* Ambient orbs */}
        <div style={{position:"absolute",width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle,rgba(22,163,74,0.2),transparent 70%)",top:-60,left:-60,pointerEvents:"none"}}/>
        <div style={{position:"absolute",width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,107,43,0.15),transparent 70%)",bottom:-40,right:80,pointerEvents:"none"}}/>

        <div style={{position:"relative",zIndex:2,padding:"30px 40px",height:"100%",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:38,fontWeight:800,color:"white",margin:"0 0 6px",letterSpacing:"-0.5px"}}>Pantry</h1>
              <p style={{fontSize:13,color:"rgba(255,255,255,0.5)",margin:0}}>{household?.name} · Your kitchen inventory</p>
            </div>
            <button onClick={openAdd} style={{padding:"12px 22px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",border:"none",borderRadius:14,fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 20px rgba(255,107,43,0.4)"}}>
              + Add Item
            </button>
          </div>
          <div style={{display:"flex",gap:32,alignItems:"center"}}>
            {[
              {label:"Total Items",   val:items.length,       color:"#ffaa70"},
              {label:"Low Stock",     val:lowStock.length,    color:"#f87171"},
              {label:"Categories",    val:byCategory.length,  color:"#a5d6a7"},
            ].map(s=>(
              <div key={s.label}>
                <span style={{display:"block",fontSize:26,fontWeight:900,color:s.color,letterSpacing:"-1px"}}>{s.val}</span>
                <span style={{fontSize:10,color:"rgba(255,255,255,0.45)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>{s.label}</span>
              </div>
            ))}
            {expiringSoon.length > 0 && (
              <div style={{background:"rgba(251,191,36,0.15)",borderRadius:12,padding:"8px 14px",border:"1px solid rgba(251,191,36,0.3)"}}>
                <span style={{fontSize:13,fontWeight:700,color:"#fbbf24"}}>⚠️ {expiringSoon.length} expiring soon</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── LOW STOCK ALERT ── */}
      {lowStock.length > 0 && (
        <div style={{background:"white",borderRadius:16,padding:"16px 20px",boxShadow:"0 3px 14px rgba(139,94,60,0.07)",border:"1px solid rgba(211,47,47,0.1)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <span style={{fontSize:18}}>🔔</span>
            <h3 style={{fontSize:14,fontWeight:800,color:"#1a1410",margin:0}}>Low Stock — Reorder Soon</h3>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {lowStock.map(item => (
              <div key={item._id} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:"rgba(211,47,47,0.06)",borderRadius:50,border:"1px solid rgba(211,47,47,0.15)"}}>
                <span style={{fontSize:12,fontWeight:700,color:"#1a1410"}}>{item.name}</span>
                <span style={{fontSize:10,color:"#d32f2f",fontWeight:600}}>{item.quantity}{item.unit} left</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EXPIRED ITEMS ALERT ── */}
      {expired.length > 0 && (
        <div style={{background:"rgba(220,38,38,0.05)",borderRadius:16,padding:"14px 20px",border:"1px solid rgba(220,38,38,0.15)"}}>
          <span style={{fontSize:13,fontWeight:700,color:"#dc2626"}}>🚫 {expired.length} item{expired.length>1?"s":""} expired: {expired.map(i=>i.name).join(", ")}</span>
        </div>
      )}

      {/* ── SEARCH ── */}
      <div style={{position:"relative"}}>
        <span style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",fontSize:16,opacity:0.5}}>🔍</span>
        <input
          placeholder="Search pantry items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{width:"100%",padding:"13px 16px 13px 44px",border:"1.5px solid rgba(139,94,60,0.12)",borderRadius:14,fontSize:14,background:"white",color:"#1a1410",outline:"none",boxSizing:"border-box",boxShadow:"0 2px 12px rgba(139,94,60,0.06)"}}
        />
      </div>

      {/* ── CATEGORY FILTER ── */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {CATEGORIES.map(c => {
          const isActive = activecat === c.name;
          const count    = c.name === "All Items" ? items.length : items.filter(i=>i.category===c.name).length;
          return (
            <button key={c.name} onClick={() => setActiveCat(c.name)} style={{
              display:"flex",alignItems:"center",gap:6,
              padding:"8px 16px",border:"none",borderRadius:50,fontSize:12,fontWeight:700,cursor:"pointer",transition:"all 0.2s",
              background: isActive ? c.color : "white",
              color:       isActive ? "white" : "#5c4a35",
              boxShadow:   isActive ? `0 4px 14px ${c.color}40` : "0 1px 6px rgba(139,94,60,0.08)",
            }}>
              <span>{c.icon}</span>
              {c.name}
              {count > 0 && <span style={{fontSize:10,background:isActive?"rgba(255,255,255,0.25)":"rgba(139,94,60,0.1)",borderRadius:50,padding:"1px 6px"}}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* ── ITEMS GRID ── */}
      {filtered.length === 0 ? (
        <div style={{background:"white",borderRadius:20,padding:50,textAlign:"center",boxShadow:"0 4px 20px rgba(139,94,60,0.07)"}}>
          <span style={{fontSize:48,display:"block",marginBottom:12}}>🥫</span>
          <p style={{fontSize:16,fontWeight:700,color:"#1a1410",marginBottom:6}}>
            {items.length === 0 ? "Pantry is empty" : "No items match your filter"}
          </p>
          <p style={{fontSize:13,color:"#9c8672",marginBottom:20}}>
            {items.length === 0 ? "Add groceries to start tracking your inventory" : "Try a different search or category"}
          </p>
          {items.length === 0 && (
            <button onClick={openAdd} style={{padding:"13px 24px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",border:"none",borderRadius:14,fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 16px rgba(255,107,43,0.3)"}}>
              + Add First Item
            </button>
          )}
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
          {filtered.map((item, i) => {
            const catData  = CATEGORIES.find(c => c.name === item.category) || CATEGORIES[CATEGORIES.length-1];
            const isLow    = item.quantity <= (item.lowStockThreshold || 1);
            const expDays  = daysUntilExpiry(item.expiryDate);
            const isExpired = expDays !== null && expDays <= 0;
            const isExpiring = expDays !== null && expDays > 0 && expDays <= 7;
            const isHov    = hovered === item._id;

            return (
              <div key={item._id}
                onMouseEnter={() => setHovered(item._id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background:"white",borderRadius:18,overflow:"hidden",position:"relative",
                  boxShadow: isHov ? `0 20px 40px rgba(0,0,0,0.12),0 0 0 2px ${catData.color}30` : "0 3px 14px rgba(139,94,60,0.08)",
                  transform: isHov ? "perspective(600px) rotateY(-2deg) translateY(-4px)" : "perspective(600px) rotateY(0) translateY(0)",
                  transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                  opacity: isExpired ? 0.65 : 1,
                }}>

                {/* Color top bar */}
                <div style={{height:4,background:`linear-gradient(90deg,${catData.color},${catData.color}66)`}}/>

                {/* Status badges */}
                {(isLow || isExpiring || isExpired) && (
                  <div style={{position:"absolute",top:12,right:12,zIndex:2,display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end"}}>
                    {isExpired  && <span style={{fontSize:9,background:"#dc2626",color:"white",borderRadius:50,padding:"2px 8px",fontWeight:800}}>EXPIRED</span>}
                    {isExpiring && <span style={{fontSize:9,background:"#f59e0b",color:"white",borderRadius:50,padding:"2px 8px",fontWeight:800}}>EXP {expDays}d</span>}
                    {isLow      && <span style={{fontSize:9,background:"rgba(211,47,47,0.9)",color:"white",borderRadius:50,padding:"2px 8px",fontWeight:800}}>LOW</span>}
                  </div>
                )}

                <div style={{padding:"16px 16px 14px"}}>
                  {/* Icon + name */}
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                    <div style={{width:44,height:44,borderRadius:12,background:`${catData.color}12`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                      {catData.icon}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:800,color:"#1a1410",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                      <div style={{fontSize:11,color:"#9c8672",marginTop:1}}>{catData.name}</div>
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <button onClick={() => updateQty(item,-1)} style={{width:26,height:26,borderRadius:"50%",border:`1px solid ${catData.color}30`,background:`${catData.color}08`,color:catData.color,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,transition:"all 0.2s"}}
                        onMouseEnter={e=>{e.currentTarget.style.background=catData.color;e.currentTarget.style.color="white";}}
                        onMouseLeave={e=>{e.currentTarget.style.background=`${catData.color}08`;e.currentTarget.style.color=catData.color;}}>−</button>
                      <span style={{fontSize:18,fontWeight:900,color:isLow?"#d32f2f":catData.color,minWidth:40,textAlign:"center"}}>
                        {item.quantity}
                      </span>
                      <button onClick={() => updateQty(item,1)} style={{width:26,height:26,borderRadius:"50%",border:`1px solid ${catData.color}30`,background:`${catData.color}08`,color:catData.color,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,transition:"all 0.2s"}}
                        onMouseEnter={e=>{e.currentTarget.style.background=catData.color;e.currentTarget.style.color="white";}}
                        onMouseLeave={e=>{e.currentTarget.style.background=`${catData.color}08`;e.currentTarget.style.color=catData.color;}}>+</button>
                    </div>
                    <span style={{fontSize:12,color:"#9c8672",fontWeight:600}}>{item.unit}</span>
                  </div>

                  {/* Stock bar */}
                  <div style={{marginBottom:10}}>
                    <div style={{height:4,background:"rgba(139,94,60,0.1)",borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",borderRadius:2,transition:"width 0.5s ease",
                        background:isLow?"#dc2626":catData.color,
                        width:`${Math.min(100, (item.quantity/(item.lowStockThreshold||1))*50)}%`
                      }}/>
                    </div>
                  </div>

                  {/* Expiry + actions */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:10,color:isExpiring?"#f59e0b":isExpired?"#dc2626":"#9c8672",fontWeight:isExpiring||isExpired?700:400}}>
                      {item.expiryDate ? `Exp: ${new Date(item.expiryDate).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}` : "No expiry set"}
                    </span>
                    <div style={{display:"flex",gap:4}}>
                      <button onClick={() => openEdit(item)} style={{width:26,height:26,borderRadius:"50%",border:"1px solid rgba(139,94,60,0.12)",background:"rgba(139,94,60,0.04)",color:"#9c8672",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}
                        onMouseEnter={e=>{e.currentTarget.style.background="#ff6b2b";e.currentTarget.style.color="white";}}
                        onMouseLeave={e=>{e.currentTarget.style.background="rgba(139,94,60,0.04)";e.currentTarget.style.color="#9c8672";}}>✏️</button>
                      <button onClick={() => deleteItem(item._id, item.name)} style={{width:26,height:26,borderRadius:"50%",border:"1px solid rgba(211,47,47,0.12)",background:"rgba(211,47,47,0.04)",color:"#d32f2f",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}
                        onMouseEnter={e=>{e.currentTarget.style.background="#d32f2f";e.currentTarget.style.color="white";}}
                        onMouseLeave={e=>{e.currentTarget.style.background="rgba(211,47,47,0.04)";e.currentTarget.style.color="#d32f2f";}}>✕</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add more card */}
          <button onClick={openAdd} style={{border:"2px dashed rgba(255,107,43,0.25)",borderRadius:18,background:"white",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,padding:24,minHeight:180,transition:"all 0.3s ease"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="#ff6b2b";e.currentTarget.style.background="rgba(255,107,43,0.03)";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,107,43,0.25)";e.currentTarget.style.background="white";}}>
            <div style={{width:48,height:48,borderRadius:"50%",background:"rgba(255,107,43,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#ff6b2b"}}>+</div>
            <span style={{fontSize:13,fontWeight:700,color:"#ff6b2b"}}>Add Item</span>
          </button>
        </div>
      )}

      {/* ── ADD / EDIT MODAL ── */}
      {showForm && (
        <div style={{position:"fixed",inset:0,background:"rgba(26,20,16,0.65)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}}
          onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div style={{background:"white",borderRadius:24,padding:28,width:"100%",maxWidth:460,boxShadow:"0 32px 80px rgba(0,0,0,0.25)",margin:20,maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
              <h3 style={{fontSize:18,fontWeight:800,color:"#1a1410",margin:0,fontFamily:"'Playfair Display',serif"}}>
                {editItem ? "✏️ Edit Item" : "➕ Add to Pantry"}
              </h3>
              <button onClick={()=>setShowForm(false)} style={{background:"rgba(139,94,60,0.08)",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:14}}>✕</button>
            </div>
            <form onSubmit={saveItem} style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={{fontSize:11,fontWeight:700,color:"#5c4a35",textTransform:"uppercase",letterSpacing:"0.04em"}}>Item Name *</label>
                <input placeholder="e.g. Onions, Rice, Milk..." value={form.name}
                  onChange={e=>setForm({...form,name:e.target.value,category:guessCategory(e.target.value)||form.category})}
                  style={{padding:"12px 14px",border:"1.5px solid rgba(139,94,60,0.15)",borderRadius:12,fontSize:14,background:"#fdf8f3",color:"#1a1410",outline:"none"}} required autoFocus/>
              </div>
              <div style={{display:"flex",gap:12}}>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                  <label style={{fontSize:11,fontWeight:700,color:"#5c4a35",textTransform:"uppercase",letterSpacing:"0.04em"}}>Quantity</label>
                  <input type="number" step="0.01" placeholder="1" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}
                    style={{padding:"12px 14px",border:"1.5px solid rgba(139,94,60,0.15)",borderRadius:12,fontSize:14,background:"#fdf8f3",color:"#1a1410",outline:"none"}}/>
                </div>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                  <label style={{fontSize:11,fontWeight:700,color:"#5c4a35",textTransform:"uppercase",letterSpacing:"0.04em"}}>Unit</label>
                  <select value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}
                    style={{padding:"12px 14px",border:"1.5px solid rgba(139,94,60,0.15)",borderRadius:12,fontSize:14,background:"#fdf8f3",color:"#1a1410",outline:"none"}}>
                    {UNITS.map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:"flex",gap:12}}>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                  <label style={{fontSize:11,fontWeight:700,color:"#5c4a35",textTransform:"uppercase",letterSpacing:"0.04em"}}>Category</label>
                  <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}
                    style={{padding:"12px 14px",border:"1.5px solid rgba(139,94,60,0.15)",borderRadius:12,fontSize:14,background:"#fdf8f3",color:"#1a1410",outline:"none"}}>
                    {CATEGORIES.slice(1).map(c=><option key={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                  <label style={{fontSize:11,fontWeight:700,color:"#5c4a35",textTransform:"uppercase",letterSpacing:"0.04em"}}>Low Stock Alert</label>
                  <input type="number" step="0.1" placeholder="1" value={form.lowStockThreshold} onChange={e=>setForm({...form,lowStockThreshold:e.target.value})}
                    style={{padding:"12px 14px",border:"1.5px solid rgba(139,94,60,0.15)",borderRadius:12,fontSize:14,background:"#fdf8f3",color:"#1a1410",outline:"none"}}/>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={{fontSize:11,fontWeight:700,color:"#5c4a35",textTransform:"uppercase",letterSpacing:"0.04em"}}>Expiry Date (optional)</label>
                <input type="date" value={form.expiryDate} onChange={e=>setForm({...form,expiryDate:e.target.value})}
                  style={{padding:"12px 14px",border:"1.5px solid rgba(139,94,60,0.15)",borderRadius:12,fontSize:14,background:"#fdf8f3",color:"#1a1410",outline:"none"}}/>
              </div>
              <button type="submit" style={{padding:"14px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",border:"none",borderRadius:14,fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:"0 6px 20px rgba(255,107,43,0.3)",marginTop:4}}>
                {editItem ? "Save Changes" : "Add to Pantry"}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        input:focus,select:focus{outline:none!important;border-color:#ff6b2b!important;box-shadow:0 0 0 3px rgba(255,107,43,0.1)!important;}
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}