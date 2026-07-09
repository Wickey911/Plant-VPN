import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "../api";

function riskBadge(r) {
  const m = { Critical: "badge-critical", High: "badge-high", Medium: "badge-medium", Low: "badge-low" };
  return `badge ${m[r] || "badge-cyan"}`;
}

export default function MissionControl() {
  const [data, setData] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const load = () => api.missionSummary().then(setData).catch(() => {});
    load();
    const iv = setInterval(() => { load(); setTick(t => t + 1); }, 8000);
    return () => clearInterval(iv);
  }, []);

  if (!data) return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="spin-wrap"><div className="spinner" /><span>Loading Mission Control…</span></div>
    </div>
  );

  const statusColor = data.plant_status === "NORMAL" ? "var(--emerald)" : "var(--amber)";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ height: "100%", display: "flex", flexDirection: "column", gap: 10, padding: 12, overflow: "hidden" }}>

      {/* Banner */}
      <div className="mc-banner">
        <div>
          <div className="mc-status-label">Plant Status</div>
          <div className="mc-status-val" style={{ color: statusColor,
            textShadow: `0 0 30px ${statusColor}` }}>
            {data.plant_status}
          </div>
        </div>
        <div style={{ width: 1, height: 40, background: "var(--border)" }} />
        <div>
          <div className="mc-status-label">Overall Health</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--cyan)" }}>{data.overall_health}%</div>
        </div>
        <div style={{ width: 1, height: 40, background: "var(--border)" }} />
        <div>
          <div className="mc-status-label">Active Alarms</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: data.active_alarms > 0 ? "var(--red)" : "var(--emerald)" }}>
            {data.active_alarms}
          </div>
        </div>
        <div style={{ width: 1, height: 40, background: "var(--border)" }} />
        <div>
          <div className="mc-status-label">Critical Assets</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: data.critical_count > 0 ? "var(--amber)" : "var(--emerald)" }}>
            {data.critical_count}
          </div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div className="mc-status-label">Last Update</div>
          <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--cyan)" }}>
            {new Date().toLocaleTimeString("en-GB", { hour12: false })}
          </div>
          <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 2 }}>AUTO-REFRESH 8s</div>
        </div>
      </div>

      {/* Main grid */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "280px 1fr 280px", gap: 10, minHeight: 0 }}>

        {/* Left — Area Health */}
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Area Health Overview</span></div>
          <div className="panel-body" style={{ padding: "10px 12px" }}>
            {(data.areas || []).map((area, i) => (
              <motion.div key={area.Plant_Area} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{area.Plant_Area}</span>
                  <span style={{ fontSize: 11, fontWeight: 700,
                    color: area.avg_health >= 80 ? "var(--emerald)" : area.avg_health >= 60 ? "var(--amber)" : "var(--red)" }}>
                    {Math.round(area.avg_health)}%
                  </span>
                </div>
                <div style={{ height: 3, background: "rgba(255,255,255,.05)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    width: `${area.avg_health}%`, height: "100%", borderRadius: 2,
                    background: area.avg_health >= 80 ? "var(--emerald)" : area.avg_health >= 60 ? "var(--amber)" : "var(--red)",
                  }} />
                </div>
                <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 4 }}>
                  {area.total} assets · {area.critical} critical
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Center — Live Event Log */}
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Live Event Log</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--emerald)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--emerald)",
                boxShadow: "0 0 6px var(--emerald)", display: "inline-block",
                animation: "pulse-dot 1.5s infinite" }} />
              LIVE
            </span>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, overflowY: "auto", height: "100%" }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "110px 75px 90px 1fr",
                gap: 8, padding: "6px 14px", borderBottom: "1px solid var(--border)",
                color: "var(--text3)", fontSize: 9, textTransform: "uppercase", letterSpacing: ".5px" }}>
                <span>Timestamp</span><span>Asset</span><span>Type</span><span>Event</span>
              </div>
              {(data.live_events || []).map((e, i) => {
                const alarmCol = e.alarm === "High" || e.alarm === "Critical" ? "var(--red)"
                  : e.alarm === "Medium" ? "var(--amber)" : "var(--text2)";
                return (
                  <motion.div key={i} className="mc-log-line"
                    style={{ padding: "5px 14px" }}
                    initial={{ opacity: 0, backgroundColor: "rgba(0,212,255,.08)" }}
                    animate={{ opacity: 1, backgroundColor: "transparent" }}
                    transition={{ duration: 1.2, delay: i * 0.04 }}>
                    <span style={{ color: "var(--text3)" }}>{e.time.slice(11)}</span>
                    <span style={{ color: "var(--cyan)", fontWeight: 600 }}>{e.tag}</span>
                    <span style={{ color: alarmCol }}>{e.type}</span>
                    <span style={{ color: "var(--text2)", fontSize: 10, overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.message}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right — Utilities + Recent Failures */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="panel" style={{ flex: "0 0 auto" }}>
            <div className="panel-head"><span className="panel-title">Utilities</span></div>
            <div className="panel-body" style={{ padding: "10px 12px" }}>
              {[
                { label: "Power", val: data.utilities?.power_mw, unit: "MW", good: 95 },
                { label: "Steam", val: data.utilities?.steam_tph, unit: "TPH", good: 145 },
                { label: "Cooling Water", val: data.utilities?.cooling_water_m3h, unit: "m³/h", good: 3800 },
                { label: "Instrument Air", val: data.utilities?.instrument_air_bar, unit: "bar", good: 7 },
              ].map(u => (
                <div key={u.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 11, color: "var(--text2)" }}>{u.label}</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700,
                    color: u.val >= u.good * 0.9 ? "var(--emerald)" : "var(--amber)" }}>
                    {u.val} <span style={{ fontSize: 9, color: "var(--text3)", fontWeight: 400 }}>{u.unit}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel" style={{ flex: 1 }}>
            <div className="panel-head"><span className="panel-title">Production</span></div>
            <div className="panel-body" style={{ padding: "10px 12px" }}>
              {[
                { label: "Crude Throughput", val: `${data.production?.crude_throughput_pct}%` },
                { label: "Product Quality", val: `${data.production?.product_quality_pct}%` },
              ].map(p => (
                <div key={p.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: "var(--text2)" }}>{p.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--emerald)" }}>{p.val}</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,.05)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{
                      width: p.val, height: "100%", borderRadius: 2, background: "var(--emerald)",
                      boxShadow: "0 0 8px var(--emerald)",
                    }} />
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>
                  Recent Failures
                </div>
                {(data.recent_failures || []).slice(0, 3).map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, fontSize: 11 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--red)", flexShrink: 0 }} />
                    <span style={{ color: "var(--cyan)", fontFamily: "var(--mono)", fontSize: 10 }}>{f.Equipment_Tag}</span>
                    <span style={{ color: "var(--text3)", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {f.Failure_Mode || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer utility pills */}
      <div className="mc-footer">
        {[
          { label: "SCADA", status: "CONNECTED", ok: true },
          { label: "DCS", status: "CONNECTED", ok: true },
          { label: "CMMS", status: "SYNC OK", ok: true },
          { label: "PI Historian", status: "LIVE", ok: true },
          { label: "Weather", status: "NOMINAL", ok: true },
          { label: "Cybersecurity", status: "SECURE", ok: true },
        ].map(s => (
          <div key={s.label} className="mc-util-card">
            <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px" }}>{s.label}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: s.ok ? "var(--emerald)" : "var(--red)", marginTop: 3 }}>{s.status}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
