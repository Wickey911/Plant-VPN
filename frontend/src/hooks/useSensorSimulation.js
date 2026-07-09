import { useEffect, useRef } from "react";
import { EQUIPMENT } from "../data/equipmentData";
import { usePlantStore } from "../store/plantStore";

// Baseline sensor ranges per equipment type
const BASELINES = {
  tank:        { temp:[35,65],   pressure:[0.5,3],   vibration:[0.1,0.8],  flow:[80,300],  current:[20,60],  voltage:[380,400] },
  column:      { temp:[120,340], pressure:[1,18],    vibration:[0.2,1.2],  flow:[200,800], current:[40,90],  voltage:[380,415] },
  hx:          { temp:[80,220],  pressure:[5,25],    vibration:[0.1,0.5],  flow:[300,900], current:[10,30],  voltage:[380,400] },
  reactor:     { temp:[250,420], pressure:[20,80],   vibration:[0.3,1.5],  flow:[100,400], current:[60,120], voltage:[380,415] },
  compressor:  { temp:[60,140],  pressure:[10,40],   vibration:[1.0,4.5],  flow:[500,2000],current:[80,200], voltage:[380,415] },
  pump:        { temp:[40,90],   pressure:[3,20],    vibration:[0.5,3.5],  flow:[100,500], current:[20,80],  voltage:[380,415] },
  coolingTower:{ temp:[25,45],   pressure:[0.5,3],   vibration:[0.5,2],    flow:[2000,8000],current:[30,80], voltage:[380,400] },
  flare:       { temp:[400,900], pressure:[0.1,1],   vibration:[0.1,0.5],  flow:[50,500],  current:[5,20],   voltage:[220,240] },
};

function rand(min, max) { return min + Math.random() * (max - min); }

function jitter(val, pct = 0.04) {
  return val * (1 + (Math.random() - 0.5) * 2 * pct);
}

function initSensor(eq) {
  const bl = BASELINES[eq.type] || BASELINES.pump;
  // Low health = sensors stressed (higher temp/vibration, lower flow)
  const healthFactor = eq.health / 100;
  return {
    temperature:      rand(...bl.temp)    * (1 + (1 - healthFactor) * 0.3),
    pressure:         rand(...bl.pressure)* (1 + (1 - healthFactor) * 0.2),
    vibration:        rand(...bl.vibration)*(1 + (1 - healthFactor) * 0.8),
    flow:             rand(...bl.flow)    * (0.6 + healthFactor * 0.4),
    motorCurrent:     rand(...bl.current),
    voltage:          rand(...bl.voltage),
    bearingTemp:      rand(40, 120)       * (1 + (1 - healthFactor) * 0.4),
    oilPressure:      rand(1, 6)          * healthFactor,
    motorLoad:        rand(50, 95)        * (0.7 + healthFactor * 0.3),
    rpm:              eq.type === "pump" || eq.type === "compressor"
                        ? rand(1200, 3600) * healthFactor
                        : 0,
    anomalyScore:     1 - healthFactor + Math.random() * 0.1,
    timestamp:        Date.now(),
  };
}

export function useSensorSimulation() {
  const { setSensorData, setAlerts } = usePlantStore();
  const stateRef = useRef({});

  useEffect(() => {
    // Initialise
    const initial = {};
    EQUIPMENT.forEach((eq) => { initial[eq.id] = initSensor(eq); });
    stateRef.current = initial;
    setSensorData({ ...initial });

    // Tick every 1 second
    const interval = setInterval(() => {
      const next = {};
      const newAlerts = [];

      EQUIPMENT.forEach((eq) => {
        const prev = stateRef.current[eq.id] || initSensor(eq);
        const s = {
          temperature:  jitter(prev.temperature, 0.02),
          pressure:     jitter(prev.pressure, 0.015),
          vibration:    jitter(prev.vibration, 0.05),
          flow:         jitter(prev.flow, 0.03),
          motorCurrent: jitter(prev.motorCurrent, 0.02),
          voltage:      jitter(prev.voltage, 0.005),
          bearingTemp:  jitter(prev.bearingTemp, 0.03),
          oilPressure:  jitter(prev.oilPressure, 0.04),
          motorLoad:    jitter(prev.motorLoad, 0.02),
          rpm:          prev.rpm ? jitter(prev.rpm, 0.01) : 0,
          anomalyScore: Math.min(1, Math.max(0, prev.anomalyScore + (Math.random() - 0.5) * 0.01)),
          timestamp:    Date.now(),
        };
        next[eq.id] = s;

        // Generate alert if anomaly high
        if (s.anomalyScore > 0.7 && eq.health < 60) {
          newAlerts.push({
            id:      `${eq.id}-${Date.now()}`,
            assetId: eq.id,
            name:    eq.name,
            severity: eq.health < 40 ? "Critical" : "High",
            message: s.vibration > 3
              ? `High vibration ${s.vibration.toFixed(1)} mm/s`
              : s.temperature > 350
              ? `High temperature ${s.temperature.toFixed(0)}°C`
              : `Anomaly score ${(s.anomalyScore * 100).toFixed(0)}%`,
            ts: new Date().toLocaleTimeString(),
          });
        }
      });

      stateRef.current = next;
      setSensorData({ ...next });
      if (newAlerts.length) setAlerts(newAlerts.slice(0, 8));
    }, 1000);

    return () => clearInterval(interval);
  }, [setSensorData, setAlerts]);
}
