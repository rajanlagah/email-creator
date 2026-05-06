---
name: whatsapp-crm-desktop-patterns
description: Coding patterns extracted from whatsapp-crm-desktop repository
version: 1.1.0
source: local-git-analysis
analyzed_commits: 100
updated: 2026-03-24
---

# WhatsApp CRM Desktop Patterns

## Project Overview

React 18 + TypeScript frontend for the WhatsApp CRM platform — a full-featured conversational CRM for businesses. Built with Material-UI, Jotai state management, Socket.io for real-time messaging, and Firebase for auth. Uses Bitbucket for SCM with pull request-based merges.

## Commit Conventions

This project uses **Bitbucket merge commits** as the primary commit style:

- `Merged in <author>/<feature-slug> (pull request #NNN)`
- Branch naming: `<author>/<type>/<feature-slug>` (e.g., `faraz/feat/zoom-integration`, `raj/fix-border`)
- All merges via Bitbucket pull requests

## Code Architecture

```
whatsapp-crm-desktop/
├── src/
│   ├── index.tsx                  # Root entry: React root, Emotion cache, MUI theme, analytics
│   ├── theme.ts                   # MUI theme (primary: #3F906D, text: #2d2d2d, font: Inter)
│   ├── index.css                  # Global styles
│   │
│   ├── modules/                   # Feature modules (business logic by domain)
│   │   ├── app/                   # Root app: routing, auth orchestration, FCM
│   │   │   ├── components/        # App.tsx, sidebar, HOCs
│   │   │   └── routes/auth-routes/v1/index.tsx  # ALL route definitions (lazy-loaded, ~30 routes)
│   │   │
│   │   ├── home/v1/               # HOTSPOT: Conversations/chat interface (25%+ of commits)
│   │   │   ├── components/        # 100+ components: chat-list, chat-input, filters, details-panel
│   │   │   ├── states/            # Chat list, templates, custom fields, team members
│   │   │   ├── requests/          # API calls for conversations
│   │   │   ├── hooks/             # 21 hooks: socket management, filters, permissions
│   │   │   ├── utils/             # Filters, sorting, rendering helpers
│   │   │   └── typings/           # 1007-line typings/index.ts (high-churn)
│   │   │
│   │   ├── crm-mini/              # Settings dashboard (~50 sub-modules, 20%+ of commits)
│   │   │   ├── dashboard/
│   │   │   ├── team-management/v1/ & v2/
│   │   │   ├── bots/v1/
│   │   │   ├── analytics/
│   │   │   ├── billing/v1/
│   │   │   ├── create-template/v1/
│   │   │   ├── custom-fields/v1/
│   │   │   ├── scheduled-broadcasts/v1/
│   │   │   ├── channel-management/v1/
│   │   │   ├── reports/v1/
│   │   │   ├── working-hours/
│   │   │   ├── roles/
│   │   │   ├── sla/v1/
│   │   │   ├── webhook/v1/ & v2/
│   │   │   ├── developer-api-key/v1/
│   │   │   ├── tag-management/v1/
│   │   │   ├── commerce/v2/
│   │   │   └── [20+ more sub-modules]
│   │   │
│   │   ├── customers/             # Contact/customer management
│   │   ├── templates/             # Template list/management
│   │   ├── calls/v1/              # Call log management
│   │   ├── call-manager/          # Active call handling
│   │   ├── channels/              # Channel configuration
│   │   ├── login/v1/              # Authentication & onboarding (10%+ of commits)
│   │   ├── embedded-signup/       # Third-party onboarding
│   │   ├── settings/v1/           # Settings portal
│   │   ├── ai-bot/                # AI chat features
│   │   ├── bot-builder/           # Conversational flow builder
│   │   ├── wa-groups/             # WhatsApp groups
│   │   ├── cx-overview/           # Customer experience overview
│   │   ├── ad-insight/            # Ad insights
│   │   ├── enterprise-analytcis/  # Enterprise analytics (note: typo in folder name)
│   │   └── additional-enterprise-analytics/
│   │
│   ├── shared/                    # Reusable code across modules
│   │   ├── components/
│   │   │   ├── atoms/             # 15 primitives: button, input, toggle, icon-button
│   │   │   ├── molecules/         # 20+ composed: modals, dropdowns, loaders
│   │   │   ├── organisms/         # Complex: header, navigation
│   │   │   └── emotion/           # Emotion-based styled wrappers
│   │   ├── states/                # 16 Jotai atoms: auth, notifications, user, templates, socket-connection
│   │   ├── hooks/                 # 42 custom hooks: useAuth, useSocket, usePermissions, etc.
│   │   ├── requests/              # Shared API request functions
│   │   ├── utils/                 # 80+ utility functions
│   │   ├── constants/             # Routes enum, enums, magic strings
│   │   ├── config/
│   │   │   ├── request.ts         # API base URLs per environment (MOST CHANGED FILE, 8 envs)
│   │   │   ├── app.ts             # Feature flags and app constants
│   │   │   ├── env.ts             # REACT_APP_ENV resolution
│   │   │   └── firebase.ts        # Firebase SDK config
│   │   ├── typings/               # 30+ app-wide TypeScript interfaces
│   │   └── styles/                # Global CSS variables
│   │
│   └── infra/                     # Infrastructure / platform layer
│       ├── rest/index.ts          # HTTP abstraction: get, post, put, patch, deleteReq
│       ├── sockets/
│       │   ├── index.ts           # /conversations + /chats namespaces
│       │   ├── organization-socket.ts  # /organization namespace
│       │   └── user-socket.ts     # /user namespace
│       ├── auth/firebase-auth.ts  # Firebase authentication
│       ├── firebase/init.ts       # Firebase SDK init + FCM messaging
│       ├── s3/                    # AWS S3 upload utilities
│       └── analytics/             # Mixpanel, PostHog, Sentry
│
├── public/                        # Static assets
├── package.json
├── tsconfig.json                  # strict: true, noImplicitAny, strictNullChecks
├── craco.config.js                # babel-plugin-react-compiler (React 18 target)
└── bitbucket-pipelines.yml        # CI/CD
```

