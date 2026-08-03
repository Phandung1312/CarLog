import { Canvas, useFrame } from "@react-three/fiber";
import {
  CameraControls,
  ContactShadows,
  Environment,
  Grid,
  Html,
  Line,
  RoundedBox,
  useGLTF,
} from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { speedSignalFlow } from "../../data/scenarios";
import { componentById, vehicleComponents } from "../../data/vehicle";
import { useAppStore } from "../../store/useAppStore";
import type { VehicleComponent } from "../../types";

const learningColors = {
  "Not started": "#6b747b",
  Learning: "#e5a85c",
  Reviewed: "#64aebe",
  Mastered: "#66ba91",
  "Needs revision": "#d97b69",
};

type DisplayKind = "infotainment" | "cluster" | "passenger";

function createDisplayTexture(kind: DisplayKind) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 600;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const gradient = context.createLinearGradient(0, 0, 1024, 600);
  gradient.addColorStop(0, "#07151b");
  gradient.addColorStop(0.55, "#0b2028");
  gradient.addColorStop(1, "#071116");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1024, 600);

  context.strokeStyle = "rgba(117, 213, 229, .12)";
  context.lineWidth = 1;
  for (let x = 0; x <= 1024; x += 64) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, 600);
    context.stroke();
  }
  for (let y = 0; y <= 600; y += 60) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(1024, y);
    context.stroke();
  }

  context.font = "600 25px Inter, Arial";
  context.fillStyle = "#cde9ee";
  context.fillText(kind === "cluster" ? "DRIVE" : "ANDROID AUTOMOTIVE", 42, 54);
  context.textAlign = "right";
  context.fillStyle = "#7e9ba3";
  context.fillText("09:41", 980, 54);
  context.textAlign = "left";

  if (kind === "cluster") {
    context.strokeStyle = "#55c9da";
    context.lineWidth = 12;
    context.beginPath();
    context.arc(512, 330, 176, Math.PI * 0.77, Math.PI * 2.23);
    context.stroke();
    context.strokeStyle = "#e4a65d";
    context.beginPath();
    context.arc(512, 330, 176, Math.PI * 0.77, Math.PI * 1.45);
    context.stroke();
    context.fillStyle = "#effbfc";
    context.font = "700 150px Inter, Arial";
    context.textAlign = "center";
    context.fillText("84", 512, 373);
    context.font = "600 26px Inter, Arial";
    context.fillStyle = "#83a4ac";
    context.fillText("km/h", 512, 420);
    context.font = "700 42px Inter, Arial";
    context.fillStyle = "#e4a65d";
    context.fillText("D", 512, 516);
    context.font = "500 24px Inter, Arial";
    context.fillStyle = "#8eabb2";
    context.textAlign = "left";
    context.fillText("RANGE  326 km", 54, 530);
    context.textAlign = "right";
    context.fillText("22.5 °C", 968, 530);
  } else if (kind === "passenger") {
    context.fillStyle = "#102b34";
    context.roundRect(42, 94, 940, 300, 28);
    context.fill();
    context.fillStyle = "#e7f5f7";
    context.font = "700 48px Inter, Arial";
    context.fillText("Passenger space", 82, 164);
    context.fillStyle = "#7fa1a9";
    context.font = "500 25px Inter, Arial";
    context.fillText("Media · Apps · Comfort", 82, 210);
    ["MEDIA", "GAMES", "BROWSER"].forEach((label, index) => {
      const x = 82 + index * 292;
      context.fillStyle = index === 0 ? "#2a7c89" : "#183b44";
      context.roundRect(x, 258, 245, 92, 18);
      context.fill();
      context.fillStyle = "#d9eff2";
      context.font = "600 22px Inter, Arial";
      context.fillText(label, x + 28, 315);
    });
    context.fillStyle = "#56c7d7";
    context.fillRect(42, 450, 940, 5);
    context.fillStyle = "#91afb6";
    context.font = "500 24px Inter, Arial";
    context.fillText("Connected · Dolby Atmos · Seat 2", 42, 515);
  } else {
    context.fillStyle = "#102b34";
    context.roundRect(42, 92, 604, 386, 28);
    context.fill();
    context.strokeStyle = "#225766";
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(74, 416);
    context.bezierCurveTo(190, 310, 258, 358, 342, 236);
    context.bezierCurveTo(414, 132, 518, 188, 612, 114);
    context.stroke();
    context.fillStyle = "#e4a65d";
    context.beginPath();
    context.arc(342, 236, 16, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#e8f5f7";
    context.font = "700 32px Inter, Arial";
    context.fillText("12 min", 82, 146);
    context.fillStyle = "#84a5ad";
    context.font = "500 23px Inter, Arial";
    context.fillText("6.4 km · Via Nguyễn Huệ", 82, 182);

    ["22°", "MEDIA", "EV"].forEach((label, index) => {
      const y = 92 + index * 132;
      context.fillStyle = index === 1 ? "#2c7f8d" : "#142f38";
      context.roundRect(682, y, 300, 102, 22);
      context.fill();
      context.fillStyle = "#dff2f4";
      context.font = "700 27px Inter, Arial";
      context.fillText(label, 720, y + 61);
    });
    context.fillStyle = "#708e96";
    context.font = "500 22px Inter, Arial";
    context.fillText("Home", 76, 548);
    context.fillText("Maps", 294, 548);
    context.fillText("Media", 512, 548);
    context.fillText("Vehicle", 730, 548);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  // The screen meshes face the cockpit with their UV origin reversed. Rotate
  // the canvas around its center so UI content matches the physical displays.
  texture.center.set(0.5, 0.5);
  texture.rotation = Math.PI;
  texture.needsUpdate = true;
  return texture;
}

function CockpitScreen({
  component,
  kind,
  size,
}: {
  component: VehicleComponent;
  kind: DisplayKind;
  size: [number, number];
}) {
  const texture = useMemo(() => createDisplayTexture(kind), [kind]);
  const selectedId = useAppStore((state) => state.selectedId);
  const hoveredId = useAppStore((state) => state.hoveredId);
  const isolate = useAppStore((state) => state.isolate);
  const [width, height] = size;
  const active = selectedId === component.id;
  const hovered = hoveredId === component.id;
  const opacity = isolate && selectedId && !active ? 0.06 : selectedId && !active ? 0.48 : 1;

  useEffect(() => () => texture?.dispose(), [texture]);

  return (
    <group rotation={[0.055, 0, 0]}>
      <RoundedBox args={[width + 0.08, height + 0.08, 0.075]} radius={0.055} smoothness={4}>
        <meshPhysicalMaterial
          color="#10181c"
          emissive={active ? "#9a5d21" : hovered ? "#174651" : "#000000"}
          emissiveIntensity={active ? 0.8 : hovered ? 0.45 : 0}
          metalness={0.72}
          roughness={0.26}
          clearcoat={0.68}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </RoundedBox>
      <RoundedBox
        args={[width, height, 0.012]}
        radius={0.035}
        smoothness={4}
        // Cockpit occupants sit behind the dashboard (positive Z). Place the
        // active face on that side instead of pointing it at the vehicle nose.
        position={[0, 0, 0.046]}
      >
        <meshBasicMaterial
          map={texture ?? undefined}
          color={texture ? "#ffffff" : "#0b2028"}
          toneMapped={false}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </RoundedBox>
      <mesh position={[0, -height / 2 - 0.035, 0.052]}>
        <boxGeometry args={[width * 0.28, 0.018, 0.012]} />
        <meshBasicMaterial color="#72d2df" toneMapped={false} />
      </mesh>
    </group>
  );
}

function Cable({
  points,
  color,
  radius = 0.016,
  emissive = false,
}: {
  points: [number, number, number][];
  color: string;
  radius?: number;
  emissive?: boolean;
}) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      points.map((point) => new THREE.Vector3(...point)),
      false,
      "centripetal",
    );
    return new THREE.TubeGeometry(curve, Math.max(24, points.length * 12), radius, 8, false);
  }, [points, radius]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={color}
        emissive={emissive ? color : "#000000"}
        emissiveIntensity={emissive ? 1.35 : 0}
        metalness={0.18}
        roughness={0.42}
      />
    </mesh>
  );
}

