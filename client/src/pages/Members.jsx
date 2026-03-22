import { useEffect, useState } from "react";
import axios from "axios";
import { useToast } from "../components/Toast";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";

const SLIDES = [
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80",
  "https://images.unsplash.com/photo-1567337710282-00832b415979?w=1200&q=80",
  "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=1200&q=80",
];
const COLORS = [
  { bg:"#ff6b2b", lt:"rgba(255,107,43,0.1)" },
  { bg:"#7c3aed", lt:"rgba(124,58,237,0.1)" },
  { bg:"#2d7a4f", lt:"rgba(45,122,79,0.1)"  },
  { bg:"#1565c0", lt:"rgba(21,101,192,0.1)" },
  { bg:"#d32f2f", lt:"rgba(211,47,47,0.1)"  },
  { bg:"#00897b", lt:"rgba(0,137,123,0.1)"  },
];
const AVATARS = ["🧑‍🍳","👩‍🍳","🧔","👩","👦","👧","🧓","👵","🧑","👨"];
const INR = n => "\u20b9" + (n||0).toLocaleString("en-IN");

async function tryAddMember(hhId, name, headers) {
  const body = { householdId: hhId, name };
  const routes = [
    `${API}/household/member`,
    `${API}/household/addmember`,
    `${API}/household/add-member`,
    `${API}/household/${hhId}/member`,
    `${API}/household/${hhId}/members`,
    `${API}/household/${hhId}/addmember`,
  ];
  let lastErr = null;
  for (const route of routes) {
    try { return await axios.post(route, body, { headers }); }
    catch (err) { lastErr = err; if (err.response?.status !== 404) throw err; }
  }
  throw lastErr;
}

