---
id: desktop-feature-module-pattern
trigger: "when adding a new feature or module"
confidence: 0.95
domain: architecture
source: local-repo-analysis
---

# Feature Module Structure Pattern

## Action

Every new feature lives under `src/modules/<feature>/` (or within an existing module's subdirectory). Follow this standard folder layout:

```
src/modules/<feature>/
├── components/       # React components for this feature
│   └── <component-name>/
│       └── index.tsx
├── states/           # Jotai atoms for feature state
│   └── <feature-name>.ts
├── requests/         # API request functions
│   └── <entity>.ts
├── hooks/            # Custom hooks (use-*)
│   └── use-<hook-name>.ts
├── typings/          # TypeScript interfaces & types
│   └── index.ts
├── utils/            # Helper/utility functions
│   └── index.ts
└── index.tsx         # Feature entry point
```

Checklist for a new feature:
1. Define TypeScript types in `typings/index.ts` first
2. Create Jotai atoms in `states/<name>.ts`
3. Write API request functions in `requests/`
4. Build components in `components/`
5. Add route to `src/modules/app/routes/auth-routes/v1/index.tsx`
6. Lazy-load component with Suspense and add permission check if needed

## Evidence

- All 30+ modules under `src/modules/` follow this layout
- Active examples: `home/v1/`, `crm-mini/`, `customers/`, `calls/v1/`, `integrations/zoho/`, etc.
- `typings/index.ts` is always the first file changed in new features