function CameraRig() {
  const controls = useRef<any>(null);
  const camera = useAppStore((state) => state.camera);
  const reducedMotion = useAppStore((state) => state.reducedMotion);

  useEffect(() => {
    if (!controls.current) return;
    controls.current.setLookAt(
      ...camera.position,
      ...camera.target,
      !reducedMotion,
    );
  }, [camera, reducedMotion]);

  return (
    <CameraControls
      ref={controls}
      minDistance={2.7}
      maxDistance={18}
      maxPolarAngle={Math.PI / 2.05}
      smoothTime={reducedMotion ? 0.01 : 0.55}
      draggingSmoothTime={0.12}
      dollyToCursor
      makeDefault
    />
  );
}

function PartMaterial({
  component,
  shell = false,
}: {
  component: VehicleComponent;
  shell?: boolean;
}) {
  const selectedId = useAppStore((state) => state.selectedId);
  const hoveredId = useAppStore((state) => state.hoveredId);
  const isolate = useAppStore((state) => state.isolate);
  const xray = useAppStore((state) => state.xray);
  const mode = useAppStore((state) => state.mode);
  const step = useAppStore((state) => state.signalStep);
  const learningOverrides = useAppStore((state) => state.learningOverrides);

  const isSelected = selectedId === component.id;
  const isHovered = hoveredId === component.id;
  const currentSignalId = speedSignalFlow.steps[step]?.componentId;
  const signalActive = mode === "signal" && currentSignalId === component.id;
  const learningStatus =
    learningOverrides[component.id] ?? component.learningStatus;

  let opacity = 1;
  if (shell && xray) opacity = 0.12;
  if (mode === "architecture" && shell) opacity = 0.14;
  if (selectedId && !isSelected && !isolate) opacity = shell ? 0.12 : 0.32;
  if (isolate && !isSelected) opacity = 0.035;

  const color =
    mode === "learning" ? learningColors[learningStatus] : component.color;
  const emissive =
    isSelected || signalActive ? "#df9d4f" : isHovered ? "#4bb6c7" : "#000000";

  return (
    <meshPhysicalMaterial
      color={color}
      emissive={emissive}
      emissiveIntensity={signalActive ? 1.8 : isSelected ? 0.65 : isHovered ? 0.35 : 0}
      metalness={shell ? 0.82 : 0.45}
      roughness={shell ? 0.2 : 0.42}
      clearcoat={shell ? 0.92 : 0.15}
      clearcoatRoughness={shell ? 0.14 : 0.3}
      transparent={opacity < 1}
      opacity={opacity}
      depthWrite={opacity > 0.2}
      side={shell && (xray || mode === "architecture") ? THREE.DoubleSide : THREE.FrontSide}
    />
  );
}

