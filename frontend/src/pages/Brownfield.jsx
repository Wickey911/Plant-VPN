import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "../api";

function riskBadge(r) {
  const m = { Critical: "badge-critical", High: "badge-high", Medium: "badge-medium", Low: "badge-low" };
  return `badge ${m[r] || "badge-cyan"}`;
}

export default function Brownfield() {
  const [assets, setAssets] = useState(null);
  const [tag, setTag] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { api.assets().then(setAssets).catch(() => {}); }, []);

  const run = async () => {
    if (!tag) return;
    setLoading(true); setData(null); setError("");
    try { setData(await api.brownfield(tag)); }
    catch { setError("Could not load brownfield data for this asset."); }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ height: "100%", display: "flex", flexDirection: "column", gap: 10, padding: 12, overflow: "hidden" }}>

      {/* Header control */}
      <div className="panel" style={{ flexShrink: 0, padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6 }}>
              Select equipment to generate a complete AI-powered brownfield modification package
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <select className="field-sel" value={tag} onChange={e => setTag(e.target.value)} style={{ flex: 1 }}>
                <option value="">— Select Equipment Tag —</option>
                {(assets || []).map(a => (
                  <option key={a.Equipment_Tag} value={a.Equipment_Tag}>
                    {a.Equipment_Tag} — {a.Equipment_Name} ({a.Equipment_Type})
                  </option>
                ))}
              </select>
              <button className="btn" onClick={run} disabled={loading || !tag} style={{ whiteSpace: "nowrap" }}>
                {loading ? "Analysing…" : "Generate Package"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && <div className="spin-wrap" style={{ flex: 1 }}><div className="spinner" /><span>AI is analysing connected systems…</span></div>}
      {error && <div style={{ color: "var(--red)", padding: 16, fontSize: 12 }}>{error}</div>}

      {data && (
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 280px", gap: 10, overflow: "hidden" }}>

          {/* Col 1 — Scope & Estimate */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, overflow: "auto" }}>

            {/* Asset summary */}
            <div className="panel" style={{ flexShrink: 0, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--cyan)", fontFamily: "var(--mono)" }}>{data.asset.Equipment_Tag}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>{data.asset.Equipment_Name}</div>
                </div>
                <span className={riskBadge(data.asset.Risk_Category)}>{data.asset.Risk_Category}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
                {[
                  { l: "Health", v: `${data.asset.Health_Score}%` },
                  { l: "RUL", v: `${data.asset.Remaining_Useful_Life_Days}d` },
                  { l: "Failure Prob.", v: `${Math.round(data.risk_assessment.probability * 100)}%` },
                ].map(m => (
                  <div key={m.l} style={{ background: "var(--glass2)", borderRadius: 6, padding: "8px 10px" }}>
                    <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase" }}>{m.l}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--cyan)", marginTop: 2 }}>{m.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Isolation scope */}
            <div className="panel" style={{ flexShrink: 0 }}>
              <div className="panel-head"><span className="panel-title">Isolation Scope</span></div>
              <div className="panel-body">
                <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 6 }}>Isolation Valves</div>
                {data.modification_scope.isolation_valves.map(v => (
                  <div key={v} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, fontSize: 12 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--amber)", flexShrink: 0 }} />
                    <span style={{ fontFamily: "var(--mono)", color: "var(--amber)" }}>{v}</span>
                    <span style={{ color: "var(--text3)", fontSize: 10 }}>Manual isolation</span>
                  </div>
                ))}
                <div style={{ fontSize: 10, color: "var(--text3)", margin: "10px 0 6px" }}>Control Valves</div>
                {data.modification_scope.control_valves.map(v => (
                  <div key={v} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, fontSize: 12 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--blue)", flexShrink: 0 }} />
                    <span style={{ fontFamily: "var(--mono)", color: "var(--blue)" }}>{v}</span>
                    <span style={{ color: "var(--text3)", fontSize: 10 }}>DCS override required</span>
                  </div>
                ))}
                {data.modification_scope.instruments.slice(0,3).map(ins => ins.Instrument_Tag && (
                  <div key={ins.Instrument_Tag} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, fontSize: 12 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--cyan)", flexShrink: 0 }} />
                    <span style={{ fontFamily: "var(--mono)", color: "var(--cyan)" }}>{ins.Instrument_Tag}</span>
                    <span style={{ color: "var(--text3)", fontSize: 10 }}>{ins.Instrument_Type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost estimate */}
            <div className="panel" style={{ flexShrink: 0, padding: "14px 16px" }}>
              <div className="panel-title" style={{ marginBottom: 12 }}>Cost & Resource Estimate</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { l: "Cost (Low)", v: `$${data.estimate.cost_usd_low.toLocaleString()}` },
                  { l: "Cost (High)", v: `$${data.estimate.cost_usd_high.toLocaleString()}` },
                  { l: "Duration", v: `${data.estimate.duration_days} days` },
                  { l: "Prod. Impact/Day", v: `$${data.risk_assessment.production_impact_usd_per_day.toLocaleString()}` },
                ].map(m => (
                  <div key={m.l} style={{ background: "var(--glass2)", borderRadius: 7, padding: "10px 12px" }}>
                    <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase" }}>{m.l}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--emerald)", marginTop: 3 }}>{m.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", marginBottom: 6 }}>Manpower Required</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {Object.entries(data.estimate.manpower).map(([role, count]) => (
                    <span key={role} style={{ background: "var(--blue-d)", border: "1px solid rgba(61,142,255,.2)",
                      borderRadius: 5, padding: "3px 8px", fontSize: 10, color: "var(--blue)" }}>
                      {count} {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Col 2 — Modification Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, overflow: "auto" }}>
            <div className="panel" style={{ flex: 1 }}>
              <div className="panel-head"><span className="panel-title">Modification Sequence</span></div>
              <div className="panel-body">
                {data.modification_steps.map((step, i) => (
                  <motion.div key={i} className="bf-step" initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                    <div className="bf-num">{i + 1}</div>
                    <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5 }}>{step.replace(/^\d+\.\s/, "")}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="panel" style={{ flexShrink: 0 }}>
              <div className="panel-head"><span className="panel-title">Permits Required</span></div>
              <div className="panel-body">
                {data.permits_required.map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, fontSize: 12 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, background: "var(--amber-d)",
                      border: "1px solid rgba(255,149,0,.25)", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, color: "var(--amber)", flexShrink: 0 }}>✓</div>
                    <span style={{ color: "var(--text2)" }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel" style={{ flexShrink: 0 }}>
              <div className="panel-head"><span className="panel-title">Failure History</span></div>
              <div className="panel-body">
                <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase" }}>Total Failures</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: data.failure_history.count > 0 ? "var(--red)" : "var(--emerald)" }}>
                      {data.failure_history.count}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase" }}>Total Downtime</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "var(--amber)" }}>
                      {data.failure_history.total_downtime_h.toFixed(0)}h
                    </div>
                  </div>
                </div>
                {data.failure_history.failure_modes.map((m, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5, fontSize: 11 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--red)", flexShrink: 0 }} />
                    <span style={{ color: "var(--text2)" }}>{m}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Col 3 — AI Recommendation + Risk */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, overflow: "auto" }}>
            <div className="panel" style={{ flexShrink: 0 }}>
              <div className="panel-head"><span className="panel-title">AI Recommendation</span></div>
              <div className="panel-body">
                <div style={{ background: "var(--cyan-d)", border: "1px solid rgba(0,212,255,.12)",
                  borderRadius: 8, padding: "12px 14px", fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>
                  {data.ai_recommendation}
                </div>
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", marginBottom: 8 }}>Risk Level</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className={riskBadge(data.risk_assessment.level)} style={{ fontSize: 12, padding: "4px 12px" }}>
                      {data.risk_assessment.level}
                    </span>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text3)" }}>Failure Probability</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--red)" }}>
                        {Math.round(data.risk_assessment.probability * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel" style={{ flex: 1, flexShrink: 0, padding: "14px 16px" }}>
              <div className="panel-title" style={{ marginBottom: 12 }}>Quick Actions</div>
              {["Generate PTW Package", "Export MOC Report", "Create Work Orders", "Schedule Shutdown", "Order Spare Parts", "Notify Shift Supervisor"].map(action => (
                <button key={action} className="btn-ghost"
                  style={{ width: "100%", marginBottom: 8, padding: "9px 14px", textAlign: "left", fontSize: 12 }}>
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!data && !loading && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "var(--text3)" }}>
          <span style={{ fontSize: 48 }}>🔧</span>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text2)" }}>Brownfield Modification Planner</div>
          <div style={{ fontSize: 12, textAlign: "center", maxWidth: 380, lineHeight: 1.6 }}>
            Select an equipment tag above and click "Generate Package" to receive a complete AI-powered modification plan including isolation scope, cost estimates, manpower requirements, and safety permits.
          </div>
        </div>
      )}
    </motion.div>
  );
}
