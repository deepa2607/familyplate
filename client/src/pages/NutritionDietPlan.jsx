import { useState, useCallback, useMemo } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";

const PLANS = {
  "Weight Loss":    { color:"#2d7a4f", img:"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80", calories:"1200-1500", protein:"80-100g", carbs:"100-120g", fat:"35-45g", desc:"Low calorie, high protein, fibre-rich. Designed for sustainable 0.5kg/week loss.", foods:["Brown rice","Moong dal","Green vegetables","Curd","Egg whites","Fruits","Oats"], avoid:["White rice","Fried foods","Sugary drinks","Processed snacks","Maida"], tips:["Start with warm water every morning","Include protein in every meal","Avoid refined carbs completely","Sleep 7-8 hours for best results"] },
  "Weight Gain":    { color:"#7c3aed", img:"https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80", calories:"2500-3000", protein:"120-150g", carbs:"300-350g", fat:"70-90g", desc:"Calorie surplus with quality protein and complex carbs for healthy muscle gain.", foods:["Full fat milk","Paneer","Chicken breast","Brown rice","Oats","Nuts","Banana"], avoid:["Empty calories","Junk food","Skipping meals","Excessive cardio"], tips:["Eat 5-6 meals per day","Have protein with every meal","Include healthy fats","Stay hydrated throughout"] },
  "Diabetic":       { color:"#1565c0", img:"https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80", calories:"1600-1800", protein:"70-90g", carbs:"150-180g", fat:"50-60g", desc:"Low GI foods, controlled portions, balanced meals to maintain stable blood sugar.", foods:["Whole grains","Bitter gourd","Fenugreek","Curd","Green leafy veg","Lean protein"], avoid:["White sugar","White rice","Fruit juices","Fried foods","Potatoes in excess"], tips:["Never skip meals","Eat at fixed times daily","Walk 30 min after meals","Monitor sugar regularly"] },
  "Gym Fitness":    { color:"#ff6b2b", img:"https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80", calories:"2000-2500", protein:"150-180g", carbs:"200-250g", fat:"60-70g", desc:"High protein diet for muscle building, performance and recovery.", foods:["Chicken","Eggs","Paneer","Whey protein","Sweet potato","Brown rice","Oats"], avoid:["Processed food","Alcohol","Sugary sports drinks","Trans fats"], tips:["Eat protein within 30 min post-workout","Stay hydrated","Include complex carbs pre-workout","Rest days are important too"] },
  "Vegetarian":     { color:"#388e3c", img:"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80", calories:"1800-2200", protein:"70-100g", carbs:"220-260g", fat:"55-70g", desc:"Complete plant-based nutrition with all essential amino acids and micronutrients.", foods:["Paneer","Dal","Chickpeas","Tofu","Quinoa","Sprouts","Nuts","Seeds"], avoid:["Processed vegetarian snacks","Excess sugar","Refined oil"], tips:["Combine dal+rice for complete protein","Include B12 supplements","Eat varied colours daily","Soak nuts and legumes overnight"] },
  "Thyroid":        { color:"#e67e22", img:"https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80", calories:"1500-1800", protein:"75-90g", carbs:"170-200g", fat:"45-55g", desc:"Selenium and iodine-rich foods to support thyroid function and manage symptoms.", foods:["Seafood","Eggs","Brazil nuts","Dairy","Selenium-rich foods","Whole grains"], avoid:["Raw cruciferous veg","Soy in excess","Gluten if sensitive","Processed foods"], tips:["Take thyroid medicine on empty stomach","Eat at consistent times","Avoid calcium near medication time","Stay well hydrated"] },
};

