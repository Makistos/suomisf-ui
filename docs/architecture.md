# Architecture

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 18.3 |
| Language | TypeScript 5.9 |
| Build tool | Vite 5.2 |
| Routing | React Router v6 |
| Component library | PrimeReact 10.6 |
| CSS utilities | PrimeFlex 3.3 |
| Icons | PrimeIcons 7.0, FontAwesome 7.0 |
| HTTP client | Axios 1.12 + axios-retry |
| Server state | TanStack React Query 5 |
| Form state | React Hook Form 7, TanStack React Form 1 |
| Charts | Chart.js 4 + react-chartjs-2 |
| Rich text | Quill 2.0 |
| PDF export | jsPDF + jspdf-autotable |
| Utilities | Lodash 4.17 |
| E2E tests | Playwright 1.55 |

## Project Structure

```
src/
├── api/              # API call functions, one folder per domain entity
├── components/       # Shared global components
│   └── forms/        # Shared form sub-components
├── config/           # App configuration (API routing)
├── features/         # Domain feature modules (see features.md)
├── hooks/            # Custom React hooks
├── services/         # HTTP service layer and auth utilities
├── types/            # Shared TypeScript type definitions / enums
├── utils/            # Miscellaneous helper functions and UI utilities
├── App.tsx           # Root layout component
├── App.css           # Global styles
├── home.tsx          # Landing page
├── faq.tsx           # FAQ / About page
└── index.tsx         # Entry point: ReactDOM + router + QueryClient
```

### Feature Module Layout

Each domain feature under `src/features/<name>/` follows this structure:

```
features/<name>/
├── types/       # TypeScript interfaces for this domain
├── routes/      # Page components (top-level route handlers)
├── components/  # UI components specific to this feature
└── utils/       # Helper functions for this feature
```

## Path Aliases

Configured in `tsconfig.json` and mirrored in `vite.config.ts`:

| Alias | Resolves to |
|---|---|
| `@api/*` | `src/api/` |
| `@components/*` | `src/components/` |
| `@features/*` | `src/features/` |
| `@services/*` | `src/services/` |
| `@types/*` | `src/types/` |
| `@utils/*` | `src/utils/` |
| `@hooks/*` | `src/hooks/` |

## Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_SITE_URL` | Public base URL of the frontend |
| `VITE_API_URL` | Base URL of the primary (legacy) API |
| `VITE_NEW_API_URL` | Base URL of the new API (migration in progress) |
| `VITE_IMAGE_URL` | Base URL for image assets served by the API |

**Development (`.env`):**
```
VITE_SITE_URL=http://localhost:3000/
VITE_API_URL=http://localhost:5000/api/
VITE_NEW_API_URL=http://localhost:5050/api/
VITE_IMAGE_URL=http://localhost:5000/
```

**Production (`.env.production`):**
```
VITE_SITE_URL=https://www.sf-bibliografia.fi/
VITE_API_URL=https://www.sf-bibliografia.fi:5000/api/
VITE_IMAGE_URL=https://www.sf-bibliografia.fi:5000/
```

## Routing

All routes are declared in `src/index.tsx` inside a `<BrowserRouter>`.

| Path | Page |
|---|---|
| `/` | Home / landing |
| `/bookindex` | Book / work search |
| `/shortstoryindex` | Short story search |
| `/nonfiction` | Non-fiction works (filtered view) |
| `/works/:id` | Work details |
| `/editions/:id` | Edition details |
| `/shorts/:id` | Short story details |
| `/magazines` | Magazine list |
| `/magazines/:id` | Magazine details |
| `/issues/:id` | Issue details |
| `/articles/:id` | Article details |
| `/people` | People list |
| `/people/:id` | Person details |
| `/publishers` | Publisher list |
| `/publishers/:id` | Publisher details |
| `/bookseries` | Book series list |
| `/bookseries/:id` | Book series details |
| `/pubseries` | Publisher series list |
| `/pubseries/:id` | Publisher series details |
| `/tags` | Tag list |
| `/tags/:id` | Tag details |
| `/awards` | Award list |
| `/awards/:id` | Award details |
| `/stats` | Statistics dashboard |
| `/changes` | Change log |
| `/latest` | Latest additions |
| `/faq` | FAQ / About |
| `/login` | Login dialog |
| `/users/:id` | User profile |
| `*` | 404 Not Found |

## State Management

| Concern | Solution |
|---|---|
| Server data (fetching / caching) | TanStack React Query |
| Form state | React Hook Form / TanStack React Form |
| Navigation / URL state | React Router |
| Auth tokens | `localStorage` |
| Local UI state (dialogs, pagination) | `useState` / `useReducer` |
