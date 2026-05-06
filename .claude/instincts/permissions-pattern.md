---
id: desktop-permissions-pattern
trigger: "when adding permission checks, role-based access, or guarding features"
confidence: 0.9
domain: architecture
source: local-repo-analysis
---

# Permissions Pattern

## Overview

Permissions are derived from the logged-in user's role/access data and stored as a derived Jotai atom. They flow down through route registration and shared hooks — never fetched ad-hoc.

---

## The `allUserPermissions` Atom

**File:** `src/shared/states/user.ts`

```ts
import { useAtomValue } from 'jotai';
import { allUserPermissions } from '../../../../shared/states/user';

const permissions = useAtomValue(allUserPermissions);
```

This is a **derived atom** computed from `userProfileAtom?.access?.roles`. It exposes a flat object of boolean flags like:

```ts
// Example shape (check the actual file for the complete list)
{
  canReadConversation: boolean;
  canWriteConversation: boolean;
  canManageCustomFields: boolean;
  canViewAnalytics: boolean;
  canManageTeam: boolean;
  canManageBots: boolean;
  canManageBilling: boolean;
  // ... more flags
}
```

---

## Checking permissions in components

```tsx
import { useAtomValue } from 'jotai';
import { allUserPermissions } from '../../../../shared/states/user';

const MyComponent = () => {
  const permissions = useAtomValue(allUserPermissions);

  if (!permissions.canWriteConversation) {
    return <ReadOnlyView />;
  }

  return <EditableView />;
};
```

---

## Permission-gated routes

Routes in `getRoutesV1` receive `permissions: AllUserPermissions` as the first argument. Conditionally include routes using array spread:

```tsx
// Only register this route if the user has access
...(permissions.canViewAnalytics
  ? [
      <Route
        key={ROUTES.ANALYTICS}
        path={ROUTES.ANALYTICS}
        element={
          <Suspense fallback={<Loader size={32} secondary={LOADING} />}>
            <AnalyticsLazyComponent />
          </Suspense>
        }
      />,
    ]
  : []),
```

---

## Role checks

```ts
import { useAtomValue } from 'jotai';
import { userRoleAtom } from '../../../../shared/states/user';

const role = useAtomValue(userRoleAtom);
// role === 'admin' | 'agent' | 'owner' | ...
```

---

## Shared permission hooks

| Hook | File | Purpose |
|------|------|---------|
| `usePermissions()` | `shared/hooks/use-permissions.ts` | Full permissions object |
| `usePermission(key)` | `shared/hooks/use-permission.ts` | Single permission flag |
| `useWritePermissions()` | `shared/hooks/use-write-permissions.ts` | Write-specific permissions |
| `useWabaLevelPermission()` | `shared/hooks/use-waba-level-permission.ts` | Per-WABA permission checks |
| `useRole()` | `shared/hooks/use-role.ts` | Current user role |

Use these hooks inside components. Use `allUserPermissions` atom directly in route guards (outside of React render).

---

## WABA-level permissions

Some features are scoped per-WhatsApp Business Account. The route registration function provides:

```ts
getWabasWithPermission: (permissionKey: Permissions) => {
  wabas: { wabaId: string; roles: string[] }[];
  loading: boolean;
  error: Error | null;
}
```

Use this to show/hide features per WABA integration, not globally.

## Evidence

- `allUserPermissions` used in `app/routes/auth-routes/v1/index.tsx` to gate 10+ routes
- 4 dedicated permission hooks in `src/shared/hooks/`
- `userRoleAtom` derived from `userProfileAtom?.access?.role`
