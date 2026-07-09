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
