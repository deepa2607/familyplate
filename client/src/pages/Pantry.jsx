// Pantry.jsx — HomeHub Smart Kitchen (3D ANIMATED REDESIGN)
import { useEffect, useState, useCallback, useRef } from "react";
import API from "../api/axios";
import { useToast } from "../components/Toast";

const CATS = [
  { name:"All Items",  icon:"🛒", color:"#ff6b2b", grad:"linear-gradient(135deg,#ff6b2b,#ff8c54)" },
  { name:"Vegetables", icon:"🥦", color:"#16a34a", grad:"linear-gradient(135deg,#15803d,#22c55e)" },
  { name:"Fruits",     icon:"🍎", color:"#dc2626", grad:"linear-gradient(135deg,#b91c1c,#ef4444)" },
  { name:"Grains",     icon:"🌾", color:"#d97706", grad:"linear-gradient(135deg,#b45309,#f59e0b)" },
  { name:"Dairy",      icon:"🥛", color:"#2563eb", grad:"linear-gradient(135deg,#1d4ed8,#3b82f6)" },
  { name:"Spices",     icon:"🌶️", color:"#b45309", grad:"linear-gradient(135deg,#92400e,#d97706)" },
  { name:"Proteins",   icon:"🍗", color:"#7c3aed", grad:"linear-gradient(135deg,#6d28d9,#8b5cf6)" },
  { name:"Oils",       icon:"🫗",  color:"#ca8a04", grad:"linear-gradient(135deg,#a16207,#eab308)" },
  { name:"Other",      icon:"📦", color:"#64748b", grad:"linear-gradient(135deg,#475569,#94a3b8)" },
];
const UNITS = ["kg","g","L","ml","pcs","pieces","packets","bunches","dozen"];

const FRUIT_RE   = /banana|apple|mango|orange|lemon|lime|grape|papaya|pear|guava|watermelon|strawberry|kiwi|cherry|coconut|pineapple/i;
const VEG_RE     = /tomato|onion|potato|spinach|carrot|capsicum|cucumber|cabbage|cauliflower|broccoli|garlic|ginger|peas?|beans?|okra|brinjal|zucchini|pumpkin|gourd|radish|corn|chilli|chili|pepper/i;
const GRAIN_RE   = /rice|wheat|atta|flour|maida|suji|semolina|poha|oats?|barley|ragi|pasta|bread|cereal|dal|lentil|rajma|chana|chickpea|moong|toor|urad/i;
const DAIRY_RE   = /milk|curd|paneer|butter|ghee|cheese|cream|yogurt|lassi/i;
const SPICE_RE   = /turmeric|cumin|coriander|mustard|fenugreek|cardamom|clove|cinnamon|masala|chilli powder|bay leaf|curry leaves?|asafoetida|hing|ajwain|saffron|salt|sugar/i;
const PROTEIN_RE = /chicken|mutton|fish|egg|prawn|shrimp|tofu|soy|meat|beef|pork|turkey|salmon|tuna/i;
const OIL_RE     = /\boil\b|sunflower oil|mustard oil|groundnut oil|coconut oil|olive oil/i;

function resolveCategory(name, cart) {
  const n = (name||"").toLowerCase();
  if (FRUIT_RE.test(n))   return "Fruits";
  if (VEG_RE.test(n))     return "Vegetables";
  if (GRAIN_RE.test(n))   return "Grains";
  if (DAIRY_RE.test(n))   return "Dairy";
  if (OIL_RE.test(n))     return "Oils";
  if (SPICE_RE.test(n))   return "Spices";
  if (PROTEIN_RE.test(n)) return "Proteins";
  const c = (cart||"").toLowerCase();
  if (c.includes("vegetable")) return "Vegetables";
  if (c.includes("fruit"))     return "Fruits";
  if (c.includes("grain")||c.includes("staple")||c.includes("bakery")) return "Grains";
  if (c.includes("dairy")||c.includes("egg")) return "Dairy";
  if (c.includes("oil"))       return "Oils";
  if (c.includes("spice"))     return "Spices";
  if (c.includes("meat")||c.includes("seafood")||c.includes("protein")) return "Proteins";
  const valid = CATS.slice(1).map(c=>c.name);
  if (valid.includes(cart)) return cart;
  return "Other";
}

function daysUntilExpiry(d) { return d ? Math.ceil((new Date(d)-new Date())/86400000) : null; }
const fmtDate = d => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short"}) : null;

