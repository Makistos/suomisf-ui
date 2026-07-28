Application uses PrimeReact component library. Always suggest components in it if suitable components are available.

## Architecture

- This is the frontend (React + TypeScript + Vite). The backend is a separate
  checkout at `../suomisf` (Flask + PostgreSQL).
- Dev servers: frontend on http://localhost:3000 (`npm start`), backend API on
  http://localhost:5000. The frontend reads `VITE_API_URL` / `VITE_IMAGE_URL`
  from `.env.development`.
- Run the backend with gunicorn against `wsgi:app` (the `suomisf:app` entrypoint
  is stale and fails to import). It does not auto-reload — after backend `.py`
  changes run `kill -HUP $(cat /tmp/gunicorn.pid)`.
- Backend DB is PostgreSQL, tables in the `suomisf` schema. Schema changes are
  hand-written numbered SQL files in `../suomisf/migrations/NNN_*.sql`, applied
  manually against the dev DB (not Alembic autogenerate).

## Conventions

- Feature-based structure under `src/features/<feature>` (components, routes,
  types, hooks). Shared UI in `src/components`, API helpers in `src/services`
  (`getApiContent` / `postApiContent` / … in `user-service.tsx`) and `src/api`.
- Run `npx tsc --noEmit` to typecheck before committing.
- Admin-only UI is gated with `isAdmin(user)` (role === 'admin').

## Search

- The main search bar (`src/components/mainmenu.tsx`) calls
  `GET /api/search/<term>`; `?titles=1` restricts matching to title/name fields
  (the "Vain nimet" checkbox, on by default, persisted in localStorage). The
  backend uses PostgreSQL full-text search with the Finnish `voikko` config, so
  terms are morphologically stemmed and compounds split (e.g. "maailma" →
  "ilma"). Results carry an author line for works, editions and short stories.

## Pricing (second-hand book prices)

- Price sources are pluggable via the backend provider registry
  `../suomisf/app/price_providers.py` (each source wires search / fetch /
  scrape_single). Current sources: Antikvaari, Antikka, Antikvariaatti, Oranssi
  Planeetta. WooCommerce shops (antikka, oranssiplaneetta) share
  `_scrape_woocommerce` / `_woocommerce_search`.
- The work-page picker is
  `src/features/work/components/antikvaari-product-picker.tsx` (source selector
  order in `SOURCE_ORDER`); stored prices show in
  `src/features/edition/components/edition-prices-dialog.tsx`.
