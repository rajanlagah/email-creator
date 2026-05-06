---
id: desktop-state-management
trigger: "when adding global state, shared state, or feature state"
confidence: 0.95
domain: architecture
source: local-repo-analysis
---

# Jotai State Management Pattern

## Action

Use Jotai for all state management. Never use Redux or Context API for new code.

**Global shared state** → `src/shared/states/<name>.ts`
**Feature-scoped state** → `src/modules/<feature>/states/<name>.ts`

---

### Basic atom

```ts
import { atom } from 'jotai';

export const myFeatureAtom = atom({
  isLoading: false,
  data: null as MyEntity | null,
  error: null as Error | null,
});
```

---

### Atom family (keyed / collection state)

```ts
import { atomFamily } from 'jotai/utils';

// Create one atom per entity ID
export const chatAtomFamily = atomFamily((id: string) =>
  atom<Chat>({ id, messages: [], status: 'open' })
);

// Track all keys separately so you can iterate
export const chatIdsAtom = atom<string[]>([]);
```

---

### Derived (computed) atom — read-only

```ts
export const unreadCountAtom = atom((get) => {
  const ids = get(chatIdsAtom);
  return ids.filter(id => get(chatAtomFamily(id)).unread).length;
});
```

---

### Write-only setter atom

```ts
// Encapsulate a complex write without exposing read
export const markAllReadAtom = atom(
  null,
  (get, set) => {
    const ids = get(chatIdsAtom);
    ids.forEach(id => set(chatAtomFamily(id), prev => ({ ...prev, unread: false })));
  }
);
```

---

### Resettable atom — `atomWithReset`

Used in `src/shared/states/socket-connection.ts` for socket status tracking:

```ts
import { atomWithReset } from 'jotai/utils';

export const socketConnectionAtom = atomWithReset<SocketConnectionAtom>({});
```

---

### Reducer atom — `useReducerAtom`

Used for structured state transitions (e.g. socket connection status):

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

`SocketName` enum values: `CONVERSATION`, `ORGANIZATION`, `USER`

---

### Request atom (for async API data)

```ts
import { createRequestAtom } from '../../shared/states/request-atom';

export const myDataAtom = createRequestAtom<MyData>();
```

---

### Usage in components

```tsx
const [state, setState] = useAtom(myAtom);       // read + write
const value = useAtomValue(myAtom);               // read-only (preferred — better perf)
const setVal = useSetAtom(myAtom);                // write-only
```

---

### Key real atom names (don't reinvent)

| Atom | File | Purpose |
|------|------|---------|
| `authAtom` | `shared/states/login.ts` | Auth ready/checking/org-selected state |
| `organizationAtom` | `shared/states/login.ts` | Current organization list |
| `selectedOrganizationAtom` | `shared/states/login.ts` | Active org |
| `userProfileAtom` | `shared/states/user.ts` | Logged-in user details |
| `allUserPermissions` | `shared/states/user.ts` | Derived permissions from user role |
| `userTokenAtom` | `shared/states/user.ts` | Firebase token |
| `socketConnectionAtom` | `shared/states/socket-connection.ts` | Socket health per namespace |

## Evidence

- All feature state uses Jotai: auth (`shared/states/login.ts`), notifications, user, chat-list, etc.
- `atomFamily` used for collections: conversations, notifications
- `atomWithReset` + `useReducerAtom` used in `socket-connection.ts`
- `useAtomValue` preferred for read-only access (better perf — no re-render on set)
