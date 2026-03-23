// ══════════════════════════════════════════════════════════════════════════
//  Members.jsx  —  HomeHub Smart Kitchen  (FIXED)
//  Shows ALL household members with email, activities, YOU badge
// ══════════════════════════════════════════════════════════════════════════
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useToast } from "../components/Toast";

const HERO_SLIDES = [
  { img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80" },
  { img: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=1200&q=80" },
  { img: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=1200&q=80" },
];

const COLORS = [
  { bg:"#ff6b2b", light:"rgba(255,107,43,0.12)" },
  { bg:"#7c3aed", light:"rgba(124,58,237,0.12)" },
  { bg:"#2d7a4f", light:"rgba(45,122,79,0.12)"  },
  { bg:"#1565c0", light:"rgba(21,101,192,0.12)"  },
  { bg:"#d32f2f", light:"rgba(211,47,47,0.12)"   },
  { bg:"#00897b", light:"rgba(0,137,123,0.12)"   },
  { bg:"#e67e22", light:"rgba(230,126,34,0.12)"  },
  { bg:"#8e24aa", light:"rgba(142,36,170,0.12)"  },
];

const INR = n => `₹${(n||0).toLocaleString("en-IN")}`;

function getCurrentUserId() {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u?._id || u?.user?._id || u?.id || "";
  } catch { return ""; }
}

export default function Members() {
  const toast    = useToast();
  const navigate = useNavigate();

  const [household,   setHousehold]   = useState(null);
  const [members,     setMembers]     = useState([]);
  const [purchases,   setPurchases]   = useState([]);
  const [memberName,  setMemberName]  = useState("");
  const [loading,     setLoading]     = useState(true);
  const [copied,      setCopied]      = useState(false);
  const [adding,      setAdding]      = useState(false);
  const [slideIdx,    setSlideIdx]    = useState(0);
  const [hovered,     setHovered]     = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const slideRef = useRef(null);
  const currentUserId = getCurrentUserId();

  useEffect(() => {
    slideRef.current = setInterval(() => setSlideIdx(i => (i + 1) % HERO_SLIDES.length), 60000);
    return () => clearInterval(slideRef.current);
  }, []);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const hhRes = await API.get("/household/myhousehold");
      if (hhRes.data) {
        setHousehold(hhRes.data);
        const [mRes, pRes] = await Promise.all([
          API.get(`/household/members/${hhRes.data._id}`),
          API.get(`/purchase/${hhRes.data._id}`).catch(() => ({ data:[] })),
        ]);
        const raw = mRes.data || [];
        setMembers(raw.map(m => typeof m === "string" ? { _id:m, name:m, email:"", role:"member" } : m));
        setPurchases(pRes.data || []);
      }
    } catch(e) {
      console.error(e);
      toast("Could not load members", "error");
    }
    setLoading(false);
  };

  const addMember = async () => {
    if (!memberName.trim()) return;
    setAdding(true);
    try {
      await API.post("/household/member", { householdId:household._id, name:memberName });
      setMemberName("");
      await load();
      toast(`${memberName} added! ✅`, "success");
    } catch(err) {
      toast(err.response?.data?.message || "Error adding member", "error");
    }
    setAdding(false);
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    try {
      await API.delete(`/household/member/${deleteModal.id}`);
      setDeleteModal(null);
      await load();
      toast(`${deleteModal.name} removed`, "info");
    } catch {
      toast("Failed to remove", "error");
      setDeleteModal(null);
    }
  };

  function stats(memberId) {
    let paid = 0, shared = 0, count = 0;
    const mid = memberId?.toString();
    purchases.forEach(p => {
      const payer = (p.paidBy?._id || p.paidBy)?.toString();
      if (payer === mid) { paid += p.totalAmount || p.amount || 0; count++; }
      let used = false;
      (p.items || []).forEach(item => {
        const sb = (item.sharedBy || []).map(m => (m?._id||m)?.toString()).filter(Boolean);
        if (sb.includes(mid)) { shared += ((item.pricePerUnit||0)*(item.quantity||1))/sb.length; used = true; }
      });
      if (!used) shared += (p.totalAmount||p.amount||0) / Math.max(members.length, 1);
    });
    return { paid, shared:Math.round(shared), count };
  }

  const totalSpend = purchases.reduce((s,p) => s+(p.totalAmount||p.amount||0), 0);
  const now = new Date();
  const monthSpend = purchases
    .filter(p => { const d=new Date(p.date||p.createdAt); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); })
    .reduce((s,p) => s+(p.totalAmount||p.amount||0), 0);

  const baseUrl  = window.location.origin;
  const joinLink = `${baseUrl}/join?code=${household?.inviteCode||""}`;
  const shareMsg = `🏠 Join my household on HomeHub!\n\nCode: *${household?.inviteCode}*\nLink: ${joinLink}`;

  if (loading) return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:16 }}>
      <div style={{ width:60,height:60,border:"4px solid rgba(255,107,43,0.15)",borderTop:"4px solid #ff6b2b",borderRadius:"50%",animation:"spin 1s linear infinite" }}/>
      <p style={{ fontSize:15,color:"#5c4a35",fontWeight:600 }}>Loading household...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:20,paddingBottom:32 }}>

      {/* HERO */}
      <div style={{ position:"relative",borderRadius:24,overflow:"hidden",height:200,boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        {HERO_SLIDES.map((sl,i) => (
          <img key={i} src={sl.img} alt="" style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:i===slideIdx?1:0,transition:"opacity 1.2s ease-in-out",zIndex:i===slideIdx?1:0 }}/>
        ))}
        <div style={{ position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(26,20,16,0.88),rgba(26,20,16,0.4))",zIndex:2 }}/>
        <div style={{ position:"relative",zIndex:3,padding:"30px 40px",height:"100%",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div>
            <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:38,fontWeight:800,color:"white",margin:"0 0 6px" }}>Members</h1>
            <p style={{ fontSize:12,color:"rgba(255,255,255,0.55)",margin:0 }}>
              {household?.name} · {household?.mode==="split"?"Split Mode":"Family Mode"}
              <span style={{ color:"#ffaa70",marginLeft:8 }}>· Hi, {members.find(m=>m._id?.toString()===currentUserId)?.name||"You"}! 👋</span>
            </p>
          </div>
          <div style={{ display:"flex",gap:24,alignItems:"center" }}>
            {[{v:members.length,l:"Members",col:"#ffaa70"},{v:INR(monthSpend),l:"This Month",col:"#f0c27f"},{v:INR(totalSpend),l:"All Time",col:"#a5d6a7"}].map(s => (
              <div key={s.l} style={{ textAlign:"center" }}>
                <span style={{ display:"block",fontSize:20,fontWeight:800,color:s.col }}>{s.v}</span>
                <span style={{ fontSize:10,color:"rgba(255,255,255,0.45)" }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position:"absolute",bottom:12,left:"50%",transform:"translateX(-50%)",display:"flex",gap:8,zIndex:3 }}>
          {HERO_SLIDES.map((_,i) => (
            <button key={i} onClick={() => setSlideIdx(i)} style={{ width:i===slideIdx?24:8,height:8,borderRadius:4,background:i===slideIdx?"#ff6b2b":"rgba(255,255,255,0.4)",border:"none",cursor:"pointer",transition:"all 0.3s ease",padding:0 }}/>
          ))}
        </div>
      </div>

      {/* ADD MEMBER */}
      <div style={{ background:"white",borderRadius:20,padding:"22px 26px",boxShadow:"0 4px 24px rgba(139,94,60,0.08)",border:"1px solid rgba(255,107,43,0.07)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16 }}>
          <div>
            <h3 style={{ fontSize:16,fontWeight:800,color:"#1a1410",margin:0,fontFamily:"'Playfair Display',serif" }}>+ Add New Member</h3>
            <p style={{ fontSize:12,color:"#9c8672",margin:"4px 0 0" }}>Add family members to track shared expenses</p>
          </div>
          <span style={{ fontSize:12,fontWeight:700,color:"#9c8672",background:"rgba(139,94,60,0.07)",borderRadius:50,padding:"4px 12px" }}>{members.length} / 10</span>
        </div>
        <div style={{ display:"flex",gap:10,alignItems:"center" }}>
          <span style={{ fontSize:18 }}>👤</span>
          <input
            placeholder="Enter name e.g. Priya, Rahul..."
            value={memberName}
            onChange={e => setMemberName(e.target.value)}
            onKeyDown={e => e.key==="Enter" && addMember()}
            style={{ flex:1,padding:"13px 16px",border:"1.5px solid rgba(139,94,60,0.15)",borderRadius:12,fontSize:14,background:"#fdf8f3",color:"#1a1410",outline:"none" }}
          />
          <button onClick={addMember} disabled={adding||!memberName.trim()} style={{
            padding:"13px 22px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",
            border:"none",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",
            boxShadow:"0 4px 16px rgba(255,107,43,0.3)",whiteSpace:"nowrap",
            opacity:adding||!memberName.trim()?0.6:1,transition:"all 0.2s",
          }}>{adding?"Adding...":"+ Add Member"}</button>
        </div>
      </div>

      {/* MEMBERS GRID */}
      <div>
        <h3 style={{ fontSize:15,fontWeight:800,color:"#1a1410",margin:"0 0 14px" }}>
          👥 Household Members ({members.length})
        </h3>

        {members.length === 0 ? (
          <div style={{ background:"white",borderRadius:20,padding:40,textAlign:"center",boxShadow:"0 4px 20px rgba(139,94,60,0.08)" }}>
            <div style={{ fontSize:48,marginBottom:12 }}>👥</div>
            <p style={{ fontSize:16,fontWeight:700,color:"#1a1410",marginBottom:6 }}>No members yet</p>
            <p style={{ fontSize:13,color:"#9c8672" }}>Add your first family member above!</p>
          </div>
        ) : (
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16 }}>
            {members.map((m, i) => {
              const c      = COLORS[i % COLORS.length];
              const st     = stats(m._id);
              const pct    = totalSpend > 0 ? Math.round((st.paid/totalSpend)*100) : 0;
              const isHov  = hovered === (m._id||i);
              const isYou  = m._id?.toString() === currentUserId;
              const bal    = st.paid - st.shared;

              return (
                <div key={m._id||i}
                  onMouseEnter={() => setHovered(m._id||i)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background:"white",borderRadius:20,overflow:"hidden",position:"relative",
                    boxShadow:isHov?`0 24px 48px rgba(0,0,0,0.15),0 0 0 2px ${c.bg}30`:"0 4px 20px rgba(139,94,60,0.08)",
                    transform:isHov?"perspective(800px) rotateY(-3deg) translateY(-6px)":"perspective(800px) rotateY(0) translateY(0)",
                    transition:"all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
                  }}>

                  <div style={{ height:5,background:`linear-gradient(90deg,${c.bg},${c.bg}66)` }}/>

                  {isYou && (
                    <div style={{ position:"absolute",top:14,right:14,background:c.bg,color:"white",fontSize:10,fontWeight:800,padding:"3px 10px",borderRadius:50,boxShadow:`0 2px 8px ${c.bg}60`,zIndex:2 }}>YOU</div>
                  )}

                  <div style={{ padding:20 }}>
                    {/* Avatar + name + email */}
                    <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:16 }}>
                      <div style={{
                        width:54,height:54,borderRadius:"50%",
                        background:`linear-gradient(135deg,${c.bg},${c.bg}99)`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        color:"white",fontWeight:900,fontSize:22,flexShrink:0,
                        boxShadow:`0 6px 20px ${c.bg}40`,
                        transform:isHov?"scale(1.08) rotate(-4deg)":"scale(1)",
                        transition:"transform 0.3s ease",
                      }}>{(m.name||"?")[0].toUpperCase()}</div>

                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:16,fontWeight:800,color:"#1a1410",marginBottom:2 }}>{m.name||"Member"}</div>
                        <div style={{ fontSize:12,color:"#9c8672",marginBottom:m.email?4:0 }}>
                          {m.role==="admin"?"⚡ Admin":isYou?"Account Owner":"Member"}
                        </div>
                        {m.email && (
                          <div style={{ fontSize:11,color:"#7c6b5a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                            📧 {m.email}
                          </div>
                        )}
                      </div>

                      {!isYou && (
                        <button onClick={() => setDeleteModal({id:m._id,name:m.name})} style={{
                          background:"rgba(220,53,69,0.08)",border:"none",borderRadius:"50%",
                          width:28,height:28,cursor:"pointer",color:"#d32f2f",fontSize:13,
                          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s",
                        }}
                        onMouseEnter={e=>{e.currentTarget.style.background="#d32f2f";e.currentTarget.style.color="white";}}
                        onMouseLeave={e=>{e.currentTarget.style.background="rgba(220,53,69,0.08)";e.currentTarget.style.color="#d32f2f";}}>✕</button>
                      )}
                    </div>

                    <span style={{ display:"inline-block",background:c.light,color:c.bg,borderRadius:50,padding:"3px 12px",fontSize:11,fontWeight:700,marginBottom:14 }}>
                      #{i+1} Member
                    </span>

                    {/* Stats */}
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12 }}>
                      {[["Paid",INR(st.paid),c.bg],["Share",INR(st.shared),"#5c4a35"],["Bills",st.count,"#9c8672"]].map(([l,v,col]) => (
                        <div key={l} style={{ background:"#fdf8f3",borderRadius:10,padding:"8px 6px",textAlign:"center" }}>
                          <span style={{ display:"block",fontSize:12,fontWeight:800,color:col }}>{v}</span>
                          <span style={{ display:"block",fontSize:9,color:"#9c8672",fontWeight:600,textTransform:"uppercase",marginTop:1 }}>{l}</span>
                        </div>
                      ))}
                    </div>

                    {/* Contribution bar */}
                    {totalSpend > 0 && (
                      <div style={{ marginBottom:12 }}>
                        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                          <span style={{ fontSize:10,color:"#9c8672" }}>Contribution</span>
                          <span style={{ fontSize:10,fontWeight:700,color:c.bg }}>{pct}%</span>
                        </div>
                        <div style={{ height:5,background:"rgba(139,94,60,0.1)",borderRadius:3,overflow:"hidden" }}>
                          <div style={{ height:"100%",borderRadius:3,background:`linear-gradient(90deg,${c.bg},${c.bg}88)`,width:`${pct}%`,transition:"width 0.8s ease" }}/>
                        </div>
                      </div>
                    )}

                    {/* Balance footer */}
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:10,borderTop:"1px solid rgba(139,94,60,0.06)" }}>
                      <span style={{ fontSize:11,fontWeight:600,color:st.count>0?c.bg:"#9c8672" }}>
                        {st.count>0?`${st.count} bill${st.count>1?"s":""} · ${INR(st.paid)} paid`:"No purchases yet"}
                      </span>
                      {totalSpend > 0 && (
                        <span style={{ fontSize:11,fontWeight:700,color:bal>=0?"#2d7a4f":"#d32f2f",background:bal>=0?"rgba(45,122,79,0.08)":"rgba(211,47,47,0.08)",borderRadius:50,padding:"2px 8px" }}>
                          {bal>=0?"+":""}{INR(bal)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Ghost add card */}
            <button onClick={() => document.querySelector("input")?.focus()} style={{
              border:"2px dashed rgba(255,107,43,0.25)",borderRadius:20,background:"white",
              cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",
              justifyContent:"center",gap:10,padding:30,minHeight:200,transition:"all 0.3s ease",
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#ff6b2b";e.currentTarget.style.background="rgba(255,107,43,0.03)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,107,43,0.25)";e.currentTarget.style.background="white";}}>
              <div style={{ width:50,height:50,borderRadius:"50%",background:"rgba(255,107,43,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,color:"#ff6b2b" }}>+</div>
              <span style={{ fontSize:13,fontWeight:700,color:"#ff6b2b" }}>Add Member</span>
            </button>
          </div>
        )}
      </div>

      {/* EXPENSE TABLE */}
      {members.length > 0 && purchases.length > 0 && (
        <div style={{ background:"white",borderRadius:20,overflow:"hidden",boxShadow:"0 4px 20px rgba(139,94,60,0.08)" }}>
          <div style={{ position:"relative",height:72 }}>
            <img src="https://images.unsplash.com/photo-1567337710282-00832b415979?w=800&q=70" alt="" style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover" }}/>
            <div style={{ position:"absolute",inset:0,background:"rgba(26,20,16,0.82)" }}/>
            <div style={{ position:"relative",zIndex:2,padding:"16px 22px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div>
                <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:800,color:"white",margin:0 }}>💰 Shared Expense Breakdown</h3>
                <p style={{ fontSize:11,color:"rgba(255,255,255,0.5)",margin:"2px 0 0" }}>Total: <b style={{ color:"#ffaa70" }}>{INR(totalSpend)}</b></p>
              </div>
              <button onClick={() => navigate("/purchases")} style={{ padding:"7px 14px",background:"rgba(255,107,43,0.8)",color:"white",border:"none",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer" }}>
                View All →
              </button>
            </div>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%",borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"#fdf8f3" }}>
                  {["Member","Email","Paid","Fair Share","Balance","Bills"].map(h => (
                    <th key={h} style={{ padding:"10px 14px",fontSize:10,fontWeight:700,color:"#9c8672",textAlign:"left",textTransform:"uppercase",letterSpacing:"0.05em",borderBottom:"1px solid rgba(139,94,60,0.08)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m,i) => {
                  const st  = stats(m._id);
                  const bal = st.paid - st.shared;
                  const c   = COLORS[i % COLORS.length];
                  return (
                    <tr key={m._id||i} style={{ borderBottom:"1px solid rgba(139,94,60,0.05)",transition:"background 0.15s" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#fdf8f3"}
                      onMouseLeave={e=>e.currentTarget.style.background="white"}>
                      <td style={{ padding:"11px 14px" }}>
                        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                          <div style={{ width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${c.bg},${c.bg}88)`,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:12 }}>
                            {(m.name||"?")[0].toUpperCase()}
                          </div>
                          <span style={{ fontSize:13,fontWeight:700,color:"#1a1410" }}>{m.name}</span>
                          {m._id?.toString()===currentUserId && <span style={{ fontSize:9,background:c.bg,color:"white",borderRadius:50,padding:"1px 6px",fontWeight:700 }}>YOU</span>}
                        </div>
                      </td>
                      <td style={{ padding:"11px 14px",fontSize:12,color:"#9c8672" }}>{m.email||"—"}</td>
                      <td style={{ padding:"11px 14px",fontSize:13,fontWeight:700,color:c.bg }}>{INR(st.paid)}</td>
                      <td style={{ padding:"11px 14px",fontSize:13,color:"#5c4a35" }}>{INR(st.shared)}</td>
                      <td style={{ padding:"11px 14px" }}>
                        <span style={{ padding:"3px 10px",borderRadius:50,fontSize:12,fontWeight:700,background:bal>=0?"rgba(45,122,79,0.1)":"rgba(211,47,47,0.1)",color:bal>=0?"#2d7a4f":"#d32f2f" }}>
                          {bal>=0?"+":""}{INR(bal)}
                        </span>
                      </td>
                      <td style={{ padding:"11px 14px",fontSize:13,color:"#9c8672" }}>{st.count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HOUSEHOLD INFO */}
      {household && (
        <div style={{ position:"relative",borderRadius:20,overflow:"hidden",minHeight:130,boxShadow:"0 8px 28px rgba(0,0,0,0.12)" }}>
          <img src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80" alt="" style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover" }}/>
          <div style={{ position:"absolute",inset:0,background:"rgba(26,20,16,0.85)" }}/>
          <div style={{ position:"relative",zIndex:2,padding:"22px 28px" }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:800,color:"white",marginBottom:14 }}>🏠 {household.name}</h3>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:12 }}>
              {[
                {icon:"🔑",label:"Invite Code",val:household.inviteCode||"N/A"},
                {icon:"💫",label:"Mode",val:household.mode==="split"?"Split Mode":"Family Mode"},
                {icon:"💰",label:"Monthly Budget",val:INR(household.monthlyBudget||5000)},
                {icon:"🥗",label:"Diet",val:household.foodPreference||"Non-veg"},
              ].map(item => (
                <div key={item.label} style={{ display:"flex",alignItems:"flex-start",gap:8 }}>
                  <span style={{ fontSize:16 }}>{item.icon}</span>
                  <div>
                    <p style={{ margin:0,fontSize:9,color:"rgba(255,255,255,0.45)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em" }}>{item.label}</p>
                    <p style={{ margin:0,fontSize:13,color:"white",fontWeight:700 }}>{item.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INVITE SECTION */}
      {household?.inviteCode && (
        <div style={{ background:"white",borderRadius:20,padding:"22px 24px",boxShadow:"0 4px 20px rgba(139,94,60,0.08)",border:"1px solid rgba(255,107,43,0.08)" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16 }}>
            <div style={{ width:38,height:38,borderRadius:10,background:"rgba(255,107,43,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>🔑</div>
            <div>
              <div style={{ fontWeight:800,fontSize:14,color:"#1a1410" }}>Invite Members</div>
              <div style={{ fontSize:11,color:"#9c8672" }}>Share code to add someone to <b style={{ color:"#5c4a35" }}>{household.name}</b></div>
            </div>
          </div>
          <div style={{ display:"flex",gap:10,marginBottom:14 }}>
            <div style={{ flex:1,background:"#fdf8f3",border:"1.5px dashed rgba(255,107,43,0.35)",borderRadius:12,padding:"12px 18px",fontFamily:"monospace",fontSize:26,fontWeight:900,color:"#1a1410",letterSpacing:"0.18em",textAlign:"center" }}>
              {household.inviteCode}
            </div>
            <button onClick={() => { navigator.clipboard.writeText(household.inviteCode); setCopied(true); toast("Code copied! ✅","success"); setTimeout(()=>setCopied(false),2500); }} style={{ padding:"12px 18px",borderRadius:12,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,flexShrink:0,transition:"all .2s",background:copied?"rgba(45,122,79,0.12)":"rgba(255,107,43,0.1)",color:copied?"#2d7a4f":"#ff6b2b" }}>
              {copied?"✓ Copied!":"📋 Copy"}
            </button>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8 }}>
            {[
              {label:"WhatsApp",icon:"📱",bg:"#25D366",action:()=>window.open(`https://wa.me/?text=${encodeURIComponent(shareMsg)}`,"_blank")},
              {label:"Email",icon:"✉️",bg:"#EA4335",action:()=>window.open(`mailto:?subject=Join HomeHub&body=${encodeURIComponent(shareMsg)}`,"_self")},
              {label:"SMS",icon:"💬",bg:"#1d4ed8",action:()=>window.open(`sms:?body=${encodeURIComponent(shareMsg)}`,"_self")},
              {label:"Copy Link",icon:"🔗",bg:"rgba(255,107,43,0.1)",textColor:"#ff6b2b",border:"1.5px solid rgba(255,107,43,0.25)",action:()=>{navigator.clipboard.writeText(joinLink);toast("Link copied!","success");}},
            ].map(btn => (
              <button key={btn.label} onClick={btn.action} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:5,padding:"12px 8px",borderRadius:12,border:btn.border||"none",cursor:"pointer",background:btn.bg,color:btn.textColor||"white",fontWeight:700,fontSize:11,transition:"all 0.2s" }}
              onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
              onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                <span style={{ fontSize:20 }}>{btn.icon}</span>{btn.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(26,20,16,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)" }}
          onClick={e=>e.target===e.currentTarget&&setDeleteModal(null)}>
          <div style={{ background:"white",borderRadius:24,padding:32,maxWidth:360,width:"90%",boxShadow:"0 32px 80px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize:40,textAlign:"center",marginBottom:12 }}>🗑️</div>
            <h3 style={{ fontSize:18,fontWeight:800,color:"#1a1410",textAlign:"center",margin:"0 0 8px" }}>Remove Member?</h3>
            <p style={{ fontSize:13,color:"#9c8672",textAlign:"center",margin:"0 0 24px" }}>
              Remove <b style={{ color:"#1a1410" }}>{deleteModal.name}</b> from the household?
            </p>
            <div style={{ display:"flex",gap:12 }}>
              <button onClick={()=>setDeleteModal(null)} style={{ flex:1,padding:"12px",background:"rgba(139,94,60,0.08)",color:"#5c4a35",border:"none",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer" }}>Cancel</button>
              <button onClick={confirmDelete} style={{ flex:1,padding:"12px",background:"linear-gradient(135deg,#d32f2f,#ef5350)",color:"white",border:"none",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 16px rgba(211,47,47,0.3)" }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      <style>{`input:focus{outline:none!important;border-color:#ff6b2b!important;box-shadow:0 0 0 3px rgba(255,107,43,0.1)!important;}`}</style>
    </div>
  );
}