import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";

const QUICK = [
  "Why is C-201 at high risk?",
  "Create shutdown plan for P-101A",
  "Root cause for P-101A",
  "Which assets are critical?",
  "How many open work orders?",
  "Show high CUI risk",
  "Total maintenance cost",
  "What inspections are due?",
  "Similar failures to E-101",
];

const CAPABILITIES = [
  { icon: "🔍", title: "Asset Diagnosis", desc: "Why is Pump P-101A at high risk?" },
  { icon: "📋", title: "Shutdown Planning", desc: "Create shutdown plan for C-201" },
  { icon: "🔗", title: "Root Cause Analysis", desc: "Root cause analysis for E-205" },
  { icon: "📈", title: "Failure Prediction", desc: "Which assets will fail in 30 days?" },
  { icon: "🔧", title: "Work Order Review", desc: "Show all P1 work orders" },
  { icon: "🌡", title: "CUI & Corrosion", desc: "Show high CUI risk pipelines" },
];

export default function AICopilot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (question) => {
    const q = (question || input).trim();
    if (!q || loading) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const { answer } = await api.chat(q);
      setMessages(m => [...m, { role: "bot", text: answer }]);
    } catch {
      setMessages(m => [...m, { role: "bot", text: "⚠ Could not reach the PlantMind AI backend. Ensure the FastAPI server is running on port 8000." }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const empty = messages.length === 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ height: "100%", display: "grid", gridTemplateColumns: "220px 1fr", gap: 10, padding: 12, overflow: "hidden" }}>

      {/* Left — Capabilities panel */}
      <div className="panel">
        <div className="panel-head"><span className="panel-title">Capabilities</span></div>
        <div className="panel-body" style={{ padding: "12px 14px" }}>
          <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 14, lineHeight: 1.5 }}>
            The AI Copilot analyses your plant data in real-time to answer operational questions.
          </div>
          {CAPABILITIES.map(c => (
            <div key={c.title} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                <span style={{ fontSize: 14 }}>{c.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text)" }}>{c.title}</span>
              </div>
              <button className="chip" style={{ fontSize: 10, textAlign: "left" }}
                onClick={() => send(c.desc)}>{c.desc}</button>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Chat */}
      <div className="panel">
        <div className="panel-head">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--cyan-d)",
              border: "1px solid rgba(0,212,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              🤖
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>PlantMind AI Copilot</div>
              <div style={{ fontSize: 10, color: "var(--emerald)", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--emerald)",
                  display: "inline-block", animation: "pulse-dot 2s infinite" }} />
                Analysing plant data · 92% confidence
              </div>
            </div>
          </div>
          {messages.length > 0 && (
            <button className="btn-ghost" onClick={() => setMessages([])} style={{ fontSize: 10 }}>
              Clear Chat
            </button>
          )}
        </div>

        <div className="chat-wrap">
          <div className="chat-msgs">
            {empty && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ margin: "auto", textAlign: "center", maxWidth: 440 }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🧠</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>PlantMind AI Copilot</div>
                <div style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.7, marginBottom: 20 }}>
                  I have access to 20 years of plant history — maintenance records, inspection reports,
                  failure events, sensor data, and predictive models. Ask me anything about your plant.
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                  {QUICK.slice(0, 6).map(q => (
                    <button key={q} className="chip" onClick={() => send(q)}>{q}</button>
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {messages.map((m, i) => (
                <motion.div key={i} className={`chat-bubble-row ${m.role}`}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}>
                  <div className={`chat-av ${m.role}`}>{m.role === "bot" ? "AI" : "You"}</div>
                  <div className="chat-bub"
                    style={{ fontFamily: m.role === "bot" ? "var(--sans)" : "var(--sans)" }}>
                    {m.text.split("\n").map((line, j) => {
                      const bold = line.replace(/\*\*(.+?)\*\*/g, (_, t) => `<strong style="color:var(--text)">${t}</strong>`);
                      return <div key={j} dangerouslySetInnerHTML={{ __html: bold || "&nbsp;" }} />;
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div className="chat-bubble-row bot" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="chat-av bot">AI</div>
                <div className="chat-bub" style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--cyan)",
                      display: "inline-block", animation: `pulse-dot .8s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chip-row">
            {QUICK.slice(6).map(q => (
              <button key={q} className="chip" onClick={() => send(q)}>{q}</button>
            ))}
          </div>

          <div className="chat-input-area">
            <input ref={inputRef} className="chat-inp"
              placeholder="Ask about assets, failures, shutdown plans, CUI risk…"
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()} />
            <button className="btn" onClick={() => send()} disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
