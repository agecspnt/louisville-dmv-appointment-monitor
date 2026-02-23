# DMV Appointment Monitor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Desktop app built with Electron + Playwright to monitor Kentucky DMV appointment availability for selected appointment types.

## About

`louisville-dmv-appointment-monitor` is an open-source desktop utility focused on one practical goal: helping users in Louisville, Kentucky check DMV appointment availability faster and more consistently.

It combines a local Electron app with Playwright browser automation, so users can:

- run one-time checks when needed
- run continuous monitoring with randomized intervals
- receive desktop and Bark notifications when availability appears

This project is designed for:

- residents who repeatedly check for appointment openings
- contributors interested in reliable desktop automation patterns
- developers who want a clear Electron + Playwright reference architecture

Design principles:

- local-first execution (your checks run on your machine)
- simple, inspectable workflow (no hidden cloud backend)
- fail-safe behavior (error caps, explicit status logs, clear stop controls)

Important boundaries:

- this tool does not bypass authentication or payment systems
- this tool does not guarantee appointment acquisition
- users must comply with DMV website terms and applicable laws

## Features

- One-click manual check (`Check Once`).
- Continuous monitoring mode with randomized intervals to reduce fixed polling patterns.
- Appointment types:
  - `permit` (wizard ID `56`)
  - `road_test` (wizard ID `55`)
- Desktop notifications and optional Bark push notifications.
- Fast shortcut to open the DMV page and auto-fill location search.

## Tech Stack

- Electron (desktop app shell)
- Playwright (browser automation and page parsing)
- GitHub Actions (CI and cross-platform build automation)

## Project Structure

- `electron/main.js`: app lifecycle, scheduling, IPC handlers, notifications
- `electron/preload.js`: secure bridge API exposed to renderer
- `src/renderer/*`: desktop UI
- `src/services/monitor.js`: monitoring and parsing logic
- `scripts/build-all.mjs`: cross-platform build helper
- `.github/workflows/*.yml`: CI and release build pipelines

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm install
npx playwright install chromium
```

### Run Locally

```bash
npm run start
```

### Test

```bash
npm run test
```

## Build

Windows:

```bash
npm run build:win
```

macOS:

```bash
npm run build:mac
```

Build with platform-aware helper:

```bash
npm run build:all
```

Notes:

- On Windows, `build:all` builds Windows artifacts and reminds that macOS artifacts must be built on macOS.
- True parallel multi-OS packaging is handled by GitHub Actions matrix builds.

## CI/CD

- `ci.yml`: runs tests on push and pull requests.
- `build-desktop.yml`: builds Windows and macOS artifacts in parallel, uploads build outputs.

## Security and Responsible Use

- This project is for informational monitoring and convenience.
- Users are responsible for complying with DMV website terms and local regulations.
- Do not abuse remote services with aggressive request rates.

Please report vulnerabilities through [SECURITY.md](./SECURITY.md), not via public issues.

## Contributing

Contributions are welcome. Start with [CONTRIBUTING.md](./CONTRIBUTING.md).

## Code of Conduct

Community participation is governed by [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## License

MIT License. See [LICENSE](./LICENSE).
