---
id: desktop-co-change-home-module
trigger: "when modifying the home module (conversations/chat interface)"
confidence: 0.95
domain: architecture
source: local-repo-analysis
---

# Home Module Co-Change Checklist

## Action

The home module (`src/modules/home/v1/`) is the #1 hotspot — 25%+ of all commits touch it. These sub-areas frequently change together:

---

### When changing chat list / conversation list

1. `src/modules/home/v1/typings/index.ts` — update `ChatListAtom`, `ChatStatuses`, or related types
2. `src/modules/home/v1/components/chat-list-section/chat-row/index.tsx` — row rendering
3. `src/modules/home/v1/components/chat-list-section/chat-row/components/` — `MessageStatus.tsx`, `MessagePreviewContent.tsx`, `ReactionPreview.tsx`
4. `src/modules/home/v1/states/` — filter/selection state atoms
5. `src/modules/home/v1/components/filters/index.tsx` — filter UI
6. `src/modules/home/v1/utils/` — sorting/filtering helpers

---

### When changing message types or chat shape

1. `src/modules/home/v1/typings/index.ts` — `ChatStatuses`, `SendMessageType`, `AttachmentTypes`, etc.
2. All components that render messages: `chat-bubble/`, `message-types/`, `chat-row/components/MessagePreviewContent.tsx`
3. `src/modules/home/v1/hooks/use-conversation-socket.ts` — if socket payload shape changes

---

### When changing custom fields

1. `src/modules/home/v1/typings/index.ts` — `CustomFieldsTypes`, `CustomChatMetaFields`
2. `src/modules/home/v1/components/custom-fields-renderer/` — rendering components
3. `src/modules/home/v1/states/custom-fields.ts` — field state atom
4. `src/modules/home/v1/components/details-panel/index.tsx` — panel display
5. `src/modules/home/v1/components/customer-details/` — customer detail panel

---

### When changing real-time / socket events

1. `src/infra/sockets/index.ts` — socket infrastructure
2. `src/shared/hooks/use-socket.ts` — shared socket hook
3. The relevant hook in `src/modules/home/v1/hooks/`:
   - `use-conversation-socket.ts` — `new-message`, `is-done`, `mark-read`, `chat-sla-status`, `privacy-update`, `chat-filters-add-chat`
   - `use-status-socket.ts` — `message-status`, `group-analytics`, `link-analytics`
   - `use-organization-socket.ts` — `wa-calls`, `wa-group`
   - `use-agent-status-socket.ts` — `team-member-availability-updates`
4. `src/shared/states/socket-connection.ts` — connection status atom

---

### When changing agent assignment / team members

1. `src/modules/home/v1/typings/index.ts` — `TeamMember`, `AgentStatus`, `TeamMemberBasicInfo`
2. `src/modules/home/v1/components/assign-modal/` — `index.tsx`, `assign-user-selector.tsx`, `assign-user-selector-item.tsx`
3. `src/modules/home/v1/components/header/components/agent-assignment-popover.tsx`
4. `src/modules/home/v1/hooks/use-agent-status-socket.ts`

---

### When changing conversation tags

1. `src/modules/home/v1/typings/index.ts` — `ConversationTag`
2. `src/modules/home/v1/components/conversation-tags/` — `add-tag/`, `create-tag/`
3. `src/modules/home/v1/components/chat-list-section/chat-row/` — tag display in list

---

### When changing AI features

1. `src/modules/home/v1/typings/index.ts` — `AIFeaturePermissionResponse`, `AiBotType`
2. `src/modules/home/v1/components/ai-call-summary/` — call summary panel
3. `src/modules/home/v1/components/ai-chat-summary/` — chat summary
4. `src/modules/home/v1/hooks/use-conversation-socket.ts` — `ai-call-summary` socket event

## Evidence

- Home module: 19+ changes in 50 recent commits (highest hotspot)
- 21 custom hooks in `home/v1/hooks/`
- 100+ component files in `home/v1/components/`
- `typings/index.ts` (1007 lines) — always touched when domain types change
