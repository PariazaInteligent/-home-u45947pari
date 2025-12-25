import { useState, useEffect } from 'react';
import { API_URL } from '../config';

export interface Signal {
    type: 'PROFIT' | 'PIERDERE' | 'STAKE' | 'DEPUNERE' | 'VOID' | 'PENDING' | 'LIVE';
    label: string;
    amount: string;
    date: string;
    hash: string;
}

export interface PublicMetrics {
    nav: string;
    equity: string;
    lastTradePct: string;
    updatedAt: string;
    edge: string;
    lastTradeImpact: string;
    investorCount?: number;
    totalProfit: string;
    averageRoi?: string;
    monthProfitPct?: string; // [NEW]
    equityGrowth?: string;   // [NEW]
    signals?: Signal[];
}

export const usePublicStats = () => {
    const [metrics, setMetrics] = useState<PublicMetrics | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await fetch(`${API_URL}/public/metrics`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch public metrics: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                setMetrics(data);
                setError(null); // Clear any previous errors on success
            } catch (err: any) {
                console.error('Error fetching public stats:', err);
                setError(err.message || 'Nu se poate conecta la server');
                setMetrics(null); // Ensure metrics is null on error
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
        // Refresh every 30 seconds
        const interval = setInterval(fetchMetrics, 30000);
        return () => clearInterval(interval);
    }, []);

    return { metrics, loading, error };
};
