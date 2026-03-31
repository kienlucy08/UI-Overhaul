# Development Handoff — FieldSync QC Workflow

**Version:** v0.1.0
**Handoff date:** 2026-03-31
**Prepared by:** Lucy Kien
**Status at handoff:** Ready for Dev

---

## Feature Summary

FieldSync QC Workflow is a browser-based review and quality control system for tower inspection surveys. Field technicians collect structured survey data on-site using a mobile capture tool; QC reviewers then use this system to systematically verify field values, flag anomalies, run AI-assisted analysis, and formally approve surveys before reports are generated and delivered to customers. The system spans the full data lifecycle: from a QA Dashboard (survey queue management, scope and template administration) through the QC Editor (the core field-by-field review interface), down to Site and Site Visit detail pages that give reviewers the broader context around each survey. The intended users are QC reviewers, QC managers, and organisation admins — not field technicians, who interact with a separate mobile capture application.

Development priority order:
1. **QC Editor** — core review interface
2. **Site Visit Summary** — per-visit context and survey list
3. **Site Detail / Site Summary** — site-level profile
4. **QA Dashboard** — survey queue and scope/template management
5. **Sites List, Projects, Customers, Organisation, Table Builder, Table Analysis** — supporting pages

---

## Input Format

What form is this handoff arriving in?

- [x] Functional POC — located at `UI-Overhaul/` (React + Vite + TypeScript + Tailwind CSS v3)
- [ ] Mockups / wireframes
- [ ] Written specification
- [ ] Pre-written tickets

---

## Prototype & Design Assets

**Live prototype repo:** `GitHub_Prototypes/UI-Overhaul/`
**Run locally:** `npm install && npm run dev` — opens at `http://localhost:5173`

**Key routes to review in order:**

| Route | What to look at |
|---|---|
| `/dashboard` | QA Dashboard — survey queue tabs, search/sort, bulk actions |
| `/sites` | Sites List — table with sort, filter, row actions |
| `/sites/TX6100` | Site Detail — metadata, structures, compounds, visits, reports |
| `/sites/TX6100/visits/visit_001` | Site Visit — conditions, contributors, survey list with progress |
| `/surveys/survey_001/qc` | **QC Editor — primary focus** |
| `/components` | Component Library — all field types, states, COP photo patterns, buttons, badges, tables |

**Prototype notes — read before writing tickets:**

- **All data is mocked.** `src/data/mockData.ts` is the single source of truth for the prototype. No API calls exist. Every list, survey, and field value is static.
- **Autosave is simulated** with a `setTimeout` — the real implementation needs a debounced PATCH to the survey response endpoint with optimistic UI.
- **AI Analysis is fully mocked.** The "Run Analysis" button waits 2 seconds then flags a hardcoded subset of fields based on simple rules (required + no value = error, user-flagged = warning, first field with a value = suggestion). The real implementation is a backend call to an LLM or rules engine. The UI contract is: a map of `{ fieldId → { issue: string, severity: 'error' | 'warning' | 'suggestion' } }` returned from the API.
- **Photo fields have placeholder UI only.** Tap-to-capture and the photo grid show the intended UX but no upload, storage, or display of real images is wired.
- **Planned field types** (`multiselect`, `radio`, `date`, `datetime`, `measurement`, `rating`, `score`, `location`, `barcode`, `attachment`, `signature`) are designed and visible in `/components` but are **not** wired into the QC Editor engine. The current editor only handles: `yesno | text | select | photo | textarea | number`.
- **COP (Compound Overview Photo) survey type** — the photo-heavy layout is designed in the Component Library (`/components` → Photo / COP section) but there is no separate COP QC Editor route yet. The QC Editor needs to adapt its layout when the survey type is COP (larger photo fields, grid layout, minimal text inputs).
- **Pages with no content built:** Projects, Customers, Table Builder, Table Analysis, Organisation exist only as nav links. Clicking them shows an empty `<Outlet />`.
- **The global nav bar auto-hides when entering the QC editor** (`/surveys/*/qc`) to maximise the review area. It has a slim "Show navigation" strip to restore it. This is intentional — do not treat it as a bug.
- **The QC Editor left sidebar is collapsible** (w-64 expanded, w-10 collapsed to coloured dot strip). On collapse, section dots are colour-coded: teal = active, green = complete, red = flagged, purple = AI issues.
- **Flags and AI Analysis** open as right-side slide-over modals (portalled to `document.body`), not inline panels. Clicking a field in either modal navigates to that section and closes the modal.

