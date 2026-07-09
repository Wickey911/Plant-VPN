const BASE = "http://127.0.0.1:8000";

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}
async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json();
}

export const api = {
  kpis:              ()        => get("/api/kpis"),
  assets:            ()        => get("/api/assets"),
  assetDetail:       (tag)     => get(`/api/assets/${encodeURIComponent(tag)}`),
  failurePreds:      (n=10)    => get(`/api/failure-predictions?limit=${n}`),
  workOrders:        ()        => get("/api/work-orders"),
  alerts:            (n=20)    => get(`/api/alerts?limit=${n}`),
  costTrend:         ()        => get("/api/cost-trend"),
  inspections:       ()        => get("/api/inspections"),
  components:        ()        => get("/api/components"),
  missionSummary:    ()        => get("/api/mission-summary"),
  brownfield:        (tag)     => get(`/api/brownfield/${encodeURIComponent(tag)}`),
  knowledgeGraph:    ()        => get("/api/knowledge-graph"),
  predict:           (body)    => post("/api/predict", body),
  chat:              (question)=> post("/api/chat", { question }),
};

export function useData(fetcher, deps = []) {
  const { useState, useEffect, useRef } = window.React || {};
  return null; // placeholder — hooks used directly in components
}
