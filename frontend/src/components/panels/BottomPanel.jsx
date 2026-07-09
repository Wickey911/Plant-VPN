import { useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { usePlantStore } from "../../store/plantStore";
import { EQUIPMENT } from "../../data/equipmentData";

const TIP = { contentStyle:{ background:"#fff", border:"1px solid var(--border)", fontSize:10, color:"#1E2A3B" } };

function healthColor(h) {
  if (h > 95) return "#00FF94";
  if (h > 80) return "#90EE90";
  if (h > 60) return "#FFD700";
  if (h > 40) return "#FF6600";
  return "#FF2D55";
}

export default function BottomPanel() {
  const { sensorData } = usePlantStore();

  // Asset distribution by type
  const typeDist = useMemo(() => {
    const acc = {};
    EQUIPMENT.forEach(e => { acc[e.type] = (acc[e.type]||0)+1; });
    return Object.entries(acc).map(([name,value]) => ({ name: name.replace("coolingTower","CT").replace("compressor","Comp"), value }));
  }, []);

  // Failure risk ranking (top 8)
  const riskRank = useMemo(() =>
    [...EQUIPMENT].sort((a,b)=>a.health-b.health).slice(0,8).map(e=>({
      id: e.id, health: e.health, fail: Math.round((1-e.health/100)*100),
    }))
  , []);

  // Live sensor timeline (last 12 ticks from sensorData snapshots)
  // We use a rolling window stored on window.__sensorHistory
  const history = useMemo(() => {
    if (!window.__sensorHistory) window.__sensorHistory = [];
    const avgTemp = Object.values(sensorData).reduce((s,d)=>s+(d?.temperature||0),0) / (Object.keys(sensorData).length||1);
    const avgVib  = Object.values(sensorData).reduce((s,d)=>s+(d?.vibration||0),0)  / (Object.keys(sensorData).length||1);
    window.__sensorHistory.push({ t: new Date().toLocaleTimeString("en",{hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit"}), temp:+avgTemp.toFixed(1), vib:+avgVib.toFixed(2) });
    if (window.__sensorHistory.length > 20) window.__sensorHistory.shift();
    return [...window.__sensorHistory];
  }, [sensorData]);

  // ── K-102 Wet Gas Compressor Cost Impact ──────────────────────────────────
  const costData = {
    asset: "K-102",
    name: "Wet Gas Compressor",
    area: "CDU / Overhead",
    health: 23,
    rul: "8–12 days",
    confidence: 94.2,
    actionWindow: 14,
    implementation: {
      labor:       67_200,
      parts:       112_000,
      engineering:  28_000,
      plannedLoss: 420_000,
    },
    failure: {
      emergency:   65_000,
      parts:      148_000,
      unplannedLoss: 2_100_000,
      envPenalty:   85_000,
      investigation: 25_000,
    },
  };
  const implTotal   = Object.values(costData.implementation).reduce((s,v)=>s+v,0);   // 627 200
  const failTotal   = Object.values(costData.failure).reduce((s,v)=>s+v,0);           // 2 423 000
  const netSavings  = failTotal - implTotal;
  const roi         = Math.round((netSavings / implTotal) * 100);
  const fmt = (v) => v >= 1_000_000
    ? `$${(v/1_000_000).toFixed(2)}M`
    : `$${Math.round(v/1000)}K`;

  return (
    <div style={{
      height:"100%", display:"grid",
      gridTemplateColumns:"0.85fr 1.15fr 1.4fr 1.3fr",
      borderTop:"1px solid rgba(255,255,255,.07)",
      background:"var(--bg2)", overflow:"hidden",
    }}>

      {/* Asset Distribution */}
      <div style={{ borderRight:"1px solid var(--border)", padding:"8px 12px", overflow:"hidden" }}>
        <div style={{ fontSize:9, color:"var(--text3)", textTransform:"uppercase", letterSpacing:.8, marginBottom:6 }}>
          ASSET DISTRIBUTION
        </div>
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={typeDist} margin={{ top:4, right:4, left:-20, bottom:4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,60,120,0.08)"/>
            <XAxis dataKey="name" tick={{ fill:"#4A5878", fontSize:8 }}/>
            <YAxis tick={{ fill:"#4A5878", fontSize:8 }}/>
            <Tooltip {...TIP}/>
            <Bar dataKey="value" radius={[3,3,0,0]}>
              {typeDist.map((_,i) => (
                <Cell key={i} fill={["#00D4FF","#00FF94","#3D8EFF","#FF9500","#BF5AF2","#FF2D55","#FFD700","#90EE90"][i%8]}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Failure Risk Ranking */}
      <div style={{ borderRight:"1px solid var(--border)", padding:"8px 12px", overflow:"hidden" }}>
        <div style={{ fontSize:9, color:"var(--text3)", textTransform:"uppercase", letterSpacing:.8, marginBottom:6 }}>
          FAILURE RISK RANKING (TOP 8)
        </div>
        <div style={{ overflowY:"auto", height:"calc(100% - 22px)" }}>
          {riskRank.map((eq,i) => {
            const col = healthColor(eq.health);
            return (
              <div key={eq.id} style={{
                display:"grid", gridTemplateColumns:"16px 55px 1fr 28px",
                alignItems:"center", gap:5, marginBottom:5, fontSize:10,
              }}>
                <span style={{ color:"var(--text3)", fontSize:9 }}>{i+1}</span>
                <span style={{ fontFamily:"var(--mono)", color:"#00D4FF", fontSize:10, fontWeight:600 }}>{eq.id}</span>
                <div style={{ background:"rgba(255,255,255,.05)", borderRadius:2, height:5, overflow:"hidden" }}>
                  <div style={{ width:`${eq.fail}%`, height:"100%", background:col, transition:"width .5s",
                    boxShadow:`0 0 4px ${col}` }}/>
                </div>
                <span style={{ color:col, fontWeight:700, textAlign:"right" }}>{eq.fail}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Sensor Trend */}
      <div style={{ borderRight:"1px solid var(--border)", padding:"8px 12px", overflow:"hidden" }}>
        <div style={{ fontSize:9, color:"var(--text3)", textTransform:"uppercase", letterSpacing:.8, marginBottom:6 }}>
          LIVE SENSOR TREND — AVG TEMP (°C) & VIBRATION (mm/s)
        </div>
        <ResponsiveContainer width="100%" height="82%">
          <LineChart data={history} margin={{ top:4, right:8, left:-18, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,60,120,0.08)"/>
            <XAxis dataKey="t" tick={{ fill:"#4A5878", fontSize:7 }} interval="preserveStartEnd"/>
            <YAxis yAxisId="l" tick={{ fill:"#4A5878", fontSize:8 }}/>
            <YAxis yAxisId="r" orientation="right" tick={{ fill:"#4A5878", fontSize:8 }} domain={[0,5]}/>
            <Tooltip {...TIP} formatter={(v,n)=>[v, n==="temp"?"Avg Temp":"Avg Vib"]}/>
            <Line yAxisId="l" type="monotone" dataKey="temp" stroke="#FF9500" strokeWidth={1.5} dot={false} name="temp" isAnimationActive={false}/>
            <Line yAxisId="r" type="monotone" dataKey="vib"  stroke="#00D4FF" strokeWidth={1.5} dot={false} name="vib"  isAnimationActive={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* K-102 Rework Cost Impact */}
      <div style={{ padding:"8px 12px", overflow:"hidden", display:"flex", flexDirection:"column", gap:5 }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:9, color:"var(--text3)", textTransform:"uppercase", letterSpacing:.8 }}>
            K-102 REWORK — COST IMPACT
          </div>
          <span style={{
            fontSize:8, fontWeight:700, padding:"1px 6px", borderRadius:3,
            background:"rgba(239,68,68,0.15)", color:"#EF4444", border:"1px solid rgba(239,68,68,0.30)",
          }}>CRITICAL</span>
        </div>

        {/* Asset tag line */}
        <div style={{ fontSize:9, color:"#6A7A8E", fontFamily:"var(--mono)" }}>
          {costData.name} · {costData.area} · Health {costData.health}% · RUL {costData.rul}
        </div>

        {/* Three cost tiles */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:4 }}>
          {[
            { label:"Implementation", value: fmt(implTotal), color:"#FBBF24", sub:"planned rework" },
            { label:"Prevented Loss",  value: fmt(failTotal),  color:"#EF4444", sub:"if run-to-failure" },
            { label:"Net Savings",     value: fmt(netSavings), color:"#22C55E", sub:`ROI ${roi}%`, bold:true },
          ].map(({ label, value, color, sub, bold }) => (
            <div key={label} style={{
              background:"rgba(255,255,255,0.03)", borderRadius:4,
              border:`1px solid ${color}22`, padding:"4px 6px",
            }}>
              <div style={{ fontSize:8, color:"var(--text3)", marginBottom:2 }}>{label}</div>
              <div style={{ fontSize:13, fontWeight:bold?800:700, color, fontFamily:"var(--mono)", lineHeight:1 }}>{value}</div>
              <div style={{ fontSize:8, color:"var(--text3)", marginTop:2 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Cost breakdown bar */}
        <div>
          <div style={{ fontSize:8, color:"var(--text3)", marginBottom:3 }}>COST BREAKDOWN</div>
          <div style={{ display:"flex", height:8, borderRadius:4, overflow:"hidden", gap:1 }}>
            {[
              { v: costData.implementation.labor,       c:"#60A5FA", label:"Labor" },
              { v: costData.implementation.parts,       c:"#A78BFA", label:"Parts" },
              { v: costData.implementation.engineering, c:"#38BDF8", label:"Eng." },
              { v: costData.implementation.plannedLoss, c:"#FBBF24", label:"Planned Downtime" },
            ].map(({ v, c, label }) => (
              <div key={label} title={`${label}: ${fmt(v)}`} style={{
                flex: v, background: c, height:"100%",
                boxShadow:`0 0 4px ${c}88`,
              }}/>
            ))}
          </div>
          <div style={{ display:"flex", gap:8, marginTop:3, flexWrap:"wrap" }}>
            {[
              { c:"#60A5FA", l:`Labor ${fmt(costData.implementation.labor)}` },
              { c:"#A78BFA", l:`Parts ${fmt(costData.implementation.parts)}` },
              { c:"#38BDF8", l:`Eng. ${fmt(costData.implementation.engineering)}` },
              { c:"#FBBF24", l:`Downtime ${fmt(costData.implementation.plannedLoss)}` },
            ].map(({ c, l }) => (
              <div key={l} style={{ display:"flex", alignItems:"center", gap:3 }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:c, flexShrink:0 }}/>
                <span style={{ fontSize:7.5, color:"var(--text3)", fontFamily:"var(--mono)" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action window */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          background:"rgba(34,197,94,0.07)", border:"1px solid rgba(34,197,94,0.20)",
          borderRadius:4, padding:"3px 8px", marginTop:"auto",
        }}>
          <div>
            <div style={{ fontSize:8, color:"#22C55E", fontWeight:700 }}>
              AI RECOMMENDATION · {costData.confidence}% confidence
            </div>
            <div style={{ fontSize:8, color:"var(--text3)" }}>
              Schedule rework within {costData.actionWindow} days to capture full savings
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:9, color:"#22C55E", fontWeight:800, fontFamily:"var(--mono)" }}>
              {fmt(netSavings)}
            </div>
            <div style={{ fontSize:7, color:"var(--text3)" }}>saved</div>
          </div>
        </div>

      </div>
    </div>
  );
}
