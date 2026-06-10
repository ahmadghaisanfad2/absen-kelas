# Absen Kelas v0.1.15

UI polish and class ordering release.

## What's new

- Polished the Data Siswa screen with cleaner add/import panels, a tighter toolbar, and more readable editable student tables.
- Polished the Data Kelas screen with a more structured toolbar, stronger table styling, and a manual class-name sort action.
- Added natural class ordering so names like `Kelas 1A`, `Kelas 1B`, `Kelas 2A`, and `Kelas 10A` appear in school-friendly order.
- Applied natural class ordering when adding, renaming, and importing classes.
- Polished the Pengaturan Jam screen with a clearer schedule toolbar, active pattern selector, and more scannable slot rows.
- Fixed schedule creation so a newly added schedule pattern becomes the active visible pattern immediately.
- Ignored local Tauri-generated files that should not be committed.
- Synced package, lockfile, Cargo, and Tauri metadata to version `0.1.15`.

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
