import { useRef, useMemo, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { BOILER_EQUIPMENT } from "../../data/boilerData";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function healthColor(h) {
  if (h > 90) return "#00FF94";
  if (h > 75) return "#90EE90";
  if (h > 60) return "#FFD700";
  if (h > 40) return "#FF6600";
  return "#FF2D55";
}

function mat(color, metalness = 0.7, roughness = 0.35, emissive = "#000") {
  return <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} emissive={emissive} />;
}

// Flange disc
function Flange({ pos, axis = "y", r = 0.12, t = 0.025 }) {
  const rot = axis === "x" ? [0, 0, Math.PI / 2] : axis === "z" ? [Math.PI / 2, 0, 0] : [0, 0, 0];
  return (
    <mesh position={pos} rotation={rot} castShadow>
      <cylinderGeometry args={[r * 1.7, r * 1.7, t, 16]} />
      <meshStandardMaterial color="#5a6070" metalness={0.8} roughness={0.2} />
    </mesh>
  );
}

// Nozzle with flange
function Nozzle({ position, direction = [0, 1, 0], length = 0.25, r = 0.06 }) {
  const dir = new THREE.Vector3(...direction).normalize();
  const axis = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(axis, dir);
  const mid = [position[0] + dir.x * length / 2, position[1] + dir.y * length / 2, position[2] + dir.z * length / 2];
  const tip = [position[0] + dir.x * length, position[1] + dir.y * length, position[2] + dir.z * length];
  return (
    <group>
      <mesh position={mid} quaternion={q} castShadow>
        <cylinderGeometry args={[r, r, length, 10]} />
        <meshStandardMaterial color="#7a8090" metalness={0.85} roughness={0.2} />
      </mesh>
      <Flange pos={tip} axis={direction[0] !== 0 ? "x" : direction[2] !== 0 ? "z" : "y"} r={r} />
    </group>
  );
}

