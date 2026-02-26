// Cozy Creatures - HSL Shader Tests
//
// Tests the pure logic of applyHSLShift (material cloning, uniform setup,
// cache key generation). Cannot test actual GLSL rendering (no WebGL in vitest).
//
// Depends on: shaders/hslShader.ts, three
// Used by:    test runner

import { describe, it, expect, vi } from "vitest";

// Mock three.js — vitest runs in jsdom (no WebGL)
vi.mock("three", () => {
  class MockMaterial {
    isMeshStandardMaterial = true;
    userData: Record<string, unknown> = {};
    needsUpdate = false;
    onBeforeCompile: ((shader: unknown) => void) | null = null;
    customProgramCacheKey: (() => string) | null = null;
    clone() {
      const cloned = new MockMaterial();
      cloned.userData = { ...this.userData };
      return cloned;
    }
    dispose() {}
  }
  class MockMesh {
    isMesh = true;
    material: MockMaterial;
    constructor() {
      this.material = new MockMaterial();
    }
  }
  class MockGroup {
    children: unknown[] = [];
    traverse(fn: (child: unknown) => void) {
      fn(this);
      for (const child of this.children) {
        fn(child);
      }
    }
  }
  return {
    MeshStandardMaterial: MockMaterial,
    Mesh: MockMesh,
    Group: MockGroup,
  };
});

import { applyHSLShift, updateHSLUniforms, applySkinShader, disposeSkinMaterials } from "./hslShader";
import * as THREE from "three";

describe("applyHSLShift", () => {
  function makeMaterial() {
    return new THREE.MeshStandardMaterial() as unknown as THREE.MeshStandardMaterial;
  }

  it("returns a new material (not the same reference)", () => {
    const original = makeMaterial();
    const cloned = applyHSLShift(original, { hueShift: 0, saturationScale: 1, lightnessOffset: 0 });
    expect(cloned).not.toBe(original);
  });

  it("sets onBeforeCompile on the cloned material", () => {
    const mat = applyHSLShift(makeMaterial(), { hueShift: 45, saturationScale: 1.2, lightnessOffset: 0.1 });
    expect(mat.onBeforeCompile).toBeTypeOf("function");
  });

  it("stores hslUniforms on userData with correct values", () => {
    const mat = applyHSLShift(makeMaterial(), { hueShift: 90, saturationScale: 0.5, lightnessOffset: -0.2 });
    const uniforms = mat.userData.hslUniforms as { uSkinHueShift: { value: number }; uSkinSatScale: { value: number }; uSkinLightOffset: { value: number } };
    expect(uniforms.uSkinHueShift.value).toBeCloseTo((90 * Math.PI) / 180);
    expect(uniforms.uSkinSatScale.value).toBe(0.5);
    expect(uniforms.uSkinLightOffset.value).toBe(-0.2);
  });

  it("converts degrees to radians correctly", () => {
    const mat = applyHSLShift(makeMaterial(), { hueShift: 180, saturationScale: 1, lightnessOffset: 0 });
    const uniforms = mat.userData.hslUniforms as { uSkinHueShift: { value: number }; uSkinSatScale: { value: number }; uSkinLightOffset: { value: number } };
    expect(uniforms.uSkinHueShift.value).toBeCloseTo(Math.PI);
  });

  it("identity shift (0, 1.0, 0) stores zero/one uniforms", () => {
    const mat = applyHSLShift(makeMaterial(), { hueShift: 0, saturationScale: 1, lightnessOffset: 0 });
    const uniforms = mat.userData.hslUniforms as { uSkinHueShift: { value: number }; uSkinSatScale: { value: number }; uSkinLightOffset: { value: number } };
    expect(uniforms.uSkinHueShift.value).toBe(0);
    expect(uniforms.uSkinSatScale.value).toBe(1);
    expect(uniforms.uSkinLightOffset.value).toBe(0);
  });

  it("sets customProgramCacheKey", () => {
    const mat = applyHSLShift(makeMaterial(), { hueShift: 45, saturationScale: 1.2, lightnessOffset: 0.1 });
    expect(mat.customProgramCacheKey).toBeTypeOf("function");
    const key = mat.customProgramCacheKey!();
    expect(key).toBe("hsl_45_1.2_0.1");
  });

  it("different shifts produce different cache keys", () => {
    const mat1 = applyHSLShift(makeMaterial(), { hueShift: 10, saturationScale: 1, lightnessOffset: 0 });
    const mat2 = applyHSLShift(makeMaterial(), { hueShift: 20, saturationScale: 1, lightnessOffset: 0 });
    expect(mat1.customProgramCacheKey!()).not.toBe(mat2.customProgramCacheKey!());
  });

  it("sets needsUpdate to true", () => {
    const mat = applyHSLShift(makeMaterial(), { hueShift: 0, saturationScale: 1, lightnessOffset: 0 });
    expect(mat.needsUpdate).toBe(true);
  });
});

describe("updateHSLUniforms", () => {
  it("updates existing uniforms", () => {
    const mat = applyHSLShift(
      new THREE.MeshStandardMaterial() as unknown as THREE.MeshStandardMaterial,
      { hueShift: 10, saturationScale: 1, lightnessOffset: 0 },
    );
    updateHSLUniforms(mat, { hueShift: 90, saturationScale: 0.5, lightnessOffset: -0.3 });
    const uniforms = mat.userData.hslUniforms as { uSkinHueShift: { value: number }; uSkinSatScale: { value: number }; uSkinLightOffset: { value: number } };
    expect(uniforms.uSkinHueShift.value).toBeCloseTo((90 * Math.PI) / 180);
    expect(uniforms.uSkinSatScale.value).toBe(0.5);
    expect(uniforms.uSkinLightOffset.value).toBe(-0.3);
  });

  it("no-ops on material without hslUniforms", () => {
    const mat = new THREE.MeshStandardMaterial() as unknown as THREE.MeshStandardMaterial;
    // Should not throw
    updateHSLUniforms(mat, { hueShift: 90, saturationScale: 1, lightnessOffset: 0 });
  });
});

describe("applySkinShader", () => {
  it("returns cloned materials for each mesh", () => {
    const mesh = new THREE.Mesh() as unknown as THREE.Mesh;
    const group = new THREE.Group() as unknown as THREE.Group;
    (group as unknown as { children: unknown[] }).children = [mesh];

    const cloned = applySkinShader(
      group as unknown as THREE.Object3D,
      { hueShift: 30, saturationScale: 1.1, lightnessOffset: 0 },
    );
    expect(cloned.length).toBe(1);
  });
});

describe("disposeSkinMaterials", () => {
  it("calls dispose on each material", () => {
    const mat = applyHSLShift(
      new THREE.MeshStandardMaterial() as unknown as THREE.MeshStandardMaterial,
      { hueShift: 0, saturationScale: 1, lightnessOffset: 0 },
    );
    const spy = vi.spyOn(mat, "dispose");
    disposeSkinMaterials([mat]);
    expect(spy).toHaveBeenCalledOnce();
  });
});