function ProceduralBodyShell({ component }: { component: VehicleComponent }) {
  const xray = useAppStore((state) => state.xray);
  const mode = useAppStore((state) => state.mode);
  const shellOpacity = xray || mode === "architecture" ? 0.14 : 1;

  const bodyGeometry = useMemo(() => {
    const profile = new THREE.Shape();
    profile.moveTo(-2.42, 0.02);
    profile.lineTo(-2.35, 0.32);
    profile.quadraticCurveTo(-2.25, 0.6, -1.75, 0.68);
    profile.lineTo(-1.08, 0.76);
    profile.quadraticCurveTo(-0.75, 1.18, -0.35, 1.36);
    profile.quadraticCurveTo(0.28, 1.62, 1.12, 1.35);
    profile.lineTo(1.75, 0.82);
    profile.quadraticCurveTo(2.22, 0.7, 2.4, 0.42);
    profile.lineTo(2.46, 0.12);
    profile.lineTo(2.28, 0.02);
    profile.closePath();
    const geometry = new THREE.ExtrudeGeometry(profile, {
      depth: 2.1,
      steps: 1,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSize: 0.08,
      bevelThickness: 0.08,
      curveSegments: 20,
    });
    geometry.translate(0, 0, -1.05);
    geometry.rotateY(Math.PI / 2);
    geometry.computeVertexNormals();
    return geometry;
  }, []);

  return (
    <>
      <mesh geometry={bodyGeometry} castShadow receiveShadow>
        <PartMaterial component={component} shell />
      </mesh>

      {/* Side glazing visually cuts the cabin mass into a believable SUV profile. */}
      {[-1.075, 1.075].map((x) => (
        <group key={x} position={[x, 1.09, 0.18]}>
          <RoundedBox args={[0.025, 0.48, 1.82]} radius={0.05} smoothness={3}>
            <meshPhysicalMaterial
              color="#17262c"
              metalness={0.18}
              roughness={0.08}
              transmission={shellOpacity < 1 ? 0.78 : 0.22}
              transparent
              opacity={shellOpacity < 1 ? 0.18 : 0.88}
              depthWrite={shellOpacity === 1}
            />
          </RoundedBox>
          <mesh position={[x > 0 ? 0.017 : -0.017, 0, 0]}>
            <boxGeometry args={[0.018, 0.5, 0.035]} />
            <meshStandardMaterial color="#94a2a8" metalness={0.8} roughness={0.22} />
          </mesh>
        </group>
      ))}

      {/* Panoramic roof and front/rear glass. */}
      <RoundedBox
        args={[1.52, 0.028, 1.58]}
        radius={0.07}
        smoothness={3}
        position={[0, 1.49, 0.25]}
      >
        <meshPhysicalMaterial
          color="#17262c"
          metalness={0.2}
          roughness={0.08}
          transmission={0.2}
          transparent
          opacity={shellOpacity < 1 ? 0.2 : 0.92}
        />
      </RoundedBox>
      <mesh position={[0, 1.18, -0.85]} rotation={[-0.47, 0, 0]}>
        <boxGeometry args={[1.76, 0.035, 0.78]} />
        <meshPhysicalMaterial
          color="#263c44"
          roughness={0.08}
          metalness={0.15}
          transparent
          opacity={shellOpacity < 1 ? 0.16 : 0.82}
        />
      </mesh>
      <mesh position={[0, 1.18, 1.12]} rotation={[0.56, 0, 0]}>
        <boxGeometry args={[1.7, 0.035, 0.62]} />
        <meshPhysicalMaterial
          color="#1c3037"
          roughness={0.1}
          transparent
          opacity={shellOpacity < 1 ? 0.14 : 0.78}
        />
      </mesh>

      {/* Lighting, bumpers and trim remain independent surfaces for better highlights. */}
      {[-0.68, 0.68].map((x) => (
        <RoundedBox
          key={`head-${x}`}
          args={[0.58, 0.09, 0.05]}
          radius={0.035}
          smoothness={3}
          position={[x, 0.53, -2.43]}
          rotation={[0.02, x * 0.08, 0]}
        >
          <meshStandardMaterial
            color="#d9f5f7"
            emissive="#9ee8ef"
            emissiveIntensity={2.4}
            roughness={0.12}
          />
        </RoundedBox>
      ))}
      {[-0.8, 0.8].map((x) => (
        <RoundedBox
          key={`tail-${x}`}
          args={[0.38, 0.12, 0.05]}
          radius={0.035}
          smoothness={3}
          position={[x, 0.65, 2.42]}
        >
          <meshStandardMaterial
            color="#ff5b49"
            emissive="#db321e"
            emissiveIntensity={2}
            roughness={0.18}
          />
        </RoundedBox>
      ))}
      <mesh position={[0, 0.28, -2.44]}>
        <boxGeometry args={[1.82, 0.12, 0.08]} />
        <meshStandardMaterial color="#11171a" metalness={0.72} roughness={0.24} />
      </mesh>
      <mesh position={[0, 0.2, 2.43]}>
        <boxGeometry args={[1.72, 0.1, 0.08]} />
        <meshStandardMaterial color="#11171a" metalness={0.72} roughness={0.24} />
      </mesh>
      {[-1.08, 1.08].map((x) => (
        <mesh key={`trim-${x}`} position={[x, 0.36, 0]}>
          <boxGeometry args={[0.035, 0.07, 3.42]} />
          <meshStandardMaterial color="#859197" metalness={0.92} roughness={0.18} />
        </mesh>
      ))}
    </>
  );
}

