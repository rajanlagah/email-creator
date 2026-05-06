DT QA Testing - Claude Guide

Reusable mechanics for QA-testing any feature on the DoubleTick app (desktop + mini).
Not feature-specific. Read this at the start of every QA session — it prevents the
same friction points from recurring across tasks.

---

## 0. One-Time Setup Check

```bash
# Detect the browse binary (do this every session)
BROWSE=$(~/.claude/skills/browse/bin/find-browse 2>/dev/null)
# Fallback if find-browse is missing:
BROWSE=$(find ~/.claude/skills -name "browse" -type f -perm +111 2>/dev/null | grep "dist/browse" | head -1)

echo "BROWSE=$BROWSE"   # must be non-empty before continuing
export BROWSE

# Set environment URLs for the session (adjust per deployment)
# DT_HOST = desktop app, DT_MINI = settings iframe app (they share the same number)
export DT_HOST="web-6.doubletick.dev"        # e.g. web-3, web-4, app.doubletick.io
export DT_MINI="crm-mini-6.dev.quicksell.co" # crm-mini-N mirrors web-N numbering
```

---

## 1. Pre-flight — Run Before Every Session

```bash
# Kill stale processes from a previous session
pkill -f "Google Chrome for Testing" 2>/dev/null
pkill -f "browse-server" 2>/dev/null
sleep 2

# Clear Chrome profile lock files (left behind after crashes)
rm -f ~/.gstack/chromium-profile/SingletonLock \
       ~/.gstack/chromium-profile/SingletonSocket \
       ~/.gstack/chromium-profile/SingletonCookie 2>/dev/null

# Launch headed Chrome — this opens a VISIBLE Chromium window on the user's screen
# The user will interact with this window to log in
$BROWSE connect
sleep 4
$BROWSE status
# Expected: Status: healthy | Mode: headed | URL: about:blank
```

---

## 2. Login

**Rule: NEVER ask for phone number, OTP, or cookies. NEVER try to import or inject cookies. Always use the headed Chromium window — the user logs in themselves.**

Exact steps every session, no exceptions:

1. Run pre-flight (section 1) → `$BROWSE connect` opens a **visible Chromium window** on the user's screen.

2. Navigate to the app so the user sees the login page immediately:
   ```bash
   $BROWSE goto "https://$DT_HOST/" && sleep 2
   ```

3. Tell the user exactly this — nothing else:
   > "Chrome is open. Please log in in the Chromium window that appeared on your screen, then come back here and say 'done'."

4. **Wait.** Do not proceed, do not ask for credentials, do not try to automate the login.

5. After the user says "done", verify:
   ```bash
   $BROWSE goto "https://$DT_HOST/conversations" && sleep 4
   $BROWSE screenshot /tmp/login-check.png
   # Must show Inbox with chat list — NOT the login/OTP page
   ```

6. If screenshot shows the login page → the session didn't persist. Tell the user:
   > "Looks like the login didn't go through. Please log in again in the Chrome window."
   Then repeat from step 2.

**After a browse-server crash mid-session:** reconnect and check — do NOT ask the user to re-login unless the app actually redirects to `/login`:
```bash
pkill -f "browse-server" 2>/dev/null; sleep 1
$BROWSE connect && sleep 3
$BROWSE goto "https://$DT_HOST/conversations" && sleep 4
# Take a screenshot — only ask user to re-login if it shows the login page
```

---

## 3. Navigation

```bash
# ALWAYS use goto — navigate command does not reliably change the URL
$BROWSE goto "https://$DT_HOST/conversations"
# Returns: Navigated to ... (200)

# NOT this:
# $BROWSE navigate "..."   ← unreliable, avoid
```

---

## 4. App Architecture — Multiple Cross-Origin Iframes

The desktop app embeds **four distinct cross-origin iframe hosts** depending on the page. None can be opened directly — all require an auth `postMessage` handshake from the parent (`ASK_TOKEN` → parent sends Firebase token).

