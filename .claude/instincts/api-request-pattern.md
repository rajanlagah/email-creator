---
id: desktop-api-request-pattern
trigger: "when making API calls or adding new API integrations"
confidence: 0.95
domain: architecture
source: local-repo-analysis
---

# API Request Pattern

## Action

All HTTP requests go through `src/infra/rest/index.ts`. Never use `fetch` or `axios` directly.

### The five exported methods and their full signatures

```ts
import { get, post, put, patch, deleteReq } from '../../../infra/rest';

// GET  — url, options?, isAuthRequired?, isPublicApi?
const data = await get<{ items: Item[] }>('/v1/items', undefined, true, false);

// POST — url, options (body goes here), isAuthRequired?
const result = await post<Item>(
  '/v1/items',
  { body: JSON.stringify(payload) },
  true
);

// PUT / PATCH / DELETE — same signature as POST
await put<Item>('/v1/items/123', { body: JSON.stringify(updates) }, true);
await patch<Item>('/v1/items/123', { body: JSON.stringify(partial) }, true);
await deleteReq<void>('/v1/items/123', undefined, true);
```

### The `isPublicApi` flag

Pass `true` as the 4th arg to `get()` to route the request through `publicUrl` (the merchant-facing API) instead of the default `baseUrl`. Leave `false` (default) for internal API calls.

### Deduplication

Use `makeRequestDeduped()` directly when the same endpoint may fire concurrently from multiple components — it coalesces in-flight requests by URL so only one network call goes out.

### What the infra layer adds automatically

- Firebase token injected as `Authorization: Bearer <token>` on every authenticated request
- `client=WEB&version=X.X` query params appended to every request
- Sentry error reporting via `reportToSentry()` for unexpected failures
- Streaming support — `Content-Type: text/event-stream` responses handled automatically
- Environment-aware base URL from `src/shared/config/request.ts` — request functions only pass relative paths

### Placing request functions

```ts
// src/modules/<feature>/requests/<entity>.ts
import { get, post } from '../../../../infra/rest';
import type { MyEntity } from '../typings';

export const getMyEntities = async (): Promise<MyEntity[]> => {
  const data = await get<{ items: MyEntity[] }>('/v1/my-entities', undefined, true);
  return data?.items ?? [];
};

export const createMyEntity = async (payload: Partial<MyEntity>): Promise<MyEntity> => {
  const data = await post<MyEntity>(
    '/v1/my-entities',
    { body: JSON.stringify(payload) },
    true
  );
  return data!;
};
```

### Registering a new base URL

All base URLs live in `src/shared/config/request.ts` under the `RequestConfig` type:

```ts
type RequestConfig = {
  baseUrl: string;          // Primary API (doubletick.io / doubletickapi.com)
  baseUrlWL: string;        // White-label API fallback
  aiBotBaseUrl: string;     // AI features
  publicUrl: string;        // Public / merchant API (use isPublicApi=true)
  dtCallbackUrl: string;
  searchUrl: string;        // Elastic search
  socketUrl: string;        // WebSocket endpoint
  qsS3BucketName: string;
  qsS3BucketRegion: string;
  qsS3Domain: string;
  qsCloudFrontDomain: string;
  redirectUrl: string;
  qsApiUrl: string;
  smsServiceUrl: string;
  botBuilderBaseUrl: string;
};
```

**Add values for ALL environments** — missing a key causes silent runtime failures.

## Evidence

- `src/infra/rest/index.ts` — single HTTP abstraction used across all 30+ modules
- Exports: `makeRequest`, `makeRequestDeduped`, `get`, `post`, `put`, `patch`, `deleteReq`
- Every module's `requests/*.ts` imports from `../../../../infra/rest`
- `src/shared/config/request.ts` — most changed file in the repo (9+ changes per 50 commits)
