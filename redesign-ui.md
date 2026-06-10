# Absen Kelas UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mature the Absen Kelas desktop interface so it feels more professional, calmer, and easier to scan while preserving the existing workflow exactly.

**Architecture:** This is a visual refresh of the current React + Vite + Tauri app, not a product workflow redesign. Keep the existing navigation, screens, form fields, save behavior, local storage, Excel import/export, backup/restore, updater, and Tauri commands unchanged. Prefer extracting focused UI components only where it reduces risk in `src/App.tsx`; otherwise keep changes scoped to styling and presentational markup.

**Tech Stack:** React 19, Vite, Tauri 2, TypeScript, Tailwind CSS 4, shadcn/ui primitives, Radix UI, lucide-react, existing CSS in `src/styles.css`.

---

## Non-Negotiable Scope Rules

- Do not change the app workflow: sidebar order, screen names, required steps, import/export behavior, backup/restore behavior, updater behavior, and save behavior must remain the same.
- Do not change data structures in `src/lib/*`.
- Do not change local storage key `absen-kelas:v1`.
- Do not remove current Indonesian copy unless replacing it with equivalent clearer copy for the same function.
- Do not run `shadcn init`; this repo already has shadcn/ui primitives.
- Do not introduce a marketing landing page, onboarding flow, account flow, backend, or analytics.
- Keep the app optimized for desktop/Tauri. Mobile responsiveness can improve, but desktop operator workflow is the priority.
- Keep cards restrained: use cards for repeated objects, panels, forms, and tables; avoid nested cards and decorative card stacks.

## Design Direction

Use a professional school operations look:

- Light workspace with calm neutral surfaces.
- Dark or structured sidebar for orientation, not visual drama.
- Emerald/green as the primary action and saved/local-data signal.
- Subtle amber/red only for warning or destructive states.
- Dense but readable tables, because operators will repeat the same tasks daily.
- Clear toolbar hierarchy: filters first, primary action last.
- Stronger status affordances for attendance states.
- More consistent spacing, radii, borders, type scale, icon sizing, and focus states.

Avoid:

- Fintech dashboard styling copied directly from the shadcn preview.
- Oversized hero sections.
- Decorative gradients, blobs, glassmorphism, and excessive shadows.
- Replacing table-driven workflows with card grids.
- Any redesign that makes input absensi slower.

## Current UI Map

Primary files:

- `src/App.tsx`: current screen rendering, navigation, page header, attendance grid, data tables, settings panels.
- `src/styles.css`: global theme tokens, shell layout, cards, toolbars, tables, attendance grid, responsive rules.
- `src/components/ui/button.tsx`: shadcn button variants used across the app.
- `src/components/ui/card.tsx`: shadcn card primitive used for metrics and tables.
- `src/components/ui/input.tsx`: shadcn input primitive.
- `src/components/ui/select.tsx`: shadcn select primitive.
- `src/components/ui/table.tsx`: shadcn table primitive.
- `src/components/ui/badge.tsx`: existing badge primitive used in Settings.

Screens to preserve:

- Dashboard
- Input Absensi
- Data Siswa
- Data Kelas
- Pengaturan Jam
- Rekap & Export
- Pengaturan

## Proposed File Structure

Start conservative. Extract components only after the shell and visual tokens are stable.

- Modify: `src/styles.css`
  - Own visual tokens, shell layout, cards, tables, toolbars, focus states, status colors, responsive polish.
- Modify: `src/App.tsx`
  - Presentational markup only where needed for better structure, icons, labels, and classes.
- Optional create: `src/components/app/AppShell.tsx`
  - Extract sidebar and main shell after Task 2 if `App.tsx` becomes harder to manage.
- Optional create: `src/components/app/PageHeader.tsx`
  - Extract current `PageHeader` after Task 3 if header styling needs clearer ownership.
- Optional create: `src/components/app/EmptyState.tsx`
  - Standardize empty states after table styling is complete.
- Optional create: `src/components/app/StatusPill.tsx`
  - Standardize attendance status visuals if select styling becomes repetitive.

Do not create all optional files upfront. Create them only when a task needs them.

---

## Task 1: Baseline Audit And Safety Checks

