import { motion } from "framer-motion";

const NAV = [
  { id: "dashboard",    icon: "⬡", label: "Dashboard",           section: "OVERVIEW" },
  { id: "mission",      icon: "🎯", label: "Mission Control",     section: null },
  { id: "digitaltwin", icon: "🔷", label: "Digital Twin",        section: "INTELLIGENCE" },
  { id: "assets",       icon: "⚙", label: "Assets",              section: null },
  { id: "predictive",   icon: "📈", label: "Predictive Maint.",  section: null, badge: true },
  { id: "brownfield",   icon: "🔧", label: "Brownfield Mod.",    section: "ENGINEERING" },
  { id: "knowledge",    icon: "🕸", label: "Knowledge Center",   section: null },
  { id: "copilot",      icon: "🤖", label: "AI Copilot",         section: "AI" },
  { id: "shutdown",     icon: "🛑", label: "Shutdown Planner",   section: "OPERATIONS" },
  { id: "reports",      icon: "📋", label: "Reports",             section: null },
  { id: "settings",     icon: "⚙", label: "Settings",            section: null },
];

export default function Sidebar({ page, setPage, kpis }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">🧠</div>
          <div>
            <div>PlantMind <span style={{ color: "var(--cyan)" }}>AI</span></div>
            <div className="logo-tagline">50 Years of Knowledge. One Intelligent Decision.</div>
          </div>
        </div>
      </div>

      {/* 3D Simulation launch button */}
      <motion.button
        onClick={() => setPage("digitaltwin")}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        style={{
          margin: "0 12px 4px",
          padding: "10px 12px",
          borderRadius: 8,
          cursor: "pointer",
          background: page === "digitaltwin"
            ? "rgba(56,189,248,0.18)"
            : "linear-gradient(135deg, rgba(37,99,235,0.10) 0%, rgba(56,189,248,0.08) 100%)",
          border: `1px solid ${page === "digitaltwin" ? "rgba(56,189,248,0.50)" : "rgba(56,189,248,0.22)"}`,
          display: "flex", alignItems: "center", gap: 10,
          textAlign: "left", width: "calc(100% - 24px)",
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>🔷</span>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--cyan)", letterSpacing: 0.3 }}>
            Open 3D Simulation
          </div>
          <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 2 }}>
            Interactive plant view
          </div>
        </div>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--cyan)", opacity: 0.7 }}>→</span>
      </motion.button>

      <nav className="sidebar-nav">
        {NAV.map((item) => (
          <div key={item.id}>
            {item.section && <div className="nav-section">{item.section}</div>}
            <motion.div
              className={`nav-item ${page === item.id ? "active" : ""}`}
              onClick={() => setPage(item.id)}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && kpis && kpis.predicted_failures_30d > 0 && (
                <span className="nav-badge">{kpis.predicted_failures_30d}</span>
              )}
            </motion.div>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="status-dot" />
        <div>
          <div style={{ fontWeight: 600, fontSize: 11, color: "var(--text)" }}>System Online</div>
          <div style={{ fontSize: 10, color: "var(--text3)" }}>FastAPI · ML Engine · Live</div>
        </div>
      </div>
    </div>
  );
}
