# Release v0.1.16 — Dashboard Overhaul & Table Fix

## 🎨 Dashboard Redesign (reui.io)

- **MetricCard** redesigned using reui.io `c-card-15` stat card pattern
  - Title + icon header layout
  - Trend badge with `success-light` variant
  - Separator between value and description
  - Tabular-nums for clean number alignment
- **Badge** component updated with reui.io variants
  - New variants: `success`, `success-light`, `warning`, `warning-light`, `info`, `info-light`, `destructive-light`
  - New props: `size` (xs/sm/default/lg/xl), `radius` (default/full)
  - CSS variables: `--badge-success`, `--badge-warning`, `--badge-info` with dark mode
- **Quick action cards** added using reui.io `c-card-17` pattern
  - Icon, title, description, chevron link
  - Navigasi cepat ke Siswa, Kelas, Export, Jadwal
- **Hero card** redesigned with gradient background and decorative element
- **Class overview sidebar** with class summary card (student count, today's entries)

## 🐛 Fixes

- **Attendance table sticky columns**
  - Fixed "Jam 1" header cut off by sticky Siswa column
  - Replaced heavy `border-right: 2px` with subtle `box-shadow: inset -1px`
  - Fixed z-index hierarchy (header: 3, sticky columns: 2, corner: 4)
  - Solid backgrounds on sticky columns to properly hide scrolling content
- **Dashboard layout**
  - Metric cards now equal height (`height: 100%` + grid `align-items: stretch`)
  - Hero card no longer cut off (padding override with `!important`)
  - Class overview card stretches to match hero card height
- **Quick action cards** hover state: title color transitions to primary

## 📦 Technical

- Added `Separator` and `ChevronRight` Lucide icon imports
- Added reui.io badge CSS variables in `:root` and `.dark` blocks
- Responsive breakpoint handles new dashboard grid properly

## Files Changed

| File | Changes |
|------|---------|
| `src/App.tsx` | MetricCard, dashboard view, quick actions, class overview |
| `src/components/ui/badge.tsx` | reui.io badge variants and props |
| `src/styles.css` | Dashboard CSS, table fixes, badge tokens |
