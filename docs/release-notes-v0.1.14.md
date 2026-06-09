# Absen Kelas v0.1.14

Professional UI refresh release.

## What's new

- Refreshed the desktop app shell with a more polished sidebar, navigation state, workspace background, and card surfaces.
- Improved the global header, save status, buttons, inputs, selects, and file-button styling so controls feel more consistent across the app.
- Upgraded the Input Absensi screen with a clearer toolbar, stronger sticky student column, more readable attendance grid, and calmer status colors.
- Improved attendance cell note inputs and focus states for repeated daily data entry.
- Added `redesign-ui.md` as the staged UI redesign plan for the remaining visual refresh tasks.
- Fixed a date-dependent attendance test so monthly recap expectations do not change when the current date falls in the tested month.
- Synced package, lockfile, and Tauri metadata to version `0.1.14`.

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
