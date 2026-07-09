import { create } from "zustand";

export const usePlantStore = create((set) => ({
  selectedAsset:  null,
  hoveredAsset:   null,
  sensorData:     {},   // { [equipmentId]: { temp, pressure, vibration, ... } }
  alerts:         [],
  heatMapMode:    null, // "temperature" | "pressure" | "vibration" | null
  droneMode:      false,
  cameraTarget:   null, // { position, target } for GSAP transitions
  searchQuery:    "",
  activeFilters: { area: "all", healthBelow: 100, type: "all", critical: false },

  pendingFilter:  null,  // { riskFilter, autoSelectFirst } — consumed once by target page
  setPendingFilter: (f) => set({ pendingFilter: f }),

  setSelected:    (asset) => set({ selectedAsset: asset }),
  setHovered:     (asset) => set({ hoveredAsset: asset }),
  setSensorData:  (data)  => set({ sensorData: data }),
  patchSensor:    (id, patch) =>
    set((s) => ({ sensorData: { ...s.sensorData, [id]: { ...s.sensorData[id], ...patch } } })),
  setAlerts:      (alerts) => set({ alerts }),
  setHeatMapMode: (m) => set({ heatMapMode: m }),
  setDroneMode:   (v) => set({ droneMode: v }),
  setCameraTarget:(t) => set({ cameraTarget: t }),
  setSearch:      (q) => set({ searchQuery: q }),
  setFilter:      (k, v) =>
    set((s) => ({ activeFilters: { ...s.activeFilters, [k]: v } })),
}));