function CarConceptShell() {
  const { scene } = useGLTF("/models/CarConcept.glb");
  const selectedId = useAppStore((state) => state.selectedId);
  const hoveredId = useAppStore((state) => state.hoveredId);
  const isolate = useAppStore((state) => state.isolate);
  const xray = useAppStore((state) => state.xray);
  const explode = useAppStore((state) => state.explode);
  const mode = useAppStore((state) => state.mode);

  const shell = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if (
        /^(Interior|Axles|Engine|License)/i.test(object.name)
      ) {
        object.visible = false;
      }
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const sourceMaterials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      const clonedMaterials = sourceMaterials.map((source) => {
        const material = source.clone();
        material.userData.baseOpacity = material.opacity;
        material.userData.baseTransparent = material.transparent;
        material.userData.baseDepthWrite = material.depthWrite;
        material.userData.baseEmissive =
          "emissive" in material &&
          material.emissive instanceof THREE.Color
            ? material.emissive.getHex()
            : 0;
        if (
          "color" in material &&
          material.color instanceof THREE.Color &&
          /Paint/i.test(material.name)
        ) {
          material.color.set("#303a40");
          if ("metalness" in material) material.metalness = 0.82;
          if ("roughness" in material) material.roughness = 0.2;
        }
        return material;
      });
      object.material = Array.isArray(object.material)
        ? clonedMaterials
        : clonedMaterials[0];
    });
    return clone;
  }, [scene]);

  useEffect(() => {
    const bodySelected = selectedId === "body-shell";
    const bodyHovered = hoveredId === "body-shell";
    const shellTransparent = xray || mode === "architecture";
    let opacity = shellTransparent ? 0.12 : 1;
    if (selectedId && !bodySelected && !isolate) opacity = shellTransparent ? 0.055 : 0.22;
    if (isolate && selectedId && !bodySelected) opacity = 0.025;

    shell.traverse((object) => {
      if (/^Wheel/i.test(object.name)) {
        object.visible = explode <= 0.04;
      }
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      const glass = /(Glass|Window|Windshield|Mirror)/i.test(
        `${object.name} ${materials.map((item) => item.name).join(" ")}`,
      );
      materials.forEach((material) => {
        const nextOpacity = Math.min(
          opacity,
          glass
            ? shellTransparent
              ? 0.06
              : 0.76
            : Number(material.userData.baseOpacity ?? 1),
        );
        material.opacity = nextOpacity;
        material.transparent =
          nextOpacity < 0.99 ||
          Boolean(material.userData.baseTransparent);
        material.depthWrite =
          nextOpacity >= 0.3 &&
          Boolean(material.userData.baseDepthWrite ?? true);
        if (
          "emissive" in material &&
          material.emissive instanceof THREE.Color
        ) {
          material.emissive.setHex(
            bodySelected
              ? 0x69451f
              : bodyHovered
                ? 0x163d46
                : Number(material.userData.baseEmissive ?? 0),
          );
        }
        material.needsUpdate = true;
      });
    });
  }, [explode, hoveredId, isolate, mode, selectedId, shell, xray]);

  return (
    <primitive
      object={shell}
      rotation={[0, Math.PI, 0]}
      scale={0.92}
      position={[0, 0, 0]}
    />
  );
}