export default function Members() {
  const toast = useToast();
  const [household,  setHousehold]  = useState(null);
  const [members,    setMembers]    = useState([]);
  const [purchases,  setPurchases]  = useState([]);
  const [memberName, setMemberName] = useState("");
  const [loading,    setLoading]    = useState(true);
  const [copied,     setCopied]     = useState(false);
  const [adding,     setAdding]     = useState(false);
  const [heroIdx,    setHeroIdx]    = useState(0);
  const [tilts,      setTilts]      = useState({});
  const [delConfirm, setDelConfirm] = useState(null);

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const currentUser = (() => {
    try { const u = JSON.parse(localStorage.getItem("user") || "{}"); return u?.user || u || {}; }
    catch { return {}; }
  })();

  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % SLIDES.length), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/household/myhousehold`, { headers });
      if (res.data) {
        setHousehold(res.data);
        const hhId = res.data._id || res.data.id;
        const [mRes, pRes] = await Promise.all([
          axios.get(`${API}/household/members/${hhId}`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${API}/purchase/${hhId}`, { headers }).catch(() => ({ data: [] })),
        ]);
        setMembers(mRes.data || []);
        setPurchases(pRes.data || []);
      }
    } catch (err) {
      if (err.response?.status === 401) toast("Session expired. Please login again.", "error");
    }
    setLoading(false);
  };

  const addMember = async () => {
    if (!memberName.trim()) return;
    if (!household) { toast("No household found. Set up your household first.", "error"); return; }
    const hhId = household._id || household.id;
    if (!hhId) { toast("Household ID missing. Please refresh.", "error"); return; }
    setAdding(true);
    try {
      await tryAddMember(hhId, memberName.trim(), headers);
      const nm = memberName.trim();
      setMemberName("");
      await load();
      toast(`${nm} added! 🎉`, "success");
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      if (status === 401) toast("Not authorized. Please login again.", "error");
      else if (status === 403) toast("No permission to add members.", "error");
      else if (status === 400) toast(msg || "Invalid request.", "error");
      else if (status === 409) toast("Member already exists.", "error");
      else if (!err.response) toast("Network error. Is the server running?", "error");
      else toast(msg || `Server error (${status || "?"}). Check console for details.`, "error");
    }
    setAdding(false);
  };

  const deleteMember = async (id, name) => {
    setDelConfirm(null);
    try {
      await axios.delete(`${API}/household/member/${id}`, { headers });
      await load();
      toast(`${name} removed`, "info");
    } catch (err) { toast(err.response?.data?.message || "Could not remove member", "error"); }
  };

  const onTiltMove = (e, id) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTilts(t => ({ ...t, [id]: { x: ((e.clientX - r.left) / r.width - 0.5) * 16, y: ((e.clientY - r.top) / r.height - 0.5) * -16 } }));
  };
  const onTiltLeave = (id) => setTilts(t => ({ ...t, [id]: { x: 0, y: 0 } }));

  function getMemberStats(memberId) {
    let totalPaid = 0, totalShared = 0, purchaseCount = 0;
    const mid = memberId?.toString();
    purchases.forEach(p => {
      const payer = (p.paidBy?._id || p.paidBy)?.toString();
      if (payer === mid) { totalPaid += p.totalAmount || p.amount || 0; purchaseCount++; }
      const total = p.totalAmount || p.amount || 0;
      let usedItemLevel = false;
      (p.items || []).forEach(item => {
        const shared = (item.sharedBy || []).map(m => (m?._id || m)?.toString()).filter(Boolean);
        if (shared.length > 0 && shared.includes(mid)) {
          totalShared += (item.pricePerUnit || 0) * (item.quantity || 1) / shared.length;
          usedItemLevel = true;
        }
      });
      if (!usedItemLevel) totalShared += total / (members?.length || 1);
    });
    return { totalPaid, totalShared: Math.round(totalShared), purchaseCount };
  }

  const totalSpend = purchases.reduce((s, p) => s + (p.totalAmount || p.amount || 0), 0);
  const now = new Date();
  const monthSpend = purchases
    .filter(p => { const d = new Date(p.date || p.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
    .reduce((s, p) => s + (p.totalAmount || p.amount || 0), 0);

  const userInList = members.some(m =>
    m.name?.toLowerCase() === currentUser?.name?.toLowerCase() ||
    m.userId === currentUser?._id || m._id === currentUser?._id
  );
  const displayMembers = userInList ? members : (
    currentUser?.name
      ? [{ _id: `__you__${currentUser._id || "local"}`, name: currentUser.name, isYou: true }, ...members]
      : members
  );

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"60vh", gap:16 }}>
      <div style={{ width:48, height:48, borderRadius:"50%", border:"4px solid rgba(255,107,43,0.2)", borderTopColor:"#ff6b2b", animation:"spin 0.8s linear infinite" }}/>
      <p style={{ color:"#5c4a35", fontWeight:600 }}>Loading household...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const baseUrl = window.location.origin;
  const joinLink = `${baseUrl}/join?code=${household?.inviteCode || ""}`;
  const shareMsg = `Join my household on HomeHub!\n\nInvite code: *${household?.inviteCode}*\n${joinLink}`;
  const copyCode = () => {
    navigator.clipboard.writeText(household?.inviteCode || "").then(() => {
      setCopied(true); toast("Code copied! \u2705", "success"); setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20, paddingBottom:32 }}>

      {/* HERO slideshow */}
      <div style={{ position:"relative", borderRadius:24, overflow:"hidden", height:200, boxShadow:"0 16px 48px rgba(0,0,0,0.18)" }}>
        {SLIDES.map((src, i) => (
          <img key={src} src={src} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover",
            opacity: i === heroIdx ? 1 : 0, transition:"opacity 2.5s ease-in-out", zIndex: i === heroIdx ? 1 : 0 }}/>
        ))}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,rgba(26,20,16,0.88),rgba(26,20,16,0.45))", zIndex:2 }}/>
        <div style={{ position:"relative", zIndex:3, padding:"30px 36px", height:"100%", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:36, fontWeight:800, color:"white", margin:"0 0 6px" }}>Members</h1>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", margin:0 }}>
              {household?.name} · {household?.mode === "split" ? "Split Mode" : "Family Mode"}
              {currentUser?.name && <span style={{ color:"rgba(255,165,100,0.85)", marginLeft:8 }}>· Hi, {currentUser.name}! 👋</span>}
            </p>
          </div>
          <div style={{ display:"flex", gap:24 }}>
            {[{ n:displayMembers.length, l:"Members", c:"#ffaa70" }, { n:INR(monthSpend), l:"This Month", c:"#c9a96e" }, { n:INR(totalSpend), l:"All Time", c:"#a5d6a7" }].map(({ n, l, c }) => (
              <div key={l} style={{ textAlign:"center" }}>
                <span style={{ display:"block", fontSize:20, fontWeight:800, color:c }}>{n}</span>
                <span style={{ display:"block", fontSize:10, color:"rgba(255,255,255,0.45)", fontWeight:500, marginTop:2 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position:"absolute", bottom:10, left:"50%", transform:"translateX(-50%)", zIndex:4, display:"flex", gap:6 }}>
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setHeroIdx(i)} style={{ width:i===heroIdx?20:8, height:8, borderRadius:4, border:"none", cursor:"pointer", padding:0, background:i===heroIdx?"rgba(255,107,43,0.9)":"rgba(255,255,255,0.4)", transition:"all 0.3s ease" }}/>
          ))}
        </div>
      </div>

      {/* ADD MEMBER */}
      <div style={{ background:"white", borderRadius:20, padding:"22px 26px", boxShadow:"0 4px 24px rgba(139,94,60,0.09)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
          <div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:800, color:"#1a1410", margin:0 }}>+ Add New Member</h3>
            <p style={{ fontSize:12, color:"#9c8672", margin:"4px 0 0" }}>Add family members to track shared expenses</p>
          </div>
          <span style={{ fontSize:12, fontWeight:700, color:"#9c8672", background:"rgba(139,94,60,0.07)", borderRadius:50, padding:"4px 12px" }}>{displayMembers.length} / 10</span>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ fontSize:18 }}>👤</span>
          <input
            placeholder="Enter member name (e.g. Priya, Rahul…)"
            value={memberName}
            onChange={e => setMemberName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addMember()}
            style={{ flex:1, padding:"13px 16px", border:"1.5px solid rgba(139,94,60,0.15)", borderRadius:12, fontSize:14, background:"#fdf8f3", color:"#1a1410", outline:"none" }}
          />
          <button onClick={addMember} disabled={adding || !memberName.trim() || displayMembers.length >= 10}
            style={{ padding:"13px 20px", background:"linear-gradient(135deg,#ff6b2b,#ff8c54)", color:"white", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 14px rgba(255,107,43,0.3)", whiteSpace:"nowrap", opacity:adding||!memberName.trim()?0.6:1, transition:"all .2s" }}>
            {adding ? "Adding…" : "+ Add Member"}
          </button>
        </div>
        {!household && (
          <div style={{ marginTop:10, padding:"9px 14px", background:"rgba(255,107,43,0.06)", borderRadius:10, fontSize:12, color:"#ff6b2b", fontWeight:600 }}>
            ⚠️ No household found. <a href="/setup" style={{ color:"#ff6b2b", fontWeight:800 }}>Set up your household</a> first to add members.
          </div>
        )}
      </div>

      {/* MEMBERS GRID */}
      {displayMembers.length > 0 ? (
        <div>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:800, color:"#1a1410", margin:"0 0 14px" }}>
            👨‍👩‍👧 Household Members ({displayMembers.length})
          </h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16 }}>
            {displayMembers.map((m, i) => {
              const c = COLORS[i % COLORS.length];
              const avatar = AVATARS[i % AVATARS.length];
              const stats = m.isYou ? { totalPaid:0, totalShared:0, purchaseCount:0 } : getMemberStats(m._id);
              const sharePercent = totalSpend > 0 ? Math.round((stats.totalPaid / totalSpend) * 100) : 0;
              const tilt = tilts[m._id] || { x: 0, y: 0 };
              return (
                <div key={m._id} style={{
                  background:"white", borderRadius:20, overflow:"hidden", willChange:"transform",
                  transform:`perspective(900px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) translateZ(${Math.abs(tilt.x)+Math.abs(tilt.y)>0?8:0}px)`,
                  transition:"transform 0.1s ease, box-shadow 0.2s ease",
                  boxShadow:`0 ${6+Math.abs(tilt.y)}px ${20+Math.abs(tilt.x)*2}px rgba(139,94,60,0.12)`,
                }} onMouseMove={e => onTiltMove(e, m._id)} onMouseLeave={() => onTiltLeave(m._id)}>
                  <div style={{ height:5, background:`linear-gradient(90deg,${c.bg},${c.bg}66)` }}/>
                  <div style={{ padding:18 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                      <div style={{ width:56, height:56, borderRadius:"50%", background:`linear-gradient(135deg,${c.bg},${c.bg}99)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, boxShadow:`0 8px 24px ${c.bg}50` }}>
                        {avatar}
                      </div>
                      {m.isYou ? (
                        <span style={{ background:`${c.bg}18`, color:c.bg, borderRadius:50, padding:"3px 8px", fontSize:10, fontWeight:700 }}>You</span>
                      ) : delConfirm === m._id ? (
                        <div style={{ display:"flex", gap:4 }}>
                          <button onClick={() => deleteMember(m._id, m.name)} style={{ background:"rgba(211,47,47,0.1)", border:"none", borderRadius:8, padding:"3px 8px", cursor:"pointer", color:"#d32f2f", fontSize:11, fontWeight:700 }}>Yes</button>
                          <button onClick={() => setDelConfirm(null)} style={{ background:"rgba(139,94,60,0.08)", border:"none", borderRadius:8, padding:"3px 8px", cursor:"pointer", color:"#9c8672", fontSize:11 }}>No</button>
                        </div>
                      ) : (
                        <button onClick={() => setDelConfirm(m._id)} style={{ background:"rgba(220,53,69,0.08)", border:"none", borderRadius:"50%", width:28, height:28, cursor:"pointer", color:"#d32f2f", fontSize:12 }}>✕</button>
                      )}
                    </div>
                    <div style={{ fontSize:16, fontWeight:800, color:"#1a1410", marginBottom:2 }}>{m.name}</div>
                    <div style={{ fontSize:12, color:"#9c8672", marginBottom:8 }}>{m.isYou ? "Account Owner" : "Household Member"}</div>
                    <div style={{ display:"inline-block", borderRadius:50, padding:"3px 10px", fontSize:11, fontWeight:700, marginBottom:12, background:c.lt, color:c.bg }}>#{i + 1} Member</div>

                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:5, marginBottom:10 }}>
                      {[
                        { v:INR(stats.totalPaid),   l:"Paid",  bg:`${c.bg}10`, col:c.bg },
                        { v:INR(stats.totalShared), l:"Share", bg:"#fdf8f3",    col:"#5c4a35" },
                        { v:stats.purchaseCount,    l:"Bills", bg:"#fdf8f3",    col:"#9c8672" },
                      ].map(({ v, l, bg, col }) => (
                        <div key={l} style={{ background:bg, borderRadius:8, padding:7, textAlign:"center" }}>
                          <span style={{ display:"block", fontSize:12, fontWeight:800, color:col }}>{v}</span>
                          <span style={{ display:"block", fontSize:9, color:"#9c8672", fontWeight:600, textTransform:"uppercase", marginTop:1 }}>{l}</span>
                        </div>
                      ))}
                    </div>

                    {totalSpend > 0 && !m.isYou && (
                      <div style={{ marginBottom:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:10, color:"#9c8672" }}>Contribution</span>
                          <span style={{ fontSize:10, fontWeight:700, color:c.bg }}>{sharePercent}%</span>
                        </div>
                        <div style={{ height:6, background:"rgba(139,94,60,0.1)", borderRadius:3, overflow:"hidden" }}>
                          <div style={{ height:"100%", borderRadius:3, background:`linear-gradient(90deg,${c.bg},${c.bg}88)`, width:`${sharePercent}%`, transition:"width 0.8s ease" }}/>
                        </div>
                      </div>
                    )}

                    <div style={{ display:"flex", alignItems:"center", gap:6, paddingTop:8, borderTop:"1px solid rgba(139,94,60,0.06)" }}>
                      <span style={{ fontSize:14 }}>🛒</span>
                      <span style={{ fontSize:11, fontWeight:600, color:stats.totalPaid > 0 ? c.bg : "#9c8672" }}>
                        {stats.totalPaid > 0 ? `Paid ${INR(stats.totalPaid)} total` : m.isYou ? "Your household account" : "No purchases yet"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <button onClick={() => document.querySelector("input")?.focus()} style={{ border:"2px dashed rgba(255,107,43,0.25)", borderRadius:20, background:"white", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, padding:30, transition:"all 0.2s", minHeight:200 }}>
              <div style={{ width:48, height:48, borderRadius:"50%", background:"rgba(255,107,43,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:26, color:"#ff6b2b" }}>+</span>
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:"#ff6b2b" }}>Add Member</span>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ background:"white", borderRadius:20, padding:40, textAlign:"center", boxShadow:"0 4px 20px rgba(139,94,60,0.08)" }}>
          <div style={{ fontSize:52, marginBottom:12 }}>👨‍👩‍👧</div>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:800, color:"#1a1410", marginBottom:6 }}>No members yet</h3>
          <p style={{ fontSize:13, color:"#9c8672", marginBottom:20 }}>Add your first family member above to start tracking expenses</p>
          <button onClick={() => document.querySelector("input")?.focus()} style={{ padding:"10px 24px", background:"linear-gradient(135deg,#ff6b2b,#ff8c54)", color:"white", border:"none", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer" }}>
            + Add First Member
          </button>
        </div>
      )}

      {/* EXPENSE TABLE */}
      {displayMembers.filter(m => !m.isYou).length > 0 && purchases.length > 0 && (
        <div style={{ background:"white", borderRadius:20, overflow:"hidden", boxShadow:"0 4px 20px rgba(139,94,60,0.08)" }}>
          <div style={{ position:"relative", height:80 }}>
            <img src="https://images.unsplash.com/photo-1567337710282-00832b415979?w=800&q=70" alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}/>
            <div style={{ position:"absolute", inset:0, background:"rgba(26,20,16,0.82)" }}/>
            <div style={{ position:"relative", zIndex:2, padding:"18px 22px" }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:800, color:"white", margin:0 }}>💰 Shared Expense Breakdown</h3>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)", margin:"3px 0 0" }}>Total household: <b style={{ color:"#ffaa70" }}>{INR(totalSpend)}</b></p>
            </div>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"#fdf8f3" }}>
                  {["Member","Total Paid","Share","Net Balance","# Bills"].map(h => (
                    <th key={h} style={{ padding:"10px 14px", fontSize:10, fontWeight:700, color:"#9c8672", textAlign:"left", textTransform:"uppercase", letterSpacing:"0.05em", borderBottom:"1px solid rgba(139,94,60,0.08)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayMembers.filter(m => !m.isYou).map((m, i) => {
                  const stats = getMemberStats(m._id);
                  const balance = stats.totalPaid - stats.totalShared;
                  const c = COLORS[i % COLORS.length];
                  return (
                    <tr key={m._id} style={{ borderBottom:"1px solid rgba(139,94,60,0.05)" }}>
                      <td style={{ padding:"11px 14px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:28, height:28, borderRadius:"50%", background:`linear-gradient(135deg,${c.bg},${c.bg}99)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>{AVATARS[i]}</div>
                          <span style={{ fontSize:13, fontWeight:700, color:"#1a1410" }}>{m.name}</span>
                        </div>
                      </td>
                      <td style={{ padding:"11px 14px", fontSize:13, fontWeight:700, color:c.bg }}>{INR(stats.totalPaid)}</td>
                      <td style={{ padding:"11px 14px", fontSize:13, color:"#5c4a35" }}>{INR(stats.totalShared)}</td>
                      <td style={{ padding:"11px 14px" }}>
                        <span style={{ padding:"3px 10px", borderRadius:50, fontSize:12, fontWeight:700, background:balance>=0?"rgba(45,122,79,0.1)":"rgba(211,47,47,0.1)", color:balance>=0?"#2d7a4f":"#d32f2f" }}>
                          {balance >= 0 ? "+" : ""}{INR(balance)}
                        </span>
                      </td>
                      <td style={{ padding:"11px 14px", fontSize:13, color:"#9c8672" }}>{stats.purchaseCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HOUSEHOLD INFO + INVITE */}
      {household && (
        <>
          <div style={{ position:"relative", borderRadius:20, overflow:"hidden", minHeight:150, boxShadow:"0 8px 28px rgba(0,0,0,0.12)" }}>
            <img src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80" alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}/>
            <div style={{ position:"absolute", inset:0, background:"rgba(26,20,16,0.82)" }}/>
            <div style={{ position:"relative", zIndex:2, padding:"24px 28px" }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:800, color:"white", marginBottom:14 }}>🏠 {household.name}</h3>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12 }}>
                {[
                  { icon:"🔑", label:"Invite Code", val:household.inviteCode || "N/A" },
                  { icon:"💫", label:"Mode", val:household.mode==="split"?"Split Mode":"Family Mode" },
                  { icon:"💰", label:"Monthly Budget", val:INR(household.monthlyBudget||5000) },
                  { icon:"🥗", label:"Diet", val:household.foodPreference||"Non-veg" },
                ].map(item => (
                  <div key={item.label} style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                    <span style={{ fontSize:18 }}>{item.icon}</span>
                    <div>
                      <p style={{ margin:0, fontSize:10, color:"rgba(255,255,255,0.45)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>{item.label}</p>
                      <p style={{ margin:0, fontSize:13, color:"white", fontWeight:700 }}>{item.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {household?.inviteCode && (
            <div style={{ background:"white", borderRadius:20, padding:"20px 22px", boxShadow:"0 4px 20px rgba(139,94,60,0.08)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:"rgba(255,107,43,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🔑</div>
                <div>
                  <div style={{ fontWeight:800, fontSize:14, color:"#1a1410" }}>Invite Members</div>
                  <div style={{ fontSize:11, color:"#9c8672" }}>Share code or link to add someone to <b style={{ color:"#5c4a35" }}>{household.name}</b></div>
                </div>
              </div>
              <div style={{ display:"flex", gap:10, marginBottom:12 }}>
                <div style={{ flex:1, background:"#fdf8f3", border:"1.5px dashed rgba(255,107,43,0.35)", borderRadius:12, padding:"12px 18px", fontFamily:"monospace", fontSize:28, fontWeight:900, color:"#1a1410", letterSpacing:"0.18em", textAlign:"center" }}>
                  {household.inviteCode}
                </div>
                <button onClick={copyCode} style={{ padding:"12px 16px", borderRadius:12, border:"none", cursor:"pointer", fontWeight:700, fontSize:13, flexShrink:0, transition:"all .2s", background:copied?"rgba(45,122,79,0.12)":"rgba(255,107,43,0.1)", color:copied?"#2d7a4f":"#ff6b2b" }}>
                  {copied ? "✓ Copied!" : "📋 Copy"}
                </button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
                {[
                  { fn:() => window.open(`https://wa.me/?text=${encodeURIComponent(shareMsg)}`,"_blank"), bg:"#25D366", icon:"📱", label:"WhatsApp" },
                  { fn:shareEmail, bg:"#EA4335", icon:"✉️", label:"Email" },
                  { fn:() => window.open(`sms:?body=${encodeURIComponent(shareMsg)}`,"_self"), bg:"#1d4ed8", icon:"💬", label:"SMS" },
                  { fn:shareNative, bg:"rgba(255,107,43,0.08)", icon:"↗️", label:"More", border:"1.5px solid rgba(255,107,43,0.25)", color:"#ff6b2b" },
                ].map(({ fn, bg, icon, label, border, color }) => (
                  <button key={label} onClick={fn} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5, padding:"12px 8px", borderRadius:12, border:border||"none", cursor:"pointer", background:bg, color:color||"white", fontWeight:700, fontSize:12 }}>
                    <span style={{ fontSize:22 }}>{icon}</span>{label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <style>{`input:focus{outline:none!important;border-color:#ff6b2b!important;box-shadow:0 0 0 3px rgba(255,107,43,0.1)!important;}`}</style>
    </div>
  );

  function shareEmail() {
    const sub = encodeURIComponent(`Join my HomeHub household — ${household?.name||""}`);
    const body = encodeURIComponent(`Hi!\n\nJoin my household on HomeHub.\n\nInvite Code: ${household?.inviteCode}\nJoin link: ${joinLink}`);
    window.open(`mailto:?subject=${sub}&body=${body}`, "_self");
  }
  async function shareNative() {
    if (navigator.share) { try { await navigator.share({ title:"Join HomeHub", text:shareMsg, url:joinLink }); } catch {} }
    else { navigator.clipboard.writeText(joinLink); toast("Link copied!", "success"); }
  }
}