import { create } from "zustand";
import { EQUIPMENT } from "../data/equipmentData";

// ─── Escalation chain ────────────────────────────────────────────────────────
export const ESCALATION_CHAIN = [
  { level: 0, role: "Operator",             delayMin: 0   },
  { level: 1, role: "Maintenance Engineer", delayMin: 15  },
  { level: 2, role: "Shift Supervisor",     delayMin: 30  },
  { level: 3, role: "Area Manager",         delayMin: 60  },
  { level: 4, role: "Maintenance Manager",  delayMin: 120 },
  { level: 5, role: "Plant Manager",        delayMin: 0   }, // Critical only
];

export const ENGINEERS = [
  "J. Martinez — Maintenance Engineer",
  "S. Kumar — Shift Supervisor",
  "A. Chen — Area Manager",
  "R. Patel — Maintenance Manager",
  "D. Williams — Operator",
  "L. Thompson — Instrument Tech",
];

export function computeEscalationLevel(notif, now = Date.now()) {
  if (notif.acknowledged || !["Critical","High","Medium"].includes(notif.priority)) return -1;
  const elapsedMin = (now - notif.timestamp) / 60000;
  if (notif.priority === "Critical" && elapsedMin >= 120) return 5;
  if (elapsedMin >= 120) return 4;
  if (elapsedMin >= 60)  return 3;
  if (elapsedMin >= 30)  return 2;
  if (elapsedMin >= 15)  return 1;
  return 0;
}

