import { useState, useCallback, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { motion } from "framer-motion";
import BoilerScene from "../components/boiler/BoilerScene";
import BoilerAssetPanel from "../components/boiler/BoilerAssetPanel";
import { BOILER_EQUIPMENT } from "../data/boilerData";

function healthColor(h) {
  if (h > 90) return "#00FF94";
  if (h > 75) return "#90EE90";
  if (h > 60) return "#FFD700";
  if (h > 40) return "#FF6600";
  return "#FF2D55";
}

function HealthLegend() {
  return (
    <div style={{
      position: "absolute", bottom: 12, left: 12,
      background: "rgba(5,10,18,0.85)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 6, padding: "6px 10px", display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div style={{ fontSize: 8, color: "#4a6070", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>Health Status</div>
      {[
        [">90%", "#00FF94"], [">75%", "#90EE90"], [">60%", "#FFD700"], [">40%", "#FF6600"], ["≤40%", "#FF2D55"]
      ].map(([l, c]) => (
        <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: c, boxShadow: `0 0 4px ${c}` }} />
          <span style={{ color: "#8899aa" }}>{l}</span>
        </div>
      ))}
    </div>
  );
}

function AssetList({ selected, onSelect }) {
  const [filter, setFilter] = useState("all");
  const filtered = BOILER_EQUIPMENT.filter(e =>
    filter === "all" ? true :
    filter === "critical" ? e.health < 60 :
    filter === "warning" ? (e.health >= 60 && e.health < 80) : e.health >= 80
  );

  return (
    <div style={{
      position: "absolute", top: 12, left: 12, bottom: 12,
      width: 180, background: "rgba(5,10,18,0.92)",
      border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8,
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      <div style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{ fontSize: 9, color: "#4a6070", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Boiler Assets</div>
        <div style={{ display: "flex", gap: 3 }}>
          {["all", "critical", "warning", "ok"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              flex: 1, padding: "3px 0", border: "none", borderRadius: 3,
              background: filter === f ? "rgba(0,200,240,0.15)" : "rgba(255,255,255,0.04)",
              color: filter === f ? "#00C8F0" : "#4a6070", fontSize: 7,
              cursor: "pointer", textTransform: "capitalize",
            }}>{f}</button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {filtered.map(eq => {
          const hc = healthColor(eq.health);
          const isSel = selected?.id === eq.id;
          return (
            <div key={eq.id} onClick={() => onSelect(eq)} style={{
              padding: "6px 10px", cursor: "pointer",
              background: isSel ? "rgba(0,200,240,0.08)" : "transparent",
              borderLeft: isSel ? "2px solid #00C8F0" : "2px solid transparent",
              borderBottom: "1px solid rgba(255,255,255,0.03)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: hc, boxShadow: `0 0 4px ${hc}`, flexShrink: 0 }} />
                <span style={{ fontSize: 9, color: "#00C8F0", fontFamily: "monospace", fontWeight: 700 }}>{eq.id}</span>
                <span style={{ fontSize: 9, color: hc, marginLeft: "auto" }}>{eq.health}%</span>
              </div>
              <div style={{ fontSize: 9, color: "#5a7080", marginTop: 1, fontSize: 8, paddingLeft: 12 }}>{eq.name.substring(0, 22)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatsBar() {
  const total = BOILER_EQUIPMENT.length;
  const critical = BOILER_EQUIPMENT.filter(e => e.health < 60).length;
  const warning = BOILER_EQUIPMENT.filter(e => e.health >= 60 && e.health < 80).length;
  const ok = BOILER_EQUIPMENT.filter(e => e.health >= 80).length;
  const avgH = Math.round(BOILER_EQUIPMENT.reduce((s, e) => s + e.health, 0) / total);
  return (
    <div style={{
      position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
      background: "rgba(5,10,18,0.88)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 8, padding: "6px 16px", display: "flex", gap: 20, alignItems: "center",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#00C8F0" }}>{total}</div>
        <div style={{ fontSize: 7, color: "#4a6070", textTransform: "uppercase" }}>Assets</div>
      </div>
      <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.07)" }} />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#FF2D55" }}>{critical}</div>
        <div style={{ fontSize: 7, color: "#4a6070", textTransform: "uppercase" }}>Critical</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#FF9500" }}>{warning}</div>
        <div style={{ fontSize: 7, color: "#4a6070", textTransform: "uppercase" }}>Warning</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#00FF94" }}>{ok}</div>
        <div style={{ fontSize: 7, color: "#4a6070", textTransform: "uppercase" }}>Healthy</div>
      </div>
      <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.07)" }} />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: healthColor(avgH) }}>{avgH}%</div>
        <div style={{ fontSize: 7, color: "#4a6070", textTransform: "uppercase" }}>Avg Health</div>
      </div>
    </div>
  );
}

export default function BoilerTwin() {
  const [selected, setSelected] = useState(null);

  const handleSelect = useCallback((eq) => {
    setSelected(prev => prev?.id === eq.id ? null : eq);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ height: "100%", display: "flex", overflow: "hidden", background: "#020810" }}>

      {/* 3D Canvas */}
      <div style={{ flex: 1, position: "relative" }}>
        <Canvas
          camera={{ position: [25, 22, 30], fov: 50, near: 0.1, far: 500 }}
          shadows
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.85,
          }}
          onPointerMissed={() => setSelected(null)}
        >
          <Suspense fallback={null}>
            <BoilerScene onSelect={handleSelect} />
            <EffectComposer>
              <Bloom intensity={0.9} luminanceThreshold={0.7} luminanceSmoothing={0.4} mipmapBlur />
              <Vignette darkness={0.5} offset={0.4} />
            </EffectComposer>
          </Suspense>
        </Canvas>

        {/* Overlays */}
        <AssetList selected={selected} onSelect={setSelected} />
        <StatsBar />
        <HealthLegend />

        {/* Title badge */}
        <div style={{
          position: "absolute", bottom: 12, right: 12,
          background: "rgba(5,10,18,0.85)", border: "1px solid rgba(0,200,240,0.2)",
          borderRadius: 6, padding: "5px 10px",
        }}>
          <div style={{ fontSize: 9, color: "#00C8F0", fontWeight: 700, letterSpacing: 0.5 }}>WATER TUBE BOILER DIGITAL TWIN</div>
          <div style={{ fontSize: 7, color: "#3a5060", marginTop: 1 }}>Engineering Grade · 16 Primary Assets · AVEVA E3D Standard</div>
        </div>
      </div>

      {/* Right Panel */}
      <BoilerAssetPanel asset={selected} />
    </motion.div>
  );
}