function ComponentGeometry({ component }: { component: VehicleComponent }) {
  switch (component.id) {
    case "body-shell":
      return (
        <Suspense fallback={<ProceduralBodyShell component={component} />}>
          <CarConceptShell />
        </Suspense>
      );
    case "ivi-display":
      return (
        <CockpitScreen
          component={component}
          kind="infotainment"
          size={[0.82, 0.49]}
        />
      );
    case "cluster":
      return (
        <CockpitScreen component={component} kind="cluster" size={[0.54, 0.31]} />
      );
    case "passenger-display":
      return (
        <CockpitScreen
          component={component}
          kind="passenger"
          size={[0.45, 0.31]}
        />
      );
    case "ivi-compute":
      return (
        <RoundedBox args={[0.86, 0.26, 0.72]} radius={0.08} smoothness={3}>
          <PartMaterial component={component} />
        </RoundedBox>
      );
    case "vhal":
      return (
        <RoundedBox args={[0.48, 0.2, 0.38]} radius={0.05} smoothness={3}>
          <PartMaterial component={component} />
        </RoundedBox>
      );
    case "gateway-ecu":
      return (
        <RoundedBox args={[0.68, 0.26, 0.52]} radius={0.06} smoothness={3}>
          <PartMaterial component={component} />
        </RoundedBox>
      );
    case "audio-amp":
      return (
        <RoundedBox args={[0.72, 0.2, 0.5]} radius={0.04} smoothness={3}>
          <PartMaterial component={component} />
          {[-0.24, -0.12, 0, 0.12, 0.24].map((x) => (
            <mesh key={x} position={[x, 0.115, 0]}>
              <boxGeometry args={[0.035, 0.08, 0.42]} />
              <meshStandardMaterial color="#57636b" metalness={0.7} roughness={0.4} />
            </mesh>
          ))}
        </RoundedBox>
      );
    case "front-camera":
      return (
        <>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.075, 0.095, 0.16, 20]} />
            <PartMaterial component={component} />
          </mesh>
          <mesh position={[0, 0, -0.09]}>
            <sphereGeometry args={[0.046, 16, 12]} />
            <meshPhysicalMaterial color="#111a1f" roughness={0.05} metalness={0.2} />
          </mesh>
        </>
      );
    case "wheel-sensor":
      return (
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.16, 0.045, 10, 22]} />
          <PartMaterial component={component} />
        </mesh>
      );
    case "chassis-frame":
      return (
        <group>
          {[-0.76, 0.76].map((x) => (
            <RoundedBox
              key={`rail-${x}`}
              args={[0.15, 0.18, 3.72]}
              radius={0.045}
              smoothness={3}
              position={[x, 0, 0]}
            >
              <PartMaterial component={component} />
            </RoundedBox>
          ))}
          {[-1.45, -0.72, 0, 0.72, 1.45].map((z) => (
            <RoundedBox
              key={`cross-${z}`}
              args={[1.64, 0.13, 0.14]}
              radius={0.035}
              smoothness={3}
              position={[0, 0.01, z]}
            >
              <PartMaterial component={component} />
            </RoundedBox>
          ))}
          {[-1.36, 1.36].map((z) => (
            <group key={`axle-${z}`} position={[0, 0.08, z]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.065, 0.065, 2.05, 16]} />
                <PartMaterial component={component} />
              </mesh>
              {[-0.92, 0.92].map((x) => (
                <mesh
                  key={x}
                  position={[x, 0.08, 0]}
                  rotation={[0, 0, x > 0 ? -0.52 : 0.52]}
                >
                  <boxGeometry args={[0.5, 0.055, 0.08]} />
                  <PartMaterial component={component} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      );
    case "traction-battery":
      return (
        <group>
          <RoundedBox args={[1.46, 0.2, 2.28]} radius={0.075} smoothness={3}>
            <PartMaterial component={component} />
          </RoundedBox>
          {[-0.47, 0, 0.47].flatMap((x) =>
            [-0.78, -0.27, 0.27, 0.78].map((z) => (
              <RoundedBox
                key={`${x}-${z}`}
                args={[0.41, 0.045, 0.43]}
                radius={0.025}
                smoothness={2}
                position={[x, 0.125, z]}
              >
                <meshStandardMaterial
                  color="#324a50"
                  emissive="#13343a"
                  emissiveIntensity={0.5}
                  metalness={0.42}
                  roughness={0.34}
                />
              </RoundedBox>
            )),
          )}
          <Cable
            points={[
              [0.57, 0.16, 1.0],
              [0.67, 0.18, 0.42],
              [0.67, 0.18, -0.35],
              [0.54, 0.18, -1.02],
            ]}
            color="#e36f29"
            radius={0.025}
          />
          <mesh position={[0.58, 0.17, 1.02]}>
            <boxGeometry args={[0.2, 0.09, 0.13]} />
            <meshStandardMaterial color="#d56a29" roughness={0.4} />
          </mesh>
        </group>
      );
    case "rear-drive-unit":
      return (
        <group rotation={[0, 0, Math.PI / 2]}>
          <mesh>
            <cylinderGeometry args={[0.29, 0.29, 0.56, 24]} />
            <PartMaterial component={component} />
          </mesh>
          {[-0.3, 0.3].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <cylinderGeometry args={[0.13, 0.13, 0.12, 18]} />
              <meshStandardMaterial color="#273238" metalness={0.78} roughness={0.28} />
            </mesh>
          ))}
          {Array.from({ length: 8 }).map((_, index) => (
            <mesh key={index} rotation={[0, index * (Math.PI / 4), 0]}>
              <boxGeometry args={[0.035, 0.54, 0.035]} />
              <meshStandardMaterial color="#a1aaae" metalness={0.82} roughness={0.22} />
            </mesh>
          ))}
        </group>
      );
    case "can-bus":
      return (
        <>
          <Cable
            points={[
              [-1, -0.26, -1.98],
              [-0.82, -0.04, -1.2],
              [-0.55, 0.1, 0.09],
              [0.42, 0.22, 0.16],
              [0.25, 0.16, -0.36],
              [-0.5, 0.59, -0.8],
            ]}
            color="#e09a43"
            radius={0.021}
            emissive
          />
          <Cable
            points={[
              [-0.95, -0.28, -1.98],
              [-0.77, -0.07, -1.18],
              [-0.5, 0.07, 0.09],
              [0.47, 0.19, 0.16],
              [0.3, 0.13, -0.36],
              [-0.45, 0.56, -0.8],
            ]}
            color="#634226"
            radius={0.013}
          />
          {[
            [-1, -0.26, -1.98],
            [-0.55, 0.1, 0.09],
            [0.42, 0.22, 0.16],
            [0.25, 0.16, -0.36],
            [-0.5, 0.59, -0.8],
          ].map((position, index) => (
            <group key={index} position={position as [number, number, number]}>
              <mesh>
                <sphereGeometry args={[0.052, 14, 10]} />
                <PartMaterial component={component} />
              </mesh>
              <pointLight color="#e09a43" intensity={1.1} distance={0.7} />
            </group>
          ))}
        </>
      );
    case "ethernet-backbone":
      return (
        <>
          <Cable
            points={[
              [0.3, -0.08, 0.72],
              [0.44, -0.02, 0.3],
              [0.25, 0.03, -0.25],
              [0.16, 0.39, -0.34],
              [-0.5, 0.37, -0.38],
              [-0.72, 0.35, -0.32],
            ]}
            color="#48bfd2"
            radius={0.023}
            emissive
          />
          <Cable
            points={[
              [0.32, -0.12, 0.72],
              [0.49, -0.06, 0.3],
              [0.3, -0.01, -0.25],
              [0.21, 0.35, -0.34],
              [-0.45, 0.33, -0.38],
              [-0.67, 0.31, -0.32],
            ]}
            color="#173f48"
            radius={0.014}
          />
          {[
            [0.3, -0.08, 0.72],
            [0.25, 0.03, -0.25],
            [0.16, 0.39, -0.34],
            [-0.5, 0.37, -0.38],
            [-0.72, 0.35, -0.32],
          ].map((position, index) => (
            <RoundedBox
              key={index}
              args={[0.12, 0.08, 0.1]}
              radius={0.02}
              smoothness={2}
              position={position as [number, number, number]}
            >
              <PartMaterial component={component} />
            </RoundedBox>
          ))}
        </>
      );
    default:
      return null;
  }
}

function VehiclePart({ component }: { component: VehicleComponent }) {
  const group = useRef<THREE.Group>(null);
  const explode = useAppStore((state) => state.explode);
  const hidden = useAppStore((state) => state.hiddenIds.includes(component.id));
  const selectedId = useAppStore((state) => state.selectedId);
  const reducedMotion = useAppStore((state) => state.reducedMotion);
  const select = useAppStore((state) => state.select);
  const setHovered = useAppStore((state) => state.setHovered);

  const target = useMemo(() => {
    const factor = component.explodeDistance * explode;
    return new THREE.Vector3(
      component.position[0] + component.explodeDirection[0] * factor,
      component.position[1] + component.explodeDirection[1] * factor,
      component.position[2] + component.explodeDirection[2] * factor,
    );
  }, [component, explode]);

  useFrame((_, delta) => {
    if (!group.current) return;
    if (reducedMotion) group.current.position.copy(target);
    else group.current.position.lerp(target, 1 - Math.exp(-delta * 5.2));
  });

  if (hidden) return null;

  return (
    <group
      ref={group}
      position={component.position}
      scale={selectedId === component.id ? 1.035 : 1}
      onClick={(event) => {
        event.stopPropagation();
        select(component.id);
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        select(component.id, true);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.style.cursor = "pointer";
        setHovered(component.id);
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        document.body.style.cursor = "default";
        setHovered(null);
      }}
    >
      <ComponentGeometry component={component} />
    </group>
  );
}

function Wheel({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position} rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.44, 0.44, 0.25, 28]} />
        <meshStandardMaterial color="#111416" roughness={0.72} metalness={0.12} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.27, 0.27, 0.27, 28]} />
        <meshStandardMaterial color="#4e595f" metalness={0.88} roughness={0.2} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.31, 0.027, 8, 28]} />
        <meshStandardMaterial color="#aab2b6" metalness={0.92} roughness={0.16} />
      </mesh>
      {Array.from({ length: 8 }).map((_, index) => (
        <mesh key={index} rotation={[0, index * (Math.PI / 4), 0]}>
          <boxGeometry args={[0.04, 0.285, 0.5]} />
          <meshStandardMaterial color="#909a9f" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.405, 0.014, 6, 28]} />
        <meshStandardMaterial color="#252b2e" roughness={0.5} />
      </mesh>
    </group>
  );
}

