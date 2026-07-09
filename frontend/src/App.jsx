import { useState, useEffect, Suspense, lazy } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "./api";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import NotificationCenter from "./components/notifications/NotificationCenter";

// Lazy-load pages (keeps initial bundle lean)
const Dashboard          = lazy(() => import("./pages/Dashboard"));
const MissionControl     = lazy(() => import("./pages/MissionControl"));
const Assets             = lazy(() => import("./pages/Assets"));
const PredictiveMaintenance = lazy(() => import("./pages/PredictiveMaintenance"));
const Brownfield         = lazy(() => import("./pages/Brownfield"));
const AICopilot          = lazy(() => import("./pages/AICopilot"));
const KnowledgeGraph     = lazy(() => import("./pages/KnowledgeGraph"));
const Reports            = lazy(() => import("./pages/Reports"));

// Stub pages for sections not yet fully built
function DigitalTwin() {
  const Dashboard_ = lazy(() => import("./pages/Dashboard"));
  return <Dashboard_ />;
}
function ShutdownPlanner() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, color: "var(--text3)" }}>
      <span style={{ fontSize: 48 }}>🔒</span>
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text2)" }}>Shutdown Planner</div>
      <div style={{ fontSize: 12, color: "var(--text3)", maxWidth: 360, textAlign: "center", lineHeight: 1.7 }}>
        Use the <span style={{ color: "var(--cyan)" }}>AI Copilot</span> to generate step-by-step shutdown plans for any equipment.<br />
        Type: <em style={{ color: "var(--amber)" }}>"Create shutdown plan for P-101A"</em>
      </div>
    </motion.div>
  );
}
function Settings() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, color: "var(--text3)" }}>
      <span style={{ fontSize: 48 }}>⚙️</span>
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text2)" }}>Settings</div>
      <div style={{ fontSize: 12, color: "var(--text3)" }}>Configuration panel coming in next release.</div>
    </motion.div>
  );
}

const PAGE_MAP = {
  dashboard:   Dashboard,
  mission:     MissionControl,
  digitaltwin: Dashboard,
  assets:      Assets,
  predictive:  PredictiveMaintenance,
  brownfield:  Brownfield,
  knowledge:   KnowledgeGraph,
  copilot:     AICopilot,
  shutdown:    ShutdownPlanner,
  reports:     Reports,
  settings:    Settings,
};

function PageFallback() {
  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, color: "var(--text3)" }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <span style={{ fontSize: 12 }}>Loading module…</span>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    api.kpis().then(setKpis).catch(() => {});
    const t = setInterval(() => { api.kpis().then(setKpis).catch(() => {}); }, 30000);
    return () => clearInterval(t);
  }, []);

  // Global navigation channel — any component can fire window.dispatchEvent(new CustomEvent('app:navigate', { detail: 'pageName' }))
  useEffect(() => {
    const handler = (e) => setPage(e.detail);
    window.addEventListener("app:navigate", handler);
    return () => window.removeEventListener("app:navigate", handler);
  }, []);

  const PageComponent = PAGE_MAP[page] || Dashboard;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "220px 1fr",
      gridTemplateRows: "52px 1fr",
      height: "100vh",
      width: "100vw",
      overflow: "hidden",
      background: "var(--bg)",
    }}>
      {/* Sidebar spans full height */}
      <div style={{ gridRow: "1 / 3", borderRight: "1px solid var(--border)", overflow: "hidden" }}>
        <Sidebar page={page} setPage={setPage} kpis={kpis} />
      </div>

      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border)" }}>
        <Header page={page} kpis={kpis} />
      </div>

      {/* AI Notification Center — global overlay */}
      <NotificationCenter />

      {/* Main content */}
      <div style={{ overflow: "hidden", position: "relative" }}>
        <AnimatePresence>
          <motion.div key={page}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            style={{ height: "100%", width: "100%", overflow: "hidden", position: "absolute", inset: 0 }}>
            <Suspense fallback={<PageFallback />}>
              <PageComponent />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
