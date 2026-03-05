# Fishily Quickshot

Fishily Quickshot is a lightweight React app for generating social-ready screenshot graphics with:

- editable title and subtitle
- configurable background color (hex)
- square (`1:1`) and portrait (`4:5`) layouts
- phone placement modes (`Phone bottom` / `Phone top`)
- image upload and PNG export

## Tech stack

- React + TypeScript + Vite
- Vitest + Testing Library (unit tests)
- Playwright (end-to-end UI tests)

## Getting started

### Prerequisites

- Node.js (version from `.nvmrc`)
- npm

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open the local URL printed by Vite.

## Scripts

```bash
npm run dev           # start local dev server
npm run lint          # lint code
npm run test          # unit tests (Vitest)
npm run test:watch    # unit tests in watch mode
npm run coverage      # unit test coverage
npm run build         # type-check + production build
npm run preview       # preview production build
```

### Playwright E2E

Install browser binaries once:

```bash
npm run test:e2e:install
```

Run E2E:

```bash
npm run test:e2e
```

Other modes:

```bash
npm run test:e2e:headed
npm run test:e2e:ui
```

Playwright artifacts are written to `output/playwright/`:

- HTML report: `output/playwright/html-report`
- Test results and screenshots: `output/playwright/test-results`

## CI/CD (GitHub Actions)

This repo uses one workflow at `.github/workflows/deploy.yml` with two jobs:

- `ci`
  - runs on pull requests to `main` and pushes to `main`
  - runs lint, unit tests, Playwright e2e, and build
- `deploy`
  - runs only on push to `main`
  - depends on successful `ci`
  - deploys the built `dist/` artifact to GitHub Pages

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
