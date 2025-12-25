
import { useState, useEffect } from 'react';
import { fetchMetrics, MetricsData } from '../api/metrics';

export function useEngine() {
    const [data, setData] = useState<MetricsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        let interval: number;
        let retryCount = 0;

        const load = async (silent = false) => {
            if (!silent) setLoading(true);
            const res = await fetchMetrics();
            if (!mounted) return;

            const now = new Date().toLocaleTimeString();

            if (res.data) {
                if (error || loading) {
                    console.info(`%c[Engine] Status: ONLINE | Updated: ${now} | Retries: ${retryCount}`, 'color: #4ade80; font-weight: bold;');
                }
                setData(res.data);
                setError(null);
                retryCount = 0; // Reset retries on success
            } else if (res.error) {
                retryCount++;
                console.warn(`%c[Engine] Status: OFFLINE | Last: ${now} | Retry: #${retryCount} (${res.error})`, 'color: #f87171; font-weight: bold;');
                setError(res.error);
            }
            if (!silent) setLoading(false);
        };

        // Initial Load
        load();

        // Polling 5s
        interval = window.setInterval(() => {
            load(true);
        }, 5000);

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    return { data, loading, error };
}
