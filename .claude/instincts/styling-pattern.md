---
id: desktop-styling-pattern
trigger: "when writing styles or adding CSS to a component"
confidence: 0.85
domain: styling
source: local-repo-analysis
---

# Emotion CSS-in-JS Styling Pattern

## Action

Use Emotion `css` prop for all component styling. Do not use plain CSS files, CSS modules, or inline `style={{}}` objects for new code.

### Standard pattern:
```tsx
/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useTheme } from '@mui/material';

const MyComponent = () => {
  const theme = useTheme();

  return (
    <div css={css`
      display: flex;
      gap: ${theme.spacing(2)};
      color: ${theme.palette.primary.main};
    `}>
      Content
    </div>
  );
};
```

### Reusable style objects:
```tsx
const containerStyles = css`
  display: flex;
  flex-direction: column;
  padding: 16px;
`;
```

### Theme values:
- Primary green: `#3F906D`
- Text dark: `#2d2d2d`
- Text muted: `#8484A8`
- Font: Inter
- Use `theme.spacing()`, `theme.palette.*` for MUI-aligned values

### MUI component overrides:
Use `sx` prop for Material-UI components, not CSS overrides.

## Evidence

- Emotion is the standard across all modules: home, crm-mini, shared components
- `src/theme.ts` centralizes all theme tokens — always reference theme values, not magic strings
- Global CSS only in `src/index.css` and `src/shared/styles/`
