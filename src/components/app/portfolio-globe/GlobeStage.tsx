import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import ThreeGlobe from "three-globe";

import { CityPin, PIN_ALTITUDE, PIN_HEIGHT } from "./CityPin";
import { collectFills, shadeCountry, shadeRegion } from "./fillShade";
import { FormationRing } from "./FormationRing";
import {
  isGlobeDragging,
  isGlobeGrowing,
  setGlobeResting,
  takeDrag,
} from "./globeControl";
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
import { faceCamera, shortestAngleTo } from "./globeRotation";
import { Graticule } from "./Graticule";
import {
  collectOutlines,
  drawOutlines,
  type PolygonOutline,
} from "./outlineReveal";

import {
  getAboutMarks,
  getAboutProgress,
  getActiveChapter,
  getIsAboutOpen,
  getShownChapter,
} from "@/components/app/about/aboutView";
import { cityMarks } from "@/components/app/about/cityMarks";
import {
  DOCKED_AT,
  DOCK_HOVER_GROW_MS,
  DOCK_HOVER_RADIUS_PX,
  PHASES,
  dockMetrics,
  headerLayoutFor,
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
/** How quickly the hover's grow comes on: slowly, ~95% of the way over DOCK_HOVER_GROW_MS. */
const GROW_DAMPING = 3000 / DOCK_HOVER_GROW_MS;
/** And how quickly it shrinks back once the pointer leaves: brisker. */
const SHRINK_DAMPING = 3;
/** How quickly the grown globe's idle spin comes and goes. */
const SPIN_DAMPING = 4;
/** Below this much hover it has all but shrunk back to the icon, which can take over again. */
const HOVER_SETTLED = 0.02;
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

/** A little north of the facing point, for its local north direction. */
const NORTH_STEP_DEG = 0.5;

const pinTip = new THREE.Vector3();

export interface GlobeCity {
  lat: number;
  lng: number;
  /** Where the globe centres while it faces this city (often the city itself). */
  focus: { lat: number; lng: number };
  /** ISO_A3 of its country, whose provinces draw in and fill shades lightly in About. */
  countryCode: string;
  /** ISO 3166-2 of its own province, which shades in more strongly. */
  regionCode: string;
}

interface Facing {
  normal: THREE.Vector3;
  north: THREE.Vector3;
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
  /** About's places, in order. The first is faced through the hero; About faces the one picked. */
  cities: readonly [GlobeCity, ...GlobeCity[]];
  /** Each frame: the pin's tip in viewport space, and how far the leader line has drawn (0 hides it). */
  onAnchorMove: (viewportX: number, viewportY: number, drawn: number) => void;
}

// The globe half of the scene: it grows inside the circle the formation arcs drew, then sweeps up
// into the top-right corner while its borders draw — where it stays, docked, through the portfolio —
// and moves over into About, where the city's marks grow out of it.
export function GlobeStage({ cities, onAnchorMove }: GlobeStageProps) {
  const size = useThree((state) => state.size);
  const viewport = useThree((state) => state.viewport);

  const placementRef = useRef<THREE.Group>(null);
  const lensAlignRef = useRef<THREE.Group>(null);
  const lensSquashRef = useRef<THREE.Group>(null);
  const lensUnalignRef = useRef<THREE.Group>(null);
  const rollRef = useRef<THREE.Group>(null);
  const rotationRef = useRef<THREE.Group>(null);
  const pinRef = useRef<THREE.Group>(null);
  const outlines = useRef<PolygonOutline[]>([]);
  /** Each place's country's province outlines, drawn as its marks arrive. */
  const provinceOutlines = useRef(new Map<string, PolygonOutline[]>());
  const countryFills = useRef(new Map<string, THREE.MeshBasicMaterial[]>());
  const regionFills = useRef(new Map<string, THREE.MeshBasicMaterial[]>());
  /** Whether About was open last frame, and the place it faced, to catch either changing. */
  const wasAboutOpen = useRef(false);
  const lastActiveChapter = useRef(0);
  /** Turn and tip the visitor has added by hovering and dragging, kept — it rests where it's left. */
  const userSpin = useRef(0);
  const userTilt = useRef(0);
  /** 0–1: how far the docked globe has grown under a lingering hover. */
  const hover = useRef(0);
  /** 0–1: how far into its hovered idle spin it is (from the moment it's hovered). */
  const spin = useRef(0);
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

  const placeCountries = useMemo(
    () => new Set(cities.map((city) => city.countryCode)),
    [cities],
  );

  // Every country, plus the provinces of the places' own countries — the rest of the province data
  // isn't drawn.
  useEffect(() => {
    globe.polygonsData(
      polygons.filter(
        (polygon) =>
          polygon.tier === "country" || placeCountries.has(polygon.country),
      ),
    );
    outlines.current = [];
  }, [globe, polygons, placeCountries]);

  /** Each place's view centre turned into outward and northward directions, in globe space. */
  const facings = useMemo(
    () =>
      cities.map(({ focus }): Facing => {
        const at = globe.getCoords(focus.lat, focus.lng);
        const ahead = globe.getCoords(focus.lat + NORTH_STEP_DEG, focus.lng);
        const normal = new THREE.Vector3(at.x, at.y, at.z).normalize();
        const north = new THREE.Vector3(
          ahead.x - at.x,
          ahead.y - at.y,
          ahead.z - at.z,
        );
        north.addScaledVector(normal, -north.dot(normal)).normalize();
        return { normal, north };
      }),
    [globe, cities],
  );

  /** Globe-space direction of a city, which its provinces draw outward from. */
  function cityDirection(city: GlobeCity): THREE.Vector3 {
    const { x, y, z } = globe.getCoords(city.lat, city.lng);
    return new THREE.Vector3(x, y, z).normalize();
  }

  /**
   * The top-right corner it docks in (converted from the shared pixel metrics to world units), and
   * the control point that bends the sweep there: off the straight line's midpoint, out to the right.
   * `centreFor` places a docked globe of any radius tucked into the corner, so hovering grows it
   * down and to the left, out of the icon.
   */
  const dock = useMemo(() => {
    const pixelToWorld = viewport.height / size.height;
    const metrics = dockMetrics(headerLayoutFor(size.width));
    const centreFor = (radiusPx: number) => ({
      x:
        (size.width / 2 - metrics.right - metrics.inset - radiusPx) *
        pixelToWorld,
      y:
        (size.height / 2 - metrics.top - metrics.inset - radiusPx) *
        pixelToWorld,
    });
    const rest = centreFor(metrics.radius);
    return {
      pixelToWorld,
      restRadiusPx: metrics.radius,
      centreFor,
      bendX: rest.x / 2 + rest.y * SWEEP_BEND,
      bendY: rest.y / 2 - rest.x * SWEEP_BEND,
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
    const isGrowing = isGlobeGrowing();
    hover.current = THREE.MathUtils.damp(
      hover.current,
      isGrowing ? 1 : 0,
      isGrowing ? GROW_DAMPING : SHRINK_DAMPING,
      delta,
    );
    spin.current = THREE.MathUtils.damp(
      spin.current,
      isGrowing ? 1 : 0,
      SPIN_DAMPING,
      delta,
    );
    const dockedRadiusPx = THREE.MathUtils.lerp(
      dock.restRadiusPx,
      DOCK_HOVER_RADIUS_PX,
      hover.current,
    );
    const corner = dock.centreFor(dockedRadiusPx);
    const bendWeight = 2 * docking * (1 - docking);
    const cornerWeight = docking * docking;
    const heroX = dock.bendX * bendWeight + corner.x * cornerWeight;
    const heroY = dock.bendY * bendWeight + corner.y * cornerWeight;
    const dockedRadius = dockedRadiusPx * dock.pixelToWorld;
    const heroRadius = THREE.MathUtils.lerp(
      FORMATION_SPHERE_RADIUS,
      dockedRadius,
      docking,
    );

    // Opening About carries it from wherever it is (the corner, normally) into About's left half,
    // growing as the page pans across underneath.
    const about = getAboutProgress();

    // Settled in the corner, it rests as the Earth icon (the link draws it) — and comes back once a
    // hover has lingered (to grow), or it's dragged or asked to open About.
    const isResting =
      progress >= DOCKED_AT &&
      about === 0 &&
      !isGrowing &&
      !isGlobeDragging() &&
      hover.current < HOVER_SETTLED;
    placement.visible = !isResting;
    setGlobeResting(isResting);
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
      outlines.current = collectOutlines(
        globe,
        cityDirection(cities[0]),
        (polygon) => polygon.tier === "country",
      );
      provinceOutlines.current = new Map(
        cities.map((city) => [
          city.countryCode,
          collectOutlines(
            globe,
            cityDirection(city),
            (polygon) =>
              polygon.tier === "region" && polygon.country === city.countryCode,
          ),
        ]),
      );
      const placeRegions = new Set(cities.map((city) => city.regionCode));
      countryFills.current = collectFills(globe, (polygon) =>
        polygon.tier === "country" && placeCountries.has(polygon.code)
          ? polygon.code
          : undefined,
      );
      regionFills.current = collectFills(globe, (polygon) =>
        polygon.tier === "region" && placeRegions.has(polygon.code)
          ? polygon.code
          : undefined,
      );
      if (outlines.current.length > 0) disableToneMapping(globe);
    }
    drawOutlines(outlines.current, phase(progress, PHASES.countries));

    // In About, the shown place grows out of the globe: its country's provinces draw from it, the
    // country (lightly) and its own province (more so) shade in.
    const city = cities[getShownChapter()] ?? cities[0];
    const marks = cityMarks(getAboutMarks());
    for (const [country, provinces] of provinceOutlines.current) {
      drawOutlines(
        provinces,
        country === city.countryCode ? marks.provinces : 0,
      );
    }
    shadeCountry(
      countryFills.current,
      city.countryCode,
      marks.shade,
      surfaceColor,
      strokeColor,
    );
    shadeRegion(regionFills.current, city.regionCode, marks.shade, strokeColor);

    // Opening About, or picking a place, turns it to face you: whatever the sweep and the
    // visitor's hovering and dragging had added unwinds (the shortest way round).
    const isAboutOpen = getIsAboutOpen();
    const activeChapter = getActiveChapter();
    if (
      (isAboutOpen && !wasAboutOpen.current) ||
      activeChapter !== lastActiveChapter.current
    ) {
      userSpin.current = 0;
      userTilt.current = 0;
    }
    wasAboutOpen.current = isAboutOpen;
    lastActiveChapter.current = activeChapter;

    // The picked place head-on and north up (the first, through the hero), wherever the globe is.
    const facing = facings[isAboutOpen ? activeChapter : 0] ?? facings[0];
    const target =
      facing === undefined
        ? { x: 0, y: 0, z: 0 }
        : faceCamera(
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
      userSpin.current += HOVER_SPIN_RAD_PER_S * spin.current * delta;
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
        target.y + SWEEP_SPIN_RAD * docking * (1 - about) + userSpin.current,
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

    // The pin rises on the city, and the leader line runs from its tip out to the text.
    const pin = pinRef.current;
    if (pin === null) return;
    const pinGrowth = easeSettle(marks.pin);
    pin.visible = pinGrowth > 0.01;
    if (!pin.visible) {
      onAnchorMove(0, 0, 0);
      return;
    }
    const tip = globe.getCoords(city.lat, city.lng, PIN_ALTITUDE);
    pin.position.set(tip.x, tip.y, tip.z);
    pin.scale.setScalar(PIN_HEIGHT * pinGrowth);
    pinTip.set(tip.x, tip.y, tip.z);
    group.localToWorld(pinTip);
    // Nearer the camera than the globe's centre means the pin is on the facing side.
    const isFacingCamera = pinTip.z > placement.position.z;
    pinTip.project(state.camera);
    const canvas = state.gl.domElement.getBoundingClientRect();
    onAnchorMove(
      canvas.left + ((pinTip.x + 1) / 2) * canvas.width,
      canvas.top + ((1 - pinTip.y) / 2) * canvas.height,
      isFacingCamera ? marks.line : 0,
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
                <CityPin ref={pinRef} color={strokeColor} />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
