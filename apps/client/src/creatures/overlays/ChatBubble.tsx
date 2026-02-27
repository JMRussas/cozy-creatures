// Cozy Creatures - Chat Bubble
//
// Floating HTML overlay above a creature showing their latest chat message.
// Uses drei's Html component for 3D-positioned DOM elements.
//
// Depends on: @react-three/drei (Html), stores/chatStore
// Used by:    creatures/Creature.tsx, creatures/RemoteCreature.tsx

import { Html } from "@react-three/drei";
import { useChatStore } from "../../stores/chatStore";

interface ChatBubbleProps {
  playerId: string;
}

export default function ChatBubble({ playerId }: ChatBubbleProps) {
  // Select the primitive content string (not the object ref) to avoid
  // re-renders when other bubbles change or the same content re-sets.
  const content = useChatStore((s) => s.bubbles[playerId]?.content);

  if (!content) return null;

  return (
    <Html
      position={[0, 1.6, 0]}
      center
      style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
    >
      <div className="max-w-48 rounded-lg bg-white/90 px-2 py-1 text-center text-xs text-gray-800 shadow-md">
        {content}
      </div>
    </Html>
  );
}
