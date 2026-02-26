# Architecture

## System Lifecycle

```
AppBootstrap.Awake()
  -> Register GameConfig with ServiceLocator
  -> DontDestroyOnLoad(this)

AppBootstrap.Start()
  -> Initialize NetworkManager
  -> Load Lobby scene via SceneLoader

Lobby scene:
  -> LobbyUI requests room list from RoomManager
  -> User creates/joins room
  -> RoomManager loads Room scene

Room scene:
  -> NetworkManager spawns player avatar (AvatarController + PlayerSync)
  -> ChatManager joins room channel
  -> HUD activates (ChatUI + EmoteWheelUI)
```

## Namespaces

| Namespace | Responsibility |
|-----------|---------------|
| `SocialApp.Core` | App init, config, scene management, service locator |
| `SocialApp.Avatar` | Avatar rendering, movement, customization, animation |
| `SocialApp.Chat` | Message routing, channels, chat UI |
| `SocialApp.Networking` | Connection lifecycle, rooms, player sync, messages |
| `SocialApp.UI` | Screens (main menu, lobby, HUD, emote wheel) |
| `SocialApp.Data` | Data models, ScriptableObject definitions |

## State Machines

### Connection State
```
Disconnected -> Connecting -> Connected -> InRoom
     ^              |             |          |
     +----- error --+             +-- leave -+
     +------------ disconnect ---------------+
```

### Avatar State
```
Idle <-> Walking
  |        |
  v        v
Emoting (returns to Idle when clip ends)
```

## Data Flow: Chat Message

```
User types message
  -> ChatUI.OnSendClicked()
  -> ChatManager.SendMessage(text, channelId)
  -> NetworkManager sends ChatNetMessage RPC
  -> All clients: ChatManager.ReceiveMessage()
  -> ChatUI.DisplayMessage()
```

## Data Flow: Avatar Sync

```
Local player moves
  -> AvatarController.Update() reads input
  -> Transform updates locally
  -> PlayerSync sends position at fixed rate (10Hz)
  -> Remote clients: PlayerSync interpolates position
  -> AvatarAnimator.SetMoving() mirrors movement
```

## Networking Decision

The project includes Netcode for GameObjects via UPM. The asset library also contains:
- **PUN 2** — easiest setup, built-in room/lobby/chat, but Photon cloud dependency
- **DarkRift Networking 2** — server-authoritative, self-hosted, more control
- **Smooth Sync** — network transform smoothing (works with either)

Current plan: start with Netcode for GameObjects (first-party), evaluate PUN 2 if we need faster iteration on rooms/chat.

## Thread Safety

All game logic runs on Unity's main thread. Network callbacks from Netcode are automatically marshalled to the main thread. No explicit thread synchronization needed unless adding background tasks (e.g., asset loading, HTTP calls).

## Dependency Map

| File | Role | Depends On | Used By |
|------|------|------------|---------|
| AppBootstrap | App init | GameConfig, ServiceLocator | Main scene |
| GameConfig | Config SO | nothing | All systems |
| ServiceLocator | DI | nothing | All systems |
| SceneLoader | Scene loading | nothing | AppBootstrap, RoomManager |
| AvatarController | Per-player avatar | AvatarData, AvatarAnimator, GameConfig | NetworkManager |
| AvatarCustomization | Visual setup | AvatarData, AvatarPartDefinition | AvatarController |
| AvatarAnimator | Animation wrapper | EmoteDefinition | AvatarController |
| AvatarData | Avatar definition | nothing | AvatarController, PlayerProfile |
| ChatManager | Message routing | ChatMessage, ChatChannel, GameConfig | ChatUI, NetworkManager |
| ChatUI | Chat display | ChatManager, ChatMessage | HUD |
| NetworkManager | Connection | GameConfig | AppBootstrap, RoomManager |
| RoomManager | Room lifecycle | NetworkManager, RoomData, SceneLoader | LobbyUI |
| PlayerSync | Network sync | AvatarController, AvatarData | NetworkManager |
| MainMenuUI | Login screen | GameConfig, NetworkManager | Main scene |
| LobbyUI | Room browser | RoomManager, RoomData | Lobby scene |
| HUD | In-room overlay | ChatUI, EmoteWheelUI | Room scene |
| EmoteWheelUI | Emote picker | EmoteDefinition | HUD |

## Gotchas & Pitfalls

- Unity scene files (`.unity`) are serialized YAML. Don't try to hand-edit them — open in Unity Editor.
- `FindFirstObjectByType<T>()` is the Unity 6 replacement for `FindObjectOfType<T>()`.
- Netcode for GameObjects requires a `NetworkObject` component on any networked prefab.
- TextMeshPro requires `using TMPro;` — not `using UnityEngine.UI;` for text fields.
