import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const SLIDES = [
  {
    img:     "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1400&q=85",
    title:   "Your Smart Kitchen Starts Here",
    subtitle:"Manage meals, expenses, groceries and your household — all in one beautiful app.",
    accent:  "#ff6b2b",
    badge:   "🏠 Household Management",
  },
  {
    img:     "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1400&q=85",
    title:   "1000+ Indian Recipes at Your Fingertips",
    subtitle:"From Dal Tadka to Biryani — get full recipes with AI-powered suggestions based on your pantry.",
    accent:  "#d32f2f",
    badge:   "🍛 AI Recipe Assistant",
  },
  {
    img:     "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1400&q=85",
    title:   "Split Bills, Track Expenses Automatically",
    subtitle:"Add purchases, split between members and settle dues instantly. No more arguments!",
    accent:  "#2d7a4f",
    badge:   "💰 Smart Expense Splitting",
  },
  {
    img:     "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1400&q=85",
    title:   "Smart Cart Like Blinkit, For Your Home",
    subtitle:"Shop groceries, scan barcodes, pay via UPI or cash — all tracked for the household.",
    accent:  "#7c3aed",
    badge:   "🛒 Smart Cart",
  },
  {
    img:     "https://images.unsplash.com/photo-1574484284002-952d92456975?w=1400&q=85",
    title:   "AI Meal Planner for Every Diet",
    subtitle:"Veg, Keto, Jain, Diabetic, Mediterranean — get personalised 7-day meal plans in seconds.",
    accent:  "#1565c0",
    badge:   "📅 AI Meal Planning",
  },
];

const FEATURES = [
  { icon:"🤖", title:"AI Kitchen Chef",    desc:"Complete recipes with ingredients, steps, nutrition — powered by Gemini AI" },
  { icon:"💰", title:"Expense Splitting",  desc:"Automatic split calculations, settlement tracking & payment reminders" },
  { icon:"🛒", title:"Smart Cart",         desc:"Blinkit-style shopping with barcode scanner & UPI/cash payment" },
  { icon:"📊", title:"Analytics",          desc:"Beautiful charts showing where your household money goes each month" },
  { icon:"🫙", title:"Pantry Manager",     desc:"Track stock levels, get low-stock alerts & auto-add to grocery list" },
  { icon:"👨‍👩‍👧", title:"Family & Flatmates",  desc:"Family mode or split mode — works for any household setup" },
  { icon:"📅", title:"Meal Planner",       desc:"11 diet types, weekly planner, auto-generate grocery list from plan" },
  { icon:"🔑", title:"Invite Links",       desc:"Share invite codes via WhatsApp/Email to add members instantly" },
];

const STATS = [
  { val:"1000+", label:"Indian Recipes" },
  { val:"11",    label:"Diet Types" },
  { val:"AI",    label:"Powered by Gemini" },
  { val:"Free",  label:"Forever" },
];

