# ADR-001: Kooru Notes App — Architecture

**Status:** Accepted
**Date:** 2026-03-30
**Last updated:** 2026-03-30
**Authors:** shri

---

## Context

Building a personal notes-taking PWA that needs:
- Offline-capable (PWA)
- Markdown authoring with live preview
- File attachments per note
- Tag-based organization
- Simple authentication (single user, self-hosted)
- Three-panel dashboard UI (sidebar / note list / note editor)

---

## Decisions

### 1. Frontend: Nuxt 4 + Nuxt UI 4 + Tailwind CSS v4

**Chosen:** Nuxt 4 with the `app/` directory layout, Nuxt UI 4.x, Tailwind v4.

**Why:**
- Nuxt 4's `app/` layout cleanly separates app code from config/server
- Nuxt UI provides form, modal, badge, popover, and toast components used throughout
- Tailwind v4 is CSS-first — configured via `@theme` blocks in CSS, no `tailwind.config.js`
- All pages have `ssr: false` in `nuxt.config.ts` routeRules — fully client-rendered to avoid hydration mismatches with PocketBase's localStorage auth store

**Alternatives considered:**
- Vite + Vue 3 SPA: more control but loses Nuxt conventions, auto-imports, and module ecosystem
- Quasar: strong PWA support but less design flexibility

---

### 2. Backend: PocketBase

**Chosen:** PocketBase (single binary, self-hosted).

**Why:**
- Single Go binary — zero infrastructure overhead for a personal tool
- Built-in file storage, real-time subscriptions, and password auth
- REST + SDK for Vue/Nuxt (`pocketbase` npm package)
- Admin UI for managing collections without writing migrations

**Collections:**

```
notes
  id          string   (auto)
  title       string
  content     text     (raw markdown)
  is_sticky   bool     (default: false)
  is_favorite bool     (default: false)
  tags        relation → tags     (multiple)
  attachments relation → files    (multiple)
  created     datetime (auto)
  updated     datetime (auto)

tags
  id    string (auto)
  name  string (unique)

files
  id     string (auto)
  name   string
  media  file   (single upload)
```

**Auth:** PocketBase built-in Users collection with email+password. Single-user personal app — no multi-tenancy needed.

---

### 3. Layout: Three-Column Dashboard (responsive)

**Desktop (`lg+`):**
```
┌─────────────┬──────────────────┬──────────────────────────────────┐
│  Sidebar    │   Notes List     │   Note Editor                    │
│  w-56       │   w-72           │   flex-1                         │
│  h-14 hdr   │   h-14 hdr       │   h-14 toolbar                   │
│             │                  │                                  │
│  Notes      │  Great Feeling   │  [Title input] [👁] [★] [📌] [🗑] [Save] │
│  Tags       │  Today      ···  │  ─────────────────────────────── │
│  Files      │  ...             │  [Markdown textarea / Preview]   │
│             │                  │                                  │
│  ─────────  │                  │  Tags: [chip ×] [+ Add tag]      │
│  Settings   │                  │  Files: [file ×] [+ Attach]      │
│  [user] [→] │                  │                                  │
└─────────────┴──────────────────┴──────────────────────────────────┘
```

**Mobile (< lg):**
```
┌──────────────────────────────────┐
│  [☰] Kooru          (top bar)    │
├──────────────────────────────────┤
│  Notes List  (h-[200px], scroll) │
│  Great Feeling          30 Mar   │
│  Today                  30 Mar   │
├──────────────────────────────────┤
│  Note Editor  (flex-1, scroll)   │
│  [Title input] ... [Save]        │
│  [Markdown textarea / Preview]   │
│  Tags / Attachments              │
└──────────────────────────────────┘
│  Sidebar opens as fixed overlay  │
│  via hamburger in the top bar    │
└──────────────────────────────────┘
```

**All three panel headers share `h-14`** to ensure visual alignment.

**Sidebar — desktop vs mobile:**
- Desktop: always-visible static `aside` using `hidden lg:flex`
- Mobile: full-screen fixed overlay rendered via `v-if="sidebarOpen"`, triggered by hamburger button

