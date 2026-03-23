// ══════════════════════════════════════════════════════════════════════════
//  Purchases.jsx  —  HomeHub Smart Kitchen  (BEAUTIFUL 3D REDESIGN)
// ══════════════════════════════════════════════════════════════════════════
import { useEffect, useState, useRef } from "react";
import API from "../api/axios";
import { useToast } from "../components/Toast";

const INR = n => `₹${(Number(n)||0).toLocaleString("en-IN")}`;
const fmt = d => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";
const fmtTime = d => d ? new Date(d).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}) : "";

const CAT_COLORS = {
  Grocery:"#16a34a", Personal:"#7c3aed", Utilities:"#d97706",
  Entertainment:"#e11d48", Dining:"#f97316", Transport:"#0891b2",
  Health:"#dc2626", Shopping:"#8b5cf6", Other:"#64748b",
};
const CAT_ICONS = {
  Grocery:"🛒", Personal:"👤", Utilities:"💡",
  Entertainment:"🎭", Dining:"🍽️", Transport:"🚗",
  Health:"🏥", Shopping:"🛍️", Other:"📦",
};

function getInitial(name="") { return (name[0]||"?").toUpperCase(); }

function Avatar({ name, size=32, bg="#ff6b2b" }) {
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:bg, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:900, fontSize:size*0.42, flexShrink:0 }}>
      {getInitial(name)}
    </div>
  );
}

const MEMBER_COLORS = ["#ff6b2b","#7c3aed","#2d7a4f","#1565c0","#d32f2f","#00897b","#e67e22","#8e24aa"];

