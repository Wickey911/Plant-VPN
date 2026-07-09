/**
 * Plant3D.jsx  –  Industrial AI Mission Control – 3D Refinery Scene
 * Design: Honeywell Forge / AVEVA / Siemens ABB industrial aesthetic
 * Tech: React Three Fiber · Drei · Three.js · @react-three/postprocessing
 */
import {
  Suspense, useRef, useState, useEffect, useMemo, useCallback,
} from "react";
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import {
  OrbitControls, Html, Stars, shaderMaterial,
} from "@react-three/drei";
import {
  EffectComposer, Bloom, Vignette,
} from "@react-three/postprocessing";
import * as THREE from "three";
import { gsap } from "gsap";
import { usePlantStore } from "../../store/plantStore";
import { EQUIPMENT, PIPE_CONNECTIONS } from "../../data/equipmentData";

// ─── Flow shader (selected / alarmed pipes only) ──────────────────────────────
const FlowMaterial = shaderMaterial(
  { uTime: 0, uColor: new THREE.Color("#38BDF8") },
  `varying vec2 vUv;
   void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  `uniform float uTime; uniform vec3 uColor;
   varying vec2 vUv;
   void main(){
     float t = mod(vUv.x * 4.0 - uTime * 1.2, 1.0);
     float a = smoothstep(0.0,0.18,t)*smoothstep(1.0,0.65,t);
     vec3 c = uColor*(0.4+a*1.6);
     gl_FragColor=vec4(c,(0.18+a*0.55));
   }`
);
extend({ FlowMaterial });

// ─── Industrial health palette ────────────────────────────────────────────────
function healthColor(h) {
  if (h > 70) return "#22C55E";  // Emerald — healthy
  if (h > 40) return "#FBBF24";  // Amber — warning
  return "#EF4444";               // Red — critical
}

// ─── PBR material presets ─────────────────────────────────────────────────────
const M = {
  steel:     { metalness:0.82, roughness:0.28, color:"#B8BDC6" },
  steelDark: { metalness:0.75, roughness:0.42, color:"#6E7A84" },
  painted:   { metalness:0.30, roughness:0.68, color:"#8A98A5" },
  insul:     { metalness:0.04, roughness:0.92, color:"#ADA390" },
  concrete:  { metalness:0.00, roughness:0.98, color:"#3A414A" },
  pipe:      { metalness:0.88, roughness:0.20, color:"#7E8B94" },
  safety:    { metalness:0.28, roughness:0.62, color:"#B89A1A" },
};

// ─── Steam / condensate vapour ────────────────────────────────────────────────
function SteamParticles({ position, count=55, spread=0.6 }) {
  const ref = useRef();
  const pos = useMemo(() => {
    const a = new Float32Array(count*3);
    for (let i=0;i<count;i++){
      a[i*3]=(Math.random()-.5)*spread; a[i*3+1]=Math.random()*5; a[i*3+2]=(Math.random()-.5)*spread;
    }
    return a;
  }, [count, spread]);
  useFrame(() => {
    const p = ref.current.geometry.attributes.position.array;
    for (let i=0;i<count;i++){
      p[i*3+1]+=0.022; p[i*3]+=(Math.random()-.5)*0.003; p[i*3+2]+=(Math.random()-.5)*0.003;
      if(p[i*3+1]>7){p[i*3+1]=0;p[i*3]=(Math.random()-.5)*spread;p[i*3+2]=(Math.random()-.5)*spread;}
    }
    ref.current.geometry.attributes.position.needsUpdate=true;
  });
  return (
    <points ref={ref} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={pos} count={count} itemSize={3}/>
      </bufferGeometry>
      <pointsMaterial color="#C8D4DC" size={0.11} transparent opacity={0.09} depthWrite={false} sizeAttenuation/>
    </points>
  );
}

// ─── Flare flame particles ────────────────────────────────────────────────────
function FlameParticles({ position }) {
  const ref = useRef();
  const count = 55;
  const pos = useMemo(() => {
    const a = new Float32Array(count*3);
    for(let i=0;i<count;i++){
      a[i*3]=(Math.random()-.5)*0.7; a[i*3+1]=Math.random()*2.5; a[i*3+2]=(Math.random()-.5)*0.7;
    }
    return a;
  }, []);
  useFrame((s) => {
    const t=s.clock.elapsedTime;
    const p=ref.current.geometry.attributes.position.array;
    ref.current.material.color.setHSL(0.06+Math.sin(t*3)*0.012, 0.85, 0.50+Math.sin(t*8)*0.04);
    for(let i=0;i<count;i++){
      p[i*3+1]+=0.04+Math.random()*0.03;
      p[i*3]+=(Math.random()-.5)*0.012; p[i*3+2]+=(Math.random()-.5)*0.012;
      if(p[i*3+1]>2.5){p[i*3+1]=0;p[i*3]=(Math.random()-.5)*0.5;p[i*3+2]=(Math.random()-.5)*0.5;}
    }
    ref.current.geometry.attributes.position.needsUpdate=true;
  });
  return (
    <points ref={ref} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={pos} count={count} itemSize={3}/>
      </bufferGeometry>
      <pointsMaterial color="#FF5500" size={0.17} transparent opacity={0.48} depthWrite={false} sizeAttenuation/>
    </points>
  );
}

// ─── Hover tooltip ────────────────────────────────────────────────────────────
function Tooltip({ eq, sensor }) {
  return (
    <Html center distanceFactor={22} style={{ pointerEvents:"none" }}>
      <div style={{
        background:"rgba(6,10,20,0.96)",border:"1px solid rgba(56,189,248,0.28)",
        borderRadius:4,padding:"6px 10px",fontSize:10,
        fontFamily:"JetBrains Mono,monospace",whiteSpace:"nowrap",
        boxShadow:"0 2px 14px rgba(0,0,0,0.6)",
      }}>
        <div style={{color:"#38BDF8",fontWeight:700,marginBottom:2}}>{eq.id}</div>
        <div style={{color:"#6A7A8E",fontSize:9}}>{eq.name}</div>
        {sensor && (
          <div style={{marginTop:4,display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2px 10px",fontSize:9}}>
            <span style={{color:"#4A5878"}}>TEMP</span><span style={{color:"#F97316"}}>{sensor.temperature?.toFixed(0)}°C</span>
            <span style={{color:"#4A5878"}}>PRES</span><span style={{color:"#60A5FA"}}>{sensor.pressure?.toFixed(1)} bar</span>
            <span style={{color:"#4A5878"}}>VIB</span>
            <span style={{color:sensor.vibration>2.5?"#EF4444":"#22C55E"}}>{sensor.vibration?.toFixed(2)} mm/s</span>
          </div>
        )}
      </div>
    </Html>
  );
}

// ─── Thin AI health halo (slow pulse for critical) ────────────────────────────
function StatusRing({ radius, y, health }) {
  const ref = useRef();
  const col = healthColor(health);
  const isCrit = health <= 40;
  const isWarn = health > 40 && health <= 70;
  useFrame((s) => {
    if (!ref.current) return;
    if (isCrit) {
      const p = 0.22 + Math.sin(s.clock.elapsedTime * 1.3) * 0.22;
      ref.current.material.emissiveIntensity = p;
      ref.current.material.opacity = 0.38 + Math.sin(s.clock.elapsedTime * 1.3) * 0.20;
    }
  });
  return (
    <mesh ref={ref} position={[0,y,0]} rotation={[Math.PI/2,0,0]}>
      <torusGeometry args={[radius+0.10, 0.034, 8, 64]}/>
      <meshStandardMaterial
        color={col} emissive={col}
        emissiveIntensity={isCrit?0.30:isWarn?0.45:0.28}
        transparent
        opacity={isCrit?0.60:isWarn?0.50:0.36}
      />
    </mesh>
  );
}

// ─── AI selection base ring (Electric Blue) ───────────────────────────────────
function SelectionRing({ radius, y=0.06 }) {
  return (
    <mesh position={[0,y,0]} rotation={[Math.PI/2,0,0]}>
      <torusGeometry args={[radius+0.20, 0.042, 8, 64]}/>
      <meshStandardMaterial color="#38BDF8" emissive="#38BDF8" emissiveIntensity={1.6} transparent opacity={0.88}/>
    </mesh>
  );
}

// ─── AI scan ring (cyan sweep, rises up selected equipment) ───────────────────
function ScanRing({ radius, maxHeight }) {
  const ref = useRef();
  useFrame((s) => {
    if (!ref.current) return;
    const t = ((s.clock.elapsedTime * 0.42) % 1);
    ref.current.position.y = t * maxHeight;
    ref.current.material.opacity = 0.55 - t * 0.55;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI/2,0,0]}>
      <torusGeometry args={[radius, 0.022, 8, 64]}/>
      <meshStandardMaterial color="#00E5FF" emissive="#00E5FF" emissiveIntensity={2.0} transparent opacity={0.5}/>
    </mesh>
  );
}

// ─── Nozzle & flange ──────────────────────────────────────────────────────────
function Nozzle({ pos, dir=[1,0,0], len=0.7, r=0.12 }) {
  const rotation = useMemo(() => {
    const v = new THREE.Vector3(...dir).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), v);
    const e = new THREE.Euler().setFromQuaternion(q);
    return [e.x, e.y, e.z];
  }, [dir]);
  const ep = dir.map((d,i) => d*(len/2)+pos[i]);
  return (
    <group position={pos}>
      <mesh rotation={rotation}>
        <cylinderGeometry args={[r,r,len,12]}/>
        <meshStandardMaterial {...M.pipe}/>
      </mesh>
      <mesh position={ep} rotation={[rotation[0]+Math.PI/2,rotation[1],rotation[2]]}>
        <cylinderGeometry args={[r*1.6,r*1.6,0.09,16]}/>
        <meshStandardMaterial {...M.steelDark}/>
      </mesh>
    </group>
  );
}

// ─── Ladder ───────────────────────────────────────────────────────────────────
function Ladder({ height, r, side=0 }) {
  const a = side*Math.PI*2/4;
  const lx = Math.cos(a)*(r+0.14), lz = Math.sin(a)*(r+0.14);
  const rungs = Math.max(1, Math.floor(height/0.42));
  return (
    <group position={[lx,0,lz]}>
      {[-0.15,0.15].map((dx,i) => (
        <mesh key={i} position={[dx,height/2,0]}>
          <boxGeometry args={[0.04,height,0.04]}/>
          <meshStandardMaterial {...M.steelDark}/>
        </mesh>
      ))}
      {Array.from({length:rungs}).map((_,i) => (
        <mesh key={i} position={[0,i*0.42+0.2,0]}>
          <boxGeometry args={[0.30,0.03,0.03]}/>
          <meshStandardMaterial {...M.steelDark}/>
        </mesh>
      ))}
    </group>
  );
}

// ─── Platform ring ────────────────────────────────────────────────────────────
function Platform({ y, r }) {
  return (
    <group position={[0,y,0]}>
      <mesh rotation={[Math.PI/2,0,0]}>
        <torusGeometry args={[r+0.35,0.06,8,48]}/>
        <meshStandardMaterial {...M.steelDark}/>
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════
//  EQUIPMENT COMPONENTS
// ═══════════════════════════════════════════════════════

function StorageTank({ data, isSelected, isHovered, sensor, onClick, onPointerOver, onPointerOut }) {
  const { position, params, health } = data;
  const { r=2.5, h=5 } = params;
  return (
    <group position={position} onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      {/* Shell — matte silver */}
      <mesh position={[0,h/2,0]}>
        <cylinderGeometry args={[r,r,h,36]}/>
        <meshStandardMaterial {...M.steel}
          emissive={isSelected?"#38BDF8":"#000"}
          emissiveIntensity={isSelected?0.07:0}/>
      </mesh>
      {/* Cone roof */}
      <mesh position={[0,h+0.5,0]}>
        <coneGeometry args={[r+0.05,1,36]}/>
        <meshStandardMaterial {...M.steel} color="#A2AAB2"/>
      </mesh>
      {/* Base plate */}
      <mesh position={[0,0.04,0]}>
        <cylinderGeometry args={[r+0.05,r+0.05,0.08,36]}/>
        <meshStandardMaterial {...M.steelDark}/>
      </mesh>
      {/* Wind girder */}
      <mesh position={[0,h*0.88,0]} rotation={[Math.PI/2,0,0]}>
        <torusGeometry args={[r+0.05,0.06,8,64]}/>
        <meshStandardMaterial {...M.steelDark}/>
      </mesh>
      <Nozzle pos={[r,h*0.25,0]} dir={[1,0,0]}/>
      <Nozzle pos={[0,h*0.7,r]} dir={[0,0,1]}/>
      <Ladder height={h+0.8} r={r}/>
      {/* Thin health halo */}
      <StatusRing radius={r} y={h+1.0} health={health}/>
      {/* Subtle red ambient for critical only */}
      {health<=40 && <pointLight color="#EF4444" intensity={1.2} distance={6} decay={2.5}/>}
      {/* Selection: Electric Blue base ring + AI scan sweep */}
      {isSelected && (
        <>
          <SelectionRing radius={r}/>
          <ScanRing radius={r+0.12} maxHeight={h+1}/>
        </>
      )}
      {isHovered && !isSelected && <Tooltip eq={data} sensor={sensor}/>}
    </group>
  );
}

function DistillationColumn({ data, isSelected, isHovered, sensor, onClick, onPointerOver, onPointerOut }) {
  const { position, params, health } = data;
  const { r=1.4, h=24 } = params;
  const ir = r+0.07;
  return (
    <group position={position} onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      {/* Insulation wrap */}
      <mesh position={[0,h/2,0]}>
        <cylinderGeometry args={[ir,ir,h,32]}/>
        <meshStandardMaterial {...M.insul}/>
      </mesh>
      {/* Shell (visible caps) */}
      <mesh position={[0,h/2,0]}>
        <cylinderGeometry args={[r,r,h,32,1,true]}/>
        <meshStandardMaterial {...M.steel} side={THREE.DoubleSide}/>
      </mesh>
      {/* Skirt */}
      <mesh position={[0,-1.4,0]}>
        <cylinderGeometry args={[r,r*1.14,2.8,32]}/>
        <meshStandardMaterial {...M.steelDark}/>
      </mesh>
      {/* Ellipsoidal domes */}
      <mesh position={[0,h,0]}>
        <sphereGeometry args={[r,32,16,0,Math.PI*2,0,Math.PI/2]}/>
        <meshStandardMaterial {...M.steel}/>
      </mesh>
      <mesh position={[0,0,0]} rotation={[Math.PI,0,0]}>
        <sphereGeometry args={[r,32,16,0,Math.PI*2,0,Math.PI/2]}/>
        <meshStandardMaterial {...M.steel}/>
      </mesh>
      {[h*0.25,h*0.5,h*0.75].map((y,i) => <Platform key={i} y={y} r={r}/>)}
      {[h*0.2,h*0.4,h*0.6,h*0.8].map((y,i) => <Nozzle key={i} pos={[r,y,0]} dir={[1,0,0]} r={0.13}/>)}
      <Ladder height={h+1} r={ir}/>
      <StatusRing radius={ir} y={h+1} health={health}/>
      <SteamParticles position={[0,h+1,0]} count={40} spread={r}/>
      {health<=40 && <pointLight color="#EF4444" intensity={1.8} distance={8} decay={2.5}/>}
      {isSelected && (
        <>
          <SelectionRing radius={ir}/>
          <ScanRing radius={ir+0.12} maxHeight={h+1}/>
        </>
      )}
      {isHovered && !isSelected && <Tooltip eq={data} sensor={sensor}/>}
    </group>
  );
}

function HeatExchanger({ data, isSelected, isHovered, sensor, onClick, onPointerOver, onPointerOut }) {
  const { position, params, health } = data;
  const { r=0.6, l=5 } = params;
  return (
    <group position={position} rotation={[0,Math.PI*0.12,0]} onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      {/* Shell */}
      <mesh rotation={[0,0,Math.PI/2]}>
        <cylinderGeometry args={[r,r,l,24]}/>
        <meshStandardMaterial {...M.steel}
          emissive={isSelected?"#38BDF8":"#000"}
          emissiveIntensity={isSelected?0.07:0}/>
      </mesh>
      {/* Channel heads */}
      {[-l/2,l/2].map((x,i) => (
        <mesh key={i} position={[x,0,0]} rotation={[0,0,i===0?Math.PI/2:-Math.PI/2]}>
          <sphereGeometry args={[r,20,12,0,Math.PI*2,0,Math.PI/2]}/>
          <meshStandardMaterial {...M.steelDark}/>
        </mesh>
      ))}
      {/* Saddle supports */}
      {[-l*0.3,l*0.3].map((x,i) => (
        <mesh key={i} position={[x,-r-0.28,0]}>
          <boxGeometry args={[0.28,0.56,r*2.4]}/>
          <meshStandardMaterial {...M.concrete}/>
        </mesh>
      ))}
      <Nozzle pos={[0,r,0]} dir={[0,1,0]} r={0.1}/>
      <Nozzle pos={[l*0.2,-r,0]} dir={[0,-1,0]} r={0.1}/>
      <StatusRing radius={r} y={r+0.4} health={health}/>
      {isSelected && <SelectionRing radius={r+0.3}/>}
      {isHovered && !isSelected && <Tooltip eq={data} sensor={sensor}/>}
    </group>
  );
}

function Reactor({ data, isSelected, isHovered, sensor, onClick, onPointerOver, onPointerOut }) {
  const { position, params, health } = data;
  const { r=2, h=9 } = params;
  return (
    <group position={position} onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      <mesh position={[0,h/2,0]}>
        <cylinderGeometry args={[r,r,h,32]}/>
        <meshStandardMaterial {...M.steel}
          emissive={isSelected?"#38BDF8":"#000"}
          emissiveIntensity={isSelected?0.07:0}/>
      </mesh>
      <mesh position={[0,h,0]}>
        <sphereGeometry args={[r,32,16,0,Math.PI*2,0,Math.PI/2]}/>
        <meshStandardMaterial {...M.steel}/>
      </mesh>
      <mesh position={[0,0,0]} rotation={[Math.PI,0,0]}>
        <sphereGeometry args={[r,32,16,0,Math.PI*2,0,Math.PI/2]}/>
        <meshStandardMaterial {...M.steel}/>
      </mesh>
      <mesh position={[0,-2,0]}>
        <cylinderGeometry args={[r,r,4,32,1,true]}/>
        <meshStandardMaterial {...M.steelDark}/>
      </mesh>
      {/* Insulation */}
      <mesh position={[0,h/2,0]}>
        <cylinderGeometry args={[r+0.08,r+0.08,h-0.5,32,1,true]}/>
        <meshStandardMaterial {...M.insul}/>
      </mesh>
      {[h*0.15,h*0.5,h*0.85].map((y,i) => <Nozzle key={i} pos={[r,y,0]} dir={[1,0,0]} r={0.18}/>)}
      <Ladder height={h+1} r={r+0.08}/>
      <StatusRing radius={r+0.08} y={h+1.2} health={health}/>
      {health<=40 && <pointLight color="#EF4444" intensity={1.8} distance={7} decay={2.5}/>}
      {isSelected && (
        <>
          <SelectionRing radius={r+0.1}/>
          <ScanRing radius={r+0.18} maxHeight={h+1}/>
        </>
      )}
      {isHovered && !isSelected && <Tooltip eq={data} sensor={sensor}/>}
    </group>
  );
}

function Compressor({ data, isSelected, isHovered, sensor, onClick, onPointerOver, onPointerOut }) {
  const { position, params, health } = data;
  const { r=1.2, l=5.5 } = params;
  const shaftRef = useRef();
  useFrame(() => {
    if (shaftRef.current) shaftRef.current.rotation.x += 0.04*(health/60);
  });
  return (
    <group position={position} onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      {/* Baseframe */}
      <mesh position={[0,-r-0.15,0]}>
        <boxGeometry args={[l+1,0.22,r*3]}/>
        <meshStandardMaterial {...M.safety}/>
      </mesh>
      {/* Body */}
      <mesh rotation={[0,0,Math.PI/2]}>
        <cylinderGeometry args={[r,r,l,24]}/>
        <meshStandardMaterial {...M.painted}
          emissive={isSelected?"#38BDF8":"#000"}
          emissiveIntensity={isSelected?0.07:0}/>
      </mesh>
      {/* Motor */}
      <mesh position={[l/2+0.85,0,0]}>
        <boxGeometry args={[1.5,r*1.4,r*1.6]}/>
        <meshStandardMaterial {...M.steelDark}/>
      </mesh>
      {/* Rotating coupling */}
      <group ref={shaftRef} position={[l*0.35,0,0]}>
        <mesh rotation={[0,0,Math.PI/2]}>
          <cylinderGeometry args={[r*0.25,r*0.25,0.38,12]}/>
          <meshStandardMaterial {...M.steelDark}/>
        </mesh>
        {[0,Math.PI/2].map((a,i) => (
          <mesh key={i} rotation={[a,0,0]}>
            <torusGeometry args={[r*0.35,0.04,8,24]}/>
            <meshStandardMaterial {...M.safety}/>
          </mesh>
        ))}
      </group>
      <Nozzle pos={[-l/2,0,r]} dir={[0,0,1]} r={0.18}/>
      <Nozzle pos={[l/2,0,r]} dir={[0,0,1]} r={0.18}/>
      <StatusRing radius={r} y={r+0.4} health={health}/>
      {health<=40 && <pointLight color="#EF4444" intensity={1.8} distance={6} decay={2.5}/>}
      {isSelected && <SelectionRing radius={r+0.5} y={-r-0.15}/>}
      {isHovered && !isSelected && <Tooltip eq={data} sensor={sensor}/>}
    </group>
  );
}

function Pump({ data, isSelected, isHovered, sensor, onClick, onPointerOver, onPointerOut }) {
  const { position, health } = data;
  const col = healthColor(health);
  const impRef = useRef();
  useFrame(() => {
    if (impRef.current) impRef.current.rotation.y += 0.08*(health/80);
  });
  return (
    <group position={position} onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      {/* Baseplate */}
      <mesh position={[0,-0.12,0]}>
        <boxGeometry args={[2,0.12,1.2]}/>
        <meshStandardMaterial {...M.concrete}/>
      </mesh>
      {/* Casing */}
      <mesh position={[-0.35,0.45,0]}>
        <boxGeometry args={[0.95,0.68,0.68]}/>
        <meshStandardMaterial {...M.painted}
          emissive={isSelected?"#38BDF8":"#000"}
          emissiveIntensity={isSelected?0.10:0}/>
      </mesh>
      {/* Impeller housing */}
      <group ref={impRef} position={[-0.35,0.45,0.38]}>
        <mesh>
          <cylinderGeometry args={[0.24,0.24,0.08,12]}/>
          <meshStandardMaterial {...M.steelDark}/>
        </mesh>
      </group>
      {/* Motor */}
      <mesh position={[0.65,0.45,0]} rotation={[0,0,Math.PI/2]}>
        <cylinderGeometry args={[0.34,0.34,1.08,16]}/>
        <meshStandardMaterial {...M.steelDark}/>
      </mesh>
      {/* Coupling guard */}
      <mesh position={[0.15,0.45,0]} rotation={[0,0,Math.PI/2]}>
        <cylinderGeometry args={[0.12,0.12,0.28,12]}/>
        <meshStandardMaterial {...M.safety}/>
      </mesh>
      <Nozzle pos={[-1.0,0.45,0]} dir={[-1,0,0]} r={0.12} len={0.6}/>
      <Nozzle pos={[-0.35,0.98,0]} dir={[0,1,0]} r={0.1} len={0.5}/>
      {/* Status LED */}
      <mesh position={[-0.35,1.10,0]}>
        <sphereGeometry args={[0.07,8,8]}/>
        <meshStandardMaterial color={col} emissive={col} emissiveIntensity={health<=40?0.45:0.75}/>
      </mesh>
      {health<=40 && <pointLight color="#EF4444" intensity={1.0} distance={3} decay={2.5}/>}
      {isSelected && <SelectionRing radius={0.88} y={-0.12}/>}
      {isHovered && !isSelected && <Tooltip eq={data} sensor={sensor}/>}
    </group>
  );
}

function CoolingTower({ data, isSelected, isHovered, sensor, onClick, onPointerOver, onPointerOut }) {
  const { position, params, health } = data;
  const { w=9, h=9 } = params;
  const fanRef = useRef();
  useFrame(() => { if (fanRef.current) fanRef.current.rotation.y += 0.032*(health/80); });
  return (
    <group position={position} onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      {/* Shell */}
      <mesh position={[0,h/2,0]}>
        <cylinderGeometry args={[w/2,w/2*0.75,h,32]}/>
        <meshStandardMaterial {...M.concrete} transparent opacity={0.90}/>
      </mesh>
      {/* Top ring */}
      <mesh position={[0,h,0]} rotation={[Math.PI/2,0,0]}>
        <torusGeometry args={[w/2,0.12,10,48]}/>
        <meshStandardMaterial {...M.painted}/>
      </mesh>
      {/* Fan housing */}
      <mesh position={[0,h+0.3,0]}>
        <cylinderGeometry args={[w/2-0.2,w/2-0.1,0.55,32]}/>
        <meshStandardMaterial {...M.steelDark}/>
      </mesh>
      {/* Rotating fans */}
      <group ref={fanRef} position={[0,h+0.52,0]}>
        {[0,1,2,3].map((i) => (
          <mesh key={i} rotation={[0,i*Math.PI/2,0]}>
            <boxGeometry args={[w/2-0.6,0.05,0.75]}/>
            <meshStandardMaterial {...M.steelDark}/>
          </mesh>
        ))}
      </group>
      <Nozzle pos={[0,h*0.1,w/2]} dir={[0,0,1]} r={0.28} len={1}/>
      <Nozzle pos={[0,h*0.1,-w/2]} dir={[0,0,-1]} r={0.28} len={1}/>
      <SteamParticles position={[0,h+0.8,0]} count={65} spread={w*0.35}/>
      <StatusRing radius={w/2*0.40} y={h+1.3} health={health}/>
      {isSelected && <SelectionRing radius={w/2+0.15} y={0.05}/>}
      {isHovered && !isSelected && <Tooltip eq={data} sensor={sensor}/>}
    </group>
  );
}

function FlareStack({ data, isSelected, isHovered, sensor, onClick, onPointerOver, onPointerOut }) {
  const { position, params } = data;
  const { h=32, r=0.4 } = params;
  const flameRef = useRef();
  const lightRef = useRef();
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (flameRef.current) {
      flameRef.current.scale.x = 1+Math.sin(t*6)*0.12;
      flameRef.current.scale.z = 1+Math.cos(t*4)*0.10;
      flameRef.current.scale.y = 1+Math.sin(t*9)*0.08;
      flameRef.current.material.emissiveIntensity = 1.8+Math.sin(t*7)*0.55;
    }
    if (lightRef.current) lightRef.current.intensity = 4.5+Math.sin(t*6)*1.2;
  });
  return (
    <group position={position} onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      {/* Stack */}
      <mesh position={[0,h/2,0]}>
        <cylinderGeometry args={[r,r*1.2,h,12]}/>
        <meshStandardMaterial {...M.steel}/>
      </mesh>
      {/* KO drum */}
      <mesh position={[-2,1.5,0]} rotation={[0,0,Math.PI/2]}>
        <cylinderGeometry args={[1.2,1.2,4,16]}/>
        <meshStandardMaterial {...M.steelDark}/>
      </mesh>
      {/* Flare tip */}
      <mesh position={[0,h,0]}>
        <cylinderGeometry args={[r*0.6,r*0.8,1.0,12]}/>
        <meshStandardMaterial {...M.steelDark}/>
      </mesh>
      {/* Flame */}
      <mesh ref={flameRef} position={[0,h+2.4,0]}>
        <coneGeometry args={[1.0,3.0,16]}/>
        <meshStandardMaterial color="#FF4000" emissive="#FF5500" emissiveIntensity={1.8} transparent opacity={0.80}/>
      </mesh>
      <pointLight ref={lightRef} position={[0,h+2,0]} color="#FF5000" intensity={4.5} distance={22} decay={2.2}/>
      <FlameParticles position={[0,h+1.5,0]}/>
      {/* Aviation obstruction lights */}
      {[h*0.33,h*0.66].map((y,i) => (
        <mesh key={i} position={[0,y,0]}>
          <sphereGeometry args={[0.11,8,8]}/>
          <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={1.2}/>
        </mesh>
      ))}
      {/* Guy wires */}
      {[0,1,2].map((i) => {
        const a = i*Math.PI*2/3;
        const pts = [new THREE.Vector3(Math.cos(a)*8,0,Math.sin(a)*8), new THREE.Vector3(0,h*0.7,0)];
        return (
          <line key={i}>
            <bufferGeometry setFromPoints={pts}/>
            <lineBasicMaterial color="#4A5562" transparent opacity={0.42}/>
          </line>
        );
      })}
      {isHovered && !isSelected && <Tooltip eq={data} sensor={sensor}/>}
    </group>
  );
}

// ═══════════════════════════════════════════════════════
//  PIPES
// ═══════════════════════════════════════════════════════

// Default — static metallic, no animation
function StaticPipe({ start, end, radius=0.07 }) {
  const geo = useMemo(() => {
    const curve = new THREE.LineCurve3(new THREE.Vector3(...start), new THREE.Vector3(...end));
    return new THREE.TubeGeometry(curve, 4, radius, 8, false);
  }, [start, end, radius]);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial {...M.pipe}/>
    </mesh>
  );
}

// Selected / alarmed — animated flow
function FlowPipe({ start, end, color="#38BDF8", radius=0.07 }) {
  const matRef = useRef();
  const geo = useMemo(() => {
    const curve = new THREE.LineCurve3(new THREE.Vector3(...start), new THREE.Vector3(...end));
    return new THREE.TubeGeometry(curve, 5, radius, 8, false);
  }, [start, end, radius]);
  useFrame((s) => { if (matRef.current) matRef.current.uTime = s.clock.elapsedTime; });
  return (
    <mesh geometry={geo}>
      {/* @ts-ignore */}
      <flowMaterial ref={matRef} uColor={new THREE.Color(color)} transparent side={THREE.DoubleSide}/>
    </mesh>
  );
}

// ─── Pipe rack structural steelwork ──────────────────────────────────────────
function PipeRack({ position=[0,0,5] }) {
  const length=44, cols=10, h=5;
  const spacing=length/(cols-1);
  return (
    <group position={position}>
      {Array.from({length:cols}).map((_,i) => (
        <group key={i} position={[i*spacing-length/2,0,0]}>
          {[-2.5,2.5].map((z,j) => (
            <mesh key={j} position={[0,h/2,z]}>
              <boxGeometry args={[0.2,h,0.2]}/>
              <meshStandardMaterial {...M.steelDark}/>
            </mesh>
          ))}
          <mesh position={[0,h,0]}>
            <boxGeometry args={[0.14,0.14,5.6]}/>
            <meshStandardMaterial {...M.steelDark}/>
          </mesh>
        </group>
      ))}
      {[h,h-1.5].map((y,i) => (
        <mesh key={i} position={[0,y,0]}>
          <boxGeometry args={[length,0.1,0.1]}/>
          <meshStandardMaterial {...M.steelDark}/>
        </mesh>
      ))}
      {/* Static metallic pipes on rack */}
      {[0,-0.7,-1.4,-2.1,0.7,1.4].map((z,i) => (
        <mesh key={i} position={[0,h+0.2,z]} rotation={[0,0,Math.PI/2]}>
          <cylinderGeometry args={[0.07,0.07,length,8,1,false]}/>
          <meshStandardMaterial {...M.pipe} color={i<3?"#7E8B94":"#848A72"}/>
        </mesh>
      ))}
    </group>
  );
}

// ─── Ground & paving ─────────────────────────────────────────────────────────
function Ground() {
  return (
    <group>
      {/* Dark earth perimeter */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.05,0]}>
        <planeGeometry args={[110,110,20,20]}/>
        <meshStandardMaterial color="#12161A" metalness={0} roughness={0.98}/>
      </mesh>
      {/* Plant concrete paving */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.04,0]}>
        <planeGeometry args={[65,65]}/>
        <meshStandardMaterial color="#20252C" metalness={0} roughness={0.97}/>
      </mesh>
      {/* Roads */}
      {[[-20,true],[0,false]].map(([v,horiz],i) => (
        <mesh key={i} rotation={[-Math.PI/2,0,0]} position={[horiz?v:0,-0.03,horiz?0:v]}>
          <planeGeometry args={horiz?[70,4.5]:[4.5,70]}/>
          <meshStandardMaterial color="#444C56" roughness={0.95}/>
        </mesh>
      ))}
      {/* Concrete bunds */}
      {[[-8,0,6],[8,0,6],[0,0,-8]].map(([x,y,z],i) => (
        <mesh key={i} rotation={[-Math.PI/2,0,0]} position={[x,y-0.01,z]}>
          <ringGeometry args={[4.5,5.0,32]}/>
          <meshStandardMaterial color="#2A3038" roughness={0.98}/>
        </mesh>
      ))}
    </group>
  );
}

// ─── Control building ─────────────────────────────────────────────────────────
function ControlBuilding({ position=[-22,0,4] }) {
  return (
    <group position={position}>
      {/* Main structure — charcoal */}
      <mesh position={[0,3,0]}>
        <boxGeometry args={[9,6,5.5]}/>
        <meshStandardMaterial color="#2F3640" metalness={0.12} roughness={0.88}/>
      </mesh>
      {/* Roof parapet */}
      <mesh position={[0,6.2,0]}>
        <boxGeometry args={[9.4,0.4,5.9]}/>
        <meshStandardMaterial {...M.steelDark}/>
      </mesh>
      {/* Control room windows — subtle DCS blue-grey */}
      {[-2.5,0,2.5].map((x,i) => (
        <mesh key={i} position={[x,3.8,2.78]}>
          <boxGeometry args={[1.4,1.0,0.04]}/>
          <meshStandardMaterial color="#1C304E" emissive="#0A1E38" emissiveIntensity={0.85} transparent opacity={0.88}/>
        </mesh>
      ))}
      {/* Entrance door */}
      <mesh position={[0,1.2,2.78]}>
        <boxGeometry args={[1.2,2.4,0.04]}/>
        <meshStandardMaterial color="#1A222E"/>
      </mesh>
      {/* Exterior sodium vapour lamp — very subtle warm */}
      <pointLight position={[0,7.5,2]} color="#D4B96A" intensity={0.9} distance={9} decay={2.5}/>
    </group>
  );
}

// ─── Bright daylight industrial lighting ──────────────────────────────────────
function SceneLights() {
  return (
    <>
      {/* Ambient — soft twilight industrial */}
      <ambientLight intensity={0.18} color="#07101E"/>
      {/* Primary directional — cool white */}
      <directionalLight position={[40,60,20]} intensity={0.58} color="#C8DCF0"/>
      {/* Back fill */}
      <directionalLight position={[-25,12,-20]} intensity={0.08} color="#0A1420"/>
      {/* Ground bounce */}
      <pointLight position={[0,0.5,0]} color="#182030" intensity={2.0} distance={38} decay={1.0}/>
    </>
  );
}

// ─── Complete scene ───────────────────────────────────────────────────────────
function RefineryScene({ onSelect }) {
  const { selectedAsset, hoveredAsset, setHovered, sensorData } = usePlantStore();

  const makeHandlers = useCallback((eq) => ({
    onClick:       (e) => { e.stopPropagation(); onSelect(eq); },
    onPointerOver: (e) => { e.stopPropagation(); setHovered(eq); document.body.style.cursor="pointer"; },
    onPointerOut:  ()  => { setHovered(null); document.body.style.cursor="auto"; },
  }), [onSelect, setHovered]);

  const renderEq = useCallback((eq) => {
    const isSel  = selectedAsset?.id === eq.id;
    const isHov  = hoveredAsset?.id === eq.id;
    const sensor = sensorData[eq.id];
    const shared = { data:eq, isSelected:isSel, isHovered:isHov, sensor, ...makeHandlers(eq) };
    switch (eq.type) {
      case "tank":         return <StorageTank        key={eq.id} {...shared}/>;
      case "column":       return <DistillationColumn key={eq.id} {...shared}/>;
      case "hx":           return <HeatExchanger      key={eq.id} {...shared}/>;
      case "reactor":      return <Reactor             key={eq.id} {...shared}/>;
      case "compressor":   return <Compressor          key={eq.id} {...shared}/>;
      case "pump":         return <Pump                key={eq.id} {...shared}/>;
      case "coolingTower": return <CoolingTower        key={eq.id} {...shared}/>;
      case "flare":        return <FlareStack          key={eq.id} {...shared}/>;
      default: return null;
    }
  }, [selectedAsset, hoveredAsset, sensorData, makeHandlers]);

  return (
    <>
      <SceneLights/>
      <Ground/>
      {/* Subtle distant stars — low saturation night sky */}
      <Stars radius={140} depth={60} count={2200} factor={3} saturation={0.15} fade speed={0.18}/>
      <fog attach="fog" color="#1A2A3C" near={72} far={158}/>
      <PipeRack position={[0,0,5]}/>
      <ControlBuilding/>

      {EQUIPMENT.map(renderEq)}

      {/* Pipe connections — static by default, animated only for selected or critical */}
      {PIPE_CONNECTIONS.map(([srcId,dstId],i) => {
        const src = EQUIPMENT.find(e=>e.id===srcId);
        const dst = EQUIPMENT.find(e=>e.id===dstId);
        if (!src||!dst) return null;

        const selSrc  = selectedAsset?.id === srcId;
        const selDst  = selectedAsset?.id === dstId;
        const critSrc = src.health < 40;
        const critDst = dst.health < 40;
        const flow    = selSrc || selDst || critSrc || critDst;
        const clr     = (selSrc||selDst) ? "#38BDF8" : "#EF4444";

        const sp  = [src.position[0], src.position[1]+1, src.position[2]];
        const dp  = [dst.position[0], dst.position[1]+1, dst.position[2]];
        const mid = [(sp[0]+dp[0])/2, Math.max(sp[1],dp[1])+2.5, (sp[2]+dp[2])/2];

        return (
          <group key={i}>
            {flow ? (
              <>
                <FlowPipe start={sp} end={mid} color={clr} radius={0.07}/>
                <FlowPipe start={mid} end={dp} color={clr} radius={0.07}/>
              </>
            ) : (
              <>
                <StaticPipe start={sp} end={mid} radius={0.07}/>
                <StaticPipe start={mid} end={dp} radius={0.07}/>
              </>
            )}
          </group>
        );
      })}

      {/* Click-away deselect */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.06,0]} onClick={()=>onSelect(null)}>
        <planeGeometry args={[200,200]}/>
        <meshStandardMaterial visible={false}/>
      </mesh>
    </>
  );
}

// ─── Camera controller ────────────────────────────────────────────────────────
function CameraController() {
  const { camera } = useThree();
  const ctrlRef = useRef();
  const { cameraTarget, setCameraTarget } = usePlantStore();

  useEffect(() => {
    if (!cameraTarget) return;
    const { position, target } = cameraTarget;
    gsap.to(camera.position, { x:position[0], y:position[1], z:position[2], duration:1.2, ease:"power3.inOut" });
    if (ctrlRef.current) {
      gsap.to(ctrlRef.current.target, {
        x:target[0], y:target[1], z:target[2], duration:1.2, ease:"power3.inOut",
        onUpdate: () => ctrlRef.current.update(),
      });
    }
    setCameraTarget(null);
  }, [cameraTarget, camera, setCameraTarget]);

  return (
    <OrbitControls ref={ctrlRef} enableDamping dampingFactor={0.06}
      rotateSpeed={0.7} zoomSpeed={1.2} panSpeed={0.8}
      minDistance={3} maxDistance={95}
      maxPolarAngle={Math.PI/2-0.04}/>
  );
}

// ─── Minimap ──────────────────────────────────────────────────────────────────
function MiniMap() {
  const { selectedAsset } = usePlantStore();
  return (
    <div style={{
      position:"absolute",bottom:10,right:10,
      width:115,height:95,
      background:"rgba(4,7,14,0.93)",
      border:"1px solid rgba(56,189,248,0.16)",
      borderRadius:4,overflow:"hidden",
    }}>
      <div style={{position:"relative",width:"100%",height:"100%"}}>
        {EQUIPMENT.map(eq => {
          const col   = healthColor(eq.health);
          const x     = (eq.position[0]+27)/58*100;
          const y     = (eq.position[2]+28)/60*100;
          const isSel = selectedAsset?.id === eq.id;
          return (
            <div key={eq.id} style={{
              position:"absolute",left:`${x}%`,top:`${y}%`,
              width:isSel?8:4,height:isSel?8:4,borderRadius:"50%",
              background:isSel?"#38BDF8":col,
              transform:"translate(-50%,-50%)",
              boxShadow:isSel?"0 0 5px #38BDF8":"none",
              transition:"all .2s",
            }}/>
          );
        })}
      </div>
      <div style={{
        position:"absolute",bottom:2,left:0,right:0,textAlign:"center",
        fontSize:8,color:"rgba(56,189,248,0.38)",fontFamily:"JetBrains Mono,monospace",
      }}>PLANT MAP</div>
    </div>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────
function Toolbar({ onReset, onFullscreen }) {
  const { heatMapMode, setHeatMapMode } = usePlantStore();
  const BtnStyle = (active) => ({
    width:30,height:30,borderRadius:4,marginBottom:4,display:"flex",
    alignItems:"center",justifyContent:"center",cursor:"pointer",
    background:active?"rgba(56,189,248,0.16)":"rgba(4,8,18,0.92)",
    border:`1px solid ${active?"rgba(56,189,248,0.50)":"rgba(56,189,248,0.16)"}`,
    color:"#38BDF8",fontSize:12,
  });
  return (
    <div style={{position:"absolute",top:10,right:10,display:"flex",flexDirection:"column",gap:0}}>
      <button title="Reset view" onClick={onReset} style={BtnStyle(false)}>⟳</button>
      <button title="Fullscreen" onClick={onFullscreen} style={BtnStyle(false)}>⛶</button>
      <div style={{borderTop:"1px solid rgba(56,189,248,0.10)",marginTop:4,paddingTop:4}}>
        {["T","P","V"].map((k,i) => {
          const modes = ["temperature","pressure","vibration"];
          const active = heatMapMode === modes[i];
          return (
            <button key={k} title={modes[i]+" heatmap"} onClick={()=>setHeatMapMode(active?null:modes[i])} style={BtnStyle(active)}>
              {k}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Search ───────────────────────────────────────────────────────────────────
function SearchBox() {
  const [q, setQ] = useState("");
  const { setCameraTarget, setSelected } = usePlantStore();
  const go = () => {
    const eq = EQUIPMENT.find(e =>
      e.id.toLowerCase().includes(q.toLowerCase()) ||
      e.name.toLowerCase().includes(q.toLowerCase()) ||
      e.area?.toLowerCase().includes(q.toLowerCase())
    );
    if (!eq) return;
    const [px,,pz] = eq.position;
    const h2 = (eq.params?.h ?? 2);
    setCameraTarget({ position:[px+7,h2*0.6+6,pz+11], target:[px,h2*0.3,pz] });
    setSelected(eq);
    setQ("");
  };
  return (
    <div style={{position:"absolute",top:10,left:10,display:"flex",gap:6}}>
      <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()}
        placeholder="Search equipment tag…"
        style={{
          background:"rgba(4,8,18,0.93)",
          border:"1px solid rgba(56,189,248,0.22)",
          borderRadius:4,color:"#C0CCDA",padding:"5px 10px",fontSize:10.5,
          fontFamily:"JetBrains Mono,monospace",outline:"none",width:175,
        }}
      />
      <button onClick={go} style={{
        background:"rgba(56,189,248,0.10)",
        border:"1px solid rgba(56,189,248,0.25)",
        color:"#38BDF8",borderRadius:4,padding:"5px 10px",cursor:"pointer",fontSize:12,
      }}>⌕</button>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function Legend() {
  const items = [
    ["#22C55E",">70%  Healthy"],
    ["#FBBF24","40-70% Warning"],
    ["#EF4444","<40%  Critical"],
    ["#38BDF8","Selected"],
    ["#00E5FF","AI Scan Active"],
  ];
  return (
    <div style={{
      position:"absolute",bottom:10,left:10,
      background:"rgba(4,7,14,0.93)",
      border:"1px solid rgba(56,189,248,0.13)",
      borderRadius:4,padding:"6px 10px",fontSize:9,
      fontFamily:"JetBrains Mono,monospace",
    }}>
      {items.map(([c,l]) => (
        <div key={l} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:c,flexShrink:0}}/>
          <span style={{color:"#5A6A7E"}}>{l}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Exported navbar (rendered outside the canvas in Dashboard) ───────────────
export function Plant3DNavbar({ containerRef }) {
  const [q, setQ] = useState("");
  const { heatMapMode, setHeatMapMode, setCameraTarget, setSelected } = usePlantStore();

  const go = () => {
    const eq = EQUIPMENT.find(e =>
      e.id.toLowerCase().includes(q.toLowerCase()) ||
      e.name.toLowerCase().includes(q.toLowerCase()) ||
      e.area?.toLowerCase().includes(q.toLowerCase())
    );
    if (!eq) return;
    const [px,,pz] = eq.position;
    const h2 = (eq.params?.h ?? 2);
    setCameraTarget({ position:[px+7,h2*0.6+6,pz+11], target:[px,h2*0.3,pz] });
    setSelected(eq);
    setQ("");
  };

  const handleReset = () => {
    setCameraTarget({ position:[0,35,55], target:[0,0,-5] });
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) containerRef?.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  const btnBase = (active) => ({
    height: 30, borderRadius: 4, padding: "0 10px",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", fontSize: 11, fontWeight: 600,
    background: active ? "rgba(56,189,248,0.15)" : "rgba(37,99,235,0.06)",
    border: `1px solid ${active ? "rgba(56,189,248,0.55)" : "rgba(37,99,235,0.18)"}`,
    color: active ? "#0EA5E9" : "var(--text2)",
    transition: "all .15s",
  });

  return (
    <div style={{
      height: "100%",
      display: "flex", alignItems: "center", gap: 8,
      padding: "0 14px",
      background: "rgba(26,42,60,0.96)",
      borderTop: "1px solid rgba(56,189,248,0.12)",
      borderBottom: "1px solid rgba(56,189,248,0.12)",
    }}>
      {/* Search */}
      <div style={{ display: "flex", gap: 4, flex: 1, maxWidth: 280 }}>
        <input
          value={q} onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && go()}
          placeholder="Search equipment tag…"
          style={{
            flex: 1,
            background: "rgba(4,8,18,0.80)",
            border: "1px solid rgba(56,189,248,0.22)",
            borderRadius: 4, color: "#C0CCDA",
            padding: "5px 10px", fontSize: 10.5,
            fontFamily: "JetBrains Mono, monospace", outline: "none",
          }}
        />
        <button onClick={go} style={{
          ...btnBase(false), padding: "0 10px", color: "#38BDF8",
          background: "rgba(56,189,248,0.10)",
          border: "1px solid rgba(56,189,248,0.25)",
        }}>⌕</button>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 22, background: "rgba(56,189,248,0.15)" }}/>

      {/* Label */}
      <span style={{ fontSize: 9, color: "rgba(56,189,248,0.5)", fontFamily: "JetBrains Mono,monospace", letterSpacing: 1, textTransform: "uppercase" }}>Heatmap</span>

      {/* T / P / V heatmap toggles */}
      {["T","P","V"].map((k, i) => {
        const modes = ["temperature", "pressure", "vibration"];
        const labels = ["Temperature", "Pressure", "Vibration"];
        const active = heatMapMode === modes[i];
        return (
          <button key={k} title={labels[i]} onClick={() => setHeatMapMode(active ? null : modes[i])} style={btnBase(active)}>
            {k}
          </button>
        );
      })}

      {/* Divider */}
      <div style={{ width: 1, height: 22, background: "rgba(56,189,248,0.15)" }}/>

      {/* Reset + Fullscreen */}
      <button title="Reset camera" onClick={handleReset} style={btnBase(false)}>⟳ Reset</button>
      <button title="Fullscreen" onClick={handleFullscreen} style={btnBase(false)}>⛶</button>

      {/* 3D badge */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#38BDF8", boxShadow: "0 0 6px #38BDF8", animation: "pulse-dot 1.4s infinite" }}/>
        <span style={{ fontSize: 9, color: "rgba(56,189,248,0.7)", fontFamily: "JetBrains Mono,monospace", letterSpacing: 1 }}>3D SCENE LIVE</span>
      </div>
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────
export default function Plant3D({ onAssetSelect, containerRef: extRef }) {
  const internalRef = useRef();
  const containerRef = extRef || internalRef;
  const { setSelected } = usePlantStore();

  const handleSelect = useCallback((eq) => {
    setSelected(eq);
    if (onAssetSelect) onAssetSelect(eq);
  }, [setSelected, onAssetSelect]);

  return (
    <div ref={containerRef} style={{ width:"100%", height:"100%", position:"relative", background:"#1A2A3C" }}>
      <Canvas
        camera={{ position:[0,35,55], fov:52, near:0.1, far:300 }}
        gl={{ antialias:true, toneMapping:THREE.ACESFilmicToneMapping, toneMappingExposure:0.78 }}
        style={{ background:"#1A2A3C" }}
      >
        <color attach="background" args={["#1A2A3C"]}/>
        <Suspense fallback={null}>
          <CameraController/>
          <RefineryScene onSelect={handleSelect}/>
          <EffectComposer multisampling={0}>
            <Bloom intensity={0.32} luminanceThreshold={0.88} luminanceSmoothing={0.06} radius={0.42} mipmapBlur/>
            <Vignette darkness={0.46} offset={0.32}/>
          </EffectComposer>
        </Suspense>
      </Canvas>

      <MiniMap/>
      <Legend/>
    </div>
  );
}
