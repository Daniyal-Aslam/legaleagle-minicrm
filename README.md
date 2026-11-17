# Legal Eagle CRM

A lightweight CRM for Legal Eagle UAE: capture enquiries, search and filter contacts, log notes and follow ups, and move clients through a Lead → Active → Closed pipeline. Built with Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Zustand, React Hook Form + Zod and dnd-kit.

```bash
npm install && npm run dev        # http://localhost:3000
npm test                          # 29 unit tests
BASE_URL=http://localhost:3000 npm run test:e2e   # 22 step browser test (uses local Chrome)
```
Demo logins (mock auth, every account uses the password `Eagle@2026`):

| Name | Role | Email |
| --- | --- | --- |
| Mariam Al Hashimi | Intake Coordinator | `mariam@legaleagle.test` |
| Yousef Khalil | Senior Associate | `yousef@legaleagle.test` |

These are also listed in `.env.example`, alongside `AUTH_SECRET` (copy it to `.env.local`).

## Component structure and state management
```
src/app/            routes: login, (crm)/ overview, contacts, contacts/[id], pipeline, api/auth/*
src/components/     layout/ (sidebar, topbar, account menu, quick find) · contacts/ · contact-details/
                    pipeline/ · overview/ · auth/ · shared/ (badges, avatars, empty states) · ui/ (shadcn)
src/lib/            selectors (search, filters, facets, sort), storage adapters, activity factory, seed
src/store/          crm-store (domain data) + ui-store (which dialog is open)
```
- **One source of truth.** A Zustand store holds contacts, notes and activities. Every action (create, edit, change status, add note, log follow up, delete) writes the record *and* its timeline entry in one update, so the list, profile, pipeline and overview never disagree.
- **Logic outside components.** Filtering, sorting and faceted counts are pure functions in `lib/` with unit tests. Components only select state and call actions.
- **Persistence behind an adapter.** A `StorageAdapter` interface saves to LocalStorage with versioned, Zod-validated data. Corrupt data falls back to the sample set, and blocked storage drops to in-memory mode with a notice.
- **URL state for lists.** Search, status, practice area, source, date added and sort live in the query string, so a filtered view survives refresh and can be shared.
- **Mock auth on the server.** Route handlers check credentials and set an httpOnly, HMAC-signed cookie, and middleware protects every page.

## UI and UX decisions
- **Brand first, but calm.** Colours come from legaleagle.ae (bronze, gold, deep ink), with button colours darkened to pass WCAG AA contrast. The UI stays mostly neutral so status colours (lead, active, closed) carry meaning.
- **Find anything fast.** Ctrl/⌘+K quick find, `/` to search, faceted filters that show how many results each option gives, removable filter chips and a live "Showing X of Y" count.
- **Work where the context is.** The profile puts notes and the activity timeline at the centre. Status changes inline, and every change is recorded automatically.
- **Two ways to move cards.** The pipeline supports drag and drop (mouse, touch and keyboard) and a "Move to" menu for precision and accessibility.
- **Mobile is a real layout, not a squeeze.** Tables become cards, the sidebar becomes a drawer, the pipeline shows one stage at a time, and filters use short labels. No page scrolls sideways at 375px.
- **Clear feedback.** Sign in shows a spinner, then a "Welcome" hand-off with progress. A wrong password puts the cursor back in the field. Page changes show skeletons instantly, and empty states always offer the next step.

## Tradeoff and what I would improve
I kept all data in the browser (LocalStorage) so the app runs with zero setup and stays fast. The cost: data is per device, nothing is shared between users, and a contact page can only say "not found" after the client loads. With more time I would plug a real backend (e.g. Supabase) into the existing storage adapter with optimistic updates, add real authentication and roles, virtualise the table for large lists, and add saved filter views.

## How I used AI tools
I built this with Claude Code as a pair programmer. It drafted components, the store, tests and the browser test script, and helped extract the brand palette. I directed the design, reviewed every change, checked contrast and accessibility, and verified behaviour with unit tests, the end-to-end test and screenshot reviews at desktop, tablet and phone sizes. When AI output was wrong (for example a layering bug that hid the sidebar toggle, or a missing theme colour), I caught it in review and had it fixed.