// Ladder along side of vessel
function Ladder({ x, z, y0, y1, side = "x" }) {
  const rungs = [];
  for (let y = y0 + 0.4; y < y1; y += 0.35) {
    rungs.push(y);
  }
  const rungLen = 0.28;
  return (
    <group>
      {/* rails */}
      <mesh position={[x + (side === "x" ? 0.14 : 0), (y0 + y1) / 2, z + (side === "z" ? 0.14 : -0.1)]} castShadow>
        <boxGeometry args={[0.03, y1 - y0, 0.03]} />
        <meshStandardMaterial color="#556677" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[x + (side === "x" ? -0.14 : 0), (y0 + y1) / 2, z + (side === "z" ? -0.14 : 0.1)]} castShadow>
        <boxGeometry args={[0.03, y1 - y0, 0.03]} />
        <meshStandardMaterial color="#556677" metalness={0.6} roughness={0.4} />
      </mesh>
      {rungs.map((y, i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <boxGeometry args={[rungLen, 0.02, 0.04]} />
          <meshStandardMaterial color="#445566" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// Platform ring
function Platform({ y, x, z, rx, rz }) {
  return (
    <group position={[x, y, z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[Math.max(rx, rz) + 0.12, 0.04, 6, 32]} />
        <meshStandardMaterial color="#3a4a5a" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

// Handrail post + rail
function Handrail({ points, height = 1.1 }) {
  return (
    <group>
      {points.map((p, i) => (
        <mesh key={i} position={[p[0], p[1] + height / 2, p[2]]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, height, 6]} />
          <meshStandardMaterial color="#556677" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {points.length > 1 && points.map((p, i) => {
        if (i === points.length - 1) return null;
        const n = points[i + 1];
        const mid = [(p[0] + n[0]) / 2, p[1] + height, (p[2] + n[2]) / 2];
        const len = Math.sqrt((n[0] - p[0]) ** 2 + (n[2] - p[2]) ** 2);
        const angle = Math.atan2(n[2] - p[2], n[0] - p[0]);
        return (
          <mesh key={`r${i}`} position={mid} rotation={[0, -angle, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, len, 6]} />
            <meshStandardMaterial color="#445566" metalness={0.6} roughness={0.4} />
          </mesh>
        );
      })}
    </group>
  );
}

// Pipe segment with flanges
function Pipe({ p1, p2, r = 0.06, color = "#6a7a8a" }) {
  const v1 = new THREE.Vector3(...p1);
  const v2 = new THREE.Vector3(...p2);
  const dir = v2.clone().sub(v1);
  const len = dir.length();
  const mid = v1.clone().add(dir.clone().multiplyScalar(0.5));
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return (
    <group>
      <mesh position={mid.toArray()} quaternion={q} castShadow>
        <cylinderGeometry args={[r, r, len, 10]} />
        <meshStandardMaterial color={color} metalness={0.75} roughness={0.3} />
      </mesh>
      <Flange pos={p1} r={r * 1.6} />
      <Flange pos={p2} r={r * 1.6} />
    </group>
  );
}

// Insulation wrapper
function Insulation({ position, rx, rz, height, color = "#c8b89a" }) {
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[Math.max(rx, rz) + 0.06, Math.max(rx, rz) + 0.06, height, 20]} />
      <meshStandardMaterial color={color} metalness={0.05} roughness={0.85} side={THREE.BackSide} />
    </mesh>
  );
}

// Status indicator ring (blinking if critical)
function StatusRing({ position, health, radius }) {
  const ref = useRef();
  const col = healthColor(health);
  useFrame(({ clock }) => {
    if (ref.current && health < 60) {
      ref.current.material.emissiveIntensity = 0.5 + Math.sin(clock.elapsedTime * 6) * 0.5;
    }
  });
  return (
    <mesh ref={ref} position={position} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius + 0.05, 0.04, 8, 32]} />
      <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.6} metalness={0.2} roughness={0.4} />
    </mesh>
  );
}

// ─── Equipment Components ────────────────────────────────────────────────────

function SteamDrum({ eq, onClick, hovered, setHovered }) {
  const { position: p, dims, health } = eq;
  const [px, py, pz] = p;
  const { length: L, od } = dims;
  const r = od / 2;
  const isHov = hovered === eq.id;

  return (
    <group position={[px, py, pz]} onClick={e => { e.stopPropagation(); onClick(eq); }}
      onPointerOver={e => { e.stopPropagation(); setHovered(eq.id); }}
      onPointerOut={() => setHovered(null)}>
      {/* Shell */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[r, r, L, 32]} />
        <meshStandardMaterial color={isHov ? "#7ab0d0" : "#8090a0"} metalness={0.75} roughness={0.25} />
      </mesh>
      {/* Dish ends */}
      {[-L / 2, L / 2].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <sphereGeometry args={[r, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#7a8898" metalness={0.75} roughness={0.25} />
        </mesh>
      ))}
      {/* Insulation band */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[r + 0.06, r + 0.06, L * 0.9, 20]} />
        <meshStandardMaterial color="#c8b89a" metalness={0.05} roughness={0.85} opacity={0.6} transparent />
      </mesh>
      {/* Manhole */}
      <mesh position={[0, r + 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.25, 16]} />
        <meshStandardMaterial color="#6a7a8a" metalness={0.7} roughness={0.3} />
      </mesh>
      <Flange pos={[0, r + 0.25, 0]} r={0.32} />
      {/* Nozzles */}
      <Nozzle position={[L * 0.3, r, 0]} direction={[0, 1, 0]} length={0.3} r={0.08} />
      <Nozzle position={[-L * 0.2, r, 0]} direction={[0, 1, 0]} length={0.25} r={0.06} />
      <Nozzle position={[L * 0.1, -r, 0]} direction={[0, -1, 0]} length={0.2} r={0.04} />
      <Nozzle position={[-L * 0.3, r, 0]} direction={[0, 1, 0]} length={0.2} r={0.04} />
      {/* Saddle supports */}
      {[-L * 0.3, L * 0.3].map((x, i) => (
        <mesh key={i} position={[x, -r - 0.5, 0]} castShadow>
          <boxGeometry args={[0.6, 1.0, r * 2 + 0.2]} />
          <meshStandardMaterial color="#445566" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {/* Lifting lugs */}
      {[-L * 0.1, L * 0.1].map((x, i) => (
        <mesh key={i} position={[x, r + 0.06, 0]} castShadow>
          <boxGeometry args={[0.12, 0.12, 0.4]} />
          <meshStandardMaterial color="#556677" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      <StatusRing position={[0, 0, 0]} health={health} radius={r + 0.1} />
      {isHov && (
        <Html position={[0, r + 0.7, 0]} center style={{ pointerEvents: "none" }}>
          <div style={{ background: "rgba(5,12,22,0.9)", border: "1px solid #00C8F0", padding: "4px 8px", borderRadius: 4, color: "#fff", fontSize: 10, whiteSpace: "nowrap" }}>
            <b style={{ color: "#00C8F0" }}>{eq.tag}</b> — {eq.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function MudDrum({ eq, onClick, hovered, setHovered }) {
  const { position: p, dims, health } = eq;
  const [px, py, pz] = p;
  const { length: L, od } = dims;
  const r = od / 2;
  const isHov = hovered === eq.id;
  return (
    <group position={[px, py, pz]} onClick={e => { e.stopPropagation(); onClick(eq); }}
      onPointerOver={e => { e.stopPropagation(); setHovered(eq.id); }}
      onPointerOut={() => setHovered(null)}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[r, r, L, 28]} />
        <meshStandardMaterial color={isHov ? "#6a90a8" : "#708090"} metalness={0.75} roughness={0.3} />
      </mesh>
      {[-L / 2, L / 2].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <sphereGeometry args={[r, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#607080" metalness={0.75} roughness={0.3} />
        </mesh>
      ))}
      <Nozzle position={[0, -r, 0]} direction={[0, -1, 0]} length={0.3} r={0.05} />
      <Nozzle position={[L * 0.2, -r, 0]} direction={[0, -1, 0]} length={0.25} r={0.04} />
      {[-L * 0.25, L * 0.25].map((x, i) => (
        <mesh key={i} position={[x, -r - 0.4, 0]} castShadow>
          <boxGeometry args={[0.5, 0.8, r * 2]} />
          <meshStandardMaterial color="#445566" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      <StatusRing position={[0, 0, 0]} health={health} radius={r + 0.05} />
      {isHov && (
        <Html position={[0, r + 0.5, 0]} center style={{ pointerEvents: "none" }}>
          <div style={{ background: "rgba(5,12,22,0.9)", border: "1px solid #00C8F0", padding: "4px 8px", borderRadius: 4, color: "#fff", fontSize: 10, whiteSpace: "nowrap" }}>
            <b style={{ color: "#00C8F0" }}>{eq.tag}</b> — {eq.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function WaterWallTubes({ eq, onClick, hovered, setHovered }) {
  const { health } = eq;
  const isHov = hovered === eq.id;
  const tubeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#5a6a80", metalness: 0.8, roughness: 0.2 }), []);
  const count = 64; // tubes per wall × 4 walls
  const wallH = 16;
  const tubeR = 0.025;

  const tubeData = useMemo(() => {
    const data = [];
    const walls = [
      { axis: "z", offset: 3.0, norm: [1, 0, 0] },
      { axis: "z", offset: -3.0, norm: [-1, 0, 0] },
      { axis: "x", offset: 3.5, norm: [0, 0, 1] },
      { axis: "x", offset: -3.5, norm: [0, 0, -1] },
    ];
    walls.forEach(w => {
      for (let i = 0; i < 16; i++) {
        const t = (i - 7.5) * 0.35;
        data.push({ axis: w.axis, offset: w.offset, t, norm: w.norm });
      }
    });
    return data;
  }, []);

  return (
    <group position={[0, 10, 0]} onClick={e => { e.stopPropagation(); onClick(eq); }}
      onPointerOver={e => { e.stopPropagation(); setHovered(eq.id); }}
      onPointerOut={() => setHovered(null)}>
      {tubeData.map((d, i) => (
        <mesh key={i}
          position={d.axis === "z" ? [d.offset, 0, d.t] : [d.t, 0, d.offset]}
          castShadow>
          <cylinderGeometry args={[tubeR, tubeR, wallH, 6]} />
          <primitive object={tubeMat} />
        </mesh>
      ))}
      {/* Membrane bars between tubes (simplified) */}
      {[-3, 3].map((x, i) => (
        <mesh key={`mb${i}`} position={[x, 0, 0]} castShadow>
          <boxGeometry args={[0.01, wallH, 5.4]} />
          <meshStandardMaterial color="#4a5a6a" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
      {isHov && (
        <Html position={[0, 10, 0]} center style={{ pointerEvents: "none" }}>
          <div style={{ background: "rgba(5,12,22,0.9)", border: "1px solid #FFD700", padding: "4px 8px", borderRadius: 4, color: "#fff", fontSize: 10, whiteSpace: "nowrap" }}>
            <b style={{ color: "#FFD700" }}>{eq.tag}</b> — {eq.name}<br />
            <span style={{ color: "#FF6600" }}>Health: {health}% — Tube thinning detected N-panel</span>
          </div>
        </Html>
      )}
    </group>
  );
}

function Furnace({ eq, onClick, hovered, setHovered }) {
  const isHov = hovered === eq.id;
  const { dims } = eq;
  const { width: w, depth: d, height: h } = dims;
  const wallT = 0.15;
  return (
    <group position={[0, h / 2, 0]} onClick={e => { e.stopPropagation(); onClick(eq); }}
      onPointerOver={e => { e.stopPropagation(); setHovered(eq.id); }}
      onPointerOut={() => setHovered(null)}>
      {/* Four furnace walls (hollow box) */}
      {[
        { pos: [0, 0, d / 2], rot: [0, 0, 0], size: [w, h, wallT] },
        { pos: [0, 0, -d / 2], rot: [0, 0, 0], size: [w, h, wallT] },
        { pos: [w / 2, 0, 0], rot: [0, 0, 0], size: [wallT, h, d] },
        { pos: [-w / 2, 0, 0], rot: [0, 0, 0], size: [wallT, h, d] },
      ].map((s, i) => (
        <mesh key={i} position={s.pos} rotation={s.rot} castShadow receiveShadow>
          <boxGeometry args={s.size} />
          <meshStandardMaterial color={isHov ? "#3a5060" : "#2d3a48"} metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
      {/* Hopper bottom */}
      <mesh position={[0, -h / 2 + 0.5, 0]} castShadow>
        <boxGeometry args={[w * 0.6, 1.0, d * 0.6]} />
        <meshStandardMaterial color="#253040" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Boiler casing outer steel */}
      <mesh castShadow>
        <boxGeometry args={[w + wallT * 2, h, d + wallT * 2]} />
        <meshStandardMaterial color="#3a4050" metalness={0.5} roughness={0.6} wireframe={false} side={THREE.BackSide} />
      </mesh>
      {/* Furnace glow interior */}
      <pointLight position={[0, -2, 0]} color="#FF6600" intensity={3} distance={8} decay={2} />
      {isHov && (
        <Html position={[0, h / 2 + 0.5, 0]} center style={{ pointerEvents: "none" }}>
          <div style={{ background: "rgba(5,12,22,0.9)", border: "1px solid #FF9500", padding: "4px 8px", borderRadius: 4, color: "#fff", fontSize: 10, whiteSpace: "nowrap" }}>
            <b style={{ color: "#FF9500" }}>{eq.tag}</b> — {eq.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function Superheater({ eq, onClick, hovered, setHovered }) {
  const { position: p, dims, health } = eq;
  const [px, py, pz] = p;
  const isHov = hovered === eq.id;
  const coils = dims.coils || 20;
  return (
    <group position={[px, py, pz]} onClick={e => { e.stopPropagation(); onClick(eq); }}
      onPointerOver={e => { e.stopPropagation(); setHovered(eq.id); }}
      onPointerOut={() => setHovered(null)}>
      {/* Pendant coil bank */}
      {Array.from({ length: coils }).map((_, i) => {
        const x = (i - coils / 2) * 0.25;
        return (
          <group key={i}>
            <mesh position={[x, -1.5, 0]} castShadow>
              <cylinderGeometry args={[0.02, 0.02, 3, 6]} />
              <meshStandardMaterial color="#9aafbf" metalness={0.85} roughness={0.15} />
            </mesh>
            <mesh position={[x, -3.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <torusGeometry args={[0.12, 0.02, 6, 12, Math.PI]} />
              <meshStandardMaterial color="#9aafbf" metalness={0.85} roughness={0.15} />
            </mesh>
          </group>
        );
      })}
      {/* Inlet / outlet headers */}
      {[2.8, -2.8].map((z, i) => (
        <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, dims.width || 6, 16]} />
          <meshStandardMaterial color="#7a8898" metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
      {/* Tube hangers */}
      {Array.from({ length: 8 }).map((_, i) => {
        const x = (i - 3.5) * 0.7;
        return (
          <mesh key={i} position={[x, 0.2, 0]} castShadow>
            <boxGeometry args={[0.04, 0.4, 0.04]} />
            <meshStandardMaterial color="#556677" metalness={0.7} roughness={0.3} />
          </mesh>
        );
      })}
      <StatusRing position={[0, 0, 0]} health={health} radius={0.5} />
      {isHov && (
        <Html position={[0, 1, 0]} center style={{ pointerEvents: "none" }}>
          <div style={{ background: "rgba(5,12,22,0.9)", border: "1px solid #00C8F0", padding: "4px 8px", borderRadius: 4, color: "#fff", fontSize: 10, whiteSpace: "nowrap" }}>
            <b style={{ color: "#00C8F0" }}>{eq.tag}</b> — {eq.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function Economizer({ eq, onClick, hovered, setHovered }) {
  const { position: p, dims, health } = eq;
  const [px, py, pz] = p;
  const isHov = hovered === eq.id;
  const rows = dims.rows || 14;
  return (
    <group position={[px, py, pz]} onClick={e => { e.stopPropagation(); onClick(eq); }}
      onPointerOver={e => { e.stopPropagation(); setHovered(eq.id); }}
      onPointerOut={() => setHovered(null)}>
      {/* Finned tube bank */}
      {Array.from({ length: rows }).map((_, i) => {
        const z = (i - rows / 2) * 0.14;
        return (
          <group key={i}>
            <mesh position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.019, 0.019, dims.width || 5, 8]} />
              <meshStandardMaterial color="#8a9aaa" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Fins */}
            {Array.from({ length: 8 }).map((_, fi) => {
              const fy = (fi - 3.5) * 0.55;
              return (
                <mesh key={fi} position={[fy, 0, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[0.045, 0.045, 0.012, 8]} />
                  <meshStandardMaterial color="#6a7a8a" metalness={0.75} roughness={0.3} />
                </mesh>
              );
            })}
          </group>
        );
      })}
      {/* Headers */}
      {[2.7, -2.7].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, dims.depth + 0.4 || 2.4, 14]} />
          <meshStandardMaterial color="#5a6a7a" metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
      <StatusRing position={[0, 0, 0]} health={health} radius={0.6} />
      {isHov && (
        <Html position={[0, 1, 0]} center style={{ pointerEvents: "none" }}>
          <div style={{ background: "rgba(5,12,22,0.9)", border: "1px solid #00FF94", padding: "4px 8px", borderRadius: 4, color: "#fff", fontSize: 10, whiteSpace: "nowrap" }}>
            <b style={{ color: "#00FF94" }}>{eq.tag}</b> — {eq.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function AirPreheater({ eq, onClick, hovered, setHovered }) {
  const { position: p, dims, health } = eq;
  const [px, py, pz] = p;
  const isHov = hovered === eq.id;
  const rotorRef = useRef();
  const gearRef = useRef();
  useFrame((_, dt) => {
    if (rotorRef.current) rotorRef.current.rotation.y += dt * 0.05;
    if (gearRef.current) gearRef.current.rotation.y -= dt * 1.6;
  });
  const r = (dims.rotorDia || 5.5) / 2;
  return (
    <group position={[px, py, pz]} onClick={e => { e.stopPropagation(); onClick(eq); }}
      onPointerOver={e => { e.stopPropagation(); setHovered(eq.id); }}
      onPointerOut={() => setHovered(null)}>
      {/* Housing top/bottom */}
      {[dims.height / 2, -dims.height / 2].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow>
          <cylinderGeometry args={[r + 0.3, r + 0.3, 0.12, 32]} />
          <meshStandardMaterial color="#4a5a6a" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {/* Outer housing cylinder */}
      <mesh castShadow>
        <cylinderGeometry args={[r + 0.3, r + 0.3, dims.height || 1.8, 32]} />
        <meshStandardMaterial color="#3a4a5a" metalness={0.5} roughness={0.5} opacity={0.5} transparent />
      </mesh>
      {/* Rotor */}
      <group ref={rotorRef}>
        <mesh castShadow>
          <cylinderGeometry args={[r, r, dims.height - 0.1 || 1.6, 32]} />
          <meshStandardMaterial color="#8090a0" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Element basket sectors */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(angle) * r * 0.6, 0, Math.sin(angle) * r * 0.6]} castShadow>
              <boxGeometry args={[0.12, dims.height - 0.15 || 1.5, r * 0.8]} />
              <meshStandardMaterial color={health < 80 ? "#c0a050" : "#708090"} metalness={0.5} roughness={0.5} />
            </mesh>
          );
        })}
      </group>
      {/* Drive motor */}
      <mesh position={[r + 0.6, -0.2, 0]} castShadow>
        <boxGeometry args={[0.5, 0.4, 0.4]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Gearbox */}
      <mesh ref={gearRef} position={[r + 0.3, -0.2, 0]} castShadow>
        <boxGeometry args={[0.25, 0.35, 0.35]} />
        <meshStandardMaterial color="#1a2a3a" metalness={0.9} roughness={0.1} />
      </mesh>
      <StatusRing position={[0, 0, 0]} health={health} radius={r + 0.35} />
      {isHov && (
        <Html position={[0, dims.height, 0]} center style={{ pointerEvents: "none" }}>
          <div style={{ background: "rgba(5,12,22,0.9)", border: "1px solid #FFD700", padding: "4px 8px", borderRadius: 4, color: "#fff", fontSize: 10, whiteSpace: "nowrap" }}>
            <b style={{ color: "#FFD700" }}>{eq.tag}</b> — {eq.name}<br />
            <span style={{ color: "#FF6600" }}>Vibration: 4.2 mm/s (ALARM)</span>
          </div>
        </Html>
      )}
    </group>
  );
}

function Burner({ eq, onClick, hovered, setHovered }) {
  const { position: p, dims, health } = eq;
  const [px, py, pz] = p;
  const isHov = hovered === eq.id;
  const flameRef = useRef();
  useFrame(({ clock }) => {
    if (flameRef.current) {
      const s = 0.85 + Math.sin(clock.elapsedTime * 12) * 0.15;
      flameRef.current.scale.set(s, 1 + Math.sin(clock.elapsedTime * 8) * 0.2, s);
      flameRef.current.material.emissiveIntensity = 1.2 + Math.sin(clock.elapsedTime * 10) * 0.4;
    }
  });
  return (
    <group position={[px, py, pz]} onClick={e => { e.stopPropagation(); onClick(eq); }}
      onPointerOver={e => { e.stopPropagation(); setHovered(eq.id); }}
      onPointerOut={() => setHovered(null)}>
      {/* Wind box */}
      <mesh castShadow>
        <boxGeometry args={[1.2, 1.0, 0.8]} />
        <meshStandardMaterial color="#4a5a6a" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Burner throat */}
      <mesh position={[0.7, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.28, 0.22, 0.4, 16]} />
        <meshStandardMaterial color="#3a4a5a" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Swirl vanes */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[0.72, Math.sin(a) * 0.18, Math.cos(a) * 0.18]} rotation={[a, 0.4, 0]} castShadow>
            <boxGeometry args={[0.08, 0.02, 0.14]} />
            <meshStandardMaterial color="#7a8a9a" metalness={0.8} roughness={0.2} />
          </mesh>
        );
      })}
      {/* Flame */}
      <mesh ref={flameRef} position={[1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <coneGeometry args={[0.25, 0.8, 8]} />
        <meshStandardMaterial color="#FF6600" emissive="#FF4400" emissiveIntensity={1.2} transparent opacity={0.85} />
      </mesh>
      {/* Igniter */}
      <mesh position={[0.5, 0.22, 0]} rotation={[0, 0, -0.3]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.35, 6]} />
        <meshStandardMaterial color="#8a4a2a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* UV scanner */}
      <mesh position={[0.3, -0.22, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
        <meshStandardMaterial color="#2a2a4a" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Piping stubs */}
      <Nozzle position={[-0.6, 0.2, 0]} direction={[-1, 0, 0]} length={0.3} r={0.04} />
      <Nozzle position={[-0.6, -0.2, 0]} direction={[-1, 0, 0]} length={0.3} r={0.03} />
      {isHov && (
        <Html position={[0, 0.8, 0]} center style={{ pointerEvents: "none" }}>
          <div style={{ background: "rgba(5,12,22,0.9)", border: "1px solid #FF9500", padding: "4px 8px", borderRadius: 4, color: "#fff", fontSize: 10, whiteSpace: "nowrap" }}>
            <b style={{ color: "#FF9500" }}>{eq.tag}</b> — {eq.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function Fan({ eq, onClick, hovered, setHovered, speed = 1 }) {
  const { position: p, dims, health, id } = eq;
  const [px, py, pz] = p;
  const isHov = hovered === id;
  const impRef = useRef();
  useFrame((_, dt) => {
    if (impRef.current) impRef.current.rotation.x += dt * speed * 3;
  });
  const r = (dims.casingDia || 2.2) / 2;
  const L = dims.length || 3.5;
  return (
    <group position={[px, py, pz]} onClick={e => { e.stopPropagation(); onClick(eq); }}
      onPointerOver={e => { e.stopPropagation(); setHovered(id); }}
      onPointerOut={() => setHovered(null)}>
      {/* Scroll casing */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[r, r, L * 0.6, 24]} />
        <meshStandardMaterial color={id === "IDF-001" ? "#556070" : "#4a5a6a"} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Inlet cone */}
      <mesh position={[-L * 0.4, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <coneGeometry args={[r * 0.7, L * 0.3, 20]} />
        <meshStandardMaterial color="#3a4a5a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Impeller */}
      <group ref={impRef} position={[0, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[r * 0.85, r * 0.85, 0.12, 24]} />
          <meshStandardMaterial color="#8090a0" metalness={0.8} roughness={0.2} />
        </mesh>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * r * 0.5, 0, Math.sin(a) * r * 0.5]} rotation={[a, 0.3, 0]} castShadow>
              <boxGeometry args={[0.06, r * 0.7, 0.12]} />
              <meshStandardMaterial color={id === "IDF-001" ? "#6a5040" : "#708090"} metalness={0.85} roughness={0.15} />
            </mesh>
          );
        })}
      </group>
      {/* Motor */}
      <mesh position={[L * 0.5, 0, 0]} castShadow>
        <cylinderGeometry args={[r * 0.45, r * 0.45, L * 0.5, 18]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.85} roughness={0.15} />
      </mesh>
      {/* Base frame */}
      <mesh position={[0, -r - 0.15, 0]} castShadow>
        <boxGeometry args={[L, 0.3, r * 2 + 0.3]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.6} roughness={0.5} />
      </mesh>
      {/* VFD box */}
      <mesh position={[L * 0.5 + 0.5, 0.4, 0]} castShadow>
        <boxGeometry args={[0.5, 0.8, 0.4]} />
        <meshStandardMaterial color="#1a2a1a" metalness={0.7} roughness={0.3} emissive="#004400" emissiveIntensity={0.3} />
      </mesh>
      <StatusRing position={[0, 0, 0]} health={health} radius={r + 0.08} />
      {isHov && (
        <Html position={[0, r + 0.6, 0]} center style={{ pointerEvents: "none" }}>
          <div style={{ background: "rgba(5,12,22,0.9)", border: "1px solid #00C8F0", padding: "4px 8px", borderRadius: 4, color: "#fff", fontSize: 10, whiteSpace: "nowrap" }}>
            <b style={{ color: "#00C8F0" }}>{eq.tag}</b> — {eq.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function Stack({ eq, onClick, hovered, setHovered }) {
  const { position: p, dims, health } = eq;
  const [px, py, pz] = p;
  const isHov = hovered === eq.id;
  const { baseOD, topOD, height } = dims;
  return (
    <group position={[px, py, pz]} onClick={e => { e.stopPropagation(); onClick(eq); }}
      onPointerOver={e => { e.stopPropagation(); setHovered(eq.id); }}
      onPointerOut={() => setHovered(null)}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[topOD / 2, baseOD / 2, height, 20]} />
        <meshStandardMaterial color="#4a5060" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Access platforms */}
      {[15, 30, 45].map((h, i) => (
        <group key={i} position={[0, h, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[baseOD / 2 + 0.6, 0.04, 6, 24]} />
            <meshStandardMaterial color="#3a4a5a" metalness={0.5} roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* Aviation lights */}
      {[height * 0.5, height].map((h, i) => (
        <mesh key={i} position={[0, h, 0]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={2} />
        </mesh>
      ))}
      {/* CEMS probe */}
      <Nozzle position={[baseOD / 2, 8, 0]} direction={[1, 0, 0]} length={0.5} r={0.04} />
      {/* Guy wires */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((a, i) => (
        <Line key={i}
          points={[[Math.cos(a) * (baseOD + 8), 0, Math.sin(a) * (baseOD + 8)], [0, height * 0.7, 0]]}
          color="#445566" lineWidth={1} />
      ))}
      {isHov && (
        <Html position={[0, height + 1, 0]} center style={{ pointerEvents: "none" }}>
          <div style={{ background: "rgba(5,12,22,0.9)", border: "1px solid #00FF94", padding: "4px 8px", borderRadius: 4, color: "#fff", fontSize: 10, whiteSpace: "nowrap" }}>
            <b style={{ color: "#00FF94" }}>{eq.tag}</b> — {eq.name} ({height}m)
          </div>
        </Html>
      )}
    </group>
  );
}

function BoilerFeedPump({ eq, onClick, hovered, setHovered }) {
  const { position: p, dims, health } = eq;
  const [px, py, pz] = p;
  const isHov = hovered === eq.id;
  const shaftRef = useRef();
  useFrame((_, dt) => { if (shaftRef.current) shaftRef.current.rotation.x += dt * 5; });
  return (
    <group position={[px, py, pz]} onClick={e => { e.stopPropagation(); onClick(eq); }}
      onPointerOver={e => { e.stopPropagation(); setHovered(eq.id); }}
      onPointerOut={() => setHovered(null)}>
      {/* Baseplate */}
      <mesh position={[0, -0.45, 0]} castShadow>
        <boxGeometry args={[dims.length + 0.3, 0.1, dims.width + 0.2]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Multi-stage pump body */}
      <mesh position={[-0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.32, 0.32, dims.length * 0.65, 20]} />
        <meshStandardMaterial color={isHov ? "#6a7a9a" : "#5a6a80"} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Stage rings */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[-0.6 + (i - 2.5) * 0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.04, 16]} />
          <meshStandardMaterial color="#8090a0" metalness={0.85} roughness={0.15} />
        </mesh>
      ))}
      {/* Motor */}
      <mesh position={[0.7, 0, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.9, 18]} />
        <meshStandardMaterial color="#2a3040" metalness={0.85} roughness={0.15} />
      </mesh>
      {/* Coupling guard */}
      <mesh position={[0.15, 0, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.25, 12]} />
        <meshStandardMaterial color="#404a5a" metalness={0.5} roughness={0.5} transparent opacity={0.6} />
      </mesh>
      {/* Nozzles */}
      <Nozzle position={[-1.05, 0.15, 0]} direction={[0, 1, 0]} length={0.25} r={0.1} />
      <Nozzle position={[-0.9, 0.15, 0]} direction={[0, 1, 0]} length={0.2} r={0.075} />
      <StatusRing position={[0, 0, 0]} health={health} radius={0.38} />
      {isHov && (
        <Html position={[0, 0.8, 0]} center style={{ pointerEvents: "none" }}>
          <div style={{ background: "rgba(5,12,22,0.9)", border: "1px solid #00C8F0", padding: "4px 8px", borderRadius: 4, color: "#fff", fontSize: 10, whiteSpace: "nowrap" }}>
            <b style={{ color: "#00C8F0" }}>{eq.tag}</b> — {eq.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function Deaerator({ eq, onClick, hovered, setHovered }) {
  const { position: p, dims, health } = eq;
  const [px, py, pz] = p;
  const isHov = hovered === eq.id;
  const L = dims.tankLength;
  const r = dims.tankOD / 2;
  return (
    <group position={[px, py, pz]} onClick={e => { e.stopPropagation(); onClick(eq); }}
      onPointerOver={e => { e.stopPropagation(); setHovered(eq.id); }}
      onPointerOut={() => setHovered(null)}>
      {/* Storage tank shell */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[r, r, L, 28]} />
        <meshStandardMaterial color={isHov ? "#6a7a90" : "#5a6878"} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Dished ends */}
      {[-L / 2, L / 2].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <sphereGeometry args={[r, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#4a5868" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* Deaerator head on top */}
      <mesh position={[0, r + 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.6, 1.0, 18]} />
        <meshStandardMaterial color="#607080" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Insulation */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[r + 0.07, r + 0.07, L * 0.9, 20]} />
        <meshStandardMaterial color="#c8b89a" metalness={0.05} roughness={0.85} opacity={0.5} transparent />
      </mesh>
      {/* Support columns */}
      {[-L * 0.35, L * 0.35].map((x, i) => (
        <group key={i} position={[x, -r - 4, 0]}>
          <mesh position={[0, 4, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 8, 10]} />
            <meshStandardMaterial color="#445566" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[-0.5, 0, 0]} castShadow>
            <boxGeometry args={[1.2, 0.15, 0.15]} />
            <meshStandardMaterial color="#3a4a5a" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      ))}
      {/* Platform */}
      <Platform y={r + 0.1} x={0} z={0} rx={r} rz={r} />
      <Ladder x={L * 0.4} z={0} y0={-r - 8} y1={r} />
      {/* Nozzles */}
      <Nozzle position={[L * 0.2, r, 0]} direction={[0, 1, 0]} length={0.2} r={0.07} />
      <Nozzle position={[-L * 0.2, r, 0]} direction={[0, 1, 0]} length={0.2} r={0.05} />
      <StatusRing position={[0, 0, 0]} health={health} radius={r + 0.12} />
      {isHov && (
        <Html position={[0, r + 1.5, 0]} center style={{ pointerEvents: "none" }}>
          <div style={{ background: "rgba(5,12,22,0.9)", border: "1px solid #00C8F0", padding: "4px 8px", borderRadius: 4, color: "#fff", fontSize: 10, whiteSpace: "nowrap" }}>
            <b style={{ color: "#00C8F0" }}>{eq.tag}</b> — {eq.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function BlowdownTank({ eq, onClick, hovered, setHovered }) {
  const { position: p, dims, health } = eq;
  const [px, py, pz] = p;
  const isHov = hovered === eq.id;
  const r = dims.od / 2;
  const L = dims.length;
  return (
    <group position={[px, py + r + 0.15, pz]} onClick={e => { e.stopPropagation(); onClick(eq); }}
      onPointerOver={e => { e.stopPropagation(); setHovered(eq.id); }}
      onPointerOut={() => setHovered(null)}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[r, r, L, 22]} />
        <meshStandardMaterial color={isHov ? "#7a7060" : "#6a6050"} metalness={0.65} roughness={0.4} />
      </mesh>
      {[-L / 2, L / 2].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <sphereGeometry args={[r, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#5a5040" metalness={0.65} roughness={0.4} />
        </mesh>
      ))}
      <Nozzle position={[L * 0.3, r, 0]} direction={[0, 1, 0]} length={0.2} r={0.05} />
      <Nozzle position={[0, -r, 0]} direction={[0, -1, 0]} length={0.25} r={0.06} />
      {[-L * 0.25, L * 0.25].map((x, i) => (
        <mesh key={i} position={[x, -r - 0.25, 0]} castShadow>
          <boxGeometry args={[0.3, 0.5, r * 2]} />
          <meshStandardMaterial color="#445566" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      <StatusRing position={[0, 0, 0]} health={health} radius={r + 0.06} />
      {isHov && (
        <Html position={[0, r + 0.4, 0]} center style={{ pointerEvents: "none" }}>
          <div style={{ background: "rgba(5,12,22,0.9)", border: "1px solid #00FF94", padding: "4px 8px", borderRadius: 4, color: "#fff", fontSize: 10, whiteSpace: "nowrap" }}>
            <b style={{ color: "#00FF94" }}>{eq.tag}</b> — {eq.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function DMPlant({ eq, onClick, hovered, setHovered }) {
  const { position: p, dims, health } = eq;
  const [px, py, pz] = p;
  const isHov = hovered === eq.id;
  const vessels = [
    { x: -4, color: "#5a8060", label: "SAC" },
    { x: -2, color: "#5a8060", label: "SAC" },
    { x: 0, color: "#6060a0", label: "SBA" },
    { x: 2, color: "#6060a0", label: "SBA" },
    { x: 4, color: "#4a7090", label: "MB" },
  ];
  return (
    <group position={[px, py, pz]} onClick={e => { e.stopPropagation(); onClick(eq); }}
      onPointerOver={e => { e.stopPropagation(); setHovered(eq.id); }}
      onPointerOut={() => setHovered(null)}>
      {/* Vessels */}
      {vessels.map((v, i) => (
        <group key={i} position={[v.x, 1.5, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.6, 0.6, 3.0, 16]} />
            <meshStandardMaterial color={isHov ? "#7a9aaa" : v.color} metalness={0.3} roughness={0.6} />
          </mesh>
          {/* Dome top */}
          <mesh position={[0, 1.7, 0]} castShadow>
            <sphereGeometry args={[0.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={v.color} metalness={0.3} roughness={0.6} />
          </mesh>
          {/* Dome bottom */}
          <mesh position={[0, -1.7, 0]} rotation={[Math.PI, 0, 0]} castShadow>
            <sphereGeometry args={[0.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={v.color} metalness={0.3} roughness={0.6} />
          </mesh>
          {/* Label tag */}
          <Html position={[0, 0, 0.65]} center style={{ pointerEvents: "none" }}>
            <div style={{ background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 8, padding: "1px 4px", borderRadius: 2 }}>{v.label}</div>
          </Html>
        </group>
      ))}
      {/* Header pipe connecting all vessels */}
      <mesh position={[0, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 9.5, 10]} />
        <meshStandardMaterial color="#7a8898" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Concrete base */}
      <mesh position={[0, -0.2, 0]} castShadow>
        <boxGeometry args={[11, 0.4, dims.width || 4]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.2} roughness={0.8} />
      </mesh>
      {isHov && (
        <Html position={[0, 4, 0]} center style={{ pointerEvents: "none" }}>
          <div style={{ background: "rgba(5,12,22,0.9)", border: "1px solid #FFD700", padding: "4px 8px", borderRadius: 4, color: "#fff", fontSize: 10, whiteSpace: "nowrap" }}>
            <b style={{ color: "#FFD700" }}>{eq.tag}</b> — {eq.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function PLCRoom({ eq, onClick, hovered, setHovered }) {
  const { position: p, dims, health } = eq;
  const [px, py, pz] = p;
  const isHov = hovered === eq.id;
  const { length: L, width: W, height: H } = dims;
  return (
    <group position={[px, py + H / 2, pz]} onClick={e => { e.stopPropagation(); onClick(eq); }}
      onPointerOver={e => { e.stopPropagation(); setHovered(eq.id); }}
      onPointerOut={() => setHovered(null)}>
      {/* Building */}
      <mesh castShadow>
        <boxGeometry args={[L, H, W]} />
        <meshStandardMaterial color={isHov ? "#2a4060" : "#202838"} metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, H / 2 + 0.06, 0]} castShadow>
        <boxGeometry args={[L + 0.2, 0.12, W + 0.2]} />
        <meshStandardMaterial color="#1a2030" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Windows (glowing) */}
      {[-L * 0.25, 0, L * 0.25].map((x, i) => (
        <mesh key={i} position={[x, H * 0.1, W / 2 + 0.01]} castShadow>
          <boxGeometry args={[1.2, 0.8, 0.04]} />
          <meshStandardMaterial color="#0066DD" emissive="#0044AA" emissiveIntensity={1.5} />
        </mesh>
      ))}
      {/* Door */}
      <mesh position={[L * 0.35, -H * 0.18, W / 2 + 0.01]} castShadow>
        <boxGeometry args={[0.9, H * 0.6, 0.04]} />
        <meshStandardMaterial color="#1a2838" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* AC units on roof */}
      {[-1.5, 1.5].map((x, i) => (
        <mesh key={i} position={[x, H / 2 + 0.3, 0]} castShadow>
          <boxGeometry args={[1.2, 0.5, 0.7]} />
          <meshStandardMaterial color="#3a4a5a" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* Interior light */}
      <pointLight position={[0, 0, 0]} color="#4488FF" intensity={1.5} distance={5} />
      {isHov && (
        <Html position={[0, H / 2 + 0.8, 0]} center style={{ pointerEvents: "none" }}>
          <div style={{ background: "rgba(5,12,22,0.9)", border: "1px solid #00FF94", padding: "4px 8px", borderRadius: 4, color: "#fff", fontSize: 10, whiteSpace: "nowrap" }}>
            <b style={{ color: "#00FF94" }}>{eq.tag}</b> — {eq.name}
          </div>
        </Html>
      )}
    </group>
  );
}

// Structural steel frame around boiler
function BoilerStructure() {
  const cols = [
    [-4, 0, -3.5], [4, 0, -3.5], [-4, 0, 3.5], [4, 0, 3.5],
    [-4, 0, 0], [4, 0, 0],
  ];
  return (
    <group>
      {cols.map(([x, y, z], i) => (
        <mesh key={i} position={[x, 14, z]} castShadow>
          <boxGeometry args={[0.22, 28, 0.22]} />
          <meshStandardMaterial color="#445566" metalness={0.75} roughness={0.25} />
        </mesh>
      ))}
      {/* Horizontal beams at levels */}
      {[8, 15, 22, 28].map((h, i) => (
        <group key={i}>
          <mesh position={[0, h, -3.5]} castShadow>
            <boxGeometry args={[8.22, 0.18, 0.18]} />
            <meshStandardMaterial color="#556677" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, h, 3.5]} castShadow>
            <boxGeometry args={[8.22, 0.18, 0.18]} />
            <meshStandardMaterial color="#556677" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[-4, h, 0]} castShadow>
            <boxGeometry args={[0.18, 0.18, 7.22]} />
            <meshStandardMaterial color="#556677" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[4, h, 0]} castShadow>
            <boxGeometry args={[0.18, 0.18, 7.22]} />
            <meshStandardMaterial color="#556677" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {/* Platforms at levels 8 and 15 */}
      {[8, 15].map((h, i) => (
        <mesh key={i} position={[4.2, h, 0]} castShadow>
          <boxGeometry args={[1.4, 0.06, 7]} />
          <meshStandardMaterial color="#3a4a5a" metalness={0.5} roughness={0.6} />
        </mesh>
      ))}
      {/* Ground paving */}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <boxGeometry args={[50, 0.12, 40]} />
        <meshStandardMaterial color="#1a2030" metalness={0.1} roughness={0.9} />
      </mesh>
      {/* Cable trays */}
      <mesh position={[-5, 3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <boxGeometry args={[0.08, 25, 0.5]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

// Main pipeline network connecting equipment
function PipeNetwork() {
  const lines = [
    // Steam drum to superheater
    { p1: [0, 18.8, 0], p2: [0, 22, 2], r: 0.09, color: "#9aafbf" },
    // Steam drum feed water in
    { p1: [-8, 8, 6], p2: [-8, 8, 0], r: 0.06, color: "#5a8a9a" },
    { p1: [-8, 8, 0], p2: [0, 18, 0], r: 0.06, color: "#5a8a9a" },
    // Mud drum blowdown
    { p1: [0, 2, 0], p2: [0, 1, 0], r: 0.04, color: "#7a6a5a" },
    { p1: [0, 1, 0], p2: [12, 1, 6], r: 0.04, color: "#7a6a5a" },
    // BFP to DA
    { p1: [-12, 0, 6], p2: [-8, 0, 6], r: 0.08, color: "#4a7090" },
    { p1: [-8, 0, 6], p2: [-8, 8, 6], r: 0.08, color: "#4a7090" },
    // FD fan to APH
    { p1: [-8, 2, -10], p2: [-3, 4, -10], r: 0.12, color: "#6a7a5a" },
    // APH to furnace
    { p1: [0, 4, -8], p2: [0, 6, -4], r: 0.12, color: "#6a7a5a" },
    // Flue to ID fan
    { p1: [0, 22, -6], p2: [4, 4, -10], r: 0.14, color: "#5a5040" },
    { p1: [4, 4, -10], p2: [8, 2, -10], r: 0.14, color: "#5a5040" },
    // ID fan to stack
    { p1: [8, 2, -10], p2: [12, 2, -12], r: 0.14, color: "#5a5040" },
  ];
  return (
    <group>
      {lines.map((l, i) => <Pipe key={i} {...l} />)}
    </group>
  );
}

// ─── Scene root ───────────────────────────────────────────────────────────────

const COMPONENT_MAP = {
  steamDrum: SteamDrum,
  mudDrum: MudDrum,
  waterWall: WaterWallTubes,
  furnace: Furnace,
  superheater: Superheater,
  economizer: Economizer,
  airPreheater: AirPreheater,
  burner: Burner,
  fdFan: (props) => <Fan {...props} speed={1.2} />,
  idFan: (props) => <Fan {...props} speed={0.9} />,
  stack: Stack,
  boilerFeedPump: BoilerFeedPump,
  deaerator: Deaerator,
  blowdownTank: BlowdownTank,
  dmPlant: DMPlant,
  plcRoom: PLCRoom,
};

export default function BoilerScene({ onSelect }) {
  const [hovered, setHovered] = useState(null);

  const handleClick = useCallback((eq) => {
    onSelect(eq);
  }, [onSelect]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.12} />
      <directionalLight position={[30, 50, 20]} intensity={1.4} castShadow
        shadow-mapSize={[2048, 2048]} shadow-camera-far={120}
        shadow-camera-left={-30} shadow-camera-right={30}
        shadow-camera-top={30} shadow-camera-bottom={-30} />
      <pointLight position={[-10, 25, -5]} color="#FFD08A" intensity={1.5} distance={40} decay={2} />
      <pointLight position={[10, 5, 10]} color="#4488FF" intensity={0.8} distance={20} decay={2} />
      <hemisphereLight skyColor="#0a1828" groundColor="#0a0c10" intensity={0.5} />

      {/* Structural steel */}
      <BoilerStructure />

      {/* Pipeline network */}
      <PipeNetwork />

      {/* Equipment */}
      {BOILER_EQUIPMENT.map((eq) => {
        const Comp = COMPONENT_MAP[eq.type];
        if (!Comp) return null;
        return (
          <Comp key={eq.id} eq={eq} onClick={handleClick}
            hovered={hovered} setHovered={setHovered} />
        );
      })}

      {/* Controls */}
      <OrbitControls
        minDistance={4} maxDistance={80}
        maxPolarAngle={Math.PI * 0.88}
        enableDamping dampingFactor={0.08}
      />
    </>
  );
}
