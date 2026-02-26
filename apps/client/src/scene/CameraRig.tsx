// Cozy Creatures - Camera Rig
//
// Smooth-follow camera that tracks the player's creature position.
// Uses an orthographic camera at an isometric angle.
//
// Depends on: @react-three/fiber, @react-three/drei, stores/playerStore, config
// Used by:    IsometricScene

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";

import { usePlayerStore } from "../stores/playerStore";
import { CAMERA_OFFSET, CAMERA_LERP_SPEED, CAMERA_ZOOM } from "../config";

const CAMERA_OFFSET_VEC = new THREE.Vector3(
  CAMERA_OFFSET.x,
  CAMERA_OFFSET.y,
  CAMERA_OFFSET.z,
);

export default function CameraRig() {
  const cameraRef = useRef<THREE.OrthographicCamera>(null);
  const targetPos = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const camera = cameraRef.current;
    if (!camera) return;

    const { x: px, y: py, z: pz } = usePlayerStore.getState().position;
    targetPos.current.set(
      px + CAMERA_OFFSET_VEC.x,
      py + CAMERA_OFFSET_VEC.y,
      pz + CAMERA_OFFSET_VEC.z,
    );

    camera.position.lerp(targetPos.current, 1 - Math.exp(-CAMERA_LERP_SPEED * delta));
    camera.lookAt(px, py, pz);
  });

  return (
    <OrthographicCamera
      ref={cameraRef}
      makeDefault
      zoom={CAMERA_ZOOM}
      position={[CAMERA_OFFSET_VEC.x, CAMERA_OFFSET_VEC.y, CAMERA_OFFSET_VEC.z]}
      near={0.1}
      far={100}
    />
  );
}
