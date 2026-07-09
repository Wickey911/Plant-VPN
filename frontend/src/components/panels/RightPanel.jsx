import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlantStore } from "../../store/plantStore";
import { api } from "../../api";
import EngineeringReportModal from "../reports/EngineeringReportModal";

function healthColor(h) {
  if (h > 95) return "#00FF94";
  if (h > 80) return "#90EE90";
  if (h > 60) return "#FFD700";
  if (h > 40) return "#FF6600";
  return "#FF2D55";
}

function SensorRow({ label, value, unit, warn = false, color }) {
  return (
    <div style={{
      display:"flex", justifyContent:"space-between", alignItems:"center",
      padding:"5px 0", borderBottom:"1px solid rgba(255,255,255,.04)",
    }}>
      <span style={{ fontSize:10, color:"#4A5878" }}>{label}</span>
      <span style={{
        fontSize:11, fontWeight:700, fontFamily:"var(--mono)",
        color: color || (warn ? "#FF2D55" : "#E8F0FF"),
      }}>
        {value !== undefined && value !== null ? `${typeof value === "number" ? value.toFixed(2) : value}${unit}` : "—"}
      </span>
    </div>
  );
}

function HealthArc({ health }) {
  const col = healthColor(health);
  const r = 34, circ = 2*Math.PI*r;
  const dash = (health/100)*circ*0.75;
  const offset = circ*0.125;
  return (
    <div style={{ position:"relative", width:84, height:84, flexShrink:0 }}>
      <svg width={84} height={84} style={{ transform:"rotate(135deg)" }}>
        <circle cx={42} cy={42} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={6}
          strokeDasharray={`${circ*0.75} ${circ}`} strokeDashoffset={-offset} strokeLinecap="round"/>
        <circle cx={42} cy={42} r={r} fill="none" stroke={col} strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={-offset} strokeLinecap="round"
          style={{ filter:`drop-shadow(0 0 6px ${col})`, transition:"stroke-dasharray .8s" }}/>
      </svg>
      <div style={{
        position:"absolute", inset:0, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
      }}>
        <span style={{ fontSize:18, fontWeight:800, color:col, lineHeight:1 }}>{health}</span>
        <span style={{ fontSize:8, color:"#4A5878" }}>HEALTH</span>
      </div>
    </div>
  );
}

