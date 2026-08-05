import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import ThreeGlobe from "three-globe";

import {
  collectCountryOutlines,
  drawCountryOutlines,
  type CountryOutline,
} from "./countryReveal";
import { FormationRing } from "./FormationRing";
import {
  COUNTRY_ALTITUDE,
  REGION_ALTITUDE,
  disableToneMapping,
  isGlobePolygon,
  loadGlobePolygons,
  polygonCapColor,
  type GlobePolygon,
} from "./globePolygons";
import {
  aimSpinForCoords,
  rotationForCoords,
  shortestAngleTo,
} from "./globeRotation";
import { Graticule } from "./Graticule";
import { PIN_ALTITUDE, ProjectPins } from "./ProjectPins";

import {
  PHASES,
  easeSettle,
  getHeroProgress,
  phase,
} from "@/components/app/max-hero/heroTransition";
import {
  CAMERA_DISTANCE,
  FORMATION_SPHERE_RADIUS,
  STACKED_BREAKPOINT_PX,
} from "@/components/app/max-hero/sceneMetrics";
import { useThemeColor } from "@/components/lib/useThemeColor";
import type { ResolvedProject } from "@/types/project";

/** Rotation easing rate — higher settles on the selected pin faster. */
const FOCUS_DAMPING = 3.2;
const DRAG_SENSITIVITY = 0.005;
const MAX_TILT_RAD = (75 * Math.PI) / 180;
/** Pointer travel (px) past which a press counts as a drag rather than a pin click. */
const DRAG_SLOP_PX = 5;
/** Grab margin round the globe's silhouette, so the edge is comfortable to catch. */
const DRAG_HIT_MARGIN = 1.08;
// The surface tints up over the graticule's opening third, under the rings drawing onto it.
const SURFACE_RANGE: readonly [number, number] = [
  PHASES.graticule[0],
  PHASES.graticule[0] + 0.3 * (PHASES.graticule[1] - PHASES.graticule[0]),
];

/** Where the selected pin sits across the drawn disc: 0 is its centre, 1 the right-hand limb. */
const AIM_ACROSS_DISC = 0;

const anchorPosition = new THREE.Vector3();

interface GlobeScreenCircle {
  centreX: number;
  centreY: number;
  radius: number;
}

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

export interface GlobeStageProps {
  projects: ResolvedProject[];
  activeSlug: string | undefined;
  /** True once the intro has handed the globe over to the visitor. */
  isRevealed: boolean;
  onSelect: (slug: string) => void;
  /** Called each frame with the selected pin's tip, in viewport space. */
  onAnchorMove: (
    viewportX: number,
    viewportY: number,
    isVisible: boolean,
  ) => void;
}

