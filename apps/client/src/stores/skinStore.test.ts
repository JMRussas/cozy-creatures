// Cozy Creatures - Skin Store Tests
//
// Tests for skinStore: inventory fetch, equip/unequip, reset.
//
// Depends on: stores/skinStore, networking/socket (mocked)
// Used by:    test runner

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

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

import { useSkinStore } from "./skinStore";

const originalFetch = globalThis.fetch;

describe("skinStore", () => {
  beforeEach(() => {
    useSkinStore.getState().resetSkins();
    mockSocket.connected = false;
    mockSocket.emit.mockClear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("starts with empty inventory", () => {
    expect(useSkinStore.getState().inventory).toEqual([]);
  });

  it("starts with no equipped skin", () => {
    expect(useSkinStore.getState().equippedSkinId).toBeNull();
  });

  it("starts not equipping", () => {
    expect(useSkinStore.getState().isEquipping).toBe(false);
  });

  it("resetSkins clears all state", () => {
    useSkinStore.setState({
      inventory: [{ skinId: "otter-cocoa", acquiredAt: 123 }],
      equippedSkinId: "otter-cocoa",
      isEquipping: true,
      equipError: "some error",
    });
    useSkinStore.getState().resetSkins();
    const s = useSkinStore.getState();
    expect(s.inventory).toEqual([]);
    expect(s.equippedSkinId).toBeNull();
    expect(s.isEquipping).toBe(false);
    expect(s.equipError).toBeNull();
  });

  it("equipSkin emits socket event", () => {
    mockSocket.connected = true;
    useSkinStore.getState().equipSkin("otter-cocoa");
    expect(mockSocket.emit).toHaveBeenCalledWith(
      "player:equip-skin",
      { skinId: "otter-cocoa" },
      expect.any(Function),
    );
    expect(useSkinStore.getState().isEquipping).toBe(true);
  });

  it("equipSkin updates state on success callback", () => {
    mockSocket.connected = true;
    mockSocket.emit.mockImplementation((_event: string, _data: unknown, cb: (r: { success: boolean }) => void) => {
      cb({ success: true });
    });
    useSkinStore.getState().equipSkin("otter-cocoa");
    const s = useSkinStore.getState();
    expect(s.equippedSkinId).toBe("otter-cocoa");
    expect(s.isEquipping).toBe(false);
    expect(s.equipError).toBeNull();
  });

  it("equipSkin sets error on failure callback", () => {
    mockSocket.connected = true;
    mockSocket.emit.mockImplementation((_event: string, _data: unknown, cb: (r: { success: boolean; error?: string }) => void) => {
      cb({ success: false, error: "Not owned" });
    });
    useSkinStore.getState().equipSkin("otter-cocoa");
    const s = useSkinStore.getState();
    expect(s.equippedSkinId).toBeNull();
    expect(s.isEquipping).toBe(false);
    expect(s.equipError).toBe("Not owned");
  });

  it("equipSkin ignores duplicate calls while equipping", () => {
    mockSocket.connected = true;
    useSkinStore.setState({ isEquipping: true });
    useSkinStore.getState().equipSkin("otter-cocoa");
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  it("unequip sends empty string skinId", () => {
    mockSocket.connected = true;
    useSkinStore.getState().equipSkin(null);
    expect(mockSocket.emit).toHaveBeenCalledWith(
      "player:equip-skin",
      { skinId: "" },
      expect.any(Function),
    );
  });

  it("equipSkin sets error when socket is disconnected", () => {
    mockSocket.connected = false;
    useSkinStore.getState().equipSkin("otter-cocoa");
    expect(mockSocket.emit).not.toHaveBeenCalled();
    expect(useSkinStore.getState().equipError).toBe("Not connected to server");
    expect(useSkinStore.getState().isEquipping).toBe(false);
  });

  it("fetchInventory populates state from API", async () => {
    const mockItems = [{ skinId: "otter-cocoa", acquiredAt: 100 }];
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: mockItems, equippedSkinId: "otter-cocoa" }),
    });

    await useSkinStore.getState().fetchInventory("p1");
    const s = useSkinStore.getState();
    expect(s.inventory).toEqual(mockItems);
    expect(s.equippedSkinId).toBe("otter-cocoa");
  });

  it("fetchInventory handles API failure gracefully", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false });

    await useSkinStore.getState().fetchInventory("p1");
    expect(useSkinStore.getState().inventory).toEqual([]);
  });
});
