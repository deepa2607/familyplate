import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../components/Toast";

const API = "http://localhost:5000/api";

const DAYS  = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const MEALS = ["Breakfast","Lunch","Dinner","Snack"];

const MEALS_BY_DIET = {
  veg: {
    Breakfast:[
      {name:"Poha",           img:"https://www.themealdb.com/images/media/meals/xvrrux1511783685.jpg",cal:250,tag:"Light"},
      {name:"Idli Sambar",    img:"https://www.themealdb.com/images/media/meals/xvrrux1511783685.jpg",cal:280,tag:"South Indian"},
      {name:"Oats Porridge",  img:"https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=400",cal:220,tag:"Healthy"},
      {name:"Aloo Paratha",   img:"https://www.themealdb.com/images/media/meals/1548772327.jpg",cal:360,tag:"Filling"},
      {name:"Upma",           img:"https://www.themealdb.com/images/media/meals/xvrrux1511783685.jpg",cal:230,tag:"Quick"},
      {name:"Dosa",           img:"https://www.themealdb.com/images/media/meals/xvrrux1511783685.jpg",cal:240,tag:"Crispy"},
    ],
    Lunch:[
      {name:"Dal Rice",       img:"https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg",cal:420,tag:"Classic"},
      {name:"Rajma Chawal",   img:"https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg",cal:480,tag:"North Indian"},
      {name:"Chole Bhature",  img:"https://www.themealdb.com/images/media/meals/xvrrux1511783685.jpg",cal:600,tag:"Heavy"},
      {name:"Veg Biryani",    img:"https://www.themealdb.com/images/media/meals/wyxwsp1486979827.jpg",cal:450,tag:"Rice"},
      {name:"Paneer Butter Masala",img:"https://www.themealdb.com/images/media/meals/1548772327.jpg",cal:400,tag:"Rich"},
      {name:"Palak Paneer",   img:"https://www.themealdb.com/images/media/meals/1548772327.jpg",cal:290,tag:"Healthy"},
      {name:"Pav Bhaji",      img:"https://www.themealdb.com/images/media/meals/1548772327.jpg",cal:390,tag:"Street Food"},
    ],
    Dinner:[
      {name:"Roti & Sabzi",   img:"https://www.themealdb.com/images/media/meals/1548772327.jpg",cal:360,tag:"Light"},
      {name:"Khichdi",        img:"https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg",cal:320,tag:"Comfort"},
      {name:"Dal Makhani",    img:"https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg",cal:380,tag:"Rich"},
      {name:"Matar Paneer",   img:"https://www.themealdb.com/images/media/meals/1548772327.jpg",cal:310,tag:"Veg"},
      {name:"Dum Aloo",       img:"https://www.themealdb.com/images/media/meals/1548772327.jpg",cal:320,tag:"Comfort"},
    ],
    Snack:[
      {name:"Fruits Bowl",    img:"https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&w=400",cal:120,tag:"Healthy"},
      {name:"Sprouts Chaat",  img:"https://www.themealdb.com/images/media/meals/xvrrux1511783685.jpg",cal:150,tag:"Protein"},
      {name:"Chai & Biscuit", img:"https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&w=400",cal:180,tag:"Classic"},
      {name:"Roasted Chana",  img:"https://www.themealdb.com/images/media/meals/xvrrux1511783685.jpg",cal:130,tag:"Protein"},
    ],
  },
  nonveg: {
    Breakfast:[
      {name:"Egg Bhurji",     img:"https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?auto=compress&w=400",cal:280,tag:"Protein"},
      {name:"Omelette",       img:"https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?auto=compress&w=400",cal:260,tag:"Quick"},
      {name:"Poha",           img:"https://www.themealdb.com/images/media/meals/xvrrux1511783685.jpg",cal:250,tag:"Light"},
      {name:"Paratha + Egg",  img:"https://www.themealdb.com/images/media/meals/1548772327.jpg",cal:420,tag:"Power"},
    ],
    Lunch:[
      {name:"Chicken Curry",  img:"https://www.themealdb.com/images/media/meals/wyxwsp1486979827.jpg",cal:520,tag:"Non-veg"},
      {name:"Chicken Biryani",img:"https://www.themealdb.com/images/media/meals/wyxwsp1486979827.jpg",cal:580,tag:"Special"},
      {name:"Fish Curry",     img:"https://www.themealdb.com/images/media/meals/wyxwsp1486979827.jpg",cal:420,tag:"Coastal"},
      {name:"Egg Curry",      img:"https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?auto=compress&w=400",cal:340,tag:"Classic"},
    ],
    Dinner:[
      {name:"Butter Chicken", img:"https://www.themealdb.com/images/media/meals/wyxwsp1486979827.jpg",cal:450,tag:"Creamy"},
      {name:"Grilled Chicken",img:"https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&w=400",cal:280,tag:"Healthy"},
      {name:"Fish Fry + Rice",img:"https://images.pexels.com/photos/1516415/pexels-photo-1516415.jpeg?auto=compress&w=400",cal:460,tag:"Classic"},
    ],
    Snack:[
      {name:"Boiled Eggs",    img:"https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?auto=compress&w=400",cal:140,tag:"Protein"},
      {name:"Fruits Bowl",    img:"https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&w=400",cal:120,tag:"Fresh"},
    ],
  },
};