function ChassisAssembly() {
  const selectedId = useAppStore((state) => state.selectedId);
  const isolate = useAppStore((state) => state.isolate);
  const opacity = isolate && selectedId ? 0.06 : selectedId ? 0.34 : 1;
  return (
    <group position={[0, 0.44, 0]}>
      {/* Cabin architecture: dashboard, console, steering and four sculpted seats. */}
      <RoundedBox
        args={[1.72, 0.18, 0.44]}
        radius={0.08}
        smoothness={3}
        position={[0, 0.55, -0.62]}
        rotation={[0.08, 0, 0]}
      >
        <meshStandardMaterial
          color="#20282c"
          metalness={0.18}
          roughness={0.56}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </RoundedBox>
      <RoundedBox
        args={[0.34, 0.28, 1.45]}
        radius={0.08}
        smoothness={3}
        position={[0, 0.32, 0.18]}
      >
        <meshStandardMaterial
          color="#1b2428"
          metalness={0.24}
          roughness={0.48}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </RoundedBox>
      <group position={[-0.53, 0.57, -0.77]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <torusGeometry args={[0.18, 0.027, 12, 30]} />
          <meshStandardMaterial
            color="#161d20"
            metalness={0.38}
            roughness={0.46}
            transparent={opacity < 1}
            opacity={opacity}
          />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <cylinderGeometry args={[0.06, 0.06, 0.035, 18]} />
          <meshStandardMaterial color="#526168" metalness={0.72} roughness={0.26} />
        </mesh>
      </group>
      {[-0.48, 0.48].map((x) => (
        [-0.08, 0.92].map((z) => (
          <group key={`${x}-${z}`} position={[x, 0.54, z]}>
            <RoundedBox args={[0.42, 0.62, 0.54]} radius={0.11} smoothness={3}>
              <meshStandardMaterial
                color={z < 0 ? "#253137" : "#202b30"}
                roughness={0.62}
                transparent={opacity < 1}
                opacity={opacity}
              />
            </RoundedBox>
            <RoundedBox
              args={[0.46, 0.16, 0.59]}
              radius={0.07}
              smoothness={3}
              position={[0, -0.3, -0.03]}
            >
              <meshStandardMaterial color="#344148" roughness={0.54} />
            </RoundedBox>
            <mesh position={[0, 0.05, -0.282]}>
              <boxGeometry args={[0.26, 0.38, 0.016]} />
              <meshBasicMaterial color="#28454d" transparent opacity={opacity * 0.7} />
            </mesh>
          </group>
        ))
      ))}
    </group>
  );
}

function ArchitectureLayer() {
  const mode = useAppStore((state) => state.mode);
  const selectedId = useAppStore((state) => state.selectedId);
  if (mode !== "architecture") return null;

  const visible = selectedId
    ? [componentById[selectedId]]
    : [
        "ivi-display",
        "cluster",
        "passenger-display",
        "ivi-compute",
        "vhal",
        "gateway-ecu",
        "ethernet-backbone",
      ].map((id) => componentById[id]);

  return (
    <group>
      {visible.map((component, index) => (
        <Html
          key={component.id}
          position={[
            component.position[0],
            component.position[1] + 0.8 + (index % 2) * 0.16,
            component.position[2],
          ]}
          center
          distanceFactor={7}
          zIndexRange={[30, 0]}
        >
          <button
            className="architecture-node"
            onClick={() => useAppStore.getState().select(component.id, true)}
          >
            <span>{component.shortName}</span>
            <strong>{component.androidMappings[0]}</strong>
            <small>{component.androidMappings.slice(1, 3).join(" · ")}</small>
          </button>
        </Html>
      ))}
    </group>
  );
}

function SignalFlowLayer() {
  const mode = useAppStore((state) => state.mode);
  const step = useAppStore((state) => state.signalStep);
  const playing = useAppStore((state) => state.signalPlaying);
  const speed = useAppStore((state) => state.signalSpeed);
  const reducedMotion = useAppStore((state) => state.reducedMotion);
  const pulse = useRef<THREE.Mesh>(null);
  const phase = useRef(0);

  const positions = useMemo(
    () =>
      speedSignalFlow.steps.map((item) => {
        const position = componentById[item.componentId].position;
        return new THREE.Vector3(...position);
      }),
    [],
  );

  useEffect(() => {
    phase.current = 0;
    if (pulse.current) {
      pulse.current.position.copy(positions[Math.min(step, positions.length - 1)]);
    }
  }, [positions, step]);

  useFrame((_, delta) => {
    if (reducedMotion || mode !== "signal" || !playing) return;
    phase.current = (phase.current + delta * 0.65 * speed) % 1;
    if (pulse.current) {
      const from = positions[Math.max(0, Math.min(step, positions.length - 2))];
      const to = positions[Math.min(step + 1, positions.length - 1)];
      pulse.current.position.lerpVectors(from, to, phase.current);
    }
  });

  if (mode !== "signal") return null;

  return (
    <group>
      {positions.slice(0, -1).map((position, index) => (
        <group key={index}>
          <Line
            points={[position, positions[index + 1]]}
            color={index <= step ? "#e5a85c" : "#445057"}
            lineWidth={index === step ? 3.8 : 1.5}
            dashed={index > step}
            dashSize={0.12}
            gapSize={0.08}
          />
          <FlowArrow
            from={position}
            to={positions[index + 1]}
            active={index <= step}
          />
        </group>
      ))}
      <mesh ref={pulse}>
        <sphereGeometry args={[0.095, 16, 12]} />
        <meshBasicMaterial color="#fff3d2" />
        <pointLight color="#e5a85c" intensity={2.5} distance={1.5} />
      </mesh>
    </group>
  );
}

function NetworkActivity() {
  const mode = useAppStore((state) => state.mode);
  const signalSpeed = useAppStore((state) => state.signalSpeed);
  const reducedMotion = useAppStore((state) => state.reducedMotion);
  const canPacket = useRef<THREE.Mesh>(null);
  const ethernetPacket = useRef<THREE.Mesh>(null);
  const phase = useRef(0);

  const paths = useMemo(
    () => ({
      can: new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1, 0.06, -1.42),
        new THREE.Vector3(-0.55, 0.42, 0.65),
        new THREE.Vector3(0.42, 0.54, 0.72),
        new THREE.Vector3(0.25, 0.48, 0.2),
        new THREE.Vector3(-0.53, 1.04, -0.44),
      ]),
      ethernet: new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.3, 0.54, 0.64),
        new THREE.Vector3(0.25, 0.65, -0.33),
        new THREE.Vector3(0.16, 1.01, -0.42),
        new THREE.Vector3(-0.53, 0.99, -0.46),
        new THREE.Vector3(0.79, 1.0, -0.4),
      ]),
    }),
    [],
  );

  useFrame((_, delta) => {
    if (reducedMotion || (mode !== "signal" && mode !== "architecture")) return;
    phase.current = (phase.current + delta * 0.24 * signalSpeed) % 1;
    canPacket.current?.position.copy(paths.can.getPointAt(phase.current));
    ethernetPacket.current?.position.copy(
      paths.ethernet.getPointAt((phase.current * 1.35 + 0.34) % 1),
    );
  });

  if (mode !== "signal" && mode !== "architecture") return null;

  return (
    <>
      <mesh ref={canPacket} position={paths.can.getPointAt(0)}>
        <sphereGeometry args={[0.058, 14, 10]} />
        <meshBasicMaterial color="#ffd496" toneMapped={false} />
        <pointLight color="#e09a43" intensity={2.2} distance={0.9} />
      </mesh>
      <mesh ref={ethernetPacket} position={paths.ethernet.getPointAt(0.34)}>
        <sphereGeometry args={[0.052, 14, 10]} />
        <meshBasicMaterial color="#bcf5ff" toneMapped={false} />
        <pointLight color="#48bfd2" intensity={2.4} distance={0.9} />
      </mesh>
    </>
  );
}

