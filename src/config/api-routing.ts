/**
 * Configuration for API endpoint routing between old and new APIs
 *
 * For each endpoint, specify which HTTP methods are supported by the new API
 * Omit methods that should still use the old API
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface ApiEndpointConfig {
    supportedMethods: HttpMethod[];
}

export const newApiEndpoints: Record<string, ApiEndpointConfig> = {
    // Tag-related endpoints
    'tagsquick': {
        supportedMethods: ['GET']
    },
    'tags': {
        supportedMethods: ['GET', 'POST', 'PUT', 'DELETE']
    },

    // Example entries (commented out):
    // 'users': {
    //     supportedMethods: ['GET', 'POST'] // Only GET and POST supported in new API
    // },
    // 'works': {
    //     supportedMethods: ['GET'] // Only read operations supported
    // },
    // 'editions': {
    //     supportedMethods: ['GET', 'POST', 'PUT', 'DELETE'] // Full CRUD support
    // },

    // Add more endpoints here as they are migrated to the new API
};

/**
 * Check if an API call should be routed to the new API
 * @param url The API endpoint URL
 * @param method The HTTP method being used
 * @returns boolean indicating whether to use the new API
 */
export const shouldUseNewApi = (url: string, method: HttpMethod = 'GET'): boolean => {
    // Extract the endpoint from the URL (remove query parameters and leading slashes)
    const endpoint = url.split('?')[0].split('/')[0].replace(/^\/+/, '');
    const config = newApiEndpoints[endpoint];

    if (!config) {
        return false;
    }

    return config.supportedMethods.includes(method);
};

/**
 * Legacy function for backward compatibility - assumes GET method
 * @deprecated Use shouldUseNewApi(url, method) instead
 */
export const shouldUseNewApiLegacy = (url: string): boolean => {
    return shouldUseNewApi(url, 'GET');
};
