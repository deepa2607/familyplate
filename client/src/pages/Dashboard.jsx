// Dashboard.jsx — HomeHub Smart Kitchen (FIXED: shows real data, not 0s)
// familyplate/client/src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const INR = n => `₹${(Number(n)||0).toLocaleString("en-IN")}`;
const greet = () => { const h=new Date().getHours(); return h<12?"🌅 Good Morning":h<17?"☀️ Good Afternoon":"🌙 Good Evening"; };

const QUICK_ACTIONS = [
  {icon:"🥦",label:"Pantry",sub:"Track inventory",link:"/pantry",color:"#16a34a"},
  {icon:"🍽️",label:"Recipes",sub:"50+ Indian recipes",link:"/recipes",color:"#7c3aed"},
  {icon:"⚡",label:"Smart Cart",sub:"Order groceries",link:"/cart",color:"#ff6b2b"},
  {icon:"📅",label:"Meal Planner",sub:"Plan your week",link:"/planner",color:"#2563eb"},
  {icon:"👥",label:"Members",sub:"Manage family",link:"/members",color:"#0891b2"},
  {icon:"💸",label:"Purchases",sub:"Expense history",link:"/purchases",color:"#d97706"},
  {icon:"🤖",label:"AI Chef",sub:"Get cooking help",link:"/chat",color:"#ec4899"},
  {icon:"📊",label:"Analytics",sub:"Spending insights",link:"/analytics",color:"#64748b"},
];

const FOOD_IMAGES = [
  "https://images.unsplash.com/photo-1618449840665-9ed506d73a34?w=600&q=80",
  "https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80",
  "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&q=80",
  "https://images.unsplash.com/photo-1604952564555-1ce68ff90f3e?w=600&q=80",
];

