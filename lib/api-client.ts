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
            const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
            if (refreshRes.ok) {
                const data = await refreshRes.json();
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
                    // Optional: clear local storage
                    // localStorage.removeItem('token');
                    // window.location.href = '/login'; 
                }
            }
        } catch (error) {
            console.error("Auto-refresh failed", error);
        }
    }

    const data = await response.json();
    return data;
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
