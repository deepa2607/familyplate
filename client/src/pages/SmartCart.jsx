// SmartCart.jsx — Fixed: reads recipe cart items, proper cart sync, 3D UI
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useToast } from "../components/Toast";

const API          = "http://localhost:5000/api";
const RAZORPAY_KEY = "rzp_test_STtEjhkKyDQlmf";
const UPI_ID       = "homehub@okaxis";
const INR          = n => `₹${(Number(n)||0).toLocaleString("en-IN")}`;

const CATALOG = {
  "Vegetables & Fruits": {
    color:"#16a34a", icon:"🥦",
    items:[
      {id:"v1",name:"Tomatoes",    unit:"1 kg",  price:29, img:"https://images.pexels.com/photos/533360/pexels-photo-533360.jpeg?auto=compress&w=200",badge:"Fresh"},
      {id:"v2",name:"Onions",      unit:"1 kg",  price:39, img:"https://images.pexels.com/photos/4197447/pexels-photo-4197447.jpeg?auto=compress&w=200"},
      {id:"v3",name:"Potatoes",    unit:"1 kg",  price:24, img:"https://images.pexels.com/photos/2286776/pexels-photo-2286776.jpeg?auto=compress&w=200"},
      {id:"v4",name:"Spinach",     unit:"250 g", price:15, img:"https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?auto=compress&w=200",badge:"Organic"},
      {id:"v5",name:"Capsicum",    unit:"500 g", price:45, img:"https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&w=200"},
      {id:"v6",name:"Bananas",     unit:"6 pcs", price:40, img:"https://images.pexels.com/photos/1166648/pexels-photo-1166648.jpeg?auto=compress&w=200"},
      {id:"v7",name:"Apples",      unit:"4 pcs", price:80, img:"https://images.pexels.com/photos/1510392/pexels-photo-1510392.jpeg?auto=compress&w=200",badge:"Shimla"},
      {id:"v8",name:"Carrots",     unit:"500 g", price:25, img:"https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&w=200"},
    ],
  },
  "Dairy & Eggs": {
    color:"#2563eb", icon:"🥛",
    items:[
      {id:"d1",name:"Milk",        unit:"1 L",   price:62, img:"https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&w=200",badge:"Fresh"},
      {id:"d2",name:"Paneer",      unit:"200 g", price:75, img:"https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&w=200"},
      {id:"d3",name:"Curd",        unit:"500 g", price:38, img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200"},
      {id:"d4",name:"Eggs",        unit:"12 pcs",price:84, img:"https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?auto=compress&w=200",badge:"Farm Fresh"},
      {id:"d5",name:"Butter",      unit:"500 g", price:245,img:"https://images.pexels.com/photos/531334/pexels-photo-531334.jpeg?auto=compress&w=200"},
      {id:"d6",name:"Ghee",        unit:"500 ml",price:320,img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200",badge:"Pure"},
    ],
  },
  "Staples & Grains": {
    color:"#d97706", icon:"🌾",
    items:[
      {id:"s1",name:"Basmati Rice",unit:"1 kg",  price:89, img:"https://images.pexels.com/photos/4110251/pexels-photo-4110251.jpeg?auto=compress&w=200"},
      {id:"s2",name:"Wheat Atta",  unit:"1 kg",  price:54, img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200"},
      {id:"s3",name:"Toor Dal",    unit:"500 g", price:72, img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200"},
      {id:"s4",name:"Moong Dal",   unit:"500 g", price:85, img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200"},
      {id:"s5",name:"Poha",        unit:"500 g", price:28, img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200"},
      {id:"s6",name:"Oats",        unit:"500 g", price:95, img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200",badge:"Rolled"},
    ],
  },
  "Meat & Seafood": {
    color:"#dc2626", icon:"🍖",
    items:[
      {id:"m1",name:"Chicken Breast",unit:"500 g",price:165,img:"https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&w=200",badge:"Fresh"},
      {id:"m2",name:"Chicken Curry", unit:"1 kg", price:220,img:"https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&w=200"},
      {id:"m3",name:"Fish (Rohu)",   unit:"500 g",price:140,img:"https://images.pexels.com/photos/1516415/pexels-photo-1516415.jpeg?auto=compress&w=200",badge:"Fresh"},
      {id:"m4",name:"Mutton",        unit:"500 g",price:360,img:"https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&w=200"},
    ],
  },
  "Bakery & Snacks": {
    color:"#7c3aed", icon:"🍞",
    items:[
      {id:"b1",name:"Bread",    unit:"400 g",price:40,img:"https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&w=200"},
      {id:"b2",name:"Biscuits", unit:"200 g",price:25,img:"https://images.pexels.com/photos/1028714/pexels-photo-1028714.jpeg?auto=compress&w=200"},
      {id:"b3",name:"Chips",    unit:"100 g",price:30,img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200"},
      {id:"b4",name:"Namkeen",  unit:"200 g",price:45,img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200"},
    ],
  },
  "Beverages": {
    color:"#0891b2", icon:"🥤",
    items:[
      {id:"bv1",name:"Orange Juice",  unit:"1 L",   price:99, img:"https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&w=200",badge:"Cold Pressed"},
      {id:"bv2",name:"Green Tea",     unit:"25 bags",price:120,img:"https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&w=200"},
      {id:"bv3",name:"Coconut Water", unit:"200 ml", price:45, img:"https://images.pexels.com/photos/1313140/pexels-photo-1313140.jpeg?auto=compress&w=200"},
      {id:"bv4",name:"Lemon Juice",   unit:"500 ml", price:55, img:"https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&w=200"},
      {id:"bv5",name:"Mango Juice",   unit:"1 L",   price:89, img:"https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&w=200",badge:"Tropicana"},
    ],
  },
  "Spices & Oils": {
    color:"#b45309", icon:"🌶️",
    items:[
      {id:"sp1",name:"Turmeric",      unit:"100 g",  price:22, img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200",badge:"Organic"},
      {id:"sp2",name:"Red Chilli",    unit:"100 g",  price:35, img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200"},
      {id:"sp3",name:"Cumin Seeds",   unit:"100 g",  price:28, img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200"},
      {id:"sp4",name:"Garam Masala",  unit:"100 g",  price:45, img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200",badge:"MDH"},
      {id:"sp5",name:"Sunflower Oil", unit:"1 L",    price:135,img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200"},
      {id:"sp6",name:"Mustard Oil",   unit:"1 L",    price:120,img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200",badge:"Kachi Ghani"},
      {id:"sp7",name:"Salt",          unit:"1 kg",   price:20, img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200"},
      {id:"sp8",name:"Sugar",         unit:"1 kg",   price:45, img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200"},
    ],
  },
  "Cleaning & Home": {
    color:"#0369a1", icon:"🧹",
    items:[
      {id:"cl1",name:"Vim Bar",       unit:"200 g",  price:18, img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200"},
      {id:"cl2",name:"Detergent",     unit:"500 g",  price:75, img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200",badge:"Surf Excel"},
      {id:"cl3",name:"Dish Soap",     unit:"750 ml", price:55, img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200"},
      {id:"cl4",name:"Floor Cleaner", unit:"1 L",    price:85, img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200"},
      {id:"cl5",name:"Toilet Cleaner",unit:"500 ml", price:45, img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200",badge:"Harpic"},
    ],
  },
  "Personal Care": {
    color:"#9333ea", icon:"🧴",
    items:[
      {id:"pc1",name:"Shampoo",       unit:"200 ml", price:120,img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200",badge:"Head & Shoulders"},
      {id:"pc2",name:"Soap Bar",      unit:"100 g",  price:35, img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200"},
      {id:"pc3",name:"Toothpaste",    unit:"150 g",  price:65, img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200",badge:"Colgate"},
      {id:"pc4",name:"Hand Wash",     unit:"250 ml", price:55, img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200"},
      {id:"pc5",name:"Tissue Paper",  unit:"100 pulls",price:45,img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=200"},
    ],
  },
};

const ALL_ITEMS = Object.entries(CATALOG).flatMap(([cat,{items}]) => items.map(i=>({...i,category:cat})));

const loadRazorpay = () => new Promise(resolve => {
  if(window.Razorpay){resolve(true);return;}
  const s=document.createElement("script");
  s.src="https://checkout.razorpay.com/v1/checkout.js";
  s.onload=()=>resolve(true); s.onerror=()=>resolve(false);
  document.body.appendChild(s);
});

function QRModal({amount, onClose, onConfirm}) {
  const upiUrl = `upi://pay?pa=${UPI_ID}&pn=HomeHub&am=${amount}&cu=INR`;
  const qrUrl  = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(upiUrl)}&size=200x200`;
  const [done, setDone] = useState(false);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"white",borderRadius:20,padding:28,maxWidth:340,width:"100%",textAlign:"center"}}>
        <div style={{fontSize:28,marginBottom:8}}>📷</div>
        <h3 style={{margin:"0 0 4px",fontSize:18,fontWeight:800}}>Scan & Pay</h3>
        <p style={{fontSize:13,color:"#9c8672",margin:"0 0 16px"}}>Scan with any UPI app</p>
        <div style={{background:"#fdf8f3",borderRadius:12,padding:12,marginBottom:12,display:"inline-block"}}>
          <img src={qrUrl} alt="UPI QR" width={200} height={200}/>
        </div>
        <div style={{background:"rgba(255,107,43,0.06)",borderRadius:10,padding:"10px 16px",marginBottom:16}}>
          <div style={{fontSize:12,color:"#9c8672"}}>Amount</div>
          <div style={{fontSize:22,fontWeight:900,color:"#ff6b2b"}}>{INR(amount)}</div>
          <div style={{fontSize:11,color:"#9c8672"}}>UPI: {UPI_ID}</div>
        </div>
        <a href={upiUrl} style={{display:"block",padding:12,background:"linear-gradient(135deg,#1a73e8,#4285f4)",color:"white",borderRadius:10,fontSize:13,fontWeight:700,textDecoration:"none",marginBottom:8}}>📱 Open UPI App</a>
        {!done ? (
          <button onClick={()=>setDone(true)} style={{width:"100%",padding:11,background:"linear-gradient(135deg,#16a34a,#22c55e)",border:"none",borderRadius:10,color:"white",fontSize:14,fontWeight:700,cursor:"pointer"}}>✅ I've Paid</button>
        ) : (
          <button onClick={onConfirm} style={{width:"100%",padding:11,background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",border:"none",borderRadius:10,color:"white",fontSize:14,fontWeight:700,cursor:"pointer"}}>💾 Confirm & Save</button>
        )}
        <button onClick={onClose} style={{marginTop:8,background:"none",border:"none",color:"#9c8672",fontSize:12,cursor:"pointer"}}>Cancel</button>
      </div>
    </div>
  );
}

function QtyControl({qty, onAdd, onRemove, size="md"}) {
  const sm = size==="sm";
  return (
    <div style={{display:"flex",alignItems:"center",gap:sm?6:8,background:"#ff6b2b",borderRadius:sm?8:10,padding:sm?"3px":"4px"}}>
      <button onClick={onRemove} style={{width:sm?22:26,height:sm?22:26,borderRadius:sm?6:8,border:"none",background:"rgba(255,255,255,0.2)",color:"white",fontWeight:900,fontSize:sm?14:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
      <span style={{fontWeight:900,fontSize:sm?12:14,color:"white",minWidth:sm?16:20,textAlign:"center"}}>{qty}</span>
      <button onClick={onAdd} style={{width:sm?22:26,height:sm?22:26,borderRadius:sm?6:8,border:"none",background:"rgba(255,255,255,0.2)",color:"white",fontWeight:900,fontSize:sm?14:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
    </div>
  );
}

function ProductGrid({items, cart, addItem, removeItem}) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:12}}>
      {items.map(item => {
        const qty = cart[item.id]||0;
        return (
          <div key={item.id} style={{background:"white",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 8px rgba(0,0,0,0.06)",border:"1px solid #f3f4f6",transition:"all .2s"}}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.12)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 1px 8px rgba(0,0,0,0.06)";}}>
            <div style={{position:"relative",paddingTop:"70%",background:"#f9fafb"}}>
              <img src={item.img} alt={item.name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
              {item.badge&&<span style={{position:"absolute",top:6,left:6,background:"#ff6b2b",color:"white",borderRadius:4,fontSize:9,fontWeight:700,padding:"2px 6px"}}>{item.badge}</span>}
              {qty>0&&<span style={{position:"absolute",top:6,right:6,background:"#16a34a",color:"white",borderRadius:50,width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900}}>{qty}</span>}
            </div>
            <div style={{padding:"10px 10px 12px"}}>
              <div style={{fontWeight:700,fontSize:12,color:"#1a1410",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
              <div style={{fontSize:10,color:"#9c8672",marginBottom:8}}>{item.unit}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontWeight:900,fontSize:13,color:"#1a1410"}}>{INR(item.price)}</span>
                {qty===0 ? (
                  <button onClick={()=>addItem(item.id)} style={{padding:"5px 14px",background:"white",border:"1.5px solid #ff6b2b",borderRadius:8,color:"#ff6b2b",fontSize:12,fontWeight:700,cursor:"pointer",transition:"all .15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.background="#ff6b2b";e.currentTarget.style.color="white";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="white";e.currentTarget.style.color="#ff6b2b";}}>
                    + ADD
                  </button>
                ) : (
                  <QtyControl qty={qty} onAdd={()=>addItem(item.id)} onRemove={()=>removeItem(item.id)} size="sm"/>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SmartCart() {
  const toast = useToast();

  const [household,    setHousehold]    = useState(null);
  const [members,      setMembers]      = useState([]);
  const [currentUser,  setCurrentUser]  = useState(null);
  const [cart,         setCart]         = useState({});
  const [recipeItems,  setRecipeItems]  = useState([]); // ← from Recipes page
  const [payerId,      setPayerId]      = useState("");
  const [splitType,    setSplitType]    = useState("shared");
  const [payMethod,    setPayMethod]    = useState("razorpay");
  const [searchQ,      setSearchQ]      = useState("");
  const [activeCat,    setActiveCat]    = useState("all");
  const [showCart,     setShowCart]     = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showQR,       setShowQR]       = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [payLoading,   setPayLoading]   = useState(false);
  const [showSuccess,  setShowSuccess]  = useState(false);
  const [lastRef,      setLastRef]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [deliverySlot, setDeliverySlot] = useState("now");
  const [purchases,    setPurchases]    = useState([]);
  const [showHistory,  setShowHistory]  = useState(false);

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // ── Load recipe items from localStorage ──────────────────────────────
  const loadRecipeItems = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("homehub_smartcart_v2") || "[]");
      setRecipeItems(Array.isArray(stored) ? stored : []);
    } catch {
      setRecipeItems([]);
    }
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) { try { setCurrentUser(JSON.parse(userStr)); } catch {} }

    axios.get(`${API}/household/myhousehold`, { headers })
      .then(async r => {
        setHousehold(r.data);
        const m = r.data?.members || [];
        setMembers(m);
        if (m.length > 0) setPayerId(m[0]._id);
        // Load purchase history
        try {
          const pRes = await axios.get(`${API}/purchase/${r.data._id}`, { headers });
          setPurchases(pRes.data || []);
        } catch {}
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Load recipe items immediately
    loadRecipeItems();

    // Listen for updates from Recipes page
    window.addEventListener("recipeCartUpdated", loadRecipeItems);
    return () => window.removeEventListener("recipeCartUpdated", loadRecipeItems);
  }, []);

  // Remove a recipe item from cart
  const removeRecipeItem = (id) => {
    const updated = recipeItems.filter(item => item.id !== id);
    setRecipeItems(updated);
    localStorage.setItem("homehub_smartcart_v2", JSON.stringify(updated));
    toast("Item removed", "info");
  };

  const updateRecipeItemQty = (id, delta) => {
    const updated = recipeItems.map(item => {
      if (item.id === id) {
        const newQty = (item.qty || 1) + delta;
        return newQty <= 0 ? null : { ...item, qty: newQty };
      }
      return item;
    }).filter(Boolean);
    setRecipeItems(updated);
    localStorage.setItem("homehub_smartcart_v2", JSON.stringify(updated));
  };

  const clearRecipeItems = () => {
    setRecipeItems([]);
    localStorage.removeItem("homehub_smartcart_v2");
  };

  // ── Catalog cart calculations ─────────────────────────────────────────
  const cartItems   = Object.entries(cart).filter(([,q])=>q>0).map(([id,qty])=>({...ALL_ITEMS.find(i=>i.id===id),qty})).filter(Boolean);
  const catalogTotal= cartItems.reduce((s,i)=>s+i.price*i.qty,0);
  const recipeTotal = recipeItems.reduce((s,i)=>s+(i.price||0)*(i.qty||1),0);
  const cartTotal   = catalogTotal + recipeTotal;
  const cartCount   = cartItems.reduce((s,i)=>s+i.qty,0) + recipeItems.reduce((s,i)=>s+(i.qty||1),0);
  const deliveryFee = cartTotal >= 199 ? 0 : 19;
  const finalTotal  = cartTotal + deliveryFee;

  const addItem    = id => setCart(prev=>({...prev,[id]:(prev[id]||0)+1}));
  const removeItem = id => setCart(prev=>{const n={...prev};if(n[id]>1)n[id]--;else delete n[id];return n;});
  const clearCart  = () => { if(!window.confirm("Clear entire cart?"))return; setCart({}); clearRecipeItems(); };

  const filteredItems = ALL_ITEMS.filter(item => {
    const matchCat = activeCat==="all" || item.category===activeCat;
    const matchQ   = !searchQ || item.name.toLowerCase().includes(searchQ.toLowerCase());
    return matchCat && matchQ;
  });

  const getEffectivePayer = () => payerId || (members.length > 0 ? members[0]._id : currentUser?._id || "self");
  const getPayerName = () => members.find(m=>m._id===getEffectivePayer())?.name || currentUser?.name || "You";

  const savePurchase = async (rzpId=null, method="razorpay") => {
    setSubmitting(true);
    try {
      const ep = getEffectivePayer();
      const allCartItems = [
        ...cartItems.map(i=>({name:i.name,quantity:i.qty,unit:i.unit,price:i.price,category:i.category})),
        ...recipeItems.map(i=>({name:i.name,quantity:i.qty||1,unit:i.unit||"pcs",price:i.price||0,category:i.cat||"Grocery",fromRecipe:i.fromRecipe})),
      ];
      await axios.post(`${API}/purchase`, {
        householdId:       household?._id,
        description:       `Smart Cart — ${allCartItems.length} items`,
        category:          "Grocery",
        paidBy:            ep,
        paidByName:        getPayerName(),
        splitType,
        amount:            finalTotal,
        totalAmount:       finalTotal,
        paymentMethod:     method,
        razorpayPaymentId: rzpId,
        items:             allCartItems,
        sharedBy:          splitType==="individual"?[ep]:members.map(m=>m._id),
      }, { headers });
      setCart({});
      clearRecipeItems();
      setShowCheckout(false);
      setShowQR(false);
      setLastRef(rzpId || method);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
      toast("✅ Order saved to Purchases!", "success");
    } catch(err) {
      toast(err.response?.data?.message || "Failed to save", "error");
    }
    setSubmitting(false);
  };

  const handleRazorpay = async () => {
    setPayLoading(true);
    const ok = await loadRazorpay();
    if (!ok) { toast("Razorpay failed to load","error"); setPayLoading(false); return; }
    setPayLoading(false);
    new window.Razorpay({
      key: RAZORPAY_KEY,
      amount: Math.round(finalTotal * 100),
      currency: "INR",
      name: "HomeHub Smart Kitchen",
      description: `Grocery — ${cartCount} items`,
      handler: async r => {
        toast(`✅ Paid! Ref: ${r.razorpay_payment_id.slice(-8)}`, "success");
        await savePurchase(r.razorpay_payment_id, "razorpay");
      },
      prefill: { name: getPayerName(), contact: "9999999999", email: "test@homehub.com" },
      theme: { color: "#ff6b2b" },
      modal: { ondismiss: () => toast("Payment cancelled", "info") },
      config: {
        display: {
          hide: [{ method: "card", issuer: "international" }],
          preferences: { show_default_blocks: true },
        },
      },
    }).open();
  };

  // TEST MODE: Simulate payment without Razorpay (for testing only)
  const handleTestPayment = async () => {
    if (cartCount === 0) { toast("Add items to cart first", "warning"); return; }
    if (!window.confirm(`Simulate payment of ${INR(finalTotal)}? (Test Mode)`)) return;
    const fakeRef = "TEST-" + Date.now().toString(36).toUpperCase();
    toast(`✅ Test payment successful! Ref: ${fakeRef}`, "success");
    await savePurchase(fakeRef, "test");
  };

  const handlePay = () => {
    if (cartCount === 0) { toast("Add items to cart first","warning"); return; }
    if (payMethod === "razorpay") handleRazorpay();
    else if (payMethod === "test") handleTestPayment();
    else if (payMethod === "gpay") {
      window.location.href = `upi://pay?pa=${UPI_ID}&pn=HomeHub&am=${finalTotal}&cu=INR&mode=04`;
      setTimeout(() => { if(window.confirm(`Did you complete the GPay payment of ${INR(finalTotal)}?`)) savePurchase("GPAY-"+Date.now(),"gpay"); }, 3000);
    } else if (payMethod === "scanner") setShowQR(true);
    else if (payMethod === "cod") {
      if (window.confirm(`Place order for ${INR(finalTotal)}? Pay on delivery.`)) savePurchase("COD-"+Date.now(),"cod");
    } else if (payMethod === "test") {
      handleTestPayment();
    }
  };

  const catPillStyle = {padding:"8px 16px",borderRadius:50,fontSize:12,fontWeight:700,cursor:"pointer",transition:"all .15s",flexShrink:0,border:"1.5px solid"};

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60vh",flexDirection:"column",gap:12}}>
      <div style={{width:60,height:60,border:"4px solid rgba(255,107,43,0.15)",borderTop:"4px solid #ff6b2b",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <p style={{color:"#9c8672",fontSize:14,fontWeight:600}}>Loading Smart Cart…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",background:"#f8f9fa",minHeight:"100vh",paddingBottom:100}}>

      {showQR && <QRModal amount={finalTotal} onClose={()=>setShowQR(false)} onConfirm={async()=>{setShowQR(false);await savePurchase("QR-"+Date.now(),"scanner");}}/>}

      {showSuccess && (
        <div style={{position:"fixed",top:80,left:"50%",transform:"translateX(-50%)",zIndex:1000,background:"#dcfce7",border:"1px solid #bbf7d0",borderRadius:16,padding:"14px 24px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 8px 32px rgba(34,197,94,0.2)",whiteSpace:"nowrap"}}>
          <span style={{fontSize:24}}>🎉</span>
          <div><div style={{fontWeight:800,fontSize:15,color:"#166534"}}>Order Placed!</div><div style={{fontSize:12,color:"#166534",opacity:0.8}}>Saved to Purchases — check history there!</div></div>
          <button onClick={()=>setShowSuccess(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#166534",fontSize:16,marginLeft:8}}>✕</button>
        </div>
      )}

      {/* Top search */}
      <div style={{background:"white",borderBottom:"1px solid #e5e7eb",padding:"12px 20px",position:"sticky",top:0,zIndex:100,display:"flex",gap:12,alignItems:"center"}}>
        <div style={{flex:1,position:"relative"}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:16}}>🔍</span>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search for items…"
            style={{width:"100%",padding:"10px 12px 10px 40px",border:"1.5px solid #e5e7eb",borderRadius:12,fontSize:13,background:"#f9fafb",outline:"none",boxSizing:"border-box"}}
            onFocus={e=>e.target.style.borderColor="#ff6b2b"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
        </div>
        <button onClick={()=>setShowCart(v=>!v)} style={{
          position:"relative",padding:"10px 18px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",
          color:"white",border:"none",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer",
          display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 14px rgba(255,107,43,0.35)",whiteSpace:"nowrap",
        }}>
          🛒 {cartCount>0 ? <><span style={{background:"white",color:"#ff6b2b",borderRadius:50,width:20,height:20,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900}}>{cartCount}</span><span>{INR(cartTotal)}</span></> : "Cart"}
        </button>
      </div>

      {/* Delivery banner */}
      <div style={{background:"linear-gradient(135deg,#1a1410,#2d1810)",padding:"12px 20px",display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:20}}>⚡</span>
        <div><div style={{fontWeight:800,fontSize:14,color:"white"}}>Delivery in 10 minutes</div><div style={{fontSize:11,color:"rgba(255,255,255,0.55)"}}>{household?.name || "Your Household"}</div></div>
        <div style={{marginLeft:"auto",display:"flex",gap:8}}>
          {[{v:"now",l:"🚀 Now"},{v:"1hr",l:"⏰ 1 Hour"},{v:"tomorrow",l:"📅 Tomorrow"}].map(s=>(
            <button key={s.v} onClick={()=>setDeliverySlot(s.v)} style={{padding:"6px 12px",borderRadius:20,border:"none",background:deliverySlot===s.v?"rgba(255,107,43,0.9)":"rgba(255,255,255,0.1)",color:"white",fontSize:11,fontWeight:600,cursor:"pointer"}}>{s.l}</button>
          ))}
        </div>
      </div>

      {/* Test mode banner */}
      <div style={{background:"rgba(59,130,246,0.06)",borderBottom:"1px solid rgba(59,130,246,0.12)",padding:"8px 20px",display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#1d4ed8"}}>
        <span>🧪</span>
        <span><strong>Test Mode:</strong> Card: <code style={{background:"rgba(59,130,246,0.1)",padding:"0 5px",borderRadius:4}}>4111 1111 1111 1111</code> · Any expiry · Any CVV · OTP: 1234 · <strong>Cart History:</strong> Check /purchases page</span>
      </div>

      {/* ── RECIPE ITEMS SECTION (from Recipes page) ── */}
      {recipeItems.length > 0 && (
        <div style={{margin:"16px 20px 0",background:"white",borderRadius:16,padding:18,border:"2px solid rgba(255,107,43,0.2)",boxShadow:"0 4px 20px rgba(255,107,43,0.1)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div>
              <h3 style={{fontSize:15,fontWeight:800,color:"#1a1410",margin:0}}>🍛 Recipe Ingredients</h3>
              <p style={{fontSize:11,color:"#9c8672",margin:"3px 0 0"}}>{recipeItems.length} items added from Recipes page</p>
            </div>
            <button onClick={clearRecipeItems} style={{padding:"5px 12px",borderRadius:8,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.15)",color:"#dc2626",fontSize:11,fontWeight:700,cursor:"pointer"}}>Clear All</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
            {recipeItems.map(item => (
              <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"rgba(255,107,43,0.04)",borderRadius:12,border:"1px solid rgba(255,107,43,0.12)"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:13,color:"#1a1410",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                  <div style={{fontSize:10,color:"#9c8672"}}>From: {item.fromRecipe || "Recipe"} · {INR(item.price || 0)} est.</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <QtyControl qty={item.qty||1} onAdd={()=>updateRecipeItemQty(item.id,1)} onRemove={()=>updateRecipeItemQty(item.id,-1)} size="sm"/>
                  <button onClick={()=>removeRecipeItem(item.id)} style={{width:22,height:22,borderRadius:"50%",background:"rgba(220,53,69,0.1)",border:"none",cursor:"pointer",color:"#d32f2f",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                </div>
              </div>
            ))}
          </div>
          {recipeTotal > 0 && (
            <div style={{marginTop:12,padding:"10px 14px",background:"rgba(255,107,43,0.06)",borderRadius:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,color:"#5c4a35",fontWeight:700}}>Recipe items subtotal</span>
              <span style={{fontSize:15,fontWeight:900,color:"#ff6b2b"}}>{INR(recipeTotal)}</span>
            </div>
          )}
        </div>
      )}

      <div style={{maxWidth:1200,margin:"0 auto",padding:"0 20px"}}>
        {/* Category pills */}
        <div style={{padding:"16px 0",display:"flex",gap:10,overflowX:"auto",scrollbarWidth:"none"}}>
          <button onClick={()=>setActiveCat("all")} style={{...catPillStyle,background:activeCat==="all"?"#1a1410":"white",color:activeCat==="all"?"white":"#1a1410",borderColor:activeCat==="all"?"#1a1410":"#e5e7eb"}}>🏪 All</button>
          {Object.entries(CATALOG).map(([cat,{icon,color}])=>(
            <button key={cat} onClick={()=>setActiveCat(cat)} style={{...catPillStyle,background:activeCat===cat?color:"white",color:activeCat===cat?"white":"#1a1410",borderColor:activeCat===cat?color:"#e5e7eb"}}>
              {icon} {cat.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Products */}
        {searchQ ? (
          <div>
            <h3 style={{fontSize:14,fontWeight:700,color:"#6b7280",marginBottom:12}}>"{searchQ}" ({filteredItems.length})</h3>
            <ProductGrid items={filteredItems} cart={cart} addItem={addItem} removeItem={removeItem}/>
          </div>
        ) : activeCat==="all" ? (
          Object.entries(CATALOG).map(([cat,{items,color,icon}])=>(
            <div key={cat} style={{marginBottom:32}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <h2 style={{fontSize:18,fontWeight:800,color:"#1a1410",margin:0,display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:22}}>{icon}</span>{cat}</h2>
                <button onClick={()=>setActiveCat(cat)} style={{fontSize:12,fontWeight:700,color,background:"transparent",border:"none",cursor:"pointer"}}>See all →</button>
              </div>
              <ProductGrid items={items.map(i=>({...i,category:cat}))} cart={cart} addItem={addItem} removeItem={removeItem}/>
            </div>
          ))
        ) : (
          <div>
            <h2 style={{fontSize:18,fontWeight:800,color:"#1a1410",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:22}}>{CATALOG[activeCat]?.icon}</span>{activeCat}
            </h2>
            <ProductGrid items={filteredItems} cart={cart} addItem={addItem} removeItem={removeItem}/>
          </div>
        )}
      </div>

      {/* ── CART DRAWER ── */}
      {showCart && (
        <div style={{position:"fixed",inset:0,zIndex:200}} onClick={e=>e.target===e.currentTarget&&setShowCart(false)}>
          <div style={{position:"absolute",right:0,top:0,bottom:0,width:400,background:"white",boxShadow:"-8px 0 40px rgba(0,0,0,0.15)",display:"flex",flexDirection:"column"}}>
            <div style={{padding:"18px 20px",borderBottom:"1px solid #f3f4f6",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><h2 style={{margin:0,fontSize:17,fontWeight:800}}>🛒 My Cart</h2><p style={{margin:0,fontSize:12,color:"#9c8672"}}>{cartCount} items · {INR(cartTotal)}</p></div>
              <div style={{display:"flex",gap:8}}>
                {cartCount>0&&<button onClick={clearCart} style={{padding:"5px 10px",borderRadius:8,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.15)",color:"#dc2626",fontSize:11,fontWeight:700,cursor:"pointer"}}>Clear All</button>}
                <button onClick={()=>setShowCart(false)} style={{width:32,height:32,borderRadius:8,background:"#f3f4f6",border:"none",cursor:"pointer",fontSize:16}}>✕</button>
              </div>
            </div>
            <div style={{padding:"10px 20px",background:"#f0fdf4",borderBottom:"1px solid #dcfce7",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:18}}>⚡</span>
              <div><div style={{fontWeight:700,fontSize:13,color:"#166534"}}>Delivery in 10 min</div></div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"12px 20px"}}>
              {cartCount===0 ? (
                <div style={{textAlign:"center",padding:"60px 20px"}}>
                  <div style={{fontSize:48,marginBottom:12}}>🛒</div>
                  <div style={{fontSize:15,fontWeight:700,color:"#1a1410",marginBottom:6}}>Cart is empty</div>
                  <div style={{fontSize:13,color:"#9c8672"}}>Browse categories or add from Recipes page</div>
                </div>
              ) : (
                <>
                  {/* Catalog items */}
                  {cartItems.length > 0 && (
                    <>
                      <div style={{fontSize:11,fontWeight:700,color:"#9c8672",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>🏪 Catalog Items</div>
                      {cartItems.map(item=>(
                        <div key={item.id} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f3f4f6"}}>
                          <img src={item.img} alt={item.name} style={{width:48,height:48,borderRadius:10,objectFit:"cover",flexShrink:0}} onError={e=>e.target.style.display="none"}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                            <div style={{fontSize:11,color:"#9c8672"}}>{item.unit}</div>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                            <QtyControl qty={item.qty} onAdd={()=>addItem(item.id)} onRemove={()=>removeItem(item.id)} size="sm"/>
                            <span style={{fontWeight:800,fontSize:13,minWidth:55,textAlign:"right"}}>{INR(item.price*item.qty)}</span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Recipe items */}
                  {recipeItems.length > 0 && (
                    <>
                      <div style={{fontSize:11,fontWeight:700,color:"#9c8672",textTransform:"uppercase",letterSpacing:"0.05em",marginTop:16,marginBottom:8}}>🍛 Recipe Ingredients</div>
                      {recipeItems.map(item=>(
                        <div key={item.id} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f3f4f6"}}>
                          <div style={{width:48,height:48,borderRadius:10,background:"rgba(255,107,43,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🌿</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                            <div style={{fontSize:11,color:"#9c8672"}}>For: {item.fromRecipe || "Recipe"} · {item.unit || "pcs"}</div>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                            <QtyControl qty={item.qty||1} onAdd={()=>updateRecipeItemQty(item.id,1)} onRemove={()=>updateRecipeItemQty(item.id,-1)} size="sm"/>
                            <span style={{fontWeight:800,fontSize:13,minWidth:55,textAlign:"right"}}>{INR((item.price||0)*(item.qty||1))}</span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
            {cartCount>0&&(
              <div style={{padding:"14px 20px",borderTop:"1px solid #f3f4f6"}}>
                {catalogTotal > 0 && <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:12}}><span style={{color:"#9c8672"}}>Catalog Items</span><span style={{fontWeight:600}}>{INR(catalogTotal)}</span></div>}
                {recipeTotal > 0 && <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:12}}><span style={{color:"#9c8672"}}>Recipe Items</span><span style={{fontWeight:600}}>{INR(recipeTotal)}</span></div>}
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:13}}><span style={{color:"#5c4a35"}}>Delivery</span><span style={{fontWeight:600,color:deliveryFee===0?"#16a34a":"#1a1410"}}>{deliveryFee===0?"FREE":INR(deliveryFee)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderTop:"2px solid #f3f4f6",marginTop:6}}>
                  <span style={{fontWeight:800,fontSize:15}}>To Pay</span>
                  <span style={{fontWeight:900,fontSize:18,color:"#ff6b2b"}}>{INR(finalTotal)}</span>
                </div>
                <button onClick={()=>{setShowCart(false);setShowCheckout(true);}} style={{width:"100%",padding:14,background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",border:"none",borderRadius:14,color:"white",fontSize:15,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 16px rgba(255,107,43,0.35)"}}>
                  Proceed to Checkout →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CHECKOUT DRAWER ── */}
      {showCheckout && (
        <div style={{position:"fixed",inset:0,zIndex:300}} onClick={e=>e.target===e.currentTarget&&setShowCheckout(false)}>
          <div style={{position:"absolute",right:0,top:0,bottom:0,width:420,background:"white",boxShadow:"-8px 0 40px rgba(0,0,0,0.15)",display:"flex",flexDirection:"column",overflowY:"auto"}}>
            <div style={{padding:"18px 20px",borderBottom:"1px solid #f3f4f6",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"white",zIndex:1}}>
              <h2 style={{margin:0,fontSize:17,fontWeight:800}}>💳 Checkout</h2>
              <button onClick={()=>setShowCheckout(false)} style={{width:32,height:32,borderRadius:8,background:"#f3f4f6",border:"none",cursor:"pointer",fontSize:16}}>✕</button>
            </div>
            <div style={{padding:20,display:"flex",flexDirection:"column",gap:20}}>
              {/* Who's paying */}
              <div>
                <label style={{fontSize:10,fontWeight:700,color:"rgba(26,20,16,0.45)",textTransform:"uppercase",letterSpacing:"0.9px",display:"block",marginBottom:8}}>WHO IS PAYING?</label>
                {members.length > 0 ? (
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {members.map(m=>(
                      <button key={m._id} onClick={()=>setPayerId(m._id)} style={{padding:"8px 16px",borderRadius:50,fontSize:13,fontWeight:700,cursor:"pointer",background:payerId===m._id?"#ff6b2b":"#f3f4f6",color:payerId===m._id?"white":"#1a1410",border:payerId===m._id?"2px solid #ff6b2b":"2px solid transparent"}}>{m.name}</button>
                    ))}
                  </div>
                ) : (
                  <div style={{background:"#f0fdf4",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#166534",fontWeight:600}}>✅ You are paying</div>
                )}
              </div>

              {/* Split type */}
              <div>
                <label style={{fontSize:10,fontWeight:700,color:"rgba(26,20,16,0.45)",textTransform:"uppercase",letterSpacing:"0.9px",display:"block",marginBottom:8}}>SPLIT TYPE</label>
                <div style={{display:"flex",gap:8}}>
                  {[{v:"shared",l:"👥 Shared"},{v:"individual",l:"👤 Personal"}].map(o=>(
                    <button key={o.v} onClick={()=>setSplitType(o.v)} style={{flex:1,padding:"10px 12px",borderRadius:12,cursor:"pointer",textAlign:"left",background:splitType===o.v?"#1a1410":"#f3f4f6",color:splitType===o.v?"white":"#1a1410",border:splitType===o.v?"2px solid rgba(255,107,43,0.3)":"2px solid transparent",fontSize:13,fontWeight:700}}>{o.l}</button>
                  ))}
                </div>
              </div>

              {/* Payment method */}
              <div>
                <label style={{fontSize:10,fontWeight:700,color:"rgba(26,20,16,0.45)",textTransform:"uppercase",letterSpacing:"0.9px",display:"block",marginBottom:8}}>PAYMENT METHOD</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[{id:"razorpay",l:"💳 Card/UPI",c:"#ff6b2b"},{id:"gpay",l:"🟢 GPay",c:"#1a73e8"},{id:"scanner",l:"📷 QR Code",c:"#0891b2"},{id:"cod",l:"📦 Pay Later",c:"#16a34a"}].map(m=>(
                    <button key={m.id} onClick={()=>setPayMethod(m.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:12,cursor:"pointer",background:payMethod===m.id?`${m.c}12`:"#f9fafb",border:payMethod===m.id?`2px solid ${m.c}`:"2px solid transparent",fontSize:12,fontWeight:700,color:payMethod===m.id?m.c:"#1a1410"}}>
                      <span style={{fontSize:18}}>{m.l.split(" ")[0]}</span>
                      <span>{m.l.split(" ").slice(1).join(" ")}</span>
                      {payMethod===m.id&&<span style={{marginLeft:"auto",color:m.c}}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bill */}
              <div style={{background:"#fdf8f3",borderRadius:14,padding:"14px 16px"}}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Bill Summary</div>
                {catalogTotal > 0 && <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:12}}><span style={{color:"#5c4a35"}}>Catalog Items</span><span style={{fontWeight:600}}>{INR(catalogTotal)}</span></div>}
                {recipeTotal > 0 && <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:12}}><span style={{color:"#5c4a35"}}>Recipe Items (est.)</span><span style={{fontWeight:600}}>{INR(recipeTotal)}</span></div>}
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:13}}><span style={{color:"#5c4a35"}}>Delivery</span><span style={{fontWeight:600,color:deliveryFee===0?"#16a34a":"#1a1410"}}>{deliveryFee===0?"FREE ✓":INR(deliveryFee)}</span></div>
                {splitType==="shared"&&members.length>1&&(
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:12}}><span style={{color:"#9c8672"}}>Per person ({members.length})</span><span style={{fontWeight:700,color:"#16a34a"}}>{INR(Math.round(finalTotal/members.length))}</span></div>
                )}
                <div style={{display:"flex",justifyContent:"space-between",borderTop:"2px solid rgba(139,94,60,0.1)",paddingTop:10,marginTop:4}}>
                  <span style={{fontWeight:800,fontSize:15}}>Total to Pay</span>
                  <span style={{fontWeight:900,fontSize:20,color:"#ff6b2b"}}>{INR(finalTotal)}</span>
                </div>
              </div>

              <button onClick={handlePay} disabled={submitting||payLoading||cartCount===0} style={{width:"100%",padding:16,background:cartCount>0?"linear-gradient(135deg,#ff6b2b,#ff8c54)":"rgba(139,94,60,0.1)",border:"none",borderRadius:16,color:"white",fontSize:16,fontWeight:900,cursor:cartCount>0?"pointer":"not-allowed",opacity:submitting||payLoading?0.7:1,boxShadow:cartCount>0?"0 6px 24px rgba(255,107,43,0.35)":"none",transition:"all .2s"}}>
                {submitting?"⏳ Saving…":payLoading?"💳 Loading…":payMethod==="cod"?`📦 Place Order (${INR(finalTotal)})`:payMethod==="scanner"?"📷 Show QR":`💳 Pay ${INR(finalTotal)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating cart button */}
      {cartCount>0&&!showCart&&!showCheckout&&(
        <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",zIndex:150}}>
          <button onClick={()=>setShowCart(true)} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 24px",background:"linear-gradient(135deg,#1a1410,#2d1810)",color:"white",border:"none",borderRadius:50,cursor:"pointer",boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}}>
            <span style={{background:"#ff6b2b",borderRadius:50,width:24,height:24,display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:12}}>{cartCount}</span>
            <span style={{fontWeight:800,fontSize:14}}>{cartCount} item{cartCount!==1?"s":""}</span>
            <span style={{fontWeight:700,fontSize:14,marginLeft:8}}>{INR(cartTotal)}</span>
            <span style={{opacity:0.7}}>→</span>
          </button>
        </div>
      )}

      <style>{`
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:rgba(139,94,60,0.15);border-radius:2px}
        input:focus{outline:none!important}
        *{box-sizing:border-box}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}