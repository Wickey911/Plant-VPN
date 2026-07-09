// ─── Equipment registry – matches real asset tags from the PdM database ───────

export const EQUIPMENT = [
  // ── Storage Tanks ──────────────────────────────────────────────────────────
  { id:"T-101", type:"tank",        name:"Crude Oil Storage Tank A",     position:[-18,0,-24], params:{r:3.2,h:7},    health:87, area:"Storage",     criticality:"High",   service:"Crude Oil",      manufacturer:"CB&I",          material:"Carbon Steel A516-70",  installDate:"2005-03-15" },
  { id:"T-102", type:"tank",        name:"Crude Oil Storage Tank B",     position:[-11,0,-24], params:{r:3.2,h:7},    health:92, area:"Storage",     criticality:"High",   service:"Crude Oil",      manufacturer:"CB&I",          material:"Carbon Steel A516-70",  installDate:"2005-03-15" },
  { id:"T-103", type:"tank",        name:"Diesel Product Tank",          position:[ -4,0,-24], params:{r:2.8,h:6},    health:78, area:"Storage",     criticality:"High",   service:"Diesel",         manufacturer:"Tank Holdings", material:"Carbon Steel A36",      installDate:"2008-07-20" },
  { id:"T-104", type:"tank",        name:"Naphtha Storage Tank",         position:[-18,0,-15], params:{r:2.5,h:5.5},  health:95, area:"Storage",     criticality:"Medium", service:"Naphtha",        manufacturer:"CB&I",          material:"Carbon Steel A36",      installDate:"2010-11-02" },
  { id:"T-105", type:"tank",        name:"Kerosene Tank",                position:[-11,0,-15], params:{r:2.2,h:5},    health:65, area:"Storage",     criticality:"Medium", service:"Kerosene",       manufacturer:"Tank Holdings", material:"Carbon Steel A36",      installDate:"2009-04-18" },
  { id:"T-106", type:"tank",        name:"Slop / Waste Tank",            position:[ -4,0,-15], params:{r:1.6,h:3.5},  health:43, area:"Storage",     criticality:"Low",    service:"Slop",           manufacturer:"Local",         material:"Carbon Steel",          installDate:"2012-01-30" },

  // ── Distillation Columns ────────────────────────────────────────────────────
  { id:"C-201", type:"column",      name:"Atmospheric Distillation Col", position:[ 4,0, -8], params:{r:1.6,h:28},   health:72, area:"CDU",         criticality:"Critical", service:"Crude Distillation", manufacturer:"Lummus",      material:"CS + SS Cladding",       installDate:"2003-06-01" },
  { id:"C-202", type:"column",      name:"Vacuum Distillation Column",   position:[ 9,0, -3], params:{r:1.3,h:22},   health:81, area:"VDU",         criticality:"Critical", service:"Vacuum Gas Oil",    manufacturer:"Foster Wheeler", material:"CS + SS Cladding",    installDate:"2004-08-15" },
  { id:"C-203", type:"column",      name:"Stripping Column",             position:[  2,0, 2], params:{r:0.8,h:12},   health:88, area:"CDU",         criticality:"Medium", service:"Naphtha Strip.",  manufacturer:"Lummus",         material:"Carbon Steel",          installDate:"2006-02-20" },

  // ── Heat Exchangers ─────────────────────────────────────────────────────────
  { id:"E-101", type:"hx",          name:"Crude Preheat Exchanger",      position:[-1,0, -4], params:{r:0.65,l:5.5},  health:68, area:"CDU",        criticality:"High",   service:"Crude / Atm. Residue",  manufacturer:"Alfa Laval",   material:"SS 316L",   installDate:"2007-09-10" },
  { id:"E-102", type:"hx",          name:"Overhead Condenser",           position:[ 3,0, -4], params:{r:0.55,l:4.5},  health:88, area:"CDU",        criticality:"High",   service:"Overhead Vapour",       manufacturer:"SWEP",         material:"SS 304",    installDate:"2007-09-10" },
  { id:"E-103", type:"hx",          name:"Kerosene Cooler",              position:[-1,0,  0], params:{r:0.65,l:5},    health:76, area:"CDU",        criticality:"Medium", service:"Kerosene Product",      manufacturer:"Alfa Laval",   material:"CS",        installDate:"2008-03-15" },
  { id:"E-104", type:"hx",          name:"Diesel Trim Cooler",           position:[ 3,0,  0], params:{r:0.5,l:4},     health:91, area:"CDU",        criticality:"Medium", service:"Diesel Product",        manufacturer:"SWEP",         material:"CS",        installDate:"2009-05-20" },

  // ── Reactors ────────────────────────────────────────────────────────────────
  { id:"R-101", type:"reactor",     name:"Naphtha Hydrotreater Reactor", position:[17,0,-12],  params:{r:2.1,h:10},   health:84, area:"NHT",         criticality:"Critical", service:"Naphtha + H2",    manufacturer:"KBR",       material:"Cr-Mo Steel 2.25Cr1Mo", installDate:"2006-04-12" },
  { id:"R-102", type:"reactor",     name:"Catalytic Reformer Reactor",   position:[17,0, -3],  params:{r:1.9,h:8},    health:59, area:"CCR",         criticality:"Critical", service:"Naphtha Reforming",manufacturer:"UOP",       material:"SS 347",                installDate:"2007-11-08" },

  // ── Compressors ─────────────────────────────────────────────────────────────
  { id:"K-101", type:"compressor",  name:"Recycle Gas Compressor",       position:[-13,0, 10], params:{r:1.3,l:5.5},  health:91, area:"HDS",         criticality:"Critical", service:"H2 Rich Gas",    manufacturer:"GE Oil&Gas",material:"Alloy Steel",            installDate:"2008-07-18" },
  { id:"K-102", type:"compressor",  name:"Wet Gas Compressor",           position:[ -6,0, 10], params:{r:1.1,l:4.5},  health:37, area:"FCC",         criticality:"Critical", service:"Wet Gas",        manufacturer:"Siemens",   material:"SS 316",                 installDate:"2009-01-25" },

  // ── Pumps ───────────────────────────────────────────────────────────────────
  { id:"P-101A", type:"pump",       name:"Crude Charge Pump A",          position:[-14,0, -1], params:{},            health:55, area:"CDU",          criticality:"High",   service:"Crude Oil",     manufacturer:"Flowserve",  material:"ASTM A395",    installDate:"2010-03-01" },
  { id:"P-101B", type:"pump",       name:"Crude Charge Pump B",          position:[-12,0, -1], params:{},            health:88, area:"CDU",          criticality:"High",   service:"Crude Oil",     manufacturer:"Flowserve",  material:"ASTM A395",    installDate:"2010-03-01" },
  { id:"P-102A", type:"pump",       name:"Reflux Pump A",                position:[  1,0,  7], params:{},            health:93, area:"CDU",          criticality:"High",   service:"Reflux",        manufacturer:"Sulzer",     material:"SS 316",       installDate:"2011-06-15" },
  { id:"P-102B", type:"pump",       name:"Reflux Pump B",                position:[  3,0,  7], params:{},            health:70, area:"CDU",          criticality:"High",   service:"Reflux",        manufacturer:"Sulzer",     material:"SS 316",       installDate:"2011-06-15" },
  { id:"P-201A", type:"pump",       name:"Vacuum Residue Pump A",        position:[  9,0,  7], params:{},            health:46, area:"VDU",          criticality:"High",   service:"Vacuum Residue",manufacturer:"Flowserve",  material:"ASTM A395",    installDate:"2007-09-20" },

  // ── Cooling Tower ───────────────────────────────────────────────────────────
  { id:"CT-101", type:"coolingTower", name:"Cooling Water Tower A",      position:[12,0, 16],  params:{w:9,h:9,d:9},  health:79, area:"Utilities",  criticality:"High",   service:"Cooling Water", manufacturer:"Marley",     material:"FRP",          installDate:"2006-08-10" },

  // ── Flare Stack ─────────────────────────────────────────────────────────────
  { id:"F-101", type:"flare",       name:"Main Flare Stack",             position:[24,0,-24],  params:{h:32,r:0.4},   health:96, area:"Flare",       criticality:"High",   service:"Flare Gas",     manufacturer:"NAO",        material:"SS 310",       installDate:"2003-06-01" },
];

// Pipe network – [source_id, target_id, color, label]
export const PIPE_CONNECTIONS = [
  ["T-101","P-101A","#4A9EFF","Crude Feed"],
  ["T-102","P-101B","#4A9EFF","Crude Feed"],
  ["P-101A","E-101","#00D4FF","Preheat Train"],
  ["P-101B","E-101","#00D4FF","Preheat Train"],
  ["E-101","C-201","#00FFAA","CDU Feed"],
  ["E-102","C-201","#00FFAA","CDU OH"],
  ["C-201","E-103","#FFB800","Kerosene"],
  ["C-201","C-202","#FF6E00","Atm. Residue"],
  ["C-202","R-101","#FF6E00","VGO to NHT"],
  ["R-101","K-101","#BF5AF2","Recycle Gas"],
  ["K-102","C-201","#BF5AF2","Wet Gas"],
  ["P-102A","C-201","#00D4FF","Reflux"],
  ["CT-101","E-102","#4A9EFF","CW Supply"],
];