export default function GetStarted() {
  const [slide, setSlide] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [visibleFeatures, setVisibleFeatures] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 7000);
    return () => clearInterval(interval);
  }, [slide]);

  useEffect(() => {
    // Animate features in staggered
    FEATURES.forEach((_, i) => {
      setTimeout(() => setVisibleFeatures(prev => [...prev, i]), 200 + i * 100);
    });
  }, []);

  const nextSlide = () => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setSlide(s => (s+1) % SLIDES.length);
      setAnimating(false);
    }, 400);
  };

  const goSlide = (i) => {
    if (animating || i === slide) return;
    setAnimating(true);
    setTimeout(() => { setSlide(i); setAnimating(false); }, 300);
  };

  const s = SLIDES[slide];

  return (
    <div style={{minHeight:"100vh",fontFamily:"'Plus Jakarta Sans',sans-serif",background:"#fdf8f3",overflowX:"hidden"}}>

      {/* ── HERO SLIDESHOW ── */}
      <div style={{position:"relative",height:"100vh",overflow:"hidden"}}>
        {/* Background image with smooth transition */}
        <div style={{position:"absolute",inset:0,transition:"opacity 0.8s ease",opacity:animating?0:1}}>
          <img src={s.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          <div style={{position:"absolute",inset:0,background:`linear-gradient(135deg,rgba(10,6,2,0.88) 0%,rgba(10,6,2,0.5) 60%,rgba(10,6,2,0.2) 100%)`}}/>
          {/* Gradient accent overlay */}
          <div style={{position:"absolute",bottom:0,left:0,right:0,height:"40%",background:`linear-gradient(0deg,rgba(10,6,2,0.7) 0%,transparent 100%)`}}/>
        </div>

        {/* Floating badge */}
        <div style={{position:"absolute",top:28,left:"50%",transform:"translateX(-50%)",zIndex:10}}>
          <div style={{background:"rgba(255,255,255,0.1)",backdropFilter:"blur(16px)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:50,padding:"8px 20px",display:"flex",alignItems:"center",gap:10,transition:"all 0.4s ease",opacity:animating?0:1}}>
            <span style={{fontSize:14}}>{s.badge}</span>
            <span style={{width:6,height:6,borderRadius:"50%",background:s.accent,display:"inline-block",animation:"pulse 1.5s infinite"}}/>
          </div>
        </div>

        {/* Logo */}
        <div style={{position:"absolute",top:28,left:40,zIndex:10,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:28}}>🍽️</span>
          <span style={{fontSize:22,fontWeight:900,color:"white",fontFamily:"'Playfair Display',serif"}}>HomeHub</span>
        </div>

        {/* Hero content */}
        <div style={{position:"relative",zIndex:5,height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 64px",maxWidth:760}}>
          <div style={{transition:"all 0.8s ease",opacity:animating?0:1,transform:animating?"translateY(20px)":"none"}}>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(36px,4.5vw,62px)",fontWeight:800,color:"white",lineHeight:1.15,margin:"0 0 18px"}}>
              {s.title}
            </h1>
            <p style={{fontSize:"clamp(15px,1.6vw,19px)",color:"rgba(255,255,255,0.72)",lineHeight:1.65,margin:"0 0 40px",maxWidth:560}}>
              {s.subtitle}
            </p>
          </div>

          <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
            <Link to="/register" style={{display:"inline-flex",alignItems:"center",gap:10,padding:"15px 32px",background:`linear-gradient(135deg,${s.accent},${s.accent}bb)`,color:"white",borderRadius:16,fontSize:16,fontWeight:800,textDecoration:"none",boxShadow:`0 8px 32px ${s.accent}55`,transition:"all 0.25s",border:"none"}}>
              Get Started Free 🎉
            </Link>
            <Link to="/login" style={{display:"inline-flex",alignItems:"center",gap:10,padding:"15px 32px",background:"rgba(255,255,255,0.12)",backdropFilter:"blur(12px)",color:"white",borderRadius:16,fontSize:16,fontWeight:700,textDecoration:"none",border:"1px solid rgba(255,255,255,0.25)",transition:"all 0.25s"}}>
              Sign In →
            </Link>
          </div>

          {/* Stats row */}
          <div style={{display:"flex",gap:36,marginTop:48,paddingTop:32,borderTop:"1px solid rgba(255,255,255,0.12)",transition:"opacity 0.8s ease",opacity:animating?0:1}}>
            {STATS.map(({val,label})=>(
              <div key={label}>
                <div style={{fontSize:26,fontWeight:900,color:s.accent}}>{val}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",fontWeight:500}}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Slide dots */}
        <div style={{position:"absolute",bottom:36,right:48,zIndex:10,display:"flex",gap:8,alignItems:"center"}}>
          {SLIDES.map((_,i)=>(
            <button key={i} onClick={()=>goSlide(i)} style={{width:i===slide?28:8,height:8,borderRadius:50,background:i===slide?s.accent:"rgba(255,255,255,0.3)",border:"none",cursor:"pointer",transition:"all 0.3s ease",padding:0}}/>
          ))}
        </div>

        {/* Slide counter */}
        <div style={{position:"absolute",bottom:40,left:64,zIndex:10,fontSize:12,color:"rgba(255,255,255,0.4)",fontWeight:600}}>
          {String(slide+1).padStart(2,"0")} / {String(SLIDES.length).padStart(2,"0")}
        </div>

        {/* Prev/Next arrows */}
        <button onClick={()=>goSlide((slide-1+SLIDES.length)%SLIDES.length)} style={{position:"absolute",left:20,top:"50%",transform:"translateY(-50%)",zIndex:10,width:48,height:48,borderRadius:"50%",background:"rgba(255,255,255,0.1)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.2)",color:"white",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>‹</button>
        <button onClick={nextSlide} style={{position:"absolute",right:20,top:"50%",transform:"translateY(-50%)",zIndex:10,width:48,height:48,borderRadius:"50%",background:"rgba(255,255,255,0.1)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.2)",color:"white",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>›</button>
      </div>

      {/* ── FEATURES SECTION ── */}
      <div style={{padding:"80px 64px",background:"white"}}>
        <div style={{textAlign:"center",marginBottom:52}}>
          <div style={{display:"inline-block",background:"rgba(255,107,43,0.08)",border:"1px solid rgba(255,107,43,0.18)",borderRadius:50,padding:"6px 18px",fontSize:12,fontWeight:700,color:"#ff6b2b",marginBottom:14}}>
            Everything you need
          </div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,3vw,42px)",fontWeight:800,color:"#1a1410",margin:"0 0 14px"}}>
            One app for your entire household
          </h2>
          <p style={{fontSize:16,color:"#9c8672",maxWidth:520,margin:"0 auto",lineHeight:1.7}}>
            From AI cooking assistant to expense tracking — HomeHub does it all beautifully.
          </p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:20}}>
          {FEATURES.map((f,i)=>(
            <div key={i} style={{background:"#fdf8f3",borderRadius:20,padding:"24px",border:"1px solid rgba(139,94,60,0.08)",transition:"all 0.3s ease",opacity:visibleFeatures.includes(i)?1:0,transform:visibleFeatures.includes(i)?"none":"translateY(20px)",cursor:"default"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-6px)";e.currentTarget.style.boxShadow="0 16px 40px rgba(139,94,60,0.14)";e.currentTarget.style.background="white";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";e.currentTarget.style.background="#fdf8f3";}}>
              <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,rgba(255,107,43,0.12),rgba(255,107,43,0.06))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,marginBottom:14}}>
                {f.icon}
              </div>
              <h3 style={{fontWeight:800,fontSize:16,color:"#1a1410",margin:"0 0 6px"}}>{f.title}</h3>
              <p style={{fontSize:13,color:"#9c8672",margin:0,lineHeight:1.6}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOOD PHOTO STRIP ── */}
      <div style={{display:"flex",gap:0,height:200,overflow:"hidden"}}>
        {["https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80","https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&q=80","https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80","https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80","https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"].map((img,i)=>(
          <div key={i} style={{flex:1,overflow:"hidden",transition:"flex 0.4s ease"}}
            onMouseEnter={e=>e.currentTarget.style.flex="2"}
            onMouseLeave={e=>e.currentTarget.style.flex="1"}>
            <img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform 0.4s ease"}}
              onMouseEnter={e=>e.target.style.transform="scale(1.08)"}
              onMouseLeave={e=>e.target.style.transform="scale(1)"}/>
          </div>
        ))}
      </div>

      {/* ── FINAL CTA ── */}
      <div style={{padding:"80px 64px",textAlign:"center",background:"linear-gradient(135deg,#1a1410,#2d1a08)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle at 30% 50%,rgba(255,107,43,0.08) 0%,transparent 60%),radial-gradient(circle at 70% 50%,rgba(124,58,237,0.05) 0%,transparent 60%)"}}/>
        <div style={{position:"relative",zIndex:2}}>
          <div style={{fontSize:48,marginBottom:16}}>🍽️</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,3vw,46px)",fontWeight:800,color:"white",margin:"0 0 16px"}}>
            Ready to cook smarter?
          </h2>
          <p style={{fontSize:16,color:"rgba(255,255,255,0.55)",marginBottom:36,lineHeight:1.65}}>
            Join thousands of households already using HomeHub.<br/>Free forever, no credit card needed.
          </p>
          <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
            <Link to="/register" style={{padding:"16px 36px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",borderRadius:16,fontSize:16,fontWeight:800,textDecoration:"none",boxShadow:"0 8px 32px rgba(255,107,43,0.45)",transition:"all 0.25s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 12px 40px rgba(255,107,43,0.55)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 8px 32px rgba(255,107,43,0.45)";}}>
              Create Free Account 🎉
            </Link>
            <Link to="/login" style={{padding:"16px 36px",background:"rgba(255,255,255,0.08)",color:"white",borderRadius:16,fontSize:16,fontWeight:700,textDecoration:"none",border:"1px solid rgba(255,255,255,0.2)",transition:"all 0.25s"}}>
              Sign In →
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        button:hover { opacity: 0.9; }
      `}</style>
    </div>
  );
}