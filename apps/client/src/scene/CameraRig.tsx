// Cozy Creatures - Camera Rig
//
// Smooth-follow camera that tracks the player's creature position.
// Uses an orthographic camera at an isometric angle. Supports smooth
// zoom via scroll wheel and store-driven target zoom.
//
// Depends on: @react-three/fiber, @react-three/drei, stores/playerStore, config
// Used by:    IsometricScene

import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";

import { usePlayerStore } from "../stores/playerStore";
import { CAMERA_OFFSET, CAMERA_LERP_SPEED, CAMERA_ZOOM_LERP_SPEED } from "../config";

const CAMERA_OFFSET_VEC = new THREE.Vector3(
  CAMERA_OFFSET.x,
  CAMERA_OFFSET.y,
  CAMERA_OFFSET.z,
);

export default function CameraRig() {
  const cameraRef = useRef<THREE.OrthographicCamera>(null);
  const targetPos = useRef(new THREE.Vector3());
  const currentZoom = useRef(usePlayerStore.getState().targetZoom);
  const { gl } = useThree();

  // Scroll wheel → adjust target zoom
  useEffect(() => {
    const canvas = gl.domElement;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const store = usePlayerStore.getState();
      // deltaY > 0 = scroll down = zoom out, deltaY < 0 = scroll up = zoom in
      if (e.deltaY < 0) {
        store.zoomIn();
      } else if (e.deltaY > 0) {
        store.zoomOut();
      }
    }
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [gl]);

  useFrame((_, delta) => {
    const camera = cameraRef.current;
    if (!camera) return;

    const state = usePlayerStore.getState();
    const { x: px, y: py, z: pz } = state.position;

    // Smooth position follow
    targetPos.current.set(
      px + CAMERA_OFFSET_VEC.x,
      py + CAMERA_OFFSET_VEC.y,
      pz + CAMERA_OFFSET_VEC.z,
    );
    camera.position.lerp(targetPos.current, 1 - Math.exp(-CAMERA_LERP_SPEED * delta));
    camera.lookAt(px, py, pz);

    // Smooth zoom
    const t = 1 - Math.exp(-CAMERA_ZOOM_LERP_SPEED * delta);
    currentZoom.current += (state.targetZoom - currentZoom.current) * t;
    camera.zoom = currentZoom.current;
    camera.updateProjectionMatrix();
  });

  return (
    <OrthographicCamera
      ref={cameraRef}
      makeDefault
      zoom={currentZoom.current}
      position={[CAMERA_OFFSET_VEC.x, CAMERA_OFFSET_VEC.y, CAMERA_OFFSET_VEC.z]}
      near={0.1}
      far={100}
    />
  );
}
