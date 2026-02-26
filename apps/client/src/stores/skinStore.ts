// Cozy Creatures - Skin Store
//
// Zustand store for skin inventory, equipped skin, and server sync.
// Fetches inventory from REST API and sends equip requests via socket.
//
// Depends on: zustand, @cozy/shared (InventoryItem, SkinId), networking/socket.ts
// Used by:    ui/SkinShop.tsx, ui/SkinInventory.tsx, creatures/Creature.tsx,
//             App.tsx, stores/roomStore.ts

import { create } from "zustand";
import type { InventoryItem, SkinId } from "@cozy/shared";
import { getSocket } from "../networking/socket";

const socket = getSocket();

const EQUIP_TIMEOUT_MS = 5_000;

/** Handle for the active equip timeout, cleared on callback or reset. */
let equipTimeoutHandle: ReturnType<typeof setTimeout> | null = null;

function clearEquipTimeout(): void {
  if (equipTimeoutHandle !== null) {
    clearTimeout(equipTimeoutHandle);
    equipTimeoutHandle = null;
  }
}

interface SkinStoreState {
  /** Skins owned by the local player. */
  inventory: InventoryItem[];
  /** Currently equipped skin ID (null = default appearance). */
  equippedSkinId: SkinId | null;
  /** Whether an equip request is in flight. */
  isEquipping: boolean;
  /** Last error from an equip attempt. */
  equipError: string | null;
  /** Error from inventory fetch (null = no error or not yet fetched). */
  inventoryError: string | null;
}

interface SkinStoreActions {
  /** Fetch inventory from the REST API. */
  fetchInventory: (playerId: string) => Promise<void>;
  /** Equip a skin (or null to unequip) via socket. */
  equipSkin: (skinId: SkinId | null) => void;
  /** Reset state on room leave. */
  resetSkins: () => void;
}

export const useSkinStore = create<SkinStoreState & SkinStoreActions>(
  (set, get) => ({
    inventory: [],
    equippedSkinId: null,
    isEquipping: false,
    equipError: null,
    inventoryError: null,

    fetchInventory: async (playerId) => {
      set({ inventoryError: null });
      try {
        const res = await fetch(`/api/skins/inventory/${playerId}`);
        if (!res.ok) {
          set({ inventoryError: `Server returned ${res.status}` });
          return;
        }
        const data = (await res.json()) as {
          items: InventoryItem[];
          equippedSkinId: SkinId | null;
        };
        set({ inventory: data.items, equippedSkinId: data.equippedSkinId });
      } catch {
        set({ inventoryError: "Failed to load inventory" });
      }
    },

    equipSkin: (skinId) => {
      if (get().isEquipping) return;

      if (!socket.connected) {
        set({ equipError: "Not connected to server" });
        return;
      }

      set({ isEquipping: true, equipError: null });

      // Timeout: if the server never responds, reset isEquipping
      clearEquipTimeout();
      equipTimeoutHandle = setTimeout(() => {
        if (get().isEquipping) {
          set({ isEquipping: false, equipError: "Equip request timed out" });
        }
      }, EQUIP_TIMEOUT_MS);

      socket.emit(
        "player:equip-skin",
        { skinId: skinId ?? "" },
        (response) => {
          clearEquipTimeout();
          if (response.success) {
            set({
              equippedSkinId: skinId,
              isEquipping: false,
              equipError: null,
            });
          } else {
            set({
              isEquipping: false,
              equipError: response.error ?? "Failed to equip",
            });
          }
        },
      );
    },

    resetSkins: () => {
      clearEquipTimeout();
      set({
        inventory: [],
        equippedSkinId: null,
        isEquipping: false,
        equipError: null,
        inventoryError: null,
      });
    },
  }),
);
