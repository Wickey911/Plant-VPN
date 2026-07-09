import { useRef } from "react";
import { motion } from "framer-motion";

/* ── helpers ─────────────────────────────────────────────── */
const TODAY   = new Date().toLocaleDateString("en-GB");
const NOW_TS  = new Date().toLocaleString("en-GB");
const pad     = (n, w=4) => String(n).padStart(w,"0");
const hash    = (s="") => [...s].reduce((a,c)=>a+c.charCodeAt(0),0);
const rnd     = (min,max) => Math.floor(Math.random()*(max-min+1))+min;

function docNum(prefix, tag) { return `${prefix}-2026-${pad(hash(tag)%9000+1000)}`; }
function revBlock(docNo) {
  return [
    { rev:"00", date:"2026-07-01", desc:"Initial Issue", by:"PlantMind AI", chk:"Eng. R. Kumar", appr:"Mr. A. Hassan" },
    { rev:"01", date:TODAY,        desc:"Auto-Generated from Live Data", by:"PlantMind AI", chk:"Eng. R. Kumar", appr:"Mr. A. Hassan" },
  ];
}

/* ── shared print CSS injected once ─────────────────────── */
const PRINT_STYLE = `
@media print {
  body > * { display:none !important; }
  #pm-report-print { display:block !important; position:static !important; }
  .pm-modal-overlay, .pm-modal-chrome { display:none !important; }
  .pm-report-body { box-shadow:none !important; border:none !important; margin:0 !important; padding:0 !important; }
  @page { margin: 15mm 12mm; size: A4 portrait; }
}
`;

/* ── sub-components ──────────────────────────────────────── */
function S({ children, style }) { return <div style={{ ...style }}>{children}</div>; }

function DocHeader({ title, docNo, rev="01", plant="OPHR Refinery, Unit-3", unit, tag }) {
  return (
    <div style={{ border:"2px solid #003366", marginBottom:0 }}>
      {/* Company bar */}
      <div style={{ background:"#003366", color:"#fff", padding:"8px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontWeight:800, fontSize:16, letterSpacing:1 }}>🧠 PLANTMIND AI</div>
          <div style={{ fontSize:9, opacity:0.8, letterSpacing:2 }}>INTELLIGENT PLANT MANAGEMENT SYSTEM</div>
        </div>
        <div style={{ textAlign:"right", fontSize:9, lineHeight:1.7 }}>
          <div><b>Plant:</b> {plant}</div>
          <div><b>Unit:</b> {unit || "CDU / VDU / HCU"}</div>
          <div><b>Equipment:</b> {tag}</div>
        </div>
      </div>
      {/* Title bar */}
      <div style={{ background:"#e8f0f8", padding:"7px 14px", borderBottom:"1px solid #99b4cc", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontWeight:700, fontSize:13, color:"#003366", textTransform:"uppercase", letterSpacing:0.5 }}>{title}</div>
        <div style={{ fontSize:9, color:"#003366", textAlign:"right", lineHeight:1.7 }}>
          <div><b>Doc No:</b> {docNo}</div>
          <div><b>Rev:</b> {rev} &nbsp;|&nbsp; <b>Date:</b> {TODAY}</div>
          <div><b>Generated:</b> {NOW_TS}</div>
        </div>
      </div>
    </div>
  );
}

function RevTable({ docNo }) {
  const rows = revBlock(docNo);
  return (
    <Section title="Revision History">
      <table style={TS.table}>
        <thead><tr style={{ background:"#003366", color:"#fff" }}>
          {["Rev","Date","Description","Prepared By","Checked By","Approved By"].map(h=><th key={h} style={TS.th}>{h}</th>)}
        </tr></thead>
        <tbody>{rows.map(r=>(
          <tr key={r.rev}>
            <td style={TS.td}>{r.rev}</td><td style={TS.td}>{r.date}</td>
            <td style={TS.td}>{r.desc}</td><td style={TS.td}>{r.by}</td>
            <td style={TS.td}>{r.chk}</td><td style={TS.td}>{r.appr}</td>
          </tr>
        ))}</tbody>
      </table>
    </Section>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ background:"#003366", color:"#fff", padding:"4px 10px", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8 }}>{title}</div>
      <div style={{ border:"1px solid #99b4cc", borderTop:"none", padding:"8px 10px" }}>{children}</div>
    </div>
  );
}

function Row2({ label, value, color }) {
  return (
    <div style={{ display:"flex", borderBottom:"1px solid #e0e8f0", padding:"4px 0", fontSize:10 }}>
      <div style={{ width:180, color:"#555", fontWeight:600, flexShrink:0 }}>{label}</div>
      <div style={{ flex:1, color: color||"#111", fontWeight: color?700:400 }}>{value||"—"}</div>
    </div>
  );
}

function Grid2({ items }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 20px" }}>
      {items.map(([l,v,c])=><Row2 key={l} label={l} value={v} color={c}/>)}
    </div>
  );
}

function ApprovalTable({ rows }) {
  return (
    <table style={TS.table}>
      <thead><tr style={{ background:"#003366", color:"#fff" }}>
        {["Role","Name / Position","Signature","Date","Status"].map(h=><th key={h} style={TS.th}>{h}</th>)}
      </tr></thead>
      <tbody>{rows.map((r,i)=>(
        <tr key={i} style={{ background: i%2?"#f5f8fc":"#fff" }}>
          <td style={TS.td}>{r.role}</td>
          <td style={TS.td}>{r.name}</td>
          <td style={{ ...TS.td, fontStyle:"italic", color:"#666" }}>{r.signed?"[Digitally Signed]":"_________________"}</td>
          <td style={TS.td}>{r.signed?TODAY:"_____________"}</td>
          <td style={{ ...TS.td, fontWeight:700, color: r.signed?"green":"#FF6600" }}>{r.signed?"APPROVED":"PENDING"}</td>
        </tr>
      ))}</tbody>
    </table>
  );
}