// ── 3D Tilt Card Hook ────────────────────────────────────────────────────
function useTilt(intensity=8) {
  const ref = useRef(null);
  const onMove = e => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    el.style.transform = `perspective(600px) rotateY(${x*intensity}deg) rotateX(${-y*intensity}deg) translateZ(8px)`;
    el.style.boxShadow = `${-x*12}px ${y*12}px 40px rgba(0,0,0,0.18), 0 0 0 1.5px rgba(255,107,43,0.15)`;
  };
  const onLeave = e => {
    const el = ref.current; if (!el) return;
    el.style.transform = "perspective(600px) rotateY(0) rotateX(0) translateZ(0)";
    el.style.boxShadow = "0 3px 14px rgba(139,94,60,0.08)";
  };
  return { ref, onMouseMove:onMove, onMouseLeave:onLeave };
}

// ── Animated counter ─────────────────────────────────────────────────────
function AnimCounter({ value, duration=800 }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const end = Number(value)||0, start=performance.now();
    const go = now => {
      const p=Math.min((now-start)/duration,1), ease=1-Math.pow(1-p,3);
      setDisplay(Math.round(ease*end));
      if(p<1) raf.current=requestAnimationFrame(go);
    };
    raf.current=requestAnimationFrame(go);
    return ()=>cancelAnimationFrame(raf.current);
  },[value]);
  return <span>{display}</span>;
}

