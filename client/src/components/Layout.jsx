import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { NotificationBell } from "./NotificationSystem";


const FOOD_BG = "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=400&q=70";

const NAV = [
  { path:"/dashboard",  label:"Dashboard",    icon:"🏠", color:"#ff6b2b" },
  { path:"/members",    label:"Members",      icon:"👨‍👩‍👧‍👦", color:"#7c3aed" },
  { path:"/purchases",  label:"Purchases",    icon:"🛍️",  color:"#2d7a4f" },
  { path:"/pantry",     label:"Pantry",       icon:"🫙",  color:"#e67e22" },
  { path:"/grocery",    label:"Grocery",      icon:"🛒",  color:"#2980b9" },
  { path:"/cart",         label:"Smart Cart",   icon:"⚡",  color:"#e91e63" },
  { path:"/cart-history", label:"Cart History",  icon:"📋", color:"#7c3aed" },
  { path:"/recipes",    label:"Recipes",      icon:"🍛",  color:"#d32f2f" },
  { path:"/planner",    label:"Meal Planner", icon:"📅",  color:"#1565c0" },
  { path:"/analytics",  label:"Analytics",    icon:"📊",  color:"#6a1b9a" },
  { path:"/nutrition",  label:"Nutrition",    icon:"🥗",  color:"#2d7a4f" },
  { path:"/chat",       label:"AI Assistant", icon:"🤖",  color:"#00897b" },
  { path:"/settings",   label:"Settings",     icon:"⚙️",  color:"#5c4a35" },
  { path:"/admin",      label:"Admin Panel",  icon:"⚡",  color:"#ff6b2b", adminOnly:true },
];

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // ── Get actual user data from localStorage ──────────────────────────────
  const currentUser = (() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return {};
      const u = JSON.parse(raw);
      // Handle both {name:"..."} and nested {user:{name:"..."}}
      return u?.user || u || {};
    } catch { return {}; }
  })();

  const isAdmin    = currentUser?.role === "admin";
  const userName   = currentUser?.name || currentUser?.username || "My Kitchen";
  const userInitial = userName.charAt(0).toUpperCase();
  const current    = NAV.find(n => n.path === location.pathname);

  return (
    <div style={s.root}>
      {/* ── SIDEBAR ── */}
      <aside style={{ ...s.sidebar, width: collapsed ? "72px" : "232px" }}>

        {/* Top food photo strip */}
        <div style={s.sidebarTop}>
          <img src={FOOD_BG} alt="" style={s.sidebarBg}/>
          <div style={s.sidebarTopOverlay}/>
          <div style={s.sidebarTopContent}>
            <div style={s.logoWrap}>
              <span style={s.logoEmoji}>🍽️</span>
              {!collapsed && (
                <div>
                  <div style={s.logoName}>HomeHub</div>
                  <div style={s.logoTag}>Smart Kitchen</div>
                </div>
              )}
            </div>
            {!collapsed && (
              <div style={s.sidebarStats}>
                <div style={s.sidebarStat}><span style={s.sidebarStatNum}>50+</span><span style={s.sidebarStatLab}>Recipes</span></div>
                <div style={s.sidebarStat}><span style={s.sidebarStatNum}>AI</span><span style={s.sidebarStatLab}>Powered</span></div>
              </div>
            )}
          </div>
        </div>

        {/* Collapse button */}
        <button style={s.collapseBtn} onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? "▶" : "◀"}
        </button>

        {/* Nav items */}
        <nav style={s.nav}>
          {NAV.filter(item => !item.adminOnly || isAdmin).map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className="nav-item" style={{
                ...s.navItem,
                justifyContent: collapsed ? "center" : "flex-start",
                background: active ? `${item.color}12` : "transparent",
                borderLeft: active ? `3px solid ${item.color}` : "3px solid transparent",
              }}>
                <span style={{
                  ...s.navIcon,
                  transform: active ? "scale(1.2)" : "scale(1)",
                  filter: active ? `drop-shadow(0 2px 6px ${item.color}60)` : "none",
                }}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span style={{ ...s.navLabel, color: active ? item.color : "#5c4a35", fontWeight: active ? "700" : "500" }}>
                    {item.label}
                  </span>
                )}
                {active && !collapsed && <div style={{ ...s.activePip, background: item.color }}/>}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div style={s.sidebarBottom}>
          {!collapsed && (
            <div style={s.userRow}>
              {/* Avatar with user initial */}
              <div style={{ ...s.userAvatar, fontSize:"14px", fontWeight:800, color:"white" }}>
                {userInitial}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ ...s.userName, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"120px" }}>
                  {userName}
                </div>
                <div style={s.userPlan}>Free · Active</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div style={{ ...s.userAvatar, margin:"8px auto 6px", fontSize:"14px", fontWeight:800, color:"white" }}>
              {userInitial}
            </div>
          )}
          <button style={{ ...s.logoutBtn, justifyContent: collapsed ? "center" : "flex-start" }} onClick={logout}>
            <span style={s.navIcon}>🚪</span>
            {!collapsed && <span style={s.logoutLabel}>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={s.main}>
        {/* Topbar */}
        <header style={s.topbar}>
          <div style={s.topLeft}>
            <span style={s.topIcon}>{current?.icon || "🏠"}</span>
            <div>
              <h1 style={s.topTitle}>{current?.label || "Dashboard"}</h1>
              <p style={s.topBread}>HomeHub · {current?.label || "Dashboard"}</p>
            </div>
          </div>
          <div style={s.topRight}>
            <Link to="/cart" style={s.topBtn} title="Smart Cart">🛒</Link>
            <Link to="/chat" style={s.topBtn} title="AI Chat">🤖</Link>
            <NotificationBell/>
            {/* User avatar button */}
            <Link to="/settings" style={{ ...s.topAvatar, fontSize:"14px", fontWeight:800, color:"white" }} title={userName}>
              {userInitial}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main style={s.content} className="page-enter">{children}</main>
      </div>

      <style>{`
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;800&display=swap');
  *{box-sizing:border-box}a{text-decoration:none}
  .hover-card{transition:transform .22s cubic-bezier(.4,0,.2,1),box-shadow .22s cubic-bezier(.4,0,.2,1)!important}
  .hover-card:hover{transform:translateY(-4px)!important;box-shadow:0 12px 40px rgba(139,94,60,.16)!important}
  .btn-glow{transition:all .2s ease!important}
  .btn-glow:hover{filter:brightness(1.1)!important;transform:translateY(-1px)!important;box-shadow:0 6px 20px rgba(255,107,43,.35)!important}
  .nav-item{transition:all .15s ease!important}
  .nav-item:hover{background:rgba(255,107,43,.08)!important}
  .page-enter{animation:pageIn .3s ease}
  @keyframes pageIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
  img{transition:opacity .3s ease}
  input:focus,textarea:focus{outline:none!important;border-color:#ff6b2b!important;box-shadow:0 0 0 3px rgba(255,107,43,.12)!important;transition:all .2s ease!important}
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:rgba(139,94,60,.04)}
  ::-webkit-scrollbar-thumb{background:rgba(139,94,60,.18);border-radius:3px}
  ::-webkit-scrollbar-thumb:hover{background:rgba(255,107,43,.3)}
  button{transition:all .15s ease!important}
`}</style>
    </div>
  );
}

