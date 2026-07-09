import { useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Plant3D, { Plant3DNavbar } from "../components/plant/Plant3D";
import RightPanel from "../components/panels/RightPanel";
import { usePlantStore } from "../store/plantStore";
import { useSensorSimulation } from "../hooks/useSensorSimulation";
import { EQUIPMENT } from "../data/equipmentData";

function HealthDot({ h }) {
  const c = h > 70 ? "#22C55E" : h > 40 ? "#FBBF24" : "#EF4444";
  return <div style={{ width: 7, height: 7, borderRadius: "50%", background: c, boxShadow: `0 0 5px ${c}`, flexShrink: 0 }}/>;
}

function StatusBar() {
  const total    = EQUIPMENT.length;
  const critical = EQUIPMENT.filter(e => e.health < 40).length;
  const warning  = EQUIPMENT.filter(e => e.health >= 40 && e.health < 70).length;
  const healthy  = total - critical - warning;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 20,
      padding: "0 16px",
      borderBottom: "1px solid rgba(56,189,248,0.10)",
      background: "rgba(4,8,18,0.92)",
      height: "100%",
    }}>
      <span style={{ fontSize: 10, color: "rgba(56,189,248,0.55)", fontFamily: "JetBrains Mono,monospace", letterSpacing: 1 }}>
        3D PLANT VIEW
      </span>
      <div style={{ width: 1, height: 16, background: "rgba(56,189,248,0.12)" }}/>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <HealthDot h={100}/><span style={{ fontSize: 10, color: "#22C55E" }}>{healthy} Healthy</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <HealthDot h={55}/><span style={{ fontSize: 10, color: "#FBBF24" }}>{warning} Warning</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <HealthDot h={20}/><span style={{ fontSize: 10, color: "#EF4444" }}>{critical} Critical</span>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 6px #22C55E", animation: "pulse-dot 1.4s infinite" }}/>
        <span style={{ fontSize: 9, color: "rgba(56,189,248,0.55)", fontFamily: "JetBrains Mono,monospace" }}>LIVE SIMULATION</span>
      </div>
    </div>
  );
}

export default function PlantView() {
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
        gridTemplateRows: "36px 44px 1fr",
        overflow: "hidden",
        background: "#0D1520",
      }}
    >
      {/* ROW 1 — Status bar */}
      <div style={{ gridRow: "1" }}>
        <StatusBar />
      </div>

      {/* ROW 2 — 3D Controls navbar */}
      <div style={{ gridRow: "2" }}>
        <Plant3DNavbar containerRef={containerRef} />
      </div>

      {/* ROW 3 — 3D Canvas + conditional equipment panel */}
      <div style={{
        gridRow: "3",
        overflow: "hidden",
        position: "relative",
        display: "grid",
        gridTemplateColumns: `1fr ${hasSelection ? "320px" : "0px"}`,
        transition: "grid-template-columns 0.28s ease",
      }}>
        <div style={{ overflow: "hidden", position: "relative" }}>
          <Plant3D onAssetSelect={handleAssetSelect} containerRef={containerRef} />
        </div>

        <AnimatePresence>
          {hasSelection && (
            <motion.div
              key="eq-status"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{
                overflow: "hidden",
                borderLeft: "1px solid rgba(56,189,248,0.18)",
                background: "rgba(6,10,20,0.97)",
              }}
            >
              <RightPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
