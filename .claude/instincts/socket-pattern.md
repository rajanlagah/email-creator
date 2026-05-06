---
id: desktop-socket-pattern
trigger: "when adding real-time features or socket event handling"
confidence: 0.95
domain: architecture
source: local-repo-analysis
---

# Socket Architecture Pattern

## Overview

There are **4 socket namespaces**, each with a dedicated factory function in `src/infra/sockets/`:

| Namespace | Factory | File | Purpose |
|-----------|---------|------|---------|
| `/conversations` | `getNewMessageSocket()` | `index.ts` | New messages, chat list updates, reminders |
| `/chats?chatId={id}` | `getMessageStatusesSocket(chatId)` | `index.ts` | Per-chat message status, group analytics, link analytics |
| `/organization` | `getOrganizationsSocket()` | `organization-socket.ts` | WA calls, WA group events, agent availability |
| `/user` | `getUserSocket()` | `user-socket.ts` | Per-user status updates (agent online/offline) |

All sockets share `socketOptions` from `index.ts`:
- Firebase token injected via `auth` callback on every connection
- `reconnectionAttempts: 3`, delays `2s → 6s`, timeout `30s`
- Transport: WebSocket only (`transports: ['websocket']`)
- `forceNew: true`, `closeOnBeforeunload: true`

---

## The `useSocket` Hook (the right way to consume sockets)

**All socket hooks must use `useSocket` from `src/shared/hooks/use-socket.ts`.** Never call `socket.on/off` directly in components.

```ts
import useSocket, { UseSocketOptions } from '../../../../shared/hooks/use-socket';
import { getOrganizationsSocket } from '../../../../infra/sockets/organization-socket';

const { socket, addListener, removeListener } = useSocket(
  getOrganizationsSocket,      // factory fn — returns the singleton socket
  onReconnect,                 // optional: (lastUpdatedTimestamp: number) => void
  checkSocketDisconnect,       // optional boolean: enables active ping/pong health check
  onConnectionStatusChange,    // optional: (status: boolean) => void
  fallbackSync,                // optional: FallbackSyncController
  {                            // optional: UseSocketOptions
    doNotDisconnectOnUnmount: true,
    reconnectOnFocus: false,
    reconnectOnVisibility: false,
    maxIdleHoursBeforeForcedReconnect: 6,
  }
);
```

`UseSocketOptions` interface:
```ts
interface UseSocketOptions {
  doNotDisconnectOnUnmount?: boolean;
  reconnectOnFocus?: boolean;
  reconnectOnVisibility?: boolean;
  maxIdleHoursBeforeForcedReconnect?: number;
}
```

`useSocket` handles:
- Auto-connect on mount, disconnect on unmount (unless `doNotDisconnectOnUnmount: true`)
- Reconnect on `window focus`, `visibilitychange`, `online` events
- Force page reload if socket has been idle > `maxIdleHoursBeforeForcedReconnect` hours (default 6)
- Active ping/pong health check every 5s with exponential retry (`2s → 4s → 8s → 12s`) before marking connection lost
- `window.socketStatus[socketName]` updated on connect/disconnect for global health tracking

---

## Socket Connection State (Jotai)

Connection status for all named sockets is tracked via a reducer atom in `src/shared/states/socket-connection.ts`:

```ts
import { useReducerAtom } from 'jotai/utils';
import { socketConnectionAtom, socketConnectionReducer } from '../../../../shared/states/socket-connection';
import { SocketConnectionReducerActionTypes, SocketName } from '../../../../shared/typings/socket-connection';

const [_, dispatch] = useReducerAtom(socketConnectionAtom, socketConnectionReducer);

dispatch({
  type: SocketConnectionReducerActionTypes.CONNECTION,
  data: { name: SocketName.ORGANIZATION, status: true },
});
```

`SocketName` enum: `CONVERSATION`, `ORGANIZATION`, `USER`

---

## Existing Socket Hooks (use these, don't reinvent)

| Hook | File | Socket used | Events handled |
|------|------|-------------|----------------|
| `useConversationSocket` | `home/v1/hooks/use-conversation-socket.ts` | `/conversations` | `new-message`, `is-done`, `mark-read`, `chat-sla-status`, `privacy-update`, `chat-filters-add-chat` |
| `useStatusSocket({ id })` | `home/v1/hooks/use-status-socket.ts` | `/chats?chatId={id}` | `message-status`, `group-analytics`, `link-analytics` |
| `useOrganizationSocket` | `home/v1/hooks/use-organization-socket.ts` | `/organization` | `wa-calls`, `wa-group` |
| `useUserSocket` | `home/v1/hooks/use-user-socket.ts` | `/user` | `status-update` |
| `useAgentStatusSocket` | `home/v1/hooks/use-agent-status-socket.ts` | `/organization` | `team-member-availability-updates` |
| `useChannelAccessSocket` | `home/v1/hooks/` | `/organization` | WA group access changes |
| `useCartSocket` | `home/v1/hooks/` | `/organization` | Commerce cart updates |
| `useImportExcelSocket` | `home/v1/hooks/` | `/conversations` | Bulk import progress |

---

## How to Add a New Socket Event Listener

1. Identify which namespace the event belongs to (see table above)
2. Use or extend the appropriate existing hook — don't create a new socket connection
3. Pattern:

```ts
export const useMyFeatureSocket = () => {
  const { socket: orgSocket } = useSocket(getOrganizationsSocket);

  const onMyEvent = useCallback((payload: MyPayload) => {
    // handle payload — update Jotai atoms, dispatch actions, etc.
  }, []);

  useEffect(() => {
    orgSocket.on('my-event-name', onMyEvent);
    return () => {
      orgSocket.off('my-event-name', onMyEvent);
    };
  }, [onMyEvent, orgSocket]);
};
```

4. Always clean up listeners in the `useEffect` return — missing cleanup causes duplicate handlers after remount.

---

## DOM Custom Events (cross-component signalling)

Socket lifecycle is broadcast as DOM events so distant components can react without prop drilling:

| Event | Dispatched when |
|-------|----------------|
| `conversation-socket-connect` | `/conversations` connects |
| `conversation-socket-disconnect` | `/conversations` disconnects |
| `message-status-socket-connect` | `/chats` socket connects (detail: `{ connectionCounter, timestamp }`) |
| `message-status-socket-disconnect` | `/chats` socket disconnects (detail: `{ connectionCounter, timestamp }`) |
| `organizations-socket-connect` | `/organization` connects |
| `user-socket-connect` | `/user` connects |

`useStatusSocket` listens to `message-status-socket-connect` via `document.addEventListener` to re-register event handlers after reconnect — not via `socket.on('connect')`.

---

## Key Rules

- **Sockets are singletons** — factory functions return existing socket if already created. Never call `io()` directly in a hook or component.
- **Auth is automatic** — `socketOptions.auth` injects Firebase token on every connection. Never pass tokens manually.
- **Status socket is per-chat** — `getMessageStatusesSocket(chatId)` creates one socket per `chatId`. Connect when chat opens, disconnect when chat closes.
- **User socket is per-user** — `getUserSocket()` disconnects old socket if `userId` changes (handles org switching).
- **Health check** — `socket.emit('ping')` → `socket.on('pong')` every 5s when `checkSocketDisconnect: true`.
