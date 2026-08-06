"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * The hero backdrop: a dark water plane whose surface is displaced by summed
 * sine waves, lit from the horizon, with drifting particles above it. Pure
 * shader work — no textures to download, so it costs nothing on first paint.
 */
const vertex = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying float vElevation;

  float wave(vec2 p, vec2 dir, float freq, float speed, float amp) {
    return sin(dot(p, dir) * freq + uTime * speed) * amp;
  }

  void main() {
    vUv = uv;
    vec3 pos = position;

    float e = 0.0;
    e += wave(pos.xy, normalize(vec2(1.0, 0.35)), 2.1, 0.55, 0.17);
    e += wave(pos.xy, normalize(vec2(-0.4, 1.0)), 3.2, 0.42, 0.11);
    e += wave(pos.xy, normalize(vec2(0.8, -0.6)), 5.6, 0.78, 0.055);
    e += wave(pos.xy, normalize(vec2(1.0, 1.0)), 9.4, 1.15, 0.025);

    pos.z += e;
    vElevation = e;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    // deep navy trough → cyan-lit crest
    vec3 deep = vec3(0.016, 0.035, 0.055);
    vec3 mid  = vec3(0.031, 0.106, 0.149);
    vec3 crest = vec3(0.133, 0.827, 0.933);

    float h = smoothstep(-0.22, 0.26, vElevation);
    vec3 color = mix(deep, mid, h);

    // rim light only on the sharpest crests, so the glow stays scarce
    float rim = smoothstep(0.16, 0.3, vElevation);
    color = mix(color, crest, rim * 0.38);

    // fade toward the horizon so the plane dissolves instead of ending
    float horizon = smoothstep(0.0, 0.55, vUv.y);
    float alpha = mix(0.0, 1.0, horizon);

    gl_FragColor = vec4(color, alpha);
  }
`;

function Water() {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((_, delta) => {
    if (material.current) material.current.uniforms.uTime.value += delta;
  });

  return (
    <mesh rotation={[-Math.PI / 2.35, 0, 0]} position={[0, -1.3, 0]}>
      <planeGeometry args={[26, 18, 220, 150]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

function Particles({ count = 340 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 18;
      arr[i * 3 + 1] = Math.random() * 5 - 0.6;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!points.current) return;
    const t = state.clock.elapsedTime;
    points.current.rotation.y = t * 0.014;
    const attr = points.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const base = positions[i * 3 + 1];
      attr.setY(i, base + Math.sin(t * 0.35 + i) * 0.12);
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#7fe6f5"
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function WaterScene() {
  const reduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <Canvas
      camera={{ position: [0, 1.5, 6.4], fov: 46 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={reduced ? "demand" : "always"}
      style={{ position: "absolute", inset: 0 }}
    >
      <Water />
      <Particles />
      <fog attach="fog" args={["#05070b", 7, 17]} />
    </Canvas>
  );
}
