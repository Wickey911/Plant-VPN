import { useCallback } from "react";
import { motion } from "framer-motion";
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

// ── 3D Plant preview card ───────────────────────────────────────────────────
function Plant3DCard() {
  const total    = EQUIPMENT.length;
  const critical = EQUIPMENT.filter(e => e.health < 40).length;
  const warning  = EQUIPMENT.filter(e => e.health >= 40 && e.health < 70).length;
  const healthy  = total - critical - warning;

  const dots = EQUIPMENT.map(e => ({
    x: (e.position[0] + 27) / 58 * 100,
    y: (e.position[2] + 28) / 60 * 100,
    c: e.health > 70 ? "#22C55E" : e.health > 40 ? "#FBBF24" : "#EF4444",
  }));

  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      background: "#0D1520",
      borderTop: "1px solid rgba(56,189,248,0.10)",
    }}>
      {/* Card header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px",
        borderBottom: "1px solid rgba(56,189,248,0.10)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>🔷</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#C0CCDA", fontFamily: "JetBrains Mono,monospace" }}>3D PLANT SIMULATION</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {[["#22C55E", healthy, "Healthy"], ["#FBBF24", warning, "Warning"], ["#EF4444", critical, "Critical"]].map(([c, v, l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: c, boxShadow: `0 0 4px ${c}` }}/>
              <span style={{ fontSize: 10, color: c, fontFamily: "JetBrains Mono,monospace", fontWeight: 700 }}>{v}</span>
              <span style={{ fontSize: 9, color: "rgba(100,120,140,0.8)" }}>{l}</span>
            </div>
          ))}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("app:navigate", { detail: "digitaltwin" }))}
            style={{
              padding: "5px 14px", borderRadius: 5, cursor: "pointer",
              background: "rgba(56,189,248,0.12)",
              border: "1px solid rgba(56,189,248,0.35)",
              color: "#38BDF8", fontSize: 10, fontWeight: 700,
              fontFamily: "JetBrains Mono,monospace",
              display: "flex", alignItems: "center", gap: 6,
              transition: "background .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(56,189,248,0.22)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(56,189,248,0.12)"}
          >
            Open Full 3D View →
          </button>
        </div>
      </div>

      {/* Mini dot-map preview */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Dark grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(56,189,248,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}/>

        {/* Equipment dots */}
        {dots.map((d, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${d.x}%`, top: `${d.y}%`,
            width: 8, height: 8, borderRadius: "50%",
            background: d.c, boxShadow: `0 0 6px ${d.c}`,
            transform: "translate(-50%,-50%)",
          }}/>
        ))}

        {/* Centre label */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          <span style={{ fontSize: 36, opacity: 0.04 }}>⬡</span>
        </div>

        {/* Open CTA overlay */}
        <div
          onClick={() => window.dispatchEvent(new CustomEvent("app:navigate", { detail: "digitaltwin" }))}
          style={{
            position: "absolute", inset: 0, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div style={{
            background: "rgba(13,21,32,0.65)",
            border: "1px solid rgba(56,189,248,0.20)",
            borderRadius: 8, padding: "10px 20px",
            color: "#38BDF8", fontSize: 11, fontWeight: 700,
            fontFamily: "JetBrains Mono,monospace",
            display: "flex", alignItems: "center", gap: 8,
            backdropFilter: "blur(4px)",
          }}>
            <span style={{ fontSize: 16 }}>🔷</span>
            Click to open interactive 3D simulation
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
export default function Dashboard() {
  useSensorSimulation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        height: "100%",
        display: "grid",
        gridTemplateRows: "120px 1fr",
        overflow: "hidden",
        background: "var(--bg)",
      }}
    >
      {/* ROW 1 — Overview bar */}
      <div style={{ gridRow: "1", overflow: "hidden" }}>
        <OverviewBar />
      </div>

      {/* ROW 2 — Analytics charts */}
      <div style={{ gridRow: "2", overflow: "hidden", borderTop: "1px solid var(--border)" }}>
        <BottomPanel />
      </div>
    </motion.div>
  );
}
