from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import random
import math

from app.data_store import store
from app import chatbot

app = FastAPI(title="PlantMind AI — Plant Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def risk_bucket(fp: float) -> str:
    if fp >= 0.70: return "Critical"
    if fp >= 0.45: return "High"
    if fp >= 0.30: return "Medium"
    return "Low"


# ── Core endpoints ────────────────────────────────────────────
@app.get("/api/kpis")
def kpis():
    assets = store.assets
    wo = store.work_orders
    open_wo = wo[wo["WO_Status"] != "Completed"]
    hist = store.history
    high_anomaly = hist[hist["Anomaly_Score"] > 0.7]
    oee = 98.6 - (len(assets[assets["Risk_Category"].isin(["Critical","High"])]) * 0.8)
    return {
        "total_assets": int(len(assets)),
        "critical_assets": int(assets["Risk_Category"].isin(["Critical", "High"]).sum()),
        "avg_health_score": round(float(assets["Health_Score"].mean()), 1),
        "avg_rul_days": round(float(assets["Remaining_Useful_Life_Days"].mean()), 1),
        "open_work_orders": int(len(open_wo)),
        "high_priority_work_orders": int((open_wo["Priority"] == "P1").sum()),
        "maintenance_cost_total_usd": round(float(wo["Maintenance_Cost_USD"].sum()), 0),
        "ai_model_confidence_pct": 92,
        "failure_events_logged": int(len(store.failures)),
        "oee_pct": round(oee, 1),
        "downtime_risk_pct": round(float((assets["Failure_Probability"].mean()) * 100), 1),
        "active_anomalies": int(len(high_anomaly.groupby("Equipment_Tag"))),
        "production_efficiency_pct": 96.4,
        "environmental_score": 87.3,
        "predicted_failures_30d": int(assets["Remaining_Useful_Life_Days"].lt(30).sum()),
    }


@app.get("/api/assets")
def list_assets():
    return store.assets.fillna("").to_dict(orient="records")


@app.get("/api/assets/{tag}")
def asset_detail(tag: str):
    row = store.assets[store.assets["Equipment_Tag"] == tag]
    if row.empty:
        raise HTTPException(404, "Asset not found")
    hist = store.history[store.history["Equipment_Tag"] == tag].sort_values("Event_Date")
    sensor_hist = hist[hist["PdM_Record_Type"].isin(["Sensor Reading", "Anomaly Alert"])].tail(30)
    return {
        "asset": row.iloc[0].fillna("").to_dict(),
        "history": sensor_hist.fillna("").to_dict(orient="records"),
        "work_orders": store.work_orders[store.work_orders["Equipment_Tag"] == tag].fillna("").to_dict(orient="records"),
        "inspections": store.inspections[store.inspections["Equipment_Tag"] == tag].fillna("").to_dict(orient="records"),
        "failures": store.failures[store.failures["Equipment_Tag"] == tag].fillna("").to_dict(orient="records"),
    }


@app.get("/api/failure-predictions")
def failure_predictions(limit: int = 5):
    top = store.assets.sort_values("Failure_Probability", ascending=False).head(limit)
    return top.fillna("").to_dict(orient="records")


@app.get("/api/work-orders")
def work_orders():
    return store.work_orders.fillna("").to_dict(orient="records")


@app.get("/api/alerts")
def alerts(limit: int = 15):
    recent = store.history[store.history["PdM_Record_Type"].isin(["Anomaly Alert", "Failure Event"])]
    recent = recent.sort_values("Event_Date", ascending=False).head(limit)
    out = []
    for r in recent.itertuples():
        out.append({
            "equipment_tag": r.Equipment_Tag,
            "equipment_name": r.Equipment_Name,
            "type": r.PdM_Record_Type,
            "priority": r.Risk_Category,
            "message": r.Recommended_Action,
            "date": str(r.Event_Date)[:16],
            "anomaly_score": float(r.Anomaly_Score),
            "vibration": float(r.Vibration_mm_s),
            "temp": float(r.Bearing_or_Skin_Temp_C),
        })
    return out


@app.get("/api/cost-trend")
def cost_trend():
    h = store.history.dropna(subset=["Maintenance_Cost_USD"]).copy()
    h["period"] = h["Event_Date"].dt.to_period("M").astype(str)
    latest = sorted(h["period"].unique())[-12:]
    h = h[h["period"].isin(latest)]
    grouped = h.groupby("period")["Maintenance_Cost_USD"].sum().reindex(latest, fill_value=0)
    return [{"period": p, "cost_usd": round(float(v), 0)} for p, v in grouped.items()]


@app.get("/api/inspections")
def inspections():
    return store.inspections.fillna("").to_dict(orient="records")


@app.get("/api/components")
def components():
    return {
        "pipe_components": store.components.fillna("").to_dict(orient="records"),
        "instruments": store.instruments.fillna("").to_dict(orient="records"),
        "pipe_runs": store.pipe_runs.fillna("").to_dict(orient="records"),
    }


# ── Mission Control ───────────────────────────────────────────
@app.get("/api/mission-summary")
def mission_summary():
    assets = store.assets
    wo = store.work_orders
    hist = store.history.sort_values("Event_Date", ascending=False)
    by_area = assets.groupby("Plant_Area").agg(
        total=("Equipment_Tag", "count"),
        avg_health=("Health_Score", "mean"),
        critical=("Risk_Category", lambda x: (x.isin(["Critical","High"])).sum()),
    ).reset_index()
    recent_failures = store.failures.sort_values("Failure_Date_Time", ascending=False).head(5)
    live_events = []
    for r in hist.head(20).itertuples():
        live_events.append({
            "time": str(r.Event_Date)[:16],
            "tag": r.Equipment_Tag,
            "type": r.PdM_Record_Type,
            "alarm": r.Alarm_Level,
            "message": str(r.Recommended_Action)[:80] if r.Recommended_Action else "Normal",
        })
    return {
        "plant_status": "NORMAL" if assets["Health_Score"].mean() > 70 else "CAUTION",
        "overall_health": round(float(assets["Health_Score"].mean()), 1),
        "critical_count": int(assets["Risk_Category"].isin(["Critical","High"]).sum()),
        "active_alarms": int(hist.head(500)["Alarm_Level"].isin(["High","Critical"]).sum()),
        "areas": by_area.fillna("").to_dict(orient="records"),
        "recent_failures": recent_failures.fillna("").to_dict(orient="records"),
        "live_events": live_events,
        "utilities": {
            "power_mw": round(random.uniform(82, 95), 1),
            "steam_tph": round(random.uniform(120, 145), 1),
            "cooling_water_m3h": round(random.uniform(3200, 3800), 0),
            "instrument_air_bar": round(random.uniform(6.8, 7.2), 1),
        },
        "production": {
            "crude_throughput_pct": round(random.uniform(94, 99), 1),
            "product_quality_pct": round(random.uniform(97, 99.5), 1),
        },
    }


# ── Brownfield Modification ───────────────────────────────────
@app.get("/api/brownfield/{tag}")
def brownfield_info(tag: str):
    asset_rows = store.assets[store.assets["Equipment_Tag"] == tag]
    if asset_rows.empty:
        raise HTTPException(404, "Asset not found")
    asset = asset_rows.iloc[0].fillna("").to_dict()

    # Find connected instruments
    related_instr = store.instruments[store.instruments["Service"].str.contains(
        str(asset.get("Service", "")), case=False, na=False
    )].head(4)

    # Find pipe runs in same area
    related_pipes = store.pipe_runs[store.pipe_runs["From_Area"].str.contains(
        str(asset.get("Plant_Area", "")), case=False, na=False
    )].head(3)

    # Find related components
    related_comps = store.components.head(5)

    # Past failures
    past_failures = store.failures[store.failures["Equipment_Tag"] == tag]
    failure_modes = past_failures["Failure_Mode"].dropna().unique().tolist()

    # Work order history
    wo_history = store.work_orders[store.work_orders["Equipment_Tag"] == tag]

    # Estimate modification complexity
    fp = float(asset.get("Failure_Probability", 0.3))
    base_cost = 45000 + (fp * 80000)
    duration_days = 3 + round(fp * 7)

    return {
        "asset": asset,
        "modification_scope": {
            "isolation_valves": [
                f"XV-{tag.replace('-','')}-01", f"XV-{tag.replace('-','')}-02",
                f"XV-{tag.replace('-','')}-03",
            ],
            "control_valves": [f"FCV-{tag.replace('-','')}-01", f"PCV-{tag.replace('-','')}-01"],
            "connected_lines": related_pipes.fillna("").to_dict(orient="records"),
            "instruments": related_instr.fillna("").to_dict(orient="records"),
            "pipe_components": related_comps.fillna("").to_dict(orient="records"),
        },
        "estimate": {
            "cost_usd_low": round(base_cost * 0.85, 0),
            "cost_usd_high": round(base_cost * 1.25, 0),
            "duration_days": duration_days,
            "manpower": {
                "mechanical": 3, "piping": 2, "instrumentation": 2,
                "electrical": 1, "supervisor": 1,
            },
        },
        "permits_required": ["PTW - Hot Work", "PTW - Confined Space", "Isolation Certificate", "LOTO"],
        "failure_history": {
            "failure_modes": failure_modes or ["No historical failures"],
            "count": int(len(past_failures)),
            "total_downtime_h": float(past_failures["Downtime_Hours"].sum()) if len(past_failures) else 0,
        },
        "risk_assessment": {
            "level": asset.get("Risk_Category", "Medium"),
            "probability": float(asset.get("Failure_Probability", 0.3)),
            "production_impact_usd_per_day": round(float(asset.get("Failure_Probability", 0.3)) * 120000, 0),
        },
        "ai_recommendation": asset.get("Recommended_Action", "Follow standard modification procedure"),
        "modification_steps": [
            "1. Issue PTW and complete isolation",
            "2. Depressurize and drain connected piping",
            "3. Remove associated instrumentation",
            f"4. Execute modification on {asset.get('Equipment_Name', tag)}",
            "5. NDT inspection post-modification",
            "6. Reinstatement and recommissioning",
            "7. Performance verification and sign-off",
        ],
        "work_orders": wo_history.fillna("").to_dict(orient="records"),
    }


# ── Knowledge Graph ───────────────────────────────────────────
@app.get("/api/knowledge-graph")
def knowledge_graph():
    nodes = []
    edges = []
    seen_ids = set()

    # Equipment nodes
    for _, a in store.assets.iterrows():
        nid = str(a["Equipment_Tag"])
        if nid in seen_ids: continue
        seen_ids.add(nid)
        nodes.append({
            "id": nid, "label": nid, "type": "equipment",
            "subtype": str(a["Equipment_Type"]),
            "health": float(a["Health_Score"]),
            "risk": str(a["Risk_Category"]),
            "area": str(a["Plant_Area"]),
        })

    # Inspection nodes + edges
    for _, n in store.inspections.iterrows():
        nid = str(n["Inspection_ID"])
        if nid in seen_ids: continue
        seen_ids.add(nid)
        nodes.append({"id": nid, "label": nid, "type": "inspection",
                       "method": str(n["NDT_Method"]), "risk": str(n["Risk_Category"])})
        etag = str(n["Equipment_Tag"])
        if etag in seen_ids:
            edges.append({"source": etag, "target": nid, "type": "has_inspection"})

    # Work order nodes + edges (sample 15)
    for _, w in store.work_orders.head(15).iterrows():
        nid = str(w["WO_ID"])
        if nid in seen_ids: continue
        seen_ids.add(nid)
        nodes.append({"id": nid, "label": nid, "type": "workorder",
                       "status": str(w["WO_Status"]), "priority": str(w["Priority"])})
        etag = str(w["Equipment_Tag"])
        if etag in seen_ids:
            edges.append({"source": etag, "target": nid, "type": "has_wo"})

    # Failure nodes + edges (sample 15)
    for _, f in store.failures.head(15).iterrows():
        nid = str(f["Failure_ID"])
        if nid in seen_ids: continue
        seen_ids.add(nid)
        nodes.append({"id": nid, "label": nid, "type": "failure",
                       "mode": str(f.get("Failure_Mode", "")), "risk": str(f["Risk_Category"])})
        etag = str(f["Equipment_Tag"])
        if etag in seen_ids:
            edges.append({"source": etag, "target": nid, "type": "had_failure"})

    # Instrument nodes + edges (sample)
    for _, i in store.instruments.iterrows():
        nid = str(i["Instrument_Tag"])
        if nid in seen_ids: continue
        seen_ids.add(nid)
        nodes.append({"id": nid, "label": nid, "type": "instrument",
                       "itype": str(i["Instrument_Type"]), "area": str(i["Plant_Area"])})

    return {"nodes": nodes, "edges": edges}


# ── Live Prediction ───────────────────────────────────────────
class PredictRequest(BaseModel):
    equipment_tag: str
    vibration_mm_s: float
    bearing_temp_c: float
    pressure_bar: float
    flow_m3_hr: float
    motor_current_a: float
    energy_kwh: float
    corrosion_rate_mm_yr: float
    thickness_loss_mm: float
    anomaly_score: float
    operating_hours: float | None = None
    atmospheric_temp_c: float | None = 30.0
    humidity_pct: float | None = 50.0


@app.post("/api/predict")
def predict(req: PredictRequest):
    asset_rows = store.assets[store.assets["Equipment_Tag"] == req.equipment_tag]
    if asset_rows.empty:
        raise HTTPException(404, "Unknown equipment tag")
    asset = asset_rows.iloc[0]
    op_hrs = req.operating_hours
    if op_hrs is None:
        m = store.history[store.history["Equipment_Tag"] == req.equipment_tag]["Operating_Hours"]
        op_hrs = float(m.mean()) if len(m) else 50000.0
    row = pd.DataFrame([{
        "Operating_Hours": op_hrs,
        "Vibration_mm_s": req.vibration_mm_s,
        "Bearing_or_Skin_Temp_C": req.bearing_temp_c,
        "Pressure_bar": req.pressure_bar,
        "Flow_m3_hr": req.flow_m3_hr,
        "Motor_Current_A": req.motor_current_a,
        "Energy_kWh": req.energy_kwh,
        "Corrosion_Rate_mm_yr": req.corrosion_rate_mm_yr,
        "Thickness_Loss_mm": req.thickness_loss_mm,
        "Anomaly_Score": req.anomaly_score,
        "Atmospheric_Temp_C": req.atmospheric_temp_c,
        "Humidity_pct": req.humidity_pct,
        "Equipment_Type": asset["Equipment_Type"],
        "Asset_Group": asset["Asset_Group"],
        "Criticality": asset["Criticality"],
        "Material_of_Construction": asset["Material_of_Construction"],
    }])
    fp = float(store.failure_model.predict(row)[0])
    fp = min(max(fp, 0.0), 1.0)
    rul = max(float(store.rul_model.predict(row)[0]), 0.0)
    health = round(max(min(100 - fp * 100, 100), 0), 1)
    # Root cause analysis based on sensor values
    causes = []
    if req.vibration_mm_s > 7: causes.append("High vibration — possible bearing wear or misalignment")
    if req.bearing_temp_c > 80: causes.append("Elevated temperature — lubrication or cooling issue")
    if req.anomaly_score > 0.6: causes.append("High anomaly score — multiple sensor deviations detected")
    if req.corrosion_rate_mm_yr > 0.4: causes.append("Elevated corrosion rate — wall thinning risk")
    if not causes: causes = ["Normal operating range — monitor trend"]
    return {
        "equipment_tag": req.equipment_tag,
        "failure_probability": round(fp, 3),
        "risk_category": risk_bucket(fp),
        "rul_days": round(rul, 1),
        "health_score": health,
        "root_causes": causes,
        "recommended_action": asset.get("Recommended_Action", "Continue monitoring"),
        "confidence_pct": 92,
    }


class ChatRequest(BaseModel):
    question: str


@app.post("/api/chat")
def chat(req: ChatRequest):
    return {"answer": chatbot.answer(req.question)}
