import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import ThreeGlobe from "three-globe";

import { FormationRing } from "./FormationRing";
import {
  isGlobeDragging,
  isGlobeIdlingUnderPointer,
  takeDrag,
} from "./globeControl";
import {
  COUNTRY_ALTITUDE,
  disableToneMapping,
  loadGlobePolygons,
  type GlobePolygon,
} from "./globePolygons";
import { faceCamera, shortestAngleTo } from "./globeRotation";
import { Graticule } from "./Graticule";
import {
  collectOutlines,
  drawOutlines,
  type PolygonOutline,
} from "./outlineReveal";

import { getAboutProgress } from "@/components/app/about/aboutView";
import {
  DOCK_HOVER_RADIUS_PX,
  DOCK_RADIUS_PX,
  DOCK_RIGHT_PX,
  DOCK_TOP_PX,
  PHASES,
} from "@/components/app/max-hero/heroTransition";
import {
  FORMATION_SPHERE_RADIUS,
  STACKED_BREAKPOINT_PX,
} from "@/components/app/max-hero/sceneMetrics";
import {
  easeSettle,
  getSectionProgress,
  phase,
} from "@/components/app/scroll/timeline";
import { usePrefersReducedMotion } from "@/components/lib/usePrefersReducedMotion";
import { useThemeColor } from "@/components/lib/useThemeColor";

/** Rotation easing rate — higher settles on the facing point faster. */
const FOCUS_DAMPING = 3.2;
/** While dragged, the globe tracks the pointer this tightly instead. */
const DRAG_DAMPING = 24;
// Spins are about the globe's own axis; positive turns the land facing the camera to the right.
/** Turn picked up along the sweep into the corner (~70°), so it arrives still rolling right. */
const SWEEP_SPIN_RAD = 1.2;
/** Slow idle turn while hovered, in radians a second. */
const HOVER_SPIN_RAD_PER_S = 0.6;
/** How quickly the hover's grow and spin come and go. */
const HOVER_DAMPING = 8;
/** Drag: radians of turn per pixel of pointer travel, and how far it may tip north or south. */
const DRAG_RAD_PER_PX = 0.02;
const MAX_DRAG_TILT_RAD = 1;
// The surface tints up over the graticule's opening third, under the rings drawing onto it.
const SURFACE_RANGE: readonly [number, number] = [
  PHASES.graticule[0],
  PHASES.graticule[0] + 0.3 * (PHASES.graticule[1] - PHASES.graticule[0]),
];

/**
 * How far the sweep into the corner bows out to the right of the straight line, as a share of its
 * length: 0 is the straight diagonal, higher swings wider before arcing up into the corner.
 */
const SWEEP_BEND = 0.2;

/** Vancouver: the globe faces it through the hero, and the borders draw outward from it. */
const FACING = { lat: 49.2827, lng: -123.1207 };
/** A little north of the facing point, for its local north direction. */
const NORTH_STEP_DEG = 0.5;

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

