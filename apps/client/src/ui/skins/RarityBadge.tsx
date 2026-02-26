// Cozy Creatures - Rarity Badge
//
// Small pill-shaped badge displaying skin rarity with matching color.
// Legendary rarity gets a subtle shimmer animation.
//
// Depends on: @cozy/shared (RARITIES, SkinRarity)
// Used by:    ui/SkinShop.tsx, ui/SkinInventory.tsx

import { RARITIES } from "@cozy/shared";
import type { SkinRarity } from "@cozy/shared";

interface RarityBadgeProps {
  rarity: SkinRarity;
}

export default function RarityBadge({ rarity }: RarityBadgeProps) {
  const info = RARITIES[rarity];

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${
        rarity === "legendary" ? "animate-pulse motion-reduce:animate-none" : ""
      }`}
      style={{ backgroundColor: info.color }}
    >
      {info.label}
    </span>
  );
}
