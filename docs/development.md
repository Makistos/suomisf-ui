# Development Guide

## Prerequisites

- Node.js (LTS recommended)
- npm
- A running instance of the SuomiSF backend API on port 5000

## Local Setup

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root (if it does not exist):

   ```
   VITE_SITE_URL=http://localhost:3000/
   VITE_API_URL=http://localhost:5000/api/
   VITE_NEW_API_URL=http://localhost:5050/api/
   VITE_IMAGE_URL=http://localhost:5000/
   ```

3. Start the development server:

   ```bash
   npm start
   ```

   The app is available at http://localhost:3000. The dev server hot-reloads on file changes.

## NPM Scripts

| Script | Description |
|---|---|
| `npm start` / `npm run dev` | Start Vite development server on port 3000 |
| `npm run build` | Type-check and build for production into `build/` |
| `npm run serve` | Preview the production build locally |
| `npm run lint` | Run ESLint on all source files |
| `npm run test:e2e` | Run Playwright end-to-end tests (headless) |
| `npm run test:e2e:ui` | Run Playwright tests in interactive UI mode |

## Project Conventions

### Component Library

The project uses **PrimeReact** as its primary component library. Always check for an existing PrimeReact component before writing a custom one. Use PrimeFlex utility classes for layout instead of custom CSS where possible.

### TypeScript

- Strict mode is enabled.
- Domain types are co-located with their feature module under `features/<name>/types/`.
- Shared primitive types (enums like `Binding`, `Language`, etc.) live in `src/types/`.
- Use the path aliases (e.g., `@features/work`) rather than relative imports across feature boundaries.

### API calls

- Add new API call functions in the relevant `src/api/<feature>/` folder.
- Use the helpers from `src/services/user-service.tsx` (`getApiContent`, `postApiContent`, etc.) rather than calling Axios directly.
- Wrap API calls in `useQuery` / `useMutation` hooks at the component level.

### Forms

- Use **React Hook Form** for straightforward forms.
- Use **TanStack React Form** for more complex, dynamic forms.
- Shared controlled input components are in `src/components/forms/`.

### Authentication-gated UI

Wrap any contributor controls or user-specific actions in a conditional check on the current user:

```tsx
const user = authService.getCurrentUser();
// ...
{user && <ContributorWorkControl />}
```

## New API Migration

A new backend API (port 5050) is being introduced to replace the legacy API. Migration is handled per-endpoint in `src/config/api-routing.ts`:

```typescript
// To migrate an endpoint, add it to the newApiEndpoints list
// Currently all endpoints still point to the legacy API
```

When the new API is ready for an endpoint, add it to the routing config and test the migration before deploying.

## Testing

End-to-end tests use **Playwright**. Test files live in the `tests/` directory (or `e2e/` — check the Playwright config).

```bash
npm run test:e2e          # Headless
npm run test:e2e:ui       # Interactive UI mode for debugging
```

There are currently no unit tests; the project relies on E2E tests and TypeScript's type checker for correctness.

## Building for Production

```bash
npm run build
```

Output is placed in `build/`. The production environment uses `.env.production` values automatically.

TypeScript compilation errors will fail the build. Run `npm run lint` before building to catch any linting issues.
