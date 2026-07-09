import { useCallback } from "react";
import { motion } from "framer-motion";
import Plant3D from "../components/plant/Plant3D";
import LeftPanel  from "../components/panels/LeftPanel";
import RightPanel from "../components/panels/RightPanel";
import BottomPanel from "../components/panels/BottomPanel";
import { usePlantStore } from "../store/plantStore";
import { useSensorSimulation } from "../hooks/useSensorSimulation";

export default function Dashboard() {
  // Start real-time sensor simulation
  useSensorSimulation();

  const { selectedAsset, setSelected } = usePlantStore();

  const handleAssetSelect = useCallback((eq) => {
    setSelected(eq);
  }, [setSelected]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        height: "100%",
        display: "grid",
        gridTemplateColumns: "215px 1fr 285px",
        gridTemplateRows: "1fr 185px",
        overflow: "hidden",
        background: "#000A18",
      }}
    >
      {/* LEFT PANEL — spans both rows */}
      <div style={{ gridRow: "1 / 3", overflow: "hidden" }}>
        <LeftPanel/>
      </div>

      {/* 3D REFINERY CENTER */}
      <div style={{ gridRow: "1", overflow: "hidden", position: "relative" }}>
        <Plant3D onAssetSelect={handleAssetSelect}/>
      </div>

      {/* RIGHT PANEL — spans both rows */}
      <div style={{ gridRow: "1 / 3", overflow: "hidden" }}>
        <RightPanel/>
      </div>

      {/* BOTTOM PANEL — center column only */}
      <div style={{ gridRow: "2", gridColumn: "2", overflow: "hidden" }}>
        <BottomPanel/>
      </div>
    </motion.div>
  );
}
