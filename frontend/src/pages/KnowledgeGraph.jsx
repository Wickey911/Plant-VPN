import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { api } from "../api";

// Node type configuration
const NODE_CFG = {
  equipment:   { color: "#00D4FF", size: 16, label: "Equipment" },
  inspection:  { color: "#00FF94", size: 10, label: "Inspection" },
  workorder:   { color: "#3D8EFF", size: 10, label: "Work Order" },
  failure:     { color: "#FF2D55", size: 12, label: "Failure" },
  instrument:  { color: "#BF5AF2", size: 9,  label: "Instrument" },
};

function simForce(nodes, edges, width, height) {
  const REPEL = 4000, ATTRACT = 0.12, CENTER = 0.015, DAMP = 0.72, ITERS = 120;
  const n = nodes.map(nd => ({
    ...nd, x: width / 2 + (Math.random() - 0.5) * 400, y: height / 2 + (Math.random() - 0.5) * 300,
    vx: 0, vy: 0,
  }));
  const idx = {};
  n.forEach((nd, i) => { idx[nd.id] = i; });

  for (let it = 0; it < ITERS; it++) {
    n.forEach(a => {
      n.forEach(b => {
        if (a.id === b.id) return;
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy + 1;
        const f = REPEL / d2;
        a.vx += (dx / Math.sqrt(d2)) * f;
        a.vy += (dy / Math.sqrt(d2)) * f;
      });
      a.vx += (width / 2 - a.x) * CENTER;
      a.vy += (height / 2 - a.y) * CENTER;
    });
    edges.forEach(e => {
      const s = n[idx[e.source]], t = n[idx[e.target]];
      if (!s || !t) return;
      const dx = t.x - s.x, dy = t.y - s.y;
      s.vx += dx * ATTRACT; s.vy += dy * ATTRACT;
      t.vx -= dx * ATTRACT; t.vy -= dy * ATTRACT;
    });
    n.forEach(nd => {
      nd.vx *= DAMP; nd.vy *= DAMP;
      nd.x += nd.vx; nd.y += nd.vy;
      nd.x = Math.max(30, Math.min(width - 30, nd.x));
      nd.y = Math.max(30, Math.min(height - 30, nd.y));
    });
  }
  return { nodes: n, idx };
}

