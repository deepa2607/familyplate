import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000/api";

const FOOD_EMOJIS = ["🍕","🍔","🍜","🍛","🥘","🍲","🥗","🍣","🧆","🫕","🍱","🥙","🌮","🍝","🥩","🧁","🍰","🍩","☕","🫖","🥞","🍳","🍡","🍧","🥮","🍿"];
const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i, emoji: FOOD_EMOJIS[i % FOOD_EMOJIS.length],
  left:`${(i * 3.6) % 100}%`, delay:`${(i * 0.55) % 14}s`,
  duration:`${11 + (i * 1.1) % 10}s`, size:`${16 + (i * 2) % 18}px`,
  opacity: 0.25 + (i * 0.025) % 0.3,
}));

const BG_CARDS = [
  { top:"12%", left:"4%",  w:120, emoji:"🍛", label:"Dal Tadka",   rotX:25, rotY:35,  dly:"0s",   dur:"8s"  },
  { top:"62%", left:"2%",  w:105, emoji:"🥗", label:"Salad Bowl",  rotX:-20, rotY:28,  dly:"1.5s", dur:"10s" },
  { top:"20%", right:"4%", w:115, emoji:"🍜", label:"Noodles",     rotX:18, rotY:-32,  dly:"0.8s", dur:"9s"  },
  { top:"68%", right:"3%", w:100, emoji:"🍕", label:"Pizza",       rotX:-15, rotY:-25, dly:"2s",   dur:"11s" },
  { top:"42%", left:"6%",  w:95,  emoji:"☕", label:"Coffee",      rotX:30, rotY:12,   dly:"3s",   dur:"7s"  },
  { top:"36%", right:"5%", w:98,  emoji:"🧁", label:"Dessert",     rotX:-28, rotY:-20, dly:"2.5s", dur:"12s" },
];

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [tilt, setTilt]         = useState({ x: 0, y: 0 });
  const [glowPos, setGlowPos]   = useState({ x: 50, y: 50 });
  const [mouse, setMouse]       = useState({ x: 0.5, y: 0.5 });
  const cardRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const h = (e) => setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  const onCardMove = (e) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    setTilt({ x: ((e.clientX - r.left) / r.width - 0.5) * 18, y: ((e.clientY - r.top) / r.height - 0.5) * -18 });
    setGlowPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };
  const onCardLeave = () => setTilt({ x: 0, y: 0 });

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields"); return; }
    setLoading(true); setError("");
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password });
      const userData = res.data.user || res.data;
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(userData));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    }
    setLoading(false);
  };

  const px = (mouse.x - 0.5) * 40;
  const py = (mouse.y - 0.5) * 30;

  return (
    <div style={s.page}>
      {/* ── Deep 3D Animated Background ── */}
      <div style={s.bgLayer}>
        {/* Multi-layer gradient mesh */}
        <div style={{ position:"absolute", inset:0, zIndex:0,
          background:"radial-gradient(ellipse at 25% 20%, rgba(255,107,43,0.2) 0%, transparent 55%), radial-gradient(ellipse at 78% 82%, rgba(124,58,237,0.18) 0%, transparent 55%), radial-gradient(ellipse at 82% 12%, rgba(255,160,0,0.1) 0%, transparent 45%)",
        }}/>

        {/* Animated color orbs with parallax */}
        {[
          { w:800, h:800, t:-280, l:-250, bg:"rgba(255,107,43,0.22)", anim:"orb1 10s ease-in-out infinite", px:0.4, py:0.3 },
          { w:650, h:650, b:-200, r:-200, bg:"rgba(124,58,237,0.2)",  anim:"orb2 13s ease-in-out infinite", px:-0.3, py:-0.25 },
          { w:450, h:450, top:"38%", left:"42%", bg:"rgba(255,60,0,0.11)", anim:"orb3 16s ease-in-out infinite" },
          { w:320, h:320, top:"8%",  right:"22%", bg:"rgba(255,200,50,0.12)", anim:"orb4 7s ease-in-out infinite" },
          { w:260, h:260, bottom:"12%", left:"20%", bg:"rgba(0,200,255,0.07)", anim:"orb5 9s ease-in-out infinite" },
        ].map((o, i) => (
          <div key={i} style={{
            position:"absolute", borderRadius:"50%", filter:"blur(80px)",
            width:o.w, height:o.h,
            top:o.t!==undefined?o.t:o.top, left:o.l!==undefined?o.l:o.left,
            bottom:o.b!==undefined?o.b:o.bottom, right:o.r!==undefined?o.r:o.right,
            background:`radial-gradient(circle,${o.bg} 0%,transparent 70%)`,
            animation:o.anim,
            transform:o.px ? `translate(${px*o.px}px,${py*(o.py||0.1)}px)` : undefined,
            transition:"transform 0.6s ease-out",
          }}/>
        ))}

        {/* Perspective grid floor */}
        <div style={{
          position:"absolute", bottom:0, left:0, right:0, height:"60%",
          backgroundImage:"linear-gradient(rgba(255,107,43,0.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,107,43,0.045) 1px,transparent 1px)",
          backgroundSize:"60px 60px",
          transform:"perspective(380px) rotateX(62deg) translateY(32%)",
          transformOrigin:"bottom", opacity:0.65,
        }}/>

        {/* Animated flat grid */}
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:"linear-gradient(rgba(255,107,43,0.032) 1px,transparent 1px),linear-gradient(90deg,rgba(255,107,43,0.032) 1px,transparent 1px)",
          backgroundSize:"60px 60px",
          animation:"gridMove 10s linear infinite",
          transform:`translateY(${mouse.y * 20}px)`,
          transition:"transform 0.5s ease-out",
        }}/>

        {/* Rotating rings */}
        {[700, 960].map((sz, i) => (
          <div key={i} style={{
            position:"absolute", top:"50%", left:"50%",
            width:sz, height:sz, marginLeft:-sz/2, marginTop:-sz/2,
            borderRadius:"50%",
            border:`1px solid rgba(${i===0?"255,107,43":"124,58,237"},${i===0?0.055:0.04})`,
            animation:`ringRotate ${i===0?32:50}s linear infinite ${i===1?"reverse":""}`,
            pointerEvents:"none",
          }}/>
        ))}

        {/* 3D floating recipe cards */}
        {BG_CARDS.map((c, i) => (
          <div key={i} style={{
            position:"absolute", top:c.top, left:c.left, right:c.right,
            width:c.w, borderRadius:14,
            background:"rgba(255,255,255,0.06)",
            backdropFilter:"blur(10px)",
            border:"1px solid rgba(255,255,255,0.12)",
            boxShadow:"0 10px 36px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
            transform:`perspective(600px) rotateX(${c.rotX}deg) rotateY(${c.rotY}deg) translate(${px*(i%2===0?0.15:-0.12)}px,${py*0.1}px)`,
            transition:"transform 0.7s ease-out",
            animation:`bgFloat${i%3} ${c.dur} ${c.dly} ease-in-out infinite`,
            pointerEvents:"none",
          }}>
            <div style={{ padding:"10px 12px", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:22 }}>{c.emoji}</span>
              <span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.65)", fontFamily:"sans-serif" }}>{c.label}</span>
            </div>
            <div style={{ height:3, background:"linear-gradient(90deg,rgba(255,107,43,0.6),transparent)" }}/>
          </div>
        ))}

        {/* Lens flare */}
        <div style={{ position:"absolute", top:"18%", left:"13%", width:6, height:6, borderRadius:"50%",
          background:"rgba(255,220,100,0.85)", pointerEvents:"none",
          boxShadow:"0 0 20px 10px rgba(255,200,50,0.14), 0 0 60px 30px rgba(255,165,0,0.07)",
          animation:"flare 5s ease-in-out infinite",
        }}/>

        {/* Floating food particles */}
        {PARTICLES.map(p => (
          <div key={p.id} style={{ position:"absolute", left:p.left, bottom:-40,
            fontSize:p.size, pointerEvents:"none",
            animation:`rise ${p.duration} ${p.delay} linear infinite`, opacity:p.opacity,
          }}>{p.emoji}</div>
        ))}
      </div>

      {/* ── 3D Card ── */}
      <div ref={cardRef} style={{
        ...s.card,
        transform:`perspective(1400px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) translateZ(20px)`,
        "--gx":`${glowPos.x}%`, "--gy":`${glowPos.y}%`,
      }} onMouseMove={onCardMove} onMouseLeave={onCardLeave}>

        <div style={{ position:"absolute", inset:0, borderRadius:26, pointerEvents:"none", zIndex:10,
          background:`radial-gradient(circle at var(--gx,50%) var(--gy,50%), rgba(255,107,43,0.08) 0%, transparent 55%)`,
        }}/>

        {/* LEFT: Form */}
        <div style={s.formSide}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:36 }}>
            <div style={{ width:48, height:48, borderRadius:13,
              background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:22,
              boxShadow:"0 6px 24px rgba(255,107,43,0.5)", animation:"logoWobble 8s ease-in-out infinite",
            }}>🍽️</div>
            <div>
              <div style={{ fontSize:22, fontWeight:900, color:"#1a1410", fontFamily:"'Playfair Display',serif" }}>HomeHub</div>
              <div style={{ fontSize:11, color:"#9c8672", fontWeight:500 }}>Smart Kitchen</div>
            </div>
          </div>

          <h1 style={{ fontSize:30, fontWeight:800, color:"#1a1410", margin:"0 0 6px" }}>Sign In</h1>
          <p style={{ fontSize:13, color:"#9c8672", margin:"0 0 28px" }}>Welcome back to your smart kitchen</p>

          {error && (
            <div style={{ background:"rgba(211,47,47,0.07)", border:"1px solid rgba(211,47,47,0.18)",
              borderRadius:10, padding:"10px 14px", marginBottom:18, fontSize:13, color:"#d32f2f",
              fontWeight:600, display:"flex", gap:8, alignItems:"center" }}>
              <span>⚠️</span>{error}
            </div>
          )}

          <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:0 }}>
            <label style={s.label}>EMAIL</label>
            <div style={s.inputBox}>
              <span style={s.iIcon}>📧</span>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="your@email.com" style={s.input} autoComplete="email"/>
            </div>
            <label style={{ ...s.label, marginTop:16 }}>PASSWORD</label>
            <div style={s.inputBox}>
              <span style={s.iIcon}>🔒</span>
              <input type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}
                placeholder="••••••••" style={s.input} autoComplete="current-password"/>
              <button type="button" onClick={()=>setShowPw(v=>!v)}
                style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, padding:"0 4px", color:"#9c8672", lineHeight:1 }}>
                {showPw?"🙈":"👁️"}
              </button>
            </div>
            <div style={{ textAlign:"right", margin:"8px 0 22px" }}>
              <Link to="/forgot-password" style={{ fontSize:12, color:"#ff6b2b", fontWeight:600, textDecoration:"none" }}>
                Forgot password?
              </Link>
            </div>
            <button type="submit" disabled={loading} style={{ ...s.submitBtn, opacity:loading?0.75:1 }}>
              {loading ? (
                <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  <span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.4)", borderTopColor:"white",
                    borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }}/>
                  Signing in…
                </span>
              ) : "Sign In →"}
            </button>
          </form>

          <p style={{ textAlign:"center", marginTop:22, fontSize:13, color:"#9c8672" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color:"#ff6b2b", fontWeight:700, textDecoration:"none" }}>Sign Up</Link>
          </p>
        </div>

        {/* RIGHT: Info panel */}
        <div style={s.panel}>
          <div style={{ position:"absolute", width:320, height:320, top:-90, right:-90, borderRadius:"50%",
            background:"rgba(255,255,255,0.07)", animation:"pCircle1 8s ease-in-out infinite", pointerEvents:"none" }}/>
          <div style={{ position:"absolute", width:200, height:200, bottom:-70, left:-70, borderRadius:"50%",
            background:"rgba(255,255,255,0.05)", animation:"pCircle2 11s ease-in-out infinite", pointerEvents:"none" }}/>

          <div style={{ position:"relative", zIndex:2, height:"100%", display:"flex", flexDirection:"column", padding:"44px 32px" }}>
            <div style={{ fontSize:52, marginBottom:14, animation:"wave 2.5s ease-in-out infinite", display:"inline-block" }}>👋</div>
            <h2 style={{ fontSize:30, fontWeight:900, color:"white", margin:"0 0 12px", lineHeight:1.1,
              fontFamily:"'Playfair Display',serif" }}>
              WELCOME<br/>BACK!
            </h2>
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.75)", marginBottom:28, lineHeight:1.7 }}>
              We're happy to have you back. Your smart kitchen is waiting with personalized meal plans and recipes.
            </p>
            {["🍽️ Smart Meal Plans","🛒 Auto Grocery Lists","🤖 AI Chef Assistant","👨‍👩‍👧 Family Sharing"].map(f => (
              <div key={f} style={s.featurePill}>{f}</div>
            ))}
            <div style={{ marginTop:"auto" }}>
              <Link to="/register" style={s.signupLink}>New here? Sign Up →</Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;800&display=swap');
        *{box-sizing:border-box}a{text-decoration:none}
        input:focus{outline:none!important;border-color:#ff6b2b!important;box-shadow:0 0 0 3px rgba(255,107,43,0.15)!important;}
        @keyframes orb1{0%,100%{transform:translate(0,0)scale(1)}33%{transform:translate(110px,80px)scale(1.22)}66%{transform:translate(-45px,100px)scale(0.88)}}
        @keyframes orb2{0%,100%{transform:translate(0,0)scale(1)}50%{transform:translate(-85px,-105px)scale(0.83)}}
        @keyframes orb3{0%,100%{transform:translate(-50%,-50%)scale(1)}33%{transform:translate(-44%,-57%)scale(1.2)}66%{transform:translate(-56%,-44%)scale(0.87)}}
        @keyframes orb4{0%,100%{transform:scale(1)}50%{transform:scale(1.55)}}
        @keyframes orb5{0%,100%{transform:scale(1)translate(0,0)}50%{transform:scale(1.32)translate(20px,-22px)}}
        @keyframes rise{0%{transform:translateY(0)rotate(0deg)scale(1);opacity:0}10%{opacity:0.7}90%{opacity:0.3}100%{transform:translateY(-120vh)rotate(580deg)scale(0.3);opacity:0}}
        @keyframes wave{0%,100%{transform:rotate(0deg)}20%{transform:rotate(22deg)}40%{transform:rotate(-12deg)}60%{transform:rotate(16deg)}80%{transform:rotate(-6deg)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes gridMove{0%{transform:translateY(0)}100%{transform:translateY(60px)}}
        @keyframes bgFloat0{0%,100%{transform:perspective(600px) rotateX(25deg) rotateY(35deg) translateY(0)}50%{transform:perspective(600px) rotateX(28deg) rotateY(33deg) translateY(-14px)}}
        @keyframes bgFloat1{0%,100%{transform:perspective(600px) rotateX(-20deg) rotateY(28deg) translateY(0)}50%{transform:perspective(600px) rotateX(-23deg) rotateY(26deg) translateY(-10px)}}
        @keyframes bgFloat2{0%,100%{transform:perspective(600px) rotateX(18deg) rotateY(-32deg) translateY(0)}50%{transform:perspective(600px) rotateX(22deg) rotateY(-30deg) translateY(-16px)}}
        @keyframes ringRotate{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        @keyframes flare{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.5)}}
        @keyframes logoWobble{0%,100%{transform:rotate(0deg)scale(1)}50%{transform:rotate(6deg)scale(1.05)}}
        @keyframes pCircle1{0%,100%{transform:translate(0,0)scale(1)}50%{transform:translate(-14px,14px)scale(1.08)}}
        @keyframes pCircle2{0%,100%{transform:translate(0,0)}50%{transform:translate(10px,-10px)}}
      `}</style>
    </div>
  );
}

const s = {
  page: {
    minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
    background:"linear-gradient(150deg, #060311 0%, #110820 30%, #1a0c04 65%, #080510 100%)",
    fontFamily:"'Plus Jakarta Sans',sans-serif", overflow:"hidden",
    position:"relative", padding:20,
  },
  bgLayer: { position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" },
  card: {
    display:"flex", borderRadius:26, overflow:"hidden",
    width:"100%", maxWidth:900, position:"relative", zIndex:2,
    boxShadow:"0 50px 140px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,107,43,0.18), inset 0 0 0 1px rgba(255,255,255,0.06)",
    willChange:"transform", background:"transparent",
  },
  formSide: {
    flex:1, background:"rgba(253,252,248,0.99)", padding:"46px 50px",
    backdropFilter:"blur(30px)",
  },
  panel: {
    width:330, flexShrink:0,
    background:"linear-gradient(150deg,#ff6b2b,#e44200 60%,#c93a00 100%)",
    position:"relative", overflow:"hidden",
  },
  label: {
    display:"block", fontSize:10, fontWeight:700, color:"rgba(26,20,16,0.45)",
    textTransform:"uppercase", letterSpacing:"0.9px", marginBottom:7,
  },
  inputBox: {
    display:"flex", alignItems:"center", gap:8,
    background:"#fdf8f3", border:"1.5px solid rgba(139,94,60,0.18)",
    borderRadius:12, padding:"2px 14px", transition:"border-color 0.2s,box-shadow 0.2s",
  },
  iIcon: { fontSize:16, flexShrink:0, userSelect:"none" },
  input: {
    flex:1, padding:"12px 0", border:"none", background:"transparent",
    fontSize:14, color:"#1a1410", fontFamily:"inherit", outline:"none",
  },
  submitBtn: {
    width:"100%", padding:15,
    background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",
    color:"white", border:"none", borderRadius:12, fontSize:15, fontWeight:800,
    cursor:"pointer", boxShadow:"0 6px 28px rgba(255,107,43,0.5)",
    transition:"all 0.2s", fontFamily:"inherit", letterSpacing:"0.2px",
  },
  featurePill: {
    background:"rgba(255,255,255,0.14)", borderRadius:10,
    padding:"10px 14px", fontSize:13, fontWeight:600, color:"white",
    marginBottom:8, backdropFilter:"blur(4px)",
    border:"1px solid rgba(255,255,255,0.2)",
  },
  signupLink: {
    display:"block", padding:"13px 20px",
    background:"rgba(255,255,255,0.15)",
    border:"1.5px solid rgba(255,255,255,0.35)",
    borderRadius:12, color:"white", textAlign:"center",
    fontWeight:700, fontSize:14, textDecoration:"none",
    transition:"all 0.2s",
  },
};