import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import ThreeGlobe from "three-globe";

import { rotationForCoords, shortestAngleTo } from "./globeRotation";
import { PIN_ALTITUDE, ProjectPins } from "./ProjectPins";

import { useThemeColor } from "@/components/lib/useThemeColor";
import type { ResolvedProject } from "@/types/project";

const COUNTRIES_URL = "/geo/countries.geojson";

/** Close enough to fill the frame, with room above the globe for a selected pin to stand clear. */
const CAMERA_DISTANCE = 370;
const CAMERA_FOV = 35;
/** Country outlines float just clear of the sphere so their strokes don't z-fight it. */
const COUNTRY_ALTITUDE = 0.004;
/** Rotation easing rate — higher settles on the selected pin faster. */
const FOCUS_DAMPING = 3.2;
const DRAG_SENSITIVITY = 0.005;
const MAX_TILT_RAD = (75 * Math.PI) / 180;
/** Pointer travel (px) past which a press counts as a drag rather than a pin click. */
const DRAG_SLOP_PX = 5;

const anchorPosition = new THREE.Vector3();

interface FeatureCollection {
  features: object[];
}

function isFeatureCollection(value: unknown): value is FeatureCollection {
  return (
    typeof value === "object" &&
    value !== null &&
    "features" in value &&
    Array.isArray(value.features)
  );
}

