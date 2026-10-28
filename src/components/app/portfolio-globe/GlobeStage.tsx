import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import ThreeGlobe from "three-globe";

import { collectFills, shadeCountry, shadeRegion } from "./fillShade";
import { FormationRing } from "./FormationRing";
import {
  COUNTRY_ALTITUDE,
  REGION_ALTITUDE,
  disableToneMapping,
  isGlobePolygon,
  loadGlobePolygons,
  polygonCapColor,
  polygonStrokeColor,
  type GlobePolygon,
} from "./globePolygons";
import {
  faceCamera,
  shortestAngleTo,
  type GlobeOrientation,
} from "./globeRotation";
import { ZOOM_MAGNIFICATION, zoomGlobe } from "./globeZoom";
import { Graticule } from "./Graticule";
import { JourneyPin, PIN_ALTITUDE, PIN_HEIGHT } from "./JourneyPin";
import {
  collectOutlines,
  drawOutlines,
  type PolygonOutline,
} from "./outlineReveal";

import {
  arrivalMarks,
  isJourneyOver,
  journeyScreens,
  journeyZoom,
  type JourneyLayout,
} from "@/components/app/journey/journeyLayout";
import { getJourneySpin } from "@/components/app/journey/journeySpin";
import { PHASES } from "@/components/app/max-hero/heroTransition";
import {
  CAMERA_DISTANCE,
  FORMATION_SPHERE_RADIUS,
  STACKED_BREAKPOINT_PX,
} from "@/components/app/max-hero/sceneMetrics";
import {
  easeSettle,
  getSectionProgress,
  phase,
} from "@/components/app/scroll/timeline";
import { useThemeColor } from "@/components/lib/useThemeColor";

/** Rotation easing rate — higher settles on the aimed-at coordinate faster. */
const FOCUS_DAMPING = 3.2;
const DRAG_SENSITIVITY = 0.005;
const MAX_TILT_RAD = (75 * Math.PI) / 180;
/** Pointer travel (px) past which a press counts as a drag rather than a click. */
const DRAG_SLOP_PX = 5;
/** Grab margin round the globe's silhouette, so the edge is comfortable to catch. */
const DRAG_HIT_MARGIN = 1.08;
// The surface tints up over the graticule's opening third, under the rings drawing onto it.
const SURFACE_RANGE: readonly [number, number] = [
  PHASES.graticule[0],
  PHASES.graticule[0] + 0.3 * (PHASES.graticule[1] - PHASES.graticule[0]),
];

/** How far left of centre (as a share of the viewport width) a zoomed disc may reach, clear of the text. */
const ZOOM_TEXT_CLEARANCE = 0.02;

/** A little north of a focus, for its local north direction. */
const NORTH_STEP_DEG = 0.5;

export interface GlobeStop {
  lat: number;
  lng: number;
  /** Where the view centres while the globe faces this stop (often the stop itself). */
  focus: { lat: number; lng: number };
  /** ISO_A3 of the stop's country, whose provinces draw in and fill shades lightly on arrival. */
  countryCode: string;
  /** ISO 3166-2 of the stop's own province, which shades in on arrival. */
  regionCode: string;
}

/** The spin the globe last set off on, and the rotation it set off from. */
interface SpinAim {
  serial: number;
  from: number;
  fromRotation: GlobeOrientation;
}

const pinTip = new THREE.Vector3();

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
  /** True once the intro has handed the globe over to the visitor. */
  isRevealed: boolean;
  /** Journey stops, in order; the globe faces the first until the journey moves it on. */
  stops: readonly GlobeStop[];
  layout: JourneyLayout;
  /** Called each frame with the pin's tip in viewport space, and how far the leader line has drawn (0 hides it). */
  onAnchorMove: (viewportX: number, viewportY: number, drawn: number) => void;
}

