// Cozy Creatures - Skin Shop Panel
//
// Full-screen overlay for browsing skins and managing inventory.
// Two tabs: "All Skins" (browse by set) and "My Skins" (inventory).
//
// Depends on: react, @cozy/shared (SKINS, SKIN_SETS, RARITIES, CREATURES),
//             stores/skinStore, stores/playerStore, ui/RarityBadge,
//             ui/creatures/CreaturePreview, ui/SkinInventory
// Used by:    App.tsx (InRoomView)

import { useState, useMemo, useEffect } from "react";
import { SKINS, SKIN_SETS, RARITIES, CREATURES } from "@cozy/shared";
import type { SkinDefinition, SkinId, SkinSetId } from "@cozy/shared";
import { useSkinStore } from "../../stores/skinStore";
import { usePlayerStore } from "../../stores/playerStore";
import RarityBadge from "./RarityBadge";
import CreaturePreview from "../creatures/CreaturePreview";
import SkinInventory from "./SkinInventory";

type Tab = "browse" | "inventory";

interface SkinShopProps {
  onClose: () => void;
}

export default function SkinShop({ onClose }: SkinShopProps) {
  const [tab, setTab] = useState<Tab>("inventory");
  const [selectedSetId, setSelectedSetId] = useState<SkinSetId | "all">("all");
  const [previewSkinId, setPreviewSkinId] = useState<SkinId | null>(null);

  const creatureType = usePlayerStore((s) => s.creatureType);
  const inventory = useSkinStore((s) => s.inventory);
  const equippedSkinId = useSkinStore((s) => s.equippedSkinId);
  const equipSkin = useSkinStore((s) => s.equipSkin);
  const isEquipping = useSkinStore((s) => s.isEquipping);

  const ownedIds = useMemo(
    () => new Set(inventory.map((i) => i.skinId)),
    [inventory],
  );

  // All skins for the player's creature type, filtered by set
  const browseSkins: SkinDefinition[] = useMemo(() => {
    return Object.values(SKINS)
      .filter((s) => s.creatureType === creatureType)
      .filter((s) => selectedSetId === "all" || s.setId === selectedSetId)
      .sort((a, b) => RARITIES[a.rarity].order - RARITIES[b.rarity].order);
  }, [creatureType, selectedSetId]);

  const previewSkin: SkinDefinition | null = previewSkinId ? SKINS[previewSkinId] : null;

  // Close on Escape key — capture phase so SkinShop handles Escape before
  // ChatPanel's bubble-phase handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose]);

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Skin Shop"
    >
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl bg-gray-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 px-5 py-3">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-purple-300">Skins</h2>
            <span className="text-xs text-gray-400">
              {CREATURES[creatureType].name}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          >
            Close
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setTab("inventory")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === "inventory"
                ? "border-b-2 border-purple-400 text-purple-300"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            My Skins
          </button>
          <button
            onClick={() => setTab("browse")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === "browse"
                ? "border-b-2 border-purple-400 text-purple-300"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            All Skins
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === "inventory" ? (
            <SkinInventory />
          ) : (
            <div className="flex gap-4">
              {/* Set filter */}
              <div className="flex w-32 flex-col gap-1">
                <button
                  onClick={() => setSelectedSetId("all")}
                  className={`rounded px-2 py-1 text-left text-xs transition-colors ${
                    selectedSetId === "all"
                      ? "bg-purple-600/60 text-white"
                      : "text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                  }`}
                >
                  All Sets
                </button>
                {Object.values(SKIN_SETS).map((skinSet) => (
                  <button
                    key={skinSet.id}
                    onClick={() => setSelectedSetId(skinSet.id as SkinSetId)}
                    className={`rounded px-2 py-1 text-left text-xs transition-colors ${
                      selectedSetId === skinSet.id
                        ? "bg-purple-600/60 text-white"
                        : "text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                    }`}
                  >
                    {skinSet.name}
                  </button>
                ))}
              </div>

              {/* Skin cards grid */}
              <div className="flex-1">
                <div className="grid grid-cols-3 gap-2">
                  {browseSkins.map((skin) => {
                    const owned = ownedIds.has(skin.id);
                    const equipped = equippedSkinId === skin.id;

                    return (
                      <button
                        key={skin.id}
                        onClick={() => setPreviewSkinId(skin.id as SkinId)}
                        className={`rounded-lg p-2 text-left transition-colors ${
                          previewSkinId === skin.id
                            ? "ring-2 ring-purple-400 bg-gray-700/80"
                            : "bg-gray-800/60 hover:bg-gray-700/60"
                        }`}
                        style={{ borderTop: `2px solid ${RARITIES[skin.rarity].color}` }}
                      >
                        <div className="flex items-center justify-between">
                          <RarityBadge rarity={skin.rarity} />
                          {equipped && (
                            <span className="text-[10px] font-bold text-green-400">EQUIPPED</span>
                          )}
                        </div>
                        <p className="mt-1 truncate text-xs font-medium text-white">{skin.name}</p>
                        <p className="truncate text-[10px] text-gray-500">{skin.description}</p>
                        {!owned && (
                          <span className="mt-1 inline-block text-[10px] text-gray-600">Locked</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview sidebar */}
              {previewSkin && (
                <div className="flex flex-col items-center gap-2">
                  <CreaturePreview creatureType={creatureType} skinId={previewSkinId!} size="lg" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">{previewSkin.name}</p>
                    <p className="text-xs text-gray-400">{previewSkin.description}</p>
                    <RarityBadge rarity={previewSkin.rarity} />
                  </div>
                  {ownedIds.has(previewSkin.id) && equippedSkinId !== previewSkin.id && (
                    <button
                      onClick={() => equipSkin(previewSkin.id as SkinId)}
                      disabled={isEquipping}
                      className="rounded bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-purple-500 disabled:opacity-50"
                    >
                      {isEquipping ? "..." : "Equip"}
                    </button>
                  )}
                  {equippedSkinId === previewSkin.id && (
                    <button
                      onClick={() => equipSkin(null)}
                      disabled={isEquipping}
                      className="rounded bg-gray-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gray-500 disabled:opacity-50"
                    >
                      {isEquipping ? "..." : "Unequip"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
