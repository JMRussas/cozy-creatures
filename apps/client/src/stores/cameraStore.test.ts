// Cozy Creatures - Camera Store Tests
//
// Depends on: stores/cameraStore.ts
// Used by:    test runner

import { describe, it, expect, beforeEach } from "vitest";
import { useCameraStore } from "./cameraStore";
import { CAMERA_ZOOM, CAMERA_ZOOM_MIN, CAMERA_ZOOM_MAX, CAMERA_ZOOM_STEP } from "../config";

describe("cameraStore", () => {
  beforeEach(() => {
    useCameraStore.setState({ targetZoom: CAMERA_ZOOM });
  });

  it("starts at the default zoom level", () => {
    expect(useCameraStore.getState().targetZoom).toBe(CAMERA_ZOOM);
  });

  it("zoomIn increases targetZoom by CAMERA_ZOOM_STEP", () => {
    useCameraStore.getState().zoomIn();
    expect(useCameraStore.getState().targetZoom).toBe(CAMERA_ZOOM + CAMERA_ZOOM_STEP);
  });

  it("zoomOut decreases targetZoom by CAMERA_ZOOM_STEP", () => {
    useCameraStore.getState().zoomOut();
    expect(useCameraStore.getState().targetZoom).toBe(CAMERA_ZOOM - CAMERA_ZOOM_STEP);
  });

  it("zoomIn clamps at CAMERA_ZOOM_MAX", () => {
    useCameraStore.setState({ targetZoom: CAMERA_ZOOM_MAX });
    useCameraStore.getState().zoomIn();
    expect(useCameraStore.getState().targetZoom).toBe(CAMERA_ZOOM_MAX);
  });

  it("zoomOut clamps at CAMERA_ZOOM_MIN", () => {
    useCameraStore.setState({ targetZoom: CAMERA_ZOOM_MIN });
    useCameraStore.getState().zoomOut();
    expect(useCameraStore.getState().targetZoom).toBe(CAMERA_ZOOM_MIN);
  });

  it("setTargetZoom clamps to valid range", () => {
    useCameraStore.getState().setTargetZoom(999);
    expect(useCameraStore.getState().targetZoom).toBe(CAMERA_ZOOM_MAX);

    useCameraStore.getState().setTargetZoom(-10);
    expect(useCameraStore.getState().targetZoom).toBe(CAMERA_ZOOM_MIN);
  });

  it("setTargetZoom accepts values within range", () => {
    useCameraStore.getState().setTargetZoom(50);
    expect(useCameraStore.getState().targetZoom).toBe(50);
  });

  it("multiple zoomIn calls accumulate", () => {
    useCameraStore.setState({ targetZoom: CAMERA_ZOOM_MIN });
    useCameraStore.getState().zoomIn();
    useCameraStore.getState().zoomIn();
    useCameraStore.getState().zoomIn();
    expect(useCameraStore.getState().targetZoom).toBe(CAMERA_ZOOM_MIN + CAMERA_ZOOM_STEP * 3);
  });
});
