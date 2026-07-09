import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "../api";

function fpColor(fp) {
  if (fp >= 0.7) return "var(--red)";
  if (fp >= 0.45) return "var(--amber)";
  if (fp >= 0.3) return "var(--blue)";
  return "var(--emerald)";
}
function riskBadge(r) {
  const m = { Critical: "badge-critical", High: "badge-high", Medium: "badge-medium", Low: "badge-low" };
  return `badge ${m[r] || "badge-cyan"}`;
}

export default function PredictiveMaintenance() {
  const [assets, setAssets] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ vibration_mm_s: "4.5", bearing_temp_c: "65", pressure_bar: "15", flow_m3_hr: "180", motor_current_a: "55", energy_kwh: "45", corrosion_rate_mm_yr: "0.2", thickness_loss_mm: "0.03", anomaly_score: "0.4" });
  const [predict, setPredict] = useState(null);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    api.failurePreds(20).then(d => { setAssets(d); if (d[0]) setSelected(d[0]); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) return;
    setDetail(null);
    api.assetDetail(selected.Equipment_Tag)
      .then(setDetail).catch(() => {});
  }, [selected]);

  const runPredict = async () => {
    if (!selected) return;
    setPredicting(true);
    try {
      const payload = { equipment_tag: selected.Equipment_Tag };
      Object.keys(form).forEach(k => { payload[k] = parseFloat(form[k]); });
      setPredict(await api.predict(payload));
    } catch {}
    setPredicting(false);
  };

  const histData = (detail?.history || []).slice(-20).map((h, i) => ({
    i, vib: +h.Vibration_mm_s?.toFixed(2) || 0,
    temp: +h.Bearing_or_Skin_Temp_C?.toFixed(1) || 0,
    fp: +(h.Failure_Probability * 100)?.toFixed(1) || 0,
  }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ height: "100%", display: "grid", gridTemplateColumns: "260px 1fr 280px", gap: 10, padding: 12, overflow: "hidden" }}>

      {/* Left — Ranked list */}
      <div className="panel">
        <div className="panel-head"><span className="panel-title">Risk Ranking</span><span style={{ fontSize: 9, color: "var(--text3)" }}>AI Sorted</span></div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {(assets || []).map((a, i) => {
            const isSel = selected?.Equipment_Tag === a.Equipment_Tag;
            return (
              <motion.div key={a.Equipment_Tag} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(a)}
                style={{
                  padding: "10px 14px", borderBottom: "1px solid var(--border)", cursor: "pointer",
                  background: isSel ? "rgba(0,212,255,.06)" : "transparent",
                  borderLeft: isSel ? "2px solid var(--cyan)" : "2px solid transparent",
                  transition: "all .15s",
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontFamily: "var(--mono)", color: "var(--cyan)", fontSize: 11, fontWeight: 700 }}>
                      {String(i + 1).padStart(2, "0")}. {a.Equipment_Tag}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 2 }}>{a.Equipment_Name}</div>
                  </div>
                  <span className={riskBadge(a.Risk_Category)}>{a.Risk_Category}</span>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 7, fontSize: 11 }}>
                  <div>
                    <div style={{ fontSize: 9, color: "var(--text3)" }}>FAIL%</div>
                    <div style={{ fontWeight: 700, color: fpColor(a.Failure_Probability) }}>
                      {Math.round(a.Failure_Probability * 100)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: "var(--text3)" }}>RUL</div>
                    <div style={{ fontWeight: 700, color: a.Remaining_Useful_Life_Days < 20 ? "var(--red)" : "var(--text)" }}>
                      {a.Remaining_Useful_Life_Days}d
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: "var(--text3)" }}>HEALTH</div>
                    <div style={{ fontWeight: 700, color: a.Health_Score >= 80 ? "var(--emerald)" : a.Health_Score >= 60 ? "var(--amber)" : "var(--red)" }}>
                      {a.Health_Score}%
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Center — Trend Charts + Detail */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, overflow: "hidden" }}>
        {selected && (
          <>
            <div className="panel" style={{ flex: "0 0 auto" }}>
              <div className="panel-head">
                <span className="panel-title">{selected.Equipment_Tag} — {selected.Equipment_Name}</span>
                <span className={riskBadge(selected.Risk_Category)}>{selected.Risk_Category}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, borderBottom: "1px solid var(--border)" }}>
                {[
                  { l: "Health", v: `${selected.Health_Score}%`, c: selected.Health_Score >= 80 ? "var(--emerald)" : "var(--amber)" },
                  { l: "Failure Prob.", v: `${Math.round(selected.Failure_Probability * 100)}%`, c: fpColor(selected.Failure_Probability) },
                  { l: "RUL", v: `${selected.Remaining_Useful_Life_Days}d`, c: selected.Remaining_Useful_Life_Days < 30 ? "var(--red)" : "var(--cyan)" },
                  { l: "AI Confidence", v: "92%", c: "var(--cyan)" },
                ].map(m => (
                  <div key={m.l} style={{ padding: "10px 14px", borderRight: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase" }}>{m.l}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: m.c, marginTop: 3 }}>{m.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "8px 14px 6px", fontSize: 11, color: "var(--text2)", lineHeight: 1.5 }}>
                <span style={{ color: "var(--text3)", fontWeight: 600 }}>AI: </span>{selected.Recommended_Action}
              </div>
            </div>

            <div className="panel" style={{ flex: 1 }}>
              <div className="panel-head"><span className="panel-title">Sensor Trend History</span></div>
              {!detail ? (
                <div className="spin-wrap"><div className="spinner" /></div>
              ) : (
                <div style={{ flex: 1, padding: "8px 4px 4px 0" }}>
                  <div style={{ fontSize: 10, color: "var(--text3)", padding: "0 14px", marginBottom: 6 }}>
                    Vibration (mm/s) & Temperature (°C) — Last 20 readings
                  </div>
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={histData} margin={{ top: 5, right: 14, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2840" />
                      <XAxis dataKey="i" tick={{ fill: "#4A5878", fontSize: 9 }} />
                      <YAxis tick={{ fill: "#4A5878", fontSize: 9 }} />
                      <Tooltip contentStyle={{ background: "#0F1520", border: "1px solid #223049", fontSize: 10 }} />
                      <Line type="monotone" dataKey="vib" stroke="var(--cyan)" strokeWidth={1.5} dot={false} name="Vibration" />
                      <Line type="monotone" dataKey="temp" stroke="var(--amber)" strokeWidth={1.5} dot={false} name="Temperature" />
                    </LineChart>
                  </ResponsiveContainer>

                  <div style={{ fontSize: 10, color: "var(--text3)", padding: "6px 14px", marginBottom: 4 }}>
                    Failure Probability Trend (%)
                  </div>
                  <ResponsiveContainer width="100%" height={90}>
                    <LineChart data={histData} margin={{ top: 5, right: 14, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2840" />
                      <XAxis dataKey="i" tick={{ fill: "#4A5878", fontSize: 9 }} />
                      <YAxis tick={{ fill: "#4A5878", fontSize: 9 }} domain={[0, 100]} />
                      <Tooltip contentStyle={{ background: "#0F1520", border: "1px solid #223049", fontSize: 10 }}
                        formatter={v => [`${v}%`]} />
                      <Line type="monotone" dataKey="fp" stroke="var(--red)" strokeWidth={2} dot={false} name="Failure Prob." />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right — Live Predictor */}
      <div className="panel">
        <div className="panel-head"><span className="panel-title">Live AI Predictor</span></div>
        <div className="panel-body" style={{ padding: "12px 14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { key: "vibration_mm_s", label: "Vibration (mm/s)" },
              { key: "bearing_temp_c", label: "Bearing Temp (°C)" },
              { key: "pressure_bar", label: "Pressure (bar)" },
              { key: "flow_m3_hr", label: "Flow (m³/h)" },
              { key: "motor_current_a", label: "Current (A)" },
              { key: "energy_kwh", label: "Energy (kWh)" },
              { key: "corrosion_rate_mm_yr", label: "Corr. Rate (mm/yr)" },
              { key: "thickness_loss_mm", label: "Thickness Loss (mm)" },
              { key: "anomaly_score", label: "Anomaly Score" },
            ].map(f => (
              <div key={f.key}>
                <div className="field-label">{f.label}</div>
                <input type="number" className="field-inp" value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>

          <button className="btn" style={{ width: "100%", marginTop: 12 }} onClick={runPredict} disabled={predicting || !selected}>
            {predicting ? "Running Model…" : "Run AI Prediction"}
          </button>

          {predict && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="predict-card">
              {[
                { l: "Failure Probability", v: `${Math.round(predict.failure_probability * 100)}%`, c: fpColor(predict.failure_probability) },
                { l: "Risk", v: predict.risk_category, c: fpColor(predict.failure_probability) },
                { l: "RUL", v: `${predict.rul_days}d`, c: predict.rul_days < 30 ? "var(--red)" : "var(--emerald)" },
                { l: "Health Score", v: `${predict.health_score}`, c: predict.health_score >= 70 ? "var(--emerald)" : "var(--amber)" },
              ].map(m => (
                <div key={m.l} className="pm">
                  <div className="pm-label">{m.l}</div>
                  <div className="pm-value" style={{ color: m.c }}>{m.v}</div>
                </div>
              ))}
              {predict.root_causes?.length > 0 && (
                <div style={{ width: "100%", borderTop: "1px solid rgba(0,212,255,.1)", paddingTop: 8, marginTop: 4 }}>
                  <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 5 }}>
                    AI Root Cause Analysis
                  </div>
                  {predict.root_causes.map((c, i) => (
                    <div key={i} style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4, display: "flex", gap: 6 }}>
                      <span style={{ color: "var(--amber)", flexShrink: 0 }}>▶</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
