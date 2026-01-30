/**
 * Korosoft Modules - API Client
 */
const API = (() => {
    const BASE_URL = 'https://modules-api.loonbac-dev.moe';
    let accessToken = null;

    const setToken = (token) => {
        accessToken = token;
        localStorage.setItem('access_token', token);
    };

    const getToken = () => accessToken || localStorage.getItem('access_token');
    const clearToken = () => {
        accessToken = null;
        localStorage.removeItem('access_token');
    };

    let isRefreshing = false;

    const request = async (endpoint, options = {}) => {
        const url = `${BASE_URL}${endpoint}`;
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const response = await fetch(url, { ...options, headers, credentials: 'include' });

            // Handle 401 - try refresh
            if (response.status === 401 && !endpoint.startsWith('/auth/') && !isRefreshing) {
                isRefreshing = true;
                const refreshed = await refreshToken();
                isRefreshing = false;
                if (refreshed) {
                    headers['Authorization'] = `Bearer ${getToken()}`;
                    return fetch(url, { ...options, headers, credentials: 'include' }).then(r => r.json());
                }
                clearToken();
                window.dispatchEvent(new CustomEvent('auth:logout'));
            }

            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw { status: response.status, message: data.message || 'Error', data };
            return data;
        } catch (error) {
            if (error.status) throw error;
            throw { status: 0, message: 'Error de conexión' };
        }
    };

    const refreshToken = async () => {
        try {
            const data = await request('/auth/refresh', { method: 'POST' });
            if (data.access_token) { setToken(data.access_token); return true; }
            return false;
        } catch { return false; }
    };

    return {
        setToken, getToken, clearToken,
        get: (endpoint) => request(endpoint, { method: 'GET' }),
        post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
        put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
        delete: (endpoint) => request(endpoint, { method: 'DELETE' })
    };
})();

window.API = API;
