# API Integration

## Overview

The application communicates with a Python/Flask backend. There are two API servers:

| Server | URL | Status |
|---|---|---|
| Legacy API | `VITE_API_URL` (port 5000) | Active |
| New API | `VITE_NEW_API_URL` (port 5050) | Migration in progress (currently disabled) |

API routing logic lives in `src/config/api-routing.ts`. Each endpoint can be individually redirected to the new API once it is ready; until then all calls go to the legacy API.

## Service Layer (`src/services/`)

### `user-service.tsx`

Provides generic HTTP helpers used by all feature API modules:

| Function | Method | Auth required |
|---|---|---|
| `getPublicContent(path)` | GET | No |
| `getUserContent(path, user)` | GET | Yes |
| `getApiContent(path, user?)` | GET | Auto (uses token if present) |
| `postApiContent(path, data, user)` | POST | Yes |
| `putApiContent(path, data, user)` | PUT | Yes |
| `deleteApiContent(path, user)` | DELETE | Yes |

All functions return an Axios response promise.

### `auth-service.ts`

Handles login, registration, and token refresh:

| Function | Endpoint | Purpose |
|---|---|---|
| `loginFn(credentials)` | `POST /login` | Authenticate user, store tokens |
| `registerFn(data)` | `POST /register` | Create new account |
| `refreshAccessTokenFn()` | `POST /refresh` | Exchange refresh token for new access token |
| `logoutFn()` | — | Remove tokens from localStorage |

### `auth-header.ts`

Returns the `Authorization: Bearer <token>` header object by reading the stored access token from `localStorage`. Used internally by the service functions above.

## Authentication

Tokens are stored as a JSON object in `localStorage` under the user key.

```json
{
  "id": 42,
  "name": "username",
  "access_token": "...",
  "refresh_token": "..."
}
```

On any 401 response with the message `"Token has expired"`, the service layer automatically calls `refreshAccessTokenFn()`, updates the stored token, and retries the original request.

## Feature API Modules (`src/api/`)

Each domain entity has its own folder with typed fetch/mutation functions. These functions call the service layer helpers and return typed data:

| Folder | Covers |
|---|---|
| `api/work/` | Works (books): list, search, get, create, update, delete |
| `api/short/` | Short stories: list, search, get, create, update, delete |
| `api/edition/` | Editions: get, create, update, delete, ownership, wishlist |
| `api/magazine/` | Magazines: list, get, create, update, delete |
| `api/issue/` | Issues: get, create, update, delete |
| `api/people/` | People: list, get, create, update, delete |
| `api/tag/` | Tags: list, get, create, update |
| `api/award/` | Awards: list, get, create, update |
| `api/bookseries/` | Book series: list, get, create, update |
| `api/pubseries/` | Publisher series: list, get, create, update |
| `api/changed/` | Change log: list recent changes |

## Key API Endpoints

### Authentication
| Method | Path | Description |
|---|---|---|
| POST | `/login` | Log in |
| POST | `/register` | Register |
| POST | `/refresh` | Refresh access token |

### Works
| Method | Path | Description |
|---|---|---|
| GET | `/works` | List all works |
| POST | `/searchworks` | Search works with filters |
| GET | `/works/:id` | Get work details |
| POST | `/works` | Create work |
| PUT | `/works/:id` | Update work |
| DELETE | `/works/:id` | Delete work |

### Editions
| Method | Path | Description |
|---|---|---|
| GET | `/editions/:id` | Get edition details |
| POST | `/editions` | Create edition |
| PUT | `/editions/:id` | Update edition |
| DELETE | `/editions/:id` | Delete edition |
| POST | `/editions/:id/owner` | Mark as owned |
| DELETE | `/editions/:id/owner` | Remove ownership |

### Short Stories
| Method | Path | Description |
|---|---|---|
| GET | `/shorts/:id` | Get short story details |
| POST | `/searchshorts` | Search short stories |

### Magazines & Issues
| Method | Path | Description |
|---|---|---|
| GET | `/magazines` | List magazines |
| GET | `/magazines/:id` | Get magazine details |
| GET | `/issues/:id` | Get issue details |

### People
| Method | Path | Description |
|---|---|---|
| GET | `/people` | List people |
| GET | `/people/:id` | Get person details |

### Search
| Method | Path | Description |
|---|---|---|
| GET | `/search/:query` | Global autocomplete search |
| GET | `/search/works/:query` | Search works |

### Statistics
| Method | Path | Description |
|---|---|---|
| GET | `/stats/genrecounts` | Genre distribution counts |
| GET | `/stats/worksbyyear` | Works published per year |
| GET | `/stats/misc` | Miscellaneous aggregate counts |

## Data Fetching Pattern

All components use **TanStack React Query** (`useQuery` / `useMutation`) to manage server state:

```typescript
// Example: fetching work details
const { data, isLoading, error } = useQuery({
  queryKey: ['work', id],
  queryFn: async () => {
    const response = await getApiContent(`works/${id}`, user);
    return response.data;
  }
});

// Example: mutation (create/update)
const mutation = useMutation({
  mutationFn: (data: WorkFormData) => postApiContent('works', data, user),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['work'] })
});
```

This provides automatic caching, background refetching, and loading/error states without manual state management.
