// Cozy Creatures - Room Environment Router
//
// Selects and renders the correct procedural environment based on the
// current room's theme.
//
// Depends on: scene/environments/CozyCafe, RooftopGarden, StarlightLounge
// Used by:    scene/IsometricScene.tsx

import CozyCafe from "./CozyCafe";
import RooftopGarden from "./RooftopGarden";
import StarlightLounge from "./StarlightLounge";

interface RoomEnvironmentProps {
  theme: string;
}

export default function RoomEnvironment({ theme }: RoomEnvironmentProps) {
  switch (theme) {
    case "rooftop-garden":
      return <RooftopGarden />;
    case "starlight-lounge":
      return <StarlightLounge />;
    case "cozy-cafe":
    default:
      return <CozyCafe />;
  }
}
