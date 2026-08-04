import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import ThreeGlobe from "three-globe";

import {
  COUNTRY_ALTITUDE,
  REGION_ALTITUDE,
  isGlobePolygon,
  loadGlobePolygons,
  polygonCapColor,
  type GlobePolygon,
} from "./globePolygons";
import { rotationForCoords, shortestAngleTo } from "./globeRotation";
import { PIN_ALTITUDE, ProjectPins } from "./ProjectPins";

import { useThemeColor } from "@/components/lib/useThemeColor";
import type { ResolvedProject } from "@/types/project";

/** Close enough to fill the frame, with room above the globe for a selected pin to stand clear. */
const CAMERA_DISTANCE = 370;
const CAMERA_FOV = 35;
/** Rotation easing rate — higher settles on the selected pin faster. */
const FOCUS_DAMPING = 3.2;
const DRAG_SENSITIVITY = 0.005;
const MAX_TILT_RAD = (75 * Math.PI) / 180;
/** Pointer travel (px) past which a press counts as a drag rather than a pin click. */
const DRAG_SLOP_PX = 5;

const anchorPosition = new THREE.Vector3();

function useGlobePolygons(): GlobePolygon[] {
  const [polygons, setPolygons] = useState<GlobePolygon[]>([]);

  useEffect(() => {
    let isMounted = true;

    void loadGlobePolygons()
      .then((loaded) => {
        if (isMounted) setPolygons(loaded);
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return polygons;
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

  const polygons = useGlobePolygons();
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
        .polygonAltitude((polygon) =>
          isGlobePolygon(polygon) && polygon.tier === "region"
            ? REGION_ALTITUDE
            : COUNTRY_ALTITUDE,
        ),
    [],
  );

  useEffect(() => {
    return () => {
      globe._destructor();
      surfaceMaterial.dispose();
    };
  }, [globe, surfaceMaterial]);

  useEffect(() => {
    globe.polygonsData(polygons);
  }, [globe, polygons]);

  const selectedProject = projects.find(
    (project) => project.slug === activeSlug,
  );

  // Countries read as outlines only — caps painted the page colour — except the selected
  // project's country and province, which take a wash of the foreground token.
  useEffect(() => {
    surfaceMaterial.color = surfaceColor;
    const palette = {
      surface: surfaceColor,
      foreground: strokeColor,
      selectedCountryCode: selectedProject?.location.countryCode,
      selectedRegionCode: selectedProject?.location.regionCode,
    };
    const fill = (polygon: object) =>
      isGlobePolygon(polygon) ? polygonCapColor(polygon, palette) : "";

    globe
      .globeMaterial(surfaceMaterial)
      .polygonCapColor(fill)
      .polygonSideColor(fill)
      // Only national borders are drawn; a region shows through its fill alone.
      .polygonStrokeColor((polygon) =>
        isGlobePolygon(polygon) && polygon.tier === "region"
          ? false
          : `#${strokeColor.getHexString()}`,
      );
  }, [globe, surfaceMaterial, surfaceColor, strokeColor, selectedProject]);

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
