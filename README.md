# FieldSync UI Overhaul — Prototype

A functional React prototype for the FieldSync QC Workflow. Built to hand off to engineering as a living reference for layout, interactions, component behaviour, and visual design.

---

## Stack

| | |
|---|---|
| Framework | React 18 |
| Language | TypeScript 5.7 (strict) |
| Bundler | Vite 6 |
| Styling | Tailwind CSS v3 (custom design tokens) |
| Routing | React Router v6 |
| Icons | lucide-react |
| Utility | clsx |

---

## Prerequisites

- **Node.js** ≥ 18 — [nodejs.org](https://nodejs.org)
- **npm** ≥ 9 (bundled with Node)

Check your versions:

```bash
node -v
npm -v
```

---

## Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd UI-Overhaul

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Opens at **http://localhost:5173** with hot module replacement.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server at `localhost:5173` |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npx tsc --noEmit` | Type-check only, no output |

---

## Routes

| URL | Page | Status |
|---|---|---|
| `/dashboard` | QA Dashboard — survey queue, scope, templates, import | Built |
| `/sites` | Sites List — sortable/filterable table | Built |
| `/sites/:siteId` | Site Detail — metadata, structures, visits, reports | Built |
| `/sites/:siteId/visits/:visitId` | Site Visit — conditions, contributors, surveys | Built |
| `/surveys/:surveyId/qc` | **QC Editor** — field review, flagging, AI analysis | Built |
| `/components` | Component Library — all field types, states, patterns | Built |
| `/projects` | Projects | Nav only — not built |
| `/customers` | Customers | Nav only — not built |
| `/table-builder` | Table Builder | Nav only — not built |
| `/table-analysis` | Table Analysis | Nav only — not built |
| `/organization` | Organisation | Nav only — not built |

Navigate to `/surveys/survey_001/qc` to open the primary QC Editor prototype directly.

---

## Project Structure

```
src/
├── components/
│   └── Layout.tsx          # Shell — sidebar nav, top bar, outlet
├── data/
│   └── mockData.ts         # All mock data and TypeScript types
├── pages/
│   ├── QCEditorPage.tsx    # Primary deliverable — QC review interface
│   ├── SiteVisitPage.tsx   # Site visit detail and survey list
│   ├── SiteDetailPage.tsx  # Site profile and metadata
│   ├── SitesListPage.tsx   # Sites table
│   ├── QADashboardPage.tsx # Survey queue dashboard
│   └── ComponentLibraryPage.tsx  # UI component reference
└── index.css               # Tailwind base + global utility classes
```

---

## Data

**All data is static mock data.** There is no backend, no API, and no network requests. Everything lives in `src/data/mockData.ts`.

Core types exported from mockData:

```ts
FieldType  = 'yesno' | 'text' | 'select' | 'photo' | 'textarea' | 'number'

SurveyField      — id, label, value, type, required, marked, flagged
SurveySubsection — id, title, fields[]
SurveyItem       — id, label, subsections[], subItems?
SurveySection    — id, title, subsections[], items?, drillIn?
```

To change what the QC Editor loads, edit `mockSurvey` in `mockData.ts`.

---

## Design Tokens

Custom Tailwind colours are defined in `tailwind.config.js`. Use these semantic names rather than raw Tailwind colours:

| Token | Value | Use |
|---|---|---|
| `sidebar` | `#002832` | Nav sidebar background |
| `teal-400` | `#097eb3` | Primary interactive / active states |
| `teal-900` | `#002832` | Headings, active text |
| `bg-gray-lm` | `#F1F5F9` | Page background, input backgrounds |
| `hover-gray-lm` | `#F7FAFC` | Row hover, button hover |
| `nav-gray` | `#E2E8F0` | Borders, dividers |
| `std-gray-lm` | `#64748B` | Secondary text, icons |
| `std-gray-dm` | `#AFB7C1` | Placeholder text, disabled |

Font: **Inter** loaded via system stack — no font import needed if Inter is available on the system; falls back to `system-ui`.

---

## Global Utility Classes

Defined in `src/index.css`. Use these instead of writing the full Tailwind string each time:

```css
.btn-primary    /* Teal filled button */
.btn-secondary  /* Light border button */
.btn-success    /* Green filled button */
.card           /* White rounded card with border */
.badge          /* Inline status pill */
```

---

## Path Alias

`@/` maps to `src/`. Configured in both `vite.config.ts` and `tsconfig.json`.

```ts
import { mockSurvey } from '@/data/mockData'
```

---

## Key Prototype Behaviours

A few non-obvious things before reading the code:

- **Global nav hides in the QC Editor.** When the route matches `/surveys/*/qc`, the top navigation bar (`Layout.tsx`) collapses automatically. A "Show navigation" strip appears to restore it. This is intentional.
- **Autosave is simulated.** Field changes trigger a `setTimeout(1500ms)` that resolves to "Saved HH:MM". No persistence occurs.
- **AI Analysis is mocked.** "Run Analysis" waits 2 seconds then flags fields based on simple local rules. No API call is made.
- **Photo fields are UI-only.** The capture/upload flow is designed but no file handling is implemented.
- **Flags and AI Analysis** open as right-side slide-over modals portalled to `document.body`, not inline panels.

---

## Handoff

See [`HANDOFF.md`](./HANDOFF.md) for the full development handoff — feature summary, hard requirements, database proposal, out-of-scope items, and open questions.