// Fallback: same as veg for other diet types
const DIET_FALLBACK = MEALS_BY_DIET.veg;
function getMealSuggestions(diet) { return MEALS_BY_DIET[diet] || DIET_FALLBACK; }

const DIET_OPTIONS = [
  {v:"veg",        l:"🌿 Veg"},
  {v:"nonveg",     l:"🍗 Non-veg"},
  {v:"vegan",      l:"🥦 Vegan"},
  {v:"keto",       l:"🥑 Keto"},
  {v:"diabetic",   l:"💊 Diabetic"},
  {v:"highprotein",l:"💪 High Protein"},
  {v:"jain",       l:"🙏 Jain"},
  {v:"lowcal",     l:"⚖️ Low Cal"},
];

const DAY_COLORS = ["#ff6b2b","#d32f2f","#7c3aed","#1565c0","#2d7a4f","#e67e22","#5c4a35"];
const MEMBER_AVATARS = ["👩","👨","👧","👦","👵","👴","🧑","👩‍🍳","👨‍🍳","🧒"];

function loadPlan(key) { try { return JSON.parse(localStorage.getItem(key))||{}; } catch { return {}; } }
function savePlan(key, p) { try { localStorage.setItem(key, JSON.stringify(p)); } catch {} }

export default function MealPlanner() {
  const toast = useToast();
  const navigate = useNavigate();

  const [household,      setHousehold]      = useState(null);
  const [members,        setMembers]        = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [plan,           setPlan]           = useState({});
  const [activeDay,      setActiveDay]      = useState("Monday");
  const [activeMeal,     setActiveMeal]     = useState(null);
  const [dietMode,       setDietMode]       = useState("veg");
  const [view,           setView]           = useState("week");
  // Recipe suggestion from Recipes page
  const [suggestion, setSuggestion] = useState(null);
  const [suggestionTarget, setSuggestionTarget] = useState({day:"Monday", meal:"Lunch"});

  const currentKeyRef = useRef("homehub_mealplan_v2");

  const getPlanKey = (hhId, memberId) =>
    memberId ? `homehub_mealplan_${hhId}_member_${memberId}` : `homehub_mealplan_${hhId}`;

  useEffect(() => {
    // Check for recipe suggestion from Recipes page
    try {
      const raw = localStorage.getItem("homehub_planner_suggestion");
      if (raw) {
        const sugg = JSON.parse(raw);
        if (sugg?.name) setSuggestion(sugg);
        localStorage.removeItem("homehub_planner_suggestion");
      }
    } catch {}

    axios.get(`${API}/household/myhousehold`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }).then(r => {
      const hh = r.data;
      setHousehold(hh);
      const hhMembers = hh?.members || [];
      setMembers(hhMembers);
      if (hhMembers.length > 0) {
        const first = hhMembers[0];
        setSelectedMember(first);
        const k = getPlanKey(hh._id, first._id || first.name);
        currentKeyRef.current = k;
        const saved = loadPlan(k);
        if (Object.keys(saved).length > 0) setPlan(saved);
      } else if (hh?._id) {
        const k = `homehub_mealplan_${hh._id}`;
        currentKeyRef.current = k;
        const saved = loadPlan(k);
        if (Object.keys(saved).length > 0) setPlan(saved);
      }
      if (hh?.foodPreference) {
        const m = {veg:"veg",vegetarian:"veg","non-veg":"nonveg",nonveg:"nonveg",vegan:"vegan",jain:"jain"};
        setDietMode(m[hh.foodPreference?.toLowerCase()]||"veg");
      }
    }).catch(()=>{});
  }, []);

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    if (household?._id) {
      const k = getPlanKey(household._id, member._id || member.name);
      currentKeyRef.current = k;
      setPlan(loadPlan(k));
    }
  };

  const setMeal = (day, meal, item) => {
    const next = { ...plan, [`${day}_${meal}`]: item };
    setPlan(next);
    savePlan(currentKeyRef.current, next);
    setActiveMeal(null);
    toast(`${item.name} planned for ${meal} on ${day}!`, "success");
  };

  const clearMeal = (day, meal) => {
    const next = { ...plan };
    delete next[`${day}_${meal}`];
    setPlan(next);
    savePlan(currentKeyRef.current, next);
  };

  const clearAll = () => {
    if (!window.confirm(`Clear entire week plan?`)) return;
    setPlan({});
    savePlan(currentKeyRef.current, {});
    toast("Meal plan cleared", "info");
  };

  // Accept the recipe suggestion
  const acceptSuggestion = () => {
    if (!suggestion) return;
    const mealTypeMap = {breakfast:"Breakfast",lunch:"Lunch",dinner:"Dinner",snack:"Snack"};
    const targetMeal = mealTypeMap[suggestion.mealType?.toLowerCase()] || suggestionTarget.meal;
    const item = { name:suggestion.name, img:suggestion.img, cal:suggestion.cal||0, tag:suggestion.tag||"Recipe" };
    setMeal(suggestionTarget.day, targetMeal, item);
    setSuggestion(null);
    toast(`${suggestion.name} added to ${suggestionTarget.day} ${targetMeal}! 📅`, "success");
  };

  const totalCals = (day) => MEALS.reduce((s,m)=>s+(plan[`${day}_${m}`]?.cal||0),0);
  const weekCals     = DAYS.reduce((s,d)=>s+totalCals(d),0);
  const plannedCount = Object.keys(plan).length;

  return (
    <div style={s.page}>

      {/* ── RECIPE SUGGESTION BANNER ── */}
      {suggestion && (
        <div style={{background:"linear-gradient(135deg,rgba(255,107,43,0.1),rgba(255,140,84,0.06))",border:"2px solid rgba(255,107,43,0.25)",borderRadius:16,padding:"16px 20px",boxShadow:"0 4px 20px rgba(255,107,43,0.12)"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            <div style={{width:44,height:44,borderRadius:10,overflow:"hidden",flexShrink:0}}>
              <img src={suggestion.img} alt={suggestion.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:14,color:"#1a1410",marginBottom:2}}>
                📅 Add "{suggestion.name}" to your meal plan?
              </div>
              <div style={{fontSize:12,color:"#9c8672"}}>From Recipes page · {suggestion.cal>0?`🔥 ${suggestion.cal} cal · `:""}{suggestion.tag||"Recipe"}</div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <select value={suggestionTarget.day} onChange={e=>setSuggestionTarget(t=>({...t,day:e.target.value}))}
                style={{padding:"6px 10px",borderRadius:8,border:"1px solid rgba(139,94,60,0.2)",background:"white",fontSize:12,fontWeight:600,color:"#1a1410",cursor:"pointer"}}>
                {DAYS.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
              <select value={suggestionTarget.meal} onChange={e=>setSuggestionTarget(t=>({...t,meal:e.target.value}))}
                style={{padding:"6px 10px",borderRadius:8,border:"1px solid rgba(139,94,60,0.2)",background:"white",fontSize:12,fontWeight:600,color:"#1a1410",cursor:"pointer"}}>
                {MEALS.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
              <button onClick={acceptSuggestion} style={{padding:"7px 14px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                ✅ Add to Plan
              </button>
              <button onClick={()=>setSuggestion(null)} style={{padding:"7px 12px",background:"rgba(139,94,60,0.08)",color:"#9c8672",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <div style={s.hero}>
        <img src="https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=1200&q=80" alt="" style={s.heroBg}/>
        <div style={s.heroOverlay}/>
        <div style={s.heroContent}>
          <div>
            <h1 style={s.heroTitle}>Meal Planner</h1>
            <p style={s.heroSub}>{household?.name||"Your household"} · Plan your week</p>
          </div>
          <div style={s.heroRight}>
            <div style={s.heroStat}><span style={s.heroNum}>{plannedCount}</span><span style={s.heroLab}>Planned</span></div>
            <div style={s.heroStat}><span style={{...s.heroNum,color:"#a5d6a7"}}>{DAYS.length*MEALS.length-plannedCount}</span><span style={s.heroLab}>Empty</span></div>
            <div style={s.heroStat}><span style={{...s.heroNum,color:"#c9a96e"}}>{weekCals}</span><span style={s.heroLab}>kcal/week</span></div>
            <button onClick={clearAll} style={s.heroClearBtn}>🗑️ Clear All</button>
          </div>
        </div>
      </div>

      {/* ── QUICK LINK TO RECIPES ── */}
      <div style={{background:"white",borderRadius:14,padding:"12px 18px",boxShadow:"0 4px 16px rgba(139,94,60,0.08)",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}} onClick={()=>navigate("/recipes")}>
        <div style={{width:36,height:36,borderRadius:10,background:"rgba(255,107,43,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🍛</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:13,color:"#1a1410"}}>Browse Recipes</div>
          <div style={{fontSize:11,color:"#9c8672"}}>Add any recipe to your meal plan with one click from the Recipes page</div>
        </div>
        <span style={{color:"#ff6b2b",fontWeight:700,fontSize:13}}>Go →</span>
      </div>

      {/* ── MEMBER SELECTOR ── */}
      {members.length > 0 && (
        <div style={s.memberBar}>
          <span style={s.memberBarLabel}>👤 Planning for:</span>
          <div style={s.memberList}>
            {members.map((m,i) => {
              const isActive = (selectedMember?._id||selectedMember?.name)===(m._id||m.name);
              return (
                <button key={m._id||m.name} onClick={()=>handleSelectMember(m)} style={{
                  ...s.memberBtn,
                  background: isActive?"#ff6b2b":"white",
                  color:      isActive?"white":"#5c4a35",
                  border:     isActive?"2px solid #ff6b2b":"2px solid rgba(139,94,60,0.12)",
                  boxShadow:  isActive?"0 4px 14px rgba(255,107,43,0.35)":"0 1px 4px rgba(139,94,60,0.1)",
                }}>
                  <span style={{fontSize:16}}>{MEMBER_AVATARS[i%MEMBER_AVATARS.length]}</span>
                  <span style={{fontWeight:700,fontSize:13}}>{m.name}</span>
                  {isActive&&<span style={{fontSize:10,opacity:0.8}}>✓</span>}
                </button>
              );
            })}
          </div>
          {selectedMember && <div style={s.memberNote}>Showing <strong>{selectedMember.name}</strong>'s plan</div>}
        </div>
      )}

      {/* ── VIEW + DIET ── */}
      <div style={s.controls}>
        <div style={{display:"flex",gap:8}}>
          {[["week","📅 Week"],["day","📋 Day"]].map(([v,l])=>(
            <button key={v} onClick={()=>setView(v)} style={{...s.tabBtn,background:view===v?"#ff6b2b":"white",color:view===v?"white":"#5c4a35",boxShadow:view===v?"0 4px 14px rgba(255,107,43,0.3)":"0 1px 4px rgba(139,94,60,0.1)"}}>
              {l}
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:12,fontWeight:700,color:"#5c4a35"}}>Diet:</span>
          {DIET_OPTIONS.map(({v,l})=>(
            <button key={v} onClick={()=>setDietMode(v)} style={{...s.dietBtn,background:dietMode===v?"#1a1410":"rgba(139,94,60,0.06)",color:dietMode===v?"white":"#5c4a35",border:dietMode===v?"1.5px solid rgba(255,107,43,0.3)":"1px solid transparent"}}>{l}</button>
          ))}
        </div>
      </div>

      {/* ── WEEK VIEW ── */}
      {view==="week" && (
        <div style={s.weekGrid}>
          {DAYS.map((day,di)=>{
            const dayColor=DAY_COLORS[di];
            const dayCals=totalCals(day);
            return (
              <div key={day} style={s.dayCol}>
                <div style={{...s.dayHeader,borderTop:`3px solid ${dayColor}`,background:`${dayColor}08`}}>
                  <span style={{...s.dayName,color:dayColor}}>{day.slice(0,3)}</span>
                  <span style={s.dayCals}>{dayCals?dayCals+"kcal":""}</span>
                </div>
                {MEALS.map(meal=>{
                  const item=plan[`${day}_${meal}`];
                  return (
                    <div key={meal} style={s.mealCell}>
                      <span style={s.mealLabel}>{meal}</span>
                      {item ? (
                        <div style={s.mealItemCard} onClick={()=>setActiveMeal({day,meal})}>
                          <img src={item.img} alt={item.name} style={s.mealItemImg}/>
                          <div style={s.mealItemOvl}/>
                          <div style={s.mealItemBody}>
                            <span style={s.mealItemName}>{item.name}</span>
                            <span style={s.mealItemCal}>{item.cal} kcal</span>
                          </div>
                          <button onClick={e=>{e.stopPropagation();clearMeal(day,meal);}} style={s.mealClearBtn}>✕</button>
                        </div>
                      ) : (
                        <button onClick={()=>setActiveMeal({day,meal})} style={s.mealEmptyCell}>
                          <span style={{fontSize:20,color:`${dayColor}60`}}>+</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ── DAY VIEW ── */}
      {view==="day" && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={s.dayTabs}>
            {DAYS.map((day,di)=>(
              <button key={day} onClick={()=>setActiveDay(day)} style={{...s.dayTabBtn,background:activeDay===day?DAY_COLORS[di]:"white",color:activeDay===day?"white":"#5c4a35",boxShadow:activeDay===day?`0 4px 14px ${DAY_COLORS[di]}40`:"0 1px 4px rgba(139,94,60,0.1)"}}>
                {day.slice(0,3)}
              </button>
            ))}
          </div>
          <div style={s.dayViewContent}>
            <div style={s.dayViewHeader}>
              <h3 style={s.dayViewTitle}>{activeDay}</h3>
              <span style={{fontSize:14,color:"#9c8672"}}>{totalCals(activeDay)} kcal planned</span>
            </div>
            <div style={s.dayMealGrid}>
              {MEALS.map(meal=>{
                const item=plan[`${activeDay}_${meal}`];
                return (
                  <div key={meal} style={s.dayMealCard}>
                    <div style={s.dayMealHeader}>
                      <span style={s.dayMealLabel}>{meal}</span>
                      {item&&<button onClick={()=>clearMeal(activeDay,meal)} style={s.dayMealClear}>✕ Remove</button>}
                    </div>
                    {item ? (
                      <div style={s.dayMealItem} onClick={()=>setActiveMeal({day:activeDay,meal})}>
                        <img src={item.img} alt={item.name} style={s.dayMealImg}/>
                        <div style={s.dayMealInfo}>
                          <p style={s.dayMealName}>{item.name}</p>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                            <span style={s.calBadge}>🔥 {item.cal} kcal</span>
                            <span style={s.tagBadge}>{item.tag}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button onClick={()=>setActiveMeal({day:activeDay,meal})} style={s.dayMealEmpty}>
                        <span style={{fontSize:28,color:"rgba(139,94,60,0.2)"}}>+</span>
                        <span style={{fontSize:12,color:"#9c8672",fontWeight:600}}>Add {meal}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── MEAL PICKER MODAL ── */}
      {activeMeal && (
        <div style={s.modalBg} onClick={e=>e.target===e.currentTarget&&setActiveMeal(null)}>
          <div style={s.modal}>
            <div style={s.modalHdr}>
              <div>
                <h3 style={s.modalTitle}>{activeMeal.meal} on {activeMeal.day}</h3>
                <p style={{fontSize:12,color:"#9c8672",margin:0}}>For <strong>{selectedMember?.name||"member"}</strong> · Choose a meal</p>
              </div>
              <button style={s.modalX} onClick={()=>setActiveMeal(null)}>✕</button>
            </div>
            <div style={s.pickerGrid}>
              {(getMealSuggestions(dietMode)[activeMeal.meal]||DIET_FALLBACK[activeMeal.meal]||[]).map(item=>(
                <button key={item.name} onClick={()=>setMeal(activeMeal.day,activeMeal.meal,item)} style={s.pickerCard}>
                  <img src={item.img} alt={item.name} style={s.pickerImg}/>
                  <div style={s.pickerOvl}/>
                  <div style={s.pickerBody}>
                    <span style={s.pickerName}>{item.name}</span>
                    <div style={{display:"flex",gap:6,marginTop:4}}>
                      <span style={s.pickerCal}>🔥 {item.cal}</span>
                      <span style={s.pickerTag}>{item.tag}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid rgba(139,94,60,0.08)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:"#9c8672"}}>Want more recipes?</span>
              <button onClick={()=>{setActiveMeal(null);navigate("/recipes");}} style={{padding:"7px 14px",background:"rgba(255,107,43,0.1)",color:"#ff6b2b",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                🍛 Browse Recipes →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page:{display:"flex",flexDirection:"column",gap:20,paddingBottom:32},
  hero:{position:"relative",borderRadius:24,overflow:"hidden",height:200,boxShadow:"0 16px 48px rgba(0,0,0,0.18)"},
  heroBg:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"},
  heroOverlay:{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(26,20,16,0.88),rgba(26,20,16,0.5))"},
  heroContent:{position:"relative",zIndex:2,padding:"32px 40px",height:"100%",display:"flex",justifyContent:"space-between",alignItems:"center"},
  heroTitle:{fontFamily:"'Playfair Display',serif",fontSize:36,fontWeight:800,color:"white",margin:"0 0 6px"},
  heroSub:{fontSize:12,color:"rgba(255,255,255,0.5)"},
  heroRight:{display:"flex",gap:20,alignItems:"center"},
  heroStat:{textAlign:"center"},
  heroNum:{display:"block",fontSize:20,fontWeight:800,color:"#ffaa70"},
  heroLab:{display:"block",fontSize:10,color:"rgba(255,255,255,0.45)",fontWeight:500,marginTop:2},
  heroClearBtn:{padding:"10px 16px",background:"rgba(255,255,255,0.12)",color:"white",border:"1px solid rgba(255,255,255,0.2)",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer"},
  memberBar:{background:"white",borderRadius:16,padding:"14px 20px",boxShadow:"0 4px 20px rgba(139,94,60,0.08)",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"},
  memberBarLabel:{fontSize:13,fontWeight:800,color:"#1a1410",whiteSpace:"nowrap"},
  memberList:{display:"flex",gap:10,flexWrap:"wrap",flex:1},
  memberBtn:{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:50,cursor:"pointer",transition:"all 0.2s",fontFamily:"inherit"},
  memberNote:{fontSize:11,color:"#9c8672",whiteSpace:"nowrap"},
  controls:{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12},
  tabBtn:{padding:"9px 18px",borderRadius:50,border:"none",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all 0.2s"},
  dietBtn:{padding:"7px 14px",borderRadius:50,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",transition:"all 0.2s"},
  weekGrid:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:10,overflowX:"auto"},
  dayCol:{display:"flex",flexDirection:"column",gap:8,minWidth:120},
  dayHeader:{borderRadius:12,padding:"10px 8px",textAlign:"center"},
  dayName:{display:"block",fontSize:13,fontWeight:800},
  dayCals:{display:"block",fontSize:10,color:"#9c8672",marginTop:2},
  mealCell:{display:"flex",flexDirection:"column",gap:4},
  mealLabel:{fontSize:9,fontWeight:700,color:"#9c8672",textTransform:"uppercase",letterSpacing:"0.06em",paddingLeft:2},
  mealItemCard:{position:"relative",borderRadius:10,overflow:"hidden",height:72,cursor:"pointer"},
  mealItemImg:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"},
  mealItemOvl:{position:"absolute",inset:0,background:"linear-gradient(180deg,transparent 20%,rgba(26,20,16,0.8) 100%)"},
  mealItemBody:{position:"absolute",bottom:0,left:0,right:0,padding:"6px 8px"},
  mealItemName:{display:"block",fontSize:10,fontWeight:700,color:"white"},
  mealItemCal:{display:"block",fontSize:9,color:"rgba(255,255,255,0.65)"},
  mealClearBtn:{position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.4)",border:"none",borderRadius:"50%",width:18,height:18,color:"white",fontSize:9,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
  mealEmptyCell:{background:"rgba(139,94,60,0.04)",border:"1.5px dashed rgba(139,94,60,0.18)",borderRadius:10,height:72,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.2s",width:"100%"},
  dayTabs:{display:"flex",gap:8,flexWrap:"wrap"},
  dayTabBtn:{padding:"10px 18px",borderRadius:50,border:"none",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all 0.2s"},
  dayViewContent:{background:"white",borderRadius:20,padding:24,boxShadow:"0 4px 20px rgba(139,94,60,0.08)"},
  dayViewHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20},
  dayViewTitle:{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:800,color:"#1a1410",margin:0},
  dayMealGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:16},
  dayMealCard:{background:"#fdf8f3",borderRadius:16,padding:16,display:"flex",flexDirection:"column",gap:12},
  dayMealHeader:{display:"flex",justifyContent:"space-between",alignItems:"center"},
  dayMealLabel:{fontSize:13,fontWeight:800,color:"#1a1410"},
  dayMealClear:{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#d32f2f",fontWeight:700},
  dayMealItem:{display:"flex",gap:12,alignItems:"center",cursor:"pointer"},
  dayMealImg:{width:64,height:64,borderRadius:12,objectFit:"cover",flexShrink:0},
  dayMealInfo:{flex:1},
  dayMealName:{fontSize:14,fontWeight:700,color:"#1a1410",margin:"0 0 6px"},
  calBadge:{background:"rgba(255,107,43,0.1)",color:"#ff6b2b",borderRadius:50,padding:"3px 8px",fontSize:11,fontWeight:700},
  tagBadge:{background:"rgba(139,94,60,0.08)",color:"#5c4a35",borderRadius:50,padding:"3px 8px",fontSize:11,fontWeight:600},
  dayMealEmpty:{width:"100%",background:"rgba(139,94,60,0.04)",border:"2px dashed rgba(139,94,60,0.15)",borderRadius:12,padding:20,display:"flex",flexDirection:"column",alignItems:"center",gap:6,cursor:"pointer"},
  modalBg:{position:"fixed",inset:0,background:"rgba(26,20,16,0.65)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"},
  modal:{background:"white",borderRadius:24,padding:28,width:"100%",maxWidth:600,boxShadow:"0 32px 80px rgba(0,0,0,0.3)",margin:20,maxHeight:"85vh",overflowY:"auto"},
  modalHdr:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20},
  modalTitle:{fontSize:20,fontWeight:800,color:"#1a1410",margin:0,fontFamily:"'Playfair Display',serif"},
  modalX:{background:"rgba(139,94,60,0.08)",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:14,flexShrink:0},
  pickerGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12},
  pickerCard:{position:"relative",borderRadius:14,overflow:"hidden",height:130,cursor:"pointer",border:"none",padding:0,transition:"transform 0.2s"},
  pickerImg:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"},
  pickerOvl:{position:"absolute",inset:0,background:"linear-gradient(180deg,transparent 30%,rgba(26,20,16,0.82) 100%)"},
  pickerBody:{position:"absolute",bottom:0,left:0,right:0,padding:"10px 12px",textAlign:"left"},
  pickerName:{display:"block",fontSize:13,fontWeight:800,color:"white"},
  pickerCal:{fontSize:10,color:"rgba(255,255,255,0.75)",background:"rgba(255,107,43,0.3)",borderRadius:50,padding:"2px 7px"},
  pickerTag:{fontSize:10,color:"rgba(255,255,255,0.65)",background:"rgba(255,255,255,0.1)",borderRadius:50,padding:"2px 7px"},
};