DT PR Review - Review the current diff (staged changes, or the diff against master if on a feature branch) as a senior engineer on this project. Be direct and opinionated.

## Step 1 — Gather the diff

Run `git diff master...HEAD` (or `git diff --staged` if nothing is committed yet). If neither has content, ask the user what to review.

## Step 2 — Check each of the following

### Architecture & Patterns

- New feature modules follow `typings/ → states/ → requests/ → components/` order
- Components are functional, wrapped in `memo()`, with explicit `interface Props {}` or `interface <Name>Props {}`
- Jotai atoms used for state — no React Context or useState for shared state
- API calls go through `src/infra/rest` (`get`/`post`/`put`/`patch`/`deleteReq`) — no raw `fetch`/`axios`
- Sockets use `useSocket` hook from `src/shared/hooks/use-socket.ts` — no direct `socket.on/off` in components
- No `io()` called outside of `src/infra/sockets/`
- Socket event listeners cleaned up in `useEffect` return (no memory leaks)

### TypeScript

- No `any` types introduced (TypeScript strict + noImplicitAny is on)
- No unchecked type assertions (`as SomeType`) unless commented with reason
- New types defined in the module's `typings/index.ts`, not inline in component files
- Strict null checks respected — no `!` non-null assertions without justification
- **Magic string literals in comparisons** — for every `=== 'some_value'` or `!== 'some_value'` in the diff, grep the codebase for an existing `enum` or union type that already contains that value. If one exists, the comparison must use the enum member, not the raw string. Also check whether the field being compared is typed too broadly (e.g., `string` instead of the enum type) — if so, flag the type definition as needing tightening too. Mark both as **[BLOCKING]**.

### Styling

- Emotion `css` prop used for styles — no inline `style={{}}` objects
- Colors/spacing use theme tokens (`theme.palette.*`, `theme.spacing()`) — no magic hex values
- MUI components use `sx` prop for overrides, not CSS class hacks

### Config & Env

- No hardcoded URLs or domain names — all go in `src/shared/config/request.ts`
- If new config key added: present in all 8 environments (see CLAUDE.md)
- No secrets, tokens, or credentials committed
- No URL changes inside the `production` block of `request.ts` — changes in staging env blocks or the `else` (dev default) block are acceptable

### Co-change Completeness

Follow the co-change map in CLAUDE.md. For each change type present in the diff:

- New API endpoint → `src/shared/config/request.ts` + `RequestConfig` type updated for all envs
- Chat/message type change → `home/v1/typings/index.ts` + all rendering components updated
- Socket event change → `infra/sockets/` + relevant `use-*-socket.ts` hook + `socket-connection.ts` updated
- New route → `shared/constants/routes.ts` + `app/routes/auth-routes/v1/index.tsx` updated
- Custom fields change → follow co-change map in CLAUDE.md
- Permission-gated feature → `allUserPermissions` atom checked + route conditional in `getRoutesV1` added

### Logic & Correctness

- **[BLOCKING]** `useEffect(async () => ...)` — async functions must be defined inside the effect and called, not passed directly
- **[BLOCKING]** `useEffect` with a subscription, `setTimeout`, or event listener that has no cleanup (`return () => ...`) — memory leak
- **[BLOCKING]** For every `useEffect` in the diff: verify all referenced outer-scope variables (state, props, atoms, callbacks) appear in the dep array, or have an explicit comment explaining why they're omitted
- **[BLOCKING]** `setTimeout`/`setInterval` inside `useEffect` that closes over state/props without a `useRef` — stale closure risk
- **[BLOCKING]** Network call inside `useEffect` with no cleanup/cancellation — if the component unmounts before the call resolves, it will attempt a state update on an unmounted component
- **[BLOCKING]** `.find()`, `.filter()[0]`, or `array[index]` result used directly without a null/undefined guard
- **[BLOCKING]** Optional chaining used to read a value (`foo?.bar`) that is then passed to a function typed as non-optional — the `undefined` case is silently swallowed
- **[BLOCKING]** Unhandled promise — async call in an event handler with no `.catch()` or `try/catch`
- **[BLOCKING]** `key={index}` on any list that can be filtered, sorted, paginated, or reordered — use a stable unique id (`item.id`, `item._id`, etc.) instead; index keys cause React to reuse wrong DOM nodes and corrupt component state
- **[SUGGESTION]** `useEffect` with no external side effect (no network call, no DOM mutation, no subscription) — should be `useMemo` or derived inline
- **[SUGGESTION]** `useMemo` wrapping a trivial expression (single field access, boolean flag, string concat) — overhead exceeds benefit, just inline it
- **[SUGGESTION]** Permission check done by manually reading an atom or comparing a string — `usePermissions()` (`src/shared/hooks/use-permissions.ts`) or `use-permission.ts` already exist; use them
- **[SUGGESTION]** Role/profile check done inline (e.g. `userProfile?.role === 'admin'`) — check `src/shared/hooks/use-role.ts` first
- **[SUGGESTION]** Logic that duplicates an existing hook in `src/shared/hooks/` — before flagging, grep the hook directory for similar functionality (debounce, pagination, socket, permissions, waba selection, etc.)
- **[SUGGESTION]** Atom created for data that is already available from an existing atom in `src/shared/states/` or the module's `states/` — duplicate state

### Performance

- New list rendering uses `react-virtuoso` for large/unbounded lists
- New route is lazy-loaded with `React.lazy` + `<Suspense fallback={<Loader />}>`
- No expensive computations in render body — wrapped with `useMemo`/`useCallback`
- **[SUGGESTION]** Import specificity — flag imports from library roots where named/subpath imports are available (e.g. `import _ from 'lodash'` → `import debounce from 'lodash/debounce'`; `import * as dateFns from 'date-fns'` → named import). CRA's tree-shaking does not cover all cases.

### General Quality

- No `console.log` left in production code
- Error states handled (loading, error, empty — especially for async data)
- New async operations have loading state managed in Jotai atom
- **[SUGGESTION]** Component complexity — flag any component in the diff with 5+ `useEffect` calls, 10+ atom reads/writes, or 200+ lines as needing decomposition. Suggest extracting a custom hook for the logic or splitting into focused child components.

## Step 3 — Output format

For each issue found:

- **[BLOCKING]** — must fix before merge
- **[SUGGESTION]** — worth fixing but not a blocker; one line, no elaboration
- **[NITPICK]** — style/preference, fine to ignore; one line only

End with a one-line verdict: `LGTM`, `LGTM with suggestions`, or `Needs changes`.
