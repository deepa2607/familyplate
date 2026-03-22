import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useToast } from "../components/Toast";

const API = "http://localhost:5000/api";
const INR = n => `₹${(Number(n)||0).toLocaleString("en-IN")}`;
const fmt = d => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Purchases() {
  const toast = useToast();
  const [purchases,   setPurchases]   = useState([]);
  const [members,     setMembers]     = useState([]);
  const [household,   setHousehold]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);

  // ── View state ──
  // historyView: "all" | "unsettled" | "settled" | "personal"
  const [historyView,  setHistoryView]  = useState("all");
  const [monthFilter,  setMonthFilter]  = useState(0); // 0 = all months
  const [showAddForm,  setShowAddForm]  = useState(false);
  const [expandedId,   setExpandedId]   = useState(null);

  // ── Add form ──
  const [form, setForm] = useState({
    description:"", amount:"", category:"Grocery",
    paidBy:"", splitType:"shared", date: new Date().toISOString().slice(0,10),
    items:[],
  });

  const token   = localStorage.getItem("token");
  const headers = { Authorization:`Bearer ${token}` };

  // ── Load data ──
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const r = await axios.get(`${API}/household/myhousehold`, { headers });
        setHousehold(r.data);
        setMembers(r.data?.members || []);
        if (r.data?.members?.length > 0) {
          setForm(f => ({ ...f, paidBy: r.data.members[0]._id }));
        }
        const p = await axios.get(`${API}/purchase/household/${r.data._id}`, { headers });
        setPurchases(p.data || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  // ── Settle a purchase ──
  const settleOne = async (id) => {
    try {
      await axios.patch(`${API}/purchase/settle-one/${id}`, {}, { headers });
      toast("Purchase marked as settled ✓", "success");
      // Update state directly — NO loadAll (causes stale read revert)
      setPurchases(prev => prev.map(p => p._id === id ? { ...p, settled:true, settledAt:new Date().toISOString() } : p));
    } catch (err) {
      toast(err.response?.data?.message || "Settle failed", "error");
    }
  };

  // ── Settle ALL for household ──
  const settleAll = async () => {
    if (!window.confirm("Mark all shared purchases as settled?")) return;
    try {
      await axios.post(`${API}/purchase/settle/${household._id}`, {}, { headers });
      toast("All purchases settled ✓", "success");
      setPurchases(prev => prev.map(p => p.splitType !== "individual" ? { ...p, settled:true, settledAt:new Date().toISOString() } : p));
    } catch (err) {
      toast(err.response?.data?.message || "Settle failed", "error");
    }
  };

  // ── Add purchase ──
  const addPurchase = async (e) => {
    e.preventDefault();
    if (!form.paidBy) { toast("Select who paid", "warning"); return; }
    setSubmitting(true);
    try {
      const sharedBy = form.splitType === "individual"
        ? [form.paidBy]
        : members.map(m => m._id);
      const res = await axios.post(`${API}/purchase`, {
        ...form,
        householdId: household._id,
        totalAmount: Number(form.amount),
        amount:      Number(form.amount),
        sharedBy,
      }, { headers });
      setPurchases(prev => [res.data, ...prev]);
      setShowAddForm(false);
      setForm(f => ({ ...f, description:"", amount:"", items:[] }));
      toast("Purchase added!", "success");
    } catch (err) {
      toast(err.response?.data?.message || "Failed to add", "error");
    }
    setSubmitting(false);
  };

  // ── Delete purchase ──
  const deletePurchase = async (id) => {
    if (!window.confirm("Delete this purchase?")) return;
    try {
      await axios.delete(`${API}/purchase/${id}`, { headers });
      setPurchases(prev => prev.filter(p => p._id !== id));
      toast("Deleted", "info");
    } catch {
      toast("Delete failed", "error");
    }
  };

  // ── Derived ──
  const now         = new Date();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  // ── KEY FIX: Separate personal from shared purchases ──
  const personalPurchases = purchases.filter(p => p.splitType === "individual");
  const sharedPurchases   = purchases.filter(p => p.splitType !== "individual");

  const unsettledCount  = sharedPurchases.filter(p => !p.settled).length;
  const settledCount    = sharedPurchases.filter(p =>  p.settled).length;

  // ── Filter logic ──
  let filtered = [...purchases];

  if (historyView === "unsettled") {
    // ONLY show shared unsettled — personal NEVER appear here
    filtered = sharedPurchases.filter(p => !p.settled);
  } else if (historyView === "settled") {
    filtered = sharedPurchases.filter(p => p.settled);
  } else if (historyView === "personal") {
    // Dedicated "Other / Personal" tab
    filtered = personalPurchases;
  }
  // else "all" shows everything

  if (monthFilter > 0) {
    filtered = filtered.filter(p => {
      const d = new Date(p.date || p.createdAt);
      return d.getMonth() + 1 === monthFilter;
    });
  }

  const totalFiltered = filtered.reduce((s, p) => s + (p.totalAmount || p.amount || 0), 0);

  // ── Balance summary (only shared, only unsettled) ──
  const balances = {};
  if (household?.mode === "split") {
    sharedPurchases
      .filter(p => !p.settled)
      .forEach(p => {
        const payerName = p.paidBy?.name || p.paidByName || "?";
        const amt       = p.totalAmount || p.amount || 0;
        const share     = amt / (p.sharedBy?.length || members.length || 1);
        members.forEach(m => {
          if (m.name !== payerName) {
            const key = `${m.name}→${payerName}`;
            balances[key] = (balances[key] || 0) + share;
          }
        });
      });
  }

  // ── Category spend (for pie tiles) ──
  const catSpend = {};
  purchases.forEach(p => {
    const c = p.category || "Other";
    catSpend[c] = (catSpend[c] || 0) + (p.totalAmount || p.amount || 0);
  });

  const CATEGORIES = ["Grocery","Vegetables","Fruits","Dairy","Meat","Bakery","Beverages","Household","Personal","Other"];
  const CAT_COLORS = {
    Grocery:"#ff6b2b", Vegetables:"#22c55e", Fruits:"#f97316", Dairy:"#3b82f6",
    Meat:"#ef4444", Bakery:"#f59e0b", Beverages:"#06b6d4", Household:"#8b5cf6",
    Personal:"#ec4899", Other:"#6b7280",
  };
  const CAT_IMGS = {
    Grocery:"https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&w=400",
    Vegetables:"https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg?auto=compress&w=400",
    Dairy:"https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&w=400",
    Other:"https://images.pexels.com/photos/4386433/pexels-photo-4386433.jpeg?auto=compress&w=400",
  };

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60vh",flexDirection:"column",gap:12}}>
      <div style={{fontSize:32,animation:"spin 1s linear infinite"}}>🛒</div>
      <p style={{color:"#9c8672",fontSize:14,fontWeight:600}}>Loading purchases…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={s.page}>

      {/* ── HERO ── */}
      <div style={s.hero}>
        <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80" alt="" style={s.heroBg}/>
        <div style={s.heroOverlay}/>
        <div style={s.heroContent}>
          <div>
            <h1 style={s.heroTitle}>Purchases</h1>
            <p style={s.heroSub}>{purchases.length} transactions total</p>
          </div>
          <div style={s.heroRight}>
            {[
              {label:"This Month",val:INR(purchases.filter(p=>{const d=new Date(p.date||p.createdAt);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}).reduce((s,p)=>s+(p.totalAmount||p.amount||0),0))},
              {label:"All Time",  val:INR(purchases.reduce((s,p)=>s+(p.totalAmount||p.amount||0),0))},
              {label:"Unsettled", val:INR(sharedPurchases.filter(p=>!p.settled).reduce((s,p)=>s+(p.totalAmount||p.amount||0),0)), color:"#ffaa70"},
            ].map(({label,val,color})=>(
              <div key={label} style={s.heroStat}>
                <span style={{...s.heroNum,color:color||"white"}}>{val}</span>
                <span style={s.heroLab}>{label}</span>
              </div>
            ))}
            <button onClick={()=>setShowAddForm(v=>!v)} style={s.addBtn}>+ Add</button>
          </div>
        </div>
      </div>

      {/* ── ADD FORM ── */}
      {showAddForm && (
        <div style={s.addForm}>
          <h3 style={s.addFormTitle}>Add New Purchase</h3>
          <form onSubmit={addPurchase} style={s.addFormGrid}>
            <div style={s.fieldGroup}>
              <label style={s.label}>Description</label>
              <input value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
                placeholder="e.g. Weekly groceries" style={s.input} required/>
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Amount (₹)</label>
              <input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}
                placeholder="0" min={0} style={s.input} required/>
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Category</label>
              <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={s.input}>
                {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Paid By</label>
              <select value={form.paidBy} onChange={e=>setForm({...form,paidBy:e.target.value})} style={s.input}>
                {members.map(m=><option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Split Type</label>
              <div style={{display:"flex",gap:8}}>
                {[{v:"shared",l:"👥 Shared"},{v:"individual",l:"👤 Personal"}].map(opt=>(
                  <button key={opt.v} type="button" onClick={()=>setForm({...form,splitType:opt.v})} style={{
                    ...s.splitBtn,
                    background: form.splitType===opt.v ? "#ff6b2b" : "rgba(139,94,60,0.06)",
                    color:      form.splitType===opt.v ? "white"   : "#5c4a35",
                    border:     form.splitType===opt.v ? "2px solid #ff6b2b" : "2px solid transparent",
                  }}>{opt.l}</button>
                ))}
              </div>
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Date</label>
              <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={s.input}/>
            </div>
            <div style={{...s.fieldGroup, gridColumn:"1/-1",display:"flex",gap:10,justifyContent:"flex-end",marginTop:4}}>
              <button type="button" onClick={()=>setShowAddForm(false)} style={s.cancelBtn}>Cancel</button>
              <button type="submit" disabled={submitting} style={s.submitBtn}>
                {submitting ? "Saving…" : "Add Purchase"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── HISTORY BANNER ── */}
      <div style={s.historyBanner}>
        <div style={{display:"flex",alignItems:"center",gap:10,fontSize:13,color:"#5c4a35",fontWeight:600}}>
          <span style={{fontSize:18}}>📋</span>
          <span><strong>Full purchase history is always preserved.</strong> "Mark as Settled" only resets balance dues — all {purchases.length} transactions stay visible.</span>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <span style={{...s.statusPill,background:"rgba(34,197,94,0.1)",color:"#16a34a",border:"1px solid rgba(34,197,94,0.2)"}}>
            ✅ {settledCount} settled
          </span>
          <span style={{...s.statusPill,background:"rgba(239,68,68,0.08)",color:"#dc2626",border:"1px solid rgba(239,68,68,0.15)"}}>
            🔴 {unsettledCount} pending
          </span>
        </div>
      </div>

      {/* ── BALANCE SUMMARY ── */}
      {household?.mode === "split" && (
        <div style={s.balanceSection}>
          <div style={s.balanceSectionHead}>
            <h3 style={s.balanceSectionTitle}>💰 Balance Summary</h3>
            {unsettledCount > 0 && (
              <button onClick={settleAll} style={s.settleAllBtn}>✅ Mark All Settled</button>
            )}
          </div>
          {Object.keys(balances).length === 0 ? (
            <div style={s.allClearBox}>
              <span style={{fontSize:28}}>🎉</span>
              <div>
                <div style={{fontWeight:700,fontSize:15,color:"#16a34a"}}>All Clear!</div>
                <div style={{fontSize:13,color:"#16a34a",opacity:0.8}}>No outstanding dues between members</div>
              </div>
            </div>
          ) : (
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {Object.entries(balances).map(([key,amt])=>(
                <div key={key} style={s.balanceCard}>
                  <span style={{fontSize:14}}>💸</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:"#1a1410"}}>{key.replace("→"," owes ")}</div>
                    <div style={{fontSize:14,fontWeight:800,color:"#ff6b2b"}}>{INR(Math.round(amt))}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CATEGORY TILES ── */}
      {Object.keys(catSpend).length > 0 && (
        <div style={s.catSection}>
          <h3 style={s.catTitle}>📊 Spending by Category</h3>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            {Object.entries(catSpend).sort(([,a],[,b])=>b-a).map(([cat,amt])=>(
              <div key={cat} style={{
                ...s.catCard,
                borderLeft:`4px solid ${CAT_COLORS[cat]||"#9c8672"}`,
              }}>
                {CAT_IMGS[cat] && (
                  <img src={CAT_IMGS[cat]} alt={cat} style={s.catImg}/>
                )}
                <div style={s.catCardBody}>
                  <div style={{fontWeight:700,fontSize:14,color:"white"}}>{cat}</div>
                  <div style={{fontWeight:900,fontSize:18,color:"white"}}>{INR(amt)}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.65)"}}>
                    {purchases.filter(p=>(p.category||"Other")===cat).length} items
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB BUTTONS ── */}
      <div style={s.tabRow}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {[
            {v:"all",       l:`🗂 All (${purchases.length})`},
            {v:"unsettled", l:`🔴 Pending (${unsettledCount})`},
            {v:"settled",   l:`✅ Settled (${settledCount})`},
            // ── KEY: Personal/Other is its own tab ──
            {v:"personal",  l:`👤 Personal (${personalPurchases.length})`},
          ].map(({v,l})=>(
            <button key={v} onClick={()=>setHistoryView(v)} style={{
              ...s.tabBtn,
              background: historyView===v ? (v==="unsettled"?"#ff6b2b":v==="personal"?"#8b5cf6":v==="settled"?"#16a34a":"#1a1410") : "white",
              color:      historyView===v ? "white" : "#5c4a35",
              border:     historyView===v ? "none" : "1.5px solid rgba(139,94,60,0.15)",
            }}>{l}</button>
          ))}
        </div>

        {/* Month filter */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          <button onClick={()=>setMonthFilter(0)} style={{...s.monthBtn,background:monthFilter===0?"#1a1410":"white",color:monthFilter===0?"white":"#5c4a35"}}>All</button>
          {MONTHS.map((m,i)=>(
            <button key={m} onClick={()=>setMonthFilter(i+1)} style={{...s.monthBtn,background:monthFilter===i+1?"#ff6b2b":"white",color:monthFilter===i+1?"white":"#5c4a35"}}>{m}</button>
          ))}
        </div>
      </div>

      {/* ── PERSONAL TAB NOTICE ── */}
      {historyView === "personal" && (
        <div style={{padding:"12px 16px",background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:12,fontSize:13,color:"#7c3aed",fontWeight:600,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18}}>👤</span>
          <span><strong>Personal purchases</strong> — paid by one person, not split with others. These never appear in shared balance or pending list.</span>
        </div>
      )}

      {/* ── PURCHASE LIST ── */}
      <div style={{fontSize:13,color:"#9c8672",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span>Showing <strong>{filtered.length}</strong> transaction{filtered.length!==1?"s":""}</span>
        <span style={{fontWeight:700,color:"#1a1410"}}>Total: <span style={{color:"#ff6b2b"}}>{INR(totalFiltered)}</span></span>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.length === 0 ? (
          <div style={s.emptyState}>
            <div style={{fontSize:48,marginBottom:12}}>
              {historyView==="unsettled"?"🎉":historyView==="personal"?"👤":"📋"}
            </div>
            <div style={{fontSize:16,fontWeight:700,color:"#1a1410",marginBottom:6}}>
              {historyView==="unsettled" ? "No pending purchases!" : historyView==="personal" ? "No personal purchases" : "No purchases found"}
            </div>
            <div style={{fontSize:13,color:"#9c8672"}}>
              {historyView==="unsettled" ? "All shared expenses are settled 🎉" : historyView==="personal" ? "Personal purchases will appear here" : "Add your first purchase to get started"}
            </div>
          </div>
        ) : (
          filtered.map(p => {
            const isPersonal = p.splitType === "individual";
            const isExpanded = expandedId === p._id;
            return (
              <div key={p._id} style={{
                ...s.purchaseCard,
                borderLeft: `4px solid ${isPersonal?"#8b5cf6":p.settled?"#22c55e":"rgba(139,94,60,0.2)"}`,
                background: isExpanded ? "#fdf5ff" : "white",
              }}>
                <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
                  {/* Icon */}
                  <div style={{
                    width:44,height:44,borderRadius:12,flexShrink:0,
                    background:`${CAT_COLORS[p.category]||"#9c8672"}15`,
                    border:`1px solid ${CAT_COLORS[p.category]||"#9c8672"}25`,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,
                  }}>🛒</div>

                  {/* Main info */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                      <span style={{fontWeight:700,fontSize:14,color:"#1a1410"}}>{p.description||`Smart Cart — ${p.items?.length||0} items`}</span>
                      <span style={{...s.pill,background:`${CAT_COLORS[p.category]||"#9c8672"}15`,color:CAT_COLORS[p.category]||"#9c8672",border:`1px solid ${CAT_COLORS[p.category]||"#9c8672"}25`}}>
                        {p.category||"Other"}
                      </span>
                      {isPersonal && (
                        <span style={{...s.pill,background:"rgba(139,92,246,0.1)",color:"#7c3aed",border:"1px solid rgba(139,92,246,0.2)"}}>
                          👤 Personal
                        </span>
                      )}
                    </div>
                    <div style={{fontSize:12,color:"#9c8672",display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                      <span>Paid by <strong style={{color:"#5c4a35"}}>{p.paidBy?.name||p.paidByName||"?"}</strong></span>
                      <span>·</span>
                      <span>{fmt(p.date||p.createdAt)}</span>
                      {p.items?.length > 0 && <>
                        <span>·</span>
                        <span style={{cursor:"pointer",color:"#ff6b2b",fontWeight:600}} onClick={()=>setExpandedId(isExpanded?null:p._id)}>
                          {p.items.slice(0,3).map(i=>`${i.name}×${i.quantity||1}`).join(", ")}
                          {p.items.length > 3 && ` +${p.items.length-3} more`}
                          {isExpanded ? " ▲" : " ▼"}
                        </span>
                      </>}
                    </div>
                    {/* Expanded items */}
                    {isExpanded && p.items?.length > 0 && (
                      <div style={{marginTop:10,display:"flex",flexWrap:"wrap",gap:6}}>
                        {p.items.map((item,i)=>(
                          <span key={i} style={{...s.pill,background:"rgba(139,94,60,0.06)",color:"#5c4a35",border:"1px solid rgba(139,94,60,0.12)"}}>
                            {item.name} ×{item.quantity||1}
                            {item.price ? ` — ${INR(item.price)}` : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right side */}
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}}>
                    <span style={{fontWeight:900,fontSize:16,color:"#1a1410"}}>
                      {INR(p.totalAmount||p.amount)}
                    </span>
                    {p.settled ? (
                      <span style={{...s.pill,background:"rgba(34,197,94,0.1)",color:"#16a34a",border:"1px solid rgba(34,197,94,0.2)"}}>
                        ✅ Settled {p.settledAt ? fmt(p.settledAt) : ""}
                      </span>
                    ) : isPersonal ? (
                      <span style={{...s.pill,background:"rgba(139,92,246,0.1)",color:"#7c3aed",border:"1px solid rgba(139,92,246,0.2)"}}>
                        👤 Personal
                      </span>
                    ) : (
                      <span style={{...s.pill,background:"rgba(239,68,68,0.08)",color:"#dc2626",border:"1px solid rgba(239,68,68,0.15)"}}>
                        🔴 Pending
                      </span>
                    )}
                    <div style={{display:"flex",gap:6}}>
                      {!p.settled && !isPersonal && (
                        <button onClick={()=>settleOne(p._id)} style={{
                          padding:"4px 10px",borderRadius:8,background:"rgba(34,197,94,0.08)",
                          border:"1px solid rgba(34,197,94,0.2)",color:"#16a34a",
                          fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                        }}>✅ Settle</button>
                      )}
                      <button onClick={()=>deletePurchase(p._id)} style={{
                        width:28,height:28,borderRadius:8,background:"rgba(239,68,68,0.06)",
                        border:"1px solid rgba(239,68,68,0.12)",color:"#dc2626",
                        fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                      }}>🗑</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        input:focus,select:focus{outline:none;border-color:#ff6b2b!important;}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(139,94,60,0.15);border-radius:2px}
      `}</style>
    </div>
  );
}

const s = {
  page:{display:"flex",flexDirection:"column",gap:20,paddingBottom:32,fontFamily:"'Plus Jakarta Sans',sans-serif"},
  hero:{position:"relative",borderRadius:24,overflow:"hidden",height:180,boxShadow:"0 16px 48px rgba(0,0,0,0.18)"},
  heroBg:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"},
  heroOverlay:{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(26,20,16,0.9),rgba(26,20,16,0.5))"},
  heroContent:{position:"relative",zIndex:2,padding:"28px 36px",height:"100%",display:"flex",justifyContent:"space-between",alignItems:"center"},
  heroTitle:{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:800,color:"white",margin:"0 0 6px"},
  heroSub:{fontSize:12,color:"rgba(255,255,255,0.5)"},
  heroRight:{display:"flex",gap:24,alignItems:"center"},
  heroStat:{textAlign:"center"},
  heroNum:{display:"block",fontSize:20,fontWeight:900,color:"white"},
  heroLab:{display:"block",fontSize:10,color:"rgba(255,255,255,0.45)",fontWeight:500,marginTop:2},
  addBtn:{padding:"10px 20px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",border:"none",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px rgba(255,107,43,0.4)",fontFamily:"inherit"},
  addForm:{background:"white",borderRadius:20,padding:"24px",boxShadow:"0 8px 32px rgba(139,94,60,0.12)",border:"1px solid rgba(139,94,60,0.1)"},
  addFormTitle:{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:800,color:"#1a1410",margin:"0 0 18px"},
  addFormGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14},
  fieldGroup:{display:"flex",flexDirection:"column",gap:6},
  label:{fontSize:11,fontWeight:700,color:"rgba(26,20,16,0.5)",textTransform:"uppercase",letterSpacing:"0.7px"},
  input:{padding:"10px 12px",border:"1.5px solid rgba(139,94,60,0.15)",borderRadius:10,fontSize:13,color:"#1a1410",background:"#fdf8f3",fontFamily:"inherit",transition:"border-color 0.2s",boxSizing:"border-box",width:"100%"},
  splitBtn:{padding:"9px 14px",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer",transition:"all .15s",fontFamily:"inherit"},
  cancelBtn:{padding:"10px 20px",background:"rgba(139,94,60,0.06)",border:"1.5px solid rgba(139,94,60,0.15)",borderRadius:10,fontSize:13,fontWeight:700,color:"#5c4a35",cursor:"pointer",fontFamily:"inherit"},
  submitBtn:{padding:"10px 24px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",border:"none",borderRadius:10,fontSize:13,fontWeight:700,color:"white",cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(255,107,43,0.3)"},
  historyBanner:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 18px",background:"white",borderRadius:16,boxShadow:"0 2px 12px rgba(139,94,60,0.06)",border:"1px solid rgba(139,94,60,0.08)"},
  statusPill:{padding:"4px 12px",borderRadius:50,fontSize:12,fontWeight:700},
  balanceSection:{background:"white",borderRadius:20,padding:"20px",boxShadow:"0 4px 20px rgba(139,94,60,0.08)"},
  balanceSectionHead:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16},
  balanceSectionTitle:{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:800,color:"#1a1410",margin:0},
  settleAllBtn:{padding:"10px 20px",background:"linear-gradient(135deg,#16a34a,#22c55e)",border:"none",borderRadius:12,fontSize:13,fontWeight:700,color:"white",cursor:"pointer",boxShadow:"0 4px 14px rgba(34,197,94,0.3)",fontFamily:"inherit"},
  allClearBox:{display:"flex",alignItems:"center",gap:14,padding:"16px",background:"rgba(34,197,94,0.06)",borderRadius:14,border:"1px solid rgba(34,197,94,0.15)"},
  balanceCard:{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"rgba(255,107,43,0.04)",borderRadius:12,border:"1px solid rgba(255,107,43,0.12)"},
  catSection:{background:"white",borderRadius:20,padding:"20px",boxShadow:"0 4px 20px rgba(139,94,60,0.08)"},
  catTitle:{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:800,color:"#1a1410",margin:"0 0 14px"},
  catCard:{position:"relative",borderRadius:14,overflow:"hidden",width:140,height:100,flexShrink:0,cursor:"pointer"},
  catImg:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"},
  catCardBody:{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(0,0,0,0.1),rgba(0,0,0,0.7))",display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:"10px 12px"},
  tabRow:{display:"flex",flexDirection:"column",gap:10},
  tabBtn:{padding:"9px 16px",borderRadius:50,fontSize:13,fontWeight:700,cursor:"pointer",transition:"all 0.2s",fontFamily:"inherit"},
  monthBtn:{padding:"5px 10px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",transition:"all 0.15s",fontFamily:"inherit",border:"1.5px solid rgba(139,94,60,0.12)"},
  purchaseCard:{background:"white",borderRadius:16,padding:"16px",boxShadow:"0 2px 12px rgba(139,94,60,0.06)",border:"1px solid rgba(139,94,60,0.08)",transition:"all 0.2s"},
  pill:{padding:"3px 10px",borderRadius:50,fontSize:11,fontWeight:700,display:"inline-flex",alignItems:"center"},
  emptyState:{textAlign:"center",padding:"60px 20px",background:"white",borderRadius:20,boxShadow:"0 4px 20px rgba(139,94,60,0.06)"},
};