## Technology Stack

- **Runtime**: Node 18.x (engines: `>=18.0.0 <19.0.0`), npm 8+
- **Framework**: React 18.2.0, TypeScript 4.8.3
- **Routing**: React Router DOM 6.14.2
- **State**: Jotai 1.13.1 (atom, atomFamily, atomWithReset, useReducerAtom)
- **UI Library**: Material-UI 5.14.4 (MUI Pro for DataGrid/DatePickers)
- **Styling**: Emotion CSS-in-JS (`@emotion/react@11.11.1`, `@emotion/css@11.11.2`)
- **Real-time**: Socket.io-client 4.7.2 (4 namespaces)
- **Auth**: Firebase 9.19.1 (Auth + FCM)
- **Dates**: Day.js 1.11.9
- **Performance**: React Virtuoso 4.12.7 (virtual scroll), React.lazy + Suspense, `memo()`
- **Media**: WaveSurfer.js (audio), React-PDF, Lottie
- **Analytics**: PostHog 1.240+, Sentry 7.62, Mixpanel
- **Build**: Create React App + Craco (React Compiler plugin)
- **Linting**: ESLint + Prettier + Husky pre-commit hooks
- **CI/CD**: Bitbucket Pipelines
- **HTML sanitization**: DOMPurify 3.2+

## Key Patterns

### Adding a New Feature Module

1. Create `src/modules/<feature>/typings/index.ts` — define types first
2. Create `src/modules/<feature>/states/<name>.ts` — Jotai atoms
3. Create `src/modules/<feature>/requests/<entity>.ts` — API functions
4. Build components in `src/modules/<feature>/components/<name>/index.tsx`
5. Add route to `src/modules/app/routes/auth-routes/v1/index.tsx`
6. Add route constant to `src/shared/constants/routes.ts`

### Adding a New Route

