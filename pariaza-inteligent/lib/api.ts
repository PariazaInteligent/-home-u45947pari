// API Client for Real Database Data
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface PublicMetrics {
    nav: string;
    equity: string;
    lastTradePct: string;
    edge: string;
    lastTradeImpact: string;
    investorCount: number;
    totalProfit: string;
    averageRoi: string;
    totalStake: string;      // Total stakes (Rulaj)
    totalTrades: number;     // Total trade count
    monthProfitPct: string;
    equityGrowth: string;
    signals: Signal[];
    updatedAt: string;
}

export interface Signal {
    id: string;
    sport: string;
    event: string;
    market: string;
    selection: string;
    odds: number;
    stake: number;
    potentialWin: number;
    pnl: number;
    roi: string;
    status: 'PENDING' | 'SETTLED_WIN' | 'SETTLED_LOSS' | 'SETTLED_VOID' | 'CANCELLED';
    isLive: boolean;
    createdAt: string;
    settledAt: string | null;
    eventStartTime: string | null;
    bookmaker: string | null;
    betCode: string | null;
}

class APIClient {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    async getPublicMetrics(): Promise<PublicMetrics> {
        const response = await fetch(`${this.baseURL}/public/metrics`);

        if (!response.ok) {
            throw new Error(`Failed to fetch metrics: ${response.statusText}`);
        }

        return response.json();
    }

    async sendContactMessage(data: { name: string; email: string; subject: string; message: string }): Promise<{ success: boolean; message: string }> {
        const response = await fetch('https://pariazainteligent.ro/api/contact/send.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Eroare la trimiterea mesajului');
        }

        return response.json();
    }
}

export const apiClient = new APIClient(API_BASE_URL);