// 3D Equipment Icon (SVG schematic by type)
function EquipmentIcon({ type, health }) {
  const col = healthColor(health);
  const icons = {
    tank: (
      <svg viewBox="0 0 60 80" width={60} height={80}>
        <rect x={10} y={15} width={40} height={50} rx={4} fill="none" stroke={col} strokeWidth={2}/>
        <ellipse cx={30} cy={14} rx={20} ry={7} fill="none" stroke={col} strokeWidth={2}/>
        <ellipse cx={30} cy={65} rx={20} ry={7} fill="none" stroke={col} strokeWidth={1} strokeDasharray="3,3"/>
        <line x1={5} y1={35} x2={10} y2={35} stroke="#FF9500" strokeWidth={2}/>
        <line x1={50} y1={50} x2={55} y2={50} stroke="#00D4FF" strokeWidth={2}/>
        <line x1={18} y1={65} x2={18} y2={75} stroke={col} strokeWidth={2}/>
        <line x1={42} y1={65} x2={42} y2={75} stroke={col} strokeWidth={2}/>
      </svg>
    ),
    column: (
      <svg viewBox="0 0 40 120" width={40} height={120}>
        <rect x={8} y={10} width={24} height={90} rx={3} fill="none" stroke={col} strokeWidth={2}/>
        <ellipse cx={20} cy={10} rx={12} ry={5} fill="none" stroke={col} strokeWidth={1.5}/>
        <ellipse cx={20} cy={100} rx={12} ry={5} fill="none" stroke={col} strokeWidth={1.5}/>
        {[30,50,70].map(y=><line key={y} x1={8} y1={y} x2={32} y2={y} stroke={col} strokeWidth={0.8} strokeDasharray="2,2"/>)}
        {[25,45,65].map(y=><line key={y} x1={32} y1={y} x2={40} y2={y} stroke="#FF9500" strokeWidth={1.5}/>)}
      </svg>
    ),
    pump: (
      <svg viewBox="0 0 80 50" width={80} height={50}>
        <rect x={5} y={10} width={30} height={25} rx={3} fill="none" stroke={col} strokeWidth={2}/>
        <circle cx={20} cy={22} r={8} fill="none" stroke={col} strokeWidth={1.5}/>
        <rect x={38} y={12} width={22} height={21} rx={3} fill="none" stroke="#8090A0" strokeWidth={2}/>
        <line x1={35} y1={22} x2={38} y2={22} stroke="#C8A000" strokeWidth={3}/>
        <line x1={0} y1={22} x2={5} y2={22} stroke="#00D4FF" strokeWidth={2}/>
        <line x1={20} y1={10} x2={20} y2={5} stroke="#00FF94" strokeWidth={2}/>
        <rect x={5} y={35} width={55} height={5} rx={2} fill="none" stroke="#6A7A8C" strokeWidth={1}/>
      </svg>
    ),
    compressor: (
      <svg viewBox="0 0 100 50" width={100} height={50}>
        <ellipse cx={35} cy={25} rx={30} ry={18} fill="none" stroke={col} strokeWidth={2}/>
        <rect x={65} y={13} width={25} height={24} rx={2} fill="none" stroke="#8090A0" strokeWidth={2}/>
        <line x1={60} y1={25} x2={65} y2={25} stroke="#C8A000" strokeWidth={3}/>
        <line x1={5} y1={25} x2={5} y2={35} stroke="#FF9500" strokeWidth={2}/>
        <line x1={5} y1={25} x2={0} y2={25} stroke="#FF9500" strokeWidth={2}/>
        <line x1={65} y1={25} x2={70} y2={15} stroke="#00D4FF" strokeWidth={2}/>
      </svg>
    ),
    hx: (
      <svg viewBox="0 0 100 40" width={100} height={40}>
        <ellipse cx={12} cy={20} rx={8} ry={16} fill="none" stroke="#6A7A8C" strokeWidth={2}/>
        <ellipse cx={88} cy={20} rx={8} ry={16} fill="none" stroke="#6A7A8C" strokeWidth={2}/>
        <rect x={12} y={4} width={76} height={32} fill="none" stroke={col} strokeWidth={2}/>
        {[0,1,2,3,4].map(i=><line key={i} x1={20+i*14} y1={4} x2={20+i*14} y2={36} stroke={col} strokeWidth={0.7} strokeDasharray="2,2"/>)}
        <line x1={12} y1={10} x2={0} y2={10} stroke="#FF9500" strokeWidth={2}/>
        <line x1={12} y1={30} x2={0} y2={30} stroke="#00D4FF" strokeWidth={2}/>
        <line x1={88} y1={10} x2={100} y2={10} stroke="#FF9500" strokeWidth={2}/>
        <line x1={88} y1={30} x2={100} y2={30} stroke="#00D4FF" strokeWidth={2}/>
      </svg>
    ),
    reactor: (
      <svg viewBox="0 0 50 100" width={50} height={100}>
        <rect x={8} y={15} width={34} height={60} rx={3} fill="none" stroke={col} strokeWidth={2}/>
        <ellipse cx={25} cy={15} rx={17} ry={8} fill="none" stroke={col} strokeWidth={1.5}/>
        <ellipse cx={25} cy={75} rx={17} ry={8} fill="none" stroke={col} strokeWidth={1.5}/>
        <rect x={10} y={17} width={30} height={56} fill="none" stroke={col} strokeWidth={0.5} strokeDasharray="3,3"/>
        <line x1={8} y1={30} x2={0} y2={30} stroke="#FF9500" strokeWidth={2}/>
        <line x1={42} y1={55} x2={50} y2={55} stroke="#00D4FF" strokeWidth={2}/>
        <line x1={25} y1={0} x2={25} y2={7} stroke="#BF5AF2" strokeWidth={2}/>
        <rect x={10} y={75} width={30} height={15} rx={2} fill="none" stroke="#6A7A8C" strokeWidth={1}/>
      </svg>
    ),
  };
  return (
    <div style={{
      background:"rgba(0,212,255,0.05)", border:"1px solid rgba(0,212,255,0.12)",
      borderRadius:8, padding:"14px 10px", display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      {icons[type] || icons.pump}
    </div>
  );
}

function ActionBtn({ label, icon, color, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        width:"100%", padding:"7px 8px", borderRadius:6, cursor:"pointer",
        background: hov ? `${color}18` : "rgba(255,255,255,.04)",
        border:`1px solid ${hov ? color+"60" : "rgba(255,255,255,.08)"}`,
        color: hov ? color : "#8899BB", fontSize:10, fontFamily:"var(--sans)",
        textAlign:"left", transition:"all .15s", display:"flex", alignItems:"center", gap:7,
      }}>
      <span style={{ fontSize:12, flexShrink:0 }}>{icon}</span>
      <span style={{ fontWeight: hov ? 600 : 400 }}>{label}</span>
    </button>
  );
}

