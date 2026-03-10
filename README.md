# SuomiSF UI — Documentation

SuomiSF (*Suomalainen Science Fiction*) is a Finnish-language bibliographic database for speculative fiction. This React frontend provides browsing, searching, and contributing to the database, including books, short stories, magazines, authors, publishers, and more.

Production site: [sf-bibliografia.fi](https://www.sf-bibliografia.fi/)

## Contents

| Document | Description |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Tech stack, project structure, path aliases, environment variables |
| [docs/features.md](docs/features.md) | Domain feature modules and their responsibilities |
| [docs/components.md](docs/components.md) | Shared and feature-level UI components |
| [docs/api.md](docs/api.md) | API integration, authentication, data fetching patterns |
| [docs/development.md](docs/development.md) | Local setup, scripts, testing, deployment |

## Quick Start

```bash
npm install
npm start        # Dev server on http://localhost:3000
npm run build    # Production build → build/
npm run lint     # ESLint
npm run test:e2e # Playwright E2E tests
```

Requires a local backend API server on port 5000 (and optionally 5050 for the new API).
See [docs/development.md](docs/development.md) for full setup details.