// The globe half of the scene: it grows inside the circle the formation arcs drew, slides out to
// its resting place as the wordmark leaves, draws its borders, then spins from stop to stop on the
// journey before leaving for the projects.
export function GlobeStage({
  isRevealed,
  stops,
  layout,
  onAnchorMove,
}: GlobeStageProps) {
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const viewport = useThree((state) => state.viewport);

  const placementRef = useRef<THREE.Group>(null);
  const rollRef = useRef<THREE.Group>(null);
  const rotationRef = useRef<THREE.Group>(null);
  const targetRotation = useRef<GlobeOrientation>({ x: 0, y: 0, z: 0 });
  /** Where the visitor has dragged the globe to, on top of the journey's aim. */
  const dragOffset = useRef<GlobeOrientation>({ x: 0, y: 0, z: 0 });
  const spinAim = useRef<SpinAim>({
    serial: -1,
    from: -1,
    fromRotation: { x: 0, y: 0, z: 0 },
  });
  const spinTarget = useRef<GlobeOrientation>({ x: 0, y: 0, z: 0 });
  const screenCircle = useRef<GlobeScreenCircle>({
    centreX: 0,
    centreY: 0,
    radius: 0,
  });
  const pinRef = useRef<THREE.Group>(null);
  const countryOutlines = useRef<PolygonOutline[]>([]);
  /** Each journey country's province outlines, drawn as it arrives. */
  const provinceOutlines = useRef(new Map<string, PolygonOutline[]>());
  const countryFills = useRef(new Map<string, THREE.MeshBasicMaterial[]>());
  const regionFills = useRef(new Map<string, THREE.MeshBasicMaterial[]>());

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
    countryOutlines.current = [];
  }, [globe, polygons]);

  const journeyCountries = useMemo(
    () => new Set(stops.map((stop) => stop.countryCode)),
    [stops],
  );
  const journeyRegions = useMemo(
    () => new Set(stops.map((stop) => stop.regionCode)),
    [stops],
  );

  /** Where the globe faces while its borders draw — borders spread out from here. */
  const drawFocus = useMemo(() => {
    const first = stops[0];
    if (first === undefined) return new THREE.Vector3(0, 0, 1);
    const { x, y, z } = globe.getCoords(first.lat, first.lng);
    return new THREE.Vector3(x, y, z).normalize();
  }, [globe, stops]);

  /** Resting size and place: left of centre on wide screens, upper half when stacked. */
  const restingLayout = useMemo(() => {
    if (size.width < STACKED_BREAKPOINT_PX) {
      return {
        x: 0,
        y: viewport.height * 0.2,
        radius: Math.min(viewport.width * 0.34, viewport.height * 0.2),
        // Stacked, the text is below rather than beside, so the zoom has nothing to clear sideways.
        maxRight: Number.POSITIVE_INFINITY,
      };
    }
    // Centre stays put as the radius comes down, so the shrink opens up room to the right.
    return {
      x: -viewport.width * 0.24,
      y: 0,
      radius: Math.min(viewport.height * 0.32, viewport.width * 0.22),
      maxRight: -viewport.width * ZOOM_TEXT_CLEARANCE,
    };
  }, [size.width, viewport.width, viewport.height]);

  // Countries read as outlines only — caps painted the page colour, provinces as fainter lines.
  useEffect(() => {
    const fill = (polygon: object) =>
      isGlobePolygon(polygon) ? polygonCapColor(polygon, surfaceColor) : "";

    globe
      .globeMaterial(surfaceMaterial)
      .polygonCapColor(fill)
      .polygonSideColor(fill)
      .polygonStrokeColor((polygon) =>
        isGlobePolygon(polygon)
          ? polygonStrokeColor(polygon, strokeColor)
          : false,
      );
    disableToneMapping(globe);
  }, [globe, surfaceMaterial, surfaceColor, strokeColor]);

  /** Globe-space direction of a stop, which its provinces draw outward from. */
  function stopDirection(stop: GlobeStop): THREE.Vector3 {
    const { x, y, z } = globe.getCoords(stop.lat, stop.lng);
    return new THREE.Vector3(x, y, z).normalize();
  }

  /** Orientation that turns a stop's focus head-on to the camera, north up, wherever the globe sits. */
  function orientationForStop(
    stop: number,
    centre: THREE.Vector3,
    camera: THREE.Vector3,
  ): GlobeOrientation {
    // Before the journey (-1) the globe already faces the first stop.
    const focus = stops[Math.max(0, stop)]?.focus;
    if (focus === undefined) return { x: 0, y: 0, z: 0 };
    const at = globe.getCoords(focus.lat, focus.lng);
    const ahead = globe.getCoords(focus.lat + NORTH_STEP_DEG, focus.lng);
    const normal = new THREE.Vector3(at.x, at.y, at.z).normalize();
    const north = new THREE.Vector3(
      ahead.x - at.x,
      ahead.y - at.y,
      ahead.z - at.z,
    );
    north.addScaledVector(normal, -north.dot(normal)).normalize();
    return faceCamera(normal, north, centre, camera);
  }

  useDragToRotate(
    isRevealed,
    rotationRef,
    targetRotation,
    dragOffset,
    screenCircle,
  );

  useFrame((state, delta) => {
    const placement = placementRef.current;
    const roll = rollRef.current;
    const group = rotationRef.current;
    if (placement === null || roll === null || group === null) return;

    const progress = getSectionProgress("hero");

    // Leave the centre once the cage is drawn, taking the formation ring along.
    const shift = easeSettle(phase(progress, PHASES.shift));
    const scale = THREE.MathUtils.lerp(
      1,
      restingLayout.radius / FORMATION_SPHERE_RADIUS,
      shift,
    );

    // The sphere itself arrives with the first rings; before that the arcs own the circle.
    const surfacing = phase(progress, SURFACE_RANGE);
    surfaceMaterial.visible = surfacing > 0.001;
    surfaceMaterial.color.copy(pageColor).lerp(surfaceColor, surfacing);

    if (countryOutlines.current.length === 0 && polygons.length > 0) {
      countryOutlines.current = collectOutlines(
        globe,
        drawFocus,
        (polygon) => polygon.tier === "country",
      );
      provinceOutlines.current = new Map(
        stops.map((stop) => [
          stop.countryCode,
          collectOutlines(
            globe,
            stopDirection(stop),
            (polygon) =>
              polygon.tier === "region" && polygon.country === stop.countryCode,
          ),
        ]),
      );
      countryFills.current = collectFills(globe, (polygon) =>
        polygon.tier === "country" && journeyCountries.has(polygon.country)
          ? polygon.country
          : undefined,
      );
      regionFills.current = collectFills(globe, (polygon) =>
        polygon.tier === "region" && journeyRegions.has(polygon.code)
          ? polygon.code
          : undefined,
      );
      if (countryOutlines.current.length > 0) disableToneMapping(globe);
    }
    drawOutlines(countryOutlines.current, phase(progress, PHASES.countries));

    // A chapter grows out of the globe: its provinces draw, the country and (more so) the city's
    // province shade in, its pin rises.
    const screens = journeyScreens(layout, getSectionProgress("about"));
    const marks = arrivalMarks(layout, screens);
    const markedStop = stops[marks.chapter];
    for (const [country, outlines] of provinceOutlines.current) {
      drawOutlines(
        outlines,
        country === markedStop?.countryCode ? marks.provinces : 0,
      );
    }
    shadeCountry(
      countryFills.current,
      markedStop?.countryCode,
      marks.shade,
      surfaceColor,
      strokeColor,
    );
    shadeRegion(
      regionFills.current,
      markedStop?.regionCode,
      marks.shade,
      strokeColor,
    );

    // Zoom in as the first chapter arrives, then hold it through every spin.
    const magnification = THREE.MathUtils.lerp(
      1,
      ZOOM_MAGNIFICATION,
      easeSettle(journeyZoom(layout, screens)),
    );
    const zoomed = zoomGlobe(
      {
        x: restingLayout.x * shift,
        y: restingLayout.y * shift,
        radius: FORMATION_SPHERE_RADIUS * scale,
        cameraDistance: CAMERA_DISTANCE,
        maxRight: restingLayout.maxRight,
      },
      magnification,
    );
    placement.position.set(
      zoomed.position.x,
      zoomed.position.y,
      zoomed.position.z,
    );
    placement.scale.setScalar(scale * magnification);

    // Leaving for the projects: for now it simply goes, until the musket finale replaces this.
    placement.visible = !isJourneyOver(layout, screens);

    const spin = getJourneySpin();
    const aim = spinAim.current;
    if (spin.serial !== aim.serial) {
      // A fresh spin sets off from wherever the globe is showing, drag included.
      spinAim.current = {
        serial: spin.serial,
        from: spin.from,
        fromRotation: { ...targetRotation.current },
      };
      dragOffset.current = { x: 0, y: 0, z: 0 };
    } else if (spin.from !== aim.from) {
      // Reversed mid-turn: it now sets off from the stop it was heading to.
      spinAim.current = {
        ...aim,
        from: spin.from,
        fromRotation: spinTarget.current,
      };
    }
    const from = spinAim.current.fromRotation;
    const toStop = orientationForStop(
      spin.to,
      placement.position,
      state.camera.position,
    );
    spinTarget.current = {
      x: toStop.x,
      y: shortestAngleTo(from.y, toStop.y),
      z: toStop.z,
    };
    const turned = easeSettle(spin.progress);
    targetRotation.current = {
      x:
        THREE.MathUtils.lerp(from.x, spinTarget.current.x, turned) +
        dragOffset.current.x,
      y:
        THREE.MathUtils.lerp(from.y, spinTarget.current.y, turned) +
        dragOffset.current.y,
      z: THREE.MathUtils.lerp(from.z, spinTarget.current.z, turned),
    };

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
    roll.rotation.z = THREE.MathUtils.damp(
      roll.rotation.z,
      targetRotation.current.z,
      FOCUS_DAMPING,
      delta,
    );

    // Cache the globe's screen circle so a press can tell whether it landed on the globe.
    const canvas = gl.domElement.getBoundingClientRect();
    const pixelsPerWorldUnit = size.height / viewport.height;
    screenCircle.current = {
      centreX:
        canvas.left + canvas.width / 2 + zoomed.screenX * pixelsPerWorldUnit,
      centreY:
        canvas.top + canvas.height / 2 - zoomed.screenY * pixelsPerWorldUnit,
      radius: placement.visible ? zoomed.screenRadius * pixelsPerWorldUnit : 0,
    };

    const pin = pinRef.current;
    if (pin === null) return;
    const pinGrowth = easeSettle(marks.pin);
    pin.visible = markedStop !== undefined && pinGrowth > 0.01;
    if (markedStop === undefined || !pin.visible) {
      onAnchorMove(0, 0, 0);
      return;
    }
    const { x, y, z } = globe.getCoords(
      markedStop.lat,
      markedStop.lng,
      PIN_ALTITUDE,
    );
    pin.position.set(x, y, z);
    // Held to one size on screen however far the globe has zoomed.
    pin.scale.setScalar((PIN_HEIGHT * pinGrowth) / magnification);

    // Where the pin's tip lands on screen, for the leader line to start from.
    pinTip.set(x, y, z);
    group.localToWorld(pinTip);
    // Nearer the camera than the globe's centre means the pin is on the facing side.
    const isFacingCamera = pinTip.z > placement.position.z;
    pinTip.project(state.camera);
    onAnchorMove(
      canvas.left + ((pinTip.x + 1) / 2) * canvas.width,
      canvas.top + ((1 - pinTip.y) / 2) * canvas.height,
      isFacingCamera ? marks.line : 0,
    );
  });

  return (
    <group ref={placementRef}>
      <FormationRing />
      <group ref={rollRef}>
        <group ref={rotationRef} scale={FORMATION_SPHERE_RADIUS / globeRadius}>
          <primitive object={globe} />
          <Graticule radius={globeRadius} />
          <JourneyPin ref={pinRef} color={strokeColor} />
        </group>
      </group>
    </group>
  );
}