const s = {
  root:{display:"flex",minHeight:"100vh",background:"#f7f2ec",fontFamily:"'Plus Jakarta Sans',sans-serif"},
  sidebar:{flexShrink:0,display:"flex",flexDirection:"column",background:"white",borderRight:"1px solid rgba(139,94,60,0.08)",position:"sticky",top:0,height:"100vh",overflow:"hidden",transition:"width 0.3s cubic-bezier(0.4,0,0.2,1)",boxShadow:"4px 0 24px rgba(139,94,60,0.06)"},
  sidebarTop:{position:"relative",height:"140px",overflow:"hidden",flexShrink:0},
  sidebarBg:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"},
  sidebarTopOverlay:{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(26,20,16,0.75) 0%,rgba(26,20,16,0.9) 100%)"},
  sidebarTopContent:{position:"relative",zIndex:2,padding:"16px 16px 12px"},
  logoWrap:{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px"},
  logoEmoji:{fontSize:"28px",flexShrink:0,filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.3))"},
  logoName:{fontSize:"16px",fontWeight:"800",color:"white",fontFamily:"'Playfair Display',serif",lineHeight:1.1},
  logoTag:{fontSize:"10px",color:"rgba(255,255,255,0.5)",fontWeight:"500"},
  sidebarStats:{display:"flex",gap:"16px"},
  sidebarStat:{display:"flex",flexDirection:"column",gap:"1px"},
  sidebarStatNum:{fontSize:"15px",fontWeight:"800",color:"#ffaa70"},
  sidebarStatLab:{fontSize:"9px",color:"rgba(255,255,255,0.4)",fontWeight:"500"},
  collapseBtn:{width:"26px",height:"26px",borderRadius:"50%",background:"rgba(255,107,43,0.1)",border:"1px solid rgba(255,107,43,0.2)",color:"#ff6b2b",fontSize:"10px",fontWeight:"800",cursor:"pointer",margin:"8px auto",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s"},
  nav:{flex:1,overflowY:"auto",overflowX:"hidden",padding:"4px 0"},
  navItem:{display:"flex",alignItems:"center",gap:"12px",padding:"10px 14px",transition:"all 0.18s",cursor:"pointer",whiteSpace:"nowrap",position:"relative"},
  navIcon:{fontSize:"18px",flexShrink:0,width:"22px",textAlign:"center",transition:"all 0.2s"},
  navLabel:{fontSize:"13px",transition:"color 0.15s"},
  activePip:{width:"5px",height:"5px",borderRadius:"50%",marginLeft:"auto",flexShrink:0},
  sidebarBottom:{borderTop:"1px solid rgba(139,94,60,0.08)",padding:"10px 0",flexShrink:0},
  userRow:{display:"flex",alignItems:"center",gap:"10px",padding:"8px 14px 4px"},
  userAvatar:{width:"32px",height:"32px",borderRadius:"50%",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
  userName:{fontSize:"12px",fontWeight:"700",color:"#1a1410"},
  userPlan:{fontSize:"10px",color:"#9c8672"},
  logoutBtn:{display:"flex",alignItems:"center",gap:"12px",width:"100%",padding:"8px 14px",background:"transparent",border:"none",cursor:"pointer",transition:"all 0.2s"},
  logoutLabel:{fontSize:"13px",color:"#9c8672",fontWeight:"500"},
  main:{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden"},
  topbar:{background:"rgba(255,253,249,0.92)",backdropFilter:"blur(16px)",borderBottom:"1px solid rgba(139,94,60,0.08)",padding:"12px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:50,boxShadow:"0 2px 16px rgba(139,94,60,0.06)"},
  topLeft:{display:"flex",alignItems:"center",gap:"14px"},
  topIcon:{fontSize:"28px",filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.1))"},
  topTitle:{fontSize:"17px",fontWeight:"800",fontFamily:"'Playfair Display',serif",color:"#1a1410",margin:0,lineHeight:1.1},
  topBread:{fontSize:"11px",color:"#9c8672",margin:0},
  topRight:{display:"flex",gap:"8px",alignItems:"center"},
  topBtn:{width:"36px",height:"36px",borderRadius:"10px",background:"rgba(139,94,60,0.07)",border:"1px solid rgba(139,94,60,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"17px",textDecoration:"none",transition:"all 0.2s"},
  topAvatar:{width:"36px",height:"36px",borderRadius:"50%",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none",boxShadow:"0 3px 10px rgba(255,107,43,0.3)"},
  content:{flex:1,padding:"28px",overflowY:"auto",background:"linear-gradient(160deg,#f7f2ec 0%,#fdf8f3 100%)"},
};