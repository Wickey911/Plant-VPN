/**
 * NotificationCenter.jsx
 * AI Notification Center — SpaceX Mission Control style
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useNotificationStore,
  ESCALATION_CHAIN,
  ENGINEERS,
  computeEscalationLevel,
} from "../../store/notificationStore";
import { EQUIPMENT } from "../../data/equipmentData";

// ─── Palette ──────────────────────────────────────────────────────────────────
const P = {
  Critical:    "#EF4444",
  High:        "#FBBF24",
  Medium:      "#38BDF8",
  Information: "#94A3B8",
  Success:     "#22C55E",
};

const CHANNEL_META = {
  email:     { label: "Email",     icon: "✉" },
  push:      { label: "Push",      icon: "📱" },
  teams:     { label: "Teams",     icon: "💬" },
  dashboard: { label: "Dashboard", icon: "⬡" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtAge(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1)   return "just now";
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}m ago` : `${h}h ago`;
}
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString("en-GB", { hour12: false, hour: "2-digit", minute: "2-digit" });
}
function fmtDate(ts) {
  return new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Priority pill ────────────────────────────────────────────────────────────
function PriorityDot({ p, size = 7 }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size,
      borderRadius: "50%", background: P[p] || "#666",
      flexShrink: 0,
      boxShadow: (p === "Critical") ? `0 0 6px ${P.Critical}` : "none",
      animation: (p === "Critical") ? "pulse-dot 1.4s infinite" : "none",
    }} />
  );
}

// ─── Notification card ────────────────────────────────────────────────────────
function NotifCard({ notif, selected, onClick }) {
  const now = Date.now();
  const escLv = computeEscalationLevel(notif, now);
  const age = fmtAge(notif.timestamp);
  const accent = P[notif.priority] || "#666";
  const isSelected = selected === notif.id;

  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 2 }}
      style={{
        display: "flex", gap: 10, padding: "10px 12px",
        borderLeft: `2.5px solid ${accent}`,
        background: isSelected ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.02)",
        cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)",
        opacity: notif.acknowledged ? 0.6 : 1,
        transition: "background 0.12s",
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.045)"; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
    >
      <div style={{ marginTop: 3, flexShrink: 0 }}>
        <PriorityDot p={notif.priority} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Row 1 — priority + area + age */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: 0.8 }}>
            {notif.priority}
          </span>
          {notif.area !== "All" && (
            <span style={{ fontSize: 9, color: "#4A5878", fontFamily: "var(--mono)" }}>{notif.area}</span>
          )}
          {!notif.read && (
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: accent, flexShrink: 0 }} />
          )}
          <span style={{ marginLeft: "auto", fontSize: 9, color: "#4A5878", whiteSpace: "nowrap" }}>{age}</span>
        </div>
        {/* Row 2 — title */}
        <div style={{ fontSize: 11, fontWeight: 600, color: "#C8D4E8", lineHeight: 1.3, marginBottom: 4,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {notif.title}
        </div>
        {/* Row 3 — status badges */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {notif.acknowledged && (
            <span style={{ fontSize: 8.5, color: "#22C55E", background: "rgba(34,197,94,0.1)",
              padding: "1px 6px", borderRadius: 3 }}>✓ ACK</span>
          )}
          {notif.assignedTo && (
            <span style={{ fontSize: 8.5, color: "#38BDF8", background: "rgba(56,189,248,0.1)",
              padding: "1px 6px", borderRadius: 3 }}>
              → {notif.assignedTo.split(" — ")[0]}
            </span>
          )}
          {notif.convertedToWO && (
            <span style={{ fontSize: 8.5, color: "#FBBF24", background: "rgba(251,191,36,0.1)",
              padding: "1px 6px", borderRadius: 3 }}>⚙ {notif.woId}</span>
          )}
          {notif.deferred && (
            <span style={{ fontSize: 8.5, color: "#94A3B8", background: "rgba(148,163,184,0.1)",
              padding: "1px 6px", borderRadius: 3 }}>⏰ Deferred</span>
          )}
          {!notif.acknowledged && escLv > 0 && (
            <span style={{ fontSize: 8.5, color: "#EF4444", background: "rgba(239,68,68,0.1)",
              padding: "1px 6px", borderRadius: 3 }}>
              ⬆ {ESCALATION_CHAIN[escLv]?.role}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Escalation timeline ──────────────────────────────────────────────────────
function EscalationTimeline({ notif }) {
  const now = Date.now();
  const elapsedMin = (now - notif.timestamp) / 60000;
  const chain = notif.priority === "Critical"
    ? ESCALATION_CHAIN
    : ESCALATION_CHAIN.filter(s => s.level < 5);

  return (
    <div>
      <div style={{ fontSize: 9, color: "#4A5878", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        Escalation Timeline
      </div>
      {chain.map((step, i) => {
        const reached = notif.acknowledged ? false : (
          step.level === 0 ? true : elapsedMin >= step.delayMin
        );
        const isCurrent = !notif.acknowledged && (
          i === chain.length - 1
            ? reached
            : (reached && (elapsedMin < chain[i + 1]?.delayMin))
        );
        const color = notif.acknowledged ? "#4A5878"
          : isCurrent ? P[notif.priority]
          : reached ? "#6B8099"
          : "#2A3448";

        return (
          <div key={step.level} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
            {/* Node + connector */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", marginTop: 2,
                background: reached && !notif.acknowledged ? (isCurrent ? P[notif.priority] : "#4A6080") : "#1E2A3A",
                border: `1.5px solid ${color}`,
                boxShadow: isCurrent ? `0 0 8px ${P[notif.priority]}` : "none",
              }} />
              {i < chain.length - 1 && (
                <div style={{ width: 1, height: 14, background: reached && !notif.acknowledged ? "#2A3A52" : "#1A2230", marginTop: 2 }} />
              )}
            </div>
            {/* Label */}
            <div style={{ flex: 1, paddingBottom: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: reached && !notif.acknowledged ? "#C8D4E8" : "#4A5878", fontWeight: isCurrent ? 600 : 400 }}>
                  {step.role}
                </span>
                <span style={{ fontSize: 9, color: "#3A4860", fontFamily: "var(--mono)" }}>
                  {step.level === 0 ? "Now" : step.level === 5 ? "Immed." : `+${step.delayMin}m`}
                </span>
              </div>
              {isCurrent && !notif.acknowledged && (
                <div style={{ fontSize: 9, color: P[notif.priority], marginTop: 1 }}>↳ Currently escalated</div>
              )}
            </div>
          </div>
        );
      })}
      {notif.acknowledged && (
        <div style={{ fontSize: 9, color: "#22C55E", marginTop: 4 }}>
          ✓ Acknowledged by {notif.acknowledgedBy} · {fmtTime(notif.acknowledgedAt)}
        </div>
      )}
    </div>
  );
}

// ─── Channel delivery badges ──────────────────────────────────────────────────
function ChannelRow({ channels }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: "#4A5878", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
        Delivery Channels
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {Object.entries(CHANNEL_META).map(([key, meta]) => {
          const active = channels.includes(key);
          return (
            <div key={key} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 8px", borderRadius: 4,
              background: active ? "rgba(56,189,248,0.08)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${active ? "rgba(56,189,248,0.2)" : "rgba(255,255,255,0.06)"}`,
              opacity: active ? 1 : 0.35,
            }}>
              <span style={{ fontSize: 11 }}>{meta.icon}</span>
              <span style={{ fontSize: 9, color: active ? "#38BDF8" : "#4A5878" }}>{meta.label}</span>
              {active && <span style={{ fontSize: 8, color: "#22C55E" }}>✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Action panel ─────────────────────────────────────────────────────────────
function ActionPanel({ notif }) {
  const { acknowledge, assignTo, defer, convertToWO } = useNotificationStore();
  const [showAssign, setShowAssign] = useState(false);
  const [showDefer, setShowDefer]   = useState(false);
  const [woCreated, setWoCreated]   = useState(notif.woId || null);

  const handleConvert = () => {
    const id = convertToWO(notif.id);
    setWoCreated(id);
  };

  const btnBase = {
    display: "flex", alignItems: "center", gap: 7,
    padding: "8px 12px", borderRadius: 4, border: "1px solid",
    cursor: "pointer", fontSize: 11, fontWeight: 600,
    background: "transparent", width: "100%", textAlign: "left",
    transition: "background 0.12s",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 9, color: "#4A5878", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>
        Actions
      </div>

      {/* Acknowledge */}
      <button
        onClick={() => acknowledge(notif.id)}
        disabled={notif.acknowledged}
        style={{ ...btnBase,
          borderColor: notif.acknowledged ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.4)",
          color: notif.acknowledged ? "#22C55E" : "#22C55E",
          opacity: notif.acknowledged ? 0.5 : 1,
        }}
        onMouseEnter={e => !notif.acknowledged && (e.currentTarget.style.background = "rgba(34,197,94,0.08)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <span>✓</span> {notif.acknowledged ? `Acknowledged — ${notif.acknowledgedBy}` : "Acknowledge Alert"}
      </button>

      {/* Assign */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => { setShowAssign(v => !v); setShowDefer(false); }}
          style={{ ...btnBase,
            borderColor: notif.assignedTo ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.1)",
            color: notif.assignedTo ? "#38BDF8" : "#8899BB",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(56,189,248,0.06)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <span>◎</span>
          {notif.assignedTo ? `Assigned — ${notif.assignedTo.split(" — ")[0]}` : "Assign to Engineer"}
        </button>
        <AnimatePresence>
          {showAssign && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              style={{
                position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
                background: "#0D1422", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 4, overflow: "hidden", marginTop: 2,
              }}
            >
              {ENGINEERS.map(eng => (
                <button key={eng}
                  onClick={() => { assignTo(notif.id, eng); setShowAssign(false); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px",
                    background: "none", border: "none", color: "#8899BB", fontSize: 10.5,
                    cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(56,189,248,0.08)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}
                >
                  {eng}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Defer */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => { setShowDefer(v => !v); setShowAssign(false); }}
          style={{ ...btnBase,
            borderColor: notif.deferred ? "rgba(148,163,184,0.3)" : "rgba(255,255,255,0.1)",
            color: notif.deferred ? "#94A3B8" : "#8899BB",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(148,163,184,0.06)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <span>⏰</span>
          {notif.deferred
            ? `Deferred — ${new Date(notif.deferredUntil).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}`
            : "Defer Notification"}
        </button>
        <AnimatePresence>
          {showDefer && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              style={{
                position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
                background: "#0D1422", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 4, overflow: "hidden", marginTop: 2,
              }}
            >
              {[[2,"2 Hours"],[4,"4 Hours"],[8,"8 Hours"],[24,"24 Hours"]].map(([h, label]) => (
                <button key={h}
                  onClick={() => { defer(notif.id, h); setShowDefer(false); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px",
                    background: "none", border: "none", color: "#8899BB", fontSize: 10.5,
                    cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(148,163,184,0.08)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}
                >
                  Defer {label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Convert to WO */}
      <button
        onClick={handleConvert}
        disabled={!!notif.convertedToWO}
        style={{ ...btnBase,
          borderColor: notif.convertedToWO ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.1)",
          color: notif.convertedToWO ? "#FBBF24" : "#8899BB",
          opacity: notif.convertedToWO ? 0.7 : 1,
        }}
        onMouseEnter={e => !notif.convertedToWO && (e.currentTarget.style.background = "rgba(251,191,36,0.06)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <span>⚙</span>
        {notif.convertedToWO ? `Work Order Created — ${woCreated}` : "Convert to Work Order"}
      </button>
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
function DetailPanel({ notifId }) {
  const { notifications } = useNotificationStore();
  const notif = notifications.find(n => n.id === notifId);
  const eq = notif?.assetId ? EQUIPMENT.find(e => e.id === notif.assetId) : null;

  if (!notif) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", color: "#2A3448", textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>◎</div>
        <div style={{ fontSize: 12, color: "#3A4860" }}>Select a notification to view details</div>
      </div>
    );
  }

  const accent = P[notif.priority];

  return (
    <motion.div key={notifId} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
      style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Header */}
      <div style={{ borderLeft: `3px solid ${accent}`, paddingLeft: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
          <PriorityDot p={notif.priority} size={8} />
          <span style={{ fontSize: 10, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: 0.8 }}>
            {notif.priority}
          </span>
          <span style={{ fontSize: 9, color: "#3A4860", marginLeft: "auto" }}>{fmtDate(notif.timestamp)} · {fmtTime(notif.timestamp)}</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#E8F0FF", lineHeight: 1.35, marginBottom: 4 }}>{notif.title}</div>
        {notif.assetId && (
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ fontSize: 10, color: "#38BDF8", fontFamily: "var(--mono)", fontWeight: 600 }}>{notif.assetId}</span>
            {notif.area && <span style={{ fontSize: 10, color: "#4A5878" }}>{notif.area}</span>}
            {eq && <span style={{ fontSize: 10, color: "#4A5878" }}>· {eq.criticality} criticality</span>}
          </div>
        )}
      </div>

      {/* Message */}
      <div>
        <div style={{ fontSize: 9, color: "#4A5878", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Message</div>
        <div style={{ fontSize: 11, color: "#8899BB", lineHeight: 1.65 }}>{notif.message}</div>
      </div>

      {/* Asset quick stats */}
      {eq && (
        <div style={{ background: "rgba(255,255,255,0.025)", borderRadius: 5, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 9, color: "#4A5878", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Asset Status</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
            {[
              ["Health", `${eq.health}%`, eq.health < 40 ? P.Critical : eq.health < 70 ? P.High : P.Success],
              ["Service", eq.service, "#8899BB"],
              ["Criticality", eq.criticality, "#8899BB"],
              ["Manufacturer", eq.manufacturer, "#8899BB"],
            ].map(([k, v, c]) => (
              <div key={k}>
                <div style={{ fontSize: 8.5, color: "#3A4860", marginBottom: 1 }}>{k}</div>
                <div style={{ fontSize: 10.5, color: c, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Escalation */}
      {["Critical","High","Medium"].includes(notif.priority) && (
        <EscalationTimeline notif={notif} />
      )}

      {/* Channels */}
      <ChannelRow channels={notif.channels} />

      {/* Actions */}
      <ActionPanel notif={notif} />

      {/* History */}
      <div>
        <div style={{ fontSize: 9, color: "#4A5878", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>History</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <HistoryRow time={notif.timestamp} event={`Notification generated by PlantMind AI`} />
          {notif.channels.filter(c => c !== "dashboard").map(ch => (
            <HistoryRow key={ch} time={notif.timestamp + 2000} event={`${CHANNEL_META[ch]?.label} delivered`} success />
          ))}
          {notif.acknowledged && (
            <HistoryRow time={notif.acknowledgedAt} event={`Acknowledged by ${notif.acknowledgedBy}`} success />
          )}
          {notif.assignedTo && (
            <HistoryRow time={notif.acknowledgedAt || notif.timestamp + 60000} event={`Assigned to ${notif.assignedTo}`} success />
          )}
          {notif.convertedToWO && (
            <HistoryRow time={Date.now()} event={`Work order ${notif.woId} created in CMMS`} success />
          )}
          {notif.deferred && (
            <HistoryRow time={Date.now()} event={`Deferred until ${new Date(notif.deferredUntil).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}`} />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function HistoryRow({ time, event, success }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <span style={{ fontSize: 9, color: success ? "#22C55E" : "#3A4860", fontFamily: "var(--mono)", flexShrink: 0, marginTop: 1 }}>
        {fmtTime(time)}
      </span>
      <span style={{ fontSize: 10, color: "#56657A" }}>{event}</span>
    </div>
  );
}

// ─── Report preview modal ─────────────────────────────────────────────────────
function ReportModal({ type, onClose }) {
  const now = new Date();
  const crit = EQUIPMENT.filter(e => e.health < 40);
  const high = EQUIPMENT.filter(e => e.health >= 40 && e.health < 55);
  const med  = EQUIPMENT.filter(e => e.health >= 55 && e.health < 70);
  const good = EQUIPMENT.filter(e => e.health >= 80);
  const avgH = (EQUIPMENT.reduce((s, e) => s + e.health, 0) / EQUIPMENT.length).toFixed(1);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
      <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: 560, maxHeight: "80vh", overflowY: "auto",
          background: "#07090F", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 6, padding: 24,
        }}>

        {/* Report header */}
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: "#4A5878", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>
            PlantMind AI · Predictive Maintenance
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#E8F0FF" }}>
            {type === "daily" ? "Daily" : type === "weekly" ? "Weekly" : "Monthly"} Maintenance Report
          </div>
          <div style={{ fontSize: 11, color: "#4A5878", marginTop: 4 }}>
            Generated: {now.toLocaleDateString("en-GB", { weekday:"long", day:"2-digit", month:"long", year:"numeric" })} · {now.toLocaleTimeString("en-GB",{hour12:false})}
          </div>
        </div>

        {/* Executive summary */}
        <Section label="Executive Summary">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 12 }}>
            {[
              ["Critical",  crit.length, P.Critical],
              ["High Risk", high.length, P.High],
              ["Advisory",  med.length,  P.Medium],
              ["Healthy",   good.length, P.Success],
            ].map(([l, v, c]) => (
              <div key={l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 4,
                padding: "10px 8px", textAlign: "center", borderTop: `2px solid ${c}` }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: c, fontFamily: "var(--mono)" }}>{v}</div>
                <div style={{ fontSize: 9, color: "#4A5878", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
          <Row label="Total Equipment"     value={`${EQUIPMENT.length} assets`} />
          <Row label="Average Plant Health" value={`${avgH}%`} color={avgH > 75 ? P.Success : P.High} />
          <Row label="AI Confidence"        value="94.2%" color={P.Success} />
        </Section>

        {/* Critical assets */}
        {crit.length > 0 && (
          <Section label="Critical Assets — Immediate Action Required">
            {crit.map(eq => (
              <div key={eq.id} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 11, color: "#38BDF8", fontFamily: "var(--mono)", fontWeight: 600 }}>{eq.id}</span>
                  <span style={{ fontSize: 10, color: P.Critical, fontFamily: "var(--mono)" }}>{eq.health}%</span>
                </div>
                <div style={{ fontSize: 10, color: "#8899BB" }}>{eq.name} · {eq.area}</div>
              </div>
            ))}
          </Section>
        )}

        {/* High risk */}
        {high.length > 0 && (
          <Section label="High Risk — Schedule Within 24 Hours">
            {high.map(eq => (
              <Row key={eq.id} label={`${eq.id} — ${eq.name}`} value={`${eq.health}%`} color={P.High} mono />
            ))}
          </Section>
        )}

        {/* AI Recommendations */}
        <Section label="AI Recommendations">
          <RecoRow n={1} text={`Immediate inspection of ${crit.map(e=>e.id).join(", ")} — critical health threshold breached.`} />
          <RecoRow n={2} text={`Schedule vibration analysis for ${high.slice(0,2).map(e=>e.id).join(", ")} within 24 hours.`} />
          <RecoRow n={3} text={`Pre-order spare parts for high-criticality pumps in CDU area.`} />
          <RecoRow n={4} text={`Review corrosion inhibitor dosing for storage tanks with health < 70%.`} />
        </Section>

        {/* Report schedule */}
        <Section label="Delivery Configuration">
          <Row label="Recipients"    value="Maintenance Manager, Area Managers, Shift Supervisors" />
          <Row label="Channels"      value="Email · Microsoft Teams · Dashboard" />
          <Row label="Next Daily"    value={`Tomorrow · 06:00`} />
          <Row label="Next Weekly"   value="Monday · 06:00" />
          <Row label="Next Monthly"  value={`01 ${new Date(now.getFullYear(), now.getMonth()+1,1).toLocaleString("en-GB",{month:"long"})} · 06:00`} />
        </Section>

        <button onClick={onClose}
          style={{ width: "100%", marginTop: 4, padding: "10px", background: "rgba(56,189,248,0.1)",
            border: "1px solid rgba(56,189,248,0.2)", borderRadius: 4, color: "#38BDF8",
            cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
          Close Report
        </button>
      </motion.div>
    </motion.div>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 9, color: "#4A5878", textTransform: "uppercase", letterSpacing: 1,
        borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 5, marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}
function Row({ label, value, color, mono }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0",
      borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 10.5 }}>
      <span style={{ color: "#56657A" }}>{label}</span>
      <span style={{ color: color || "#C8D4E8", fontFamily: mono ? "var(--mono)" : undefined, fontWeight: 600 }}>{value}</span>
    </div>
  );
}
function RecoRow({ n, text }) {
  return (
    <div style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span style={{ fontSize: 9, color: "#38BDF8", fontFamily: "var(--mono)", flexShrink: 0, marginTop: 1 }}>{n}.</span>
      <span style={{ fontSize: 10.5, color: "#8899BB", lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

// ─── Main notification center ─────────────────────────────────────────────────
export default function NotificationCenter() {
  const {
    notifications, isOpen, closeCenter,
    selectedId, selectNotif,
    priorityFilter, setPriorityFilter,
    areaFilter, setAreaFilter,
    statusFilter, setStatusFilter,
  } = useNotificationStore();

  const [reportType, setReportType] = useState(null);
  const [tick, setTick] = useState(0);

  // Tick every minute so escalation timelines stay live
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 60000);
    return () => clearInterval(t);
  }, []);

  // Close on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") closeCenter(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [closeCenter]);

  const areas = ["All", ...new Set(
    EQUIPMENT.map(e => e.area).filter(Boolean).sort()
  )];

  const filtered = notifications.filter(n => {
    const pf = priorityFilter === "All" || n.priority === priorityFilter;
    const af = areaFilter === "All" || n.area === areaFilter;
    const sf = statusFilter === "All"
      || (statusFilter === "Unread" && !n.read)
      || (statusFilter === "Acknowledged" && n.acknowledged)
      || (statusFilter === "Escalated" && !n.acknowledged && computeEscalationLevel(n) > 0);
    return pf && af && sf;
  });

  const counts = {
    All:         notifications.length,
    Critical:    notifications.filter(n => n.priority === "Critical").length,
    High:        notifications.filter(n => n.priority === "High").length,
    Medium:      notifications.filter(n => n.priority === "Medium").length,
    Information: notifications.filter(n => n.priority === "Information").length,
    Success:     notifications.filter(n => n.priority === "Success").length,
  };
  const unread = notifications.filter(n => !n.read).length;
  const criticalUnacked = notifications.filter(n => n.priority === "Critical" && !n.acknowledged).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeCenter}
          style={{
            position: "fixed", inset: 0, zIndex: 8000,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={e => e.stopPropagation()}
            style={{
              width: "92vw", maxWidth: 1180, height: "88vh",
              background: "#07090F",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              display: "flex", flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* ── Header bar ── */}
            <div style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "12px 18px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              flexShrink: 0,
              background: "rgba(255,255,255,0.02)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 4,
                  background: criticalUnacked > 0 ? "rgba(239,68,68,0.15)" : "rgba(56,189,248,0.1)",
                  border: `1px solid ${criticalUnacked > 0 ? "rgba(239,68,68,0.3)" : "rgba(56,189,248,0.2)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                }}>🔔</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#E8F0FF" }}>AI Notification Center</div>
                  <div style={{ fontSize: 9, color: "#3A4860" }}>PlantMind AI · Real-time alert management</div>
                </div>
              </div>

              {/* Summary chips */}
              <div style={{ display: "flex", gap: 8, marginLeft: 8 }}>
                {criticalUnacked > 0 && (
                  <Chip label={`${criticalUnacked} Critical Unacknowledged`} color={P.Critical} />
                )}
                <Chip label={`${unread} Unread`} color={unread > 0 ? "#38BDF8" : "#3A4860"} />
                <Chip label={`${notifications.length} Total`} color="#3A4860" />
              </div>

              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                {/* Report buttons */}
                {[["daily","Daily"], ["weekly","Weekly"], ["monthly","Monthly"]].map(([t,l]) => (
                  <button key={t} onClick={() => setReportType(t)}
                    style={{ padding: "5px 10px", background: "rgba(56,189,248,0.06)",
                      border: "1px solid rgba(56,189,248,0.15)", borderRadius: 4,
                      color: "#38BDF8", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>
                    ↓ {l} Report
                  </button>
                ))}
                <button onClick={closeCenter}
                  style={{ padding: "5px 10px", background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4,
                    color: "#4A5878", fontSize: 11, cursor: "pointer" }}>✕</button>
              </div>
            </div>

            {/* ── Filter bar ── */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 18px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              flexShrink: 0, flexWrap: "wrap",
            }}>
              {/* Priority tabs */}
              <div style={{ display: "flex", gap: 4 }}>
                {Object.entries(counts).map(([p, cnt]) => (
                  <button key={p} onClick={() => setPriorityFilter(p)}
                    style={{
                      padding: "4px 10px", borderRadius: 4, fontSize: 10, fontWeight: 600,
                      cursor: "pointer", border: "1px solid",
                      borderColor: priorityFilter === p
                        ? (P[p] || "rgba(56,189,248,0.4)")
                        : "rgba(255,255,255,0.07)",
                      background: priorityFilter === p
                        ? `${P[p] || "#38BDF8"}15`
                        : "transparent",
                      color: priorityFilter === p
                        ? (P[p] || "#38BDF8")
                        : "#4A5878",
                      display: "flex", alignItems: "center", gap: 5,
                    }}>
                    {p !== "All" && <PriorityDot p={p} size={5} />}
                    {p}
                    <span style={{ fontFamily: "var(--mono)", fontSize: 9 }}>{cnt}</span>
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
                {/* Area filter */}
                <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)}
                  style={{ padding: "4px 8px", background: "#0D1422", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#8899BB", borderRadius: 4, fontSize: 10, cursor: "pointer" }}>
                  {areas.map(a => <option key={a}>{a}</option>)}
                </select>
                {/* Status filter */}
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  style={{ padding: "4px 8px", background: "#0D1422", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#8899BB", borderRadius: 4, fontSize: 10, cursor: "pointer" }}>
                  {["All","Unread","Acknowledged","Escalated"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* ── Main content ── */}
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "340px 1fr", overflow: "hidden" }}>

              {/* Left — notification list */}
              <div style={{ borderRight: "1px solid rgba(255,255,255,0.07)", overflowY: "auto" }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "#2A3448", fontSize: 11 }}>
                    No notifications match the current filter.
                  </div>
                ) : (
                  filtered.map(n => (
                    <NotifCard key={n.id} notif={n} selected={selectedId}
                      onClick={() => selectNotif(n.id)} />
                  ))
                )}
              </div>

              {/* Right — detail */}
              <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <DetailPanel notifId={selectedId} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Report modal */}
      {reportType && (
        <ReportModal key={reportType} type={reportType} onClose={() => setReportType(null)} />
      )}
    </AnimatePresence>
  );
}

function Chip({ label, color }) {
  return (
    <div style={{
      padding: "3px 8px", borderRadius: 3,
      background: `${color}12`, border: `1px solid ${color}28`,
      fontSize: 9, color, fontWeight: 600, whiteSpace: "nowrap",
    }}>{label}</div>
  );
}