---

## Specification Document

Full spec: *(to be written — this handoff is the primary reference)*

**Most critical / non-obvious parts:**

### QC Editor — section types

The survey structure is deeply nested and has three distinct section rendering modes that engineering must handle:

1. **Standard sections** — subsections render as stacked field blocks within one scrollable view. If a section has more than one subsection (`subsections.length > 1`) it uses **paginated subsection navigation** (Previous / Next at bottom, left sidebar shows subsection list beneath the section).

2. **Item-accordion sections** (`items` array present, `drillIn: false`) — repeatable items (e.g. Deficiencies, Generators) render as collapsible accordions inline. Items can have `subItems` (e.g. Feedlines within a Carrier) which are nested accordions within the item.

3. **Drill-in sections** (`drillIn: true`) — items render as a list. Tapping an item navigates to a detail view for that item. Back button returns to the list. Used for Carrier Facilities because items have significant sub-structure.

All three modes coexist in a single survey. The sidebar must correctly show progress and flags for all modes.

### QC Editor — field marking rules

- A field can be **flagged** (reviewer attention needed) or **marked** (reviewed/approved) — but **not both simultaneously.** Marking a flagged field is blocked until the flag is cleared.
- "Mark All Checked" at the bottom of a section marks all *unflagged* fields in the current view as checked. Flagged fields are skipped.
- Progress percentage is computed from `marked / total` — flagged fields count as unmarked toward progress.

### QC Editor — AI analysis persistence

AI analysis results must persist per survey review session. If a reviewer closes the modal, navigates sections, and reopens AI Analysis, the results should still be shown. Results should be re-fetched or invalidated only when "Re-analyze" is explicitly clicked. AI flags display inline on the relevant field in the section view (badge + insight card below the value input).

### Site Visit → QC Editor navigation

The entry point to the QC Editor is from the Site Visit page's Surveys card. Each survey row links to `/surveys/{surveyId}/qc`. The QC Editor header must show: survey name, site name, site ID, technician name — all from the survey record.

---

## Hard Requirements

Things the prototype does not capture that must be accounted for before ticket generation.

### Permissions & access

- [ ] **Roles required (minimum):** `technician`, `qc_reviewer`, `org_admin`. A `super_admin` role for FieldSync internal staff is likely needed but not yet specified.
- [ ] QC Editor is **read-only for technicians.** They can view the review state but cannot mark, flag, or run AI analysis. The field inputs, flag buttons, mark buttons, and "Mark Complete" must be disabled or hidden for the `technician` role.
- [ ] `qc_reviewer` can mark fields, flag fields, run AI analysis, and mark a survey complete — but only for surveys assigned to their organisation.
- [ ] `org_admin` has all reviewer permissions plus access to template management, scope of work, and organisation settings.
- [ ] Survey completion (`Mark Complete`) may require a secondary confirmation — **open question** whether this requires an approver-level permission separate from reviewer.
- [ ] AI Analysis is a billable or rate-limited feature — the "Run Analysis" / "Re-analyze" button may need to be gated by org-level feature flag.
- [ ] Site and Site Visit pages: `technician` can view their own site visits; `qc_reviewer` and above can view all within the org.

### Complex user flows & edge cases