**Files:**
- Read: `src/App.tsx`
- Read: `src/styles.css`
- Read: `src/lib/storage.ts`
- Read: `src/lib/attendance.ts`
- Read: `package.json`

- [x] **Step 1: Capture current git state**

Run:

```bash
git status --short
```

Expected: note existing user changes before editing. Do not revert unrelated changes.

- [x] **Step 2: Run current checks**

Run:

```bash
npm test
npm run build
```

Expected: both pass before UI work starts. If a pre-existing failure appears, document it in the execution notes before making UI changes.

- [x] **Step 3: Start the app for visual baseline**

Run:

```bash
npm run dev
```

Expected: Vite serves the app at `http://127.0.0.1:1420`.

- [ ] **Step 4: Capture baseline screenshots**

Capture these screens before editing:

- Dashboard
- Input Absensi
- Data Siswa
- Rekap & Export
- Pengaturan

Expected: screenshots are used only for comparison. Do not commit screenshots unless explicitly requested.

---

## Task 2: Theme Tokens And App Shell

**Files:**
- Modify: `src/styles.css`
- Modify only if necessary: `src/App.tsx`

Goal: make the first impression more polished without changing navigation behavior.

- [x] **Step 1: Refine root tokens**

Update `:root` in `src/styles.css` to define a consistent product palette:

- `--background`: calm light app background.
- `--surface`: main white panel surface.
- `--surface-soft`: subtle tinted surface for grouped metadata.
- `--border`: quiet but visible separator.
- `--text`: high-contrast main text.
- `--app-muted`: secondary text.
- `--primary`: main action green.
- `--danger`: destructive action.
- `--shadow`: softer and less floaty than the current large shadow.

Expected: existing shadcn variables still map to these colors and all current components remain readable.

- [x] **Step 2: Mature `.app-shell` and `.main-panel`**

Adjust shell spacing so the app feels like a desktop workspace:

- Sidebar fixed at a comfortable width.
- Main panel scroll remains intact.
- Main content has consistent max-width.
- Background does not look like a marketing page.

Expected: all existing routes still render in the same sidebar order.

- [x] **Step 3: Improve sidebar visual hierarchy**

Polish:

- Brand block alignment.
- Institution name truncation.
- Nav item active state.
- Nav item hover state.
- Sidebar note.

Expected: clicking every sidebar item still switches the same `activeView` as before.

- [x] **Step 4: Verify**

Run:

```bash
npm run build
```

Expected: build passes.

---

## Task 3: Header, Save State, Buttons, Inputs

**Files:**
- Modify: `src/styles.css`
- Modify if needed: `src/App.tsx`
- Modify if needed: `src/components/ui/button.tsx`
- Modify if needed: `src/components/ui/input.tsx`

Goal: make the global chrome feel deliberate and consistent.

- [x] **Step 1: Polish `PageHeader` visuals**

Improve:

- Heading size and weight.
- Description line length and color.
- Header action alignment.
- Save status anatomy.

Expected: the save status still announces via `aria-live="polite"` and the Simpan button still calls `handleSaveNow`.

- [x] **Step 2: Standardize button density**

Review existing button variants and sizes:

- Primary actions should be clear but not oversized.
- Outline buttons should read as secondary.
- Icon-only buttons should have stable square dimensions.
- Destructive buttons should be visually distinct without being loud.

Expected: button click handlers in `src/App.tsx` remain unchanged.

- [x] **Step 3: Standardize inputs and selects**

Polish:

- Input height.
- Border color.
- Focus ring.
- Placeholder color.
- Disabled state.
- Select trigger appearance.

Expected: native inputs, shadcn inputs, and shadcn selects feel part of one system.

- [x] **Step 4: Verify**

Run:

```bash
npm test
npm run build
```

Expected: tests and build pass.

---

## Task 4: Dashboard Visual Refresh

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

Goal: make Dashboard a useful command surface without turning it into a marketing hero.

- [ ] **Step 1: Mature metric cards**

Improve `.metric-grid` and `.metric-card`:

