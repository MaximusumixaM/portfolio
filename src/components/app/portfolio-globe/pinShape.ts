import * as THREE from "three";

/** Teardrop head, in units where the tip sits at the origin and the whole pin is 1 tall. */
const HEAD_CENTRE_Y = 0.63;
const HEAD_RADIUS = 0.37;
const ARC_SEGMENTS = 32;

/** A map-pin teardrop: two tangents rising from the tip into a circular head. */
function createTeardropShape(): THREE.Shape {
  // Angle at the head's centre between "straight down to the tip" and either tangent point.
  const tangentAngle = Math.acos(HEAD_RADIUS / HEAD_CENTRE_Y);
  const start = tangentAngle - Math.PI / 2;
  const end = Math.PI * 1.5 - tangentAngle;

  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(
    HEAD_RADIUS * Math.cos(start),
    HEAD_CENTRE_Y + HEAD_RADIUS * Math.sin(start),
  );
  shape.absarc(0, HEAD_CENTRE_Y, HEAD_RADIUS, start, end, false);
  shape.lineTo(0, 0);
  return shape;
}

const teardropShape = createTeardropShape();

/** Outline of the teardrop. */
export const teardropOutlineGeometry = new THREE.BufferGeometry().setFromPoints(
  teardropShape.getPoints(ARC_SEGMENTS),
);

/** Filled teardrop, inside the outline. */
export const teardropFillGeometry = new THREE.ShapeGeometry(
  teardropShape,
  ARC_SEGMENTS,
);