```tsx
// 1. Add to src/shared/constants/routes.ts
export enum ROUTES {
  MY_FEATURE = '/v1/my-feature',
}

// 2. In src/modules/app/routes/auth-routes/v1/index.tsx
const MyFeatureLazy = lazy(() => import('../../../../my-feature'));

// 3. Inside getRoutesV1 array:
<Route
  path={ROUTES.MY_FEATURE}
  element={
    <Suspense fallback={<Loader size={32} secondary={LOADING} />}>
      <MyFeatureLazy />
    </Suspense>
  }
/>;
```

### Adding State (Jotai)

```ts
// src/modules/<feature>/states/<name>.ts
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';

export const featureAtom = atom({ isLoading: false, data: null });
export const itemAtomFamily = atomFamily((id: string) => atom<Item>({ id }));

// Derived atom
export const derivedAtom = atom((get) => compute(get(featureAtom)));
```

### Making API Calls

```ts
// src/modules/<feature>/requests/<entity>.ts
import { get, post, put, patch, deleteReq } from '../../../infra/rest';

export const getItems = async () => {
  const data = await get<{ items: Item[] }>('/v1/items', undefined, true);
  return data?.items ?? [];
};
```

### Component Structure

```tsx
/** @jsxImportSource @emotion/react */
import { FC, memo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { css } from '@emotion/react';

interface Props {
  id: string;
}

const MyComponent: FC<Props> = memo(({ id }) => {
  const data = useAtomValue(myAtom);
  return (
    <div
      css={css`
        display: flex;
      `}
    >
      {/* content */}
    </div>
  );
});

export default MyComponent;
```

### Socket Events (actual event names from codebase)

`/conversations` namespace:

- `new-message` — new chat message received
- `is-done` — chat marked as resolved
- `mark-read` — chat marked as read
- `chat-sla-status` — SLA status changed
- `privacy-update` — privacy policy update
- `chat-filters-add-chat` — chat added via filter

`/chats?chatId=` namespace:

- `message-status` — delivery/read receipt
- `group-analytics` — group chat analytics
- `link-analytics` — link click analytics

`/organization` namespace:

- `wa-calls` — WhatsApp call events
- `wa-group` — WhatsApp group events
- `team-member-availability-updates` — agent status

`/user` namespace:

- `status-update` — per-user status change

## Hotspots (Most Frequently Changed)

| Path                    | % of Changes | Notes                                            |
| ----------------------- | ------------ | ------------------------------------------------ |
| `src/modules/home/v1/`  | ~25%         | Conversation UI, filters, custom fields, sockets |
| `src/modules/crm-mini/` | ~20%         | Settings modules, 50 sub-modules                 |
| `src/shared/config/`    | ~15%         | API URLs, feature flags                          |
| `src/modules/login/v1/` | ~10%         | Auth flows, onboarding                           |
| `src/modules/app/`      | ~8%          | Routing, auth orchestration                      |

**Individual hotspots:**

- `src/shared/config/request.ts` — 9+ changes per 50 commits (#1 hotspot file)
- `src/modules/home/v1/typings/index.ts` — 1007 lines, always touched when chat/message shape changes
- `src/modules/home/v1/components/chat-list-section/chat-row/` — UI updates

## Co-Change Patterns

| Change | Files That Must Be Updated |
| --- | --- |
| New feature/module | `typings/index.ts` → `states/` → `requests/` → `components/` → `routes/auth-routes/v1/index.tsx` |
| New API endpoint | `shared/config/request.ts` (all 8 envs) + feature `requests/*.ts` |
| Chat/message type change | `home/v1/typings/index.ts` + all rendering components |
| Socket event change | `infra/sockets/index.ts` + `home/v1/hooks/use-conversation-socket.ts` + `shared/hooks/use-socket.ts` |
| New route | `shared/constants/routes.ts` (ROUTES enum) + `app/routes/auth-routes/v1/index.tsx` |
| Custom fields change | `home/v1/typings/index.ts` + `custom-fields-renderer/` + `details-panel/` + `states/custom-fields.ts` |

## Team & Branching

- Branch format: `<developer>/<type>/<feature-slug>` or `task/<task-name>`
- 2-3 PRs merged per day (high velocity)
- All merges via Bitbucket pull requests
- Bitbucket Pipelines for CI/CD
