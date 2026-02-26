// Cozy Creatures - Skin Inventory Panel
//
// Shows the player's owned skins in a grid with equip/unequip controls.
// Highlights the currently equipped skin. Includes a 3D preview of the
// selected skin.
//
// Depends on: react, @cozy/shared (SKINS, RARITIES, SkinDefinition, SkinId),
//             stores/skinStore, stores/playerStore, ui/RarityBadge,
//             ui/creatures/CreaturePreview
// Used by:    ui/SkinShop.tsx

import { useState, useMemo } from "react";
import { SKINS, RARITIES } from "@cozy/shared";
import type { SkinDefinition, SkinId } from "@cozy/shared";
import { useSkinStore } from "../../stores/skinStore";
import { usePlayerStore } from "../../stores/playerStore";
import RarityBadge from "./RarityBadge";
import CreaturePreview from "../creatures/CreaturePreview";

export default function SkinInventory() {
  const inventory = useSkinStore((s) => s.inventory);
  const equippedSkinId = useSkinStore((s) => s.equippedSkinId);
  const isEquipping = useSkinStore((s) => s.isEquipping);
  const equipError = useSkinStore((s) => s.equipError);
  const equipSkin = useSkinStore((s) => s.equipSkin);
  const creatureType = usePlayerStore((s) => s.creatureType);

  const [selectedSkinId, setSelectedSkinId] = useState<SkinId | null>(null);

  // Filter to skins matching the player's creature type
  const ownedSkins = useMemo<SkinDefinition[]>(
    () =>
      inventory
        .map((item): SkinDefinition | undefined => SKINS[item.skinId as SkinId])
        .filter((s): s is SkinDefinition => s !== undefined && s.creatureType === creatureType)
        .sort((a, b) => RARITIES[a.rarity].order - RARITIES[b.rarity].order),
    [inventory, creatureType],
  );

  const selectedSkin: SkinDefinition | null = selectedSkinId ? SKINS[selectedSkinId] : null;

  return (
    <div className="flex gap-4">
      {/* Grid of owned skins */}
      <div className="flex-1">
        <h3 className="mb-2 text-sm font-semibold text-gray-300">
          Your Skins ({ownedSkins.length})
        </h3>

        {ownedSkins.length === 0 ? (
          <p className="text-xs text-gray-500">No skins yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {ownedSkins.map((skin) => {
              const isEquipped = equippedSkinId === skin.id;
              const isSelected = selectedSkinId === skin.id;

              return (
                <button
                  key={skin.id}
                  onClick={() => setSelectedSkinId(skin.id as SkinId)}
                  className={`rounded-lg p-2 text-left transition-colors ${
                    isSelected
                      ? "ring-2 ring-purple-400 bg-gray-700/80"
                      : "bg-gray-800/60 hover:bg-gray-700/60"
                  }`}
                  style={isEquipped ? { borderLeft: `3px solid ${RARITIES[skin.rarity].color}` } : undefined}
                >
                  <div className="flex items-center justify-between">
                    <RarityBadge rarity={skin.rarity} />
                    {isEquipped && (
                      <span className="text-[10px] font-bold text-green-400">EQUIPPED</span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs font-medium text-white">{skin.name}</p>
                </button>
              );
            })}
          </div>
        )}

        {equipError && (
          <p className="mt-2 text-xs text-red-400">{equipError}</p>
        )}
      </div>

      {/* Preview + equip controls */}
      {selectedSkin && (
        <div className="flex flex-col items-center gap-2">
          <CreaturePreview creatureType={creatureType} skinId={selectedSkinId!} size="lg" />

          <div className="text-center">
            <p className="text-sm font-semibold text-white">{selectedSkin.name}</p>
            <p className="text-xs text-gray-400">{selectedSkin.description}</p>
            <RarityBadge rarity={selectedSkin.rarity} />
          </div>

          {equippedSkinId === selectedSkin.id ? (
            <button
              onClick={() => equipSkin(null)}
              disabled={isEquipping}
              className="rounded bg-gray-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gray-500 disabled:opacity-50"
            >
              {isEquipping ? "..." : "Unequip"}
            </button>
          ) : (
            <button
              onClick={() => equipSkin(selectedSkin.id as SkinId)}
              disabled={isEquipping}
              className="rounded bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-purple-500 disabled:opacity-50"
            >
              {isEquipping ? "..." : "Equip"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
