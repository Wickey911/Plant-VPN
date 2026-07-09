import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BOILER_SENSOR_BASELINES } from "../../data/boilerData";

const TABS = ["Overview", "M-BOM", "Sensors", "AI"];

function healthColor(h) {
  if (h > 90) return "#00FF94";
  if (h > 75) return "#90EE90";
  if (h > 60) return "#FFD700";
  if (h > 40) return "#FF6600";
  return "#FF2D55";
}

function Arc({ value, max = 100, size = 80, color }) {
  const r = size / 2 - 7;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  const dash = (pct / max) * circ * 0.75;
  const offset = circ * 0.125;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(135deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)"
        strokeWidth={6} strokeDasharray={`${circ * 0.75} ${circ}`} strokeDashoffset={-offset} strokeLinecap="round" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={6} strokeDasharray={`${dash} ${circ}`} strokeDashoffset={-offset} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: "stroke-dasharray .6s" }} />
    </svg>
  );
}

export default function BoilerAssetPanel({ asset }) {
  const [tab, setTab] = useState("Overview");

  if (!asset) {
    return (
      <div style={{
        width: 320, height: "100%", background: "rgba(8,12,20,0.97)",
        borderLeft: "1px solid rgba(255,255,255,0.07)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 10, color: "rgba(100,120,150,0.5)",
      }}>
        <div style={{ fontSize: 32 }}>🏭</div>
        <div style={{ fontSize: 11, color: "#3a5060" }}>Click any equipment<br />to view details</div>
      </div>
    );
  }

  const hc = healthColor(asset.health);
  const sens = BOILER_SENSOR_BASELINES[asset.id] || {};

  return (
    <motion.div key={asset.id}
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      style={{
        width: 320, height: "100%", background: "rgba(8,12,20,0.97)",
        borderLeft: "1px solid rgba(255,255,255,0.07)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
      {/* Header */}
      <div style={{ padding: "12px 14px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "#00C8F0", fontFamily: "monospace", fontWeight: 700 }}>{asset.tag}</div>
            <div style={{ fontSize: 12, color: "#c0d8e8", fontWeight: 600, marginTop: 1 }}>{asset.name}</div>
            <div style={{ fontSize: 9, color: "#4a6070", marginTop: 2 }}>{asset.area} · {asset.service}</div>
          </div>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Arc value={asset.health} color={hc} size={72} />
            <div style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: hc }}>{asset.health}</span>
              <span style={{ fontSize: 7, color: "#4a6070" }}>%</span>
            </div>
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginBottom: 10 }}>
          {[
            { l: "Fail Prob", v: `${asset.failureProb}%`, c: asset.failureProb > 20 ? "#FF2D55" : asset.failureProb > 10 ? "#FF9500" : "#00FF94" },
            { l: "RUL", v: `${asset.rul} mo`, c: asset.rul < 12 ? "#FF6600" : "#90EE90" },
            { l: "Criticality", v: asset.criticality, c: asset.criticality === "Critical" ? "#FF2D55" : asset.criticality === "High" ? "#FF9500" : "#3D8EFF" },
          ].map(k => (
            <div key={k.l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 4, padding: "5px 7px" }}>
              <div style={{ fontSize: 8, color: "#4a6070", textTransform: "uppercase", letterSpacing: 0.5 }}>{k.l}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: k.c, marginTop: 1 }}>{k.v}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "5px 0", border: "none", borderRadius: "4px 4px 0 0",
              background: tab === t ? "rgba(0,200,240,0.12)" : "transparent",
              color: tab === t ? "#00C8F0" : "#4a6070",
              fontSize: 9, cursor: "pointer", fontWeight: tab === t ? 700 : 400,
              borderBottom: tab === t ? "2px solid #00C8F0" : "2px solid transparent",
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {tab === "Overview" && <OverviewTab asset={asset} />}
            {tab === "M-BOM" && <MBomTab asset={asset} />}
            {tab === "Sensors" && <SensorsTab asset={asset} sens={sens} />}
            {tab === "AI" && <AITab asset={asset} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: 10 }}>
      <span style={{ color: "#4a6070" }}>{label}</span>
      <span style={{ color: color || "#c0d8e8", fontFamily: "monospace", fontSize: 10 }}>{value}</span>
    </div>
  );
}