const SCHEDULES = {
  "Weight Loss": [
    { time:"6:30 AM",  name:"Wake-up drink", foods:"Warm water + lemon + honey", cal:15 },
    { time:"8:00 AM",  name:"Breakfast",     foods:"Oats porridge + 1 boiled egg + green tea", cal:280 },
    { time:"11:00 AM", name:"Mid-morning",   foods:"1 fruit (apple/pear) + 5 almonds", cal:110 },
    { time:"1:00 PM",  name:"Lunch",         foods:"2 rotis + moong dal + cucumber raita + salad", cal:380 },
    { time:"4:00 PM",  name:"Evening snack", foods:"Roasted chana + green tea", cal:120 },
    { time:"7:30 PM",  name:"Dinner",        foods:"Brown rice (small) + palak sabzi + curd", cal:340 },
    { time:"9:30 PM",  name:"Night",         foods:"Turmeric milk (skim)", cal:90 },
  ],
  "Gym Fitness": [
    { time:"5:30 AM",  name:"Pre-workout",   foods:"Banana + black coffee", cal:120 },
    { time:"7:00 AM",  name:"Post-workout",  foods:"Whey shake + 4 egg whites", cal:280 },
    { time:"9:30 AM",  name:"Breakfast",     foods:"Oats + 2 eggs + paneer bhurji", cal:420 },
    { time:"12:30 PM", name:"Lunch",         foods:"Chicken breast + brown rice + dal + salad", cal:580 },
    { time:"4:00 PM",  name:"Snack",         foods:"Sprouts + 1 banana + peanut butter", cal:310 },
    { time:"7:30 PM",  name:"Dinner",        foods:"Dal + 2 rotis + curd + vegetables", cal:420 },
    { time:"10:00 PM", name:"Night protein", foods:"Paneer or egg whites", cal:60 },
  ],
};

const NUTRITION_TABLE = [
  { food:"Oats",          cat:"Grains",    cal:389, protein:17, carbs:66, fat:7,  fiber:11 },
  { food:"Brown Rice",    cat:"Grains",    cal:370, protein:8,  carbs:78, fat:3,  fiber:4  },
  { food:"Whole Wheat Roti",cat:"Grains",  cal:264, protein:9,  carbs:54, fat:3,  fiber:5  },
  { food:"Moong Dal",     cat:"Protein",   cal:347, protein:24, carbs:59, fat:1,  fiber:16 },
  { food:"Paneer",        cat:"Dairy",     cal:296, protein:18, carbs:3,  fat:24, fiber:0  },
  { food:"Chicken Breast",cat:"Protein",   cal:165, protein:31, carbs:0,  fat:4,  fiber:0  },
  { food:"Eggs",          cat:"Protein",   cal:155, protein:13, carbs:1,  fat:11, fiber:0  },
  { food:"Spinach",       cat:"Vegetable", cal:23,  protein:3,  carbs:4,  fat:0,  fiber:2  },
  { food:"Curd",          cat:"Dairy",     cal:61,  protein:5,  carbs:5,  fat:3,  fiber:0  },
  { food:"Banana",        cat:"Fruit",     cal:89,  protein:1,  carbs:23, fat:0,  fiber:3  },
  { food:"Almonds",       cat:"Nuts",      cal:579, protein:21, carbs:22, fat:50, fiber:13 },
];

const CAT_COLORS = { Grains:"#e67e22", Protein:"#7c3aed", Dairy:"#1565c0", Vegetable:"#2d7a4f", Fruit:"#d32f2f", Nuts:"#5c4a35" };

const TABS = ["🥗 Plans","🕐 Meal Schedule","⚖️ BMI Calc","📊 Nutrition Table","🤖 AI Dietitian"];