// ── 3D Item Card ─────────────────────────────────────────────────────────
function PantryCard({ item, catData, onEdit, onDelete, onQtyChange }) {
  const tilt = useTilt(6);
  const isLow    = (item.quantity||0) <= (item.lowStockThreshold||1);
  const expD     = daysUntilExpiry(item.expiryDate);
  const isExp    = expD!==null && expD<=0;
  const isExpSoon= expD!==null && expD>0 && expD<=7;
  const pct      = Math.min(100, ((item.quantity||0)/(item.lowStockThreshold||1))*50);

  return (
    <div {...tilt} style={{
      background:"white", borderRadius:20, overflow:"hidden",
      position:"relative", transition:"transform 0.15s, box-shadow 0.15s",
      opacity:isExp?0.55:1, cursor:"default",
      boxShadow:"0 3px 14px rgba(139,94,60,0.08)",
      border:"1px solid rgba(139,94,60,0.06)",
    }}>
      {/* Category gradient top strip */}
      <div style={{height:5,background:catData.grad,position:"relative"}}>
        {/* Shimmer animation */}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)",animation:"shimmer 2.5s infinite"}}/>
      </div>

      {/* Status badges */}
      {(isLow||isExpSoon||isExp) && (
        <div style={{position:"absolute",top:14,right:10,display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end",zIndex:2}}>
          {isExp   && <span style={{fontSize:8,background:"#dc2626",color:"white",borderRadius:50,padding:"2px 7px",fontWeight:800,boxShadow:"0 2px 6px rgba(220,38,38,0.4)"}}>EXPIRED</span>}
          {isExpSoon&&<span style={{fontSize:8,background:"#f59e0b",color:"white",borderRadius:50,padding:"2px 7px",fontWeight:800,boxShadow:"0 2px 6px rgba(245,158,11,0.4)"}}>EXP {expD}d</span>}
          {isLow   && <span style={{fontSize:8,background:catData.color,color:"white",borderRadius:50,padding:"2px 7px",fontWeight:800,boxShadow:`0 2px 6px ${catData.color}60`}}>LOW</span>}
        </div>
      )}

      <div style={{padding:"14px 14px 12px"}}>
        {/* Icon + name */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <div style={{
            width:46,height:46,borderRadius:14,flexShrink:0,
            background:catData.grad,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:22,boxShadow:`0 4px 12px ${catData.color}40`,
            transition:"transform 0.2s",
          }}>
            {catData.icon}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:800,color:"#1a1410",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
            <div style={{fontSize:10,color:catData.color,fontWeight:700,marginTop:1}}>{catData.name}</div>
          </div>
        </div>

        {/* Quantity controls */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <button onClick={()=>onQtyChange(item,-1)} style={{
              width:26,height:26,borderRadius:"50%",border:`1.5px solid ${catData.color}40`,
              background:`${catData.color}10`,color:catData.color,fontSize:16,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,
              transition:"all 0.15s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.background=catData.color;e.currentTarget.style.color="white";e.currentTarget.style.transform="scale(1.1)";}}
            onMouseLeave={e=>{e.currentTarget.style.background=`${catData.color}10`;e.currentTarget.style.color=catData.color;e.currentTarget.style.transform="scale(1)";}}>−</button>
            <span style={{fontSize:19,fontWeight:900,color:isLow?"#d32f2f":catData.color,minWidth:36,textAlign:"center",fontFamily:"'DM Mono',monospace"}}>
              {item.quantity}
            </span>
            <button onClick={()=>onQtyChange(item,1)} style={{
              width:26,height:26,borderRadius:"50%",border:`1.5px solid ${catData.color}40`,
              background:`${catData.color}10`,color:catData.color,fontSize:16,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,
              transition:"all 0.15s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.background=catData.color;e.currentTarget.style.color="white";e.currentTarget.style.transform="scale(1.1)";}}
            onMouseLeave={e=>{e.currentTarget.style.background=`${catData.color}10`;e.currentTarget.style.color=catData.color;e.currentTarget.style.transform="scale(1)";}}>+</button>
          </div>
          <span style={{fontSize:11,color:"#9c8672",fontWeight:700,background:"rgba(139,94,60,0.06)",padding:"3px 8px",borderRadius:50}}>{item.unit}</span>
        </div>

        {/* Animated stock bar */}
        <div style={{height:5,background:"rgba(139,94,60,0.08)",borderRadius:3,overflow:"hidden",marginBottom:10}}>
          <div style={{
            height:"100%",background:isLow?"linear-gradient(90deg,#dc2626,#ef4444)":catData.grad,
            borderRadius:3,width:`${pct}%`,
            transition:"width 0.6s cubic-bezier(0.4,0,0.2,1)",
            boxShadow:isLow?"0 0 6px rgba(220,38,38,0.5)":"none",
          }}/>
        </div>

        {/* Expiry + actions */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{
            fontSize:9,fontWeight:isExpSoon||isExp?700:400,
            color:isExpSoon?"#f59e0b":isExp?"#dc2626":"#b0a090",
          }}>
            {item.expiryDate ? `Exp: ${fmtDate(item.expiryDate)}` : "No expiry"}
          </span>
          <div style={{display:"flex",gap:4}}>
            <button onClick={()=>onEdit(item)} style={{
              width:26,height:26,borderRadius:"50%",border:"1px solid rgba(255,107,43,0.15)",
              background:"rgba(255,107,43,0.06)",fontSize:11,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.background="#ff6b2b";e.currentTarget.style.color="white";}}
            onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,107,43,0.06)";e.currentTarget.style.color="";}}>✏️</button>
            <button onClick={()=>onDelete(item._id,item.name)} style={{
              width:26,height:26,borderRadius:"50%",border:"1px solid rgba(220,38,38,0.15)",
              background:"rgba(220,38,38,0.06)",color:"#d32f2f",fontSize:11,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.background="#d32f2f";e.currentTarget.style.color="white";}}
            onMouseLeave={e=>{e.currentTarget.style.background="rgba(220,38,38,0.06)";e.currentTarget.style.color="#d32f2f";}}>✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Pantry() {
  const toast = useToast();
  const [household,  setHousehold]  = useState(null);
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [activeCat,  setActiveCat]  = useState("All Items");
  const [showForm,   setShowForm]   = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [cartBanner, setCartBanner] = useState(false);
  const [form, setForm] = useState({ name:"", quantity:"1", unit:"kg", category:"Vegetables", expiryDate:"", lowStockThreshold:"1" });

  useEffect(() => {
    const fn = () => { setCartBanner(true); setTimeout(()=>setCartBanner(false),4000); load(); };
    window.addEventListener("pantryUpdated", fn);
    const raw = localStorage.getItem("homehub_cart_checkout");
    if (raw) { try { if(JSON.parse(raw).length>0){setCartBanner(true);setTimeout(()=>setCartBanner(false),4000);} } catch {} localStorage.removeItem("homehub_cart_checkout"); }
    return () => window.removeEventListener("pantryUpdated", fn);
  }, []);

  useEffect(() => { load(); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const hh = await API.get("/household/myhousehold");
      if (hh.data) {
        setHousehold(hh.data);
        const pr = await API.get(`/pantry/${hh.data._id}`);
        setItems((pr.data||[]).map(i=>({...i,category:resolveCategory(i.name,i.category)})));
      }
    } catch {}
    setLoading(false);
  }, []);

  const openAdd  = () => { setEditItem(null); setForm({name:"",quantity:"1",unit:"kg",category:"Vegetables",expiryDate:"",lowStockThreshold:"1"}); setShowForm(true); };
  const openEdit = item => { setEditItem(item); setForm({name:item.name||"",quantity:String(item.quantity||1),unit:item.unit||"kg",category:item.category||"Vegetables",expiryDate:item.expiryDate?new Date(item.expiryDate).toISOString().split("T")[0]:"",lowStockThreshold:String(item.lowStockThreshold||1)}); setShowForm(true); };

  const saveItem = async e => {
    e.preventDefault();
    if (!form.name.trim()) { toast("Enter item name","warning"); return; }
    const p = { householdId:household._id, name:form.name.trim(), quantity:parseFloat(form.quantity)||1, unit:form.unit, category:form.category, expiryDate:form.expiryDate||null, lowStockThreshold:parseFloat(form.lowStockThreshold)||1 };
    try {
      if (editItem) { await API.put(`/pantry/${editItem._id}`,p); toast(`${form.name} updated ✅`,"success"); }
      else { await API.post("/pantry",p); toast(`${form.name} added! 🥦`,"success"); }
      setShowForm(false); setEditItem(null); await load();
    } catch(e) { toast(e.response?.data?.message||"Failed","error"); }
  };

  const deleteItem = async (id,name) => {
    if (!window.confirm(`Remove "${name}"?`)) return;
    try { await API.delete(`/pantry/${id}`); setItems(prev=>prev.filter(i=>i._id!==id)); toast(`${name} removed`,"info"); }
    catch { toast("Failed","error"); }
  };

  const updateQty = async (item,delta) => {
    const nq = Math.max(0,(item.quantity||0)+delta);
    try { await API.put(`/pantry/${item._id}`,{...item,quantity:nq,householdId:household._id}); setItems(prev=>prev.map(i=>i._id===item._id?{...i,quantity:nq}:i)); }
    catch { toast("Failed","error"); }
  };

  const lowStock    = items.filter(i=>(i.quantity||0)<=(i.lowStockThreshold||1));
  const expiringSoon= items.filter(i=>{const d=daysUntilExpiry(i.expiryDate);return d!==null&&d>0&&d<=7;});
  const expired     = items.filter(i=>{const d=daysUntilExpiry(i.expiryDate);return d!==null&&d<=0;});
  const catCounts   = items.reduce((a,i)=>({...a,[i.category||"Other"]:(a[i.category||"Other"]||0)+1}),{});

  const filtered = items
    .filter(i=>(activeCat==="All Items"||i.category===activeCat)&&(!search||i.name?.toLowerCase().includes(search.toLowerCase())))
    .sort((a,b)=>{
      const aL=(a.quantity||0)<=(a.lowStockThreshold||1), bL=(b.quantity||0)<=(b.lowStockThreshold||1);
      if(aL&&!bL) return -1; if(!aL&&bL) return 1;
      return (a.name||"").localeCompare(b.name||"");
    });

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60vh",flexDirection:"column",gap:16}}>
      {/* 3D spinning pantry jar */}
      <div style={{position:"relative",width:60,height:60}}>
        <div style={{width:60,height:60,border:"4px solid rgba(255,107,43,0.15)",borderTop:"4px solid #ff6b2b",borderRadius:"50%",animation:"spin 0.9s linear infinite"}}/>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🥦</div>
      </div>
      <p style={{color:"#5c4a35",fontWeight:700,fontSize:14}}>Loading pantry…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20,paddingBottom:32}}>

      {/* Cart banner */}
      {cartBanner&&<div style={{background:"linear-gradient(135deg,#16a34a,#22c55e)",borderRadius:16,padding:"13px 18px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 4px 18px rgba(22,163,74,0.35)",animation:"slideDown 0.3s ease"}}><span style={{fontSize:22}}>🥦</span><div><p style={{margin:0,fontSize:13,fontWeight:800,color:"white"}}>Pantry updated from cart!</p><p style={{margin:0,fontSize:11,color:"rgba(255,255,255,0.8)"}}>Purchased items added automatically.</p></div></div>}

      {/* ── HERO with animated stats ── */}
      <div style={{position:"relative",borderRadius:24,overflow:"hidden",height:220,boxShadow:"0 20px 60px rgba(0,0,0,0.22)"}}>
        <img src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80" alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(10,6,3,0.92),rgba(10,6,3,0.5))"}}/>
        {/* Animated gradient orbs */}
        <div style={{position:"absolute",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(22,163,74,0.22),transparent 70%)",top:-60,left:-60,animation:"pulse 3s ease-in-out infinite",pointerEvents:"none"}}/>
        <div style={{position:"absolute",width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,107,43,0.18),transparent 70%)",bottom:-40,right:80,animation:"pulse 3s ease-in-out infinite 1.5s",pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:2,padding:"28px 36px",height:"100%",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:38,fontWeight:800,color:"white",margin:"0 0 4px",letterSpacing:"-0.5px"}}>Pantry</h1>
              <p style={{fontSize:12,color:"rgba(255,255,255,0.45)",margin:0}}>{household?.name} · Your kitchen inventory</p>
            </div>
            <button onClick={openAdd} style={{padding:"12px 22px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",border:"none",borderRadius:14,fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 20px rgba(255,107,43,0.5)",transition:"transform 0.2s"}}
              onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px) scale(1.03)"}
              onMouseLeave={e=>e.currentTarget.style.transform=""}>
              + Add Item
            </button>
          </div>
          <div style={{display:"flex",gap:32,alignItems:"flex-end"}}>
            {[{l:"Total Items",v:items.length,c:"#ffaa70"},{l:"Low Stock",v:lowStock.length,c:"#f87171"},{l:"Categories",v:Object.keys(catCounts).length,c:"#a5d6a7"}].map(({l,v,c})=>(
              <div key={l}>
                <span style={{display:"block",fontSize:28,fontWeight:900,color:c,letterSpacing:"-1px",fontFamily:"'DM Mono',monospace"}}><AnimCounter value={v}/></span>
                <span style={{fontSize:10,color:"rgba(255,255,255,0.4)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>{l}</span>
              </div>
            ))}
            {expiringSoon.length>0&&<div style={{background:"rgba(251,191,36,0.15)",borderRadius:12,padding:"8px 14px",border:"1px solid rgba(251,191,36,0.35)",animation:"pulse 2s infinite"}}><span style={{fontSize:12,fontWeight:700,color:"#fbbf24"}}>⚠️ {expiringSoon.length} expiring soon</span></div>}
          </div>
        </div>
      </div>

      {/* Low stock */}
      {lowStock.length>0&&<div style={{background:"white",borderRadius:16,padding:"14px 18px",boxShadow:"0 2px 12px rgba(139,94,60,0.07)",border:"1px solid rgba(220,38,38,0.1)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><span style={{fontSize:16}}>🔔</span><h3 style={{fontSize:13,fontWeight:800,color:"#1a1410",margin:0}}>Low Stock — Reorder Soon</h3></div>
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{lowStock.map(i=><div key={i._id} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",background:"rgba(220,38,38,0.06)",borderRadius:50,border:"1px solid rgba(220,38,38,0.15)",cursor:"default"}}><span style={{fontSize:12,fontWeight:700,color:"#1a1410"}}>{i.name}</span><span style={{fontSize:10,color:"#d32f2f",fontWeight:600}}>{i.quantity}{i.unit} left</span></div>)}</div>
      </div>}

      {/* Expired */}
      {expired.length>0&&<div style={{background:"rgba(220,38,38,0.05)",borderRadius:14,padding:"12px 18px",border:"1px solid rgba(220,38,38,0.15)"}}><span style={{fontSize:12,fontWeight:700,color:"#dc2626"}}>🚫 Expired: {expired.map(i=>i.name).join(", ")}</span></div>}

      {/* Search */}
      <div style={{position:"relative"}}><span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:15,opacity:0.4}}>🔍</span><input placeholder="Search pantry items…" value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",padding:"12px 14px 12px 42px",border:"1.5px solid rgba(139,94,60,0.12)",borderRadius:12,fontSize:13,background:"white",color:"#1a1410",outline:"none",boxSizing:"border-box",boxShadow:"0 2px 10px rgba(139,94,60,0.05)",transition:"border 0.2s"}} onFocus={e=>e.target.style.borderColor="#ff6b2b"} onBlur={e=>e.target.style.borderColor="rgba(139,94,60,0.12)"}/></div>

      {/* ── Category tabs — 3D pill effect ── */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {CATS.map(c=>{
          const count=c.name==="All Items"?items.length:(catCounts[c.name]||0);
          const isA=activeCat===c.name;
          return <button key={c.name} onClick={()=>setActiveCat(c.name)} style={{
            display:"flex",alignItems:"center",gap:5,padding:"8px 16px",border:"none",borderRadius:50,fontSize:12,fontWeight:700,cursor:"pointer",
            background:isA?c.grad:"white",color:isA?"white":"#5c4a35",
            boxShadow:isA?`0 4px 16px ${c.color}50, 0 1px 0 rgba(255,255,255,0.3) inset`:"0 1px 6px rgba(139,94,60,0.07)",
            transform:isA?"translateY(-2px)":"translateY(0)",transition:"all 0.2s",
          }}>
            <span style={{filter:isA?"none":"grayscale(0.3)"}}>{c.icon}</span>
            {c.name}
            {count>0&&<span style={{fontSize:10,background:isA?"rgba(255,255,255,0.28)":"rgba(139,94,60,0.1)",borderRadius:50,padding:"1px 7px",fontWeight:800}}>{count}</span>}
          </button>;
        })}
      </div>

      {/* ── Items 3D Grid ── */}
      {filtered.length===0?(
        <div style={{background:"white",borderRadius:20,padding:50,textAlign:"center",boxShadow:"0 4px 18px rgba(139,94,60,0.07)"}}>
          <span style={{fontSize:48,display:"block",marginBottom:12}}>🥫</span>
          <p style={{fontSize:15,fontWeight:700,color:"#1a1410",marginBottom:5}}>{items.length===0?"Pantry is empty":"No items in this category"}</p>
          <p style={{fontSize:12,color:"#9c8672",marginBottom:20}}>{items.length===0?"Add groceries to start tracking":"Try 'All Items' to see everything"}</p>
          {items.length===0&&<button onClick={openAdd} style={{padding:"12px 24px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",border:"none",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px rgba(255,107,43,0.35)"}}>+ Add First Item</button>}
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16,perspective:"1000px"}}>
          {filtered.map(item=>{
            const cd=CATS.find(c=>c.name===item.category)||CATS[CATS.length-1];
            return <PantryCard key={item._id} item={item} catData={cd} onEdit={openEdit} onDelete={deleteItem} onQtyChange={updateQty}/>;
          })}
          {/* Add card */}
          <button onClick={openAdd} style={{border:"2px dashed rgba(255,107,43,0.25)",borderRadius:20,background:"white",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,padding:24,minHeight:180,transition:"all 0.25s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="#ff6b2b";e.currentTarget.style.background="rgba(255,107,43,0.03)";e.currentTarget.style.transform="translateY(-3px)";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,107,43,0.25)";e.currentTarget.style.background="white";e.currentTarget.style.transform="";}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:"rgba(255,107,43,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,color:"#ff6b2b",transition:"transform 0.2s"}}>+</div>
            <span style={{fontSize:12,fontWeight:700,color:"#ff6b2b"}}>Add Item</span>
          </button>
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {showForm&&<div style={{position:"fixed",inset:0,background:"rgba(26,20,16,0.65)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(10px)"}} onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
        <div style={{background:"white",borderRadius:24,padding:28,width:"100%",maxWidth:440,boxShadow:"0 32px 80px rgba(0,0,0,0.3)",margin:16,maxHeight:"90vh",overflowY:"auto",animation:"modalIn 0.25s ease"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}><h3 style={{fontSize:18,fontWeight:800,color:"#1a1410",margin:0,fontFamily:"'Playfair Display',serif"}}>{editItem?"✏️ Edit Item":"➕ Add to Pantry"}</h3><button onClick={()=>setShowForm(false)} style={{background:"rgba(139,94,60,0.07)",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:14}}>✕</button></div>
          <form onSubmit={saveItem} style={{display:"flex",flexDirection:"column",gap:14}}>
            <div><label style={{fontSize:10,fontWeight:700,color:"#5c4a35",textTransform:"uppercase",letterSpacing:"0.04em",display:"block",marginBottom:6}}>Item Name *</label><input placeholder="e.g. Onions, Rice, Mango…" value={form.name} onChange={e=>setForm({...form,name:e.target.value,category:resolveCategory(e.target.value,"")||form.category})} style={{width:"100%",padding:"12px 14px",border:"1.5px solid rgba(139,94,60,0.14)",borderRadius:12,fontSize:14,background:"#fdf8f3",color:"#1a1410",outline:"none",boxSizing:"border-box"}} required autoFocus onFocus={e=>e.target.style.borderColor="#ff6b2b"} onBlur={e=>e.target.style.borderColor="rgba(139,94,60,0.14)"}/></div>
            <div style={{display:"flex",gap:12}}>
              <div style={{flex:1}}><label style={{fontSize:10,fontWeight:700,color:"#5c4a35",textTransform:"uppercase",letterSpacing:"0.04em",display:"block",marginBottom:6}}>Quantity</label><input type="number" step="0.01" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} style={{width:"100%",padding:"12px 14px",border:"1.5px solid rgba(139,94,60,0.14)",borderRadius:12,fontSize:14,background:"#fdf8f3",color:"#1a1410",outline:"none",boxSizing:"border-box"}} onFocus={e=>e.target.style.borderColor="#ff6b2b"} onBlur={e=>e.target.style.borderColor="rgba(139,94,60,0.14)"}/></div>
              <div style={{flex:1}}><label style={{fontSize:10,fontWeight:700,color:"#5c4a35",textTransform:"uppercase",letterSpacing:"0.04em",display:"block",marginBottom:6}}>Unit</label><select value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} style={{width:"100%",padding:"12px 14px",border:"1.5px solid rgba(139,94,60,0.14)",borderRadius:12,fontSize:14,background:"#fdf8f3",color:"#1a1410",outline:"none",boxSizing:"border-box"}}>{UNITS.map(u=><option key={u}>{u}</option>)}</select></div>
            </div>
            <div style={{display:"flex",gap:12}}>
              <div style={{flex:1}}><label style={{fontSize:10,fontWeight:700,color:"#5c4a35",textTransform:"uppercase",letterSpacing:"0.04em",display:"block",marginBottom:6}}>Category</label><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={{width:"100%",padding:"12px 14px",border:"1.5px solid rgba(139,94,60,0.14)",borderRadius:12,fontSize:14,background:"#fdf8f3",color:"#1a1410",outline:"none",boxSizing:"border-box"}}>{CATS.slice(1).map(c=><option key={c.name}>{c.name}</option>)}</select></div>
              <div style={{flex:1}}><label style={{fontSize:10,fontWeight:700,color:"#5c4a35",textTransform:"uppercase",letterSpacing:"0.04em",display:"block",marginBottom:6}}>Low Stock Alert</label><input type="number" step="0.1" value={form.lowStockThreshold} onChange={e=>setForm({...form,lowStockThreshold:e.target.value})} style={{width:"100%",padding:"12px 14px",border:"1.5px solid rgba(139,94,60,0.14)",borderRadius:12,fontSize:14,background:"#fdf8f3",color:"#1a1410",outline:"none",boxSizing:"border-box"}} onFocus={e=>e.target.style.borderColor="#ff6b2b"} onBlur={e=>e.target.style.borderColor="rgba(139,94,60,0.14)"}/></div>
            </div>
            <div><label style={{fontSize:10,fontWeight:700,color:"#5c4a35",textTransform:"uppercase",letterSpacing:"0.04em",display:"block",marginBottom:6}}>Expiry Date (optional)</label><input type="date" value={form.expiryDate} onChange={e=>setForm({...form,expiryDate:e.target.value})} style={{width:"100%",padding:"12px 14px",border:"1.5px solid rgba(139,94,60,0.14)",borderRadius:12,fontSize:14,background:"#fdf8f3",color:"#1a1410",outline:"none",boxSizing:"border-box"}} onFocus={e=>e.target.style.borderColor="#ff6b2b"} onBlur={e=>e.target.style.borderColor="rgba(139,94,60,0.14)"}/></div>
            <button type="submit" style={{padding:"14px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",border:"none",borderRadius:14,fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:"0 6px 20px rgba(255,107,43,0.35)",marginTop:4}}>{editItem?"Save Changes":"Add to Pantry"}</button>
          </form>
        </div>
      </div>}

      <style>{`
        @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.96) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
        input:focus,select:focus{outline:none!important}
      `}</style>
    </div>
  );
}