// Cozy Creatures - Creature Picker
//
// 3x2 grid of creature cards for the join screen. Each card shows the
// creature name, description, and an accent-colored border when selected.
//
// Depends on: @cozy/shared (CREATURES, CreatureTypeId), config (CREATURE_COLORS)
// Used by:    App.tsx

import { CREATURES } from "@cozy/shared";
import type { CreatureTypeId } from "@cozy/shared";
import { CREATURE_COLORS } from "../../config";

interface CreaturePickerProps {
  selected: CreatureTypeId;
  onSelect: (id: CreatureTypeId) => void;
  disabled?: boolean;
}

export default function CreaturePicker({ selected, onSelect, disabled }: CreaturePickerProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {(Object.keys(CREATURES) as CreatureTypeId[]).map((id) => {
        const creature = CREATURES[id];
        const isSelected = id === selected;
        const colors = CREATURE_COLORS[id];

        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            disabled={disabled}
            className={`flex flex-col items-center gap-1 rounded-lg border-2 px-2 py-3 text-center transition-all disabled:opacity-50 ${
              isSelected
                ? "border-current bg-gray-700/80 shadow-lg"
                : "border-gray-600 bg-gray-700/40 hover:bg-gray-700/60"
            }`}
            style={isSelected ? { borderColor: colors.accent, color: colors.accent } : undefined}
          >
            <span className={`text-sm font-semibold ${isSelected ? "" : "text-gray-200"}`}>
              {creature.name}
            </span>
            <span className="text-xs text-gray-400 leading-tight">{creature.description}</span>
          </button>
        );
      })}
    </div>
  );
}