// The globe half of the scene: it grows inside the circle the formation arcs drew, slides out to
// its resting place as the wordmark leaves, then draws its borders and hands over to the visitor.
export function GlobeStage({
  projects,
  activeSlug,
  isRevealed,
  onSelect,
  onAnchorMove,
}: GlobeStageProps) {
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const viewport = useThree((state) => state.viewport);

  const placementRef = useRef<THREE.Group>(null);
  const rotationRef = useRef<THREE.Group>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const dragDistance = useRef(0);
  const screenCircle = useRef<GlobeScreenCircle>({
    centreX: 0,
    centreY: 0,
    radius: 0,
  });
  const outlines = useRef<CountryOutline[]>([]);

  const polygons = useGlobePolygons();
  const strokeColor = useThemeColor("--color-foreground-default", "#000000");
  // A shade off the page, so the sphere reads as a disc without a drawn silhouette.
  const surfaceColor = useThemeColor(
    "--color-background-default-hover",
    "#f5f5f5",
  );
  // The sphere tints up out of the page rather than popping in as a filled disc.
  const pageColor = useThemeColor("--color-background-default", "#ffffff");

  // A flat surface material, so the sphere reads as a silhouette the outlines sit on.
  const surfaceMaterial = useMemo(() => new THREE.MeshBasicMaterial(), []);
  const globe = useMemo(
    () =>
      new ThreeGlobe({ animateIn: false })
        .showAtmosphere(false)
        // The intro owns the reveal; three-globe's own tweening would fight it.
        .polygonsTransitionDuration(0)
        .polygonAltitude((polygon) =>
          isGlobePolygon(polygon) && polygon.tier === "region"
            ? REGION_ALTITUDE
            : COUNTRY_ALTITUDE,
        ),
    [],
  );
  const globeRadius = useMemo(() => globe.getGlobeRadius(), [globe]);

  useEffect(() => {
    return () => {
      globe._destructor();
      surfaceMaterial.dispose();
    };
  }, [globe, surfaceMaterial]);

  useEffect(() => {
    globe.polygonsData(polygons);
    outlines.current = [];
  }, [globe, polygons]);

  const selectedProject = projects.find(
    (project) => project.slug === activeSlug,
  );

  /** Where the globe faces while its borders draw — borders spread out from here. */
  const drawFocus = useMemo(() => {
    const first = projects[0];
    if (first === undefined) return new THREE.Vector3(0, 0, 1);
    const { x, y, z } = globe.getCoords(first.location.lat, first.location.lng);
    return new THREE.Vector3(x, y, z).normalize();
  }, [globe, projects]);

  /** Resting size and place: beside the panel on wide screens, above it when stacked. */
  const restingLayout = useMemo(() => {
    if (size.width < STACKED_BREAKPOINT_PX) {
      return {
        x: 0,
        y: viewport.height * 0.2,
        radius: Math.min(viewport.width * 0.34, viewport.height * 0.2),
      };
    }
    // Centre stays put as the radius comes down, so the shrink opens up room towards the panel.
    return {
      x: -viewport.width * 0.24,
      y: 0,
      radius: Math.min(viewport.height * 0.32, viewport.width * 0.22),
    };
  }, [size.width, viewport.width, viewport.height]);

  const framing = useMemo(
    () => ({
      centreX: restingLayout.x,
      radius: restingLayout.radius,
      cameraDistance: CAMERA_DISTANCE,
      across: AIM_ACROSS_DISC,
    }),
    [restingLayout],
  );

  // Countries read as outlines only — caps painted the page colour — except the selected
  // project's country and province, which take a wash of the foreground token.
  useEffect(() => {
    const palette = {
      surface: surfaceColor,
      foreground: strokeColor,
      // The wash belongs to the finished map, not to the borders drawing themselves in.
      selectedCountryCode: isRevealed
        ? selectedProject?.location.countryCode
        : undefined,
      selectedRegionCode: isRevealed
        ? selectedProject?.location.regionCode
        : undefined,
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
    disableToneMapping(globe);
  }, [
    globe,
    surfaceMaterial,
    surfaceColor,
    strokeColor,
    selectedProject,
    isRevealed,
  ]);

  // Selecting a project re-aims the globe; the frame loop eases towards this target. The spin on
  // top of the aim is framing — it centres the pin on the disc as drawn, leaving the poles upright.
  useEffect(() => {
    if (selectedProject === undefined) return;
    const { lat, lng } = selectedProject.location;
    const { x, y } = rotationForCoords(lat, lng);
    const spin = aimSpinForCoords(lat, framing);
    targetRotation.current = {
      x,
      y: shortestAngleTo(targetRotation.current.y, y + spin),
    };
  }, [selectedProject, framing]);

  useDragToRotate(
    isRevealed,
    rotationRef,
    targetRotation,
    dragDistance,
    screenCircle,
  );

  useFrame((state, delta) => {
    const placement = placementRef.current;
    const group = rotationRef.current;
    if (placement === null || group === null) return;

    const progress = getHeroProgress();

    // Leave the centre once the cage is drawn, taking the formation ring along.
    const shift = easeSettle(phase(progress, PHASES.shift));
    const scale = THREE.MathUtils.lerp(
      1,
      restingLayout.radius / FORMATION_SPHERE_RADIUS,
      shift,
    );
    placement.position.set(restingLayout.x * shift, restingLayout.y * shift, 0);
    placement.scale.setScalar(scale);

    // The sphere itself arrives with the first rings; before that the arcs own the circle.
    const surfacing = phase(progress, SURFACE_RANGE);
    surfaceMaterial.visible = surfacing > 0.001;
    surfaceMaterial.color.copy(pageColor).lerp(surfaceColor, surfacing);

    if (outlines.current.length === 0 && polygons.length > 0) {
      outlines.current = collectCountryOutlines(globe, drawFocus);
      if (outlines.current.length > 0) disableToneMapping(globe);
    }
    drawCountryOutlines(outlines.current, phase(progress, PHASES.countries));

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

    // Cache the globe's screen circle so a press can tell whether it landed on the globe.
    const canvas = gl.domElement.getBoundingClientRect();
    const pixelsPerWorldUnit = size.height / viewport.height;
    screenCircle.current = {
      centreX:
        canvas.left +
        canvas.width / 2 +
        placement.position.x * pixelsPerWorldUnit,
      centreY:
        canvas.top +
        canvas.height / 2 -
        placement.position.y * pixelsPerWorldUnit,
      radius: FORMATION_SPHERE_RADIUS * scale * pixelsPerWorldUnit,
    };

    // Scrubbing back out of the reveal has to retire the leader line, or it hangs about on screen.
    if (!isRevealed || selectedProject === undefined) {
      onAnchorMove(0, 0, false);
      return;
    }
    // Where the selected pin's tip lands on screen, for the leader line to start from.
    const { lat, lng } = selectedProject.location;
    const { x, y, z } = globe.getCoords(lat, lng, PIN_ALTITUDE);
    anchorPosition.set(x, y, z);
    group.localToWorld(anchorPosition);
    // The globe's centre rides z = 0, so world depth alone settles which side a pin is on.
    const isFacingCamera = anchorPosition.z > 0;

    anchorPosition.project(state.camera);
    onAnchorMove(
      canvas.left + ((anchorPosition.x + 1) / 2) * canvas.width,
      canvas.top + ((1 - anchorPosition.y) / 2) * canvas.height,
      isFacingCamera,
    );
  });

  return (
    <group ref={placementRef}>
      <FormationRing />
      <group ref={rotationRef} scale={FORMATION_SPHERE_RADIUS / globeRadius}>
        <primitive object={globe} />
        <Graticule radius={globeRadius} />
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
    </group>
  );
}

/**
 * Pointer drag spins the globe, carrying the easing target along so it doesn't spring back.
 * The canvas is click-through (the panel sits over it), so presses are read off the window and
 * matched against the globe's own screen circle.
 */
function useDragToRotate(
  isRevealed: boolean,
  groupRef: React.RefObject<THREE.Group | null>,
  targetRotation: React.RefObject<{ x: number; y: number }>,
  dragDistance: React.RefObject<number>,
  screenCircle: React.RefObject<GlobeScreenCircle>,
) {
  useEffect(() => {
    if (!isRevealed) return;

    let pointerId: number | null = null;
    let isEngaged = false;
    let lastX = 0;
    let lastY = 0;
    let totalX = 0;
    let totalY = 0;

    function handlePointerDown(event: PointerEvent) {
      if (event.button !== 0) return;
      const { centreX, centreY, radius } = screenCircle.current;
      const reach = radius * DRAG_HIT_MARGIN;
      if (
        Math.hypot(event.clientX - centreX, event.clientY - centreY) > reach
      ) {
        return;
      }
      pointerId = event.pointerId;
      isEngaged = false;
      dragDistance.current = 0;
      totalX = 0;
      totalY = 0;
      lastX = event.clientX;
      lastY = event.clientY;
    }

    function handlePointerMove(event: PointerEvent) {
      if (pointerId !== event.pointerId) return;
      const deltaX = event.clientX - lastX;
      const deltaY = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      totalX += deltaX;
      totalY += deltaY;
      dragDistance.current += Math.abs(deltaX) + Math.abs(deltaY);

      if (!isEngaged) {
        if (dragDistance.current <= DRAG_SLOP_PX) return;
        // On touch, an upright swipe belongs to the page — only a sideways one spins the globe.
        if (
          event.pointerType === "touch" &&
          Math.abs(totalY) > Math.abs(totalX)
        ) {
          pointerId = null;
          return;
        }
        isEngaged = true;
      }

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

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isRevealed, groupRef, targetRotation, dragDistance, screenCircle]);
}
