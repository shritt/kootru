# CLAUDE.md — Agent Guide for Kooru

This file provides context and conventions for AI agents (Claude Code, Copilot, etc.) working in this repository.

## Project Overview

**Kooru** is a personal notes PWA built with:
- **Nuxt 4** (app/ directory structure, file-system routing)
- **Nuxt UI 4.x** (component library, all components auto-imported with `U` prefix)
- **Tailwind CSS v4** (CSS-first, no `tailwind.config.js` — config via `@theme` in CSS)
- **PocketBase** (self-hosted backend for auth, collections, file storage)

## Key Conventions

### Directory Structure
Source lives under `app/`. Do not place pages, components, or composables at the repo root.

```
app/
  components/     # auto-imported, PascalCase subdirectories (e.g. notes/NoteCard.vue)
  composables/    # auto-imported, prefix with 'use' (e.g. useNotes.ts)
  layouts/        # app.vue (dashboard), auth.vue (login)
  middleware/     # auth.ts + guest.ts
  pages/          # file-system routing
  plugins/        # pocketbase.client.ts — client-only plugin
  types/          # pocketbase.ts — NoteRecord, TagRecord, FileRecord
  utils/          # pure helpers (e.g. markdown.ts) — auto-imported
  assets/css/     # main.css — @import "tailwindcss" + @import "@nuxt/ui" + @plugin typography
```

### Component Auto-Import Naming — CRITICAL GOTCHA

Nuxt deduplicates component names when the filename already starts with the directory prefix (PascalCase).

```
components/notes/NotesList.vue   → <NotesList>        ← "NotesList" starts with "Notes"
components/notes/NoteCard.vue    → <NotesNoteCard>     ← "NoteCard" does NOT start with "Notes"
components/notes/NoteEditor.vue  → <NotesNoteEditor>
components/tags/TagChip.vue      → <TagsTagChip>
components/files/FileItem.vue    → <FilesFileItem>
components/layout/AppSidebar.vue → <LayoutAppSidebar>
```

**Rule:** if `PascalCase(filename)` starts with `PascalCase(directoryName)`, the prefix is stripped.
Always verify the registered name before using a component in a template.

### PocketBase
- Client initialized in `app/plugins/pocketbase.client.ts`, injected as `$pb` (client-only)
- Access via `usePocketBase()` composable — never call `useNuxtApp().$pb` directly
- Auth state stored in `pb.authStore` (persisted to localStorage — not available during SSR)
- All pages have `ssr: false` in `nuxt.config.ts` routeRules

**Collections:**
- `notes`: `id`, `title`, `content` (markdown), `is_sticky`, `is_favorite`, `tags` (relation), `attachments` (relation → files)
- `tags`: `id`, `name`
- `files`: `id`, `name`, `media` (file upload)

### Full-Height Layout Chain
For `flex-1` to work throughout the app, the entire ancestor chain must have a defined height:

```css
/* main.css */
html, body, #__nuxt { height: 100%; }
```
```vue
<!-- app.vue -->
<UApp class="h-full">
```
The layout uses `h-screen` on the outermost div. Do not remove these — the layout collapses without them.

### Nuxt UI Components
- Auto-imported with `U` prefix — never import manually
- `useToast()` for notifications, `defineShortcuts()` for keyboard shortcuts
- `UModal` with `v-model:open` for confirmation dialogs
- `UPopover` with `v-model:open` for inline dropdowns (e.g. tag picker)

### Tailwind v4
- No `tailwind.config.js` — customisations in `app/assets/css/main.css` via `@theme {}`
- Plugins added via `@plugin` directive (e.g. `@plugin "@tailwindcss/typography"`)
- Use utility classes directly in templates

### Markdown
- Content stored as raw markdown in PocketBase
- `renderMarkdown(content)` in `app/utils/markdown.ts` wraps `marked.parse()` — auto-imported
- Preview rendered with `v-html` inside `<div class="prose prose-sm dark:prose-invert">`
- `@tailwindcss/typography` must be present for prose styles to apply

### Editor Behaviour
- Existing notes open in **preview** mode by default
- New notes (`?id=new`) open in **edit** mode
- Save/Create is disabled until the note is dirty (title or content changed)
- Pin / Favourite toggle calls `updateNote` immediately on existing notes (no Save needed)
- Delete requires `UModal` confirmation

### State Management
- `useState('notes', () => [])` / `useState('tags', ...)` / `useState('files', ...)` for shared reactive state
- Optimistic updates: mutate local state immediately after successful API calls
- No Pinia — composables are sufficient at this scale

### Auth
- `app/middleware/auth.ts` — redirects to `/login` if `pb.authStore.isValid` is false
- `app/middleware/guest.ts` — redirects to `/` if already authenticated
- Applied per-page via `definePageMeta({ middleware: 'auth' })`

### PWA
- Configured via `@vite-pwa/nuxt` in `nuxt.config.ts`
- Service worker + manifest auto-generated
- Add `public/icons/icon-192.png` and `public/icons/icon-512.png` before production build

## File Naming
- Pages: `kebab-case.vue` (`index.vue`, `login.vue`)
- Components: `PascalCase.vue` in subdirectories
- Composables: `camelCase.ts` with `use` prefix
- Types: `pocketbase.ts` in `app/types/`
- Utilities: `camelCase.ts` in `app/utils/`

## Do Not
- Do not add `tailwind.config.js` — v4 is CSS-first
- Do not manually import Nuxt UI components — they are auto-imported
- Do not use SSR-dependent code in composables — PocketBase is client-only
- Do not remove the `html/body/#__nuxt` height CSS — the layout depends on it
- Do not add error handling for impossible states (trust PocketBase SDK types)
- Do not create helpers for one-time operations

## Docs
Architecture decisions are recorded as ADRs in `docs/ADR-*.md`.
