# Legal Eagle · Client Intake CRM

A lightweight CRM for Legal Eagle UAE's **client intake team**: capture enquiries, search and filter contacts, log notes and follow-ups, and move people through a Lead → Active → Closed pipeline. It's a **demo environment**. All data is fictional and stays in your browser.

## Technology stack
Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui (Radix) · Lucide · Zustand · React Hook Form + Zod · dnd-kit · Vitest · `playwright-core` for the browser smoke test.

## Component architecture
```
src/app/(crm)/        routes: overview, contacts, contacts/[id], pipeline (+ error boundary, 404)
src/components/
  layout/             app shell, collapsible sidebar, mobile drawer, topbar, Ctrl+K quick find
  contacts/           list view, table + mobile cards, toolbar, shared create/edit dialog
  contact-details/    header, info sections, notes, activity timeline, follow-up dialog
  pipeline/           board, droppable columns, draggable cards
  shared/             status badge/menu, avatar, page header, empty/error states, form field
  ui/                 shadcn primitives retuned to the brand tokens
src/lib/              storage adapters, selectors (search/filter/sort/stats), activity factory, seed
src/store/            Zustand CRM store (single source of truth) + small UI store for dialogs
src/schemas, types/   Zod schemas and domain models
```
Business logic lives in `lib/` and `store/` as framework-free, unit-tested functions. Components only select state and call actions.

## State management
One vanilla Zustand store holds `contacts`, `notes` and `activities`. Every mutation (`createContact`, `updateContact`, `changeStatus`, `addNote`, `recordFollowUp`, `deleteContact`) writes the record **and** its timeline activity in a single update, so the list, profile, pipeline and overview always agree. Activities are only ever created by these actions. Seed activities are derived from seeded events. Deleting a contact cascades to its notes and activities. Any interaction counts as an update, so `updatedAt` always means "last activity". List filters live in the URL, so they survive a refresh and can be shared.

## Persistence
`StorageAdapter` (`load/save/clear/subscribe`) isolates persistence. The LocalStorage adapter writes a versioned payload and validates every record with Zod on load. Invalid records are dropped, unreadable payloads fall back to demo data with a toast, and blocked storage degrades to in-memory mode with a visible notice. Write failures (e.g. quota) are surfaced. Tabs stay in sync via the `storage` event. **Limitation:** LocalStorage is per browser and per device. Different people never see each other's data, and clearing site data resets it. Use **Reset demo data** in the sidebar to restore the dataset. Swapping in Supabase or an API means implementing the adapter, not touching UI.

## UX decisions
- **Brand:** the palette was extracted from legaleagle.ae's Elementor global kit: primary `#B46E19`, secondary/accent `#D09725`, text `#808080`, dark `#333333`, plus `#011C1A`, `#037448`, `#314E52`, `#F5F5F5` and `#F9F9F9` from page styles. Button fills use a derived darker bronze `#9C5F14` (5.2:1 with white) because `#B46E19` gives only ~4.1:1. The site uses Changa, but per the brief, headings use **Outfit** and body text **Poppins**, both via `next/font`. The logo mark is a crop of the official asset.
- **Navigation:** a dark ink sidebar with a gold active indicator. It becomes an icon rail on tablets, can collapse on desktop, and turns into a drawer on mobile. Ctrl/⌘+K opens quick find from anywhere.
- **Contacts:** derived stats, status filters with counts, instant search (name/email/company/phone digits), sortable headers plus a sort menu. The table becomes cards below 768px, and columns drop out progressively so nothing scrolls sideways.
- **Profile:** notes and timeline form the working area, with reference details beside them. Status is changed inline from the header badge.
- **Pipeline:** cards drag between stages with a pointer, or with the keyboard (handle → ←/→ jumps a whole stage) with screen-reader announcements. Every card also has a "Move to" menu. On mobile you see one stage at a time.
- Skeletons only render before client hydration. LocalStorage is synchronous, so there are no fake network delays.

## Tradeoff
Data is client-only, so `/contacts/[id]` can't 404 on the server: it resolves "not found" after hydration and pages render skeletons first. With more time I'd move to a real backend (Supabase) behind the existing adapter with optimistic updates, add authentication and per-user authorship, virtualise the table for large datasets, and allow reordering cards within a column.

## AI usage
Built with Claude Code (Anthropic). AI drafted the brand extraction, architecture, components and tests. I reviewed the code, checked contrast values, and verified the behaviour with unit tests (`npm test`, 22 tests across the store, selectors and validation) plus a 17-step browser smoke test (`npm run test:e2e`). The smoke test covers search, filters, sorting, validation, CRUD, notes, follow-ups, menu and drag moves, persistence after refresh, 404s, corrupted-storage recovery, reset, and mobile overflow. I also reviewed screenshots at 1440, 1280, 768 and 390px.

## Running locally
```bash
npm install
npm run dev          # http://localhost:3000
npm test             # unit tests
npm run lint && npm run typecheck && npm run build
# browser smoke test against a running server (uses your installed Chrome):
BASE_URL=http://localhost:3000 CHROME_PATH="/path/to/chrome" npm run test:e2e
```
"# legaleagle-minicrm" 
