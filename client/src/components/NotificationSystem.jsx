// ══════════════════════════════════════════════════════════════════════════
//  NotificationSystem.jsx  —  HomeHub Smart Kitchen
//  Real notifications: purchases, pantry low-stock, cart updates, members
// ══════════════════════════════════════════════════════════════════════════
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const NOTIF_KEY = "homehub_notifications";

function saveNotif(notif) {
  try {
    const existing = JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]");
    const updated  = [notif, ...existing].slice(0, 50);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("notifUpdated"));
  } catch {}
}

function getNotifs() {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]"); }
  catch { return []; }
}

// Global function to push notifications from anywhere in the app
window.pushNotification = (msg, type="info", link="") => {
  saveNotif({ id: Date.now(), msg, type, link, time: new Date().toISOString(), read: false });
};

const TYPE_STYLES = {
  success: { bg:"rgba(22,163,74,0.08)",  border:"rgba(22,163,74,0.2)",  icon:"✅", text:"#16a34a" },
  error:   { bg:"rgba(220,38,38,0.08)",   border:"rgba(220,38,38,0.2)",  icon:"❌", text:"#dc2626" },
  warning: { bg:"rgba(245,158,11,0.08)",  border:"rgba(245,158,11,0.2)", icon:"⚠️", text:"#d97706" },
  info:    { bg:"rgba(255,107,43,0.06)",  border:"rgba(255,107,43,0.15)",icon:"🔔", text:"#ff6b2b" },
  purchase:{ bg:"rgba(124,58,237,0.06)",  border:"rgba(124,58,237,0.15)",icon:"🛒", text:"#7c3aed" },
  pantry:  { bg:"rgba(22,163,74,0.06)",   border:"rgba(22,163,74,0.15)", icon:"🥦", text:"#16a34a" },
  member:  { bg:"rgba(21,101,192,0.06)",  border:"rgba(21,101,192,0.15)",icon:"👤", text:"#1565c0" },
};

function fmt(ts) {
  const d = new Date(ts);
  const diff = Date.now() - d.getTime();
  if (diff < 60000)  return "just now";
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  return d.toLocaleDateString("en-IN",{day:"numeric",month:"short"});
}

