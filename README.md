# DMV Appointment Monitor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

English (default) | [简体中文](./README.zh-CN.md)

Desktop app built with Electron + Playwright to monitor Kentucky DMV appointment availability.

## App Preview

<p align="center">
  <img src="./docs/images/app-screenshot.png" alt="DMV Appointment Monitor screenshot" width="1100" />
</p>

<p align="center">
  <strong>Live Location Picker</strong> · <strong>Real Earliest Lookup</strong> · <strong>Green Success Logs</strong> · <strong>Bark Push Details</strong>
</p>

> The UI is designed for fast decision-making: select appointment type, choose a live location list, and monitor with earliest availability details visible in status/logs/notifications.

## Highlights

- Supports `Written Test (56)` and `Road Test (55)`.
- After choosing `Appointment Type`, the app fetches all live locations from DMV and lets you select one.
- Real availability check per selected location.
- Real click on `Check Earliest Availability` and extraction of earliest returned info (for example `February 26, 16 available`).
- When availability is found:
  - green success logs in UI
  - desktop notification
  - Bark push notification (with location, status, check time, earliest info)
- Build is test-gated: tests must pass before packaging.

## Requirements

- Node.js `>=20`
- npm

## Quick Start

```bash
npm install
npx playwright install chromium
npm start
```

## Scripts

- `npm test`
  Runs all tests, including live DMV web integration test.
- `npm run test:live`
  Runs only the live DMV integration test.
- `npm run build:win`
  Test-gated Windows build.
- `npm run build:mac`
  Test-gated macOS build.
- `npm run build:all`
  Test-gated platform-aware build helper.

Windows helper:

- `build_auto.bat`
  Installs deps, installs Playwright Chromium, runs tests, then builds.

## Project Layout

- `electron/main.js`: scheduler, notifications, IPC handlers
- `electron/preload.js`: renderer bridge API
- `src/services/monitor.js`: scraping, parsing, location/availability logic
- `src/renderer/*`: UI
- `tests/*.test.js`: unit and live integration tests

## Notes

- This tool does not guarantee getting an appointment.
- Users are responsible for following DMV website terms and local regulations.

## macOS Release Signing

To avoid macOS showing the app as damaged, release builds must be signed and notarized.

Set these repository secrets for the `Release Installers` workflow:

- `CSC_LINK`
- `CSC_KEY_PASSWORD`
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

Report vulnerabilities via [SECURITY.md](./SECURITY.md).

## License

MIT. See [LICENSE](./LICENSE).
