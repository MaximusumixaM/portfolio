import * as THREE from "three";

/**
 * A MeshPhysicalMaterial extended (via onBeforeCompile) into the "living" hero material:
 * - vertices displace along their normal by animated 3D simplex noise, so the dense letter
 *   mesh flexes as a connected surface (coincident verts share a position → share a
 *   displacement → the surface stays watertight while undulating);
 * - `flatShading` derives per-facet normals from the displaced surface, so it reads faceted;
 * - the diffuse color drifts through a cyclic gradient over time and across the surface.
 *
 * Per-letter variation comes from `seed`. Drive the animation by advancing `uniforms.uTime`
 * each frame (exposed on `material.userData.flexUniforms`).
 */

export interface FlexUniforms {
  uTime: { value: number };
  uSeed: { value: number };
  uAmplitude: { value: number };
  uNoiseScale: { value: number };
}

export interface FlexMaterial extends THREE.MeshPhysicalMaterial {
  userData: { flexUniforms: FlexUniforms };
}

// Cyclic cosine gradient (Inigo Quilez). Cool blue → violet → cyan sweep; art-directed
// placeholder — retune these four vec3s when there's a real brand direction.
const GRADIENT_A = "vec3(0.52, 0.45, 0.62)";
const GRADIENT_B = "vec3(0.45, 0.42, 0.45)";
const GRADIENT_C = "vec3(1.0, 1.0, 1.0)";
const GRADIENT_D = "vec3(0.12, 0.30, 0.62)";

/** Ashima 3D simplex noise (webgl-noise), returns roughly [-1, 1]. */
const SIMPLEX_3D = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(
    i.z+vec4(0.0,i1.z,i2.z,1.0))
    +i.y+vec4(0.0,i1.y,i2.y,1.0))
    +i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

const VERTEX_DECLARATIONS = /* glsl */ `
uniform float uTime;
uniform float uSeed;
uniform float uAmplitude;
uniform float uNoiseScale;
varying float vFlexNoise;
varying vec3 vFlexObjPos;
${SIMPLEX_3D}
`;

const VERTEX_DISPLACEMENT = /* glsl */ `
// Displace by a 3D domain warp that is a pure function of position (not the vertex
// normal): coincident vertices at hard edges/bevels share a position, so they always
// move together and the mesh never cracks apart as it breathes.
vec3 flexP = position * uNoiseScale + vec3(uSeed) + uTime * 0.28;
vec3 flexOffset = vec3(
  snoise(flexP),
  snoise(flexP + 19.19),
  snoise(flexP + 37.73)
);
flexOffset.z *= 0.55; // keep the breathing mostly in-plane so depth layering stays crisp
transformed += flexOffset * uAmplitude;
vFlexNoise = flexOffset.x;
vFlexObjPos = position;
`;

const FRAGMENT_DECLARATIONS = /* glsl */ `
uniform float uTime;
uniform float uSeed;
varying float vFlexNoise;
varying vec3 vFlexObjPos;
vec3 flexPalette(float t){
  return ${GRADIENT_A} + ${GRADIENT_B} * cos(6.28318530718 * (${GRADIENT_C} * t + ${GRADIENT_D}));
}
`;

const FRAGMENT_COLOR = /* glsl */ `
float flexT = fract(
  vFlexObjPos.y * 0.55 + vFlexObjPos.x * 0.18
  + uTime * 0.045 + uSeed * 0.13 + vFlexNoise * 0.35
);
diffuseColor.rgb = flexPalette(flexT);
`;

export function createFlexMaterial(seed: number): FlexMaterial {
  const uniforms: FlexUniforms = {
    uTime: { value: 0 },
    uSeed: { value: seed },
    uAmplitude: { value: 0.055 },
    uNoiseScale: { value: 0.95 },
  };

  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.32,
    clearcoat: 1.0,
    clearcoatRoughness: 0.28,
    envMapIntensity: 1.15,
    flatShading: true,
    side: THREE.DoubleSide,
  }) as FlexMaterial;

  material.userData = { flexUniforms: uniforms };

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${VERTEX_DECLARATIONS}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\n${VERTEX_DISPLACEMENT}`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${FRAGMENT_DECLARATIONS}`)
      .replace("#include <color_fragment>", `#include <color_fragment>\n${FRAGMENT_COLOR}`);
  };
  // Unique per seed so each letter compiles with its own seed uniform rather than
  // sharing a program (and thus a seed) with its siblings.
  material.customProgramCacheKey = () => `max-flex-${String(seed)}`;

  return material;
}
