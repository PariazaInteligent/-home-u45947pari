/**
 * API Service - Mock Fetch cu Loading State
 * Pas 7.1: Endpoint fake, timeout, loading simulation
 */

export interface MetricsData {
    nav: number;
    equity: number;
    lastTrade: number;
    edge: string;
    lastTradeImpact: string;
}

export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    loading: boolean;
}

// Task 13: Real Data Wiring (Env Var)
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/public/metrics';

/**
 * Fetch metrici - Real Data Implementation
 * Endpoint: GET /public/metrics (via VITE_API_BASE_URL)
 */
export async function fetchMetrics(): Promise<ApiResponse<MetricsData>> {
    try {
        const res = await fetch(API_URL);

        if (!res.ok) {
            throw new Error(`API Error: ${res.status} ${res.statusText}`);
        }

        const rawData = await res.json();

        // Robust Parsing (Task 14 Fix)
        // Handle undefined/null keys safely to prevent silent crashes
        const safeNav = typeof rawData.nav === 'string' ? rawData.nav : String(rawData.nav || 0);
        const safeEquity = typeof rawData.equity === 'string' ? rawData.equity : String(rawData.equity || 0);
        const safeLastTrade = typeof rawData.lastTradePct === 'string' ? rawData.lastTradePct : String(rawData.lastTradePct || 0);
        const safeEdge = typeof rawData.edge === 'string' ? rawData.edge : String(rawData.edge || 0);
        const safeLastTradeImpact = typeof rawData.lastTradeImpact === 'string' ? rawData.lastTradeImpact : String(rawData.lastTradeImpact || 0);

        return {
            data: {
                nav: parseFloat(safeNav) || 0,
                equity: parseFloat(safeEquity.replace(/,/g, '')) || 0,
                lastTrade: parseFloat(safeLastTrade.replace('%', '')) || 0,
                edge: safeEdge,
                lastTradeImpact: safeLastTradeImpact,
            },
            error: null,
            loading: false,
        };
    } catch (error) {
        // Ensure error state is clear for UI fallback
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Network Error',
            loading: false,
        };
    }
}

/**
 * Hook pentru loading state management
 */
export function createLoadingState() {
    let loading = true;
    let data: MetricsData | null = null;
    let error: string | null = null;

    return {
        get loading() { return loading; },
        get data() { return data; },
        get error() { return error; },

        async load() {
            loading = true;
            const response = await fetchMetrics();
            loading = response.loading;
            data = response.data;
            error = response.error;
            return response;
        },
    };
}