/**
 * Pointer drag spins the globe. It's kept as an offset on top of the journey's aim, so it doesn't
 * spring back, and the next spin sets off from wherever it was left.
 * The canvas is click-through (the nav sits over it), so presses are read off the window and
 * matched against the globe's own screen circle.
 */
function useDragToRotate(
  isRevealed: boolean,
  groupRef: React.RefObject<THREE.Group | null>,
  targetRotation: React.RefObject<GlobeOrientation>,
  dragOffset: React.RefObject<GlobeOrientation>,
  screenCircle: React.RefObject<GlobeScreenCircle>,
) {
  useEffect(() => {
    if (!isRevealed) return;

    let pointerId: number | null = null;
    let isEngaged = false;
    let dragDistance = 0;
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
      dragDistance = 0;
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
      dragDistance += Math.abs(deltaX) + Math.abs(deltaY);

      if (!isEngaged) {
        if (dragDistance <= DRAG_SLOP_PX) return;
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
      const turn = deltaX * DRAG_SENSITIVITY;
      dragOffset.current = {
        x: dragOffset.current.x + tilt - targetRotation.current.x,
        y: dragOffset.current.y + turn,
        z: 0,
      };
      targetRotation.current = {
        ...targetRotation.current,
        x: tilt,
        y: targetRotation.current.y + turn,
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
  }, [isRevealed, groupRef, targetRotation, dragOffset, screenCircle]);
}
