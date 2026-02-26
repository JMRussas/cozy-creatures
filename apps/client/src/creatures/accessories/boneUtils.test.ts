// Cozy Creatures - Bone Utils Tests
//
// Tests bone discovery by name pattern matching on mock bone hierarchies.
//
// Depends on: accessories/boneUtils
// Used by:    test runner

import { describe, it, expect, vi } from "vitest";

vi.mock("three", () => {
  class MockObject3D {
    name = "";
    children: MockObject3D[] = [];
    isBone = false;
    isSkinnedMesh = false;
    skeleton: { bones: MockObject3D[] } | null = null;

    traverse(fn: (child: MockObject3D) => void) {
      fn(this);
      for (const child of this.children) {
        child.traverse(fn);
      }
    }
  }
  class MockBone extends MockObject3D {
    isBone = true;
  }
  class MockSkinnedMesh extends MockObject3D {
    isSkinnedMesh = true;
  }
  return {
    Object3D: MockObject3D,
    Bone: MockBone,
    SkinnedMesh: MockSkinnedMesh,
  };
});

import * as THREE from "three";
import { findBoneByPattern, findSkeleton } from "./boneUtils";

function makeBone(name: string): THREE.Bone {
  const bone = new THREE.Bone();
  bone.name = name;
  return bone;
}

function makeHierarchy(...boneNames: string[]): THREE.Object3D {
  const root = new THREE.Object3D();
  let current: THREE.Object3D = root;
  for (const name of boneNames) {
    const bone = makeBone(name);
    (current as unknown as { children: THREE.Object3D[] }).children.push(bone);
    current = bone;
  }
  return root;
}

describe("findBoneByPattern", () => {
  it("returns null when no bones exist", () => {
    const root = new THREE.Object3D();
    expect(findBoneByPattern(root, "Head")).toBeNull();
  });

  it("finds a bone by exact name", () => {
    const root = makeHierarchy("Hips", "Spine", "Neck", "Head");
    const bone = findBoneByPattern(root, "Head");
    expect(bone).not.toBeNull();
    expect(bone!.name).toBe("Head");
  });

  it("finds bone by case-insensitive substring", () => {
    const root = makeHierarchy("Hips", "Spine1", "Spine2", "Neck", "HeadTop_End");
    const bone = findBoneByPattern(root, "head");
    expect(bone).not.toBeNull();
    expect(bone!.name).toBe("HeadTop_End");
  });

  it("returns first match when multiple bones match", () => {
    const root = makeHierarchy("Spine", "Spine1", "Spine2");
    const bone = findBoneByPattern(root, "spine");
    expect(bone).not.toBeNull();
    // First bone after root that matches
    expect(bone!.name).toBe("Spine");
  });

  it("returns null when pattern doesn't match any bone", () => {
    const root = makeHierarchy("Hips", "Spine", "Neck");
    expect(findBoneByPattern(root, "Tail")).toBeNull();
  });
});

describe("findSkeleton", () => {
  it("returns null when no skinned mesh exists", () => {
    const root = new THREE.Object3D();
    expect(findSkeleton(root)).toBeNull();
  });

  it("returns skeleton from a skinned mesh", () => {
    const root = new THREE.Object3D();
    const skinnedMesh = new THREE.SkinnedMesh();
    const fakeSkeleton = { bones: [makeBone("Root")] };
    (skinnedMesh as unknown as { skeleton: unknown }).skeleton = fakeSkeleton;
    (root as unknown as { children: THREE.Object3D[] }).children.push(
      skinnedMesh as unknown as THREE.Object3D,
    );
    const result = findSkeleton(root);
    expect(result).toBe(fakeSkeleton);
  });
});