**Notes list sort order:** `is_sticky DESC, is_favorite DESC, updated DESC`

**Note card:** single-line layout — `[Title] [date] [pin?] [star?]`, no content excerpt.

---

### 4. Note Editor UX

**Toolbar (h-14):** title input · preview toggle · favourite · pin · delete · save/create

**Content area:** raw `<textarea>` (edit mode) or `prose`-styled rendered HTML (preview mode)

**Default mode:**
- Existing note → opens in **preview** mode
- New note → opens in **edit** mode

**Save/Create button:**
- Disabled until the note is dirty (title or content changed from last-saved values for existing notes; any content for new notes)
- `⌘S` keyboard shortcut also triggers save when dirty

**Pin / Favourite:**
- Toggle immediately calls `updateNote` on existing notes — no need to hit Save
- Optimistically reverts on error

**Delete:** requires confirmation via `UModal` before calling `deleteNote`

---

### 5. Markdown: textarea + marked + @tailwindcss/typography

**Chosen:** Plain `<textarea>` for editing + `marked` for rendering + `@tailwindcss/typography` for prose styling.

**Why:**
- Simplest possible approach — no heavy WYSIWYG dependency
- `marked` is fast, well-maintained, ~10KB, synchronous parse
- `@tailwindcss/typography` adds `prose` styles via `@plugin` in CSS (Tailwind v4 pattern)
- Single-toggle between edit and preview modes

**Preview rendering:** `v-html="renderMarkdown(content)"` inside `<div class="prose prose-sm dark:prose-invert">`.

**Alternatives considered:**
- TipTap / ProseMirror: powerful but heavy for a personal tool
- `@nuxtjs/mdc`: great for MDC-flavored markdown; overkill here
- CodeMirror with markdown mode: good syntax highlighting, adds ~100KB

---

### 6. PWA: @vite-pwa/nuxt

**Chosen:** `@vite-pwa/nuxt` module.

**Why:**
- Official Vite PWA plugin with Nuxt module wrapper
- Auto-generates service worker and web manifest
- `NetworkFirst` for API calls, `CacheFirst` for static assets

**Manifest key fields:**
```json
{
  "name": "Kooru",
  "short_name": "Kooru",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0f172a"
}
```

---

### 7. PocketBase Client: Plugin + Composable

**Chosen:** Initialize PocketBase in a client-only plugin, expose via `usePocketBase()`.

```ts
// app/plugins/pocketbase.client.ts
import PocketBase from 'pocketbase'
export default defineNuxtPlugin(() => {
  const pb = new PocketBase(useRuntimeConfig().public.pocketbaseUrl)
  return { provide: { pb } }
})

// app/composables/usePocketBase.ts
export const usePocketBase = (): PocketBase => useNuxtApp().$pb as PocketBase
```

**Why client-only:** PocketBase's `authStore` uses `localStorage`, which is unavailable during SSR. All auth checks and data fetching happen exclusively client-side.

**Auth middleware** (`app/middleware/auth.ts`) checks `pb.authStore.isValid` and redirects to `/login` if false. `guest.ts` does the inverse for the login page.

---

### 8. State: Composables (no Pinia)

**Chosen:** Vue composables (`useNotes`, `useTags`, `useFiles`) using Nuxt's `useState` for shared reactive state.

**Why:** Personal tool with simple, non-nested state. `useState('key', () => [])` provides SSR-safe shared refs across component instances without Pinia boilerplate.

**Pattern:**
```ts
const notes = useState<NoteRecord[]>('notes', () => [])
```
All three composables follow this pattern. Optimistic updates keep the UI fast — list state is mutated locally after each successful API call.

---

### 9. Nuxt Component Auto-Import Naming

**Gotcha:** Nuxt deduplicates component names when the filename already starts with the directory prefix.

