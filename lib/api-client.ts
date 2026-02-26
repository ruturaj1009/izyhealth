const API_BASE = '/api/v1';

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

async function apiRequest(endpoint: string, options: RequestOptions = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const orgid = typeof window !== 'undefined' ? localStorage.getItem('orgid') : null;

    // Don't set Content-Type for FormData - browser will set it with boundary
    const isFormData = options.body instanceof FormData;

    const headers: Record<string, string> = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(orgid ? { 'x-org-id': orgid } : {}),
        ...options.headers
    };

    const url = endpoint.startsWith('http')
        ? endpoint
        : (endpoint.startsWith('/api') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`);

    let response = await fetch(url, {
        ...options,
        headers
    });

    // Handle Token Expiry
    if (response.status === 401) {
        // Attempt Refresh
        try {
            const refreshRes = await fetch('/api/auth/refresh', {
                method: 'POST',
                credentials: 'include'
            });
            if (refreshRes.ok) {
                const data = await refreshRes.json().catch(() => ({}));
                if (data.accessToken) {
                    // Update Local Storage
                    localStorage.setItem('token', data.accessToken);

                    // Retry Original Request
                    const newHeaders = {
                        ...headers,
                        'Authorization': `Bearer ${data.accessToken}`
                    };

                    response = await fetch(url, {
                        ...options,
                        headers: newHeaders
                    });
                }
            } else {
                // Refresh failed - redirect to logic
                if (typeof window !== 'undefined') {
                    // console.error("Token refresh failed with status:", refreshRes.status);
                    const errorData = await refreshRes.json().catch(() => ({}));
                    // console.error("Refresh error details:", errorData);

                    // Clear all local storage
                    localStorage.removeItem('token');
                    localStorage.removeItem('orgid');
                    localStorage.removeItem('role');
                    localStorage.removeItem('user');
                    localStorage.removeItem('labName');

                    window.location.href = '/login';
                }
            }
        } catch (error) {
            // console.error("Auto-refresh failed", error);
        }
    }

    const data = await response.text();

    try {
        // Only try to parse if there's content and it looks like it could be JSON
        if (data && (data.startsWith('{') || data.startsWith('['))) {
            return JSON.parse(data);
        }

        // If it's not JSON but request was OK, return as text or null
        if (response.ok) return data;

        // If request failed and we got something else (like HTML), throw clear error
        // console.error(`API Error [${response.status}] at ${url}:`, data.substring(0, 100));
        return {
            status: response.status,
            error: `Server returned non-JSON response (${response.status})`,
            details: data.substring(0, 100)
        };
    } catch (err) {
        // console.error(`Failed to parse JSON for ${url}:`, err);
        return {
            status: response.status,
            error: "Failed to parse server response",
            details: data.substring(0, 100)
        };
    }
}

export const api = {
    get: (endpoint: string) => apiRequest(endpoint, { method: 'GET' }),
    post: (endpoint: string, body: any) => {
        // If body is FormData, pass it directly; otherwise stringify
        const requestBody = body instanceof FormData ? body : JSON.stringify(body);
        return apiRequest(endpoint, { method: 'POST', body: requestBody });
    },
    put: (endpoint: string, body: any) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint: string) => apiRequest(endpoint, { method: 'DELETE' }),
};
