import { useState, useEffect } from "react";
import { useNotificationStore } from "../../store/notificationStore";

const PAGE_TITLES = {
  dashboard:   { title: "Dashboard", sub: "Plant Health Overview" },
  mission:     { title: "Mission Control", sub: "Real-Time Operations Center" },
  digitaltwin: { title: "Digital Twin", sub: "3D Asset Intelligence" },
  assets:      { title: "Asset Registry", sub: "Equipment Health & Status" },
  predictive:  { title: "Predictive Maintenance", sub: "AI Failure Forecasting" },
  brownfield:  { title: "Brownfield Modification", sub: "Change & Modification Planning" },
  knowledge:   { title: "Knowledge Center", sub: "Asset Intelligence Graph" },
  copilot:     { title: "AI Copilot", sub: "Conversational Plant Intelligence" },
  shutdown:    { title: "Shutdown Planner", sub: "Turnaround & Isolation Planning" },
  reports:     { title: "Reports", sub: "Analytics & Export" },
  settings:    { title: "Settings", sub: "Configuration" },
};

export default function Header({ page, kpis }) {
  const [time, setTime] = useState(new Date());
  const { openCenter, getUnread, getCritical } = useNotificationStore();
  const [unread, setUnread]         = useState(0);
  const [notifCritical, setNotifCritical] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Poll notification badge counts
  useEffect(() => {
    const refresh = () => { setUnread(getUnread()); setNotifCritical(getCritical()); };
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, [getUnread, getCritical]);

  const { title, sub } = PAGE_TITLES[page] || PAGE_TITLES.dashboard;
  const critical = kpis?.critical_assets || 0;
  const health = kpis?.avg_health_score || 0;

  return (
    <div className="header">
      <div>
        <div className="header-title">{title}</div>
        <div className="header-sub">{sub}</div>
      </div>
      <div className="header-spacer" />

      {kpis && (
        <>
          <div className="header-chip">
            <div className={`dot ${health >= 75 ? "green" : "red"}`} />
            <span>Health {health}%</span>
          </div>
          {critical > 0 && (
            <div className="header-chip">
              <div className="dot red" />
              <span>{critical} Critical</span>
            </div>
          )}
          <div className="header-chip">
            <div className="dot green" />
            <span>AI {kpis.ai_model_confidence_pct}% conf.</span>
          </div>
        </>
      )}

      {/* Notification bell */}
      <button
        onClick={openCenter}
        style={{
          position: "relative", padding: "5px 8px",
          background: notifCritical > 0 ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${notifCritical > 0 ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: 5, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
          color: "#8899BB", transition: "background 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(56,189,248,0.1)")}
        onMouseLeave={e => (e.currentTarget.style.background = notifCritical > 0 ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)")}
        title="Open AI Notification Center"
      >
        <span style={{ fontSize: 14, lineHeight: 1 }}>🔔</span>
        {unread > 0 && (
          <span style={{
            position: "absolute", top: -5, right: -5,
            minWidth: 16, height: 16, borderRadius: 8,
            background: notifCritical > 0 ? "#EF4444" : "#38BDF8",
            color: "#fff", fontSize: 9, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 3px", fontFamily: "var(--mono)",
            animation: notifCritical > 0 ? "pulse-dot 1.4s infinite" : "none",
            boxShadow: notifCritical > 0 ? "0 0 8px #EF4444" : "none",
          }}>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      <div className="header-chip">
        <span style={{ fontFamily: "var(--mono)", fontSize: 11 }}>
          {time.toLocaleTimeString("en-GB", { hour12: false })}
        </span>
      </div>
    </div>
  );
}
