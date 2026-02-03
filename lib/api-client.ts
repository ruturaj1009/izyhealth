const API_BASE = '/api/v1';

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

async function apiRequest(endpoint: string, options: RequestOptions = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const orgid = typeof window !== 'undefined' ? localStorage.getItem('orgid') : null;

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(orgid ? { 'x-org-id': orgid } : {}),
        ...options.headers
    };

    let response = await fetch(`${endpoint.startsWith('http') ? endpoint : endpoint}`, {
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

                    response = await fetch(`${endpoint.startsWith('http') ? endpoint : endpoint}`, {
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
    post: (endpoint: string, body: any) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint: string, body: any) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint: string) => apiRequest(endpoint, { method: 'DELETE' }),
};
