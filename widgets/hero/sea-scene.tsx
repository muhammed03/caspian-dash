"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import caspian from "@/data/geo/caspian.json";
import coast2025 from "@/data/coastlines/2025.json";

type Ring = [number, number][];

/**
 * The hero object is the sea itself: the Caspian extruded into a solid,
 * floating slab of ink, with the 2025 shoreline traced on top of the 1992
 * outline. It rotates slowly, so the shape reads as a physical thing that is
 * losing volume rather than as a diagram.
 */
const LON_C = 50.9;
const LAT_C = 42.2;
const SCALE = 0.62;

function toShape(ring: Ring, step = 2): THREE.Shape {
  const shape = new THREE.Shape();
  const pts = ring.filter((_, i) => i % step === 0);
  pts.forEach(([lon, lat], i) => {
    // flat projection is fine at this scale and keeps the silhouette honest
    const x = (lon - LON_C) * SCALE;
    const y = (lat - LAT_C) * SCALE * 1.32;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  return shape;
}

function toPoints(ring: Ring, step = 2, z = 0): THREE.Vector3[] {
  return ring
    .filter((_, i) => i % step === 0)
    .map(([lon, lat]) => new THREE.Vector3((lon - LON_C) * SCALE, (lat - LAT_C) * SCALE * 1.32, z));
}

function SeaBody() {
  const group = useRef<THREE.Group>(null);

  const { geometry, outline1992, outline2025 } = useMemo(() => {
    const ring1992 = (caspian.features[0].geometry.coordinates as unknown as Ring[])[0];
    const ring2025 = (coast2025.features[0].geometry.coordinates as unknown as Ring[])[0];

    const shape = toShape(ring1992);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.5,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelSegments: 2,
    });
    geo.center();

    return {
      geometry: geo,
      outline1992: toPoints(ring1992, 2, 0.27),
      outline2025: toPoints(ring2025, 2, 0.29),
    };
  }, []);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.y = Math.sin(t * 0.16) * 0.34 + 0.2;
    group.current.rotation.x = -0.42 + Math.sin(t * 0.11) * 0.06;
    group.current.position.y = Math.sin(t * 0.4) * 0.06;
  });

  return (
    <group ref={group}>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial color="#a9cdf0" roughness={0.35} metalness={0.08} />
      </mesh>

      {/* 1992 shoreline — where the water used to reach */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(outline1992.flatMap((p) => [p.x, p.y, p.z])), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#7a8894" transparent opacity={0.8} />
      </line>

      {/* 2025 shoreline — where it reaches now */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(outline2025.flatMap((p) => [p.x, p.y, p.z])), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#1d6fd0" />
      </line>
    </group>
  );
}

export function SeaScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.3, 9.2], fov: 40 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <ambientLight intensity={0.72} />
      <directionalLight position={[4, 6, 5]} intensity={1.5} />
      <directionalLight position={[-5, -2, 3]} intensity={0.45} color="#9fc6ea" />
      <SeaBody />
    </Canvas>
  );
}
