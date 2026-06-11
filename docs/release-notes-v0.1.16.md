# Absen Kelas v0.1.16

Dashboard overhaul with reui.io component patterns and attendance table fixes.

## What's new

- Redesigned the Dashboard metric cards using the reui.io `c-card-15` stat card pattern with trend badge, separator, and icon-header layout.
- Updated the Badge component with reui.io variants (`success-light`, `warning-light`, `info-light`, `destructive-light`) and new `size` and `radius` props.
- Added quick action cards on the Dashboard using the reui.io `c-card-17` pattern with icon, title, description, and chevron link.
- Redesigned the hero card with a green gradient background, decorative element, and improved typography.
- Added a class overview sidebar card showing student count and today's attendance entries per class.
- Added reui.io badge CSS variables (`--badge-success`, `--badge-warning`, `--badge-info`) with dark mode support.
- Fixed attendance table sticky columns: "Jam 1" header no longer cut off by the sticky Siswa column.
- Replaced heavy `border-right: 2px` on sticky columns with subtle `box-shadow: inset -1px` for cleaner separators.
- Fixed z-index hierarchy for sticky table headers and columns.
- Fixed metric cards not having equal height in the top row.
- Fixed hero card being cut off on the left side due to padding conflict with the workspace-card base class.
- Fixed class overview card not stretching to match the hero card height.

## Download

- Windows: download file `.exe` or `.msi`.
- macOS: download file `.dmg`.

## Important macOS note

The macOS build is still unsigned and not notarized by Apple. Gatekeeper may show:

- `"Absen Kelas" Not Opened`
- `Apple could not verify "Absen Kelas" is free of malware`

This is expected for the current open-source build because the project does not yet use Apple Developer
signing and notarization.

macOS install guide:
<https://github.com/ahmadghaisanfad2/absen-kelas/blob/main/docs/install-macos.md>