- [ ] **Survey already marked complete** — the QC Editor must render in a locked/read-only state. `Mark Complete` button shows "Completed" (already reflected in prototype). All field inputs, flag buttons, and mark buttons must be disabled.
- [ ] **All fields in a section are flagged** — "Mark All Checked" does nothing (no eligible fields). The button should reflect this state gracefully (disabled or tooltip explaining why).
- [ ] **Empty section** — prototype shows "No items in this section" empty state with an optional "Add [item type]" button. Must be wired to the correct add-item flow.
- [ ] **Connectivity loss mid-review** — autosave must queue changes locally (IndexedDB or similar) and sync when reconnected. User must be notified of unsaved state. The "Saving… / Saved at HH:MM" indicator in the toolbar is the UI hook for this.
- [ ] **Survey with zero fields** — edge case where a template has sections but no fields yet. Editor should render empty states throughout without crashing progress calculations (division by zero).
- [ ] **AI Analysis ran, then field values changed** — AI flags should be visually stale-marked or auto-cleared when the underlying field value changes after analysis. The "Re-analyze" CTA in the modal handles this intentionally.
- [ ] **Navigating away from QC Editor mid-review** — unsaved changes warning if autosave has not yet confirmed.
- [ ] **Marking a survey complete with open flags** — the prototype shows a confirmation modal with the flag count and a warning. This is a soft block (user can proceed). Whether it should be a hard block is an **open question.**
- [ ] **Repeatable items (Deficiencies, Carriers, etc.)** — adding and removing items must update the survey record and recalculate section progress in real time.
- [ ] **Photo fields in QC review** — the reviewer is checking whether a photo was captured, not capturing it themselves. The photo field in the QC Editor should display the submitted photo (read) with a flag/mark action, not a camera capture UI.

### Organisation integration

- [ ] All survey, site, and visit data is scoped to the **selected Organisation.** A user who belongs to multiple orgs must only see data for the currently active org.
- [ ] Org-level settings may gate features: AI Analysis (billing), template editing, scope-of-work management.
- [ ] The prototype hardcodes `FieldSync` as the org name and `lkien@fieldsync.io` as the user — these must be dynamic from the authenticated session.
- [ ] Multi-org switching behaviour (if a user belongs to more than one org) is **not designed yet** — flag as an open question before ticket generation.

---

## Database Proposal

Full proposal: *(to be validated by engineering in Phase 1)*
**Migration needed:** Yes

### New or modified entities

| Entity | Key Fields | Notes |
|---|---|---|
| `organisations` | `id`, `name`, `settings (jsonb)` | Top-level tenant |
| `users` | `id`, `org_id`, `role`, `email`, `name` | Roles: `technician`, `qc_reviewer`, `org_admin`, `super_admin` |
| `customers` | `id`, `org_id`, `name` | Customer/client companies |
| `projects` | `id`, `org_id`, `customer_id`, `name`, `status` | Groups sites and visits |
| `sites` | `id`, `org_id`, `name`, `state`, `coordinates`, `owner`, `status` | Physical tower locations |
| `site_visits` | `id`, `site_id`, `org_id`, `visit_date`, `conditions (jsonb)`, `technician_ids (array)` | One visit per site per date |
| `survey_templates` | `id`, `org_id`, `name`, `survey_type`, `version` | Defines survey structure — not instance data |
| `template_sections` | `id`, `template_id`, `title`, `order`, `drill_in (bool)` | Section definition |
| `template_subsections` | `id`, `section_id`, `title`, `order` | Subsection definition |
| `template_fields` | `id`, `subsection_id`, `label`, `field_type`, `required`, `order`, `options (jsonb)` | Field definition. `options` stores select choices, measurement units, etc. |
| `surveys` | `id`, `template_id`, `site_visit_id`, `technician_id`, `status`, `completed_at` | Instance of a template for a specific visit |
| `survey_responses` | `id`, `survey_id`, `field_id`, `value`, `marked`, `flagged`, `note` | One row per field per survey instance |
| `qc_reviews` | `id`, `survey_id`, `reviewer_id`, `started_at`, `completed_at`, `status` | Tracks a reviewer's session on a survey |
| `flags` | `id`, `response_id`, `review_id`, `created_by`, `note` | Manual reviewer flags |
| `ai_analysis_runs` | `id`, `survey_id`, `review_id`, `ran_at`, `model_version` | One per "Run Analysis" / "Re-analyze" click |
| `ai_analysis_results` | `id`, `run_id`, `response_id`, `field_id`, `issue`, `severity` | Per-field AI findings |
| `scope_of_work` | `id`, `org_id`, `name`, `template_ids (array)` | Named scope grouping templates |
| `reports` | `id`, `survey_id`, `version`, `generated_at`, `url` | Generated report artifacts |

