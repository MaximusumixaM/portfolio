import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type ThreeGlobe from "three-globe";

import { teardropFillGeometry, teardropOutlineGeometry } from "./pinShape";

import {
  PHASES,
  easeSettle,
  getHeroProgress,
  phase,
} from "@/components/app/max-hero/heroTransition";
import type { ResolvedProject } from "@/types/project";

/** Pin height in globe units (the globe's radius is 100). */
const PIN_HEIGHT = 4.5;
const SELECTED_SCALE = 1.35;
/** Lifts the tip clear of the country outlines sitting just above the sphere. */
export const PIN_ALTITUDE = 0.012;
/** Hit target, in unit-pin space — comfortably larger than the drawn teardrop. */
const HIT_RADIUS = 0.62;
const HIT_CENTRE_Y = 0.6;
/** Pins round the far side stay on show, dimmed, rather than vanishing at the horizon. */
const BEHIND_OPACITY = 0.5;

const worldPosition = new THREE.Vector3();

export interface ProjectPinsProps {
  projects: ResolvedProject[];
  /** Owns the lat/lng → local coordinate mapping the pins are placed with. */
  globe: ThreeGlobe;
  activeSlug: string | undefined;
  color: THREE.Color;
  onSelect: (slug: string) => void;
}

export function ProjectPins({
  projects,
  globe,
  activeSlug,
  color,
  onSelect,
}: ProjectPinsProps) {
  const positions = useMemo(
    () =>
      projects.map(({ location }) => {
        const { x, y, z } = globe.getCoords(
          location.lat,
          location.lng,
          PIN_ALTITUDE,
        );
        return new THREE.Vector3(x, y, z);
      }),
    [projects, globe],
  );

  return (
    <>
      {projects.map((project, index) => {
        const position = positions[index];
        if (position === undefined) return null;
        return (
          <ProjectPinMarker
            key={project.slug}
            project={project}
            position={position}
            isSelected={project.slug === activeSlug}
            color={color}
            onSelect={onSelect}
          />
        );
      })}
    </>
  );
}

interface ProjectPinMarkerProps {
  project: ResolvedProject;
  position: THREE.Vector3;
  isSelected: boolean;
  color: THREE.Color;
  onSelect: (slug: string) => void;
}

function ProjectPinMarker({
  project,
  position,
  isSelected,
  color,
  onSelect,
}: ProjectPinMarkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const markerRef = useRef<THREE.Group>(null);
  const outlineMaterialRef = useRef<THREE.LineBasicMaterial>(null);
  const fillMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isHovered) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "";
    };
  }, [isHovered]);

  // The globe spins under a fixed camera, so a pin's own direction tells us which side it's on.
  useFrame(() => {
    const group = groupRef.current;
    const marker = markerRef.current;
    if (group === null || marker === null) return;

    // Pins are the last beat of the intro: they pop up once the map has finished drawing itself.
    const appear = easeSettle(phase(getHeroProgress(), PHASES.reveal));
    group.visible = appear > 0.01;
    if (!group.visible) return;
    marker.scale.setScalar(
      PIN_HEIGHT * (isSelected ? SELECTED_SCALE : 1) * appear,
    );

    const isFacingCamera =
      group.getWorldPosition(worldPosition).normalize().z > 0;
    const opacity = (isFacingCamera ? 1 : BEHIND_OPACITY) * appear;

    if (outlineMaterialRef.current !== null) {
      outlineMaterialRef.current.opacity = opacity;
    }
    if (fillMaterialRef.current !== null) {
      fillMaterialRef.current.opacity = isSelected || isHovered ? opacity : 0;
    }
  });

  return (
    <group ref={groupRef} position={position} visible={false}>
      <Billboard>
        <group ref={markerRef}>
          <lineLoop geometry={teardropOutlineGeometry} renderOrder={10}>
            <lineBasicMaterial
              ref={outlineMaterialRef}
              color={color}
              transparent
              depthTest={false}
            />
          </lineLoop>
          <mesh geometry={teardropFillGeometry} renderOrder={11}>
            <meshBasicMaterial
              ref={fillMaterialRef}
              color={color}
              transparent
              opacity={0}
              depthTest={false}
            />
          </mesh>
          <mesh
            position={[0, HIT_CENTRE_Y, 0]}
            renderOrder={12}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(project.slug);
            }}
            onPointerOver={(event) => {
              event.stopPropagation();
              setIsHovered(true);
            }}
            onPointerOut={() => {
              setIsHovered(false);
            }}
          >
            <circleGeometry args={[HIT_RADIUS, 16]} />
            <meshBasicMaterial
              transparent
              opacity={0}
              depthTest={false}
              depthWrite={false}
            />
          </mesh>
        </group>
      </Billboard>
    </group>
  );
}