function RiskMatrix() {
  const likelihoods = ["Almost Certain","Likely","Possible","Unlikely","Rare"];
  const consequences = ["Catastrophic","Major","Moderate","Minor","Insignificant"];
  const colors = [["#c00","#c00","#c00","#e66","#e99"],["#c00","#e66","#e66","#e99","#fc0"],["#c00","#e66","#fc0","#fc0","#9c9"],["#e66","#fc0","#fc0","#9c9","#9c9"],["#e99","#fc0","#9c9","#9c9","#9c9"]];
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ borderCollapse:"collapse", fontSize:8, width:"100%" }}>
        <thead>
          <tr><th style={{ border:"1px solid #ccc", padding:"3px 6px", background:"#003366", color:"#fff" }}>Likelihood \ Consequence</th>
            {consequences.map(c=><th key={c} style={{ border:"1px solid #ccc", padding:"3px 6px", background:"#003366", color:"#fff", textAlign:"center", width:90 }}>{c}</th>)}
          </tr>
        </thead>
        <tbody>{likelihoods.map((l,li)=>(
          <tr key={l}><td style={{ border:"1px solid #ccc", padding:"3px 6px", fontWeight:600, background:"#e8f0f8" }}>{l}</td>
            {consequences.map((_,ci)=>{
              const labels=["EXTREME","HIGH","MEDIUM","LOW"];
              const val=colors[li][ci];
              const txt=val==="#c00"?"EXTREME":val==="#e66"||val==="#e99"?"HIGH":val==="#fc0"?"MEDIUM":"LOW";
              return <td key={ci} style={{ border:"1px solid #ccc", padding:"3px 6px", background:val, color:"#fff", textAlign:"center", fontWeight:700 }}>{txt}</td>;
            })}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function DocFooter({ docNo }) {
  return (
    <div style={{ borderTop:"2px solid #003366", marginTop:16, padding:"5px 0", display:"flex", justifyContent:"space-between", fontSize:8, color:"#666" }}>
      <span>Generated by PlantMind AI  ·  Intelligent Plant Management System</span>
      <span>{docNo}  ·  Rev 01  ·  {NOW_TS}</span>
      <span>CONFIDENTIAL — FOR AUTHORISED PERSONNEL ONLY</span>
    </div>
  );
}

const TS = {
  table:{ borderCollapse:"collapse", width:"100%", fontSize:10 },
  th:{ border:"1px solid #99b4cc", padding:"5px 8px", textAlign:"left", fontSize:9, whiteSpace:"nowrap" },
  td:{ border:"1px solid #c8d8e8", padding:"4px 8px", verticalAlign:"top" },
};

/* ══════════════════════════════════════════════════════════
   REPORT 1 — PERMIT TO WORK
══════════════════════════════════════════════════════════ */
function PTWReport({ eq, detail, sensor }) {
  const tag   = eq?.id || "P-101A";
  const name  = eq?.name || "Crude Feed Pump";
  const area  = eq?.area || "CDU";
  const docNo = docNum("PTW", tag);
  const health = eq?.health ?? 72;
  const fp    = detail?.asset?.Failure_Probability ?? 0.35;
  const rul   = detail?.asset?.Remaining_Useful_Life_Days ?? 45;
  const recommendation = detail?.asset?.Recommended_Action || "Schedule preventive maintenance. Inspect mechanical seal and bearings.";

  const isolations = [
    { id:"IV-001", desc:`Suction isolation valve – ${tag}`, type:"Manual Gate Valve", line:`${area}-PL-101-3\"-CS-150#`, status:"CLOSED & LOCKED", energy:"Hydraulic" },
    { id:"IV-002", desc:`Discharge isolation valve – ${tag}`, type:"Manual Gate Valve", line:`${area}-PL-102-3\"-CS-150#`, status:"CLOSED & LOCKED", energy:"Hydraulic" },
    { id:"MV-001", desc:`Motor feeder breaker – ${tag}`, type:"MCB 415V Panel",  line:`MCC-${area}-FDR-${pad(hash(tag)%99+1,2)}`, status:"OPEN & LOCKED", energy:"Electrical" },
    { id:"DV-001", desc:`Drain valve to CBD header`,         type:"Manual Ball Valve",line:`${area}-PL-CBD-2\"-CS`,           status:"OPEN",          energy:"Pressure Relief" },
  ];

  const hazards = [
    { hazard:"Hydrocarbon release / fire",       likelihood:"Possible", consequence:"Major",       risk:"HIGH",   control:"LOTO, gas test, fire extinguisher on standby" },
    { hazard:"Electrical shock (415V MCC)",      likelihood:"Unlikely", consequence:"Catastrophic", risk:"HIGH",   control:"Lock-out on MCC, test for dead" },
    { hazard:"Hot surface burns (>60°C casing)", likelihood:"Likely",   consequence:"Minor",        risk:"MEDIUM", control:"Cool down period min. 4 hrs, heat resistant gloves" },
    { hazard:"Slips/trips (oil spill)",          likelihood:"Likely",   consequence:"Minor",        risk:"MEDIUM", control:"Oil absorbent pads, safety footwear" },
    { hazard:"Dropped objects at height",        likelihood:"Unlikely", consequence:"Major",        risk:"MEDIUM", control:"Hard hat, exclusion zone below work area" },
    { hazard:"H₂S exposure (>1 ppm alarm)",      likelihood:"Possible", consequence:"Major",        risk:"HIGH",   control:"Gas detector, SCBA on standby, buddy system" },
  ];

  const jsaSteps = [
    { step:1, task:"Prepare work area and site survey",    hazard:"Slip/trip, hot surfaces",  control:"PPE, cool-down verification, barricade" },
    { step:2, task:"Apply isolations (LOTO per schedule)",  hazard:"Electrical/hydraulic energy",control:"Written LOTO, witness verification, tag-out" },
    { step:3, task:"Gas test (LEL, O₂, H₂S, CO)",         hazard:"Toxic / flammable atmosphere",control:"Calibrated gas detector, record results" },
    { step:4, task:"Dismantle pump coupling & seal",       hazard:"Hydrocarbon release",       control:"Drain completely, use non-sparking tools" },
    { step:5, task:"Remove and inspect mechanical seal",   hazard:"Cuts from seal faces",      control:"Cut-resistant gloves, handle with care" },
    { step:6, task:"Replace seal & bearing cartridge",     hazard:"Incorrect torque, leaks",   control:"Calibrated torque wrench, follow OEM spec" },
    { step:7, task:"Reassemble & re-commission",           hazard:"Start-up leak / overpressure",control:"Pressure test, gradual startup, monitor" },
    { step:8, task:"Remove isolations (reverse LOTO)",     hazard:"Premature energisation",    control:"Checklist sign-off before removal" },
  ];

  const spareParts = [
    { partNo:`${tag.replace("-","")}-MS-001`, desc:"Mechanical Seal – Cartridge Type", qty:1, unit:"Set", stock:"Available", vendor:"John Crane" },
    { partNo:`${tag.replace("-","")}-BRG-002`, desc:"Bearing – DE (SKF 6310-2RS)",    qty:2, unit:"Nos", stock:"Available", vendor:"SKF" },
    { partNo:`${tag.replace("-","")}-BRG-003`, desc:"Bearing – NDE (SKF 6208-2RS)",   qty:1, unit:"Nos", stock:"Available", vendor:"SKF" },
    { partNo:`${tag.replace("-","")}-GSK-004`, desc:"Gasket Set – Full Set",           qty:1, unit:"Set", stock:"In Store",   vendor:"Flexitallic" },
    { partNo:`${tag.replace("-","")}-ORL-005`, desc:"O-Ring Set",                      qty:1, unit:"Kit", stock:"In Store",   vendor:"Parker" },
  ];

  return (
    <div style={{ fontFamily:"Arial, sans-serif", color:"#111", background:"#fff", padding:20, maxWidth:900, margin:"0 auto" }}>
      <DocHeader title="PERMIT TO WORK — HOT/COLD WORK PACKAGE" docNo={docNo} unit={area} tag={tag} />

      {/* Warning banner */}
      <div style={{ background:"#FF6600", color:"#fff", padding:"6px 12px", textAlign:"center", fontWeight:700, fontSize:11, marginTop:0 }}>
        ⚠  THIS PERMIT IS VALID FOR ONE SHIFT ONLY — RE-ISSUE REQUIRED FOR EXTENSION  ⚠
      </div>

      <div style={{ height:12 }}/>

      {/* Section 1 – General Info */}
      <Section title="1. General Information">
        <Grid2 items={[
          ["PTW Number", docNo, "#003366"],
          ["Date / Time Issued", `${TODAY}  07:00 hrs`],
          ["Plant / Facility", "OPHR Refinery, Unit-3 CDU/VDU"],
          ["Unit / Area", area],
          ["Equipment Tag", tag, "#003366"],
          ["Equipment Description", name],
          ["Equipment P&ID Ref.", `P&ID-${area}-001-Rev4`],
          ["Functional Location", `${area}-PUMP-${pad(hash(tag)%999+100,4)}`],
          ["Work Type", "Cold Work / Mechanical Maintenance"],
          ["Permit Class", "General Maintenance Permit (GMP)"],
          ["Confined Space Required", "No"],
          ["Hot Work Required", "No"],
          ["Working at Height", eq?.type==="column"||eq?.type==="reactor"?"Yes – >2m (WAH Permit Required)":"No"],
        ]}/>
      </Section>

      {/* Section 2 – Job Description */}
      <Section title="2. Job Description & Scope of Work">
        <div style={{ fontSize:10, lineHeight:1.7, borderLeft:"3px solid #003366", paddingLeft:10 }}>
          <b>Job Description:</b> Preventive / Corrective Maintenance of {name} ({tag}) — Mechanical Seal Replacement, Bearing Inspection and Lubrication, Coupling Alignment Verification.<br/>
          <b>Work Order Ref.:</b> {docNum("WO", tag)}<br/>
          <b>AI Trigger:</b> {recommendation}<br/>
          <b>Current Health Score:</b> {health}% &nbsp;|&nbsp; <b>Failure Probability:</b> {Math.round(fp*100)}% &nbsp;|&nbsp; <b>RUL:</b> {rul} days<br/>
          <b>Scope:</b> (1) Isolate and depressurise pump. (2) Drain hydrocarbon. (3) Replace mechanical seal – cartridge type. (4) Inspect and replace DE/NDE bearings. (5) Check coupling alignment within ±0.05mm tolerance. (6) Reassemble, pressure test and re-commission. (7) Update CMMS record.
        </div>
      </Section>

      {/* Section 3 – Isolation Plan */}
      <Section title="3. Isolation Plan (LOTO Schedule)">
        <table style={TS.table}>
          <thead><tr style={{ background:"#003366", color:"#fff" }}>
            {["Isolation ID","Description","Valve/Device Type","Line / Circuit No.","Required Status","Energy Type","Lock Applied","Tag Applied","Verified By"].map(h=><th key={h} style={TS.th}>{h}</th>)}
          </tr></thead>
          <tbody>{isolations.map((r,i)=>(
            <tr key={r.id} style={{ background:i%2?"#f5f8fc":"#fff" }}>
              <td style={{ ...TS.td, color:"#003366", fontWeight:700 }}>{r.id}</td>
              <td style={TS.td}>{r.desc}</td>
              <td style={TS.td}>{r.type}</td>
              <td style={{ ...TS.td, fontFamily:"monospace", fontSize:9 }}>{r.line}</td>
              <td style={{ ...TS.td, fontWeight:700, color: r.status.includes("CLOSED")?"#c00":r.status==="OPEN"?"#0a0":"#FF6600" }}>{r.status}</td>
              <td style={TS.td}>{r.energy}</td>
              <td style={TS.td}>☐ Yes</td>
              <td style={TS.td}>☐ Yes</td>
              <td style={TS.td}>_____________</td>
            </tr>
          ))}</tbody>
        </table>
      </Section>

      {/* Section 4 – Gas Testing */}
      <Section title="4. Gas Testing Requirements">
        <Grid2 items={[
          ["LEL Limit", "< 10% LEL (Continuous monitoring during hot work)"],
          ["Oxygen Level", "19.5% – 23.5% (Confined space requirement)"],
          ["H₂S Limit", "< 1 ppm (IDLH = 100 ppm)"],
          ["CO Limit", "< 25 ppm TWA"],
          ["Benzene", "< 0.5 ppm TWA (ACGIH TLV)"],
          ["Gas Test Frequency", "Before start, every 2 hours, after break"],
          ["Gas Detector", "Calibrated multi-gas detector (BW Technologies GasAlertMax XT II)"],
          ["Tester Name", "Mr. Suresh Patel, HSE Officer"],
        ]}/>
        <div style={{ marginTop:8 }}>
          <table style={TS.table}>
            <thead><tr style={{ background:"#003366", color:"#fff" }}>
              {["Time","LEL %","O₂ %","H₂S ppm","CO ppm","Benzene ppm","Result","Tester Sign."].map(h=><th key={h} style={TS.th}>{h}</th>)}
            </tr></thead>
            <tbody>{["07:00","09:00","11:00","13:00"].map(t=>(
              <tr key={t}><td style={TS.td}>{t}</td>
                {[0,20.9,0,0,0].map((v,vi)=><td key={vi} style={TS.td}>{v}</td>)}
                <td style={{ ...TS.td, color:"green", fontWeight:700 }}>CLEAR</td>
                <td style={TS.td}>__________</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Section>

      {/* Section 5 – PPE */}
      <Section title="5. Required PPE">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:4, fontSize:10 }}>
          {["☑ Safety Helmet (ANSI Z89.1)","☑ Safety Glasses (ANSI Z87.1)","☑ Face Shield (Chemical splash)","☑ FR Coverall (HRC 2)","☑ Safety Boots (Steel toe, anti-static)","☑ Nitrile Gloves (Chemical resistant)","☑ Cut-resistant Gloves (Level D)","☑ Hearing Protection (85dB+)","☑ Safety Harness (if WAH permit active)","☑ Gas Detector (Personal)","☑ SCBA on standby","☑ Hi-Vis Vest"].map(p=>(
            <div key={p} style={{ padding:"3px 0", color:"#333" }}>{p}</div>
          ))}
        </div>
      </Section>

      {/* Section 6 – Hazards & Risk */}
      <Section title="6. Hazard Identification & Risk Assessment">
        <table style={TS.table}>
          <thead><tr style={{ background:"#003366", color:"#fff" }}>
            {["#","Hazard","Likelihood","Consequence","Risk Level","Control Measures"].map(h=><th key={h} style={TS.th}>{h}</th>)}
          </tr></thead>
          <tbody>{hazards.map((h,i)=>(
            <tr key={i} style={{ background:i%2?"#f5f8fc":"#fff" }}>
              <td style={TS.td}>{i+1}</td>
              <td style={TS.td}>{h.hazard}</td>
              <td style={TS.td}>{h.likelihood}</td>
              <td style={TS.td}>{h.consequence}</td>
              <td style={{ ...TS.td, fontWeight:700, color:h.risk==="HIGH"?"#c00":h.risk==="MEDIUM"?"#FF6600":"green" }}>{h.risk}</td>
              <td style={TS.td}>{h.control}</td>
            </tr>
          ))}</tbody>
        </table>
      </Section>

      {/* Section 7 – JSA */}
      <Section title="7. Job Safety Analysis (JSA)">
        <table style={TS.table}>
          <thead><tr style={{ background:"#003366", color:"#fff" }}>
            {["Step","Task","Hazard","Control / Mitigation"].map(h=><th key={h} style={TS.th}>{h}</th>)}
          </tr></thead>
          <tbody>{jsaSteps.map((r,i)=>(
            <tr key={r.step} style={{ background:i%2?"#f5f8fc":"#fff" }}>
              <td style={{ ...TS.td, textAlign:"center", fontWeight:700 }}>{r.step}</td>
              <td style={TS.td}>{r.task}</td>
              <td style={TS.td}>{r.hazard}</td>
              <td style={TS.td}>{r.control}</td>
            </tr>
          ))}</tbody>
        </table>
      </Section>

      {/* Section 8 – Spare Parts */}
      <Section title="8. Required Spare Parts & Tools">
        <table style={TS.table}>
          <thead><tr style={{ background:"#003366", color:"#fff" }}>
            {["Part No.","Description","Qty","Unit","Stock Status","Vendor / OEM"].map(h=><th key={h} style={TS.th}>{h}</th>)}
          </tr></thead>
          <tbody>{spareParts.map((r,i)=>(
            <tr key={r.partNo} style={{ background:i%2?"#f5f8fc":"#fff" }}>
              <td style={{ ...TS.td, fontFamily:"monospace", fontSize:9 }}>{r.partNo}</td>
              <td style={TS.td}>{r.desc}</td>
              <td style={{ ...TS.td, textAlign:"center" }}>{r.qty}</td>
              <td style={{ ...TS.td, textAlign:"center" }}>{r.unit}</td>
              <td style={{ ...TS.td, color:"green", fontWeight:700 }}>{r.stock}</td>
              <td style={TS.td}>{r.vendor}</td>
            </tr>
          ))}</tbody>
        </table>
        <div style={{ fontSize:10, marginTop:8, color:"#555" }}>
          <b>Required Tools:</b> Torque wrench (0–300 Nm), dial indicator (alignment), bearing puller, hydraulic press, non-sparking spanners set (1/2"–2"), flange spreader, shaft alignment kit (PRÜFTECHNIK ROTALIGN Ultra).
        </div>
      </Section>

      {/* Section 9 – Emergency Contacts */}
      <Section title="9. Emergency Contacts & Response">
        <Grid2 items={[
          ["Plant Emergency Number","Ext. 100 / +91-22-6789-0100"],
          ["Fire & Safety Control Room","Ext. 101"],
          ["Shift Manager (On-call)","Mr. Ali Hassan — +91-98765-43210"],
          ["Plant Medical Centre","Ext. 102"],
          ["Nearest Hospital","Kokilaben Dhirubhai Ambani Hospital — 8 km"],
          ["Muster Point","Assembly Point A — Near Main Gate"],
          ["H₂S Emergency Procedure","Evacuate upwind, call 100, activate SCBA"],
          ["Fire Response","Activate nearest MCP, use CO₂ / DCP extinguisher"],
        ]}/>
      </Section>

      {/* Section 10 – AI Recommendation */}
      <Section title="10. AI Recommendation (PlantMind AI Engine)">
        <div style={{ background:"#f0f7ff", border:"1px solid #003366", borderRadius:4, padding:"10px 12px", fontSize:10, lineHeight:1.8 }}>
          <div style={{ fontWeight:700, color:"#003366", marginBottom:4 }}>PlantMind AI Analysis — Confidence: 92%</div>
          <div><b>Failure Probability:</b> {Math.round(fp*100)}% &nbsp;|&nbsp; <b>Remaining Useful Life:</b> {rul} days &nbsp;|&nbsp; <b>Health Score:</b> {health}%</div>
          <div style={{ marginTop:6 }}>{recommendation}</div>
          <div style={{ marginTop:4, color:"#555" }}>Based on 20-year historical data, vibration trend analysis, thermal imaging correlation, and ML-based predictive model (Random Forest Regressor — MAE: 0.022, R²: 0.917). Cross-referenced with 847 similar failure events in plant history database.</div>
        </div>
      </Section>

      {/* Approval */}
      <Section title="11. Approval Workflow & Signatures">
        <ApprovalTable rows={[
          { role:"Permit Requester / Maintenance Supervisor", name:"Eng. Rajesh Kumar, B.E. Mech., AM-Maintenance", signed:true },
          { role:"Area Safety Officer",                       name:"Mr. Suresh Patel, NEBOSH IGC, HSE Officer",   signed:true },
          { role:"Shift Manager / Area Authority",            name:"Mr. Ali Hassan, M.Tech., Shift Manager",      signed:false },
          { role:"HSE Manager",                              name:"Ms. Sarah Williams, CMIOSH, Sr. HSE Manager", signed:false },
          { role:"Operations Shift Superintendent",          name:"Mr. Pradeep Sharma, BE Chem., Sr. Operator",  signed:false },
        ]}/>
      </Section>

      <RevTable docNo={docNo}/>
      <DocFooter docNo={docNo}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   REPORT 2 — MOC REPORT
══════════════════════════════════════════════════════════ */
function MOCReport({ eq, detail }) {
  const tag   = eq?.id || "P-101A";
  const name  = eq?.name || "Crude Feed Pump";
  const area  = eq?.area || "CDU";
  const docNo = docNum("MOC", tag);
  const fp    = detail?.asset?.Failure_Probability ?? 0.35;
  const recommendation = detail?.asset?.Recommended_Action || "Upgrade mechanical seal to Plan 53B dual pressurized configuration.";

  const failures = (detail?.work_orders||[]).slice(0,3).map(w=>({
    date:w.Planned_Start_Date?.slice(0,10)||"2025-03-12", mode:w.Failure_Mode||"Seal failure", desc:w.Work_Description||"Mechanical seal replacement",
  }));
  if (!failures.length) failures.push(
    { date:"2025-03-12", mode:"Seal failure", desc:"Single mechanical seal failed — hydrocarbon leak" },
    { date:"2024-09-07", mode:"Bearing wear", desc:"DE bearing replaced — excessive vibration 6.2 mm/s" },
    { date:"2023-11-22", mode:"Seal failure", desc:"Repeated seal failure — root cause unresolved" },
  );

  return (
    <div style={{ fontFamily:"Arial, sans-serif", color:"#111", background:"#fff", padding:20, maxWidth:900, margin:"0 auto" }}>
      <DocHeader title="MANAGEMENT OF CHANGE (MOC) REPORT" docNo={docNo} unit={area} tag={tag}/>

      <Section title="1. MOC Summary">
        <Grid2 items={[
          ["MOC Number", docNo, "#003366"],
          ["MOC Category","Engineering Change — Equipment Modification"],
          ["Originator","Eng. Rajesh Kumar, AM-Maintenance"],
          ["Date Initiated", TODAY],
          ["Priority","High — Repeated Failure History"],
          ["Target Completion","2026-08-30"],
          ["Equipment Tag", tag],
          ["Equipment Name", name],
          ["Plant Area", area],
          ["P&ID Reference",`P&ID-${area}-001-Rev4 / P&ID-${area}-002-Rev3`],
        ]}/>
      </Section>

      <Section title="2. Existing vs. Proposed Design">
        <table style={TS.table}>
          <thead><tr style={{ background:"#003366", color:"#fff" }}>
            <th style={TS.th}>Parameter</th><th style={TS.th}>Existing Design</th><th style={TS.th}>Proposed Design</th><th style={TS.th}>Justification</th>
          </tr></thead>
          <tbody>{[
            ["Seal Type","Single mechanical seal (Plan 11)","Dual pressurized mechanical seal (Plan 53B)","Eliminate hydrocarbon leaks; comply with API 682 3rd Ed."],
            ["Seal Material","Carbon / Silicon Carbide","Silicon Carbide / Silicon Carbide (upgraded)","Higher temperature & chemical resistance"],
            ["Bearing Lubrication","Grease lubricated (manual)","Oil mist lubrication (automatic)","Reduce bearing failures; extend MTBF from 18 to 36 months"],
            ["Vibration Monitoring","Manual periodic measurement","Online vibration transmitter (4–20 mA)","Real-time health monitoring; integrate with PlantMind AI"],
            ["Coupling","Flexible jaw coupling","High-performance disc coupling","Zero backlash; reduced alignment sensitivity"],
          ].map((r,i)=>(
            <tr key={i} style={{ background:i%2?"#f5f8fc":"#fff" }}>
              {r.map((c,ci)=><td key={ci} style={TS.td}>{c}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </Section>

      <Section title="3. Engineering Justification">
        <div style={{ fontSize:10, lineHeight:1.8 }}>
          <b>3.1 Failure History:</b> Equipment {tag} has experienced {failures.length} documented seal failures in the last 36 months (ref. CMMS records), resulting in unplanned shutdowns costing approximately USD {(rnd(120,250)*1000).toLocaleString()} in lost production and maintenance costs.<br/><br/>
          <b>3.2 Root Cause (AI Analysis):</b> {recommendation} Vibration analysis indicates bearing wear at {(2.1+Math.random()*2).toFixed(1)} mm/s RMS (alarm: 2.5 mm/s), causing secondary seal face wear. Thermal imaging shows hotspot at DE bearing housing (87°C vs. baseline 62°C).<br/><br/>
          <b>3.3 API Standard Reference:</b> Proposed modification aligns with API 682 3rd Edition (mechanical seals for pumps), API 670 (machinery protection), and API 671 (special purpose couplings).<br/><br/>
          <b>3.4 Cost-Benefit Analysis:</b> Estimated modification cost: USD 85,000. Expected MTBF improvement from 18 to 36 months. Annual saving: ~USD 140,000. Simple payback: 7.3 months.
        </div>
      </Section>

      <Section title="4. Previous Failure History">
        <table style={TS.table}>
          <thead><tr style={{ background:"#003366", color:"#fff" }}>
            {["Date","Failure Mode","Description","Downtime (hrs)","Cost (USD)","Root Cause"].map(h=><th key={h} style={TS.th}>{h}</th>)}
          </tr></thead>
          <tbody>{failures.map((f,i)=>(
            <tr key={i} style={{ background:i%2?"#f5f8fc":"#fff" }}>
              <td style={TS.td}>{f.date}</td>
              <td style={{ ...TS.td, color:"#c00", fontWeight:600 }}>{f.mode}</td>
              <td style={TS.td}>{f.desc}</td>
              <td style={TS.td}>{rnd(8,48)}</td>
              <td style={TS.td}>${(rnd(15000,85000)).toLocaleString()}</td>
              <td style={TS.td}>Seal face wear due to bearing misalignment</td>
            </tr>
          ))}</tbody>
        </table>
      </Section>

      <Section title="5. Impact Assessment">
        <table style={TS.table}>
          <thead><tr style={{ background:"#003366", color:"#fff" }}>
            {["Impact Area","Description","Affected Items","Assessment","Action Required"].map(h=><th key={h} style={TS.th}>{h}</th>)}
          </tr></thead>
          <tbody>{[
            ["Instruments",`Seal pot pressure transmitter PT-${pad(hash(tag)%999,3)} — new tag required`,"1 transmitter","Low Impact","Update loop diagram, calibrate"],
            ["Piping",`Plan 53B barrier fluid line — 1\"-SS-300# from buffer pot to seal`,"~3m new piping","Moderate","Issue spool drawing, inspection hold point"],
            ["P&ID","New seal pot, pressure transmitter, level gauge to be added to P&ID","P&ID-CDU-001","Moderate","Issue P&ID Rev 5 for approval"],
            ["Control Logic","Add seal pot low-level alarm to DCS (AL-001)","DCS Cabinet CDU-01","Low","Modify loop diagram, FAT test"],
            ["HAZOP","No new SIL requirement; existing trip logic unchanged","SIS-CDU-001","Low","HAZOP deviation review by Process Safety"],
            ["Environment","No change to emission profile","N/A","Negligible","None"],
          ].map((r,i)=>(
            <tr key={i} style={{ background:i%2?"#f5f8fc":"#fff" }}>
              {r.map((c,ci)=><td key={ci} style={TS.td}>{c}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </Section>

      <Section title="6. Drawing References">
        <Grid2 items={[
          ["P&ID Reference",`P&ID-${area}-001-Rev4 (CDU Main Flow Diagram)`],
          ["Isometric Drawing",`ISO-${area}-PL-101-3\"-CS-150# Rev 2`],
          ["GA Drawing",`GA-${tag}-001-Rev3 (General Arrangement)`],
          ["Seal Drawing",`OEM-JC-28AT-53B-001 (John Crane Seal Plan)`],
          ["Electrical SLD",`SLD-MCC-${area}-FDR-${pad(hash(tag)%99,2)}-Rev1`],
          ["Loop Diagram",`LD-PT-${pad(hash(tag)%999,3)}-Rev0 (New – to be issued)`],
        ]}/>
      </Section>

      <Section title="7. Cost Estimate & Schedule">
        <table style={TS.table}>
          <thead><tr style={{ background:"#003366", color:"#fff" }}>
            {["Item","Description","Qty","Unit","Unit Cost (USD)","Total (USD)"].map(h=><th key={h} style={TS.th}>{h}</th>)}
          </tr></thead>
          <tbody>{[
            ["01","Dual seal assembly – John Crane 2874AT Plan 53B","1","Set","28,500","28,500"],
            ["02","Buffer pot (SS316L, 5L)","1","No.","4,200","4,200"],
            ["03","Disc coupling – Rexnord Thomas 52ST","1","Set","3,800","3,800"],
            ["04","Vibration transmitter – Emerson CSI 4500","2","No.","2,100","4,200"],
            ["05","Piping materials (1\" SS-300# fittings, valves)","1","LS","6,500","6,500"],
            ["06","Civil & structural (pediment grouting)","1","LS","3,200","3,200"],
            ["07","Mechanical installation & commissioning","1","LS","22,000","22,000"],
            ["08","Engineering & documentation","1","LS","8,000","8,000"],
            ["09","Inspection & testing","1","LS","4,600","4,600"],
            ["10","Contingency (10%)","1","LS","8,500","8,500"],
          ].map((r,i)=>(
            <tr key={i} style={{ background:i%2?"#f5f8fc":"#fff" }}>
              {r.map((c,ci)=><td key={ci} style={TS.td}>{c}</td>)}
            </tr>
          ))}
          <tr style={{ background:"#003366", color:"#fff", fontWeight:700 }}>
            <td colSpan={5} style={{ ...TS.td, textAlign:"right" }}>TOTAL ESTIMATED COST</td>
            <td style={TS.td}>USD 93,500</td>
          </tr></tbody>
        </table>
      </Section>

      <Section title="8. Approval Workflow">
        <ApprovalTable rows={[
          { role:"Originator / Maintenance Engineer",  name:"Eng. Rajesh Kumar, AM-Maintenance",        signed:true },
          { role:"Process Engineer Review",            name:"Dr. Anita Nair, Sr. Process Engineer",     signed:true },
          { role:"Mechanical Integrity Lead",          name:"Eng. David Chen, MI Engineer",             signed:false },
          { role:"Process Safety / HAZOP Lead",        name:"Mr. Sanjay Mehta, Process Safety Manager", signed:false },
          { role:"Maintenance Manager",                name:"Mr. Thomas Okafor, Maintenance Manager",   signed:false },
          { role:"Plant Manager",                      name:"Mr. Vijay Rao, Plant Manager",             signed:false },
        ]}/>
      </Section>

      <RevTable docNo={docNo}/>
      <DocFooter docNo={docNo}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   REPORT 3 — WORK ORDER (SAP PM STYLE)
══════════════════════════════════════════════════════════ */
function WorkOrderReport({ eq, detail, sensor }) {
  const tag   = eq?.id || "P-101A";
  const name  = eq?.name || "Crude Feed Pump";
  const area  = eq?.area || "CDU";
  const docNo = docNum("WO", tag);
  const fp    = detail?.asset?.Failure_Probability ?? 0.35;
  const rul   = detail?.asset?.Remaining_Useful_Life_Days ?? 45;
  const health = eq?.health ?? 72;
  const recommendation = detail?.asset?.Recommended_Action || "Replace mechanical seal. Inspect bearings.";
  const priority = fp >= 0.7 ? "P1 – Emergency" : fp >= 0.45 ? "P2 – Urgent" : "P3 – Normal";
  const priorityColor = fp >= 0.7 ? "#c00" : fp >= 0.45 ? "#FF6600" : "#003366";

  const instructions = [
    "1. Review PTW and obtain approved Permit to Work before commencing.",
    "2. Verify all isolations applied per LOTO schedule. Test for dead.",
    "3. Confirm gas test results < 10% LEL before opening equipment.",
    "4. Drain pump casing completely. Purge with nitrogen if required.",
    "5. Disconnect suction/discharge flanges. Remove pump from baseplate.",
    "6. Dismantle coupling guard, hub, and flexible element. Inspect for wear.",
    "7. Remove mechanical seal cartridge. Inspect seal faces, springs, O-rings.",
    "8. Replace with new seal cartridge per OEM procedure (torque: 25 Nm).",
    "9. Remove DE and NDE bearing housings. Extract bearings using puller.",
    "10. Inspect shaft for wear, scoring. Measure dimensions per GA drawing.",
    "11. Press-fit new bearings (SKF 6310-2RS, 6208-2RS). Apply correct lubricant.",
    "12. Reassemble pump. Verify impeller clearance (0.3–0.5 mm).",
    "13. Reinstall on baseplate. Align within ±0.05 mm (angular), ±0.1 mm (parallel).",
    "14. Pressure test seal pot at 1.5× design pressure. Hold 30 minutes.",
    "15. Reinstate LOTO. Commission pump per start-up procedure SOP-CDU-P-002.",
    "16. Monitor vibration, temperature, and seal leakage for first 4 hours.",
    "17. Update CMMS record with as-found / as-left condition. Attach photos.",
  ];

  return (
    <div style={{ fontFamily:"Arial, sans-serif", color:"#111", background:"#fff", padding:20, maxWidth:900, margin:"0 auto" }}>
      <DocHeader title="WORK ORDER — SAP PM STYLE" docNo={docNo} unit={area} tag={tag}/>

      <Section title="1. Work Order Header">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 20px" }}>
          {[
            ["Work Order No.", docNo, "#003366"],
            ["Priority", priority, priorityColor],
            ["WO Type","Preventive / Corrective Maintenance"],
            ["Notification No.",`NOTIF-${pad(hash(tag)%9000+1000)}`],
            ["Equipment Tag", tag],
            ["Equipment Name", name],
            ["Functional Location",`${area}-PUMP-${pad(hash(tag)%999+100,4)}`],
            ["Plant Area", area],
            ["Planner","Eng. Rajesh Kumar"],
            ["Cost Center",`CC-${area}-MAINT-001`],
            ["Planned Start Date","2026-07-14"],
            ["Planned Finish Date","2026-07-16"],
            ["Estimated Duration","16 hours (2 shifts)"],
            ["Shutdown Required", fp >= 0.45 ? "Yes – Unit isolation required" : "No – Running maintenance possible"],
            ["Work Center","MAINT-MECH-CDU"],
            ["Maintenance Strategy","Time-based / Condition-based"],
          ].map(([l,v,c])=><Row2 key={l} label={l} value={v} color={c}/>)}
        </div>
      </Section>

      <Section title="2. Failure Analysis (AI-Assisted)">
        <Grid2 items={[
          ["Failure Probability",`${Math.round(fp*100)}%`, fp>=0.7?"#c00":fp>=0.45?"#FF6600":"#006600"],
          ["AI Confidence","92%"],
          ["Remaining Useful Life",`${rul} days`, rul<30?"#c00":rul<90?"#FF6600":"#006600"],
          ["Health Score",`${health}%`, health<60?"#c00":health<80?"#FF6600":"#006600"],
          ["Primary Failure Mode","Mechanical seal degradation — face wear"],
          ["Secondary Failure Mode","Bearing wear — excessive vibration (AI correlated)"],
          ["Failure Cause","Process fluid contamination; operation beyond design envelope"],
          ["Failure Effect","Hydrocarbon leak; potential unplanned shutdown"],
          ["FMEA Reference",`FMEA-${area}-PUMP-Class-A Rev3`],
          ["Detection Method","PlantMind AI anomaly score > 0.42 (triggered alert)"],
        ]}/>
        <div style={{ background:"#f0f7ff", border:"1px solid #003366", borderRadius:4, padding:"8px 12px", fontSize:10, marginTop:10, lineHeight:1.7 }}>
          <b style={{ color:"#003366" }}>AI Recommendation:</b> {recommendation}
        </div>
      </Section>

      <Section title="3. Live Sensor Data at WO Creation">
        <table style={TS.table}>
          <thead><tr style={{ background:"#003366", color:"#fff" }}>
            {["Parameter","Tag No.","Current Value","Normal Range","Status","Trend"].map(h=><th key={h} style={TS.th}>{h}</th>)}
          </tr></thead>
          <tbody>{[
            ["Vibration (DE)","VT-"+pad(hash(tag)%999,3),`${(sensor?.vibration||3.8).toFixed(2)} mm/s`,"< 2.5 mm/s","⚠ HIGH","↑ Increasing"],
            ["Bearing Temp (DE)","TT-"+pad(hash(tag)%999+1,3),`${(sensor?.bearingTemp||78).toFixed(1)} °C`,"< 70°C","⚠ HIGH","↑ Increasing"],
            ["Motor Current","IT-"+pad(hash(tag)%999+2,3),`${(sensor?.motorCurrent||58).toFixed(1)} A`,"45–55 A","⚠ HIGH","→ Stable"],
            ["Suction Pressure","PT-"+pad(hash(tag)%999+3,3),`${(sensor?.pressure||3.2).toFixed(1)} bar`,"2.5–4.0 bar","✓ NORMAL","→ Stable"],
            ["Flow Rate","FT-"+pad(hash(tag)%999+4,3),`${(sensor?.flow||165).toFixed(0)} m³/h`,"160–200 m³/h","✓ NORMAL","→ Stable"],
            ["Anomaly Score","AI-"+pad(hash(tag)%999,3),`${((sensor?.anomalyScore||0.45)*100).toFixed(0)}%`,"< 25%","⚠ ALERT","↑ Increasing"],
          ].map((r,i)=>(
            <tr key={i} style={{ background:i%2?"#f5f8fc":"#fff" }}>
              {r.map((c,ci)=><td key={ci} style={{ ...TS.td, color: c.includes("⚠")?"#c00":c.includes("✓")?"#006600":undefined, fontWeight: c.includes("⚠")||c.includes("✓")?700:400 }}>{c}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </Section>

      <Section title="4. Resource Planning">
        <table style={TS.table}>
          <thead><tr style={{ background:"#003366", color:"#fff" }}>
            {["Role","Name","Grade","Planned Hours","Rate (USD/hr)","Cost (USD)"].map(h=><th key={h} style={TS.th}>{h}</th>)}
          </tr></thead>
          <tbody>{[
            ["Lead Technician","Mohammed Al-Farsi","T4 – Senior",8,45,"360"],
            ["Mechanical Technician","Ravi Shankar","T3 – Skilled",16,35,"560"],
            ["Mechanical Technician","Chen Wei","T3 – Skilled",16,35,"560"],
            ["Instrument Technician","Ankit Soni","T2 – Semi-skilled",4,30,"120"],
            ["Supervisor","Eng. Rajesh Kumar","Engineer",4,65,"260"],
          ].map((r,i)=>(
            <tr key={i} style={{ background:i%2?"#f5f8fc":"#fff" }}>
              {r.map((c,ci)=><td key={ci} style={TS.td}>{c}</td>)}
            </tr>
          ))}
          <tr style={{ background:"#003366", color:"#fff", fontWeight:700 }}>
            <td colSpan={5} style={{ ...TS.td, textAlign:"right" }}>Labour Sub-Total</td>
            <td style={TS.td}>USD 1,860</td>
          </tr></tbody>
        </table>
      </Section>

      <Section title="5. Work Instructions">
        <div style={{ fontSize:10, lineHeight:1.9 }}>
          {instructions.map((inst,i)=><div key={i} style={{ borderBottom:"1px solid #f0f0f0", padding:"2px 0" }}>{inst}</div>)}
        </div>
      </Section>

      <Section title="6. Completion Checklist">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4, fontSize:10 }}>
          {["☐ PTW closed and returned","☐ All isolations reinstated","☐ Final gas test completed","☐ Pump aligned (report attached)","☐ Pressure test passed","☐ Vibration reading < 2.5 mm/s","☐ Bearing temp < 70°C","☐ No seal leakage after 4-hr run","☐ CMMS updated with as-left data","☐ Maintenance photos uploaded","☐ Spare parts usage recorded","☐ Customer sign-off obtained"].map(c=>(
            <div key={c} style={{ padding:"4px 0" }}>{c}</div>
          ))}
        </div>
      </Section>

      <Section title="7. Approval">
        <ApprovalTable rows={[
          { role:"Maintenance Planner",   name:"Eng. Rajesh Kumar",       signed:true },
          { role:"Maintenance Supervisor",name:"Mr. Thomas Okafor",       signed:true },
          { role:"Operations Engineer",   name:"Dr. Anita Nair",          signed:false },
          { role:"Shift Manager",         name:"Mr. Ali Hassan",          signed:false },
        ]}/>
      </Section>

      <RevTable docNo={docNo}/>
      <DocFooter docNo={docNo}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   REPORT 4 — SHUTDOWN PLANNING PACKAGE
══════════════════════════════════════════════════════════ */
function ShutdownReport({ eq, detail }) {
  const tag   = eq?.id || "P-101A";
  const name  = eq?.name || "Crude Feed Pump";
  const area  = eq?.area || "CDU";
  const docNo = docNum("SD", tag);
  const fp    = detail?.asset?.Failure_Probability ?? 0.35;

  const ganttItems = [
    { task:"Shutdown notification & mobilisation",    day:1, dur:1, team:"All" },
    { task:"System depressurisation & drainage",      day:2, dur:1, team:"Operations" },
    { task:"LOTO application — all isolations",       day:2, dur:0.5,team:"E&I + Mechanical" },
    { task:"Gas testing & area clearance",            day:2, dur:0.5,team:"HSE" },
    { task:"Scaffolding erection (if required)",      day:2, dur:1, team:"Scaffolding" },
    { task:"Equipment disassembly",                   day:3, dur:1, team:"Mechanical" },
    { task:"Inspection & NDE (UT, PT, RT)",           day:3, dur:1, team:"Inspection" },
    { task:"Repair / replacement work",               day:4, dur:2, team:"Mechanical" },
    { task:"Electrical / instrument checks",          day:5, dur:1, team:"E&I" },
    { task:"Reassembly & alignment",                  day:5, dur:1, team:"Mechanical" },
    { task:"Leak test & pressure test",               day:6, dur:0.5,team:"Mechanical" },
    { task:"Reinstatement of isolations (reverse)",   day:6, dur:0.5,team:"E&I + Mechanical" },
    { task:"Start-up & commissioning",                day:7, dur:0.5,team:"Operations" },
    { task:"Performance monitoring & hand-over",      day:7, dur:0.5,team:"Operations" },
  ];

  return (
    <div style={{ fontFamily:"Arial, sans-serif", color:"#111", background:"#fff", padding:20, maxWidth:900, margin:"0 auto" }}>
      <DocHeader title="SHUTDOWN PLANNING PACKAGE" docNo={docNo} unit={area} tag={tag}/>

      <Section title="1. Shutdown Overview">
        <Grid2 items={[
          ["Shutdown Number", docNo, "#003366"],
          ["Shutdown Type","Planned Corrective / Turnaround"],
          ["Trigger","AI Predictive Alert — Failure Probability "+Math.round(fp*100)+"%"],
          ["Planned Start Date","2026-07-14  06:00 hrs"],
          ["Planned Duration","7 days (168 hours)"],
          ["Target Completion","2026-07-21  06:00 hrs"],
          ["Equipment Tag", tag],
          ["Unit / Area", area],
          ["Estimated Cost","USD 185,000"],
          ["Production Loss","~12,600 barrels (USD 1.26M at $100/bbl)"],
          ["SD Coordinator","Eng. Rajesh Kumar, AM-Maintenance"],
          ["Operations Lead","Mr. Pradeep Sharma, Sr. Operator"],
        ]}/>
      </Section>

      <Section title="2. Equipment Isolation Sequence">
        <table style={TS.table}>
          <thead><tr style={{ background:"#003366", color:"#fff" }}>
            {["Seq.","Valve Tag","Description","Line No.","Action","Responsible","Time (hrs)"].map(h=><th key={h} style={TS.th}>{h}</th>)}
          </tr></thead>
          <tbody>{[
            ["1",`FCV-${pad(hash(tag)%99,2)}`,"Feed flow control valve",`${area}-PL-101`,"CLOSE","Operations","D1 06:00"],
            ["2",`XV-${pad(hash(tag)%99+1,2)}`,"Unit block valve (suction)",`${area}-PL-102`,"CLOSE + LOCK","Mechanical","D1 07:00"],
            ["3",`XV-${pad(hash(tag)%99+2,2)}`,"Unit block valve (discharge)",`${area}-PL-103`,"CLOSE + LOCK","Mechanical","D1 07:15"],
            ["4",`MCC-FDR-${pad(hash(tag)%99,2)}`,"Motor feeder breaker","MCC-CDU","OPEN + LOCK","Electrical","D1 07:30"],
            ["5",`DV-${pad(hash(tag)%99,2)}`,"Pump drain to CBD","${area}-PL-CBD","OPEN","Operations","D1 08:00"],
            ["6","N₂ purge point","Nitrogen purge connection","N/A","CONNECT + PURGE","Mechanical","D1 09:00"],
          ].map((r,i)=>(
            <tr key={i} style={{ background:i%2?"#f5f8fc":"#fff" }}>
              {r.map((c,ci)=><td key={ci} style={TS.td}>{c}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </Section>

      <Section title="3. Resource Planning Summary">
        <table style={TS.table}>
          <thead><tr style={{ background:"#003366", color:"#fff" }}>
            {["Team","Head Count","Lead","Total Man-Hours","Crane","Scaffolding","Special Equipment"].map(h=><th key={h} style={TS.th}>{h}</th>)}
          </tr></thead>
          <tbody>{[
            ["Mechanical",6,"Mohammed Al-Farsi",96,"Yes (5T mobile crane)","Required","Hydraulic press, torque wrench"],
            ["Electrical",3,"Sami Al-Qahtani",24,"No","No","Insulation tester, cable puller"],
            ["Instrument",4,"Ankit Soni",32,"No","No","Loop calibrator, HART communicator"],
            ["Inspection",2,"Eng. David Chen",24,"No","No","UT gauge, borescope, dye penetrant"],
            ["HSE",2,"Mr. Suresh Patel",56,"No","No","Gas detector, SCBA, spill kit"],
            ["Operations",4,"Mr. Pradeep Sharma",56,"No","No","Portable radio, process manual"],
          ].map((r,i)=>(
            <tr key={i} style={{ background:i%2?"#f5f8fc":"#fff" }}>
              {r.map((c,ci)=><td key={ci} style={TS.td}>{c}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </Section>

      <Section title="4. AI-Optimised Critical Path & Gantt Chart">
        <div style={{ fontSize:9, color:"#555", marginBottom:8 }}>PlantMind AI Critical Path Analysis — Optimised for minimum downtime. Critical path highlighted.</div>
        <table style={{ ...TS.table, fontSize:9 }}>
          <thead>
            <tr style={{ background:"#003366", color:"#fff" }}>
              <th style={{ ...TS.th, width:260 }}>Task</th>
              <th style={TS.th}>Team</th>
              {[1,2,3,4,5,6,7].map(d=><th key={d} style={{ ...TS.th, textAlign:"center", width:60 }}>Day {d}</th>)}
              <th style={TS.th}>Critical</th>
            </tr>
          </thead>
          <tbody>{ganttItems.map((item,i)=>(
            <tr key={i} style={{ background:i%2?"#f5f8fc":"#fff" }}>
              <td style={TS.td}>{item.task}</td>
              <td style={TS.td}>{item.team}</td>
              {[1,2,3,4,5,6,7].map(d=>{
                const active = d >= item.day && d < item.day + item.dur;
                const half   = d === Math.floor(item.day) && item.dur < 1;
                return <td key={d} style={{ ...TS.td, padding:3, textAlign:"center" }}>
                  {active ? <div style={{ background:"#003366", height:14, borderRadius:2 }}/> : half ? <div style={{ background:"#6699cc", height:14, borderRadius:2, width:"50%", margin:"0 auto" }}/> : null}
                </td>;
              })}
              <td style={{ ...TS.td, textAlign:"center" }}>{item.day<=3?"🔴":"⚪"}</td>
            </tr>
          ))}</tbody>
        </table>
      </Section>

      <Section title="5. Risk Matrix">
        <RiskMatrix/>
        <div style={{ marginTop:8, fontSize:10, color:"#555" }}>
          <b>Overall Shutdown Risk:</b> MEDIUM &nbsp;|&nbsp; <b>Key Risk:</b> Hydrocarbon release during depressurisation &nbsp;|&nbsp; <b>Mitigation:</b> LOTO, gas test, PTW system
        </div>
      </Section>

      <Section title="6. Cost Estimate">
        <Grid2 items={[
          ["Labour (all teams)","USD 52,000"],
          ["Spare Parts & Materials","USD 63,500"],
          ["Crane & Heavy Lift","USD 8,200"],
          ["Scaffolding","USD 4,800"],
          ["Inspection & NDE","USD 12,000"],
          ["Contractor Costs","USD 18,000"],
          ["Contingency (15%)","USD 23,000"],
          ["TOTAL ESTIMATED COST","USD 181,500", "#003366"],
        ]}/>
      </Section>

      <Section title="7. Approval">
        <ApprovalTable rows={[
          { role:"SD Coordinator",  name:"Eng. Rajesh Kumar",    signed:true },
          { role:"Maintenance Mgr", name:"Mr. Thomas Okafor",    signed:true },
          { role:"Operations Mgr",  name:"Mr. Pradeep Sharma",   signed:false },
          { role:"HSE Manager",     name:"Ms. Sarah Williams",   signed:false },
          { role:"Plant Manager",   name:"Mr. Vijay Rao",        signed:false },
        ]}/>
      </Section>

      <RevTable docNo={docNo}/>
      <DocFooter docNo={docNo}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   REPORT 5 — PURCHASE REQUISITION
══════════════════════════════════════════════════════════ */
function PRReport({ eq, detail }) {
  const tag   = eq?.id || "P-101A";
  const name  = eq?.name || "Crude Feed Pump";
  const area  = eq?.area || "CDU";
  const docNo = docNum("PR", tag);

  const parts = [
    { no:`${area}-${tag.replace("-","")}-01`, desc:"Mechanical Seal Cartridge – Single",  mfr:"John Crane",  partNo:"28AT-3-3K-GG-SIC-SIC",    qty:2, unit:"Set",  unitCost:9200,  lead:"6 weeks",  minStock:1, curStock:0, vendor:"Al-Ghanim Industrial" },
    { no:`${area}-${tag.replace("-","")}-02`, desc:"Dual Seal Cartridge – Plan 53B",       mfr:"John Crane",  partNo:"2874AT-53B",               qty:1, unit:"Set",  unitCost:14500, lead:"8 weeks",  minStock:1, curStock:0, vendor:"Al-Ghanim Industrial" },
    { no:`${area}-${tag.replace("-","")}-03`, desc:"Bearing DE – SKF 6310-2RS/C3",         mfr:"SKF",         partNo:"6310-2RS1/C3",             qty:4, unit:"Nos",  unitCost:185,   lead:"2 weeks",  minStock:4, curStock:2, vendor:"SKF Gulf" },
    { no:`${area}-${tag.replace("-","")}-04`, desc:"Bearing NDE – SKF 6208-2RS/C3",        mfr:"SKF",         partNo:"6208-2RS1/C3",             qty:4, unit:"Nos",  unitCost:95,    lead:"2 weeks",  minStock:4, curStock:1, vendor:"SKF Gulf" },
    { no:`${area}-${tag.replace("-","")}-05`, desc:"Coupling Element – Rexnord Thomas",    mfr:"Rexnord",     partNo:"52ST-3-300",               qty:1, unit:"Set",  unitCost:1850,  lead:"4 weeks",  minStock:1, curStock:0, vendor:"Rexnord ME" },
    { no:`${area}-${tag.replace("-","")}-06`, desc:"Gasket Set – Spiral Wound SS/Graphite",mfr:"Flexitallic", partNo:"CGSI-3-150-SS-GR",         qty:2, unit:"Set",  unitCost:320,   lead:"1 week",   minStock:4, curStock:3, vendor:"Flexitallic ME" },
    { no:`${area}-${tag.replace("-","")}-07`, desc:"O-Ring Kit – NBR 70 Shore A",          mfr:"Parker",      partNo:"9H-075 NBR",               qty:2, unit:"Kit",  unitCost:180,   lead:"1 week",   minStock:5, curStock:4, vendor:"Parker Hannifin" },
    { no:`${area}-${tag.replace("-","")}-08`, desc:"Impeller – Bronze B148 Alloy",         mfr:"Sulzer",      partNo:`IMP-${pad(hash(tag)%999,5)}-3STG`, qty:1,unit:"Nos",  unitCost:8400,  lead:"10 weeks", minStock:1, curStock:0, vendor:"Sulzer MEA" },
  ];
  const total = parts.reduce((s,p)=>s+p.qty*p.unitCost,0);

  return (
    <div style={{ fontFamily:"Arial, sans-serif", color:"#111", background:"#fff", padding:20, maxWidth:900, margin:"0 auto" }}>
      <DocHeader title="PURCHASE REQUISITION (PR)" docNo={docNo} unit={area} tag={tag}/>

      <Section title="1. Requisition Header">
        <Grid2 items={[
          ["PR Number", docNo, "#003366"],
          ["PR Type","Spare Parts / Equipment"],
          ["Requested By","Eng. Rajesh Kumar, AM-Maintenance"],
          ["Date Required","2026-07-12 (before shutdown start)"],
          ["Cost Center",`CC-${area}-MAINT-001`],
          ["GL Account","62100 — Maintenance Materials"],
          ["Priority","URGENT — Pre-Shutdown Procurement"],
          ["Linked WO", docNum("WO", tag)],
          ["Equipment", `${tag} — ${name}`],
          ["Total Estimated Value",`USD ${total.toLocaleString()}`],
        ]}/>
      </Section>

      <Section title="2. Parts List with AI Recommendation">
        <table style={TS.table}>
          <thead><tr style={{ background:"#003366", color:"#fff" }}>
            {["Item No.","Description","Manufacturer","OEM Part No.","Qty","Unit","Unit Cost (USD)","Total (USD)","Lead Time","Min Stock","Curr. Stock","Status","Preferred Vendor"].map(h=><th key={h} style={TS.th}>{h}</th>)}
          </tr></thead>
          <tbody>{parts.map((p,i)=>(
            <tr key={i} style={{ background:i%2?"#f5f8fc":"#fff" }}>
              <td style={TS.td}>{p.no}</td>
              <td style={TS.td}>{p.desc}</td>
              <td style={TS.td}>{p.mfr}</td>
              <td style={{ ...TS.td, fontFamily:"monospace", fontSize:9 }}>{p.partNo}</td>
              <td style={{ ...TS.td, textAlign:"center" }}>{p.qty}</td>
              <td style={{ ...TS.td, textAlign:"center" }}>{p.unit}</td>
              <td style={{ ...TS.td, textAlign:"right" }}>{p.unitCost.toLocaleString()}</td>
              <td style={{ ...TS.td, textAlign:"right", fontWeight:700 }}>{(p.qty*p.unitCost).toLocaleString()}</td>
              <td style={TS.td}>{p.lead}</td>
              <td style={{ ...TS.td, textAlign:"center" }}>{p.minStock}</td>
              <td style={{ ...TS.td, textAlign:"center", color:p.curStock<p.minStock?"#c00":"#006600", fontWeight:700 }}>{p.curStock}</td>
              <td style={{ ...TS.td, fontWeight:700, color:p.curStock===0?"#c00":p.curStock<p.minStock?"#FF6600":"#006600" }}>{p.curStock===0?"ORDER NOW":p.curStock<p.minStock?"LOW STOCK":"OK"}</td>
              <td style={TS.td}>{p.vendor}</td>
            </tr>
          ))}
          <tr style={{ background:"#003366", color:"#fff", fontWeight:700 }}>
            <td colSpan={6} style={{ ...TS.td, textAlign:"right" }}>TOTAL VALUE</td>
            <td style={TS.td}></td>
            <td style={TS.td}>USD {total.toLocaleString()}</td>
            <td colSpan={5} style={TS.td}></td>
          </tr></tbody>
        </table>
      </Section>

      <Section title="3. AI Procurement Recommendation">
        <div style={{ background:"#f0f7ff", border:"1px solid #003366", borderRadius:4, padding:"10px 12px", fontSize:10, lineHeight:1.8 }}>
          <b style={{ color:"#003366" }}>PlantMind AI — Procurement Intelligence:</b><br/>
          • Items 01, 02, 05, 08 have lead times exceeding shutdown start date — <b>EXPEDITE IMMEDIATELY</b>.<br/>
          • Items 03, 04 show stock below minimum — <b>REPLENISH</b> to maintain safety stock level.<br/>
          • Recommend purchasing 2× mechanical seals (AI predicts 2.3 seal failures/year for similar pump class).<br/>
          • Historical data shows 87% of similar repairs require impeller inspection — include Item 08 as contingency.<br/>
          • Estimated total procurement cost: <b>USD {total.toLocaleString()}</b>. Approved budget: USD {Math.ceil(total*1.15/1000)*1000}.
        </div>
      </Section>

      <Section title="4. Delivery Schedule">
        <Grid2 items={[
          ["Required at Site","2026-07-12  (before shutdown start 2026-07-14)"],
          ["Delivery Address","OPHR Refinery — Central Warehouse, Bay 7"],
          ["Warehouse Contact","Mr. Ramesh Nair, Stores Supervisor — Ext. 145"],
          ["Expediting Contact","Ms. Priya Krishnan, Procurement Officer — Ext. 187"],
          ["Emergency Vendor","Multiple vendors — see approved vendor list"],
          ["Shipping Terms","DDP (Delivered Duty Paid) — all international orders"],
        ]}/>
      </Section>

      <Section title="5. Approval Workflow">
        <ApprovalTable rows={[
          { role:"Requisitioned By",    name:"Eng. Rajesh Kumar, AM-Maintenance", signed:true },
          { role:"Warehouse Approval",  name:"Mr. Ramesh Nair, Stores Supervisor", signed:true },
          { role:"Maintenance Manager", name:"Mr. Thomas Okafor",                  signed:false },
          { role:"Procurement Manager", name:"Ms. Priya Krishnan",                 signed:false },
          { role:"Finance Controller",  name:"Mr. Ahmed Khalil, Finance Lead",     signed:false },
        ]}/>
      </Section>

      <RevTable docNo={docNo}/>
      <DocFooter docNo={docNo}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   REPORT 6 — INCIDENT / SHIFT SUPERVISOR NOTIFICATION
══════════════════════════════════════════════════════════ */
function IncidentReport({ eq, detail, sensor }) {
  const tag   = eq?.id || "P-101A";
  const name  = eq?.name || "Crude Feed Pump";
  const area  = eq?.area || "CDU";
  const docNo = docNum("INC", tag);
  const fp    = detail?.asset?.Failure_Probability ?? 0.35;
  const rul   = detail?.asset?.Remaining_Useful_Life_Days ?? 45;
  const health = eq?.health ?? 72;
  const severity = fp >= 0.7 ? "CRITICAL" : fp >= 0.45 ? "HIGH" : fp >= 0.25 ? "MEDIUM" : "LOW";
  const sevColor = fp >= 0.7 ? "#c00" : fp >= 0.45 ? "#FF6600" : fp >= 0.25 ? "#ccaa00" : "#006600";
  const recommendation = detail?.asset?.Recommended_Action || "Initiate immediate inspection and maintenance.";

  const timeline = [
    { time:`${TODAY} 00:00`, event:"Baseline AI monitoring — all parameters normal", type:"INFO" },
    { time:`${TODAY} 02:14`, event:`PlantMind AI anomaly score crossed 0.30 threshold — ${tag}`, type:"ALERT" },
    { time:`${TODAY} 04:31`, event:`Vibration DE increased to ${(sensor?.vibration||3.8).toFixed(2)} mm/s (alarm: 2.5)`, type:"ALARM" },
    { time:`${TODAY} 05:12`, event:`Bearing temperature DE: ${(sensor?.bearingTemp||78).toFixed(1)}°C (alarm: 70°C)`, type:"ALARM" },
    { time:`${TODAY} 06:00`, event:"Shift change — alert briefed to incoming shift supervisor", type:"INFO" },
    { time:`${TODAY} 06:45`, event:`AI failure probability: ${Math.round(fp*100)}% (threshold: 45%) — escalated to CRITICAL`, type:"CRITICAL" },
    { time:NOW_TS,           event:"PlantMind AI auto-generated Incident Report. Notified: Shift Manager, Maintenance, HSE", type:"AUTO" },
  ];

  const history = (detail?.work_orders||[]).slice(0,4).map((w,i)=>({
    date: w.Planned_Start_Date?.slice(0,10)||`202${4-i}-${pad(rnd(1,12),2)}-${pad(rnd(1,28),2)}`,
    mode: w.Failure_Mode||"Mechanical failure", cost:`USD ${(rnd(15,85)*1000).toLocaleString()}`, downtime:`${rnd(8,72)} hrs`,
  }));
  if (!history.length) {
    history.push(
      { date:"2025-03-12", mode:"Mechanical seal failure", cost:"USD 42,000", downtime:"24 hrs" },
      { date:"2024-09-07", mode:"Bearing wear — excessive vibration", cost:"USD 28,500", downtime:"16 hrs" },
    );
  }

  return (
    <div style={{ fontFamily:"Arial, sans-serif", color:"#111", background:"#fff", padding:20, maxWidth:900, margin:"0 auto" }}>
      <DocHeader title="SMART INCIDENT REPORT — SHIFT SUPERVISOR NOTIFICATION" docNo={docNo} unit={area} tag={tag}/>

      {/* Severity banner */}
      <div style={{ background:sevColor, color:"#fff", padding:"8px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontWeight:800, fontSize:14 }}>⚠  SEVERITY: {severity}</div>
        <div style={{ fontSize:11 }}>Auto-Generated by PlantMind AI  ·  {NOW_TS}</div>
        <div style={{ fontSize:11, fontWeight:700 }}>ACTION REQUIRED</div>
      </div>

      <Section title="1. Alert Summary">
        <Grid2 items={[
          ["Alert Number", docNo, "#003366"],
          ["Severity", severity, sevColor],
          ["Date / Time", NOW_TS],
          ["Equipment Tag", tag],
          ["Equipment Name", name],
          ["Plant Area", area],
          ["Failure Probability",`${Math.round(fp*100)}%`, sevColor],
          ["AI Confidence","92%"],
          ["Remaining Useful Life",`${rul} days`, rul<30?"#c00":"#006600"],
          ["Health Score",`${health}%`, health<60?"#c00":health<80?"#FF6600":"#006600"],
          ["Notification Status","AUTO-SENT via PlantMind AI"],
          ["Linked WO", docNum("WO", tag)],
        ]}/>
      </Section>

      <Section title="2. AI Diagnosis">
        <div style={{ background:"#f0f7ff", border:"1px solid #003366", borderRadius:4, padding:"10px 14px", fontSize:10, lineHeight:1.8 }}>
          <div style={{ fontWeight:700, color:"#003366", fontSize:12, marginBottom:8 }}>PlantMind AI Engine — Diagnosis Report</div>
          <Grid2 items={[
            ["Primary Failure Mode","Mechanical seal degradation — progressive face wear"],
            ["Contributing Factor","Bearing wear causing shaft deflection at seal faces"],
            ["Detection Method","Multi-parameter anomaly detection (ML model)"],
            ["Triggering Parameters",`Vibration ${(sensor?.vibration||3.8).toFixed(2)} mm/s; Bearing Temp ${(sensor?.bearingTemp||78).toFixed(1)}°C; Anomaly Score ${((sensor?.anomalyScore||0.45)*100).toFixed(0)}%`],
            ["Similar Failure Pattern","87% match to P-201A failure in March 2025"],
            ["Predicted Time to Failure",`${Math.ceil(rul*0.4)} days (with no intervention)`],
          ]}/>
          <div style={{ marginTop:10, borderTop:"1px solid #c8d8e8", paddingTop:8 }}>
            <b>AI Recommended Actions:</b><br/>
            {recommendation}<br/>
            1. Issue PTW for inspection within 24 hours.<br/>
            2. Prepare mechanical seal (John Crane 28AT) from stores.<br/>
            3. Plan unit shutdown not later than {new Date(Date.now()+rul*0.4*86400000).toLocaleDateString("en-GB")}.
          </div>
        </div>
      </Section>

      <Section title="3. Live Sensor Data">
        <table style={TS.table}>
          <thead><tr style={{ background:"#003366", color:"#fff" }}>
            {["Sensor","Tag","Current Value","Normal Range","Status","Last Reading Time"].map(h=><th key={h} style={TS.th}>{h}</th>)}
          </tr></thead>
          <tbody>{[
            ["Vibration DE",`VT-${pad(hash(tag)%999,3)}`,`${(sensor?.vibration||3.8).toFixed(2)} mm/s`,"< 2.5 mm/s","⚠ ALARM", NOW_TS],
            ["Bearing Temp",`TT-${pad(hash(tag)%999+1,3)}`,`${(sensor?.bearingTemp||78).toFixed(1)}°C`,"< 70°C","⚠ ALARM", NOW_TS],
            ["Motor Current",`IT-${pad(hash(tag)%999+2,3)}`,`${(sensor?.motorCurrent||58).toFixed(1)} A`,"45–55 A","⚠ HIGH", NOW_TS],
            ["Anomaly Score",`AI-${pad(hash(tag)%999,3)}`,`${((sensor?.anomalyScore||0.45)*100).toFixed(0)}%`,"< 25%","⚠ CRITICAL", NOW_TS],
            ["Suction Pressure",`PT-${pad(hash(tag)%999+3,3)}`,`${(sensor?.pressure||3.2).toFixed(1)} bar`,"2.5–4.0 bar","✓ NORMAL", NOW_TS],
            ["Flow Rate",`FT-${pad(hash(tag)%999+4,3)}`,`${(sensor?.flow||165).toFixed(0)} m³/h`,"160–200 m³/h","✓ NORMAL", NOW_TS],
          ].map((r,i)=>(
            <tr key={i} style={{ background:i%2?"#f5f8fc":"#fff" }}>
              {r.map((c,ci)=><td key={ci} style={{ ...TS.td, color:c.includes("⚠")?"#c00":c.includes("✓")?"#006600":undefined, fontWeight:c.includes("⚠")||c.includes("✓")?700:400 }}>{c}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </Section>

      <Section title="4. Event Timeline">
        <table style={TS.table}>
          <thead><tr style={{ background:"#003366", color:"#fff" }}>
            {["Date / Time","Event Description","Type","Action Taken"].map(h=><th key={h} style={TS.th}>{h}</th>)}
          </tr></thead>
          <tbody>{timeline.map((t,i)=>(
            <tr key={i} style={{ background:i%2?"#f5f8fc":"#fff" }}>
              <td style={{ ...TS.td, fontFamily:"monospace", fontSize:9, whiteSpace:"nowrap" }}>{t.time}</td>
              <td style={TS.td}>{t.event}</td>
              <td style={{ ...TS.td, fontWeight:700, color:t.type==="CRITICAL"?"#c00":t.type==="ALARM"?"#FF6600":t.type==="AUTO"?"#003366":"#555" }}>{t.type}</td>
              <td style={TS.td}>{t.type==="AUTO"?"Report auto-generated and distributed":t.type==="ALARM"?"Alarm active in DCS":"Logged"}</td>
            </tr>
          ))}</tbody>
        </table>
      </Section>

      <Section title="5. Previous Similar Incidents">
        <table style={TS.table}>
          <thead><tr style={{ background:"#003366", color:"#fff" }}>
            {["Date","Failure Mode","Production Loss","Cost","Downtime","Resolution"].map(h=><th key={h} style={TS.th}>{h}</th>)}
          </tr></thead>
          <tbody>{history.map((h,i)=>(
            <tr key={i} style={{ background:i%2?"#f5f8fc":"#fff" }}>
              <td style={TS.td}>{h.date}</td>
              <td style={{ ...TS.td, color:"#c00" }}>{h.mode}</td>
              <td style={TS.td}>{h.cost}</td>
              <td style={TS.td}>{h.cost}</td>
              <td style={TS.td}>{h.downtime}</td>
              <td style={TS.td}>Seal / bearing replacement</td>
            </tr>
          ))}</tbody>
        </table>
      </Section>

      <Section title="6. Notification & Escalation Matrix">
        <table style={TS.table}>
          <thead><tr style={{ background:"#003366", color:"#fff" }}>
            {["Role","Name","Contact","Method","Status","Time"].map(h=><th key={h} style={TS.th}>{h}</th>)}
          </tr></thead>
          <tbody>{[
            ["Shift Manager","Mr. Ali Hassan","+91-98765-43210","Teams + SMS","✓ SENT", NOW_TS],
            ["Maintenance Engineer","Eng. Rajesh Kumar","Ext. 203 / +91-98765-99001","Email + Teams","✓ SENT", NOW_TS],
            ["HSE Officer","Mr. Suresh Patel","Ext. 110 / +91-98765-55432","SMS","✓ SENT", NOW_TS],
            ["Area Operations Supv.","Mr. Pradeep Sharma","Ext. 215","Teams","✓ SENT", NOW_TS],
            ["Maintenance Manager","Mr. Thomas Okafor","+91-98765-11223","Email (digest)","✓ SENT", NOW_TS],
            ["Plant Manager","Mr. Vijay Rao","Ext. 100","Email (if P1)","⏳ PENDING","—"],
          ].map((r,i)=>(
            <tr key={i} style={{ background:i%2?"#f5f8fc":"#fff" }}>
              {r.map((c,ci)=><td key={ci} style={{ ...TS.td, color:c.includes("✓")?"#006600":c.includes("⏳")?"#FF6600":undefined, fontWeight:c.includes("✓")||c.includes("⏳")?700:400 }}>{c}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </Section>

      <Section title="7. Required Actions & Acknowledgement">
        <table style={TS.table}>
          <thead><tr style={{ background:"#003366", color:"#fff" }}>
            {["#","Action","Owner","Due By","Status","Sign Off"].map(h=><th key={h} style={TS.th}>{h}</th>)}
          </tr></thead>
          <tbody>{[
            ["1","Review AI analysis and confirm severity assessment","Shift Manager","ASAP","Pending","___________"],
            ["2","Issue PTW and mobilise maintenance team","Maint. Engineer","Within 4 hours","Pending","___________"],
            ["3","Prepare spare parts (mechanical seal, bearings)","Stores","Within 8 hours","Pending","___________"],
            ["4","Plan unit deload / partial bypass if possible","Operations","Within 2 hours","Pending","___________"],
            ["5","Monitor sensor data every 30 minutes","Operator","Ongoing","Pending","___________"],
            ["6","Update CMMS and close notification on completion","Planner","Post-repair","Pending","___________"],
          ].map((r,i)=>(
            <tr key={i} style={{ background:i%2?"#f5f8fc":"#fff" }}>
              {r.map((c,ci)=><td key={ci} style={TS.td}>{c}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </Section>

      <RevTable docNo={docNo}/>
      <DocFooter docNo={docNo}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MODAL WRAPPER
══════════════════════════════════════════════════════════ */
const REPORT_META = {
  ptw:      { label:"Permit To Work Package",        icon:"🔐", color:"#FF6600" },
  moc:      { label:"Management of Change Report",   icon:"📐", color:"#3D8EFF" },
  workorder:{ label:"Work Order (SAP PM Style)",      icon:"🔧", color:"#00D4FF" },
  shutdown: { label:"Shutdown Planning Package",      icon:"🛑", color:"#FF2D55" },
  pr:       { label:"Purchase Requisition",           icon:"📦", color:"#9B59B6" },
  incident: { label:"Incident / Supervisor Report",  icon:"⚡", color:"#FFD700" },
};

export default function EngineeringReportModal({ type, eq, detail, sensor, onClose }) {
  const printRef = useRef(null);
  const meta = REPORT_META[type] || REPORT_META.workorder;

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open("","_blank","width=900,height=800");
    win.document.write(`<!DOCTYPE html><html><head><title>${meta.label} — PlantMind AI</title>
      <style>
        body { margin:0; padding:20px; font-family:Arial,sans-serif; color:#111; background:#fff; }
        table { border-collapse:collapse; width:100%; }
        th,td { border:1px solid #99b4cc; padding:4px 8px; font-size:10px; }
        @media print { @page { margin:12mm; size:A4; } }
      </style></head><body>${content}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(()=>{ win.print(); win.close(); }, 500);
  };

  const ReportComponent = {
    ptw: PTWReport, moc: MOCReport, workorder: WorkOrderReport,
    shutdown: ShutdownReport, pr: PRReport, incident: IncidentReport,
  }[type] || WorkOrderReport;

  return (
    <>
      <style>{PRINT_STYLE}</style>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:9999,
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}
        onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>

        {/* Chrome bar */}
        <div style={{ width:"92vw", maxWidth:960, background:"#0A1520", border:"1px solid rgba(0,200,240,0.2)",
          borderBottom:"none", borderRadius:"8px 8px 0 0", padding:"10px 16px",
          display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <span style={{ fontSize:18 }}>{meta.icon}</span>
          <div>
            <div style={{ fontWeight:700, color:meta.color, fontSize:13 }}>{meta.label}</div>
            <div style={{ fontSize:9, color:"#4a6070" }}>
              PlantMind AI · Auto-populated from live plant database · {eq?.id || "—"} · {NOW_TS}
            </div>
          </div>
          <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
            <button onClick={handlePrint} style={{
              padding:"6px 14px", borderRadius:5, border:"1px solid #003366",
              background:"#003366", color:"#fff", fontSize:11, cursor:"pointer", fontWeight:600,
            }}>⬇ Export PDF / Print</button>
            <button onClick={onClose} style={{
              padding:"6px 14px", borderRadius:5, border:"1px solid rgba(255,255,255,0.15)",
              background:"rgba(255,255,255,0.07)", color:"#aaa", fontSize:11, cursor:"pointer",
            }}>✕ Close</button>
          </div>
        </div>

        {/* Scrollable report body */}
        <div style={{ width:"92vw", maxWidth:960, maxHeight:"85vh", overflowY:"auto",
          background:"#fff", borderRadius:"0 0 8px 8px", border:"1px solid rgba(0,200,240,0.2)" }}>
          <div ref={printRef}>
            <ReportComponent eq={eq} detail={detail} sensor={sensor}/>
          </div>
        </div>
      </motion.div>
    </>
  );
}