### Relationships & impact on existing data

- `survey_responses` is the central join table — it links a survey instance to its template fields and holds all mutable review state (`value`, `marked`, `flagged`).
- `ai_analysis_results` reference both a `run_id` and a `field_id` — the frontend resolves which results are "current" by joining on the most recent `run_id` for a given `survey_id`.
- Adding repeatable items (Deficiencies, Carriers) creates new `survey_responses` rows dynamically — the template defines the *shape* of an item, and each added item is a new instantiation with its own response rows. The exact mechanism for linking item instances to template item definitions needs engineering validation.
- `template_fields.options` stores the choices for `select` and `multiselect` fields as JSONB — this keeps field definition self-contained per template version.
- Template versioning strategy is **not fully specified** — if a template changes after surveys have been submitted, existing `survey_responses` must remain linked to the original template version. Flag for engineering review.

---

## Out of Scope

Be explicit so engineering does not over-build and CS does not over-promise.

- **Planned field types** — `multiselect`, `radio`, `date`, `datetime`, `measurement`, `rating`, `score`, `location`, `barcode`, `attachment`, `signature` are designed in the Component Library but are **not** in scope for the initial build. Only `yesno`, `text`, `select`, `photo`, `textarea`, `number` ship in v1.
- **COP (Compound Overview Photo) adapted QC Editor layout** — designed in Component Library but not a separate deliverable in v1. The QC Editor will use the standard layout for all survey types initially.
- **Real-time collaborative review** — two reviewers working on the same survey simultaneously is not supported. Last-write-wins on autosave is acceptable for v1.
- **PDF / report generation** — reports are shown as downloadable in the Site Detail page prototype but generation is entirely out of scope. The `reports` table should be included in the schema for future use but no generation endpoint is needed.
- **Real AI/LLM integration** — the AI Analysis feature ships as a stubbed endpoint in v1. The UI contract is fully defined; the model/rules engine is a separate project.
- **Photo upload and storage** — photo fields capture the value as a filename string in the prototype. Real image capture, upload to object storage, and thumbnail display are out of scope for the QC Editor v1. The `photo` field type should store a reference URL and display it if present; the capture flow is not built.
- **Mobile native app** — this is a browser-only application. Responsive design is required (the prototype handles it) but there is no React Native or Capacitor wrapper in scope.
- **Projects, Customers, Table Builder, Table Analysis, Organisation pages** — nav links exist but no page content has been designed or built. These are post-QC-Editor deliverables.
- **Org switching / multi-org UI** — single active org per session only in v1.
- **Offline-first / full PWA** — autosave queuing during connectivity loss is a hard requirement but a full offline-capable PWA with service workers is not in scope.

---

## Testing Ideas

Starting points for QA during Phase 1 ticket generation.