// The globe half of the scene: it grows inside the circle the formation arcs drew, then sweeps up
// into the top-right corner while its borders draw — where it stays, docked, through the portfolio.
export function GlobeStage() {
  const size = useThree((state) => state.size);
  const viewport = useThree((state) => state.viewport);

  const placementRef = useRef<THREE.Group>(null);
  const lensAlignRef = useRef<THREE.Group>(null);
  const lensSquashRef = useRef<THREE.Group>(null);
  const lensUnalignRef = useRef<THREE.Group>(null);
  const rollRef = useRef<THREE.Group>(null);
  const rotationRef = useRef<THREE.Group>(null);
  const outlines = useRef<PolygonOutline[]>([]);
  /** Turn and tip the visitor has added by hovering and dragging, kept — it rests where it's left. */
  const userSpin = useRef(0);
  const userTilt = useRef(0);
  /** 0–1: how far into its hovered state (grown, idling round) the docked globe is. */
  const hover = useRef(0);
  const prefersReducedMotion = usePrefersReducedMotion();

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
        .polygonAltitude(COUNTRY_ALTITUDE),
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

  /** The facing point's outward and northward directions, in globe space. */
  const facing = useMemo(() => {
    const at = globe.getCoords(FACING.lat, FACING.lng);
    const ahead = globe.getCoords(FACING.lat + NORTH_STEP_DEG, FACING.lng);
    const normal = new THREE.Vector3(at.x, at.y, at.z).normalize();
    const north = new THREE.Vector3(
      ahead.x - at.x,
      ahead.y - at.y,
      ahead.z - at.z,
    );
    north.addScaledVector(normal, -north.dot(normal)).normalize();
    return { normal, north };
  }, [globe]);

  /**
   * The top-right corner it docks in (converted from the shared pixel metrics to world units), and
   * the control point that bends the sweep there: off the straight line's midpoint, out to the right.
   */
  const dock = useMemo(() => {
    const pixelToWorld = viewport.height / size.height;
    const x = (size.width / 2 - DOCK_RIGHT_PX - DOCK_RADIUS_PX) * pixelToWorld;
    const y = (size.height / 2 - DOCK_TOP_PX - DOCK_RADIUS_PX) * pixelToWorld;
    return {
      x,
      y,
      radius: DOCK_RADIUS_PX * pixelToWorld,
      hoverRadius: DOCK_HOVER_RADIUS_PX * pixelToWorld,
      bendX: x / 2 + y * SWEEP_BEND,
      bendY: y / 2 - x * SWEEP_BEND,
    };
  }, [size.width, size.height, viewport.height]);

  /** Where it sits on the About page: its left half beside the content, its top when stacked. */
  const aboutLayout = useMemo(() => {
    if (size.width < STACKED_BREAKPOINT_PX) {
      return {
        x: 0,
        y: viewport.height * 0.2,
        radius: Math.min(viewport.width * 0.34, viewport.height * 0.2),
      };
    }
    return {
      x: -viewport.width * 0.24,
      y: 0,
      radius: Math.min(viewport.height * 0.32, viewport.width * 0.22),
    };
  }, [size.width, viewport.width, viewport.height]);

  // Countries read as outlines only — caps painted the page colour.
  useEffect(() => {
    const surface = `#${surfaceColor.getHexString()}`;
    globe
      .globeMaterial(surfaceMaterial)
      .polygonCapColor(() => surface)
      .polygonSideColor(() => surface)
      .polygonStrokeColor(() => `#${strokeColor.getHexString()}`);
    disableToneMapping(globe);
  }, [globe, surfaceMaterial, surfaceColor, strokeColor]);

  useFrame((state, delta) => {
    const placement = placementRef.current;
    const lensAlign = lensAlignRef.current;
    const lensSquash = lensSquashRef.current;
    const lensUnalign = lensUnalignRef.current;
    const roll = rollRef.current;
    const group = rotationRef.current;
    if (
      placement === null ||
      lensAlign === null ||
      lensSquash === null ||
      lensUnalign === null ||
      roll === null ||
      group === null
    ) {
      return;
    }

    const progress = getSectionProgress("hero");

    // Once the cage is drawn, sweep from the centre into the corner — one move along a gentle
    // curve, shrinking as it goes, taking the formation ring along — while the borders keep drawing.
    const docking = easeSettle(phase(progress, PHASES.dock));
    // Quadratic Bézier from the centre (origin) through the bend towards the corner.
    const bendWeight = 2 * docking * (1 - docking);
    const cornerWeight = docking * docking;
    const heroX = dock.bendX * bendWeight + dock.x * cornerWeight;
    const heroY = dock.bendY * bendWeight + dock.y * cornerWeight;
    hover.current = THREE.MathUtils.damp(
      hover.current,
      isGlobeIdlingUnderPointer() ? 1 : 0,
      HOVER_DAMPING,
      delta,
    );
    const dockedRadius = THREE.MathUtils.lerp(
      dock.radius,
      dock.hoverRadius,
      hover.current,
    );
    const heroRadius = THREE.MathUtils.lerp(
      FORMATION_SPHERE_RADIUS,
      dockedRadius,
      docking,
    );

    // Opening About carries it from wherever it is (the corner, normally) into About's left half,
    // growing as the page pans across underneath.
    const about = getAboutProgress();
    placement.position.set(
      THREE.MathUtils.lerp(heroX, aboutLayout.x, about),
      THREE.MathUtils.lerp(heroY, aboutLayout.y, about),
      0,
    );
    placement.scale.setScalar(
      THREE.MathUtils.lerp(heroRadius, aboutLayout.radius, about) /
        FORMATION_SPHERE_RADIUS,
    );

    // Off the camera's axis, perspective draws a sphere as an oval stretched away from the centre
    // of the screen (~17% in the corner). Squashing it by the cosine of that angle, along the
    // stretch and in depth, cancels it out so the globe stays round wherever it sits.
    const { x, y, z } = placement.position;
    const toCamera = state.camera.position.z - z;
    const offAxis = Math.cos(Math.atan2(Math.hypot(x, y), toCamera));
    const stretchAngle = Math.atan2(y, x);
    lensAlign.rotation.z = stretchAngle;
    lensSquash.scale.set(offAxis, 1, offAxis);
    lensUnalign.rotation.z = -stretchAngle;

    // The sphere itself arrives with the first rings; before that the arcs own the circle.
    const surfacing = phase(progress, SURFACE_RANGE);
    surfaceMaterial.visible = surfacing > 0.001;
    surfaceMaterial.color.copy(pageColor).lerp(surfaceColor, surfacing);

    if (outlines.current.length === 0 && polygons.length > 0) {
      outlines.current = collectOutlines(globe, facing.normal);
      if (outlines.current.length > 0) disableToneMapping(globe);
    }
    drawOutlines(outlines.current, phase(progress, PHASES.countries));

    // Vancouver head-on and north up, wherever the globe has got to.
    const target = faceCamera(
      facing.normal,
      facing.north,
      placement.position,
      state.camera.position,
    );
    const drag = takeDrag();
    userSpin.current += drag.x * DRAG_RAD_PER_PX;
    userTilt.current = THREE.MathUtils.clamp(
      userTilt.current + drag.y * DRAG_RAD_PER_PX,
      -MAX_DRAG_TILT_RAD,
      MAX_DRAG_TILT_RAD,
    );
    if (!prefersReducedMotion) {
      userSpin.current += HOVER_SPIN_RAD_PER_S * hover.current * delta;
    }
    const damping = isGlobeDragging() ? DRAG_DAMPING : FOCUS_DAMPING;
    group.rotation.x = THREE.MathUtils.damp(
      group.rotation.x,
      target.x + userTilt.current,
      damping,
      delta,
    );
    group.rotation.y = THREE.MathUtils.damp(
      group.rotation.y,
      shortestAngleTo(
        group.rotation.y,
        target.y + SWEEP_SPIN_RAD * docking + userSpin.current,
      ),
      damping,
      delta,
    );
    roll.rotation.z = THREE.MathUtils.damp(
      roll.rotation.z,
      target.z,
      FOCUS_DAMPING,
      delta,
    );
  });

  return (
    <group ref={placementRef}>
      <FormationRing />
      <group ref={lensAlignRef}>
        <group ref={lensSquashRef}>
          <group ref={lensUnalignRef}>
            <group ref={rollRef}>
              <group
                ref={rotationRef}
                scale={FORMATION_SPHERE_RADIUS / globeRadius}
              >
                <primitive object={globe} />
                <Graticule radius={globeRadius} />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
