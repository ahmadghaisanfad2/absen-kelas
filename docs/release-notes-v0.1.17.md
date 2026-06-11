# Absen Kelas v0.1.17

Updater reliability release.

## Fixed

- Changed the Settings update flow so the Tauri native updater check is the source of truth for automatic installation.
- Kept GitHub Releases as a manual fallback, but no longer shows the automatic install action unless the desktop updater has found a matching package for the current device.
- Improved update messages for browser preview, unsupported devices, and native updater failures so users are not pushed to manual install without a clearer reason.

## Install

- Windows: download file `.exe` or `.msi`.
- macOS: download file `.dmg`.

Existing users can use **Settings -> Check for Update**. If automatic install is unavailable on the device, use **Download Installer** from the same panel.

macOS install guide:
<https://github.com/ahmadghaisanfad2/absen-kelas/blob/main/docs/install-macos.md>
