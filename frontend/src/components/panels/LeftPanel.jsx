import { useMemo, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlantStore } from "../../store/plantStore";
import { EQUIPMENT } from "../../data/equipmentData";

// Animated radial gauge
function Gauge({ value, max = 100, label, color, size = 72 }) {
  const pct = Math.min(100, Math.max(0, value));
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const dash = (pct / max) * circ * 0.75;   // 270° arc
  const offset = circ * 0.125;               // start at 135°
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
      <div style={{ position:"relative", width:size, height:size }}>
        <svg width={size} height={size} style={{ transform:"rotate(135deg)" }}>
          {/* Track */}
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke="rgba(30,60,120,0.12)" strokeWidth={5}
            strokeDasharray={`${circ*0.75} ${circ}`} strokeDashoffset={-offset}
            strokeLinecap="round"/>
          {/* Value */}
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth={5}
            strokeDasharray={`${dash} ${circ}`} strokeDashoffset={-offset}
            strokeLinecap="round"
            style={{ filter:`drop-shadow(0 0 4px ${color})`, transition:"stroke-dasharray .6s ease" }}/>
        </svg>
        <div style={{
          position:"absolute", inset:0, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
        }}>
          <span style={{ fontSize:15, fontWeight:700, color, lineHeight:1 }}>{Math.round(pct)}</span>
          <span style={{ fontSize:8, color:"var(--text3)" }}>%</span>
        </div>
      </div>
      <span style={{ fontSize:9, color:"var(--text2)", textAlign:"center", lineHeight:1.3 }}>{label}</span>
    </div>
  );
}

function AlertRow({ alert }) {
  const sev = alert.severity;
  const colors = { Critical:"#FF2D55", High:"#FF9500", Medium:"#3D8EFF", Low:"#00FF94" };
  const c = colors[sev] || "#4A5878";
  return (
    <motion.div initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}}
      style={{
        display:"flex", gap:8, alignItems:"flex-start",
        padding:"7px 0", borderBottom:"1px solid var(--border)",
      }}>
      <div style={{
        width:6, height:6, borderRadius:"50%", background:c,
        boxShadow:`0 0 6px ${c}`, flexShrink:0, marginTop:4,
        animation: sev==="Critical" ? "pulse-dot 1.4s infinite" : "none",
      }}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:10, fontFamily:"var(--mono)", color:"#00D4FF", fontWeight:700 }}>{alert.assetId}</span>
          <span style={{ fontSize:8, color:"var(--text3)" }}>{alert.ts}</span>
        </div>
        <div style={{ fontSize:10, color:"var(--text2)", marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {alert.message}
        </div>
      </div>
    </motion.div>
  );
}