export default function RightPanel() {
  const { selectedAsset, sensorData } = usePlantStore();
  const [detail, setDetail] = useState(null);
  const [activeReport, setActiveReport] = useState(null);
  const eq = selectedAsset;
  const sensor = eq ? sensorData[eq.id] : null;

  useEffect(() => {
    if (!eq) { setDetail(null); return; }
    api.assetDetail(eq.id).then(setDetail).catch(() => setDetail(null));
  }, [eq]);

  const failProb = eq ? Math.round((1 - eq.health / 100) * 100 + Math.random() * 5) : 0;
  const rul = detail?.asset?.Remaining_Useful_Life_Days ?? (eq ? Math.round(eq.health * 1.2) : 0);

  if (!eq) {
    return (
      <div style={{
        height:"100%", display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", gap:12, color:"#4A5878",
        background:"rgba(11,15,23,0.95)", borderLeft:"1px solid rgba(255,255,255,.07)",
        padding:"0 20px", textAlign:"center",
      }}>
        <div style={{ fontSize:36 }}>🏭</div>
        <div style={{ fontSize:13, fontWeight:600, color:"#8899BB" }}>No Asset Selected</div>
        <div style={{ fontSize:11, lineHeight:1.6 }}>
          Click any equipment in the 3D scene to view real-time sensor data, AI predictions, and maintenance records.
        </div>
      </div>
    );
  }

  const col = healthColor(eq.health);

  return (
    <AnimatePresence mode="wait">
      <motion.div key={eq.id}
        initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
        transition={{ duration:0.22 }}
        style={{
          height:"100%", display:"flex", flexDirection:"column", overflow:"hidden",
          background:"rgba(11,15,23,0.95)", borderLeft:"1px solid rgba(255,255,255,.07)",
        }}>

        {/* Header */}
        <div style={{
          padding:"10px 14px", borderBottom:"1px solid rgba(255,255,255,.07)",
          background:"rgba(0,212,255,.04)", flexShrink:0,
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontFamily:"var(--mono)", color:"#00D4FF", fontSize:14, fontWeight:700 }}>{eq.id}</div>
              <div style={{ fontSize:11, color:"#8899BB", marginTop:1 }}>{eq.name}</div>
              <div style={{ fontSize:9, color:"#4A5878", marginTop:1 }}>{eq.area} · {eq.service}</div>
            </div>
            <span style={{
              padding:"3px 8px", borderRadius:4, fontSize:10, fontWeight:600,
              background:`${col}18`, color:col, border:`1px solid ${col}40`,
            }}>{eq.health >= 80 ? "NORMAL" : eq.health >= 60 ? "WARNING" : eq.health >= 40 ? "ATTENTION" : "CRITICAL"}</span>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"10px 14px" }}>

          {/* SVG icon + health arc */}
          <div style={{ display:"flex", gap:10, marginBottom:12 }}>
            <EquipmentIcon type={eq.type} health={eq.health}/>
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6, justifyContent:"center" }}>
              <HealthArc health={eq.health}/>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
                {[
                  { l:"Fail Prob.", v:`${failProb}%`, c: failProb>60?"#FF2D55":failProb>30?"#FF9500":"#00FF94" },
                  { l:"RUL", v:`${rul}d`, c: rul<30?"#FF2D55":rul<90?"#FF9500":"#00FF94" },
                ].map(m=>(
                  <div key={m.l} style={{ background:"rgba(255,255,255,.04)", borderRadius:5, padding:"5px 7px" }}>
                    <div style={{ fontSize:8, color:"#4A5878", textTransform:"uppercase" }}>{m.l}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:m.c }}>{m.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live sensor data */}
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:9, color:"#4A5878", textTransform:"uppercase", letterSpacing:.8, marginBottom:6 }}>
              ● LIVE SENSORS
            </div>
            {sensor ? (
              <>
                <SensorRow label="Temperature"   value={sensor.temperature}  unit="°C"    warn={sensor.temperature > 300} color="#FF9500"/>
                <SensorRow label="Pressure"      value={sensor.pressure}     unit=" bar"  warn={sensor.pressure > 25}    color="#3D8EFF"/>
                <SensorRow label="Vibration"     value={sensor.vibration}    unit=" mm/s" warn={sensor.vibration > 2.5}  color={sensor.vibration>2.5?"#FF2D55":"#00FF94"}/>
                <SensorRow label="Flow"          value={sensor.flow}         unit=" m³/h"/>
                <SensorRow label="Motor Current" value={sensor.motorCurrent} unit=" A"/>
                <SensorRow label="Bearing Temp"  value={sensor.bearingTemp}  unit="°C"    warn={sensor.bearingTemp > 90} color="#FF9500"/>
                <SensorRow label="Anomaly Score" value={(sensor.anomalyScore*100).toFixed(0)} unit="%" warn={sensor.anomalyScore > 0.6} color={sensor.anomalyScore>0.6?"#FF2D55":"#00FF94"}/>
              </>
            ) : (
              <div style={{ fontSize:10, color:"#4A5878" }}>Loading sensor data…</div>
            )}
          </div>

          {/* Asset metadata */}
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:9, color:"#4A5878", textTransform:"uppercase", letterSpacing:.8, marginBottom:6 }}>
              ASSET INFO
            </div>
            {[
              ["Criticality",  eq.criticality],
              ["Material",     eq.material],
              ["Manufacturer", eq.manufacturer],
              ["Install Date", eq.installDate],
            ].map(([k,v]) => v && (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid rgba(255,255,255,.04)", fontSize:10 }}>
                <span style={{ color:"#4A5878" }}>{k}</span>
                <span style={{ color:"#8899BB", maxWidth:130, textAlign:"right", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v}</span>
              </div>
            ))}
          </div>

          {/* AI recommendation */}
          {(detail?.asset?.Recommended_Action || eq.health < 80) && (
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:9, color:"#4A5878", textTransform:"uppercase", letterSpacing:.8, marginBottom:6 }}>
                AI RECOMMENDATION
              </div>
              <div style={{
                background:"rgba(0,212,255,.06)", border:"1px solid rgba(0,212,255,.14)",
                borderRadius:7, padding:"9px 11px", fontSize:11, color:"#8899BB", lineHeight:1.55,
              }}>
                {detail?.asset?.Recommended_Action ||
                 (eq.health < 40 ? "⚠ CRITICAL: Immediate inspection required. High failure probability detected." :
                  eq.health < 60 ? "Schedule corrective maintenance within 7 days. Monitor sensor trends." :
                  "Continue scheduled maintenance. No immediate action required.")}
              </div>
            </div>
          )}

          {/* Work orders */}
          {detail?.work_orders?.length > 0 && (
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:9, color:"#4A5878", textTransform:"uppercase", letterSpacing:.8, marginBottom:6 }}>
                OPEN WORK ORDERS ({detail.work_orders.length})
              </div>
              {detail.work_orders.slice(0,2).map(w => (
                <div key={w.WO_ID} style={{
                  background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)",
                  borderRadius:6, padding:"7px 9px", marginBottom:5, fontSize:10,
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontFamily:"var(--mono)", color:"#00D4FF", fontSize:9 }}>{w.WO_ID}</span>
                    <span style={{ color:w.Priority==="P1"?"#FF2D55":w.Priority==="P2"?"#FF9500":"#3D8EFF", fontSize:9 }}>{w.Priority}</span>
                  </div>
                  <div style={{ color:"#8899BB", marginTop:2, lineHeight:1.35 }}>{w.Work_Description}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Action Center */}
        <div style={{ padding:"10px 14px", borderTop:"1px solid rgba(255,255,255,.07)", flexShrink:0 }}>
          <div style={{ fontSize:9, color:"#4A5878", textTransform:"uppercase", letterSpacing:.8, marginBottom:7 }}>
            ⚡ AI ACTION CENTER
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            <ActionBtn label="Generate PTW Package"    icon="🔐" color="#FF9500" onClick={() => setActiveReport("ptw")}/>
            <ActionBtn label="Export MOC Report"       icon="📐" color="#3D8EFF" onClick={() => setActiveReport("moc")}/>
            <ActionBtn label="Create Work Order"       icon="🔧" color="#00D4FF" onClick={() => setActiveReport("workorder")}/>
            <ActionBtn label="Schedule Shutdown"       icon="🛑" color="#FF2D55" onClick={() => setActiveReport("shutdown")}/>
            <ActionBtn label="Order Spare Parts"       icon="📦" color="#9B59B6" onClick={() => setActiveReport("pr")}/>
            <ActionBtn label="Notify Shift Supervisor" icon="⚡" color="#FFD700" onClick={() => setActiveReport("incident")}/>
          </div>
        </div>
      </motion.div>

      {/* Report modal */}
      <AnimatePresence>
        {activeReport && (
          <EngineeringReportModal
            type={activeReport}
            eq={eq}
            detail={detail}
            sensor={sensor}
            onClose={() => setActiveReport(null)}
          />
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
