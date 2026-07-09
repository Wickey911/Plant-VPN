import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "../api";
import { usePlantStore } from "../store/plantStore";

function hColor(h) {
  if (h >= 80) return "var(--emerald)";
  if (h >= 60) return "var(--amber)";
  return "var(--red)";
}
function riskBadge(r) {
  const m = { Critical: "badge-critical", High: "badge-high", Medium: "badge-medium", Low: "badge-low" };
  return `badge ${m[r] || "badge-cyan"}`;
}

export default function Assets() {
  const [assets, setAssets] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  const { pendingFilter, setPendingFilter } = usePlantStore();

  // Capture pending filter at mount before async API call
  const pendingRef = pendingFilter;

  useEffect(() => {
    setLoadError(false);
    api.assets()
      .then(data => {
        setAssets(data);
        if (pendingRef) {
          const { riskFilter, autoSelectFirst } = pendingRef;
          if (riskFilter) setFilterRisk(riskFilter);
          setPendingFilter(null);
          if (autoSelectFirst) {
            const first = data.find(a => a.Risk_Category === riskFilter);
            if (first) {
              setSelected(first);
              api.assetDetail(first.Equipment_Tag).then(setDetail).catch(() => {});
            }
          }
        }
      })
      .catch(() => setLoadError(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const types = assets ? ["All", ...new Set(assets.map(a => a.Equipment_Type))] : ["All"];
  const filtered = (assets || []).filter(a =>
    (filterRisk === "All" || a.Risk_Category === filterRisk) &&
    (filterType === "All" || a.Equipment_Type === filterType) &&
    (a.Equipment_Tag + a.Equipment_Name + a.Plant_Area).toLowerCase().includes(search.toLowerCase())
  );

  const selectAsset = async (a) => {
    setSelected(a);
    setDetail(null);
    try { setDetail(await api.assetDetail(a.Equipment_Tag)); } catch {}
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ height: "100%", display: "grid", gridTemplateColumns: "1fr 300px", gap: 10, padding: 12, overflow: "hidden" }}>

      {/* Left — asset table */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">{filtered.length} Assets</span>
          <div style={{ display: "flex", gap: 6 }}>
            <input className="field-inp" placeholder="Search…" value={search}
              onChange={e => setSearch(e.target.value)} style={{ width: 160 }} />
            <select className="field-sel" value={filterRisk} onChange={e => setFilterRisk(e.target.value)} style={{ width: 100 }}>
              {["All","Critical","High","Medium","Low"].map(v => <option key={v}>{v}</option>)}
            </select>
            <select className="field-sel" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 130 }}>
              {types.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          {loadError && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", height: "60%", gap: 10,
            }}>
              <span style={{ fontSize: 28 }}>⚠️</span>
              <div style={{ color: "var(--red)", fontWeight: 700, fontSize: 14 }}>Backend Unreachable</div>
              <div style={{ color: "var(--text3)", fontSize: 12, textAlign: "center", maxWidth: 280 }}>
                Could not load asset data. Make sure the FastAPI server is running on port 8000.
              </div>
              <button onClick={() => { setLoadError(false); setAssets(null); api.assets().then(setAssets).catch(() => setLoadError(true)); }}
                style={{ marginTop: 6, padding: "6px 16px", background: "rgba(56,189,248,0.1)",
                  border: "1px solid rgba(56,189,248,0.3)", color: "var(--cyan)",
                  borderRadius: 5, cursor: "pointer", fontSize: 12 }}>
                Retry
              </button>
            </div>
          )}
          {!loadError && assets === null && (
            <div className="spin-wrap"><div className="spinner" /></div>
          )}
          {!loadError && assets !== null && (
          <table className="tbl">
            <thead><tr>
              <th>Tag</th><th>Name</th><th>Type</th><th>Area</th>
              <th>Health</th><th>Fail %</th><th>RUL</th><th>Risk</th><th>Status</th>
            </tr></thead>
            <tbody>
              {filtered.map((a, i) => (
                <motion.tr key={a.Equipment_Tag} style={{ cursor: "pointer" }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}
                  onClick={() => selectAsset(a)}>
                  <td><span style={{ fontFamily: "var(--mono)", color: "var(--cyan)", fontWeight: 600 }}>{a.Equipment_Tag}</span></td>
                  <td style={{ fontSize: 12 }}>{a.Equipment_Name}</td>
                  <td style={{ color: "var(--text2)", fontSize: 11 }}>{a.Equipment_Type}</td>
                  <td style={{ color: "var(--text3)", fontSize: 10 }}>{a.Plant_Area}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div className="hbar">
                        <div className="hbar-fill" style={{ width: `${a.Health_Score}%`, background: hColor(a.Health_Score) }} />
                      </div>
                      <span style={{ color: hColor(a.Health_Score), fontWeight: 700, fontSize: 11 }}>{a.Health_Score}</span>
                    </div>
                  </td>
                  <td style={{ color: a.Failure_Probability >= 0.7 ? "var(--red)" : a.Failure_Probability >= 0.45 ? "var(--amber)" : "var(--emerald)", fontWeight: 700, fontFamily: "var(--mono)", fontSize: 11 }}>
                    {Math.round(a.Failure_Probability * 100)}%
                  </td>
                  <td style={{ color: a.Remaining_Useful_Life_Days < 30 ? "var(--red)" : "var(--text)", fontFamily: "var(--mono)", fontSize: 11 }}>
                    {a.Remaining_Useful_Life_Days}d
                  </td>
                  <td><span className={riskBadge(a.Risk_Category)}>{a.Risk_Category}</span></td>
                  <td style={{ fontSize: 10, color: "var(--text3)" }}>{a.Operating_Status}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {/* Right — detail panel */}
      <div className="panel">
        <div className="panel-head"><span className="panel-title">Asset Detail</span></div>
        <div className="panel-body" style={{ padding: "12px 14px" }}>
          {!selected ? (
            <div style={{ color: "var(--text3)", fontSize: 12, textAlign: "center", marginTop: 40 }}>
              Select an asset to view details
            </div>
          ) : !detail ? (
            <div className="spin-wrap"><div className="spinner" /></div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--cyan)", fontFamily: "var(--mono)" }}>
                  {detail.asset.Equipment_Tag}
                </div>
                <div style={{ fontSize: 12, color: "var(--text2)" }}>{detail.asset.Equipment_Name}</div>
                <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{detail.asset.Plant_Area} · {detail.asset.Service}</div>
                <span className={riskBadge(detail.asset.Risk_Category)} style={{ marginTop: 6, display: "inline-block" }}>
                  {detail.asset.Risk_Category}
                </span>
              </div>

              {[["Criticality", detail.asset.Criticality],
                ["Material", detail.asset.Material_of_Construction],
                ["Manufacturer", detail.asset.Manufacturer],
                ["Install Date", detail.asset.Installation_Date?.slice(0,10)],
              ].map(([k,v]) => v && (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", padding: "7px 0", fontSize: 12 }}>
                  <span style={{ color: "var(--text3)" }}>{k}</span>
                  <span style={{ color: "var(--text)", fontWeight: 500 }}>{v}</span>
                </div>
              ))}

              <div style={{ marginTop: 12, marginBottom: 6, fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px" }}>
                Open Work Orders ({detail.work_orders?.length || 0})
              </div>
              {(detail.work_orders || []).slice(0,3).map(w => (
                <div key={w.WO_ID} style={{ background: "var(--glass2)", border: "1px solid var(--border)", borderRadius: 6,
                  padding: "8px 10px", marginBottom: 6, fontSize: 11 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "var(--mono)", color: "var(--cyan)", fontSize: 10 }}>{w.WO_ID}</span>
                    <span className={`badge badge-${w.Priority === "P1" ? "high" : "medium"}`}>{w.Priority}</span>
                  </div>
                  <div style={{ color: "var(--text2)", marginTop: 4, lineHeight: 1.4 }}>{w.Work_Description}</div>
                </div>
              ))}

              <div style={{ marginTop: 12, marginBottom: 6, fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px" }}>
                AI Recommendation
              </div>
              <div style={{ background: "var(--cyan-d)", border: "1px solid rgba(0,212,255,.12)", borderRadius: 7,
                padding: "10px 12px", fontSize: 11.5, color: "var(--text2)", lineHeight: 1.55 }}>
                {detail.asset.Recommended_Action}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
