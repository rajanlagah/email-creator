---
id: desktop-component-structure
trigger: "when creating a new React component"
confidence: 0.95
domain: architecture
source: local-repo-analysis
---

# Component Structure Pattern

## Action

All components are functional components with hooks. Two accepted patterns — pick based on context:

### Pattern A — typed with `FC<Props>` (preferred for most components)

```tsx
/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { FC, memo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { myAtom } from '../../states/my-feature';

interface Props {
  id: string;
  onAction: (id: string) => void;
}

const MyComponent: FC<Props> = memo(({ id, onAction }) => {
  const data = useAtomValue(myAtom);
  const setData = useSetAtom(myAtom);

  return (
    <div css={css`display: flex;`}>
      {/* content */}
    </div>
  );
});

export default MyComponent;
```

### Pattern B — inline typed (used in chat-row and other hotspot components)

```tsx
const ChatRow = memo(({ id, showWaba, forwardMsgView }: ChatRowProps) => {
  // same body
});
export default ChatRow;
```

Both are valid — be consistent with the file's existing style.

---

### Key rules

- **File location:** `components/<component-name>/index.tsx` — always use a folder, not a bare file
- **Exports:** Always `export default` the component, named exports for types only
- **Memoization:** Wrap with `memo()` — the React Compiler (babel-plugin-react-compiler in craco.config.js) also auto-memoizes, but `memo()` is still explicit contract
- **Props interface:** Always define explicit `interface Props` or `interface <Name>Props` — no inline types in the function signature
- **Hooks order:** Jotai hooks (`useAtomValue`, `useSetAtom`, `useAtom`) → React hooks (`useState`, `useEffect`, `useCallback`, `useMemo`) → custom hooks
- **No `any`** — TypeScript strict mode is on (`noImplicitAny: true`, `strictNullChecks: true`)

---

### Shared components (atomic design)

- **Atoms** (`src/shared/components/atoms/`): buttons, inputs, toggles — for simple primitive UI (15 components)
- **Molecules** (`src/shared/components/molecules/`): modals, dropdowns, loaders — composed atoms (20+ components)
- **Organisms** (`src/shared/components/organisms/`): header, navigation — complex structures
- Check shared components before building new ones

---

### React Compiler note

`craco.config.js` enables `babel-plugin-react-compiler` targeting React 18. This auto-optimizes renders, but `memo()` is still required as an explicit signal to other developers.

## Evidence

- `memo()` used on all leaf components across home, crm-mini, shared modules
- `FC<Props>` and inline typed patterns both exist in the codebase — both acceptable
- Atomic design strictly followed in `src/shared/components/`
- React Compiler active via `craco.config.js`
