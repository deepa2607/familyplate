// CartHistory.jsx — HomeHub Smart Kitchen
// familyplate/client/src/pages/CartHistory.jsx
import { useEffect, useState } from "react";
import API from "../api/axios";
import { useToast } from "../components/Toast";
import { useNavigate } from "react-router-dom";

const INR = n => `₹${(Number(n)||0).toLocaleString("en-IN")}`;
const fmt = d => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";
const fmtTime = d => d ? new Date(d).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}) : "";

const METHOD_ICONS = { razorpay:"💳", gpay:"📱", cod:"💵", scanner:"📷", test:"🧪" };
const METHOD_LABELS = { razorpay:"Card / Razorpay", gpay:"Google Pay", cod:"Cash on Delivery", scanner:"QR Scanner", test:"Test Mode" };

export default function CartHistory() {
  const toast    = useToast();
  const navigate = useNavigate();
  const [household, setHousehold] = useState(null);
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState(null);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("all");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      // Load from API (purchases with category = Grocery / Smart Cart)
      const hhRes = await API.get("/household/myhousehold");
      if (hhRes.data) {
        setHousehold(hhRes.data);
        const pRes = await API.get(`/purchase/${hhRes.data._id}`);
        // Filter for cart orders (from SmartCart) — these have items array
        const allPurchases = pRes.data || [];
        // Show ALL purchases (not just filtered ones - user can search/filter on page)
        setOrders(allPurchases);
      }
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  const filteredOrders = orders
    .filter(o => {
      if (filter === "settled"  && !o.settled)  return false;
      if (filter === "pending"  && o.settled)   return false;
      if (search && !JSON.stringify(o).toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a,b) => new Date(b.date||b.createdAt) - new Date(a.date||a.createdAt));

  const totalSpent  = orders.reduce((s,o)=>s+(o.totalAmount||o.amount||0),0);
  const totalItems  = orders.reduce((s,o)=>s+(o.items?.length||0),0);
  const avgOrder    = orders.length ? Math.round(totalSpent/orders.length) : 0;

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60vh",flexDirection:"column",gap:14}}>
      <div style={{width:44,height:44,border:"4px solid rgba(255,107,43,0.15)",borderTop:"4px solid #ff6b2b",borderRadius:"50%",animation:"spin 0.9s linear infinite"}}/>
      <p style={{color:"#5c4a35",fontWeight:600}}>Loading cart history…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18,paddingBottom:32}}>

      {/* Hero */}
      <div style={{position:"relative",borderRadius:22,overflow:"hidden",height:200,boxShadow:"0 16px 50px rgba(0,0,0,0.18)"}}>
        <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80" alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(10,6,3,0.9),rgba(10,6,3,0.55))"}}/>
        <div style={{position:"absolute",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,107,43,0.15),transparent 70%)",top:-60,right:80,pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:2,padding:"28px 36px",height:"100%",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:34,fontWeight:800,color:"white",margin:"0 0 4px"}}>🛒 Cart History</h1>
              <p style={{fontSize:12,color:"rgba(255,255,255,0.45)",margin:0}}>{household?.name} · All SmartCart orders</p>
            </div>
            <button onClick={()=>navigate("/cart")} style={{padding:"10px 18px",background:"rgba(255,107,43,0.9)",color:"white",border:"none",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer"}}>
              + New Order
            </button>
          </div>
          <div style={{display:"flex",gap:28}}>
            {[["Orders",orders.length,"#ffaa70"],["Total Spent",INR(totalSpent),"#a5d6a7"],["Items Bought",totalItems,"#93c5fd"],["Avg Order",INR(avgOrder),"#fbbf24"]].map(([l,v,c])=>(
              <div key={l}><span style={{display:"block",fontSize:22,fontWeight:900,color:c,letterSpacing:"-0.5px"}}>{v}</span><span style={{fontSize:10,color:"rgba(255,255,255,0.4)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>{l}</span></div>
            ))}
          </div>
        </div>
      </div>

      {/* Search + filter */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{position:"relative",flex:1,minWidth:200}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,opacity:0.4}}>🔍</span>
          <input placeholder="Search orders, items…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:"100%",padding:"10px 12px 10px 38px",border:"1.5px solid rgba(139,94,60,0.12)",borderRadius:12,fontSize:13,background:"white",color:"#1a1410",outline:"none",boxSizing:"border-box"}}/>
        </div>
        {[["all","All Orders"],["pending","Pending"],["settled","Settled"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{padding:"9px 16px",border:"none",borderRadius:50,fontSize:12,fontWeight:700,cursor:"pointer",transition:"all 0.2s",background:filter===v?"#1a1410":"white",color:filter===v?"white":"#5c4a35",boxShadow:filter===v?"0 3px 12px rgba(26,20,16,0.2)":"0 1px 5px rgba(139,94,60,0.07)"}}>
            {l}
          </button>
        ))}
      </div>

      {/* Orders */}
      {filteredOrders.length === 0 ? (
        <div style={{background:"white",borderRadius:18,padding:48,textAlign:"center",boxShadow:"0 4px 18px rgba(139,94,60,0.07)"}}>
          <span style={{fontSize:44,display:"block",marginBottom:10}}>🛒</span>
          <p style={{fontSize:15,fontWeight:700,color:"#1a1410",marginBottom:5}}>No cart orders yet</p>
          <p style={{fontSize:12,color:"#9c8672",marginBottom:18}}>No purchases found. Complete a checkout in Smart Cart to see history here.</p>
          <button onClick={()=>navigate("/cart")} style={{padding:"12px 22px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",border:"none",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px rgba(255,107,43,0.3)"}}>
            Go to Smart Cart →
          </button>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {filteredOrders.map((order, i) => {
            const isExp = expanded === order._id;
            const amt   = order.totalAmount || order.amount || 0;
            const method = order.paymentMethod || "razorpay";
            const items  = order.items || [];

            return (
              <div key={order._id} style={{background:"white",borderRadius:18,overflow:"hidden",boxShadow:"0 3px 14px rgba(139,94,60,0.07)",transition:"all 0.25s",border:isExp?"1px solid rgba(255,107,43,0.2)":"1px solid transparent"}}>
                {/* Order row */}
                <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",cursor:"pointer"}} onClick={()=>setExpanded(isExp?null:order._id)}>
                  {/* Order icon */}
                  <div style={{width:44,height:44,borderRadius:12,background:"rgba(255,107,43,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                    {METHOD_ICONS[method]||"🛒"}
                  </div>
                  {/* Info */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:800,color:"#1a1410",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {order.description||`Smart Cart Order`}
                    </div>
                    <div style={{display:"flex",gap:8,alignItems:"center",marginTop:3,flexWrap:"wrap"}}>
                      <span style={{fontSize:11,color:"#9c8672"}}>{fmt(order.date||order.createdAt)} {fmtTime(order.date||order.createdAt)}</span>
                      <span style={{fontSize:10,color:"#9c8672"}}>·</span>
                      <span style={{fontSize:11,color:"#9c8672"}}>{items.length} items</span>
                      <span style={{fontSize:10,color:"#9c8672"}}>·</span>
                      <span style={{fontSize:11,color:"#9c8672"}}>{METHOD_LABELS[method]||method}</span>
                    </div>
                  </div>
                  {/* Amount + status */}
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5,flexShrink:0}}>
                    <span style={{fontSize:18,fontWeight:900,color:"#ff6b2b",letterSpacing:"-0.5px"}}>{INR(amt)}</span>
                    <span style={{fontSize:10,fontWeight:700,borderRadius:50,padding:"2px 9px",background:order.settled?"rgba(45,122,79,0.1)":"rgba(211,47,47,0.1)",color:order.settled?"#2d7a4f":"#d32f2f"}}>
                      {order.settled?"✅ Settled":"🔴 Pending"}
                    </span>
                  </div>
                  {/* Expand arrow */}
                  <span style={{fontSize:12,color:"#9c8672",marginLeft:4,transition:"transform 0.2s",transform:isExp?"rotate(180deg)":"rotate(0)"}}>▼</span>
                </div>

                {/* Expanded items */}
                {isExp && (
                  <div style={{padding:"0 18px 16px",borderTop:"1px solid rgba(139,94,60,0.06)"}}>
                    <div style={{paddingTop:12}}>
                      {/* Payment ref */}
                      {order.razorpayPaymentId && (
                        <div style={{background:"rgba(139,94,60,0.04)",borderRadius:10,padding:"8px 12px",marginBottom:12,fontSize:11,color:"#9c8672"}}>
                          <span style={{fontWeight:700,color:"#5c4a35"}}>Payment Ref: </span>
                          <code style={{fontFamily:"monospace",fontSize:11}}>{order.razorpayPaymentId}</code>
                        </div>
                      )}
                      {/* Items list */}
                      {items.length > 0 && (
                        <div>
                          <p style={{fontSize:11,fontWeight:700,color:"#5c4a35",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Items Ordered ({items.length})</p>
                          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:6}}>
                            {items.map((item,j)=>(
                              <div key={j} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 12px",background:"rgba(139,94,60,0.04)",borderRadius:9,gap:8}}>
                                <div style={{minWidth:0}}>
                                  <div style={{fontSize:12,fontWeight:700,color:"#1a1410",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                                  <div style={{fontSize:10,color:"#9c8672"}}>{item.quantity} {item.unit} · {item.category}</div>
                                </div>
                                {item.price>0&&<span style={{fontSize:12,fontWeight:800,color:"#ff6b2b",flexShrink:0}}>{INR(item.price*item.quantity)}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Totals */}
                      <div style={{display:"flex",justifyContent:"flex-end",marginTop:12,paddingTop:10,borderTop:"1px solid rgba(139,94,60,0.06)"}}>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:11,color:"#9c8672",marginBottom:2}}>Order Total</div>
                          <div style={{fontSize:20,fontWeight:900,color:"#ff6b2b"}}>{INR(amt)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`input:focus{outline:none!important;border-color:#ff6b2b!important;}`}</style>
    </div>
  );
}