export default function NutritionDietPlan() {
  const [tab, setTab] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState("Weight Loss");
  const [scheduleKey, setScheduleKey] = useState("Weight Loss");

  // BMI calc
  const [bmi, setBmi] = useState({ weight:"", height:"", age:"", gender:"male", activity:"moderate" });
  const [bmiResult, setBmiResult] = useState(null);

  // AI Dietitian
  const [aiQ, setAiQ]           = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer]   = useState("");
  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ Authorization:`Bearer ${token}` }), [token]);

  const calcBmi = () => {
    const w = parseFloat(bmi.weight), h = parseFloat(bmi.height)/100, a = parseInt(bmi.age);
    if (!w || !h || !a) return;
    const b = w/(h*h);
    const bmr = bmi.gender==="male" ? 88.36+(13.4*w)+(4.8*h*100)-(5.7*a) : 447.6+(9.2*w)+(3.1*h*100)-(4.3*a);
    const mult = {sedentary:1.2,light:1.375,moderate:1.55,active:1.725,very:1.9}[bmi.activity]||1.55;
    const tdee = Math.round(bmr*mult);
    const cat  = b<18.5?"Underweight":b<25?"Normal":b<30?"Overweight":"Obese";
    const col  = b<18.5?"#1565c0":b<25?"#2d7a4f":b<30?"#e67e22":"#d32f2f";
    setBmiResult({ bmi:b.toFixed(1), category:cat, color:col, tdee, bmr:Math.round(bmr) });
  };

  const askAIDietitian = useCallback(async () => {
    if (!aiQ.trim()) return;
    setAiLoading(true); setAiAnswer("");
    try {
      const prompt = `You are a certified Indian nutritionist and dietitian. Answer this question clearly and helpfully in 3-5 sentences with practical advice for Indian diet context:

"${aiQ}"

Keep it simple, actionable and specific to Indian foods. Mention specific foods by name.`;
      const res = await axios.post(`${API}/chat/gemini`, { message: prompt }, { headers: { Authorization: `Bearer ${token}` } });
      setAiAnswer(res.data?.reply || res.data?.text || "Sorry, couldn't get a response.");
    } catch {
      setAiAnswer("AI dietitian is busy. Please try again in a moment.");
    }
    setAiLoading(false);
  }, [aiQ, token]);

  const plan = PLANS[selectedPlan] || PLANS["Weight Loss"];
  const schedule = SCHEDULES[scheduleKey] || SCHEDULES["Weight Loss"];
  const totalCal = schedule.reduce((s,m) => s+m.cal, 0);

  return (
    <div style={s.page}>

      {/* HERO */}
      <div style={s.hero}>
        <img src="https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=1200&q=80" alt="" style={s.heroBg}/>
        <div style={s.heroOverlay}/>
        <div style={s.heroContent}>
          <div>
            <h1 style={s.heroTitle}>Nutrition & Diet</h1>
            <p style={s.heroSub}>AI-powered plans · BMI calculator · Meal schedules</p>
          </div>
          <div style={s.heroRight}>
            {[["6","Diet Plans"],["7","Meal Schedules"],["11","Foods in DB"]].map(([n,l])=>(
              <div key={l} style={s.heroStat}><span style={s.heroNum}>{n}</span><span style={s.heroLab}>{l}</span></div>
            ))}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={s.tabRow}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={{...s.tabBtn,background: tab===i ? "#ff6b2b" : "white",color: tab===i ? "white" : "#5c4a35",boxShadow: tab===i ? "0 4px 14px rgba(255,107,43,0.3)" : "0 1px 4px rgba(139,94,60,0.1)",}}>{t}</button>
        ))}
      </div>

      {/* ══ TAB 0 — DIET PLANS ══ */}
      {tab === 0 && (
        <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
          <div style={s.planButtons}>
            {Object.keys(PLANS).map(k=>(
              <button key={k} onClick={()=>setSelectedPlan(k)} style={{...s.planBtn,background: selectedPlan===k ? PLANS[k].color : "white",color: selectedPlan===k ? "white" : "#5c4a35",boxShadow: selectedPlan===k ? `0 4px 14px ${PLANS[k].color}40` : "0 1px 4px rgba(139,94,60,0.1)",}}>{k}</button>
            ))}
          </div>

          <div style={s.planHero}>
            <img src={plan.img} alt={selectedPlan} style={s.planHeroBg}/>
            <div style={s.planHeroOvl}/>
            <div style={s.planHeroContent}>
              <h2 style={s.planHeroTitle}>{selectedPlan} Diet</h2>
              <p style={s.planHeroDesc}>{plan.desc}</p>
              <div style={s.macroRow}>
                {[["🔥","Calories",plan.calories],["💪","Protein",plan.protein],["⚡","Carbs",plan.carbs],["🫧","Fat",plan.fat]].map(([em,lab,val])=>(
                  <div key={lab} style={s.macroPill}><span style={{fontSize:"16px"}}>{em}</span><span style={{fontSize:"11px",color:"rgba(255,255,255,0.6)"}}>{lab}</span><span style={{fontSize:"13px",fontWeight:"800",color:"white"}}>{val}</span></div>
                ))}
              </div>
            </div>
          </div>

          <div style={s.planGrid}>
            <div style={s.planBox}>
              <h4 style={{...s.planBoxTitle,color:"#2d7a4f"}}>✅ Recommended Foods</h4>
              {plan.foods.map((f,i)=><div key={i} style={s.planItem}>🥬 {f}</div>)}
            </div>
            <div style={s.planBox}>
              <h4 style={{...s.planBoxTitle,color:"#d32f2f"}}>❌ Foods to Avoid</h4>
              {plan.avoid.map((f,i)=><div key={i} style={s.planItem}>🚫 {f}</div>)}
            </div>
            <div style={s.planBox}>
              <h4 style={{...s.planBoxTitle,color:"#ff6b2b"}}>💡 Smart Tips</h4>
              {plan.tips.map((t,i)=><div key={i} style={s.planItem}>💡 {t}</div>)}
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB 1 — MEAL SCHEDULE ══ */}
      {tab === 1 && (
        <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
          <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
            {Object.keys(SCHEDULES).map(k=>(
              <button key={k} onClick={()=>setScheduleKey(k)} style={{...s.planBtn,background: scheduleKey===k ? "#ff6b2b" : "white",color: scheduleKey===k ? "white" : "#5c4a35",boxShadow: scheduleKey===k ? "0 4px 14px rgba(255,107,43,0.3)" : "0 1px 4px rgba(139,94,60,0.1)",}}>{k}</button>
            ))}
          </div>
          <div style={s.totalCalCard}>
            <span style={{fontSize:"32px",fontWeight:"900",color:"#ff6b2b"}}>{totalCal}</span>
            <div><p style={{margin:0,fontSize:"14px",fontWeight:"700",color:"#1a1410"}}>Total Daily Calories</p><p style={{margin:0,fontSize:"12px",color:"#9c8672"}}>Across {schedule.length} meals</p></div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            {schedule.map((meal,i)=>(
              <div key={i} style={s.scheduleRow}>
                <div style={s.scheduleTime}><span style={{fontSize:"13px",fontWeight:"800",color:"#ff6b2b"}}>{meal.time}</span></div>
                <div style={s.scheduleLine}><div style={s.scheduleDot}/>{i < schedule.length-1 && <div style={s.scheduleStem}/>}</div>
                <div style={s.scheduleCard}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div><p style={{margin:0,fontSize:"13px",fontWeight:"800",color:"#1a1410"}}>{meal.name}</p><p style={{margin:"4px 0 0",fontSize:"12px",color:"#9c8672",lineHeight:"1.5"}}>{meal.foods}</p></div>
                    <div style={s.mealCalPill}><span style={s.mealCalNum}>{meal.cal}</span><span style={s.mealCalUnit}>kcal</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ TAB 2 — BMI CALCULATOR ══ */}
      {tab === 2 && (
        <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
          <div style={s.calcCard}>
            <h3 style={s.calcTitle}>⚖️ BMI & Calorie Calculator</h3>
            <p style={{fontSize:"12px",color:"#9c8672",margin:"0 0 20px"}}>Enter your details to get personalised calorie goals</p>
            <div style={s.calcGrid}>
              {[["Weight (kg)","weight","number","70"],["Height (cm)","height","number","170"],["Age","age","number","25"]].map(([lbl,key,type,ph])=>(
                <div key={key} style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                  <label style={s.mLbl}>{lbl}</label>
                  <input type={type} placeholder={ph} value={bmi[key]} onChange={e=>setBmi({...bmi,[key]:e.target.value})} style={s.mInput}/>
                </div>
              ))}
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                <label style={s.mLbl}>Gender</label>
                <select value={bmi.gender} onChange={e=>setBmi({...bmi,gender:e.target.value})} style={s.mInput}>
                  <option value="male">Male</option><option value="female">Female</option>
                </select>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"6px",marginBottom:"20px"}}>
              <label style={s.mLbl}>Activity Level</label>
              <select value={bmi.activity} onChange={e=>setBmi({...bmi,activity:e.target.value})} style={s.mInput}>
                <option value="sedentary">Sedentary (desk job, no exercise)</option>
                <option value="light">Light (1-3 days/week exercise)</option>
                <option value="moderate">Moderate (3-5 days/week exercise)</option>
                <option value="active">Active (6-7 days/week exercise)</option>
                <option value="very">Very Active (physical job + exercise)</option>
              </select>
            </div>
            <button onClick={calcBmi} style={s.calcBtn}>Calculate BMI & Calorie Needs</button>
          </div>

          {bmiResult && (
            <div style={s.resultCard}>
              <div style={s.resultRow}>
                <div style={s.resultBig}>
                  <span style={{...s.resultNum,color:bmiResult.color}}>{bmiResult.bmi}</span>
                  <span style={s.resultLab}>BMI</span>
                </div>
                <div style={{...s.resultCatBox,background:`${bmiResult.color}12`,flex:1}}>
                  <div>
                    <p style={{margin:0,fontSize:"18px",fontWeight:"800",color:bmiResult.color}}>{bmiResult.category}</p>
                    <p style={{margin:"4px 0 0",fontSize:"12px",color:"#9c8672"}}>Your BMI category</p>
                  </div>
                </div>
                <div style={s.resultBig}>
                  <span style={{...s.resultNum,fontSize:"22px",color:"#ff6b2b"}}>{bmiResult.tdee}</span>
                  <span style={s.resultLab}>TDEE (kcal/day)</span>
                </div>
              </div>
              <div style={s.goalCards}>
                {[["🔻 Weight Loss","Lose 0.5kg/week",bmiResult.tdee-500,"#2d7a4f"],["⚖️ Maintain","Stay at current weight",bmiResult.tdee,"#ff6b2b"],["🔺 Weight Gain","Gain 0.5kg/week",bmiResult.tdee+500,"#7c3aed"],["💪 Lean Muscle","Build muscle slowly",bmiResult.tdee+200,"#1565c0"]].map(([title,desc,kcal,color])=>(
                  <div key={title} style={s.goalCard}>
                    <p style={{margin:"0 0 4px",fontSize:"12px",fontWeight:"800",color}}>{title}</p>
                    <p style={{margin:"0 0 8px",fontSize:"10px",color:"#9c8672"}}>{desc}</p>
                    <p style={{margin:0,fontSize:"20px",fontWeight:"900",color}}>{kcal} <span style={{fontSize:"11px",fontWeight:"600"}}>kcal</span></p>
                  </div>
                ))}
              </div>
              <div style={s.bmiScale}>
                <p style={{fontSize:"11px",fontWeight:"700",color:"#5c4a35",margin:"0 0 8px"}}>BMI Scale</p>
                <div style={{position:"relative",height:"14px",borderRadius:"7px",background:"linear-gradient(90deg,#1565c0 0%,#2d7a4f 30%,#e67e22 60%,#d32f2f 100%)",marginBottom:"6px"}}>
                  <div style={{position:"absolute",top:"-3px",left:`${Math.min(95,Math.max(5,((parseFloat(bmiResult.bmi)-15)/25)*100))}%`,transform:"translateX(-50%)",width:"20px",height:"20px",borderRadius:"50%",background:"white",border:`3px solid ${bmiResult.color}`,boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"10px",color:"#9c8672"}}>
                  <span>15 (Under)</span><span>18.5 (Normal)</span><span>25 (Over)</span><span>30 (Obese)</span><span>40+</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 3 — NUTRITION TABLE ══ */}
      {tab === 3 && (
        <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
          <div style={s.tableHero}>
            <img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80" alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
            <div style={{position:"absolute",inset:0,background:"rgba(26,20,16,0.75)"}}/>
            <div style={{position:"relative",zIndex:2,padding:"24px 28px"}}>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:"800",color:"white",margin:0}}>📊 Nutrition Reference Table</h3>
              <p style={{fontSize:"12px",color:"rgba(255,255,255,0.55)",margin:"6px 0 0"}}>Per 100g — approximate values for raw/uncooked food</p>
            </div>
          </div>
          <div style={{background:"white",borderRadius:"16px",overflow:"hidden",boxShadow:"0 4px 16px rgba(139,94,60,0.08)"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{background:"#1a1410"}}>
                    {["Food Item","Category","Calories","Protein","Carbs","Fat","Fiber"].map(h=>(
                      <th key={h} style={{padding:"12px 16px",fontSize:"11px",fontWeight:"700",color:"rgba(255,255,255,0.7)",textAlign:"left",letterSpacing:"0.05em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {NUTRITION_TABLE.map((row,i)=>(
                    <tr key={row.food} style={{background:i%2===0?"#fdf8f3":"white"}}>
                      <td style={{padding:"11px 16px",fontSize:"13px",fontWeight:"700",color:"#1a1410"}}>{row.food}</td>
                      <td style={{padding:"11px 16px"}}><span style={{background:`${CAT_COLORS[row.cat]||"#5c4a35"}12`,color:CAT_COLORS[row.cat]||"#5c4a35",borderRadius:"50px",padding:"3px 10px",fontSize:"11px",fontWeight:"700"}}>{row.cat}</span></td>
                      <td style={{padding:"11px 16px",fontSize:"13px",fontWeight:"700",color:"#ff6b2b"}}>{row.cal} kcal</td>
                      <td style={{padding:"11px 16px",fontSize:"13px",color:"#7c3aed",fontWeight:"600"}}>{row.protein}g</td>
                      <td style={{padding:"11px 16px",fontSize:"13px",color:"#e67e22",fontWeight:"600"}}>{row.carbs}g</td>
                      <td style={{padding:"11px 16px",fontSize:"13px",color:"#1565c0",fontWeight:"600"}}>{row.fat}g</td>
                      <td style={{padding:"11px 16px",fontSize:"13px",color:"#2d7a4f",fontWeight:"600"}}>{row.fiber}g</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB 4 — AI DIETITIAN ══ */}
      {tab === 4 && (
        <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
          <div style={s.aiCard}>
            <img src="https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800&q=70" alt="" style={s.aiBg}/>
            <div style={s.aiOverlay}/>
            <div style={s.aiInner}>
              <h3 style={s.aiTitle}>🤖 AI Dietitian</h3>
              <p style={s.aiSub}>Ask anything about nutrition, diet plans, specific foods, supplements, meal timing, or health goals</p>
              <div style={s.aiExamples}>
                {["What should I eat for weight loss?","How much protein do I need daily?","Best foods for diabetics in India","When should I eat before gym?","How to increase iron naturally?"].map(q=>(
                  <button key={q} onClick={()=>setAiQ(q)} style={s.aiExample}>{q}</button>
                ))}
              </div>
              <div style={s.aiRow}>
                <input
                  value={aiQ}
                  onChange={e=>setAiQ(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&askAIDietitian()}
                  placeholder="Ask your diet or nutrition question..."
                  style={s.aiInput}
                />
                <button onClick={askAIDietitian} disabled={aiLoading||!aiQ.trim()} style={s.aiBtn}>
                  {aiLoading ? "⏳..." : "Ask"}
                </button>
              </div>
            </div>
          </div>
          {(aiLoading || aiAnswer) && (
            <div style={s.aiAnswerCard}>
              {aiLoading ? (
                <div style={{textAlign:"center",padding:"20px",color:"#9c8672"}}>🤖 Getting expert advice...</div>
              ) : (
                <div>
                  <div style={{display:"flex",gap:"10px",marginBottom:"12px"}}>
                    <span style={{fontSize:"24px"}}>🤖</span>
                    <div style={{flex:1}}>
                      <p style={{margin:"0 0 4px",fontSize:"13px",fontWeight:"800",color:"#1a1410"}}>AI Dietitian</p>
                      <p style={{margin:0,fontSize:"10px",color:"#9c8672"}}>Based on Indian dietary guidelines</p>
                    </div>
                  </div>
                  <p style={{margin:0,fontSize:"14px",color:"#5c4a35",lineHeight:"1.7",whiteSpace:"pre-wrap"}}>{aiAnswer}</p>
                  <div style={{marginTop:"14px",padding:"10px 12px",background:"rgba(255,107,43,0.07)",borderRadius:"10px",fontSize:"11px",color:"#9c8672"}}>
                    ⚠️ This is AI-generated advice for general guidance only. Consult a registered dietitian for personalised medical nutrition therapy.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`input:focus,select:focus{outline:none!important;border-color:#ff6b2b!important;box-shadow:0 0 0 3px rgba(255,107,43,0.1)!important;}`}</style>
    </div>
  );
}

const s = {
  page:{display:"flex",flexDirection:"column",gap:"20px",paddingBottom:"32px"},
  hero:{position:"relative",borderRadius:"24px",overflow:"hidden",height:"190px",boxShadow:"0 16px 48px rgba(0,0,0,0.18)"},
  heroBg:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"},
  heroOverlay:{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(26,20,16,0.88),rgba(26,20,16,0.5))"},
  heroContent:{position:"relative",zIndex:2,padding:"32px 40px",height:"100%",display:"flex",justifyContent:"space-between",alignItems:"center"},
  heroTitle:{fontFamily:"'Playfair Display',serif",fontSize:"34px",fontWeight:"800",color:"white",margin:"0 0 6px"},
  heroSub:{fontSize:"12px",color:"rgba(255,255,255,0.5)"},
  heroRight:{display:"flex",gap:"24px"},
  heroStat:{textAlign:"center"},
  heroNum:{display:"block",fontSize:"22px",fontWeight:"800",color:"#ffaa70"},
  heroLab:{display:"block",fontSize:"10px",color:"rgba(255,255,255,0.45)",fontWeight:"500",marginTop:"2px"},
  tabRow:{display:"flex",gap:"8px",flexWrap:"wrap"},
  tabBtn:{padding:"9px 16px",borderRadius:"50px",border:"none",fontSize:"12px",fontWeight:"700",cursor:"pointer",transition:"all 0.2s"},
  planButtons:{display:"flex",gap:"8px",flexWrap:"wrap"},
  planBtn:{padding:"9px 18px",borderRadius:"50px",border:"none",fontSize:"13px",fontWeight:"700",cursor:"pointer",transition:"all 0.2s"},
  planHero:{position:"relative",borderRadius:"20px",overflow:"hidden",height:"200px",boxShadow:"0 8px 28px rgba(0,0,0,0.15)"},
  planHeroBg:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"},
  planHeroOvl:{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(26,20,16,0.88),rgba(26,20,16,0.6))"},
  planHeroContent:{position:"relative",zIndex:2,padding:"24px 28px"},
  planHeroTitle:{fontFamily:"'Playfair Display',serif",fontSize:"24px",fontWeight:"800",color:"white",margin:"0 0 6px"},
  planHeroDesc:{fontSize:"13px",color:"rgba(255,255,255,0.65)",margin:"0 0 16px",lineHeight:"1.5"},
  macroRow:{display:"flex",gap:"10px",flexWrap:"wrap"},
  macroPill:{display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",background:"rgba(255,255,255,0.1)",borderRadius:"12px",padding:"8px 14px"},
  planGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:"16px"},
  planBox:{background:"white",borderRadius:"16px",padding:"18px",boxShadow:"0 3px 14px rgba(139,94,60,0.07)",display:"flex",flexDirection:"column",gap:"6px"},
  planBoxTitle:{fontSize:"13px",fontWeight:"800",margin:"0 0 8px",fontFamily:"'Playfair Display',serif"},
  planItem:{fontSize:"13px",color:"#5c4a35",padding:"4px 0",borderBottom:"1px solid rgba(139,94,60,0.06)"},
  totalCalCard:{background:"white",borderRadius:"16px",padding:"18px 22px",display:"flex",alignItems:"center",gap:"16px",boxShadow:"0 4px 16px rgba(139,94,60,0.08)"},
  scheduleRow:{display:"flex",gap:"0",alignItems:"flex-start"},
  scheduleTime:{width:"80px",paddingTop:"14px",flexShrink:0},
  scheduleLine:{display:"flex",flexDirection:"column",alignItems:"center",width:"24px",flexShrink:0},
  scheduleDot:{width:"12px",height:"12px",borderRadius:"50%",background:"#ff6b2b",marginTop:"16px",flexShrink:0,zIndex:1},
  scheduleStem:{width:"2px",flex:1,background:"rgba(255,107,43,0.2)",marginTop:"2px",minHeight:"30px"},
  scheduleCard:{flex:1,background:"white",borderRadius:"14px",padding:"14px 16px",marginLeft:"12px",marginBottom:"8px",boxShadow:"0 2px 10px rgba(139,94,60,0.07)"},
  mealCalPill:{display:"flex",flexDirection:"column",alignItems:"center",background:"rgba(255,107,43,0.08)",borderRadius:"10px",padding:"6px 12px",flexShrink:0},
  mealCalNum:{fontSize:"16px",fontWeight:"900",color:"#ff6b2b"},
  mealCalUnit:{fontSize:"9px",color:"#9c8672",fontWeight:"600"},
  calcCard:{background:"white",borderRadius:"20px",padding:"28px",boxShadow:"0 4px 20px rgba(139,94,60,0.08)"},
  calcTitle:{fontSize:"20px",fontWeight:"800",color:"#1a1410",margin:"0 0 4px",fontFamily:"'Playfair Display',serif"},
  calcGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"14px",marginBottom:"16px"},
  calcBtn:{width:"100%",padding:"14px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",border:"none",borderRadius:"14px",fontSize:"15px",fontWeight:"700",cursor:"pointer",boxShadow:"0 6px 20px rgba(255,107,43,0.3)"},
  resultCard:{background:"white",borderRadius:"20px",padding:"24px",boxShadow:"0 4px 20px rgba(139,94,60,0.08)",display:"flex",flexDirection:"column",gap:"20px"},
  resultRow:{display:"flex",gap:"16px",alignItems:"stretch"},
  resultBig:{display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",justifyContent:"center"},
  resultNum:{fontSize:"36px",fontWeight:"900"},
  resultLab:{fontSize:"11px",color:"#9c8672",fontWeight:"600",textAlign:"center"},
  resultCatBox:{borderRadius:"14px",padding:"14px 20px",display:"flex",alignItems:"center"},
  goalCards:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"12px"},
  goalCard:{background:"#fdf8f3",borderRadius:"14px",padding:"14px",textAlign:"center"},
  bmiScale:{background:"rgba(139,94,60,0.04)",borderRadius:"14px",padding:"14px"},
  tableHero:{position:"relative",borderRadius:"18px",overflow:"hidden",height:"120px"},
  mLbl:{fontSize:"12px",fontWeight:"700",color:"#5c4a35",textTransform:"uppercase",letterSpacing:"0.04em"},
  mInput:{padding:"11px 14px",border:"1.5px solid rgba(139,94,60,0.15)",borderRadius:"12px",fontSize:"14px",background:"#fdf8f3",color:"#1a1410",transition:"all 0.2s",width:"100%"},
  aiCard:{position:"relative",borderRadius:"20px",overflow:"hidden",boxShadow:"0 8px 28px rgba(0,0,0,0.15)"},
  aiBg:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"},
  aiOverlay:{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(26,20,16,0.92),rgba(44,24,8,0.88))"},
  aiInner:{position:"relative",zIndex:2,padding:"24px 28px",display:"flex",flexDirection:"column",gap:"14px"},
  aiTitle:{fontSize:"20px",fontWeight:"800",color:"white",margin:0,fontFamily:"'Playfair Display',serif"},
  aiSub:{fontSize:"12px",color:"rgba(255,255,255,0.5)",margin:0},
  aiExamples:{display:"flex",gap:"8px",flexWrap:"wrap"},
  aiExample:{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.7)",borderRadius:"50px",padding:"5px 12px",fontSize:"11px",cursor:"pointer",transition:"all 0.2s"},
  aiRow:{display:"flex",gap:"10px"},
  aiInput:{flex:1,padding:"12px 16px",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"12px",fontSize:"14px",color:"white",outline:"none"},
  aiBtn:{padding:"12px 20px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",border:"none",borderRadius:"12px",fontSize:"14px",fontWeight:"700",cursor:"pointer"},
  aiAnswerCard:{background:"white",borderRadius:"20px",padding:"24px",boxShadow:"0 4px 20px rgba(139,94,60,0.08)"},
};