export default function KnowledgeGraph() {
  const [rawData, setRawData] = useState(null);
  const [simmed, setSimmed] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [hover, setHover] = useState(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => { api.knowledgeGraph().then(setRawData).catch(() => {}); }, []);

  useEffect(() => {
    if (!rawData || !containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const filteredNodes = filter === "all" ? rawData.nodes : rawData.nodes.filter(n => n.type === filter);
    const filteredIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = rawData.edges.filter(e => filteredIds.has(e.source) && filteredIds.has(e.target));
    const result = simForce(filteredNodes, filteredEdges, width, height);
    setSimmed({ nodes: result.nodes, edges: filteredEdges, idx: result.idx });
  }, [rawData, filter]);

  useEffect(() => {
    if (!simmed || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Draw edges
    simmed.edges.forEach(e => {
      const s = simmed.nodes[simmed.idx[e.source]];
      const t = simmed.nodes[simmed.idx[e.target]];
      if (!s || !t) return;
      const isHighlighted = selected && (e.source === selected.id || e.target === selected.id);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y);
      ctx.strokeStyle = isHighlighted ? "rgba(0,212,255,0.5)" : "rgba(255,255,255,0.05)";
      ctx.lineWidth = isHighlighted ? 1.5 : 0.7;
      ctx.stroke();
    });

    // Draw nodes
    simmed.nodes.forEach(nd => {
      const cfg = NODE_CFG[nd.type] || NODE_CFG.equipment;
      const isSel = selected?.id === nd.id;
      const isHov = hover?.id === nd.id;
      const r = cfg.size + (isSel ? 4 : 0);

      if (isSel) {
        ctx.beginPath(); ctx.arc(nd.x, nd.y, r + 6, 0, Math.PI * 2);
        ctx.fillStyle = `${cfg.color}22`; ctx.fill();
      }

      ctx.beginPath(); ctx.arc(nd.x, nd.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isSel ? cfg.color : `${cfg.color}88`;
      ctx.fill();
      if (isSel || isHov) {
        ctx.strokeStyle = cfg.color; ctx.lineWidth = 1.5; ctx.stroke();
      }

      if (isSel || isHov || cfg.size >= 14) {
        ctx.font = `${isSel ? "600" : "400"} 9px JetBrains Mono, monospace`;
        ctx.fillStyle = isSel ? "#E8F0FF" : "#8899BB";
        ctx.textAlign = "center";
        ctx.fillText(nd.label, nd.x, nd.y + r + 11);
      }
    });
  }, [simmed, selected, hover]);

  const handleClick = useCallback((e) => {
    if (!simmed || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    let closest = null, minD = Infinity;
    simmed.nodes.forEach(nd => {
      const d = Math.hypot(nd.x - mx, nd.y - my);
      if (d < minD) { minD = d; closest = nd; }
    });
    if (closest && minD < 20) setSelected(s => s?.id === closest.id ? null : closest);
    else setSelected(null);
  }, [simmed]);

  const handleMove = useCallback((e) => {
    if (!simmed || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    let closest = null, minD = Infinity;
    simmed.nodes.forEach(nd => {
      const d = Math.hypot(nd.x - mx, nd.y - my);
      if (d < minD) { minD = d; closest = nd; }
    });
    setHover(closest && minD < 16 ? closest : null);
    if (canvasRef.current) canvasRef.current.style.cursor = closest && minD < 16 ? "pointer" : "default";
  }, [simmed]);

  const connections = selected ? simmed?.edges.filter(e => e.source === selected.id || e.target === selected.id) : [];
  const connectedIds = new Set(connections.flatMap(e => [e.source, e.target]).filter(id => id !== selected?.id));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ height: "100%", display: "grid", gridTemplateColumns: "1fr 240px", gap: 10, padding: 12, overflow: "hidden" }}>

      {/* Graph canvas */}
      <div className="panel" ref={containerRef} style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 10, left: 12, zIndex: 5, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", ...Object.keys(NODE_CFG)].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: "3px 10px", borderRadius: 20, fontSize: 10, cursor: "pointer",
                border: `1px solid ${filter === f ? NODE_CFG[f]?.color || "var(--cyan)" : "var(--border)"}`,
                background: filter === f ? `${NODE_CFG[f]?.color || "var(--cyan)"}22` : "var(--glass2)",
                color: filter === f ? (NODE_CFG[f]?.color || "var(--cyan)") : "var(--text3)",
              }}>
              {f === "all" ? "All Nodes" : NODE_CFG[f].label}
            </button>
          ))}
        </div>

        {!rawData ? (
          <div className="spin-wrap"><div className="spinner" /><span>Building knowledge graph…</span></div>
        ) : (
          <canvas ref={canvasRef} id="kg-canvas"
            width={containerRef.current?.clientWidth || 800}
            height={containerRef.current?.clientHeight || 600}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            onClick={handleClick} onMouseMove={handleMove} />
        )}

        <div style={{ position: "absolute", bottom: 10, left: 12, display: "flex", gap: 10 }}>
          {Object.entries(NODE_CFG).map(([type, cfg]) => (
            <div key={type} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "var(--text3)" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
              {cfg.label}
            </div>
          ))}
        </div>
      </div>

      {/* Right info panel */}
      <div className="panel">
        <div className="panel-head"><span className="panel-title">Node Detail</span></div>
        <div className="panel-body" style={{ padding: "12px 14px" }}>
          {!selected ? (
            <div style={{ color: "var(--text3)", fontSize: 11, textAlign: "center", marginTop: 30, lineHeight: 1.7 }}>
              Click any node in the graph to view its connections and metadata.
              <div style={{ marginTop: 16, fontSize: 10 }}>
                {rawData ? `${rawData.nodes.length} nodes · ${rawData.edges.length} edges` : "Loading…"}
              </div>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%",
                  background: NODE_CFG[selected.type]?.color || "var(--cyan)", flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: "var(--mono)", color: "var(--cyan)", fontSize: 12, fontWeight: 700 }}>
                    {selected.id}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px" }}>
                    {selected.type}
                  </div>
                </div>
              </div>

              {Object.entries(selected).filter(([k]) => !["id","x","y","vx","vy"].includes(k)).map(([k, v]) => v && (
                <div key={k} style={{ display: "flex", justifyContent: "space-between",
                  borderBottom: "1px solid var(--border)", padding: "6px 0", fontSize: 11 }}>
                  <span style={{ color: "var(--text3)", textTransform: "capitalize" }}>{k.replace(/_/g," ")}</span>
                  <span style={{ color: "var(--text)", fontWeight: 500, maxWidth: 100, textAlign: "right",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(v)}</span>
                </div>
              ))}

              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>
                  Connections ({connections.length})
                </div>
                {Array.from(connectedIds).slice(0, 8).map(id => {
                  const nd = simmed?.nodes.find(n => n.id === id);
                  const cfg = NODE_CFG[nd?.type] || NODE_CFG.equipment;
                  return (
                    <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, cursor: "pointer" }}
                      onClick={() => setSelected(nd)}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: cfg.color }}>{id}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
