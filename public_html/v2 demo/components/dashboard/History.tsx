import React, { useState } from 'react';
import { 
  CalendarDays, 
  FileText, 
  Trophy, 
  TrendingUp, 
  CalendarRange, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Search
} from 'lucide-react';
import { TiltCard } from '../ui/TiltCard';

type TimeFilterType = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'all' | 'custom';

export const History: React.FC = () => {
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'won' | 'lost' | 'pending'>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('month');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');

  // Generare date relative pentru demo
  const today = new Date();
  const yesterday = new Date(new Date().setDate(today.getDate() - 1));
  const twoDaysAgo = new Date(new Date().setDate(today.getDate() - 2));
  const lastWeek = new Date(new Date().setDate(today.getDate() - 7));
  const lastMonth = new Date(new Date().setMonth(today.getMonth() - 1));

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const historyBets = [
    { id: 'BT-1001', rawDate: today.toISOString(), date: formatDate(today), event: 'AC Milan vs Juventus', selection: 'X2', odds: 1.75, stake: 400, result: 'won', profit: 300, score: '1-1' },
    { id: 'BT-1002', rawDate: today.toISOString(), date: formatDate(today), event: 'Real Madrid vs Barca', selection: 'Over 2.5', odds: 1.50, stake: 200, result: 'pending', profit: 0, score: '-' },
    { id: 'BT-1003', rawDate: yesterday.toISOString(), date: formatDate(yesterday), event: 'Arsenal vs Liverpool', selection: 'Over 3.5 Goals', odds: 2.40, stake: 250, result: 'lost', profit: -250, score: '1-0' },
    { id: 'BT-1004', rawDate: yesterday.toISOString(), date: formatDate(yesterday), event: 'Halep vs Swiatek', selection: 'Set 1: Halep', odds: 2.10, stake: 500, result: 'won', profit: 550, score: '6-4, 2-6' },
    { id: 'BT-1005', rawDate: twoDaysAgo.toISOString(), date: formatDate(twoDaysAgo), event: 'Man City vs Inter', selection: 'City -1.5 AH', odds: 1.95, stake: 600, result: 'won', profit: 570, score: '3-0' },
    { id: 'BT-1006', rawDate: lastWeek.toISOString(), date: formatDate(lastWeek), event: 'Bayern vs Dortmund', selection: 'GG & 3+', odds: 1.80, stake: 350, result: 'lost', profit: -350, score: '2-0' },
    { id: 'BT-1007', rawDate: lastMonth.toISOString(), date: formatDate(lastMonth), event: 'PSG vs Marseille', selection: 'PSG Win', odds: 1.55, stake: 1000, result: 'won', profit: 550, score: '2-1' },
    { id: 'BT-1008', rawDate: lastMonth.toISOString(), date: formatDate(lastMonth), event: 'F1 USA GP', selection: 'Verstappen Win', odds: 1.35, stake: 1000, result: 'won', profit: 350, score: 'P1' },
  ];

  const getFilteredBets = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    let filtered = historyBets;

    filtered = filtered.filter(bet => {
      const betDate = new Date(bet.rawDate);
      switch (timeFilter) {
        case 'today': return betDate >= todayStart && betDate <= todayEnd;
        case 'yesterday':
          const yestStart = new Date(todayStart); yestStart.setDate(todayStart.getDate() - 1);
          const yestEnd = new Date(todayEnd); yestEnd.setDate(todayEnd.getDate() - 1);
          return betDate >= yestStart && betDate <= yestEnd;
        case 'week':
          const day = todayStart.getDay() || 7;
          if (day !== 1) todayStart.setHours(-24 * (day - 1));
          return betDate >= todayStart;
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          return betDate >= monthStart && betDate <= monthEnd;
        case 'year':
          const yearStart = new Date(now.getFullYear(), 0, 1);
          const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
          return betDate >= yearStart && betDate <= yearEnd;
        case 'custom':
          if (!customDateStart || !customDateEnd) return true;
          const cStart = new Date(customDateStart);
          const cEnd = new Date(customDateEnd); cEnd.setHours(23, 59, 59);
          return betDate >= cStart && betDate <= cEnd;
        case 'all': default: return true;
      }
    });

    if (historyStatusFilter !== 'all') {
      filtered = filtered.filter(b => b.result === historyStatusFilter);
    }
    return filtered;
  };

  const getTimeLabel = () => {
    switch (timeFilter) {
      case 'today': return 'Astăzi';
      case 'yesterday': return 'Ieri';
      case 'week': return 'Săptămâna Curentă';
      case 'month': return 'Luna Curentă';
      case 'year': return 'Anul Curent';
      case 'all': return 'All Time';
      case 'custom': return 'Perioadă Personalizată';
      default: return 'Selectează';
    }
  };

  const filteredBets = getFilteredBets();
  const totalBets = filteredBets.length;
  const wonBets = filteredBets.filter(b => b.result === 'won').length;
  const lostBets = filteredBets.filter(b => b.result === 'lost').length;
  const settledBets = wonBets + lostBets;
  const winRate = settledBets > 0 ? ((wonBets / settledBets) * 100).toFixed(1) : '0.0';
  const totalProfit = filteredBets.reduce((acc, curr) => acc + curr.profit, 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
            <div>
               <h2 className="text-2xl font-display font-bold text-white">Istoric Pariuri</h2>
               <p className="text-slate-400 text-sm">Registrul complet al activității tale investiționale.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                {/* Time Period Selector */}
                <div className="flex flex-col gap-1 w-full sm:w-auto">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Perioadă</label>
                    <div className="relative">
                        <select 
                          value={timeFilter}
                          onChange={(e) => setTimeFilter(e.target.value as TimeFilterType)}
                          className="appearance-none bg-slate-900 border border-slate-700 text-white text-xs font-bold py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:border-cyan-500 w-full sm:w-48 cursor-pointer hover:border-slate-500 transition-colors"
                        >
                          <option value="today">Astăzi</option>
                          <option value="yesterday">Ieri</option>
                          <option value="week">Săptămâna Curentă</option>
                          <option value="month">Luna Curentă</option>
                          <option value="year">Anul Curent</option>
                          <option value="all">All Time</option>
                          <option value="custom">Personalizat</option>
                        </select>
                        <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                </div>

                {/* Custom Date Pickers */}
                {timeFilter === 'custom' && (
                  <div className="flex gap-2 w-full sm:w-auto">
                      <div className="flex flex-col gap-1 w-full">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">De la</label>
                          <input 
                            type="date" 
                            value={customDateStart}
                            onChange={(e) => setCustomDateStart(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-white text-xs py-2 px-2 rounded-lg focus:outline-none focus:border-cyan-500 w-full"
                          />
                      </div>
                      <div className="flex flex-col gap-1 w-full">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Până la</label>
                          <input 
                            type="date" 
                            value={customDateEnd}
                            onChange={(e) => setCustomDateEnd(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-white text-xs py-2 px-2 rounded-lg focus:outline-none focus:border-cyan-500 w-full"
                          />
                      </div>
                  </div>
                )}
                
                {/* Status Filter Buttons */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700 w-full sm:w-auto overflow-x-auto">
                    {['all', 'won', 'lost', 'pending'].map((filter) => (
                        <button
                           key={filter}
                           onClick={() => setHistoryStatusFilter(filter as any)}
                           className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all whitespace-nowrap flex-1 sm:flex-none ${
                              historyStatusFilter === filter 
                                ? 'bg-cyan-500 text-white shadow-sm' 
                                : 'text-slate-500 hover:text-white hover:bg-white/5'
                           }`}
                        >
                            {filter === 'all' ? 'Toate' : filter}
                        </button>
                    ))}
                </div>
            </div>
         </div>

         {/* Summary Stats */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <TiltCard glowColor="purple" noPadding className="p-4 flex items-center gap-4">
                 <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
                    <FileText className="w-6 h-6" />
                 </div>
                 <div>
                    <div className="text-xs text-slate-500 uppercase font-bold">Total Bilete</div>
                    <div className="text-2xl font-display font-bold text-white">{totalBets}</div>
                 </div>
             </TiltCard>

             <TiltCard glowColor="emerald" noPadding className="p-4 flex items-center gap-4">
                 <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Trophy className="w-6 h-6" />
                 </div>
                 <div>
                    <div className="text-xs text-slate-500 uppercase font-bold">Rată Câștig</div>
                    <div className="text-2xl font-display font-bold text-white">{winRate}%</div>
                 </div>
             </TiltCard>

             <TiltCard glowColor={totalProfit >= 0 ? 'emerald' : 'red'} noPadding className="p-4 flex items-center gap-4">
                 <div className={`p-3 rounded-lg border ${totalProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    <TrendingUp className="w-6 h-6" />
                 </div>
                 <div>
                    <div className="text-xs text-slate-500 uppercase font-bold">Profit/Pierdere</div>
                    <div className={`text-2xl font-display font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {totalProfit > 0 ? '+' : ''}{totalProfit} RON
                    </div>
                 </div>
             </TiltCard>

             <TiltCard glowColor="cyan" noPadding className="p-4 flex items-center gap-4">
                 <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <CalendarRange className="w-6 h-6" />
                 </div>
                 <div>
                    <div className="text-xs text-slate-500 uppercase font-bold">Perioadă</div>
                    <div className="text-sm font-bold text-white truncate max-w-[120px]" title={getTimeLabel()}>{getTimeLabel()}</div>
                 </div>
             </TiltCard>
         </div>

         {/* Bets List */}
         <div className="space-y-4">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider px-4">
                <span>Lista Evenimente ({filteredBets.length})</span>
                <span className="flex items-center gap-1">
                   {filteredBets.length === 0 ? "Niciun rezultat în perioada selectată" : ""}
                </span>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block bg-slate-900/50 backdrop-blur border border-white/5 rounded-2xl overflow-hidden min-h-[200px]">
                {filteredBets.length > 0 ? (
                  <table className="w-full text-left">
                      <thead className="bg-slate-950/50 text-slate-400 text-xs font-mono uppercase">
                          <tr>
                              <th className="p-4 font-normal">Data & ID</th>
                              <th className="p-4 font-normal">Eveniment</th>
                              <th className="p-4 font-normal text-center">Selecție</th>
                              <th className="p-4 font-normal text-center">Cota</th>
                              <th className="p-4 font-normal text-center">Miza</th>
                              <th className="p-4 font-normal text-center">Rezultat</th>
                              <th className="p-4 font-normal text-right">Profit</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                          {filteredBets.map((bet) => (
                              <tr key={bet.id} className="hover:bg-white/5 transition-colors group">
                                  <td className="p-4">
                                      <div className="text-slate-300 text-sm font-bold">{bet.date}</div>
                                      <div className="text-xs text-slate-600 font-mono">{bet.id}</div>
                                  </td>
                                  <td className="p-4">
                                      <div className="text-white font-bold text-sm group-hover:text-cyan-400 transition-colors">{bet.event}</div>
                                      <div className="text-xs text-slate-500 flex items-center gap-1">
                                          Scor final: <span className="text-slate-300">{bet.score}</span>
                                      </div>
                                  </td>
                                  <td className="p-4 text-center">
                                      <span className="bg-slate-800 border border-white/10 px-2 py-1 rounded text-xs text-slate-300">
                                          {bet.selection}
                                      </span>
                                  </td>
                                  <td className="p-4 text-center font-mono text-cyan-300 text-sm">{bet.odds.toFixed(2)}</td>
                                  <td className="p-4 text-center text-slate-300 text-sm">{bet.stake}</td>
                                  <td className="p-4 text-center">
                                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border uppercase ${
                                          bet.result === 'won' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                          bet.result === 'lost' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                          'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                                      }`}>
                                          {bet.result === 'won' ? <CheckCircle2 className="w-3 h-3" /> : 
                                           bet.result === 'lost' ? <XCircle className="w-3 h-3" /> : 
                                           <Clock className="w-3 h-3" />}
                                          {bet.result}
                                      </div>
                                  </td>
                                  <td className={`p-4 text-right font-bold text-sm ${bet.profit > 0 ? 'text-emerald-400' : bet.profit < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                      {bet.profit > 0 ? '+' : ''}{bet.profit} RON
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                     <CalendarRange className="w-10 h-10 mb-2 opacity-50" />
                     <p className="text-sm">Nu există pariuri pentru perioada selectată.</p>
                  </div>
                )}
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
                {filteredBets.length > 0 ? filteredBets.map((bet) => (
                    <div key={bet.id} className="bg-slate-900/50 backdrop-blur border border-white/5 rounded-xl p-4 relative overflow-hidden">
                        {/* Status Stripe */}
                        <div className={`absolute top-0 left-0 w-1 h-full ${
                             bet.result === 'won' ? 'bg-emerald-500' :
                             bet.result === 'lost' ? 'bg-red-500' :
                             'bg-yellow-500'
                        }`}></div>
                        
                        <div className="pl-3">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="text-xs text-slate-500 mb-0.5">{bet.date}</div>
                                    <div className="font-bold text-white text-sm">{bet.event}</div>
                                </div>
                                <div className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${
                                     bet.result === 'won' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                     bet.result === 'lost' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                     'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                                }`}>
                                    {bet.result}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-3 bg-slate-950/30 p-2 rounded">
                                <div>Selecție: <span className="text-white">{bet.selection}</span></div>
                                <div>Scor: <span className="text-white">{bet.score}</span></div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                <div className="text-xs">
                                    <span className="text-slate-500">Miza:</span> <span className="text-slate-300">{bet.stake}</span>
                                    <span className="mx-2 text-slate-700">|</span>
                                    <span className="text-slate-500">Cota:</span> <span className="text-cyan-400">{bet.odds}</span>
                                </div>
                                <div className={`font-bold ${bet.profit > 0 ? 'text-emerald-400' : bet.profit < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                    {bet.profit > 0 ? '+' : ''}{bet.profit} RON
                                </div>
                            </div>
                        </div>
                    </div>
                )) : (
                  <div className="bg-slate-900/50 border border-white/5 rounded-xl p-8 text-center text-slate-500">
                     <p className="text-sm">Nu există date.</p>
                  </div>
                )}
            </div>
         </div>
      </div>
  );
};