function OverviewTab({ asset }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Section title="Design Parameters">
        <Row label="Design Pressure" value={asset.designPressure} />
        <Row label="Design Temp" value={asset.designTemp} />
        <Row label="Operating Press" value={asset.operatingPressure} color="#00C8F0" />
        <Row label="Operating Temp" value={asset.operatingTemp} color="#00C8F0" />
        <Row label="Weight" value={asset.weight} />
        <Row label="Material" value={asset.material} color="#90EE90" />
        <Row label="Manufacturer" value={asset.manufacturer} />
        <Row label="Serial No." value={asset.serialNo} />
      </Section>
      <Section title="Maintenance">
        <Row label="Install Date" value={asset.installDate} />
        <Row label="Last Inspection" value={asset.inspectionDate} />
        <Row label="Freq." value={asset.maintenanceFreq} />
        <Row label="MTBF" value={asset.mtbf} />
      </Section>
      {asset.nozzles?.length > 0 && (
        <Section title={`Nozzles (${asset.nozzles.length})`}>
          {asset.nozzles.map(n => (
            <div key={n.id} style={{ padding: "3px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <span style={{ fontSize: 9, color: "#00C8F0", fontFamily: "monospace", fontWeight: 700 }}>{n.id}</span>
              <span style={{ fontSize: 9, color: "#8899aa", marginLeft: 6 }}>{n.service}</span>
              <span style={{ fontSize: 8, color: "#4a6070", float: "right" }}>{n.size}</span>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

function MBomTab({ asset }) {
  if (!asset.mbom?.length) return <div style={{ color: "#4a6070", fontSize: 10, textAlign: "center", marginTop: 20 }}>No M-BOM data</div>;
  return (
    <div>
      <div style={{ fontSize: 9, color: "#4a6070", marginBottom: 8 }}>Manufacturing Bill of Materials — {asset.mbom.length} items</div>
      {asset.mbom.map(row => (
        <div key={row.item} style={{ background: "rgba(255,255,255,0.025)", borderRadius: 4, padding: "6px 8px", marginBottom: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 9, color: "#00C8F0", fontFamily: "monospace", fontWeight: 700 }}>{row.tag}</span>
            <span style={{ fontSize: 9, color: "#4a6070" }}>{row.qty} {row.unit}</span>
          </div>
          <div style={{ fontSize: 10, color: "#c0d8e8", marginTop: 2 }}>{row.desc}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
            <span style={{ fontSize: 8, color: "#90EE90" }}>{row.material}</span>
            <span style={{ fontSize: 8, color: "#4a6070" }}>·</span>
            <span style={{ fontSize: 8, color: "#4a6070" }}>{row.spec}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SensorsTab({ asset, sens }) {
  const entries = Object.entries(sens).filter(([, v]) => v !== null);
  if (!entries.length) return <div style={{ color: "#4a6070", fontSize: 10, textAlign: "center", marginTop: 20 }}>No live sensor data</div>;

  const labels = {
    temperature: ["Temperature", "°C"],
    pressure: ["Pressure", asset.id?.startsWith("FDF") || asset.id?.startsWith("IDF") ? "mmWC" : "kg/cm²"],
    vibration: ["Vibration", "mm/s"],
    flow: ["Flow", "%"],
    level: ["Level", "%"],
    anomalyScore: ["Anomaly Score", ""],
  };

  return (
    <div>
      <div style={{ fontSize: 9, color: "#4a6070", marginBottom: 8 }}>Live sensor readings (1-sec refresh)</div>
      {entries.map(([key, val]) => {
        const [label, unit] = labels[key] || [key, ""];
        const isHigh = key === "vibration" && val > 3.5;
        const isWarn = key === "anomalyScore" && val > 0.25;
        const col = isHigh || isWarn ? "#FF6600" : "#00C8F0";
        return (
          <div key={key} style={{ padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
              <span style={{ color: "#8899aa" }}>{label}</span>
              <span style={{ color: col, fontFamily: "monospace", fontWeight: 700 }}>
                {typeof val === "number" ? val.toFixed(val < 1 ? 2 : 1) : val} {unit}
              </span>
            </div>
            <div style={{ marginTop: 3, height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1 }}>
              <div style={{
                height: "100%", borderRadius: 1, background: col,
                width: `${Math.min(100, key === "anomalyScore" ? val * 100 : key === "level" ? val : Math.min(100, (val / (key === "temperature" ? 600 : key === "pressure" ? 120 : key === "vibration" ? 5 : 200)) * 100))}%`,
                transition: "width 0.5s",
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AITab({ asset }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ background: "rgba(0,200,240,0.06)", border: "1px solid rgba(0,200,240,0.2)", borderRadius: 6, padding: "10px 12px" }}>
        <div style={{ fontSize: 8, color: "#00C8F0", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>AI Recommendation</div>
        <div style={{ fontSize: 10, color: "#c0d8e8", lineHeight: 1.6 }}>{asset.ai}</div>
      </div>

      {asset.failureProb > 20 && (
        <div style={{ background: "rgba(255,45,85,0.08)", border: "1px solid rgba(255,45,85,0.25)", borderRadius: 6, padding: "8px 12px" }}>
          <div style={{ fontSize: 8, color: "#FF2D55", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Risk Alert</div>
          <div style={{ fontSize: 10, color: "#ffaabb" }}>Failure probability exceeds 20% threshold. Immediate maintenance review required. Consider scheduling inspection within next maintenance window.</div>
        </div>
      )}

      <Section title="Predictive Metrics">
        <Row label="Failure Probability" value={`${asset.failureProb}%`}
          color={asset.failureProb > 20 ? "#FF2D55" : asset.failureProb > 10 ? "#FF9500" : "#00FF94"} />
        <Row label="Remaining Useful Life" value={`${asset.rul} months`}
          color={asset.rul < 12 ? "#FF6600" : "#90EE90"} />
        <Row label="MTBF" value={asset.mtbf} />
        <Row label="Next Inspection" value={asset.inspectionDate} />
        <Row label="Maint. Frequency" value={asset.maintenanceFreq} />
      </Section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
        {["Shutdown Plan", "Root Cause", "Create WO", "Spare Parts"].map(a => (
          <button key={a} style={{
            padding: "6px", border: "1px solid rgba(0,200,240,0.2)",
            borderRadius: 4, background: "rgba(0,200,240,0.06)", color: "#00C8F0",
            fontSize: 9, cursor: "pointer", fontWeight: 600,
          }}>{a}</button>
        ))}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 8, color: "#4a6070", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5, paddingBottom: 3, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{title}</div>
      {children}
    </div>
  );
}