// ── Inline SVG icons ───────────────────────────────────────────────────────────
const IconCritical = ({ c }) => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M7.5 1.5L13.5 12.5H1.5L7.5 1.5Z" stroke={c} strokeWidth="1.4" strokeLinejoin="round"/>
    <line x1="7.5" y1="5.5" x2="7.5" y2="9" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="7.5" cy="11" r="0.7" fill={c}/>
  </svg>
);
const IconAttention = ({ c }) => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <circle cx="7.5" cy="7.5" r="6" stroke={c} strokeWidth="1.4"/>
    <line x1="7.5" y1="4.5" x2="7.5" y2="8" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="7.5" cy="10" r="0.7" fill={c}/>
  </svg>
);
const IconAI = ({ c }) => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <circle cx="7.5" cy="7.5" r="2" stroke={c} strokeWidth="1.2"/>
    <circle cx="2"   cy="4"   r="1.1" stroke={c} strokeWidth="1.1"/>
    <circle cx="13"  cy="4"   r="1.1" stroke={c} strokeWidth="1.1"/>
    <circle cx="2"   cy="11"  r="1.1" stroke={c} strokeWidth="1.1"/>
    <circle cx="13"  cy="11"  r="1.1" stroke={c} strokeWidth="1.1"/>
    <line x1="3.1"  y1="4.5"  x2="5.8" y2="6.5"  stroke={c} strokeWidth="1"/>
    <line x1="11.9" y1="4.5"  x2="9.2" y2="6.5"  stroke={c} strokeWidth="1"/>
    <line x1="3.1"  y1="10.5" x2="5.8" y2="8.5"  stroke={c} strokeWidth="1"/>
    <line x1="11.9" y1="10.5" x2="9.2" y2="8.5"  stroke={c} strokeWidth="1"/>
  </svg>
);
const IconWrench = ({ c }) => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M9.5 2.5a3 3 0 0 1 0 4.24L4.5 11.5a1.42 1.42 0 0 1-2-2L7.26 4.74A3 3 0 0 1 9.5 2.5z"
      stroke={c} strokeWidth="1.3" strokeLinejoin="round"/>
    <circle cx="3.5" cy="11" r="0.6" fill={c}/>
  </svg>
);
const Chevron = ({ c }) => (
  <svg width="5" height="9" viewBox="0 0 5 9" fill="none">
    <path d="M1 1l3 3.5L1 8" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Animated KPI card ──────────────────────────────────────────────────────────
function KpiCard({ Icon, title, value, subtitle, color, accent, targetPage, filter, delay }) {
  const prevVal = useRef(value);
  const [glow, setGlow] = useState(false);

  useEffect(() => {
    if (prevVal.current !== value) {
      setGlow(true);
      prevVal.current = value;
      const t = setTimeout(() => setGlow(false), 600);
      return () => clearTimeout(t);
    }
  }, [value]);

  const navigate = () => {
    if (filter) usePlantStore.getState().setPendingFilter(filter);
    window.dispatchEvent(new CustomEvent("app:navigate", { detail: targetPage }));
  };

  return (
    <motion.button
      onClick={navigate}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.28, ease: "easeOut" }}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      style={{
        display: "flex", alignItems: "center", gap: 9,
        width: "100%", padding: "9px 10px 9px 11px",
        background: "rgba(255,255,255,0.55)",
        borderTop: "1px solid var(--border)",
        borderRight: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        borderLeft: `2.5px solid ${accent}`,
        borderRadius: 5,
        cursor: "pointer", textAlign: "left",
        transition: "background 0.14s",
        boxSizing: "border-box",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.90)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.55)"; }}
    >
      {/* Icon */}
      <div style={{ flexShrink: 0, opacity: 0.9 }}>
        <Icon c={accent} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 8.5, color: "#56657A", textTransform: "uppercase", letterSpacing: 0.9, marginBottom: 1 }}>
          {title}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={value}
            initial={{ y: -7, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 7, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              fontSize: 20, fontWeight: 700, color,
              fontFamily: "var(--mono)", lineHeight: 1.1,
              textShadow: glow ? `0 0 14px ${accent}90` : "none",
              transition: "text-shadow 0.3s",
            }}
          >
            {value}
          </motion.div>
        </AnimatePresence>
        <div style={{ fontSize: 8.5, color: "#3E4C62", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {subtitle}
        </div>
      </div>

      {/* Chevron */}
      <div style={{ flexShrink: 0, opacity: 0.45 }}>
        <Chevron c={accent} />
      </div>
    </motion.button>
  );
}

