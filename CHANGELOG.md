# Changelog

All notable changes to this project are documented in this file.

The format is based on Keep a Changelog and this project follows Semantic
Versioning.

## [1.0.3] - 2026-07-05

### Fixed

- Fixed an auto-booking navigation race where the DMV page could navigate while Playwright was still evaluating the `Select In Person Appointment` JavaScript link.

## [1.0.2] - 2026-06-21

### Added

- Real auto-booking flow that can open a live DMV slot, fill applicant details, and optionally auto-submit.
- `Book Earliest Now` action for immediate booking attempts.
- In-app applicant fields for first name, last name, email, phone, and text message preference.

### Changed

- Windows release builds now bundle a hermetic Playwright Chromium runtime so packaged apps do not depend on a per-user browser cache.
- Build scripts, CI workflows, and release workflows now install Playwright browsers through the hermetic packaging path.
- README documentation updated for auto-booking and Windows packaging behavior.

## [1.0.0] - 2026-02-23

### Added

- Electron desktop UI for DMV appointment monitoring.
- Playwright-based availability checks for permit and road test appointment flows.
- Continuous monitoring with randomized interval jitter.
- Bark and desktop notification integrations.
- Cross-platform packaging with electron-builder.