function useCountryFeatures(): object[] {
  const [features, setFeatures] = useState<object[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadCountries() {
      const response = await fetch(COUNTRIES_URL);
      if (!response.ok) {
        throw new Error(
          `Failed to load ${COUNTRIES_URL}: ${response.status} ${response.statusText}`,
        );
      }
      const data: unknown = await response.json();
      if (!isFeatureCollection(data)) {
        throw new Error(`${COUNTRIES_URL} is not a GeoJSON FeatureCollection`);
      }
      if (isMounted) setFeatures(data.features);
    }

    void loadCountries().catch((error: unknown) => {
      console.error(error);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return features;
}

interface GlobeSceneProps {
  projects: ResolvedProject[];
  activeSlug: string | undefined;
  onSelect: (slug: string) => void;
  onAnchorMove: (
    viewportX: number,
    viewportY: number,
    isVisible: boolean,
  ) => void;
}

function GlobeScene({
  projects,
  activeSlug,
  onSelect,
  onAnchorMove,
}: GlobeSceneProps) {
  const { gl } = useThree();
  const rotationGroupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const dragDistance = useRef(0);

  const features = useCountryFeatures();
  const strokeColor = useThemeColor("--color-foreground-default", "#000000");
  // A shade off the page, so the sphere reads as a disc without a drawn silhouette.
  const surfaceColor = useThemeColor(
    "--color-background-default-hover",
    "#f5f5f5",
  );

  // A flat surface material, so the sphere reads as a silhouette the outlines sit on.
  const surfaceMaterial = useMemo(() => new THREE.MeshBasicMaterial(), []);
  const globe = useMemo(
    () =>
      new ThreeGlobe({ animateIn: false })
        .showAtmosphere(false)
        .polygonAltitude(COUNTRY_ALTITUDE),
    [],
  );

  useEffect(() => {
    return () => {
      globe._destructor();
      surfaceMaterial.dispose();
    };
  }, [globe, surfaceMaterial]);

  useEffect(() => {
    globe.polygonsData(features);
  }, [globe, features]);

  // Countries as outlines only: caps painted the page colour, so just the strokes read.
  useEffect(() => {
    surfaceMaterial.color = surfaceColor;
    const surfaceCss = `#${surfaceColor.getHexString()}`;
    globe
      .globeMaterial(surfaceMaterial)
      .polygonCapColor(() => surfaceCss)
      .polygonSideColor(() => surfaceCss)
      .polygonStrokeColor(() => `#${strokeColor.getHexString()}`);
  }, [globe, surfaceMaterial, surfaceColor, strokeColor]);

  const selectedProject = projects.find(
    (project) => project.slug === activeSlug,
  );

  // Selecting a project re-aims the globe; the frame loop eases towards this target.
  useEffect(() => {
    if (selectedProject === undefined) return;
    const { lat, lng } = selectedProject.location;
    const { x, y } = rotationForCoords(lat, lng);
    targetRotation.current = {
      x,
      y: shortestAngleTo(targetRotation.current.y, y),
    };
  }, [selectedProject]);

  useDragToRotate(
    gl.domElement,
    rotationGroupRef,
    targetRotation,
    dragDistance,
  );

  useFrame((state, delta) => {
    const group = rotationGroupRef.current;
    if (group === null) return;
    group.rotation.x = THREE.MathUtils.damp(
      group.rotation.x,
      targetRotation.current.x,
      FOCUS_DAMPING,
      delta,
    );
    group.rotation.y = THREE.MathUtils.damp(
      group.rotation.y,
      targetRotation.current.y,
      FOCUS_DAMPING,
      delta,
    );

    if (selectedProject === undefined) return;
    // Where the selected pin's tip lands on screen, for the leader line to start from. The group
    // only ever rotates, so applying its Euler beats a full matrix update of the globe's subtree.
    const { lat, lng } = selectedProject.location;
    const { x, y, z } = globe.getCoords(lat, lng, PIN_ALTITUDE);
    anchorPosition.set(x, y, z).applyEuler(group.rotation);
    const isFacingCamera = anchorPosition.z > 0;

    anchorPosition.project(state.camera);
    const canvas = gl.domElement.getBoundingClientRect();
    onAnchorMove(
      canvas.left + ((anchorPosition.x + 1) / 2) * canvas.width,
      canvas.top + ((1 - anchorPosition.y) / 2) * canvas.height,
      isFacingCamera,
    );
  });

  return (
    <group ref={rotationGroupRef}>
      <primitive object={globe} />
      <ProjectPins
        projects={projects}
        globe={globe}
        activeSlug={activeSlug}
        color={strokeColor}
        onSelect={(slug) => {
          if (dragDistance.current > DRAG_SLOP_PX) return;
          onSelect(slug);
        }}
      />
    </group>
  );
}

/** Pointer drag spins the globe, carrying the easing target along so it doesn't spring back. */
function useDragToRotate(
  element: HTMLCanvasElement,
  groupRef: React.RefObject<THREE.Group | null>,
  targetRotation: React.RefObject<{ x: number; y: number }>,
  dragDistance: React.RefObject<number>,
) {
  useEffect(() => {
    let pointerId: number | null = null;
    let lastX = 0;
    let lastY = 0;

    function handlePointerDown(event: PointerEvent) {
      if (event.button !== 0) return;
      pointerId = event.pointerId;
      dragDistance.current = 0;
      lastX = event.clientX;
      lastY = event.clientY;
    }

    function handlePointerMove(event: PointerEvent) {
      if (pointerId !== event.pointerId) return;
      const deltaX = event.clientX - lastX;
      const deltaY = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      dragDistance.current += Math.abs(deltaX) + Math.abs(deltaY);
      if (dragDistance.current <= DRAG_SLOP_PX) return;

      const group = groupRef.current;
      if (group === null) return;
      const tilt = THREE.MathUtils.clamp(
        targetRotation.current.x + deltaY * DRAG_SENSITIVITY,
        -MAX_TILT_RAD,
        MAX_TILT_RAD,
      );
      targetRotation.current = {
        x: tilt,
        y: targetRotation.current.y + deltaX * DRAG_SENSITIVITY,
      };
      group.rotation.x = tilt;
      group.rotation.y = targetRotation.current.y;
    }

    function handlePointerUp(event: PointerEvent) {
      if (pointerId === event.pointerId) pointerId = null;
    }

    element.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      element.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [element, groupRef, targetRotation, dragDistance]);
}

export interface GlobeCanvasProps {
  projects: ResolvedProject[];
  activeSlug: string | undefined;
  onSelect: (slug: string) => void;
  /** Called each frame with the selected pin's tip, in viewport space. */
  onAnchorMove: (
    viewportX: number,
    viewportY: number,
    isVisible: boolean,
  ) => void;
}

export function GlobeCanvas({
  projects,
  activeSlug,
  onSelect,
  onAnchorMove,
}: GlobeCanvasProps) {
  return (
    <Canvas
      // pan-y keeps a vertical swipe scrolling the page; horizontal drags spin the globe.
      style={{ touchAction: "pan-y" }}
      // No tone mapping: the surface and outlines must land on their exact token colours.
      flat
      camera={{
        position: [0, 0, CAMERA_DISTANCE],
        fov: CAMERA_FOV,
        near: 1,
        far: 2000,
      }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <GlobeScene
        projects={projects}
        activeSlug={activeSlug}
        onSelect={onSelect}
        onAnchorMove={onAnchorMove}
      />
    </Canvas>
  );
}