export default function LeftPanel() {
  const { alerts, sensorData } = usePlantStore();

  const stats = useMemo(() => {
    const total    = EQUIPMENT.length;
    const avgHealth= EQUIPMENT.reduce((s,e)=>s+e.health,0)/total;
    const critical = EQUIPMENT.filter(e=>e.health<40).length;
    const attention= EQUIPMENT.filter(e=>e.health>=40&&e.health<70).length;
    const good     = EQUIPMENT.filter(e=>e.health>=80).length;

    // Work orders: active = health<55, planned = 55-75
    const woActive  = EQUIPMENT.filter(e=>e.health<55).length;
    const woPlanned = EQUIPMENT.filter(e=>e.health>=55&&e.health<75).length;

    // AI recommendations: from live anomaly scores
    let aiPending = 0;
    Object.values(sensorData).forEach(s => {
      if (s && s.anomalyScore > 0.5) aiPending++;
    });
    const aiDone = Math.max(0, Math.round(aiPending * 0.55));

    // Gauge metrics
    let temps=0, vibs=0, cnt=0;
    Object.values(sensorData).forEach(s=>{
      if(s){ temps+=s.temperature||0; vibs+=s.vibration||0; cnt++; }
    });
    const avgTemp = cnt ? temps/cnt : 0;
    const avgVib  = cnt ? vibs/cnt  : 0;

    const oee      = Math.min(99, avgHealth * 0.92 + 5);
    const avail    = Math.min(99, (good/total)*100*0.98 + 2);
    const energy   = Math.min(95, 78 + (avgHealth/100)*15);
    const safety   = Math.max(60, 100 - critical*8 - attention*3);
    const envScore = Math.max(55, 95 - critical*5);
    const cyber    = 88;

    return {
      avgHealth, oee, avail, energy, safety, envScore, cyber,
      critical, attention, woActive, woPlanned, workOrders: woActive + woPlanned,
      aiPending, aiDone, aiRecs: aiPending + aiDone,
      avgTemp, avgVib,
    };
  }, [sensorData]);

  const gauges = [
    { label:"Plant Health",     value:stats.avgHealth, color:"#00D4FF" },
    { label:"OEE",              value:stats.oee,        color:"#00FF94" },
    { label:"Availability",     value:stats.avail,      color:"#90EE90" },
    { label:"Energy Index",     value:stats.energy,     color:"#3D8EFF" },
    { label:"Safety Score",     value:stats.safety,     color:"#FF9500" },
    { label:"Env. Risk",        value:stats.envScore,   color:"#BF5AF2" },
  ];

  return (
    <div style={{
      height:"100%", display:"flex", flexDirection:"column",
      background:"var(--bg2)", borderRight:"1px solid var(--border)",
      overflow:"hidden",
    }}>
      {/* Gauges */}
      <div style={{ padding:"10px 12px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
        <div style={{ fontSize:9, color:"var(--text3)", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>
          PLANT HEALTH MATRIX
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px 6px" }}>
          {gauges.map(g => <Gauge key={g.label} {...g} size={68}/>)}
        </div>
      </div>

      {/* Supervisor KPI Cards */}
      <div style={{
        display:"flex", flexDirection:"column", gap:5,
        padding:"8px 10px", borderBottom:"1px solid var(--border)", flexShrink:0,
      }}>
        <KpiCard
          Icon={IconCritical}
          title="Critical Assets"
          value={stats.critical}
          subtitle="Immediate Action Required"
          color="#EF4444"
          accent="#EF4444"
          targetPage="assets"
          filter={{ riskFilter: "Critical", autoSelectFirst: true }}
          delay={0}
        />
        <KpiCard
          Icon={IconAttention}
          title="Require Attention"
          value={stats.attention}
          subtitle="Inspection Recommended"
          color="#FBBF24"
          accent="#FBBF24"
          targetPage="assets"
          filter={{ riskFilter: "High", autoSelectFirst: true }}
          delay={0.05}
        />
        <KpiCard
          Icon={IconAI}
          title="AI Recommendations"
          value={stats.aiRecs}
          subtitle={`${stats.aiPending} Pending • ${stats.aiDone} Completed`}
          color="#38BDF8"
          accent="#38BDF8"
          targetPage="copilot"
          delay={0.1}
        />
        <KpiCard
          Icon={IconWrench}
          title="Open Work Orders"
          value={stats.workOrders}
          subtitle={`${stats.woActive} Active • ${stats.woPlanned} Planned`}
          color="#22C55E"
          accent="#22C55E"
          targetPage="mission"
          delay={0.15}
        />
      </div>

      {/* Live alerts */}
      <div style={{ padding:"8px 12px 4px", flexShrink:0 }}>
        <div style={{ fontSize:9, color:"var(--text3)", textTransform:"uppercase", letterSpacing:1 }}>
          LIVE ALERTS
          {alerts.length > 0 && (
            <span style={{ marginLeft:6, background:"#FF2D55", color:"#fff", borderRadius:8, padding:"1px 5px", fontSize:8 }}>
              {alerts.length}
            </span>
          )}
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"0 12px 10px" }}>
        {alerts.length === 0 ? (
          <div style={{ fontSize:10, color:"var(--text3)", textAlign:"center", marginTop:20 }}>
            No active alerts
          </div>
        ) : (
          alerts.map((a,i) => <AlertRow key={i} alert={a}/>)
        )}
      </div>

      {/* Cyber security */}
      <div style={{
        padding:"8px 12px", borderTop:"1px solid var(--border)",
        display:"flex", alignItems:"center", gap:8, flexShrink:0,
      }}>
        <div style={{ width:7, height:7, borderRadius:"50%", background:"#00FF94", boxShadow:"0 0 6px #00FF94" }}/>
        <div style={{ fontSize:9, color:"var(--text2)", flex:1 }}>Cybersecurity</div>
        <div style={{ fontSize:12, fontWeight:700, color:"var(--emerald)" }}>{stats.cyber}%</div>
      </div>
    </div>
  );
}
