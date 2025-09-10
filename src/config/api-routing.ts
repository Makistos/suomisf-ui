/**
 * Configuration for API endpoint routing between old and new APIs
 *
 * For each endpoint, specify which HTTP methods are supported by the new API
 * Omit methods that should still use the old API
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface ApiEndpointConfig {
    supportedMethods: HttpMethod[];
    /** Whether this endpoint supports parameterized paths (e.g., /works/123) */
    supportsParameters?: boolean;
}

const newApiEndpoints: Record<string, ApiEndpointConfig> = {
    // Tag-related endpoints
    // 'tagsquick': {
    //     supportedMethods: ['GET']
    // },
    // 'tags': {
    //     supportedMethods: ['GET']
    // },
    // 'tags/:id': {
    //     supportedMethods: ['GET'],
    //     supportsParameters: true
    // },

    // Work-related endpoints
    // 'works': {
    //     supportedMethods: ['GET']
    // },
    // 'works/:id': {
    //     supportedMethods: ['GET'],
    //     supportsParameters: true
    // },
    // 'people/:id': {
    //     supportedMethods: ['GET'],
    //     supportsParameters: true
    // },

    // Multi-level parameterized endpoints (can be enabled independently)
    // 'people/:id/awards': {
    //     supportedMethods: ['GET'],
    //     supportsParameters: true
    // },

    // Example entries (commented out):
    // 'users': {
    //     supportedMethods: ['GET', 'POST'] // Only GET and POST supported in new API
    // },
    // 'users/:id': {
    //     supportedMethods: ['GET', 'PUT', 'DELETE'], // Individual user operations
    //     supportsParameters: true
    // },
    // 'editions': {
    //     supportedMethods: ['GET', 'POST', 'PUT', 'DELETE'] // Full CRUD support
    // },
    // 'editions/:id': {
    //     supportedMethods: ['GET', 'PUT', 'DELETE'], // Individual edition operations
    //     supportsParameters: true
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
    // Extract the path from the URL (remove query parameters and leading slashes)
    const path = url.split('?')[0].replace(/^\/+/, '');
    const pathSegments = path.split('/').filter(segment => segment.length > 0);

    if (pathSegments.length === 0) {
        return false;
    }

    // Try exact match first (for non-parameterized endpoints)
    const exactEndpoint = pathSegments.join('/');
    const exactConfig = newApiEndpoints[exactEndpoint];

    if (exactConfig && exactConfig.supportedMethods.includes(method)) {
        return true;
    }

    // Create the specific parameterized pattern for this exact path structure
    let targetPattern = '';

    for (let i = 0; i < pathSegments.length; i++) {
        if (i > 0) targetPattern += '/';

        // Assume segments at positions 1, 3, 5, etc. (odd indices) could be IDs
        // if they look like IDs (alphanumeric)
        if (i % 2 === 1 && /^[a-zA-Z0-9-_]+$/.test(pathSegments[i])) {
            targetPattern += ':id';
        } else {
            targetPattern += pathSegments[i];
        }
    }

    // Only try the exact pattern that matches this path structure
    const config = newApiEndpoints[targetPattern];

    if (config && config.supportsParameters && config.supportedMethods.includes(method)) {
        return true;
    }

    // ONLY as a fallback, try the base endpoint for single-segment paths
    if (pathSegments.length === 1) {
        const baseEndpoint = pathSegments[0];
        const baseConfig = newApiEndpoints[baseEndpoint];

        if (baseConfig && baseConfig.supportedMethods.includes(method)) {
            return true;
        }
    }

    return false;
};

/**
 * Legacy function for backward compatibility - assumes GET method
 * @deprecated Use shouldUseNewApi(url, method) instead
 */
export const shouldUseNewApiLegacy = (url: string): boolean => {
    return shouldUseNewApi(url, 'GET');
};

/**
 * Get detailed information about API routing for debugging
 * @param url The API endpoint URL
 * @param method The HTTP method being used
 * @returns object with routing details
 */
export const getApiRoutingInfo = (url: string, method: HttpMethod = 'GET') => {
    const path = url.split('?')[0].replace(/^\/+/, '');
    const pathSegments = path.split('/').filter(segment => segment.length > 0);

    if (pathSegments.length === 0) {
        return { useNewApi: false, matchedPattern: null, reason: 'Empty path' };
    }

    // Try exact match first
    const exactEndpoint = pathSegments.join('/');
    const exactConfig = newApiEndpoints[exactEndpoint];

    if (exactConfig && exactConfig.supportedMethods.includes(method)) {
        return {
            useNewApi: true,
            matchedPattern: exactEndpoint,
            reason: 'Exact match',
            config: exactConfig
        };
    }

    // Create the specific parameterized pattern for this exact path structure
    let targetPattern = '';

    for (let i = 0; i < pathSegments.length; i++) {
        if (i > 0) targetPattern += '/';

        // Assume segments at positions 1, 3, 5, etc. (odd indices) could be IDs
        if (i % 2 === 1 && /^[a-zA-Z0-9-_]+$/.test(pathSegments[i])) {
            targetPattern += ':id';
        } else {
            targetPattern += pathSegments[i];
        }
    }

    const config = newApiEndpoints[targetPattern];

    if (config && config.supportsParameters && config.supportedMethods.includes(method)) {
        return {
            useNewApi: true,
            matchedPattern: targetPattern,
            reason: 'Parameterized pattern match',
            config: config
        };
    }

    // ONLY as a fallback, try the base endpoint for single-segment paths
    if (pathSegments.length === 1) {
        const baseEndpoint = pathSegments[0];
        const baseConfig = newApiEndpoints[baseEndpoint];

        if (baseConfig && baseConfig.supportedMethods.includes(method)) {
            return {
                useNewApi: true,
                matchedPattern: baseEndpoint,
                reason: 'Base endpoint match',
                config: baseConfig
            };
        }
    }

    return {
        useNewApi: false,
        matchedPattern: null,
        reason: 'No matching endpoint configuration found',
        checkedPatterns: [exactEndpoint, targetPattern, pathSegments.length === 1 ? pathSegments[0] : null].filter(Boolean)
    };
};