| File | Registered as |
|---|---|
| `components/notes/NotesList.vue` | `NotesList` ← `NotesList` starts with `Notes` |
| `components/notes/NoteCard.vue` | `NotesNoteCard` |
| `components/notes/NoteEditor.vue` | `NotesNoteEditor` |
| `components/tags/TagChip.vue` | `TagsTagChip` |
| `components/files/FileItem.vue` | `FilesFileItem` |
| `components/layout/AppSidebar.vue` | `LayoutAppSidebar` |

**Rule:** if `PascalCase(filename)` starts with `PascalCase(directory)`, the directory prefix is stripped.

---

### 10. Full-Height Layout: CSS Height Chain

For `flex-1` children to fill the viewport, every ancestor must have a defined height.

```css
/* app/assets/css/main.css */
html, body, #__nuxt { height: 100%; }
```

```vue
<!-- app/app.vue -->
<UApp class="h-full">
```

```vue
<!-- app/layouts/app.vue -->
<div class="flex h-screen bg-background overflow-hidden">
```

Without the `html/body/#__nuxt` height chain, `flex-1` children resolve to `height: 0`.

---

## Pages & Routes

| Route       | Layout | Description                       |
|-------------|--------|-----------------------------------|
| `/login`    | `auth` | PocketBase email+password sign-in |
| `/`         | `app`  | Notes dashboard (3-column)        |
| `/tags`     | `app`  | Tags list, create, delete         |
| `/files`    | `app`  | Files browser, upload, delete     |
| `/settings` | `app`  | Profile update + sign-out (stub)  |

---

## File Structure

```
app/
  assets/
    css/
      main.css              ← tailwindcss + @nuxt/ui + @tailwindcss/typography + height chain
  components/
    layout/
      AppSidebar.vue        ← nav links (Notes/Tags/Files/Settings) + user row + logout
    notes/
      NoteCard.vue          ← single-line: title | date | pin? | star?
      NoteEditor.vue        ← toolbar + textarea/preview + tags popover + file attach
      NotesList.vue         ← scrollable list, h-[200px] mobile / w-72 desktop
    tags/
      TagChip.vue           ← tag row with note count badge + delete
    files/
      FileItem.vue          ← file row with thumbnail (images), download, delete
  composables/
    usePocketBase.ts        ← typed $pb accessor
    useAuth.ts              ← login, logout, currentUser, isAuthenticated
    useNotes.ts             ← CRUD + useState('notes')
    useTags.ts              ← CRUD + useState('tags')
    useFiles.ts             ← CRUD + upload + getFileUrl + useState('files')
  layouts/
    app.vue                 ← sidebar (desktop static / mobile overlay) + main slot
    auth.vue                ← centered card for login
  middleware/
    auth.ts                 ← redirect → /login if not authenticated
    guest.ts                ← redirect → / if already authenticated
  pages/
    login.vue               ← email + password form, guest middleware
    index.vue               ← NotesList + NoteEditor, URL query ?id= for active note
    tags.vue                ← tags list + inline create
    files.vue               ← files list + multi-upload
    settings.vue            ← stub (Phase 6)
  plugins/
    pocketbase.client.ts    ← client-only PocketBase init
  types/
    pocketbase.ts           ← NoteRecord, TagRecord, FileRecord interfaces
  utils/
    markdown.ts             ← renderMarkdown(content): string via marked (auto-imported)
  app.config.ts             ← primary: green, neutral: slate
  app.vue                   ← UApp(h-full) > NuxtLayout > NuxtPage
docs/
  CLAUDE.md
  ADR-001-notes-app-architecture.md
nuxt.config.ts              ← modules, runtimeConfig, routeRules (ssr:false), pwa config
```

---

## Consequences

- PocketBase URL must be set via `NUXT_PUBLIC_POCKETBASE_URL` in `.env`
- The app is entirely client-rendered — no SEO, but not needed for a personal tool
- No real-time sync between tabs (PocketBase subscriptions can be added later)
- Markdown is stored and rendered as-is — no sanitization (single-user, trusted content)
- PWA icons (`public/icons/icon-192.png`, `icon-512.png`) must be added manually before production build
