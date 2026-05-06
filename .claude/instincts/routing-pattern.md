---
id: desktop-routing-pattern
trigger: "when adding a new route or page"
confidence: 0.95
domain: architecture
source: local-repo-analysis
---

# Route Registration Pattern

## Action

All routes are defined in `src/modules/app/routes/auth-routes/v1/index.tsx`.

The file exports a function `getRoutesV1(permissions, ...)` that returns JSX routes wrapped in `<RenewPlanGaurd>`. All routes inside are automatically authenticated.

---

### Step 1 — Add route constant

```ts
// src/shared/constants/routes.ts
export enum ROUTES {
  MY_FEATURE = '/v1/my-feature',
}
```

---

### Step 2 — Register the lazy component

At the top of `auth-routes/v1/index.tsx`, alongside the other lazy imports:

```tsx
const MyFeatureLazyComponent = lazy(() => import('../../../../my-feature'));
```

---

### Step 3 — Add the route

Inside `getRoutesV1`, add to the routes array:

```tsx
<Route
  key={ROUTES.MY_FEATURE}
  path={ROUTES.MY_FEATURE}
  element={
    <Suspense fallback={<Loader size={32} secondary={LOADING} />}>
      <MyFeatureLazyComponent />
    </Suspense>
  }
/>
```

---

### Step 4 — Permission-gated routes

`getRoutesV1` receives `permissions: AllUserPermissions` as its first argument (from `allUserPermissions` atom in `shared/states/user.ts`). Use it to conditionally include routes:

```tsx
// Permission-based conditional inclusion — only add the route if the user has access
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

The full `getRoutesV1` signature:

```ts
export default function getRoutesV1(
  permissions: AllUserPermissions,
  isEnterpriseAnalyticsRouteAccessible: {
    enterpriseAnalytics: boolean;
    additionalEnterpriseAnalytics: boolean;
    isEnterpriseAnalyticsLoading: boolean;
  },
  isAiBotAvailable: boolean,
  isWaVoiceAvailable: boolean,
  getWabasWithPermission: (permissionKey: Permissions) => {
    wabas: { wabaId: string; roles: string[] }[];
    loading: boolean;
    error: Error | null;
  }
)
```

---

### Existing routes (do not duplicate)

```
/conversations/*         HomePageLazyComponent
/calls/*                 CallsPageLazyComponent
/v1/templates            TemplatesLazyComponent
/v1/templates/new        CreateTemplateLazyComponent
/v1/templates/edit       CreateTemplateLazyComponent
/v1/templates/duplicate  CreateTemplateLazyComponent
/v1/bots                 BotsLazyComponent
/v1/bots/logs/:botId     BotsLazyComponent
/v1/bot-builder/:botId   BotBuilderLazyComponent
/v1/team-management      TeamManagementV1LazyComponent
/v2/team-management      TeamManagementLazyComponent
/v1/customers            CustomersLazyComponent
/v1/analytics            AnalyticsLazyComponent
/v1/enterprise-analytics EnterpriseAnalyticsLazyComponent
/v1/reports              ReportsLazyComponent
/v1/settings/*           SettingsLazyComponent
/v1/scheduled-broadcasts ScheduledBroadcastsLazyComponent
/v1/channels             ChannelManagementLazyComponent
/dashboard               DashboardLazyComponent
/cx-overview             CxOverviewLazyComponent
/ad-insight              AdInsightsLazyComponent
```

## Evidence

- `src/modules/app/routes/auth-routes/v1/index.tsx` — 370 lines, ~30 lazy-loaded routes
- All routes use `React.lazy()` + `<Suspense fallback={<Loader />}>`
- Routes wrapped in `<RenewPlanGaurd>` which handles subscription enforcement