export default function Dashboard() {
  const navigate = useNavigate();

  const [household,  setHousehold]  = useState(null);
  const [user,       setUser]       = useState(null);
  const [purchases,  setPurchases]  = useState([]);
  const [members,    setMembers]    = useState([]);
  const [pantryItems,setPantryItems]= useState([]);
  const [loading,    setLoading]    = useState(true);
  const [imgIdx,     setImgIdx]     = useState(0);
  const [hovered,    setHovered]    = useState(null);

  useEffect(() => {
    load();
    // Rotate food images
    const imgIv = setInterval(() => setImgIdx(i => (i+1)%FOOD_IMAGES.length), 5000);
    // Auto-refresh data every 30 seconds
    const dataIv = setInterval(() => load(), 30000);
    return () => { clearInterval(imgIv); clearInterval(dataIv); };
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      // Load user from localStorage first for instant display
      const userStr = localStorage.getItem("user");
      if (userStr) { try { setUser(JSON.parse(userStr)); } catch {} }

      // Load household
      const hhRes = await API.get("/household/myhousehold");
      if (hhRes.data) {
        setHousehold(hhRes.data);

        // Load members, purchases, pantry in parallel
        const [membersRes, purchasesRes, pantryRes] = await Promise.allSettled([
          API.get(`/household/members/${hhRes.data._id}`),
          API.get(`/purchase/${hhRes.data._id}`),
          API.get(`/pantry/${hhRes.data._id}`),
        ]);

        if (membersRes.status  === "fulfilled") setMembers(membersRes.value.data || []);
        if (purchasesRes.status=== "fulfilled") setPurchases(purchasesRes.value.data || []);
        if (pantryRes.status   === "fulfilled") setPantryItems(pantryRes.value.data || []);
      }
    } catch(e) {
      console.error("Dashboard load error:", e.message);
    }
    setLoading(false);
  };

  // Computed stats
  const now         = new Date();
  const thisMonth   = purchases.filter(p=>{const d=new Date(p.date||p.createdAt);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();});
  const monthTotal  = thisMonth.reduce((s,p)=>s+(p.totalAmount||p.amount||0),0);
  const allTotal    = purchases.reduce((s,p)=>s+(p.totalAmount||p.amount||0),0);
  const budget      = household?.monthlyBudget || 5000;
  const budgetPct   = budget > 0 ? Math.min(100,Math.round((monthTotal/budget)*100)) : 0;
  const lowStock    = pantryItems.filter(i=>i.quantity<=(i.lowStockThreshold||1));
  const recentPurch = [...purchases].sort((a,b)=>new Date(b.date||b.createdAt)-new Date(a.date||a.createdAt)).slice(0,3);

  const MEMBER_COLORS = ["#ff6b2b","#7c3aed","#16a34a","#2563eb","#d97706","#ec4899"];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20,paddingBottom:32}}>

      {/* Hero */}
      <div style={{position:"relative",borderRadius:24,overflow:"hidden",height:240,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
        <img src={FOOD_IMAGES[imgIdx]} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",transition:"opacity 0.8s ease"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(10,6,3,0.88),rgba(10,6,3,0.45))"}}/>
        {/* Ambient orbs */}
        <div style={{position:"absolute",width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,107,43,0.18),transparent 70%)",top:-60,left:-60,pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:2,padding:"28px 36px",height:"100%",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
          <div>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,107,43,0.2)",border:"1px solid rgba(255,107,43,0.3)",color:"#ffaa70",borderRadius:50,padding:"4px 14px",fontSize:11,fontWeight:700,marginBottom:10}}>
              {greet()}
            </div>
            <h1 style={{margin:0,fontSize:36,fontWeight:900,color:"white",fontFamily:"'Playfair Display',serif",letterSpacing:"-0.5px"}}>
              Welcome back,
            </h1>
            <h1 style={{margin:"0 0 8px",fontSize:36,fontWeight:900,color:"#ff8c54",fontFamily:"'Playfair Display',serif",letterSpacing:"-0.5px"}}>
              {household?.name || user?.name || "Kitchen"}!
            </h1>
            {household && (
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[household.mode==="split"?"⚖️ Split Mode":"🏠 Family Mode",`🔑 ${household.inviteCode}`,household.foodPreference?`🥗 ${household.foodPreference}`:null].filter(Boolean).map(t=>(
                  <span key={t} style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.7)",background:"rgba(255,255,255,0.1)",backdropFilter:"blur(8px)",borderRadius:50,padding:"4px 12px"}}>{t}</span>
                ))}
              </div>
            )}
          </div>
          {/* Budget card */}
          {household && (
            <div style={{background:"rgba(0,0,0,0.35)",backdropFilter:"blur(12px)",borderRadius:16,padding:"14px 18px",display:"inline-block",minWidth:200}}>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>Monthly Budget</div>
              <div style={{fontSize:24,fontWeight:900,color:"white",letterSpacing:"-0.5px"}}>
                <span>{loading ? "…" : INR(monthTotal)}</span>
                <span style={{fontSize:14,color:"rgba(255,255,255,0.45)",fontWeight:600}}> / {INR(budget)}</span>
              </div>
              <div style={{height:4,background:"rgba(255,255,255,0.15)",borderRadius:2,marginTop:8,overflow:"hidden"}}>
                <div style={{height:"100%",background:budgetPct>90?"#f87171":budgetPct>70?"#fbbf24":"#4ade80",borderRadius:2,width:`${budgetPct}%`,transition:"width 0.8s ease"}}/>
              </div>
              <div style={{fontSize:10,color:budgetPct>90?"#f87171":"rgba(255,255,255,0.45)",marginTop:4,fontWeight:600}}>{budgetPct}% used this month</div>
            </div>
          )}
        </div>
        {/* Dot indicators */}
        <div style={{position:"absolute",bottom:14,right:18,display:"flex",gap:5,zIndex:3}}>
          {FOOD_IMAGES.map((_,i)=><div key={i} style={{width:i===imgIdx?20:6,height:6,borderRadius:3,background:i===imgIdx?"#ff6b2b":"rgba(255,255,255,0.3)",transition:"all 0.4s"}}/>)}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:14}}>
        {[
          {icon:"💸",label:"Total Spend",value:INR(allTotal),sub:"All time",color:"#ff6b2b",link:"/purchases"},
          {icon:"📅",label:"This Month",value:INR(monthTotal),sub:`${thisMonth.length} purchases`,color:"#7c3aed",link:"/purchases"},
          {icon:"👥",label:"Members",value:members.length||1,sub:"In household",color:"#2563eb",link:"/members"},
          {icon:"🥦",label:"Pantry Items",value:pantryItems.length,sub:`${lowStock.length} running low`,color:"#16a34a",link:"/pantry"},
        ].map(card=>(
          <div key={card.label} onClick={()=>navigate(card.link)} style={{background:"white",borderRadius:18,padding:"18px 20px",cursor:"pointer",boxShadow:"0 3px 14px rgba(139,94,60,0.07)",border:`1px solid ${card.color}12`,position:"relative",overflow:"hidden",transition:"all 0.25s"}}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 10px 28px ${card.color}22`;}}
            onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 3px 14px rgba(139,94,60,0.07)";}}>
            <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:`${card.color}10`,pointerEvents:"none"}}/>
            <div style={{width:38,height:38,borderRadius:11,background:`${card.color}12`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,marginBottom:12}}>{card.icon}</div>
            <div style={{fontSize:10,fontWeight:700,color:"#9c8672",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{card.label}</div>
            <div style={{fontSize:24,fontWeight:900,color:card.color,letterSpacing:"-0.5px",marginBottom:3,fontFamily:"'DM Mono',monospace"}}>{loading?"…":card.value}</div>
            <div style={{fontSize:11,color:"#9c8672"}}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div style={{background:"white",borderRadius:16,padding:"14px 18px",boxShadow:"0 3px 14px rgba(139,94,60,0.07)",border:"1px solid rgba(211,47,47,0.12)",cursor:"pointer"}} onClick={()=>navigate("/pantry")}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <span style={{fontSize:16}}>🔔</span>
            <span style={{fontSize:13,fontWeight:800,color:"#1a1410"}}>Low Stock Alert</span>
            <span style={{fontSize:10,background:"rgba(211,47,47,0.1)",color:"#d32f2f",borderRadius:50,padding:"2px 8px",fontWeight:700}}>{lowStock.length} items</span>
          </div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {lowStock.slice(0,6).map(i=>(
              <span key={i._id} style={{fontSize:11,fontWeight:600,color:"#d32f2f",background:"rgba(211,47,47,0.06)",borderRadius:50,padding:"3px 10px",border:"1px solid rgba(211,47,47,0.12)"}}>
                {i.name} ({i.quantity}{i.unit})
              </span>
            ))}
            {lowStock.length>6&&<span style={{fontSize:11,color:"#9c8672",padding:"3px 10px"}}>+{lowStock.length-6} more</span>}
          </div>
        </div>
      )}

      {/* Two column: quick actions + recent purchases */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>

        {/* Quick Actions */}
        <div style={{background:"white",borderRadius:20,overflow:"hidden",boxShadow:"0 4px 18px rgba(139,94,60,0.07)"}}>
          <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(139,94,60,0.07)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <h3 style={{fontSize:14,fontWeight:800,color:"#1a1410",margin:0}}>⚡ Quick Actions</h3>
            <span style={{fontSize:11,color:"#9c8672"}}>Everything you need</span>
          </div>
          <div style={{padding:"14px 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
            {QUICK_ACTIONS.map(a=>(
              <button key={a.label} onClick={()=>navigate(a.link)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:hovered===a.label?`${a.color}10`:"rgba(139,94,60,0.03)",border:`1px solid ${hovered===a.label?a.color+"30":"rgba(139,94,60,0.08)"}`,borderRadius:13,cursor:"pointer",textAlign:"left",transition:"all 0.2s"}}
                onMouseEnter={()=>setHovered(a.label)} onMouseLeave={()=>setHovered(null)}>
                <div style={{width:34,height:34,borderRadius:10,background:`${a.color}12`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{a.icon}</div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:800,color:"#1a1410"}}>{a.label}</div>
                  <div style={{fontSize:10,color:"#9c8672",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Purchases */}
        <div style={{background:"white",borderRadius:20,overflow:"hidden",boxShadow:"0 4px 18px rgba(139,94,60,0.07)"}}>
          <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(139,94,60,0.07)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <h3 style={{fontSize:14,fontWeight:800,color:"#1a1410",margin:0}}>🧾 Recent Purchases</h3>
            <button onClick={()=>navigate("/purchases")} style={{fontSize:11,color:"#ff6b2b",fontWeight:700,background:"none",border:"none",cursor:"pointer"}}>View all →</button>
          </div>
          <div style={{padding:"10px 16px"}}>
            {recentPurch.length === 0 ? (
              <div style={{textAlign:"center",padding:"24px 0"}}>
                <span style={{fontSize:28,display:"block",marginBottom:8}}>🧾</span>
                <p style={{fontSize:12,color:"#9c8672",margin:"0 0 12px"}}>No purchases yet</p>
                <button onClick={()=>navigate("/cart")} style={{padding:"8px 16px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",border:"none",borderRadius:9,fontSize:11,fontWeight:700,cursor:"pointer"}}>
                  Start Shopping →
                </button>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:0}}>
                {recentPurch.map((p,i)=>{
                  const amt = p.totalAmount||p.amount||0;
                  const payer = p.paidBy?.name||p.paidByName||"You";
                  return (
                    <div key={p._id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 4px",borderBottom:i<recentPurch.length-1?"1px solid rgba(139,94,60,0.06)":"none",cursor:"pointer",transition:"background 0.15s",borderRadius:8}}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(255,107,43,0.03)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                      onClick={()=>navigate("/purchases")}>
                      <div style={{width:36,height:36,borderRadius:10,background:"rgba(255,107,43,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>🛒</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:700,color:"#1a1410",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.description||p.category||"Purchase"}</div>
                        <div style={{fontSize:10,color:"#9c8672"}}>by {payer} · {new Date(p.date||p.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontSize:13,fontWeight:800,color:"#ff6b2b"}}>{INR(amt)}</div>
                        <div style={{fontSize:9,fontWeight:700,color:p.settled?"#2d7a4f":"#d32f2f"}}>{p.settled?"✅":"🔴"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Members row */}
      {members.length > 0 && (
        <div style={{background:"white",borderRadius:20,padding:"16px 20px",boxShadow:"0 4px 18px rgba(139,94,60,0.07)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <h3 style={{fontSize:14,fontWeight:800,color:"#1a1410",margin:0}}>👥 Household Members</h3>
            <button onClick={()=>navigate("/members")} style={{fontSize:11,color:"#ff6b2b",fontWeight:700,background:"none",border:"none",cursor:"pointer"}}>Manage →</button>
          </div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            {members.map((m,i)=>{
              const paidTotal = purchases.filter(p=>(p.paidBy?._id||p.paidBy)?.toString()===m._id?.toString()).reduce((s,p)=>s+(p.totalAmount||p.amount||0),0);
              return (
                <div key={m._id||i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"rgba(139,94,60,0.04)",borderRadius:14,border:"1px solid rgba(139,94,60,0.08)",flex:"0 0 auto",minWidth:150}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:MEMBER_COLORS[i%MEMBER_COLORS.length],display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:900,fontSize:14,flexShrink:0}}>
                    {(m.name||"?")[0].toUpperCase()}
                  </div>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:800,color:"#1a1410",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.name}</div>
                    <div style={{fontSize:10,color:"#9c8672",fontWeight:600}}>Paid: {INR(paidTotal)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');`}</style>
    </div>
  );
}