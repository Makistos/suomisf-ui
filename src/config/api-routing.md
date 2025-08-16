# API Routing System

This system allows you to automatically route API calls between the old and new APIs based on a configuration dictionary that specifies which HTTP methods are supported by each endpoint in the new API.

## How it works

1. **Configuration**: The `src/config/api-routing.ts` file contains a dictionary that maps API endpoints to their supported HTTP methods in the new API.

2. **Automatic routing**: When you make API calls using the service functions, they automatically check the configuration to determine which API to use based on the endpoint and HTTP method.

3. **Override capability**: You can still manually specify which API to use by passing the `newApi` parameter.

## Usage

### Basic usage (automatic routing)
```typescript
import { getApiContent, postApiContent } from "@services/user-service";

// GET request - will use new API if 'tagsquick' supports GET method
const response = await getApiContent("tagsquick", user);

// POST request - will use new API if 'tags' supports POST method
const response = await postApiContent("tags", data, user);
```

### Manual override
```typescript
// Force use of new API regardless of configuration
const response = await getApiContent("tagsquick", user, true);

// Force use of old API regardless of configuration
const response = await getApiContent("tagsquick", user, false);
```

## Adding new endpoints

To configure an endpoint for the new API:

1. Open `src/config/api-routing.ts`
2. Add the endpoint to the `newApiEndpoints` dictionary with supported methods:
   ```typescript
   export const newApiEndpoints: Record<string, ApiEndpointConfig> = {
       'tagsquick': {
           supportedMethods: ['GET']  // Only GET supported
       },
       'tags': {
           supportedMethods: ['GET', 'POST', 'PUT', 'DELETE']  // Full CRUD
       },
       'your-new-endpoint': {
           supportedMethods: ['GET', 'POST']  // Only GET and POST
       },
   };
   ```

## HTTP Method Support

Each endpoint can specify which HTTP methods are supported:
- `GET` - Read operations
- `POST` - Create operations
- `PUT` - Update operations
- `DELETE` - Delete operations

If a method is not listed, the API call will automatically fall back to the old API for that specific operation.

## Supported functions

All API service functions now support automatic routing based on HTTP method:
- `getApiContent(url, user, newApi?)` - Uses GET method
- `postApiContent(url, data, user, newApi?)` - Uses POST method
- `putApiContent(url, data, user, newApi?)` - Uses PUT method
- `deleteApiContent(url, newApi?)` - Uses DELETE method

## Environment variables

Make sure you have both API URLs configured in your environment:
- `VITE_API_URL` - The old API base URL
- `VITE_NEW_API_URL` - The new API base URL

## Examples

```typescript
// Example configuration
export const newApiEndpoints: Record<string, ApiEndpointConfig> = {
    'users': {
        supportedMethods: ['GET', 'POST']  // Only read and create
    },
    'tags': {
        supportedMethods: ['GET', 'POST', 'PUT', 'DELETE']  // Full CRUD
    },
    'readonly-endpoint': {
        supportedMethods: ['GET']  // Read-only
    }
};

// Usage examples:
await getApiContent("users", user);        // → New API (GET supported)
await postApiContent("users", data, user); // → New API (POST supported)
await putApiContent("users", data, user);  // → Old API (PUT not supported)
await deleteApiContent("users");           // → Old API (DELETE not supported)
```