export default function NotificationSystem() {
  const navigate = useNavigate();
  const [open,     setOpen]     = useState(false);
  const [notifs,   setNotifs]   = useState(getNotifs);
  const [toasts,   setToasts]   = useState([]);
  const [household,setHousehold]= useState(null);
  const [lastCheck,setLastCheck]= useState(localStorage.getItem("notif_last_check") || null);
  const panelRef = useRef(null);
  const pollRef  = useRef(null);

  const unread = notifs.filter(n => !n.read).length;

  // Load notifs from localStorage
  const refresh = useCallback(() => {
    setNotifs(getNotifs());
  }, []);

  useEffect(() => {
    window.addEventListener("notifUpdated", refresh);
    return () => window.removeEventListener("notifUpdated", refresh);
  }, [refresh]);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (open && panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Listen for real app events and convert to notifications
  useEffect(() => {
    // Cart purchase → notification
    const handlePantry = (e) => {
      const count = e.detail?.items?.length || 0;
      const msg = count > 0
        ? `${count} items from your cart added to Pantry 🥦`
        : "Pantry updated from your purchase!";
      pushToast(msg, "pantry");
      window.pushNotification(msg, "pantry", "/pantry");
    };

    // Storage events (cart updated from GroceryList/Recipes)
    const handleStorage = (e) => {
      if (e.key === "homehub_smartcart_v2") {
        try {
          const items = JSON.parse(e.newValue || "[]");
          if (items.length > 0) {
            const msg = `${items.length} item${items.length>1?"s":""} in Smart Cart`;
            window.pushNotification(msg, "info", "/cart");
          }
        } catch {}
      }
    };

    window.addEventListener("pantryUpdated", handlePantry);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("pantryUpdated", handlePantry);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Poll for new purchases / pantry low stock
  useEffect(() => {
    const checkForAlerts = async () => {
      try {
        const hhRes = await API.get("/household/myhousehold");
        if (!hhRes.data?._id) return;
        setHousehold(hhRes.data);
        const hhId = hhRes.data._id;

        // Check pantry for low stock
        const pRes = await API.get(`/pantry/${hhId}`).catch(() => ({ data:[] }));
        const lowStock = (pRes.data||[]).filter(i => i.quantity <= (i.lowStockThreshold||1));
        if (lowStock.length > 0) {
          const names = lowStock.slice(0,3).map(i=>i.name).join(", ");
          const msg = `⚠️ Low stock: ${names}${lowStock.length>3?` +${lowStock.length-3} more`:""}`;
          const existing = getNotifs();
          const alreadyExists = existing.some(n => n.msg === msg && Date.now()-new Date(n.time)<3600000);
          if (!alreadyExists) {
            window.pushNotification(msg, "warning", "/pantry");
          }
        }

        // Check purchases for unsettled
        const purchRes = await API.get(`/purchase/${hhId}`).catch(() => ({ data:[] }));
        const unsettled = (purchRes.data||[]).filter(p => !p.settled);
        if (unsettled.length > 0) {
          const amt = unsettled.reduce((s,p)=>s+(p.totalAmount||p.amount||0),0);
          const lastNotifCheck = localStorage.getItem("notif_last_purch_check");
          const latestPurch    = purchRes.data?.[0];
          if (latestPurch && latestPurch.createdAt !== lastNotifCheck) {
            localStorage.setItem("notif_last_purch_check", latestPurch.createdAt);
            if (lastNotifCheck) {
              window.pushNotification(`New purchase added — ₹${amt.toLocaleString("en-IN")} unsettled`, "purchase", "/purchases");
            }
          }
        }
      } catch {}
    };

    // Run once on mount, then every 60s
    checkForAlerts();
    pollRef.current = setInterval(checkForAlerts, 60000);
    return () => clearInterval(pollRef.current);
  }, []);

  const pushToast = (msg, type="info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const markAllRead = () => {
    const updated = getNotifs().map(n => ({ ...n, read:true }));
    localStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
    setNotifs(updated);
  };

  const clearAll = () => {
    localStorage.setItem(NOTIF_KEY, "[]");
    setNotifs([]);
  };

  const handleNotifClick = (notif) => {
    const updated = notifs.map(n => n.id===notif.id ? {...n,read:true} : n);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
    setNotifs(updated);
    if (notif.link) navigate(notif.link);
    setOpen(false);
  };

  return (
    <>
      {/* Bell button */}
      <div ref={panelRef} style={{position:"relative",display:"inline-block"}}>
        <button
          onClick={() => { setOpen(o=>!o); if(!open) markAllRead(); }}
          style={{
            position:"relative",
            width:40, height:40, borderRadius:"50%",
            background: unread > 0 ? "linear-gradient(135deg,#ff6b2b,#ff8c54)" : "rgba(139,94,60,0.06)",
            border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, transition:"all 0.2s",
            boxShadow: unread > 0 ? "0 4px 14px rgba(255,107,43,0.35)" : "none",
          }}
          onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
          onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
        >
          🔔
          {unread > 0 && (
            <span style={{
              position:"absolute", top:-3, right:-3,
              background:"#dc2626", color:"white",
              borderRadius:"50%", width:16, height:16,
              fontSize:9, fontWeight:900,
              display:"flex", alignItems:"center", justifyContent:"center",
              border:"2px solid white",
            }}>{unread > 9 ? "9+" : unread}</span>
          )}
        </button>

        {/* Dropdown panel */}
        {open && (
          <div style={{
            position:"absolute", top:"calc(100% + 10px)", right:0,
            width:340, background:"white",
            borderRadius:20, boxShadow:"0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(139,94,60,0.08)",
            zIndex:999, overflow:"hidden",
            animation:"notifIn 0.2s ease",
          }}>
            {/* Header */}
            <div style={{padding:"16px 18px",borderBottom:"1px solid rgba(139,94,60,0.07)",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#fdf8f3"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>🔔</span>
                <span style={{fontSize:14,fontWeight:800,color:"#1a1410"}}>Notifications</span>
                {unread > 0 && <span style={{fontSize:10,background:"#ff6b2b",color:"white",borderRadius:50,padding:"2px 7px",fontWeight:800}}>{unread} new</span>}
              </div>
              <div style={{display:"flex",gap:8}}>
                {notifs.length > 0 && (
                  <button onClick={clearAll} style={{fontSize:11,color:"#9c8672",background:"none",border:"none",cursor:"pointer",fontWeight:600,padding:"2px 6px"}}>Clear all</button>
                )}
              </div>
            </div>

            {/* Notif list */}
            <div style={{maxHeight:360,overflowY:"auto"}}>
              {notifs.length === 0 ? (
                <div style={{padding:28,textAlign:"center"}}>
                  <span style={{fontSize:32,display:"block",marginBottom:8}}>✅</span>
                  <p style={{fontSize:13,color:"#9c8672",margin:0,fontWeight:600}}>You're all caught up!</p>
                  <p style={{fontSize:11,color:"#b0a090",margin:"4px 0 0"}}>No new notifications</p>
                </div>
              ) : (
                notifs.map((n,i) => {
                  const style = TYPE_STYLES[n.type] || TYPE_STYLES.info;
                  return (
                    <div key={n.id} onClick={()=>handleNotifClick(n)}
                      style={{
                        display:"flex",gap:12,padding:"13px 18px",
                        background:n.read?"white":style.bg,
                        borderLeft:n.read?"3px solid transparent":`3px solid ${style.text}`,
                        borderBottom:"1px solid rgba(139,94,60,0.05)",
                        cursor:n.link?"pointer":"default",
                        transition:"background 0.15s",
                      }}
                      onMouseEnter={e=>{if(n.link)e.currentTarget.style.background="rgba(255,107,43,0.04)";}}
                      onMouseLeave={e=>{e.currentTarget.style.background=n.read?"white":style.bg;}}>
                      <span style={{fontSize:18,flexShrink:0,marginTop:1}}>{style.icon}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{margin:0,fontSize:12,fontWeight:n.read?400:700,color:"#1a1410",lineHeight:1.4}}>{n.msg}</p>
                        <p style={{margin:"3px 0 0",fontSize:10,color:"#9c8672"}}>{fmt(n.time)}</p>
                      </div>
                      {!n.read && <div style={{width:6,height:6,borderRadius:"50%",background:"#ff6b2b",flexShrink:0,marginTop:4}}/>}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div style={{padding:"10px 18px",borderTop:"1px solid rgba(139,94,60,0.07)",background:"#fdf8f3"}}>
              <button onClick={()=>{navigate("/purchases");setOpen(false);}} style={{width:"100%",padding:"8px",background:"none",border:"1px solid rgba(255,107,43,0.2)",borderRadius:10,color:"#ff6b2b",fontSize:12,fontWeight:700,cursor:"pointer",transition:"all 0.2s"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,107,43,0.06)"}
              onMouseLeave={e=>e.currentTarget.style.background="none"}>
                View Purchase History →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast stack */}
      <div style={{position:"fixed",top:20,right:20,zIndex:9999,display:"flex",flexDirection:"column",gap:8,pointerEvents:"none"}}>
        {toasts.map(t => {
          const style = TYPE_STYLES[t.type] || TYPE_STYLES.info;
          return (
            <div key={t.id} style={{
              display:"flex",alignItems:"center",gap:10,
              padding:"12px 18px",
              background:"white",
              border:`1px solid ${style.border}`,
              borderLeft:`4px solid ${style.text}`,
              borderRadius:14,
              boxShadow:"0 8px 32px rgba(0,0,0,0.15)",
              animation:"toastIn 0.3s ease",
              maxWidth:360,
              pointerEvents:"all",
            }}>
              <span style={{fontSize:18,flexShrink:0}}>{style.icon}</span>
              <span style={{fontSize:13,fontWeight:700,color:style.text,flex:1}}>{t.msg}</span>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes notifIn{from{opacity:0;transform:translateY(-8px)scale(0.97)}to{opacity:1;transform:translateY(0)scale(1)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
      `}</style>
    </>
  );
}