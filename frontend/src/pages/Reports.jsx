import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { api } from "../api";

const PIE_COLORS = ["#FF2D55","#FF9500","#3D8EFF","#00FF94"];

export default function Reports() {
  const [kpis, setKpis] = useState(null);
  const [assets, setAssets] = useState(null);
  const [cost, setCost] = useState(null);

  useEffect(() => {
    api.kpis().then(setKpis).catch(() => {});
    api.assets().then(setAssets).catch(() => {});
    api.costTrend().then(setCost).catch(() => {});
  }, []);

  const riskDist = assets ? [
    { name: "Critical", value: assets.filter(a => a.Risk_Category === "Critical").length },
    { name: "High",     value: assets.filter(a => a.Risk_Category === "High").length },
    { name: "Medium",   value: assets.filter(a => a.Risk_Category === "Medium").length },
    { name: "Low",      value: assets.filter(a => a.Risk_Category === "Low").length },
  ] : [];

  const typeDist = assets ? Object.entries(
    assets.reduce((acc, a) => { acc[a.Equipment_Type] = (acc[a.Equipment_Type] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0,8) : [];

  const costData = (cost || []).slice(-12).map(c => ({
    month: c.month?.toString().slice(0,7) || c.month,
    cost: Math.round(c.total_cost / 1000),
  }));

  const KPI_ROWS = kpis ? [
    { label: "Overall Equipment Effectiveness", value: `${kpis.oee_pct}%`, color: "var(--emerald)" },
    { label: "Downtime Risk", value: `${kpis.downtime_risk_pct}%`, color: kpis.downtime_risk_pct > 20 ? "var(--red)" : "var(--amber)" },
    { label: "Predicted Failures (30d)", value: kpis.predicted_failures_30d, color: "var(--amber)" },
    { label: "Production Efficiency", value: `${kpis.production_efficiency_pct}%`, color: "var(--cyan)" },
    { label: "Total Assets", value: kpis.total_assets, color: "var(--text)" },
    { label: "Critical Assets", value: kpis.critical_assets, color: "var(--red)" },
    { label: "Open Work Orders", value: kpis.open_work_orders, color: "var(--amber)" },
    { label: "P1 Work Orders", value: kpis.p1_work_orders, color: "var(--red)" },
    { label: "AI Confidence", value: `${kpis.ai_confidence_pct}%`, color: "var(--cyan)" },
    { label: "Environmental Score", value: `${kpis.environmental_score}/100`, color: "var(--emerald)" },
    { label: "Avg Health Score", value: `${kpis.avg_health_score}%`, color: kpis.avg_health_score >= 70 ? "var(--emerald)" : "var(--amber)" },
    { label: "CUI Risk Assets", value: kpis.cui_risk_count, color: "var(--amber)" },
    { label: "Overdue Inspections", value: kpis.overdue_inspections, color: kpis.overdue_inspections > 5 ? "var(--red)" : "var(--text)" },
    { label: "Avg Remaining Useful Life", value: `${kpis.avg_rul_days}d`, color: "var(--cyan)" },
    { label: "MTD Maintenance Cost", value: `$${(kpis.mtd_cost / 1000).toFixed(0)}K`, color: "var(--text)" },
  ] : [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ height: "100%", display: "flex", flexDirection: "column", gap: 10, padding: 12, overflow: "auto" }}>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--cyan)" }}>Plant Performance Reports</div>
          <div style={{ fontSize: 11, color: "var(--text3)" }}>Based on 20 years of historical data · {new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}</div>
        </div>
        <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => window.print()}>Export PDF</button>
      </div>

      {/* KPI Summary Table */}
      <div className="panel" style={{ flexShrink: 0 }}>
        <div className="panel-head"><span className="panel-title">Key Performance Indicators</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)" }}>
          {KPI_ROWS.map((k, i) => (
            <div key={k.label} style={{
              padding: "12px 14px",
              borderRight: (i + 1) % 5 !== 0 ? "1px solid var(--border)" : "none",
              borderBottom: i < 10 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 3 }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{k.value ?? "—"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, flexShrink: 0, minHeight: 240 }}>

        {/* Risk Distribution Pie */}
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Risk Distribution</span></div>
          <div style={{ padding: "8px 0", flex: 1 }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={riskDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={9}>
                  {riskDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0F1520", border: "1px solid #223049", fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Equipment Type Bar */}
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Equipment by Type</span></div>
          <div style={{ padding: "8px 0 4px", flex: 1 }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={typeDist} margin={{ top: 5, right: 14, left: -20, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2840" />
                <XAxis dataKey="name" tick={{ fill: "#4A5878", fontSize: 8 }} angle={-35} textAnchor="end" />
                <YAxis tick={{ fill: "#4A5878", fontSize: 9 }} />
                <Tooltip contentStyle={{ background: "#0F1520", border: "1px solid #223049", fontSize: 11 }} />
                <Bar dataKey="value" fill="#00D4FF" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Cost Trend */}
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Monthly Cost Trend (K USD)</span></div>
          <div style={{ padding: "8px 0 4px", flex: 1 }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={costData} margin={{ top: 5, right: 14, left: -20, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2840" />
                <XAxis dataKey="month" tick={{ fill: "#4A5878", fontSize: 8 }} angle={-35} textAnchor="end" />
                <YAxis tick={{ fill: "#4A5878", fontSize: 9 }} />
                <Tooltip contentStyle={{ background: "#0F1520", border: "1px solid #223049", fontSize: 11 }}
                  formatter={v => [`$${v}K`]} />
                <Bar dataKey="cost" fill="#00FF94" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top critical assets table */}
      <div className="panel" style={{ flexShrink: 0 }}>
        <div className="panel-head"><span className="panel-title">Critical Asset Summary</span></div>
        <div style={{ overflow: "auto" }}>
          <table className="tbl">
            <thead><tr>
              <th>Tag</th><th>Name</th><th>Type</th><th>Area</th>
              <th>Health</th><th>Fail %</th><th>RUL (days)</th><th>Risk</th><th>Recommended Action</th>
            </tr></thead>
            <tbody>
              {(assets || []).filter(a => a.Risk_Category === "Critical" || a.Risk_Category === "High")
                .slice(0,15)
                .map(a => (
                <tr key={a.Equipment_Tag}>
                  <td><span style={{ fontFamily: "var(--mono)", color: "var(--cyan)", fontWeight: 600, fontSize: 11 }}>{a.Equipment_Tag}</span></td>
                  <td style={{ fontSize: 11 }}>{a.Equipment_Name}</td>
                  <td style={{ color: "var(--text3)", fontSize: 11 }}>{a.Equipment_Type}</td>
                  <td style={{ color: "var(--text3)", fontSize: 10 }}>{a.Plant_Area}</td>
                  <td style={{ color: a.Health_Score >= 80 ? "var(--emerald)" : a.Health_Score >= 60 ? "var(--amber)" : "var(--red)", fontWeight: 700, fontSize: 11 }}>{a.Health_Score}%</td>
                  <td style={{ color: a.Failure_Probability >= 0.7 ? "var(--red)" : "var(--amber)", fontWeight: 700, fontFamily: "var(--mono)", fontSize: 11 }}>{Math.round(a.Failure_Probability * 100)}%</td>
                  <td style={{ color: a.Remaining_Useful_Life_Days < 30 ? "var(--red)" : "var(--text)", fontFamily: "var(--mono)", fontSize: 11 }}>{a.Remaining_Useful_Life_Days}</td>
                  <td><span className={`badge badge-${a.Risk_Category === "Critical" ? "critical" : "high"}`}>{a.Risk_Category}</span></td>
                  <td style={{ fontSize: 10, color: "var(--text2)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.Recommended_Action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