- Add clearer label/value hierarchy.
- Keep four metrics in one row on desktop.
- Add subtle separation without heavy shadows.
- Keep values unchanged: Kelas, Siswa, Pola Jam, Entri Hari Ini.

Expected: metric values still come from the same data expressions.

- [ ] **Step 2: Polish the primary shortcut panel**

Improve `.hero-card` so it reads as an operational shortcut:

- Keep title: `Mulai input absensi hari ini`.
- Keep button: `Buka Input Absensi`.
- Keep click target: `setActiveView("attendance")`.

Expected: the Dashboard still guides users to the same Input Absensi flow.

- [ ] **Step 3: Verify**

Run:

```bash
npm run build
```

Expected: build passes and Dashboard has no layout shift at the desktop Tauri window size.

---

## Task 5: Input Absensi Toolbar And Attendance Grid

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

Goal: make the highest-frequency workflow faster to scan and harder to misread.

- [x] **Step 1: Refine attendance toolbar**

Polish `.toolbar-card` for Input Absensi:

- Filters ordered as now: Tanggal, Kelas, Pola Jam, Hadir Semua.
- Label text remains visible.
- Button remains the final action.
- Controls keep stable width.

Expected: changing date/class/schedule and clicking Hadir Semua still works exactly as before.

- [x] **Step 2: Improve sticky student column**

Polish `.sticky-col` and `.student-cell`:

- Student name remains the strongest text.
- NIS remains secondary.
- Sticky column background does not visually tear while scrolling.

Expected: horizontal scrolling still keeps student identity visible.

- [x] **Step 3: Improve attendance status select states**

Refine `.status-select` variants:

- `present`: calm green.
- `excused`: blue or teal.
- `sick`: amber.
- `absent`: red or muted warning.
- `duty`: violet or slate.
- `other`: neutral.

Expected: values still map to `ATTENDANCE_STATUS_OPTIONS` and `statusLabel(option)`.

- [x] **Step 4: Improve note inputs inside cells**

Polish `.cell-note`:

- Compact height.
- Clear focus state.
- Does not make rows feel unstable.

Expected: custom status and notes still update through `onChange`.

- [x] **Step 5: Verify core workflow**

Manual check:

- Open Input Absensi.
- Change date.
- Change class.
- Change schedule.
- Click Hadir Semua.
- Change one student status.
- Add a note.
- Click Simpan.

Expected: same behavior as before, only visually improved.

---

## Task 6: Data Siswa And Editable Tables

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

Goal: make student management feel like a mature admin table, not a raw form dump.

- [x] **Step 1: Polish add/import panels**

Improve the two `.workspace-card` panels in Data Siswa:

- Keep same fields.
- Keep same button labels.
- Keep import template and file import behavior.
- Use clearer spacing and alignment.

Expected: manual add, template download, and Excel import still use the same handlers.

- [x] **Step 2: Improve student toolbar**

Refine `.student-toolbar`:

- Kelas selector remains first.
- Urutkan selector remains second.
- Summary remains visible.

Expected: class filtering and sort mode still work.

- [x] **Step 3: Polish `StudentDataTable`**

Improve:

- Header contrast.
- Row hover.
- Editable inputs inside cells.
- Save/up/down/delete icon button spacing.
- Helper text placement.

Expected: inline edit, save, custom ordering, and delete behavior remain unchanged.

- [x] **Step 4: Verify**

Manual check:

- Add a student.
- Edit name/NIS/gender/note in table.
- Save row.
- Switch sort mode.
- Move a student up/down in custom sort.
- Delete a student.

Expected: same behavior as before.

Additional completed scope:

- [x] Ignore Tauri-generated local files: `src-tauri/Cargo.lock` and `src-tauri/gen`.
- [x] Add natural class ordering so `Kelas 1A`, `Kelas 1B`, `Kelas 2A`, and `Kelas 10A` sort in school-friendly order.
- [x] Add a Data Kelas action to re-sort existing classes by name.

---

## Task 7: Data Kelas And Pengaturan Jam

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

Goal: make configuration screens feel organized while keeping them lightweight.

- [x] **Step 1: Polish Data Kelas toolbar and table**

Improve:

- Add-class input width.
- Add-class button alignment.
- Class table row editing.
- Delete action affordance.