function FlowArrow({
  from,
  to,
  active,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  active: boolean;
}) {
  const { position, quaternion } = useMemo(() => {
    const direction = new THREE.Vector3().subVectors(to, from).normalize();
    return {
      position: new THREE.Vector3().lerpVectors(from, to, 0.62),
      quaternion: new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction,
      ),
    };
  }, [from, to]);

  return (
    <mesh position={position} quaternion={quaternion}>
      <coneGeometry args={[0.065, 0.18, 10]} />
      <meshBasicMaterial color={active ? "#e5a85c" : "#445057"} />
    </mesh>
  );
}

function HoverLabel() {
  const hoveredId = useAppStore((state) => state.hoveredId);
  if (!hoveredId) return null;
  const component = componentById[hoveredId];
  return (
    <Html
      position={[
        component.position[0],
        component.position[1] + 0.55,
        component.position[2],
      ]}
      center
      pointerEvents="none"
    >
      <div className="mesh-tooltip">
        <span>{component.shortName}</span>
        {component.name}
      </div>
    </Html>
  );
}

function GarageScene({ showModel }: { showModel: boolean }) {
  const quality = useAppStore((state) => state.quality);
  const explode = useAppStore((state) => state.explode);
  const select = useAppStore((state) => state.select);
  return (
    <>
      {showModel && <color attach="background" args={["#080b0e"]} />}
      {showModel && <fog attach="fog" args={["#080b0e", 8, 23]} />}
      <ambientLight intensity={0.65} color="#a5bbc2" />
      <spotLight
        position={[5, 9, -5]}
        intensity={42}
        color="#d5e8ea"
        angle={0.42}
        penumbra={0.8}
        castShadow={quality !== "Low"}
      />
      <spotLight
        position={[-5, 4, 5]}
        intensity={26}
        color="#5da3b4"
        angle={0.5}
        penumbra={1}
      />
      <pointLight position={[3, 2, 4]} intensity={12} color="#d59959" />
      <pointLight position={[-3, 2.4, -4]} intensity={8} color="#7bc0cc" />
      {showModel && (
        <>
          <group onClick={() => select(null)}>
            <ChassisAssembly />
            {vehicleComponents.map((component) => (
              <VehiclePart key={component.id} component={component} />
            ))}
            {explode > 0.04 &&
              [
                [-1.04, 0.4, -1.45],
                [1.04, 0.4, -1.45],
                [-1.04, 0.4, 1.45],
                [1.04, 0.4, 1.45],
              ].map((position, index) => (
                <Wheel key={index} position={position as [number, number, number]} />
              ))}
          </group>
          <ArchitectureLayer />
          <SignalFlowLayer />
          <NetworkActivity />
          <HoverLabel />
        </>
      )}
      <Grid
        position={[0, 0, 0]}
        args={[30, 30]}
        cellColor="#20282c"
        sectionColor="#334149"
        cellSize={0.5}
        sectionSize={2.5}
        fadeDistance={17}
        fadeStrength={1.2}
        infiniteGrid
      />
      {quality !== "Low" && (
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.46}
          scale={10}
          blur={2.2}
          far={5}
          resolution={quality === "High" ? 1024 : 512}
        />
      )}
      {quality === "High" && <Environment preset="warehouse" environmentIntensity={0.28} />}
      <CameraRig />
    </>
  );
}

export function VehicleScene({ showModel }: { showModel: boolean }) {
  const quality = useAppStore((state) => state.quality);
  return (
    <Canvas
      className={`vehicle-canvas ${showModel ? "spatial" : "visual-underlay"}`}
      shadows={quality !== "Low"}
      dpr={quality === "High" ? [1, 1.75] : quality === "Medium" ? [1, 1.35] : 1}
      camera={{ position: [5.8, 2.8, -6.7], fov: 42, near: 0.1, far: 100 }}
      gl={{
        alpha: true,
        antialias: quality !== "Low",
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      onPointerMissed={() => showModel && useAppStore.getState().select(null)}
    >
      <Suspense fallback={null}>
        <GarageScene showModel={showModel} />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload("/models/CarConcept.glb");


