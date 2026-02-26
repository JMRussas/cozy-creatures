// Cozy Creatures - HSL Shader Utilities
//
// Injects HSL hue/saturation/lightness shift into MeshStandardMaterial via
// onBeforeCompile. Clones materials to avoid cross-contamination between
// creature instances sharing the same glTF cache.
//
// Depends on: three, @cozy/shared (SkinColorShift)
// Used by:    creatures/CreatureModel.tsx

import * as THREE from "three";
import type { SkinColorShift } from "@cozy/shared";

// ---------------------------------------------------------------------------
// GLSL helpers — injected before main() in the fragment shader
// ---------------------------------------------------------------------------

const HSL_FUNCTIONS = /* glsl */ `
vec3 skinRgb2hsl(vec3 c) {
  float maxC = max(c.r, max(c.g, c.b));
  float minC = min(c.r, min(c.g, c.b));
  float l = (maxC + minC) * 0.5;

  if (maxC == minC) {
    return vec3(0.0, 0.0, l);
  }

  float d = maxC - minC;
  float s = l > 0.5 ? d / (2.0 - maxC - minC) : d / (maxC + minC);
  float h;

  if (maxC == c.r) {
    h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
  } else if (maxC == c.g) {
    h = (c.b - c.r) / d + 2.0;
  } else {
    h = (c.r - c.g) / d + 4.0;
  }
  h /= 6.0;

  return vec3(h, s, l);
}

float skinHue2rgb(float p, float q, float t) {
  if (t < 0.0) t += 1.0;
  if (t > 1.0) t -= 1.0;
  if (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t;
  if (t < 1.0 / 2.0) return q;
  if (t < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
  return p;
}

vec3 skinHsl2rgb(vec3 hsl) {
  if (hsl.y == 0.0) {
    return vec3(hsl.z);
  }
  float q = hsl.z < 0.5 ? hsl.z * (1.0 + hsl.y) : hsl.z + hsl.y - hsl.z * hsl.y;
  float p = 2.0 * hsl.z - q;
  return vec3(
    skinHue2rgb(p, q, hsl.x + 1.0 / 3.0),
    skinHue2rgb(p, q, hsl.x),
    skinHue2rgb(p, q, hsl.x - 1.0 / 3.0)
  );
}
`;

// ---------------------------------------------------------------------------
// Post-map_fragment injection — shifts diffuseColor in HSL space
// ---------------------------------------------------------------------------

const HSL_SHIFT_CODE = /* glsl */ `
{
  vec3 _hsl = skinRgb2hsl(diffuseColor.rgb);
  _hsl.x = fract(_hsl.x + uSkinHueShift / 6.2831853);
  _hsl.y = clamp(_hsl.y * uSkinSatScale, 0.0, 1.0);
  _hsl.z = clamp(_hsl.z + uSkinLightOffset, 0.0, 1.0);
  diffuseColor.rgb = skinHsl2rgb(_hsl);
}
`;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Clone a MeshStandardMaterial and inject HSL shift uniforms via onBeforeCompile.
 * Returns the cloned material — the original is not modified.
 */
export function applyHSLShift(
  material: THREE.MeshStandardMaterial,
  colorShift: SkinColorShift,
): THREE.MeshStandardMaterial {
  const mat = material.clone();

  const hueRad = (colorShift.hueShift * Math.PI) / 180;

  const uniforms = {
    uSkinHueShift: { value: hueRad },
    uSkinSatScale: { value: colorShift.saturationScale },
    uSkinLightOffset: { value: colorShift.lightnessOffset },
  };

  mat.onBeforeCompile = (shader: THREE.WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uSkinHueShift = uniforms.uSkinHueShift;
    shader.uniforms.uSkinSatScale = uniforms.uSkinSatScale;
    shader.uniforms.uSkinLightOffset = uniforms.uSkinLightOffset;

    // Inject uniform declarations + HSL functions before main()
    shader.fragmentShader = shader.fragmentShader.replace(
      "void main() {",
      `uniform float uSkinHueShift;
uniform float uSkinSatScale;
uniform float uSkinLightOffset;
${HSL_FUNCTIONS}
void main() {`,
    );

    // Inject color shift after texture sampling
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_fragment>",
      `#include <map_fragment>
${HSL_SHIFT_CODE}`,
    );
  };

  // Store uniforms for potential live updates
  mat.userData.hslUniforms = uniforms;

  // Unique cache key so each HSL config gets its own compiled program
  mat.customProgramCacheKey = () =>
    `hsl_${colorShift.hueShift}_${colorShift.saturationScale}_${colorShift.lightnessOffset}`;

  mat.needsUpdate = true;
  return mat;
}

/**
 * Update HSL uniforms on a material that was previously processed by applyHSLShift.
 * Does NOT recompile the shader — only works if the material was already compiled.
 */
export function updateHSLUniforms(
  material: THREE.MeshStandardMaterial,
  colorShift: SkinColorShift,
): void {
  const uniforms = material.userData.hslUniforms as
    | { uSkinHueShift: { value: number }; uSkinSatScale: { value: number }; uSkinLightOffset: { value: number } }
    | undefined;
  if (!uniforms) return;

  uniforms.uSkinHueShift.value = (colorShift.hueShift * Math.PI) / 180;
  uniforms.uSkinSatScale.value = colorShift.saturationScale;
  uniforms.uSkinLightOffset.value = colorShift.lightnessOffset;
}

/**
 * Apply HSL shift to all MeshStandardMaterials in a scene graph.
 * Returns an array of the original materials (for disposal tracking).
 */
export function applySkinShader(
  root: THREE.Object3D,
  colorShift: SkinColorShift,
): THREE.MeshStandardMaterial[] {
  const clonedMaterials: THREE.MeshStandardMaterial[] = [];

  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((mat) => {
        if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
          const cloned = applyHSLShift(mat as THREE.MeshStandardMaterial, colorShift);
          clonedMaterials.push(cloned);
          return cloned;
        }
        return mat;
      });
    } else if ((mesh.material as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
      const cloned = applyHSLShift(mesh.material as THREE.MeshStandardMaterial, colorShift);
      clonedMaterials.push(cloned);
      mesh.material = cloned;
    }
  });

  return clonedMaterials;
}

/**
 * Dispose cloned skin materials to prevent memory leaks.
 */
export function disposeSkinMaterials(materials: THREE.MeshStandardMaterial[]): void {
  for (const mat of materials) {
    mat.dispose();
  }
}