export default function Purchases() {
  const toast = useToast();
  const [household,  setHousehold]  = useState(null);
  const [members,    setMembers]    = useState([]);
  const [purchases,  setPurchases]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState("all");
  const [hovered,    setHovered]    = useState(null);
  const [showAdd,    setShowAdd]    = useState(false);
  const [settling,   setSettling]   = useState(false);
  const [form, setForm] = useState({ description:"", category:"Grocery", amount:"", paidBy:"", splitType:"shared", date:"" });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const hhRes = await API.get("/household/myhousehold");
      if (hhRes.data) {
        setHousehold(hhRes.data);
        const [mRes, pRes] = await Promise.all([
          API.get(`/household/members/${hhRes.data._id}`).catch(() => ({ data: hhRes.data.members||[] })),
          API.get(`/purchase/${hhRes.data._id}`).catch(() => ({ data:[] })),
        ]);
        setMembers((mRes.data||[]).map((m,i) => typeof m==="string"?{_id:m,name:m}:m));
        setPurchases(pRes.data||[]);
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const markAllSettled = async () => {
    if (!window.confirm("Mark all pending as settled?")) return;
    setSettling(true);
    try {
      await API.post(`/purchase/settle/${household._id}`);
      await load();
      toast("All settled! ✅", "success");
    } catch { toast("Failed to settle", "error"); }
    setSettling(false);
  };

  const markOneSettled = async (id) => {
    try {
      await API.patch(`/purchase/settle-one/${id}`);
      await load();
      toast("Settled ✅", "success");
    } catch { toast("Failed", "error"); }
  };

  const addPurchase = async (e) => {
    e.preventDefault();
    try {
      await API.post("/purchase", {
        householdId: household._id,
        description: form.description,
        category: form.category,
        totalAmount: parseFloat(form.amount),
        paidBy: form.paidBy || (members[0]?._id),
        splitType: form.splitType,
        date: form.date || new Date().toISOString(),
        items: [{ name:form.description, quantity:1, pricePerUnit:parseFloat(form.amount) }],
      });
      setShowAdd(false);
      setForm({ description:"", category:"Grocery", amount:"", paidBy:"", splitType:"shared", date:"" });
      await load();
      toast("Purchase added! ✅", "success");
    } catch(e) { toast(e.response?.data?.message||"Error adding purchase","error"); }
  };

  const deletePurchase = async (id) => {
    if (!window.confirm("Delete this purchase?")) return;
    try {
      await API.delete(`/purchase/${id}`);
      await load();
      toast("Deleted", "info");
    } catch { toast("Failed to delete","error"); }
  };

  // Derived
  const now = new Date();
  const totalAll   = purchases.reduce((s,p)=>s+(p.totalAmount||p.amount||0),0);
  const thisMonth  = purchases.filter(p=>{const d=new Date(p.date||p.createdAt);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();});
  const monthTotal = thisMonth.reduce((s,p)=>s+(p.totalAmount||p.amount||0),0);
  const unsettled  = purchases.filter(p=>!p.settled);
  const unsettledAmt = unsettled.reduce((s,p)=>s+(p.totalAmount||p.amount||0),0);

  const displayed = tab==="all" ? purchases :
    tab==="pending" ? purchases.filter(p=>!p.settled) :
    tab==="settled" ? purchases.filter(p=>p.settled) :
    purchases.filter(p=>p.splitType==="individual");

  // Category spending
  const catMap = purchases.reduce((a,p)=>{const c=p.category||"Other";a[c]=(a[c]||0)+(p.totalAmount||p.amount||0);return a;},{});
  const catEntries = Object.entries(catMap).sort(([,a],[,b])=>b-a);

  // Balance summary: who owes whom
  const balances = {};
  members.forEach(m => {
    const mid = m._id?.toString();
    if (mid) balances[mid] = { name:m.name, paid:0, share:0 };
  });
  purchases.filter(p=>!p.settled).forEach(p => {
    const payer = (p.paidBy?._id||p.paidBy)?.toString();
    const amt   = p.totalAmount||p.amount||0;
    const memberCount = Math.max(members.length, 1);
    if (payer && balances[payer]) balances[payer].paid += amt;
    Object.keys(balances).forEach(mid => { balances[mid].share += amt/memberCount; });
  });
  const owes = [];
  Object.entries(balances).forEach(([mid,b]) => {
    const net = b.paid - b.share;
    Object.entries(balances).forEach(([mid2,b2]) => {
      if (mid===mid2) return;
      const net2 = b2.paid - b2.share;
      if (net < 0 && net2 > 0) {
        const amount = Math.min(Math.abs(net), net2);
        if (amount > 1) owes.push({ from:b.name, to:b2.name, amount:Math.round(amount) });
      }
    });
  });

  const payerName = p => {
    if (p.paidBy?.name) return p.paidBy.name;
    if (p.paidByName) return p.paidByName;
    if (typeof p.paidBy==="string") {
      const m = members.find(m=>m._id?.toString()===p.paidBy);
      return m?.name || p.paidBy;
    }
    return "Unknown";
  };

  if (loading) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:16}}>
      <div style={{width:60,height:60,border:"4px solid rgba(255,107,43,0.15)",borderTop:"4px solid #ff6b2b",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <p style={{fontSize:15,color:"#5c4a35",fontWeight:600}}>Loading purchases...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20,paddingBottom:32}}>

      {/* ── HERO ── */}
      <div style={{position:"relative",borderRadius:24,overflow:"hidden",height:220,boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
        <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80" alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(10,6,3,0.92),rgba(10,6,3,0.6))"}}/>
        {/* animated glow orbs */}
        <div style={{position:"absolute",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,107,43,0.18),transparent 70%)",top:-60,left:-60,pointerEvents:"none"}}/>
        <div style={{position:"absolute",width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,0.12),transparent 70%)",bottom:-40,right:100,pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:2,padding:"32px 40px",height:"100%",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:40,fontWeight:800,color:"white",margin:"0 0 6px",letterSpacing:"-0.5px"}}>Purchases</h1>
              <p style={{fontSize:13,color:"rgba(255,255,255,0.5)",margin:0}}>{household?.name} · {purchases.length} transactions total</p>
            </div>
            <button onClick={() => setShowAdd(true)} style={{padding:"12px 22px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",border:"none",borderRadius:14,fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 20px rgba(255,107,43,0.4)",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:18}}>+</span> Add
            </button>
          </div>
          <div style={{display:"flex",gap:32,alignItems:"center"}}>
            {[
              {label:"This Month",val:INR(monthTotal),color:"#ffaa70"},
              {label:"All Time",val:INR(totalAll),color:"#a5d6a7"},
              {label:"Unsettled",val:INR(unsettledAmt),color:"#f87171"},
            ].map(s=>(
              <div key={s.label}>
                <span style={{display:"block",fontSize:26,fontWeight:900,color:s.color,letterSpacing:"-1px"}}>{s.val}</span>
                <span style={{fontSize:10,color:"rgba(255,255,255,0.45)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── NOTICE + SETTLE BUTTON ── */}
      <div style={{background:"white",borderRadius:16,padding:"14px 20px",boxShadow:"0 3px 14px rgba(139,94,60,0.07)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>📋</span>
          <p style={{fontSize:12,color:"#5c4a35",margin:0}}>
            <b>Full purchase history is always preserved.</b> "Mark as Settled" only resets balance dues — all {purchases.length} transactions stay visible.
          </p>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center",flexShrink:0}}>
          <span style={{fontSize:12,fontWeight:700,color:"#2d7a4f",background:"rgba(45,122,79,0.1)",borderRadius:50,padding:"4px 12px"}}>✅ {purchases.filter(p=>p.settled).length} settled</span>
          <span style={{fontSize:12,fontWeight:700,color:"#d32f2f",background:"rgba(211,47,47,0.1)",borderRadius:50,padding:"4px 12px"}}>🔴 {unsettled.length} pending</span>
          {unsettled.length > 0 && (
            <button onClick={markAllSettled} disabled={settling} style={{padding:"8px 16px",background:"linear-gradient(135deg,#16a34a,#22c55e)",color:"white",border:"none",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer",boxShadow:"0 3px 10px rgba(22,163,74,0.3)",opacity:settling?0.7:1}}>
              {settling?"Settling...":"✅ Mark All Settled"}
            </button>
          )}
        </div>
      </div>

      {/* ── BALANCE SUMMARY ── */}
      {owes.length > 0 && (
        <div style={{background:"white",borderRadius:20,padding:"20px 24px",boxShadow:"0 4px 20px rgba(139,94,60,0.08)"}}>
          <h3 style={{fontSize:15,fontWeight:800,color:"#1a1410",margin:"0 0 16px",fontFamily:"'Playfair Display',serif"}}>💰 Balance Summary</h3>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {owes.slice(0,8).map((o,i) => {
              const fromColor = MEMBER_COLORS[members.findIndex(m=>m.name===o.from) % MEMBER_COLORS.length] || "#ff6b2b";
              const toColor   = MEMBER_COLORS[members.findIndex(m=>m.name===o.to)   % MEMBER_COLORS.length] || "#7c3aed";
              return (
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 16px",background:"linear-gradient(135deg,rgba(255,107,43,0.04),rgba(124,58,237,0.04))",borderRadius:14,border:"1px solid rgba(139,94,60,0.08)",transition:"all 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.08)"}
                  onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                  <Avatar name={o.from} size={28} bg={fromColor}/>
                  <span style={{fontSize:12,fontWeight:700,color:"#1a1410"}}>{o.from}</span>
                  <span style={{fontSize:16,color:"#9c8672"}}>→</span>
                  <Avatar name={o.to} size={28} bg={toColor}/>
                  <span style={{fontSize:12,fontWeight:700,color:"#1a1410"}}>{o.to}</span>
                  <span style={{fontSize:13,fontWeight:800,color:"#16a34a",marginLeft:4}}>{INR(o.amount)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SPENDING BY CATEGORY ── */}
      {catEntries.length > 0 && (
        <div style={{background:"white",borderRadius:20,padding:"20px 24px",boxShadow:"0 4px 20px rgba(139,94,60,0.08)"}}>
          <h3 style={{fontSize:15,fontWeight:800,color:"#1a1410",margin:"0 0 16px",fontFamily:"'Playfair Display',serif"}}>📊 Spending by Category</h3>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12}}>
            {catEntries.map(([cat,amt]) => {
              const pct    = totalAll > 0 ? Math.round((amt/totalAll)*100) : 0;
              const color  = CAT_COLORS[cat] || "#64748b";
              const icon   = CAT_ICONS[cat]  || "📦";
              return (
                <div key={cat} style={{position:"relative",borderRadius:16,overflow:"hidden",background:`linear-gradient(135deg,${color}12,${color}06)`,border:`1px solid ${color}22`,padding:"14px 16px",cursor:"default",transition:"all 0.25s"}}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 8px 24px ${color}22`;}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
                  <div style={{fontSize:24,marginBottom:8}}>{icon}</div>
                  <div style={{fontSize:12,fontWeight:700,color:"#5c4a35",marginBottom:4}}>{cat}</div>
                  <div style={{fontSize:18,fontWeight:900,color:color,marginBottom:6}}>{INR(amt)}</div>
                  <div style={{height:4,background:`${color}20`,borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:2,transition:"width 0.8s ease"}}/>
                  </div>
                  <div style={{fontSize:10,color:"#9c8672",marginTop:4,fontWeight:600}}>{pct}% of total</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── FILTER TABS ── */}
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        {[["all",`All (${purchases.length})`],["pending",`Pending (${unsettled.length})`],["settled",`Settled (${purchases.filter(p=>p.settled).length})`],["personal",`Personal (${purchases.filter(p=>p.splitType==="individual").length})`]].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)} style={{padding:"9px 18px",border:"none",borderRadius:50,fontSize:13,fontWeight:700,cursor:"pointer",transition:"all 0.2s",background:tab===v?"#1a1410":"white",color:tab===v?"white":"#5c4a35",boxShadow:tab===v?"0 4px 14px rgba(26,20,16,0.2)":"0 1px 6px rgba(139,94,60,0.1)"}}>
            {l}
          </button>
        ))}
      </div>

      {/* ── PURCHASE CARDS ── */}
      {displayed.length === 0 ? (
        <div style={{background:"white",borderRadius:20,padding:40,textAlign:"center",boxShadow:"0 4px 20px rgba(139,94,60,0.07)"}}>
          <span style={{fontSize:40,display:"block",marginBottom:12}}>🧾</span>
          <p style={{fontSize:15,fontWeight:700,color:"#1a1410",marginBottom:6}}>No purchases here</p>
          <p style={{fontSize:13,color:"#9c8672"}}>Add your first purchase with the + Add button</p>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[...displayed].sort((a,b)=>new Date(b.date||b.createdAt)-new Date(a.date||a.createdAt)).map((p,i) => {
            const isHov     = hovered === p._id;
            const catColor  = CAT_COLORS[p.category||"Other"] || "#64748b";
            const catIcon   = CAT_ICONS[p.category||"Other"]  || "📦";
            const pName     = payerName(p);
            const pColor    = MEMBER_COLORS[members.findIndex(m=>m.name===pName) % MEMBER_COLORS.length] || "#ff6b2b";
            const amt       = p.totalAmount || p.amount || 0;

            return (
              <div key={p._id||i}
                onMouseEnter={()=>setHovered(p._id)}
                onMouseLeave={()=>setHovered(null)}
                style={{
                  background:"white",borderRadius:18,overflow:"hidden",
                  boxShadow:isHov?"0 16px 40px rgba(0,0,0,0.12), 0 0 0 1.5px rgba(255,107,43,0.15)":"0 3px 14px rgba(139,94,60,0.07)",
                  transform:isHov?"perspective(800px) rotateX(-0.5deg) translateY(-3px)":"perspective(800px) rotateX(0) translateY(0)",
                  transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                  display:"flex",alignItems:"stretch",
                }}>

                {/* Color bar */}
                <div style={{width:5,background:`linear-gradient(180deg,${catColor},${catColor}88)`,flexShrink:0}}/>

                {/* Category icon */}
                <div style={{width:56,display:"flex",alignItems:"center",justifyContent:"center",background:`${catColor}08`,flexShrink:0}}>
                  <span style={{fontSize:22}}>{catIcon}</span>
                </div>

                {/* Main content */}
                <div style={{flex:1,padding:"14px 18px",minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:15,fontWeight:800,color:"#1a1410",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.description||p.category||"Purchase"}</div>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4,flexWrap:"wrap"}}>
                        <div style={{display:"flex",alignItems:"center",gap:5}}>
                          <Avatar name={pName} size={18} bg={pColor}/>
                          <span style={{fontSize:11,color:"#9c8672",fontWeight:600}}>by {pName}</span>
                        </div>
                        <span style={{fontSize:10,color:"#9c8672"}}>·</span>
                        <span style={{fontSize:11,color:"#9c8672"}}>{fmt(p.date||p.createdAt)} {fmtTime(p.date||p.createdAt)}</span>
                        <span style={{fontSize:10,background:`${catColor}12`,color:catColor,borderRadius:50,padding:"1px 8px",fontWeight:700,fontSize:10}}>{p.category||"Other"}</span>
                        <span style={{fontSize:10,background:p.splitType==="individual"?"rgba(124,58,237,0.1)":"rgba(45,122,79,0.1)",color:p.splitType==="individual"?"#7c3aed":"#2d7a4f",borderRadius:50,padding:"1px 8px",fontWeight:700}}>
                          {p.splitType==="individual"?"Personal":"Shared"}
                        </span>
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8,flexShrink:0}}>
                      <span style={{fontSize:20,fontWeight:900,color:catColor,letterSpacing:"-0.5px"}}>{INR(amt)}</span>
                      <div style={{display:"flex",gap:6}}>
                        <span style={{fontSize:11,fontWeight:700,borderRadius:50,padding:"3px 10px",background:p.settled?"rgba(45,122,79,0.1)":"rgba(211,47,47,0.1)",color:p.settled?"#2d7a4f":"#d32f2f"}}>
                          {p.settled?"✅ Settled":"🔴 Pending"}
                        </span>
                        {!p.settled && (
                          <button onClick={()=>markOneSettled(p._id)} style={{fontSize:11,fontWeight:700,borderRadius:50,padding:"3px 10px",background:"rgba(22,163,74,0.1)",color:"#16a34a",border:"none",cursor:"pointer",transition:"all 0.2s"}}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(22,163,74,0.2)"}
                          onMouseLeave={e=>e.currentTarget.style.background="rgba(22,163,74,0.1)"}>
                            Mark Settled
                          </button>
                        )}
                        <button onClick={()=>deletePurchase(p._id)} style={{fontSize:11,borderRadius:50,padding:"3px 10px",background:"rgba(220,53,69,0.08)",color:"#d32f2f",border:"none",cursor:"pointer",fontWeight:700,transition:"all 0.2s"}}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(220,53,69,0.15)"}
                        onMouseLeave={e=>e.currentTarget.style.background="rgba(220,53,69,0.08)"}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Items preview */}
                  {p.items && p.items.length > 0 && isHov && (
                    <div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap",paddingTop:10,borderTop:"1px solid rgba(139,94,60,0.06)"}}>
                      {p.items.slice(0,5).map((item,j)=>(
                        <span key={j} style={{fontSize:10,background:"rgba(139,94,60,0.06)",color:"#5c4a35",borderRadius:50,padding:"2px 10px",fontWeight:600}}>
                          {item.name} × {item.quantity}
                        </span>
                      ))}
                      {p.items.length>5 && <span style={{fontSize:10,color:"#9c8672",borderRadius:50,padding:"2px 8px",fontWeight:600}}>+{p.items.length-5} more</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ADD PURCHASE MODAL ── */}
      {showAdd && (
        <div style={{position:"fixed",inset:0,background:"rgba(26,20,16,0.65)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}}
          onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div style={{background:"white",borderRadius:24,padding:28,width:"100%",maxWidth:480,boxShadow:"0 32px 80px rgba(0,0,0,0.25)",margin:20,maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
              <h3 style={{fontSize:18,fontWeight:800,color:"#1a1410",margin:0,fontFamily:"'Playfair Display',serif"}}>➕ Add Purchase</h3>
              <button onClick={()=>setShowAdd(false)} style={{background:"rgba(139,94,60,0.08)",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:14}}>✕</button>
            </div>
            <form onSubmit={addPurchase} style={{display:"flex",flexDirection:"column",gap:14}}>
              {[
                {label:"Description *",key:"description",placeholder:"e.g. Weekly groceries",type:"text"},
                {label:"Amount (₹) *",key:"amount",placeholder:"e.g. 500",type:"number"},
              ].map(f=>(
                <div key={f.key} style={{display:"flex",flexDirection:"column",gap:6}}>
                  <label style={{fontSize:11,fontWeight:700,color:"#5c4a35",textTransform:"uppercase",letterSpacing:"0.04em"}}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}
                    style={{padding:"12px 14px",border:"1.5px solid rgba(139,94,60,0.15)",borderRadius:12,fontSize:14,background:"#fdf8f3",color:"#1a1410",outline:"none"}} required/>
                </div>
              ))}
              <div style={{display:"flex",gap:12}}>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                  <label style={{fontSize:11,fontWeight:700,color:"#5c4a35",textTransform:"uppercase",letterSpacing:"0.04em"}}>Category</label>
                  <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={{padding:"12px 14px",border:"1.5px solid rgba(139,94,60,0.15)",borderRadius:12,fontSize:14,background:"#fdf8f3",color:"#1a1410",outline:"none"}}>
                    {Object.keys(CAT_COLORS).map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                  <label style={{fontSize:11,fontWeight:700,color:"#5c4a35",textTransform:"uppercase",letterSpacing:"0.04em"}}>Split</label>
                  <select value={form.splitType} onChange={e=>setForm({...form,splitType:e.target.value})} style={{padding:"12px 14px",border:"1.5px solid rgba(139,94,60,0.15)",borderRadius:12,fontSize:14,background:"#fdf8f3",color:"#1a1410",outline:"none"}}>
                    <option value="shared">Shared</option>
                    <option value="individual">Personal</option>
                  </select>
                </div>
              </div>
              {members.length > 0 && (
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  <label style={{fontSize:11,fontWeight:700,color:"#5c4a35",textTransform:"uppercase",letterSpacing:"0.04em"}}>Paid By</label>
                  <select value={form.paidBy} onChange={e=>setForm({...form,paidBy:e.target.value})} style={{padding:"12px 14px",border:"1.5px solid rgba(139,94,60,0.15)",borderRadius:12,fontSize:14,background:"#fdf8f3",color:"#1a1410",outline:"none"}}>
                    {members.map(m=><option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                </div>
              )}
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={{fontSize:11,fontWeight:700,color:"#5c4a35",textTransform:"uppercase",letterSpacing:"0.04em"}}>Date</label>
                <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}
                  style={{padding:"12px 14px",border:"1.5px solid rgba(139,94,60,0.15)",borderRadius:12,fontSize:14,background:"#fdf8f3",color:"#1a1410",outline:"none"}}/>
              </div>
              <button type="submit" style={{padding:"14px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",border:"none",borderRadius:14,fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:"0 6px 20px rgba(255,107,43,0.3)",marginTop:4}}>
                Add Purchase
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`input:focus,select:focus{outline:none!important;border-color:#ff6b2b!important;box-shadow:0 0 0 3px rgba(255,107,43,0.1)!important;}`}</style>
    </div>
  );
}