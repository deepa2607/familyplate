import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";


const FOOD_EMOJIS = ["🍕","🍔","🍜","🍛","🥘","🍲","🥗","🍣","🧆","🫕","🍱","🥙","🌮","🍝","🥩","🧁","🍰","🍩","☕","🫖"];
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i, emoji: FOOD_EMOJIS[i % FOOD_EMOJIS.length],
  left:`${(i * 5) % 100}%`, delay:`${(i * 0.7) % 10}s`,
  duration:`${9 + (i * 1.2) % 9}s`, size:`${16 + (i * 2) % 16}px`,
  opacity:0.3 + (i * 0.03) % 0.3,
}));

// Step 1: user info, Step 2: household choice, Step 3: success
export default function Register() {
  const navigate = useNavigate();
  const [step, setStep]         = useState(1); // 1=form, 2=household choice
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  // Household choice
  const [hhChoice, setHhChoice] = useState("create"); // "create" | "join"
  const [inviteCode, setInviteCode] = useState("");

  // ── Step 1: register ──────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirm) { setError("Please fill in all fields"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError("");
    try {
      const res = await axios.post(`${API}/auth/register`, { name, email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user || { name, email }));
      setStep(2); // show household choice
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    }
    setLoading(false);
  };

  // ── Step 2: household choice ──────────────────────────────────────────
  const handleHouseholdChoice = () => {
    if (hhChoice === "join") {
      if (!inviteCode.trim()) { setError("Please enter an invite code"); return; }
      navigate(`/join?code=${inviteCode.trim().toUpperCase()}`);
    } else {
      navigate("/setup");
    }
  };

  return (
    <div style={s.page}>
      {/* Animated background */}
      <div style={s.bgLayer}>
        <div style={{ ...s.orb, width:650,height:650,top:-180,left:-180, background:"radial-gradient(circle,rgba(124,58,237,0.25) 0%,transparent 70%)", animation:"orb1 10s ease-in-out infinite" }}/>
        <div style={{ ...s.orb, width:500,height:500,bottom:-120,right:-120, background:"radial-gradient(circle,rgba(255,107,43,0.25) 0%,transparent 70%)", animation:"orb2 12s ease-in-out infinite" }}/>
        <div style={{ ...s.orb, width:350,height:350,top:"45%",left:"40%", background:"radial-gradient(circle,rgba(45,122,79,0.15) 0%,transparent 70%)", animation:"orb3 15s ease-in-out infinite" }}/>
        <div style={s.grid}/>
        {PARTICLES.map(p => (
          <div key={p.id} style={{ position:"absolute",left:p.left,bottom:-40,fontSize:p.size,pointerEvents:"none",animation:`rise ${p.duration} ${p.delay} linear infinite`,opacity:p.opacity }}>
            {p.emoji}
          </div>
        ))}
      </div>

      {/* Card */}
      <div style={s.card}>
        {/* Left panel */}
        <div style={s.panelSide}>
          <div style={{ position:"absolute",width:280,height:280,top:-80,right:-80,borderRadius:"50%",background:"rgba(255,255,255,0.07)",pointerEvents:"none" }}/>
          <div style={{ position:"absolute",width:180,height:180,bottom:-50,left:-50,borderRadius:"50%",background:"rgba(255,255,255,0.05)",pointerEvents:"none" }}/>
          <div style={{ position:"relative",zIndex:2,padding:"44px 32px",height:"100%",display:"flex",flexDirection:"column" }}>
            <div style={{ fontSize:52,marginBottom:14,animation:"bounce 2s ease-in-out infinite" }}>🎉</div>
            <h2 style={{ fontSize:28,fontWeight:900,color:"white",margin:"0 0 12px",lineHeight:1.1,fontFamily:"'Playfair Display',serif" }}>
              JOIN THE<br/>KITCHEN!
            </h2>
            <p style={{ fontSize:13,color:"rgba(255,255,255,0.75)",marginBottom:24,lineHeight:1.7 }}>
              Create your smart household, plan meals together, and let AI be your chef.
            </p>
            {["🧑‍🍳 AI Recipe Suggestions","📅 7-Day Meal Plans","💰 Shared Expense Tracking","🛒 Smart Grocery Cart"].map(f=>(
              <div key={f} style={s.featurePill}>{f}</div>
            ))}
            <div style={{ marginTop:"auto" }}>
              <p style={{ color:"rgba(255,255,255,0.6)",fontSize:12,marginBottom:8 }}>Already have an account?</p>
              <Link to="/login" style={s.loginLink}>Sign In →</Link>
            </div>
          </div>
        </div>

        {/* Right: form side */}
        <div style={s.formSide}>
          {/* Logo */}
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:32 }}>
            <div style={{ width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:"0 6px 18px rgba(255,107,43,0.4)" }}>🍽️</div>
            <div>
              <div style={{ fontSize:20,fontWeight:900,color:"#1a1410",fontFamily:"'Playfair Display',serif" }}>HomeHub</div>
              <div style={{ fontSize:11,color:"#9c8672" }}>Smart Kitchen</div>
            </div>
          </div>

          {/* Progress dots */}
          <div style={{ display:"flex",gap:6,marginBottom:24 }}>
            {[1,2].map(n=>(
              <div key={n} style={{ height:4,flex:1,borderRadius:2,background:n<=step?"#ff6b2b":"rgba(139,94,60,0.15)",transition:"background 0.4s" }}/>
            ))}
          </div>

          {error && (
            <div style={{ background:"rgba(211,47,47,0.07)",border:"1px solid rgba(211,47,47,0.18)",borderRadius:10,padding:"10px 14px",marginBottom:18,fontSize:13,color:"#d32f2f",fontWeight:600,display:"flex",gap:8,alignItems:"center" }}>
              <span>⚠️</span>{error}
            </div>
          )}

          {/* ── STEP 1: Registration form ── */}
          {step === 1 && (
            <>
              <h1 style={{ fontSize:26,fontWeight:800,color:"#1a1410",margin:"0 0 4px" }}>Create Account</h1>
              <p style={{ fontSize:13,color:"#9c8672",margin:"0 0 24px" }}>Step 1 of 2 — Your details</p>

              <form onSubmit={handleRegister} style={{ display:"flex",flexDirection:"column",gap:0 }}>
                <label style={s.label}>FULL NAME</label>
                <div style={s.inputBox}>
                  <span style={s.iIcon}>👤</span>
                  <input value={name} onChange={e=>setName(e.target.value)} placeholder="Priya Sharma" style={s.input} autoComplete="name"/>
                </div>

                <label style={{ ...s.label,marginTop:14 }}>EMAIL</label>
                <div style={s.inputBox}>
                  <span style={s.iIcon}>📧</span>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" style={s.input} autoComplete="email"/>
                </div>

                <label style={{ ...s.label,marginTop:14 }}>PASSWORD</label>
                <div style={s.inputBox}>
                  <span style={s.iIcon}>🔒</span>
                  <input type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min. 6 characters" style={s.input}/>
                  <button type="button" onClick={()=>setShowPw(v=>!v)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:15,color:"#9c8672",padding:"0 4px" }}>
                    {showPw?"🙈":"👁️"}
                  </button>
                </div>

                <label style={{ ...s.label,marginTop:14 }}>CONFIRM PASSWORD</label>
                <div style={s.inputBox}>
                  <span style={s.iIcon}>🔐</span>
                  <input type={showPw?"text":"password"} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat password" style={s.input}/>
                  {confirm && <span style={{ fontSize:14 }}>{password===confirm?"✅":"❌"}</span>}
                </div>

                <button type="submit" disabled={loading} style={{ ...s.submitBtn,marginTop:24,opacity:loading?0.75:1 }}>
                  {loading ? (
                    <span style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                      <span style={{ width:15,height:15,border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"white",borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/>
                      Creating account…
                    </span>
                  ) : "Continue →"}
                </button>
              </form>
              <p style={{ textAlign:"center",marginTop:20,fontSize:13,color:"#9c8672" }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color:"#ff6b2b",fontWeight:700 }}>Sign In</Link>
              </p>
            </>
          )}

          {/* ── STEP 2: Household choice ── */}
          {step === 2 && (
            <>
              <div style={{ textAlign:"center",marginBottom:24 }}>
                <div style={{ fontSize:48,marginBottom:8 }}>🏠</div>
                <h1 style={{ fontSize:24,fontWeight:800,color:"#1a1410",margin:"0 0 6px" }}>Set Up Your Household</h1>
                <p style={{ fontSize:13,color:"#9c8672",margin:0 }}>
                  Hi <strong style={{ color:"#ff6b2b" }}>{name}</strong>! Would you like to create a new household or join an existing one?
                </p>
              </div>

              <div style={{ display:"flex",gap:12,marginBottom:20 }}>
                {[
                  { v:"create", icon:"🏡", title:"Create New", sub:"Set up a fresh household for your family" },
                  { v:"join",   icon:"👥", title:"Join Existing", sub:"Join a household with an invite code" },
                ].map(opt => (
                  <button key={opt.v} onClick={()=>{setHhChoice(opt.v);setError("");}}
                    style={{
                      flex:1, padding:"18px 12px", borderRadius:16, cursor:"pointer",
                      textAlign:"center", fontFamily:"inherit", border:"2.5px solid",
                      borderColor: hhChoice===opt.v ? "#ff6b2b" : "rgba(139,94,60,0.15)",
                      background:  hhChoice===opt.v ? "rgba(255,107,43,0.06)" : "white",
                      transition:"all 0.2s",
                      boxShadow: hhChoice===opt.v ? "0 4px 16px rgba(255,107,43,0.2)" : "none",
                    }}>
                    <div style={{ fontSize:32,marginBottom:8 }}>{opt.icon}</div>
                    <div style={{ fontSize:14,fontWeight:800,color:hhChoice===opt.v?"#ff6b2b":"#1a1410",marginBottom:4 }}>{opt.title}</div>
                    <div style={{ fontSize:11,color:"#9c8672",lineHeight:1.4 }}>{opt.sub}</div>
                  </button>
                ))}
              </div>

              {hhChoice === "join" && (
                <div style={{ marginBottom:16 }}>
                  <label style={s.label}>INVITE CODE</label>
                  <div style={s.inputBox}>
                    <span style={s.iIcon}>🔑</span>
                    <input
                      value={inviteCode}
                      onChange={e=>setInviteCode(e.target.value.toUpperCase())}
                      placeholder="e.g. FP-4488"
                      style={{ ...s.input,letterSpacing:"0.12em",fontWeight:700,fontSize:16 }}
                      maxLength={10}
                    />
                  </div>
                  <p style={{ fontSize:11,color:"#9c8672",marginTop:6 }}>Ask your household admin for the invite code</p>
                </div>
              )}

              {hhChoice === "create" && (
                <div style={{ background:"rgba(45,122,79,0.06)",border:"1px solid rgba(45,122,79,0.18)",borderRadius:12,padding:"12px 14px",marginBottom:16 }}>
                  <p style={{ fontSize:13,color:"#2d7a4f",fontWeight:600,margin:0 }}>
                    ✅ You'll set up your household name, budget, and diet preferences on the next screen.
                  </p>
                </div>
              )}

              {error && (
                <div style={{ background:"rgba(211,47,47,0.07)",border:"1px solid rgba(211,47,47,0.18)",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#d32f2f",fontWeight:600 }}>
                  ⚠️ {error}
                </div>
              )}

              <button onClick={handleHouseholdChoice} style={{ ...s.submitBtn, width:"100%" }}>
                {hhChoice==="create" ? "🏡 Create My Household" : "👥 Join Household"}
              </button>

              <button onClick={()=>navigate("/dashboard")} style={{ width:"100%",marginTop:10,padding:"12px",background:"none",border:"1.5px solid rgba(139,94,60,0.18)",borderRadius:12,color:"#9c8672",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                Skip for now
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;800&display=swap');
        *{box-sizing:border-box}a{text-decoration:none}
        input:focus{outline:none!important;border-color:#ff6b2b!important;box-shadow:0 0 0 3px rgba(255,107,43,0.15)!important;}
        @keyframes orb1{0%,100%{transform:translate(0,0)scale(1)}50%{transform:translate(90px,70px)scale(1.15)}}
        @keyframes orb2{0%,100%{transform:translate(0,0)scale(1)}50%{transform:translate(-70px,-90px)scale(0.85)}}
        @keyframes orb3{0%,100%{transform:translate(-50%,-50%)}50%{transform:translate(-45%,-55%)scale(1.2)}}
        @keyframes rise{0%{transform:translateY(0)rotate(0deg);opacity:0}10%{opacity:0.6}90%{opacity:0.3}100%{transform:translateY(-110vh)rotate(540deg)scale(0.3);opacity:0}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes gridMove{0%{transform:translateY(0)}100%{transform:translateY(60px)}}
      `}</style>
    </div>
  );
}

const s = {
  page: { minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(145deg,#080510 0%,#0c0818 50%,#150e05 100%)",fontFamily:"'Plus Jakarta Sans',sans-serif",overflow:"hidden",position:"relative",padding:20 },
  bgLayer: { position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none" },
  orb: { position:"absolute",borderRadius:"50%",filter:"blur(90px)" },
  grid: { position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(124,58,237,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.04) 1px,transparent 1px)",backgroundSize:"60px 60px",animation:"gridMove 10s linear infinite" },
  card: { display:"flex",borderRadius:24,overflow:"hidden",width:"100%",maxWidth:880,position:"relative",zIndex:2,boxShadow:"0 40px 120px rgba(0,0,0,0.7),0 0 0 1px rgba(124,58,237,0.2)" },
  panelSide: { width:300,flexShrink:0,background:"linear-gradient(145deg,#7c3aed,#4c1d95)",position:"relative",overflow:"hidden" },
  formSide: { flex:1,background:"rgba(253,252,248,0.98)",padding:"40px 44px",backdropFilter:"blur(30px)" },
  label: { display:"block",fontSize:10,fontWeight:700,color:"rgba(26,20,16,0.45)",textTransform:"uppercase",letterSpacing:"0.9px",marginBottom:7 },
  inputBox: { display:"flex",alignItems:"center",gap:8,background:"#fdf8f3",border:"1.5px solid rgba(139,94,60,0.18)",borderRadius:12,padding:"2px 14px",transition:"border-color 0.2s" },
  iIcon: { fontSize:15,flexShrink:0 },
  input: { flex:1,padding:"11px 0",border:"none",background:"transparent",fontSize:14,color:"#1a1410",fontFamily:"inherit",outline:"none" },
  submitBtn: { width:"100%",padding:13,background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",border:"none",borderRadius:12,fontSize:14,fontWeight:800,cursor:"pointer",boxShadow:"0 6px 22px rgba(255,107,43,0.4)",transition:"all 0.2s",fontFamily:"inherit" },
  featurePill: { background:"rgba(255,255,255,0.15)",borderRadius:10,padding:"9px 13px",fontSize:12,fontWeight:600,color:"white",marginBottom:7,border:"1px solid rgba(255,255,255,0.2)" },
  loginLink: { display:"block",padding:"12px 20px",background:"rgba(255,255,255,0.15)",border:"1.5px solid rgba(255,255,255,0.35)",borderRadius:12,color:"white",textAlign:"center",fontWeight:700,fontSize:14 },
};