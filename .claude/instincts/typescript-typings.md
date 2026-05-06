---
id: desktop-typescript-typings
trigger: "when defining types, interfaces, or adding TypeScript to a feature"
confidence: 0.85
domain: typescript
source: local-repo-analysis
---

# TypeScript Typings Pattern

## Action

**Always define types before writing logic.** Types are in `typings/index.ts` within each module.

### Feature-level types:
```ts
// src/modules/<feature>/typings/index.ts
export interface MyEntity {
  id: string;
  name: string;
  createdAt: string;
}

export interface MyFeatureFilters {
  search: string;
  status: 'active' | 'inactive';
}
```

### Shared/cross-module types:
- `src/shared/typings/` — app-wide types (User, Organization, Permission, etc.)
- `src/modules/home/v1/typings/message-types.ts` — message type definitions (high-churn)
- `src/modules/home/v1/typings/index.ts` — chat/conversation types (high-churn)

### API response typing:
```ts
// Always type the API response
const data = await get<{ conversations: Conversation[] }>('/v1/conversations', opts, true);
```

### Enums for constants:
```ts
// Use TypeScript enums or const objects for categorical values
export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}
```

### Rules:
- No `any` — use `unknown` and type-narrow if needed
- No inline type literals in component props — always extract to `interface Props`
- Types shared across 2+ files → move to `shared/typings/` or module `typings/index.ts`

## Evidence

- `typings/index.ts` is always the first file changed in new features
- `src/modules/home/v1/typings/` is among the highest-churn files in the repo
- TypeScript 4.8.3 strict mode enabled (`tsconfig.json`)
