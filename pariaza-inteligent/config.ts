/**
 * Centralized API Configuration
 * Ensures scalability across environments (Dev, Staging, Prod)
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const getApiUrl = (endpoint: string) => {
    const base = API_BASE_URL.replace(/\/$/, '');
    const path = endpoint.replace(/^\//, '');
    return `${base}/${path}`;
};