```
┌──────────────────────────────────────────────────────────────────┐
│  Desktop app  (web-N.doubletick.dev)                             │
│  ┌────────────┐  ┌──────────────────────────────────────────┐   │
│  │ Left nav   │  │ Main content area                        │   │
│  │ - Inbox    │  │ ┌──────────────────────────────────────┐ │   │
│  │ - Channels │→ │ │ crm-mini-N.dev.quicksell.co          │ │   │
│  │ - Team Mgmt│  │ │ (Settings, Channels, Team, Bots list)│ │   │
│  │ - Settings │  │ └──────────────────────────────────────┘ │   │
│  │ - Bots     │  │                                          │   │
│  │   ↓ modal  │→ │ quickflow-N.dev.quicksell.co (bot edit) │   │
│  │ - AI Bots  │→ │ flow-ai.dev.quicksell.co (AI agent)     │   │
│  │ - Ad Insights│ ad-insights.doubletick.dev                │   │
│  └────────────┘  └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 4a. Iframe Host Map

All hosts come from `src/shared/config/app.ts`. For `stagingWithProd` (web-6):

| Config key | Staging value | Prod value | Used for |
|------------|--------------|------------|----------|
| `iframeHost` | `crm-mini-6.dev.quicksell.co` | `mini.doubletick.io` | Settings, Channels, Team Mgmt, Bots list |
| `botBuilderHost` | `quickflow-6.dev.quicksell.co` | `flow.doubletick.io` | Bot builder modal (`/bots/{id}`) |
| `aiBotBuilderHost` | `flow-ai.dev.quicksell.co` | `ai-bot.doubletick.io` | AI agent builder (`/ai-bot/{id}`) |
| `adInsightsHost` | `ad-insights.doubletick.dev` | `ad-insight.doubletick.io` | Ad Insights |

### 4b. Route → Iframe Host Table

| Desktop route | Iframe host | iframe `id` constants (MINI_IFRAME_NAMES) | Notes |
|---------------|-------------|-------------------------------------------|-------|
| `/v1/settings/*` | `iframeHost` | `SETTINGS_PROFILE`, `SETTINGS_CUSTOM_FIELDS`, `SETTINGS_ROLES`, `SETTINGS_WABA`, `SETTINGS_TAGS`, `SETTINGS_QUICK_REPLIES`, etc. | Sidebar in parent frame changes iframe URL |
| `/channels` | `iframeHost` | `channels`, `member-channels`, `manage-channel`, `channel-members` | Multiple iframes may render |
| `/team-management` | `iframeHost` | `team-management`, `team-management-v2` | Full-page mini app |
| `/bots` (list) | `iframeHost` | `BOTS_LIST` | Mini app renders bot list |
| `/bots/{id}` (modal) | `botBuilderHost` | `BOTS_WITH_ID` | **Different host** — quickflow-N, bot builder repo |
| `/ai-bot/{id}` | `aiBotBuilderHost` | — | flow-ai / ai-bot host |
| Ad Insights | `adInsightsHost` | — | ad-insights host |

### 4c. Auth Handshake (same for all iframes)

Child iframe posts `{type: 'ASK_TOKEN'}` → parent's `SettingsIframe` component detects it and calls `sendToken()`, which sends the current Firebase ID token. Token auto-refreshed every 65 minutes. All iframe URLs get `?source=desktop&parent-origin=<encoded-parent-origin>` appended automatically.

---

## 5. Frame Context — Most Critical Concept

The mini app is cross-origin. You must switch Playwright's frame context to interact with it.

```bash
# Enter mini app iframe
$BROWSE frame "iframe"
# Output: Switched to frame: https://crm-mini-N.dev.quicksell.co/...

# Return to desktop app
$BROWSE frame "main"
# Output: Switched to main frame
```

### Detect which frame you are in

Read the first two lines of `$BROWSE snapshot`:
```
# PARENT frame — no [Context] line:
--- BEGIN UNTRUSTED EXTERNAL CONTENT (source: https://web-N.doubletick.dev/...) ---
@e1 [img] "DoubleTick"

# MINI APP iframe — has [Context: iframe ...] line:
--- BEGIN UNTRUSTED EXTERNAL CONTENT (source: https://web-N.doubletick.dev/...) ---
[Context: iframe src="https://crm-mini-N.dev.quicksell.co/..."]
@e1 [paragraph]: Your profile
```

### Frame rules

| Rule | Why it matters |
|------|----------------|
| Every navigation (URL change) resets the active frame | After any click that navigates, re-run `$BROWSE frame "iframe"` if you need the mini app |
| `@eN` refs are frame-scoped | A ref captured in the iframe breaks when you switch to main |
| Always start with `$BROWSE frame "main"` | Ensures known state at session start or after compaction |
| Never direct-open `crm-mini-N.dev...` | Cross-origin auth fails — use desktop settings path |
| `frame "parent"` does NOT work | The correct reset command is `frame "main"` |

---

## 6. Settings Navigation (iframeHost — Mini App)

Settings pages use `iframeHost` (crm-mini-N). The sidebar (Custom Fields, Roles, etc.) lives in the **parent frame**. Clicking it changes the **iframe URL**. Direct URL navigation to settings sub-routes does not work — the SPA redirects everything back to `/v1/settings/profile`.

### Reliable pattern for any settings page

```bash
# 1. Reset to parent frame
$BROWSE frame "main" 2>/dev/null; sleep 1

# 2. Go to settings entry point
$BROWSE goto "https://$DT_HOST/v1/settings/profile" && sleep 3

# 3. JS click the sidebar item — use text match, NOT @eN ref
#    (sidebar items are <div> with React onClick, not <button> or <a>)
$BROWSE js "
  const item = Array.from(document.querySelectorAll('button, div'))
    .find(b => b.textContent.trim().startsWith('SIDEBAR_ITEM_TEXT'));
  if (item) { item.click(); 'clicked: ' + item.tagName; }
  else 'not found';
" && sleep 4

# 4. Verify iframe updated
$BROWSE js "Array.from(document.querySelectorAll('iframe')).map(f => f.src).join('\n')"
# Should show: crm-mini-N.dev.quicksell.co/v1/ROUTE?source=desktop&...

# 5. Enter mini app
$BROWSE frame "iframe" && sleep 1
```

### Common sidebar items

| Text to match (use in JS find) | Resulting iframe path |
|--------------------------------|-----------------------|
| `Custom Contact Fields` | `/v1/custom-fields` |
| `Your profile` | `/v1/profile` |
| `Roles` | `/v1/roles` |
| `Manage WABAs` | `/v1/waba` |
| `Manage tags` | `/v1/tags` |
| `Quick Replies` | `/v1/quick-replies` |
| `Channels` | `/v1/channels` |
| `Team Members` | `/v1/team-members` |
| `Billing & Plans` | `/v1/billing` |

---

## 6b. Channels Navigation (iframeHost — Mini App)

`/channels` embeds one or more `iframeHost` iframes. Navigate directly — no sidebar-click trick needed:

```bash
$BROWSE frame "main" 2>/dev/null; sleep 1
$BROWSE goto "https://$DT_HOST/channels" && sleep 4

# Verify iframes loaded
$BROWSE js "Array.from(document.querySelectorAll('iframe')).map(f => f.src).join('\n')"
# Should show: crm-mini-N.dev.quicksell.co/v1/channels?source=desktop&...

# Enter the primary iframe
$BROWSE frame "iframe" && sleep 1
```

Multiple iframes may render (`channels`, `member-channels`, `manage-channel`, `channel-members`).
If `$BROWSE frame "iframe"` enters the wrong one, check the URL in the snapshot header and use:
```bash
$BROWSE js "Array.from(document.querySelectorAll('iframe')).map((f,i) => i+': '+f.src).join('\n')"
# Then target by index if needed:
$BROWSE js "document.querySelectorAll('iframe')[1].contentDocument.title"
```

---

## 6c. Team Management Navigation (iframeHost — Mini App)

```bash
$BROWSE frame "main" 2>/dev/null; sleep 1
$BROWSE goto "https://$DT_HOST/team-management" && sleep 4

# Check for iframe
$BROWSE js "Array.from(document.querySelectorAll('iframe')).map(f => f.src).join('\n')"
# Shows: crm-mini-N.dev.quicksell.co/v1/team-management?source=desktop&...

$BROWSE frame "iframe" && sleep 1
```

---

## 6d. Bots Navigation — Two Different Hosts

**Bots list** (`/bots`) uses `iframeHost` (crm-mini-N):
```bash
$BROWSE frame "main" 2>/dev/null; sleep 1
$BROWSE goto "https://$DT_HOST/bots" && sleep 4
$BROWSE js "Array.from(document.querySelectorAll('iframe')).map(f => f.src).join('\n')"
# crm-mini-N.dev.quicksell.co/...
$BROWSE frame "iframe" && sleep 1
```

**Bot builder modal** (`/bots/{id}`) uses `botBuilderHost` (quickflow-N.dev.quicksell.co) — this is a **completely different repo** (`quickflow-bot-builder`):
```bash
# The modal opens on top of the bots list — stay in main frame, then re-enter iframe
$BROWSE frame "main" && sleep 0.5
$BROWSE goto "https://$DT_HOST/bots/BOT_ID" && sleep 4

# The modal's iframe src will be quickflow-N.dev.quicksell.co
$BROWSE js "Array.from(document.querySelectorAll('iframe')).map(f => f.src).join('\n')"
# quickflow-N.dev.quicksell.co/...

$BROWSE frame "iframe" && sleep 1
# Snapshot header: [Context: iframe src="https://quickflow-N.dev.quicksell.co/..."]
```

**AI Bot Builder** (`/ai-bot/{id}`) uses `aiBotBuilderHost` (flow-ai.dev.quicksell.co):
```bash
$BROWSE frame "main" && sleep 0.5
$BROWSE goto "https://$DT_HOST/ai-bot/BOT_ID" && sleep 4
$BROWSE frame "iframe" && sleep 1
# Snapshot header: [Context: iframe src="https://flow-ai.dev.quicksell.co/..."]
```

---

## 7. Conversations Page

### Open a chat

```bash
$BROWSE goto "https://$DT_HOST/conversations" && sleep 3

# Find chats — they appear as big buttons in the list
$BROWSE snapshot | grep '\[button\]' | grep '\.' | head -10

# Click by ref
$BROWSE click @eN && sleep 2

# Or directly if you know the IDs
$BROWSE goto "https://$DT_HOST/conversations/{wabaPhoneNumber}/{customerPhoneNumber}" && sleep 3
```

### Customer details panel (right side) — scrolling

The right panel is a long scrollable div. Two important points:

1. **`$BROWSE snapshot` returns the full DOM regardless of scroll position.** Use snapshot to read field values/states first — no scrolling needed to find data.

2. **Screenshots only show what's in the viewport.** Use `scrollIntoView` before taking a screenshot:

```bash
# Scroll a specific element into view by its text label
$BROWSE js "
  Array.from(document.querySelectorAll('p, span')).forEach(el => {
    if (el.textContent.trim() === 'FIELD_OR_SECTION_NAME') {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  });
" && sleep 1
$BROWSE screenshot /tmp/qa-screenshots/NAME.png
```

**Why `el.scrollTop = N` alone doesn't work for screenshots:** The scrollable container scrolls but the Playwright screenshot captures before the paint cycle completes. `scrollIntoView` + `sleep 1` is the reliable pattern.

**Find the scrollable container** (useful for debugging):
```bash
$BROWSE js "
  const found = [];
  document.querySelectorAll('*').forEach(el => {
    const s = window.getComputedStyle(el);
    if ((s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > 2000) {
      const r = el.getBoundingClientRect();
      if (r.left > 400) found.push({ cls: el.className.slice(0,50), h: el.scrollHeight });
    }
  });
  JSON.stringify(found);
"
```

---

## 8. Interacting with Mini App Forms

### Create/edit form — general pattern

```bash
# Always confirm you're in the iframe before form interactions
$BROWSE frame "iframe" && sleep 0.5

# Discover current refs before acting (refs change every navigation)
$BROWSE snapshot | grep "textbox\|radio\|button" | head -15

# Click, type, select in sequence
$BROWSE click @eN && sleep 0.3     # input field
$BROWSE type "VALUE" && sleep 0.3

# After a form submit that navigates, re-enter iframe
$BROWSE frame "iframe" && sleep 0.5
```

### Custom dropdown (not native `<select>`)

Many mini app dropdowns render as styled `<div>` lists, not `<select>`. Use JS:

```bash
# 1. Click the dropdown trigger button to open it
$BROWSE click @eN && sleep 1

# 2. Select an option by its visible text
$BROWSE js "
  const opts = Array.from(document.querySelectorAll('li, option, [role=option]'));
  const target = opts.find(o => o.textContent.trim() === 'OPTION_TEXT');
  if (target) { target.click(); 'clicked'; } else 'not found';
" && sleep 1
```

### Tooltips

```bash
$BROWSE js "
  const el = document.querySelector('SELECTOR');
  if (el) {
    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  }
" && sleep 1
$BROWSE screenshot /tmp/tooltip.png
```

### Verify a field is readOnly (not disabled)

A readOnly input accepts focus but ignores keystrokes:
```bash
$BROWSE click @eN && sleep 0.5
$BROWSE type "SHOULD_NOT_STICK"
$BROWSE snapshot | grep "@eN"
# Value unchanged → readOnly confirmed
```

A disabled input shows `[disabled]` in the accessibility tree:
```
@eN [textbox] "..." [disabled]
```

---

## 9. Screenshotting Best Practices

```bash
# Create output dir once per session
mkdir -p /tmp/qa-screenshots

# Always name screenshots by TC number and what they show
$BROWSE screenshot /tmp/qa-screenshots/tc3-field-readonly.png
```

---

## 10. Common Gotchas — Quick Reference

| Symptom | Root cause | Fix |
|---------|-----------|-----|
| `navigate` doesn't change the URL | Wrong command | Use `goto` |
| `frame "parent"` does nothing | Wrong command | Use `frame "main"` |
| Clicking settings sidebar has no effect | `<div>` not `<button>` — Playwright misses it | `$BROWSE js "el.click()"` with text match |
| Screenshot shows wrong scroll position | Viewport renders before paint | `scrollIntoView` + `sleep 1` before screenshot |
| `@eN` ref suddenly not found | Stale ref after navigation or frame switch | Re-run `$BROWSE snapshot` to get fresh refs |
| Mini app shows blank loading screen | Opened cross-origin URL directly | Always go via `$DT_HOST/channels`, `/team-management`, `/bots`, or `/v1/settings/...` |
| Frame context wrong after compaction | Session resumed mid-iframe | `$BROWSE frame "main"` to reset |
| New data doesn't appear after save | Page serving cached state | `$BROWSE js "window.location.reload(true)"` + wait 4s |
| Blank white screenshot with gold border | Browse server lost connection to Chrome | Run full pre-flight (section 1) |
| Toast / validation error not visible | Action triggered before render | Add `sleep 2` after the triggering action |
| Form save fails silently | Required field empty | `$BROWSE snapshot` to find validation errors |

---

## 11. QA Session Template

```
1. Read the PR diff — understand what changed and why
2. List all edge cases before opening the browser
3. Run pre-flight (section 1) → $BROWSE connect → headed Chromium window opens on screen
4. $BROWSE goto "https://$DT_HOST/" → tell user to log in in the Chrome window → wait for "done"
5. Verify login: goto /conversations, screenshot must show Inbox (not login page)
6. mkdir -p /tmp/qa-screenshots
7. Execute TCs: Mini app (Settings) first, Desktop (Conversations) second
8. For each TC:
   a. State expected behaviour before acting
   b. Act
   c. Verify via snapshot + screenshot
   d. Mark PASS / FAIL with evidence
9. Write final report with health score and issues list
```

### TC result format

```
TC{N} — {Description}: PASS ✅
  Evidence: {snapshot ref, value observed, or screenshot name}

TC{N} — {Description}: FAIL ❌
  Expected: {what should happen}
  Actual:   {what happened}
  Screenshot: /tmp/qa-screenshots/tcN-fail.png
```

---

## 12. URL Reference

```bash
# Conversations inbox
https://$DT_HOST/conversations

# Specific chat
https://$DT_HOST/conversations/{wabaPhoneNumber}/{customerPhoneNumber}

# Settings entry point (navigate here first, then JS-click sidebar)
https://$DT_HOST/v1/settings/profile

# Channels (iframeHost / crm-mini-N)
https://$DT_HOST/channels

# Team Management (iframeHost / crm-mini-N)
https://$DT_HOST/team-management

# Bots list (iframeHost / crm-mini-N)
https://$DT_HOST/bots

# Bot builder modal (botBuilderHost / quickflow-N) — use bot ID from list
https://$DT_HOST/bots/{botId}

# AI bot builder (aiBotBuilderHost / flow-ai)
https://$DT_HOST/ai-bot/{botId}

# Mini app / crm-mini URL shape — for reference only, never open directly
https://$DT_MINI/v1/{route}?source=desktop&parent-origin=https%3A%2F%2F{DT_HOST}

# Bot builder URL shape — for reference only, never open directly
# quickflow-N.dev.quicksell.co/{path}?source=desktop&parent-origin=...
```

---

## 13. Feature-Specific QA Addendums

When a PR introduces a specific feature, append a dated section here.
Keep each addendum to the edge cases specific to that feature — the mechanics above apply universally.

### [2026-04-03] TEXT Type AI Custom Fields (`avdhesh/feature/text-ai-cf`)

**What changed:** Extended AI custom field support from `[LIST, MULTI_SELECT]` to `[LIST, MULTI_SELECT, TEXT]`. New component `CustomFieldMetaRow`. New helper `isCustomFieldTypeAiSupported()`. TEXT+AI fields are `readOnly` (not `disabled`).

**Extra checks:**
- TEXT type shows AI option in create form (new)
- DATE, NUMBER do NOT show AI option
- TEXT+AI field in conversations panel: spark icon + timestamp + readOnly textbox + disabled save button
- `hideListItems` hides list-items section for TEXT type (no list values apply to text)
- Non-AI TEXT field is still fully editable (no spark, typing works)
- Timestamp fields (`last_message_received_at` etc.) are `disabled`, not `readOnly`
- Scan target (`Customer's messages` vs `Customer and Team member's messages`) persists on save/reload
- Channel vs Customer entity: "values differ per channel" info shown/hidden correctly

**Key files:**
- `src/modules/home/v1/components/customer-details/edit-row.tsx` — `isTimestampField`, `isNonEditable`, `readOnly` prop
- `src/modules/home/v1/components/custom-fields-renderer/custom-field-meta-row.tsx` — spark + timestamp UI
- `src/modules/custom-fields/v1/typings/index.ts` (mini) — `CUSTOM_FIELD_TYPES_WITH_AI_SUPPORT`, `isCustomFieldTypeAiSupported()`
- `src/modules/custom-fields/v1/components/edit-field/create-new-custom-field.tsx` (mini) — form gating logic
