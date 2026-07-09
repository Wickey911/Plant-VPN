import { useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Plant3D, { Plant3DNavbar } from "../components/plant/Plant3D";
import RightPanel from "../components/panels/RightPanel";
import BottomPanel from "../components/panels/BottomPanel";
import { usePlantStore } from "../store/plantStore";
import { useSensorSimulation } from "../hooks/useSensorSimulation";
import { EQUIPMENT } from "../data/equipmentData";

// ── Mini radial gauge for the overview bar ─────────────────────────────────
function MiniGauge({ value, label, color, size = 56 }) {
  const pct = Math.min(100, Math.max(0, value));
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ * 0.75;
  const offset = circ * 0.125;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(135deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke="rgba(30,60,120,0.12)" strokeWidth={4}
            strokeDasharray={`${circ*0.75} ${circ}`} strokeDashoffset={-offset}
            strokeLinecap="round"/>
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth={4}
            strokeDasharray={`${dash} ${circ}`} strokeDashoffset={-offset}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 3px ${color})`, transition: "stroke-dasharray .6s ease" }}/>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color, lineHeight: 1 }}>{Math.round(pct)}</span>
          <span style={{ fontSize: 7, color: "var(--text3)" }}>%</span>
        </div>
      </div>
      <span style={{ fontSize: 8, color: "var(--text2)", textAlign: "center", lineHeight: 1.2, whiteSpace: "nowrap" }}>{label}</span>
    </div>
  );
}

// ── KPI action tile ─────────────────────────────────────────────────────────
function KpiTile({ icon, label, value, subtitle, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, background: `${color}0D`,
      border: `1px solid ${color}33`,
      borderRadius: 8, padding: "8px 10px",
      cursor: onClick ? "pointer" : "default",
      display: "flex", flexDirection: "column", gap: 2,
      textAlign: "left", transition: "background .18s",
    }}
    onMouseEnter={e => e.currentTarget.style.background = `${color}1A`}
    onMouseLeave={e => e.currentTarget.style.background = `${color}0D`}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ fontSize: 10 }}>{icon}</span>
        <span style={{ fontSize: 8, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px" }}>{label}</span>
      </div>
      <span style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "var(--mono)", lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 8, color: "var(--text3)" }}>{subtitle}</span>
    </button>
  );
}

// ── Overview bar — full width, horizontal ──────────────────────────────────
function OverviewBar() {
  const { setPendingFilter } = usePlantStore();

  const total    = EQUIPMENT.length;
  const critical = EQUIPMENT.filter(e => e.health < 40).length;
  const warning  = EQUIPMENT.filter(e => e.health >= 40 && e.health < 70).length;
  const healthy  = total - critical - warning;
  const avgHealth = Math.round(EQUIPMENT.reduce((s, e) => s + e.health, 0) / total);

  const gauges = [
    { label: "Plant Health",  value: avgHealth, color: avgHealth > 70 ? "#059669" : avgHealth > 50 ? "#B45309" : "#DC2626" },
    { label: "OEE",           value: 82,        color: "#2563EB" },
    { label: "Availability",  value: 91,        color: "#0284C7" },
    { label: "Energy Index",  value: 74,        color: "#7C3AED" },
    { label: "Safety Score",  value: 96,        color: "#059669" },
    { label: "Env. Risk",     value: 28,        color: "#DC2626" },
  ];

  const goAssets = (filter) => {
    if (filter) setPendingFilter({ riskFilter: filter, autoSelectFirst: false });
    window.dispatchEvent(new CustomEvent("app:navigate", { detail: "assets" }));
  };

  return (
    <div style={{
      height: "100%",
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "0 20px",
      background: "rgba(255,255,255,0.75)",
      borderBottom: "1px solid var(--border)",
      backdropFilter: "blur(8px)",
    }}>
      {/* Gauges */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        paddingRight: 14, borderRight: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        {gauges.map(g => (
          <MiniGauge key={g.label} value={g.value} label={g.label} color={g.color} />
        ))}
      </div>

      {/* KPI action tiles */}
      <div style={{ display: "flex", gap: 8, flex: 1 }}>
        <KpiTile icon="🔴" label="Critical Assets" value={critical} subtitle="need immediate action" color="#DC2626"
          onClick={() => goAssets("Critical")} />
        <KpiTile icon="⚠️" label="Warning Assets" value={warning} subtitle="monitoring required" color="#B45309"
          onClick={() => goAssets("Warning")} />
        <KpiTile icon="✅" label="Healthy Assets" value={healthy} subtitle="operating normally" color="#059669"
          onClick={() => goAssets("Healthy")} />
        <KpiTile icon="🔧" label="Total Assets" value={total} subtitle="under surveillance" color="#2563EB"
          onClick={() => goAssets(null)} />
      </div>

      {/* Live indicator */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 12px", borderRadius: 20,
        background: "rgba(5,150,105,0.10)",
        border: "1px solid rgba(5,150,105,0.25)",
        flexShrink: 0,
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "#059669", boxShadow: "0 0 6px #059669",
          animation: "pulse-dot 1.4s infinite",
        }}/>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", fontFamily: "var(--mono)" }}>LIVE</span>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
export default function Dashboard() {
  useSensorSimulation();

  const containerRef = useRef();
  const { selectedAsset, setSelected } = usePlantStore();
  const handleAssetSelect = useCallback(eq => setSelected(eq), [setSelected]);
  const hasSelection = Boolean(selectedAsset);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        height: "100%",
        display: "grid",
        gridTemplateRows: "120px 40px 300px 165px",
        overflow: "hidden",
        background: "var(--bg)",
      }}
    >
      {/* ROW 1 — Overview bar (gauges + KPI tiles) */}
      <div style={{ gridRow: "1", overflow: "hidden" }}>
        <OverviewBar />
      </div>

      {/* ROW 2 — 3D model navbar (search, heatmap, reset) */}
      <div style={{ gridRow: "2", overflow: "hidden" }}>
        <Plant3DNavbar containerRef={containerRef} />
      </div>

      {/* ROW 3 — 3D Refinery canvas */}
      <div style={{
        gridRow: "3",
        overflow: "hidden",
        position: "relative",
        display: "grid",
        gridTemplateColumns: `1fr ${hasSelection ? "300px" : "0px"}`,
        transition: "grid-template-columns 0.28s ease",
        maxWidth: 900,
        width: "100%",
        margin: "0 auto",
      }}>
        <div style={{ overflow: "hidden", position: "relative" }}>
          <Plant3D onAssetSelect={handleAssetSelect} containerRef={containerRef} />
        </div>

        <AnimatePresence>
          {hasSelection && (
            <motion.div
              key="equipment-status"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{
                overflow: "hidden",
                borderLeft: "1px solid var(--border)",
                background: "var(--glass2)",
              }}
            >
              <RightPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ROW 4 — Bottom analytics charts */}
      <div style={{ gridRow: "4", overflow: "hidden", borderTop: "1px solid var(--border)" }}>
        <BottomPanel />
      </div>
    </motion.div>
  );
}
