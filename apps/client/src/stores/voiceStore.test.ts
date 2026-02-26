// Cozy Creatures - Voice Store Tests
//
// Tests for voiceStore: toggle logic, linked mute/deafen, reset,
// socket broadcast behavior.
//
// Depends on: stores/voiceStore, networking/socket (mocked)
// Used by:    test runner

import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockSocket } = vi.hoisted(() => ({
  mockSocket: {
    connected: false,
    emit: vi.fn(),
    on: vi.fn().mockReturnThis(),
    off: vi.fn().mockReturnThis(),
  },
}));

vi.mock("../networking/socket", () => ({
  getSocket: () => mockSocket,
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}));

import { useVoiceStore } from "./voiceStore";

describe("voiceStore", () => {
  beforeEach(() => {
    useVoiceStore.getState().resetVoice();
    mockSocket.connected = false;
    mockSocket.emit.mockClear();
  });

  it("starts muted by default", () => {
    expect(useVoiceStore.getState().muted).toBe(true);
  });

  it("starts not deafened", () => {
    expect(useVoiceStore.getState().deafened).toBe(false);
  });

  it("starts not speaking", () => {
    expect(useVoiceStore.getState().speaking).toBe(false);
  });

  it("starts disconnected", () => {
    expect(useVoiceStore.getState().connectionState).toBe("disconnected");
  });

  describe("toggleMute", () => {
    it("toggles muted state", () => {
      useVoiceStore.getState().toggleMute();
      expect(useVoiceStore.getState().muted).toBe(false);

      useVoiceStore.getState().toggleMute();
      expect(useVoiceStore.getState().muted).toBe(true);
    });

    it("unmuting while deafened also undeafens", () => {
      // Set up deafened state (deafen also mutes)
      useVoiceStore.getState().toggleDeafen();
      expect(useVoiceStore.getState().muted).toBe(true);
      expect(useVoiceStore.getState().deafened).toBe(true);

      // Unmute
      useVoiceStore.getState().toggleMute();
      expect(useVoiceStore.getState().muted).toBe(false);
      expect(useVoiceStore.getState().deafened).toBe(false);
    });
  });

  describe("toggleDeafen", () => {
    it("deafening also mutes", () => {
      // Start unmuted
      useVoiceStore.getState().setMuted(false);
      expect(useVoiceStore.getState().muted).toBe(false);

      useVoiceStore.getState().toggleDeafen();
      expect(useVoiceStore.getState().deafened).toBe(true);
      expect(useVoiceStore.getState().muted).toBe(true);
    });

    it("undeafening preserves muted state", () => {
      useVoiceStore.getState().toggleDeafen();
      expect(useVoiceStore.getState().deafened).toBe(true);
      expect(useVoiceStore.getState().muted).toBe(true);

      useVoiceStore.getState().toggleDeafen();
      expect(useVoiceStore.getState().deafened).toBe(false);
      // muted was true before deafening, stays true
      expect(useVoiceStore.getState().muted).toBe(true);
    });
  });

  describe("setSpeaking", () => {
    it("sets speaking state", () => {
      useVoiceStore.getState().setSpeaking(true);
      expect(useVoiceStore.getState().speaking).toBe(true);

      useVoiceStore.getState().setSpeaking(false);
      expect(useVoiceStore.getState().speaking).toBe(false);
    });
  });

  describe("setConnectionState", () => {
    it("sets connection state", () => {
      useVoiceStore.getState().setConnectionState("connecting");
      expect(useVoiceStore.getState().connectionState).toBe("connecting");
    });

    it("sets error when provided", () => {
      useVoiceStore.getState().setConnectionState("error", "test error");
      expect(useVoiceStore.getState().connectionState).toBe("error");
      expect(useVoiceStore.getState().error).toBe("test error");
    });

    it("clears error when not provided", () => {
      useVoiceStore.getState().setConnectionState("error", "test error");
      useVoiceStore.getState().setConnectionState("connected");
      expect(useVoiceStore.getState().error).toBeNull();
    });
  });

  describe("volume controls", () => {
    it("clamps input volume to [0, 1]", () => {
      useVoiceStore.getState().setInputVolume(1.5);
      expect(useVoiceStore.getState().inputVolume).toBe(1);

      useVoiceStore.getState().setInputVolume(-0.5);
      expect(useVoiceStore.getState().inputVolume).toBe(0);
    });

    it("clamps output volume to [0, 1]", () => {
      useVoiceStore.getState().setOutputVolume(2);
      expect(useVoiceStore.getState().outputVolume).toBe(1);

      useVoiceStore.getState().setOutputVolume(-1);
      expect(useVoiceStore.getState().outputVolume).toBe(0);
    });
  });

  describe("resetVoice", () => {
    it("resets to default state", () => {
      useVoiceStore.getState().setConnectionState("connected");
      useVoiceStore.getState().setMuted(false);
      useVoiceStore.getState().setSpeaking(true);

      useVoiceStore.getState().resetVoice();

      const state = useVoiceStore.getState();
      expect(state.connectionState).toBe("disconnected");
      expect(state.muted).toBe(true);
      expect(state.deafened).toBe(false);
      expect(state.speaking).toBe(false);
      expect(state.error).toBeNull();
      expect(state.remoteSpeaking).toEqual({});
    });
  });

  describe("toggleSpatial", () => {
    it("toggles spatial audio", () => {
      expect(useVoiceStore.getState().spatialEnabled).toBe(false);
      useVoiceStore.getState().toggleSpatial();
      expect(useVoiceStore.getState().spatialEnabled).toBe(true);
      useVoiceStore.getState().toggleSpatial();
      expect(useVoiceStore.getState().spatialEnabled).toBe(false);
    });
  });

  describe("setInputMode", () => {
    it("changes input mode", () => {
      expect(useVoiceStore.getState().inputMode).toBe("open-mic");
      useVoiceStore.getState().setInputMode("push-to-talk");
      expect(useVoiceStore.getState().inputMode).toBe("push-to-talk");
    });
  });

  describe("socket broadcast", () => {
    it("does not emit when socket is disconnected", () => {
      mockSocket.connected = false;
      useVoiceStore.getState().toggleMute();
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it("emits voice:state on toggleMute when connected", () => {
      mockSocket.connected = true;
      useVoiceStore.getState().toggleMute(); // muted: true -> false
      expect(mockSocket.emit).toHaveBeenCalledWith("voice:state", {
        muted: false,
        deafened: false,
        speaking: false,
      });
    });

    it("emits voice:state on toggleDeafen when connected", () => {
      mockSocket.connected = true;
      useVoiceStore.getState().toggleDeafen();
      expect(mockSocket.emit).toHaveBeenCalledWith("voice:state", {
        muted: true,
        deafened: true,
        speaking: false,
      });
    });

    it("emits voice:state on setSpeaking when connected", () => {
      mockSocket.connected = true;
      useVoiceStore.getState().setSpeaking(true);
      expect(mockSocket.emit).toHaveBeenCalledWith("voice:state", {
        muted: true,
        deafened: false,
        speaking: true,
      });
    });
  });
});