- [ ] **Happy path (QC reviewer):** Open a survey from the Site Visit page → navigate all sections → mark all fields → clear one flag → run AI analysis → mark survey complete → confirm survey status updates to Completed.
- [ ] **Happy path (org admin):** Access QA Dashboard → filter by scope → open a survey → same review flow as above.
- [ ] **Permission check:** Log in as `technician` role → navigate to QC Editor → confirm all editing controls (flag, mark, mark complete, run AI) are disabled/hidden. Confirm survey is still readable.
- [ ] **Flagged field blocks mark:** Flag a field → attempt "Mark All Checked" → confirm flagged field is skipped and remains unmarked.
- [ ] **AI analysis persistence:** Run AI analysis → navigate to a different section and back → confirm AI badges and inline insights are still visible without re-running.
- [ ] **AI analysis after value change:** Run AI analysis → change a field value that was AI-flagged → confirm the AI insight is visually stale or cleared.
- [ ] **Complete survey with open flags:** Flag a field → click "Mark Complete" → confirm warning modal appears with flag count → confirm user can choose to proceed or cancel.
- [ ] **Empty section:** Navigate to a section with no fields → confirm empty state renders without JS errors and progress does not show NaN%.
- [ ] **Add / remove repeatable item:** On a Deficiencies section → add a new item → confirm it appears in the sidebar with correct progress (0/N) → remove it → confirm sidebar updates.
- [ ] **Autosave indicator:** Change a field value → confirm "Saving…" appears → confirm "Saved HH:MM" appears after debounce completes.
- [ ] **Sidebar collapse and AI indicators:** Run AI analysis → collapse the sidebar → confirm purple-border dots appear on sections with AI issues.
- [ ] **Regression — Sites List:** Confirm sort, search, and selection still work after QC Editor changes to Layout.tsx.
- [ ] **Regression — global nav auto-hide:** Navigate to QC Editor → confirm top nav bar is hidden → navigate back to Dashboard → confirm top nav bar is restored.

---

## Open Questions

Resolve before Phase 1 ticket generation begins.

| # | Question | Owner | Needed by |
|---|---|---|---|
| 1 | Does marking a survey complete require a separate **approver** role or is `qc_reviewer` sufficient? | Product | Ticket gen |
| 2 | Is "Mark Complete with open flags" a **soft block** (confirm + proceed) or a **hard block** (must resolve all flags first)? | Product | QC Editor ticket |
| 3 | What is the **template versioning strategy**? If a template is updated after surveys are submitted, how do we ensure existing responses remain linked to the correct version? | Engineering | DB proposal validation |
| 4 | How are **repeatable item instances** stored? Is each item instance a set of `survey_responses` rows linked by an `item_instance_id` foreign key, or is there a separate `survey_item_instances` table? | Engineering | DB proposal validation |
| 5 | Does the **AI Analysis feature** require a per-org feature flag and/or usage metering from day one, or is it open to all orgs in v1? | Product / Engineering | AI Analysis ticket |
| 6 | **Multi-org users** — should a user be able to belong to more than one org? If yes, what is the org-switching UX and is it in scope for v1? | Product | Auth / Permissions ticket |
| 7 | What is the **photo field UX in QC review** — is the reviewer viewing the photo the technician submitted (read), or are they expected to capture their own photo (write)? The prototype shows a camera-capture UI which is likely incorrect for QC context. | Product | QC Editor photo field ticket |
| 8 | Should **AI analysis results** be persisted in the database (so they survive a page refresh) or are they session-only and re-run on each QC session? | Product / Engineering | AI analysis ticket |
| 9 | Is the **COP survey type** (image-heavy layout) a v1 requirement or post-launch? If v1, it needs a separate design pass before ticket generation. | Product | Scoping |
| 10 | What is the **autosave conflict resolution** strategy if two users somehow have the same survey open (e.g. reviewer + admin)? | Engineering | Autosave ticket |

---

## Handoff Checklist

- [ ] `[FEAT-###]` assigned and applied to all related ClickUp task names
- [x] Functional POC in `UI-Overhaul/` — runnable with `npm run dev`
- [ ] Figma exported as images (not applicable — POC is the source of truth)
- [ ] Claude Code conversation summary linked (session transcript available on request)
- [x] Hard requirements written — no guessing required
- [x] Database proposal completed
- [x] Out of scope items listed
- [ ] Open questions resolved or assigned to owners
- [ ] This document linked in the ClickUp feature task
