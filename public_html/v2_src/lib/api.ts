
export interface GlobalStats {
  investors: number;
  historic_profit_ron: string; // returns rounded string
  total_bank: string;
  currency: string;
}

export interface Transaction {
  id: string;
  type: string; // 'PROFIT' | 'PIERDERE' | 'DEPUNERE' | 'RETRAGERE'
  label: string;
  amount: string;
  date: string;
  full_date?: string;
  hash: string;
}

const API_BASE = '/v2/api';

export const api = {
  async getGlobalStats(): Promise<GlobalStats | null> {
    try {
      const res = await fetch(`${API_BASE}/global-stats.php`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      const json = await res.json();
      return json.ok ? json.data : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  async getTransactions(limit = 10, offset = 0, userId?: number): Promise<Transaction[]> {
    try {
      const params = new URLSearchParams({
          limit: String(limit),
          offset: String(offset)
      });
      if (userId) params.append('user_id', String(userId));
      
      const res = await fetch(`${API_BASE}/transactions.php?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const json = await res.json();
      return json.ok ? json.data : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }
};