Expected: adding, renaming, and deleting classes still call existing handlers.

- [x] **Step 2: Polish Pengaturan Jam toolbar**

Improve:

- Add schedule input.
- Add schedule button.
- Active pattern selector.
- Add Slot button.

Expected: schedule pattern creation and selection remain unchanged.

- [x] **Step 3: Polish slot rows**

Improve `.slot-list`, `.slot-row`, `.slot-number`, and `.toggle-row`:

- Slot number reads as row position.
- Slot name input is clear.
- Wajib absen checkbox remains easy to scan.
- Delete action is compact.

Expected: adding, renaming, toggling, and deleting slots still work.

- [x] **Step 4: Verify**

Manual check:

- Add class.
- Rename class.
- Add schedule pattern.
- Add slot.
- Rename slot.
- Toggle Wajib absen.
- Delete slot.

Expected: same behavior as before.

Additional completed scope:

- [x] Keep Data Kelas ordering action available from the toolbar.
- [x] Ensure a newly added schedule pattern becomes the active visible pattern immediately after creation.

---

## Task 8: Rekap & Export

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

Goal: make export choices clearer and report preview more report-like.

- [ ] **Step 1: Polish class picker panel**

Improve:

- `Kelas yang diexport` panel structure.
- `Semua Kelas` and `Kelas Aktif` buttons.
- `.class-picker-grid`.
- `.class-check` states.
- Selected count message.

Expected: selected class IDs still update through `setExportClassIds` and `toggleExportClass`.

- [ ] **Step 2: Polish export action cards**

Improve daily/monthly export cards:

- Keep `Rekap Harian`.
- Keep `Rekap Bulanan`.
- Keep export buttons and disabled state.
- Make date/month metadata easier to read.

Expected: Excel export handlers remain unchanged.

- [ ] **Step 3: Polish preview table**

Improve generic `.data-table` styling:

- Numeric columns easier to scan.
- Header remains sticky only if it does not introduce layout risk.
- Empty state remains visible.

Expected: preview still renders monthly rows for the active class.

- [ ] **Step 4: Verify**

Manual check:

- Select all classes.
- Select active class.
- Toggle individual classes.
- Export harian.
- Export bulanan.

Expected: files download as before.

---

## Task 9: Settings, Storage, Update, Backup

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

Goal: make Settings trustworthy and clear, because it explains where data lives.

- [ ] **Step 1: Polish Identitas Lembaga**

Improve:

- Text hierarchy.
- Field layout.
- Input width.

Expected: institution name still updates through `handleInstitutionNameChange`.

- [ ] **Step 2: Polish update card**

Improve `.update-card`, `.update-actions`, `.update-meta`, and `.update-note`:

- Keep all existing buttons.
- Keep existing status messages.
- Make updater state easier to read.

Expected: check update, install update, download installer, and open release still use existing handlers.

- [ ] **Step 3: Polish storage card**

Improve `.storage-card` and `.storage-info-grid`:

- Make folder path readable.
- Keep `Buka Folder Data`.
- Keep `Download Backup JSON`.
- Keep local data explanation visible.

Expected: folder opening and JSON backup still work.

- [ ] **Step 4: Polish backup/restore/reset zone**

Improve:

- Backup and restore cards.
- File upload button.
- Danger zone separation.

Expected: backup, restore, and reset behavior remain unchanged.

- [ ] **Step 5: Verify**

Manual check:

- Change institution name.
- Download backup JSON.
- Restore from backup JSON.
- Open data folder in desktop build.
- Check update.
- Reset data demo only when intentionally testing reset.

Expected: same behavior as before.

---

## Task 10: Empty States, Toasts, Focus, Accessibility

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

Goal: make the app feel finished in edge states.

- [ ] **Step 1: Standardize empty states**

Improve `.empty-state`:

- Works inside attendance table wrapper.
- Works inside data table cards.
- Uses concise Indonesian copy already present.

Expected: empty states remain conditionally rendered exactly as before.

- [ ] **Step 2: Polish toast styling**

Improve `.toast-stack`, `.app-toast`, and `.toast-dismiss`:

- Success/info/error states are distinct.
- Toast does not cover critical controls.
- Dismiss button remains accessible.

Expected: `notify()` behavior remains unchanged.

- [ ] **Step 3: Audit focus states**

Check:

- Sidebar nav buttons.
- Inputs.
- Select triggers.
- Checkbox controls.
- Icon buttons.
- File upload labels.

Expected: keyboard users can see focus clearly.

- [ ] **Step 4: Verify reduced motion**

If transitions are added, wrap them so they respect:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

Expected: no distracting motion is required for app use.

---

## Task 11: Responsive And Tauri Window QA

**Files:**
- Modify: `src/styles.css`
- Modify only if necessary: `src/App.tsx`

Goal: make the UI stable at the app's configured desktop window sizes.

- [ ] **Step 1: Test default Tauri size**

Use configured size from `src-tauri/tauri.conf.json`:

- Width: `1280`
- Height: `820`
- Minimum width: `1040`
- Minimum height: `720`

Expected: no important text overlaps or clips at default size.

- [ ] **Step 2: Test minimum desktop width**

Check around `1040px` width:

- Sidebar remains usable.
- Tables scroll instead of breaking layout.
- Header actions do not overlap title.
- Toolbars wrap cleanly.

Expected: no horizontal overflow outside known table scroll containers.

- [ ] **Step 3: Improve responsive rules**

Adjust existing media queries near the bottom of `src/styles.css`:

- Keep desktop-first design.
- Allow toolbars and split grids to stack where needed.
- Keep table wrappers scrollable.

Expected: UI remains usable at the minimum configured Tauri size.

---

## Task 12: Final Verification And Commit

**Files:**
- Verify: all modified files

- [ ] **Step 1: Run automated checks**

Run:

```bash
npm test
npm run build
```

Expected: both pass.

- [ ] **Step 2: Run desktop app**

Run:

```bash
npm run tauri dev
```

Expected: desktop app opens and points to the same Vite dev URL.

- [ ] **Step 3: Manual workflow regression**

Check these flows:

- Dashboard to Input Absensi.
- Mark all present.
- Change one attendance status.
- Add note.
- Add student.
- Import student template path still available.
- Edit student row.
- Add class.
- Add schedule slot.
- Export daily report.
- Export monthly report.
- Download backup.
- Open data folder.
- Check update state.

Expected: every workflow behaves the same as before.

- [ ] **Step 4: Visual QA checklist**

Confirm:

- Sidebar feels stable and clear.
- Page headers are consistent.
- Tables are readable.
- Attendance statuses are distinct.
- Settings storage information is easier to trust.
- No text overlaps.
- No button label clips.
- No nested card clutter.
- No decorative elements distract from operator tasks.

- [ ] **Step 5: Commit**

Run:

```bash
git status --short
git add src/App.tsx src/styles.css redesign-ui.md
git commit -m "style: refresh Absen Kelas desktop UI"
```

Expected: commit contains only the UI refresh and plan updates.

---

## Suggested Execution Order

Execute in this order and stop after each task for review if the visual direction feels uncertain:

1. Task 1: Baseline Audit And Safety Checks
2. Task 2: Theme Tokens And App Shell
3. Task 3: Header, Save State, Buttons, Inputs
4. Task 5: Input Absensi Toolbar And Attendance Grid
5. Task 6: Data Siswa And Editable Tables
6. Task 4: Dashboard Visual Refresh
7. Task 7: Data Kelas And Pengaturan Jam
8. Task 8: Rekap & Export
9. Task 9: Settings, Storage, Update, Backup
10. Task 10: Empty States, Toasts, Focus, Accessibility
11. Task 11: Responsive And Tauri Window QA
12. Task 12: Final Verification And Commit

Reason for this order: the shell and core controls define the design system, then Input Absensi and Data Siswa validate the highest-frequency operational screens before the lower-risk pages are polished.

## Definition Of Done

- Existing workflow is preserved.
- `npm test` passes.
- `npm run build` passes.
- Tauri dev app opens.
- Core manual workflows pass.
- UI is visibly more professional at `1280x820` and remains usable at `1040x720`.
- No unrelated data/model/export/updater changes are included.