// ─── Notification seed ────────────────────────────────────────────────────────
function seed() {
  const now = Date.now();
  const list = [];

  EQUIPMENT.forEach(eq => {
    if (eq.health < 40) {
      list.push({
        id: `N-${eq.id}-CRIT`,
        priority: "Critical",
        area: eq.area,
        assetId: eq.id,
        assetName: eq.name,
        title: `Critical Health Degradation — ${eq.id}`,
        message: `${eq.name} has reached critical threshold at ${eq.health}% health. Vibration and temperature sensors are showing anomalous readings. Immediate inspection and intervention required to prevent unplanned shutdown.`,
        type: "predictive",
        timestamp: now - (20 + Math.random() * 80) * 60000,
        channels: ["email", "push", "teams", "dashboard"],
        acknowledged: false,
        acknowledgedBy: null,
        acknowledgedAt: null,
        assignedTo: null,
        deferred: false,
        deferredUntil: null,
        convertedToWO: false,
        woId: null,
        read: false,
      });
    } else if (eq.health < 55) {
      const acked = Math.random() > 0.55;
      list.push({
        id: `N-${eq.id}-HIGH`,
        priority: "High",
        area: eq.area,
        assetId: eq.id,
        assetName: eq.name,
        title: `High Risk Alert — ${eq.id}`,
        message: `${eq.name} health is at ${eq.health}%. Predictive model flags elevated failure probability within 72 hours. Recommend scheduling inspection and pre-ordering spare parts.`,
        type: "predictive",
        timestamp: now - (40 + Math.random() * 200) * 60000,
        channels: ["email", "push", "dashboard"],
        acknowledged: acked,
        acknowledgedBy: acked ? "J. Martinez" : null,
        acknowledgedAt: acked ? now - 20 * 60000 : null,
        assignedTo: acked ? "J. Martinez — Maintenance Engineer" : null,
        deferred: false,
        deferredUntil: null,
        convertedToWO: false,
        woId: null,
        read: acked,
      });
    } else if (eq.health < 70) {
      const acked = Math.random() > 0.4;
      list.push({
        id: `N-${eq.id}-MED`,
        priority: "Medium",
        area: eq.area,
        assetId: eq.id,
        assetName: eq.name,
        title: `Maintenance Advisory — ${eq.id}`,
        message: `${eq.name} health score is ${eq.health}%. Predictive maintenance window opens within 7 days. Plan inspection to prevent degradation to high-risk level.`,
        type: "predictive",
        timestamp: now - (2 + Math.random() * 10) * 3600000,
        channels: ["email", "dashboard"],
        acknowledged: acked,
        acknowledgedBy: acked ? "S. Kumar" : null,
        acknowledgedAt: acked ? now - 3600000 : null,
        assignedTo: null,
        deferred: false,
        deferredUntil: null,
        convertedToWO: false,
        woId: null,
        read: acked,
      });
    } else if (eq.health > 90) {
      list.push({
        id: `N-${eq.id}-OK`,
        priority: "Success",
        area: eq.area,
        assetId: eq.id,
        assetName: eq.name,
        title: `Health Check Passed — ${eq.id}`,
        message: `${eq.name} is operating nominally at ${eq.health}% health. All sensor parameters within acceptable range. No action required.`,
        type: "system",
        timestamp: now - (4 + Math.random() * 20) * 3600000,
        channels: ["dashboard"],
        acknowledged: true,
        acknowledgedBy: "System",
        acknowledgedAt: now - 4 * 3600000,
        assignedTo: null,
        deferred: false,
        deferredUntil: null,
        convertedToWO: false,
        woId: null,
        read: true,
      });
    }
  });

  // System / report notifications
  const crit = EQUIPMENT.filter(e => e.health < 40).length;
  const attn = EQUIPMENT.filter(e => e.health >= 40 && e.health < 70).length;
  const good = EQUIPMENT.filter(e => e.health >= 80).length;

  list.push(
    {
      id: "N-REPORT-DAILY",
      priority: "Information",
      area: "All",
      assetId: null,
      assetName: null,
      title: "Daily Predictive Maintenance Report Ready",
      message: `AI-generated daily report is available. Summary: ${crit} critical, ${attn} requiring attention, ${good} healthy assets across ${EQUIPMENT.length} equipment items. Full report sent to registered recipients.`,
      type: "report",
      timestamp: now - 6 * 3600000,
      channels: ["email", "teams", "dashboard"],
      acknowledged: true,
      acknowledgedBy: "System",
      acknowledgedAt: now - 6 * 3600000,
      assignedTo: null,
      deferred: false,
      deferredUntil: null,
      convertedToWO: false,
      woId: null,
      read: true,
    },
    {
      id: "N-AI-RETRAIN",
      priority: "Information",
      area: "All",
      assetId: null,
      assetName: null,
      title: "AI Model Retraining Complete",
      message: "PlantMind AI model successfully retrained on 20-year PdM dataset. Prediction accuracy: 94.2% (↑ 1.8%). Failure forecasting window extended to 45 days. All asset risk scores have been recalculated.",
      type: "system",
      timestamp: now - 24 * 3600000,
      channels: ["dashboard"],
      acknowledged: true,
      acknowledgedBy: "System",
      acknowledgedAt: now - 24 * 3600000,
      assignedTo: null,
      deferred: false,
      deferredUntil: null,
      convertedToWO: false,
      woId: null,
      read: true,
    },
    {
      id: "N-WEEKLY-SCHED",
      priority: "Information",
      area: "All",
      assetId: null,
      assetName: null,
      title: "Weekly Report Scheduled — Monday 06:00",
      message: "Weekly maintenance summary report is scheduled for delivery next Monday at 06:00. Recipients: Maintenance Manager, Area Managers, Shift Supervisors. Report includes RUL analysis, cost forecasting, and KPI trends.",
      type: "report",
      timestamp: now - 2 * 24 * 3600000,
      channels: ["email", "teams"],
      acknowledged: true,
      acknowledgedBy: "System",
      acknowledgedAt: now - 2 * 24 * 3600000,
      assignedTo: null,
      deferred: false,
      deferredUntil: null,
      convertedToWO: false,
      woId: null,
      read: true,
    }
  );

  const order = { Critical: 0, High: 1, Medium: 2, Information: 3, Success: 4 };
  return list.sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return (order[a.priority] - order[b.priority]) || (b.timestamp - a.timestamp);
  });
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useNotificationStore = create((set, get) => ({
  notifications: seed(),
  isOpen: false,
  selectedId: null,
  priorityFilter: "All",
  areaFilter: "All",
  statusFilter: "Unread",

  openCenter:        () => set({ isOpen: true }),
  closeCenter:       () => set({ isOpen: false }),
  selectNotif:       (id) => set(s => ({
    selectedId: id,
    notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
  })),
  setPriorityFilter: (f) => set({ priorityFilter: f }),
  setAreaFilter:     (a) => set({ areaFilter: a }),
  setStatusFilter:   (s) => set({ statusFilter: s }),

  acknowledge: (id) => set(s => ({
    notifications: s.notifications.map(n =>
      n.id === id
        ? { ...n, acknowledged: true, acknowledgedBy: "You", acknowledgedAt: Date.now(), read: true }
        : n
    ),
  })),

  assignTo: (id, engineer) => set(s => ({
    notifications: s.notifications.map(n =>
      n.id === id ? { ...n, assignedTo: engineer, read: true } : n
    ),
  })),

  defer: (id, hours) => set(s => ({
    notifications: s.notifications.map(n =>
      n.id === id
        ? { ...n, deferred: true, deferredUntil: Date.now() + hours * 3600000, read: true }
        : n
    ),
  })),

  convertToWO: (id) => {
    const woId = `WO-${Math.floor(Math.random() * 9000) + 1000}`;
    set(s => ({
      notifications: s.notifications.map(n =>
        n.id === id ? { ...n, convertedToWO: true, woId, read: true } : n
      ),
    }));
    return woId;
  },

  getUnread:   () => get().notifications.filter(n => !n.read).length,
  getCritical: () => get().notifications.filter(n => n.priority === "Critical" && !n.acknowledged).length,
}));
