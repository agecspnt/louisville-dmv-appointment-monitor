# Contributing Guide

Thanks for contributing to DMV Appointment Monitor.

## Before You Start

- Review [README.md](./README.md) for setup and architecture.
- Read [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
- For security reports, use [SECURITY.md](./SECURITY.md) instead of public issues.

## Development Setup

```bash
npm install
npx playwright install chromium
npm run test
npm run start
```

## Branch and PR Workflow

1. Fork the repository and create a feature branch from `main`.
2. Keep changes focused and atomic.
3. Add or update tests for behavioral changes.
4. Ensure `npm run test` passes locally.
5. Open a pull request with clear context, screenshots (if UI changes), and test notes.

## Commit Message Recommendation

Conventional commits are preferred:

- `feat: add ...`
- `fix: handle ...`
- `docs: update ...`
- `test: cover ...`
- `chore: ...`

## Pull Request Checklist

- [ ] Scope is clear and minimal.
- [ ] Tests are added/updated and passing.
- [ ] No secrets, keys, or personal data included.
- [ ] Documentation updated where needed.

## Coding Standards

- Keep modules small and focused.
- Prefer clear names and explicit behavior over clever abstractions.
- Fail safely on network/automation errors.
- Preserve existing IPC and security boundaries (`contextIsolation`, no renderer Node integration).
