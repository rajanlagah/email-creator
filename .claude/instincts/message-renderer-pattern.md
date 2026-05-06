---
id: desktop-message-renderer-pattern
trigger: "when adding a new chat message type / renderer"
confidence: 0.95
domain: architecture
source: local-repo-analysis
---

# Message Renderer Pattern

Every chat message rendered in the conversation pane is dispatched through a single registry: `rendererMap` in `src/modules/home/v1/utils/renderer.ts`. To add a new message type (e.g., a new system event, a new media kind, a new interactive bubble), follow this flow exactly — skipping a step usually shows up as `UnHandledRenderer` falling through silently.

---

## Existing flow (read first)

1. **Enum source of truth** — `src/modules/home/v1/typings/message-types.ts` exports `MessageTypesEnum` (`TEXT`, `IMAGE`, `VIDEO`, `AUDIO`, `DOCUMENT`, `CONTACTS`, `TEMPLATE`, `STICKER`, `INTERACTIVE`, `BUTTON`, `FLOW_RESPONSE`, `COMMERCE_PRIVACY_IMAGE`, `COMMERCE_PRIVACY_BUTTON`, `LOCATION`, `REACTION`, `SYSTEM`, `SYSTEM_LOG`, `NOTE`, `CALL`, `REMINDER`, `REMINDER_TRIGGER`, `UNSUPPORTED`).
2. **Per-type message interface** — same file. Each type has a discriminated-union member keyed by `messageType: MessageTypesEnum.<KIND>` (e.g. `TextMessage`, `ImageMessage`, `CallMessage`). The union is consumed as `MessageTypes` and the wrapping envelope is `Message`.
3. **Renderer components** — each type has a renderer at `src/modules/home/v1/components/message-types/<name>-renderer.tsx` (single file) or `<name>-renderer/index.tsx` (folder for renderers with subfiles, e.g. `flow-response-renderer/`, `reminder-renderer/`, `system-log-message-renderer/`).
4. **Registry** — `src/modules/home/v1/utils/renderer.ts` maps each enum value → renderer component via `rendererMap`. `getRenderComponent(messageType)` returns the component (or `UnHandledRenderer` as fallback) cast to a shared `FC<...>` prop signature.
5. **Dispatch site** — `src/modules/home/v1/components/message-types/index.tsx` calls `getRenderComponent(message?.messageType as MessageTypesEnum)` (~L248) and renders `<Component .../>` with the shared prop set.

The shared prop signature passed by the dispatcher (`getRenderComponent`'s cast) — your renderer should accept whichever subset it actually uses:

```ts
{
  fullMessage: Message;
  message: MessageTypes;
  mode?: 'template' | 'normal';
  mediaViewerHandler?: (cardIndex?: number) => void;
  group?: boolean;
  waGroup: boolean;
  renderReactionEmoji?: () => React.ReactNode;
  maxWidth?: string;
  marginBottom?: string;
  marginRight?: string;
  timeComponent?: EmotionJSX.Element;
  statsComponent?: EmotionJSX.Element;
  messageOriginType?: MessageOrigin;
  hideContainerShadow?: boolean;
  stats?: ChatStats;
  onHandleMenuItemClick?: (pageDetail: string, buttonText: string, linkId: string, cardIndex?: number) => void;
  showChatReactionButton?: boolean;
  showReadMore?: boolean;
  messageId?: string;
}
```

---

## Steps to add a new message render component

Use this checklist whenever you introduce a new `messageType`:

1. **Add the enum value**
   In `src/modules/home/v1/typings/message-types.ts`, add `<KIND> = '<wire-string>'` to `MessageTypesEnum`. Keep the wire string aligned with whatever the backend / socket payload sends — that string is what arrives on `message.messageType` at runtime.

2. **Define the message interface and add it to the union**
   In the same file, add an interface like:

   ```ts
   export interface FooMessage {
     messageType: MessageTypesEnum.FOO;
     // payload fields specific to this message
   }
   ```

   Append `FooMessage` to the `MessageTypes` discriminated union so consumers can narrow on `messageType`.

3. **Create the renderer component**
   Path: `src/modules/home/v1/components/message-types/foo-renderer.tsx` (single file) or `src/modules/home/v1/components/message-types/foo-renderer/index.tsx` (use a folder if the renderer ships with subcomponents/utils).

   Follow `.claude/instincts/component-structure.md`: functional component, `memo()`, explicit `Props` interface, Emotion `css` or MUI `sx` (no inline `style={{}}`). Mirror an existing renderer of similar shape — e.g. `text-renderer.tsx` for plain bubbles, `image-renderer.tsx` for media, `system-log-message-renderer/` for system events, `call-renderer.tsx` for status-style cards. Keep it under ~600 lines; split into subcomponents if it grows.

   Type the `message` prop to the new interface (`message: FooMessage`), and accept whichever subset of the shared prop signature you actually use.

4. **Register in `rendererMap`**
   In `src/modules/home/v1/utils/renderer.ts`:
   - Add the import: `import FooRenderer from '../components/message-types/foo-renderer';`
   - Add the entry: `[MessageTypesEnum.FOO]: FooRenderer,`

   If your new type is a near-clone of an existing one (e.g. `BUTTON` → `TextRenderer`, `STICKER` → `ImageRenderer`, `REMINDER_TRIGGER` → `ReminderRenderer`), you can reuse an existing renderer rather than creating a new file.

5. **Co-change check** (see `.claude/instincts/co-change-home-module.md`)
   Verify any of the following that apply:
   - **Chat list preview** — if the new type should show a preview line in the chat list, update the preview formatter alongside `home/v1/typings/index.ts`.
   - **Outgoing/composer side** — if users can *send* this type, the composer / send pipeline needs the new shape too (it's not just a renderer).
   - **Reply / forward / quoted-message** — `reply-renderer.tsx` and forward flows often switch on `messageType`; check whether they need a new branch.
   - **Search / message-info / media gallery** — same enum is used elsewhere; grep for `MessageTypesEnum.` to find sibling sites that may need a case.
   - **Socket payloads** — confirm the wire string in `infra/sockets/` matches the new enum value.

6. **Verify**
   - Render path hits your component (not `UnHandledRenderer`) — the fallback in `getRenderComponent` is the silent failure mode to watch for.
   - TypeScript narrows correctly on `message.messageType === MessageTypesEnum.FOO`.

---

## Key files

- `src/modules/home/v1/typings/message-types.ts` — `MessageTypesEnum`, `MessageTypes` union, per-type interfaces
- `src/modules/home/v1/utils/renderer.ts` — `rendererMap`, `getRenderComponent`
- `src/modules/home/v1/components/message-types/` — renderer components
- `src/modules/home/v1/components/message-types/index.tsx` — dispatch site (`getRenderComponent` call ~L248)
- `src/modules/home/v1/components/message-types/unhandled.tsx` — silent fallback; if you see this in the UI for a known type, registration is missing

## Evidence

- All 22 enum members in `MessageTypesEnum` are accounted for in `rendererMap` — every new type *must* be registered or it falls through to `UnHandledRenderer`.
- Existing reuse examples: `STICKER → ImageRenderer`, `BUTTON → TextRenderer`, `NOTE → TextRenderer`, `REMINDER_TRIGGER → ReminderRenderer`, `REACTION/UNSUPPORTED → UnHandledRenderer`.
- Folder-style renderers (with subcomponents) live under their own dir: `flow-response-renderer/`, `reminder-renderer/`, `system-log-message-renderer/`, `system-log-v2-message-renderer/`, `start-of-conversation-message-renderer/`.
