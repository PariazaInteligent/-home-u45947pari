import React from 'react';
import { 
  Plus, 
  Download, 
  CheckCircle2, 
  Lock, 
  Wallet as WalletIcon, 
  CreditCard, 
  Smartphone, 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp 
} from 'lucide-react';
import { TiltCard } from '../ui/TiltCard';
import { Button3D } from '../ui/Button3D';

interface WalletProps {
  onNavigateToDeposit: () => void;
  onNavigateToWithdraw: () => void;
}

export const Wallet: React.FC<WalletProps> = ({ onNavigateToDeposit, onNavigateToWithdraw }) => {
  const transactions = [
    { id: 'TX-9921', type: 'Depunere', method: 'Card **** 4291', amount: '+1,500.00 RON', date: '20 Oct, 14:30', status: 'Completed' },
    { id: 'TX-9920', type: 'Profit', method: 'Value Bet #882', amount: '+125.50 RON', date: '19 Oct, 09:15', status: 'Completed' },
    { id: 'TX-9919', type: 'Retragere', method: 'Revolut', amount: '-500.00 RON', date: '18 Oct, 18:20', status: 'Processing' },
    { id: 'TX-9918', type: 'Investiție', method: 'Miză Automată', amount: '-250.00 RON', date: '18 Oct, 12:00', status: 'Completed' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-display font-bold text-white">Portofel & Depuneri</h2>
           <p className="text-slate-400 text-sm">Administrează fondurile și metodele de plată.</p>
        </div>
        <div className="flex gap-3">
           <Button3D variant="cyan" onClick={onNavigateToDeposit} className="text-xs px-6 py-3">
              <span className="flex items-center gap-2">
                 <Plus className="w-4 h-4" /> Adaugă Fonduri
              </span>
           </Button3D>
           <Button3D variant="purple" onClick={onNavigateToWithdraw} className="text-xs px-6 py-3">
              <span className="flex items-center gap-2">
                 <Download className="w-4 h-4" /> Retrage
              </span>
           </Button3D>
        </div>
      </div>

      {/* Wallet Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <TiltCard glowColor="emerald" className="relative overflow-hidden" noPadding>
            <div className="p-6">
               <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                     <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded uppercase">Disponibil</span>
               </div>
               <div className="text-sm text-slate-400 uppercase tracking-wider font-bold mb-1">Fonduri Lichide</div>
               <div className="text-3xl font-display font-bold text-white">1,450.00 <span className="text-sm text-slate-500">RON</span></div>
            </div>
         </TiltCard>

         <TiltCard glowColor="cyan" className="relative overflow-hidden" noPadding>
            <div className="p-6">
               <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                     <Lock className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-[10px] font-bold text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded uppercase">Blocat</span>
               </div>
               <div className="text-sm text-slate-400 uppercase tracking-wider font-bold mb-1">Investiție Activă</div>
               <div className="text-3xl font-display font-bold text-white">4,000.00 <span className="text-sm text-slate-500">RON</span></div>
            </div>
         </TiltCard>

         <TiltCard glowColor="purple" className="relative overflow-hidden" noPadding>
            <div className="p-6">
               <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-violet-500/10 rounded-lg border border-violet-500/20">
                     <WalletIcon className="w-5 h-5 text-violet-400" />
                  </div>
                  <span className="text-[10px] font-bold text-violet-400 border border-violet-500/30 px-2 py-0.5 rounded uppercase">Total</span>
               </div>
               <div className="text-sm text-slate-400 uppercase tracking-wider font-bold mb-1">Valoare Portofel</div>
               <div className="text-3xl font-display font-bold text-white">5,450.00 <span className="text-sm text-slate-500">RON</span></div>
            </div>
         </TiltCard>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
         {/* Payment Methods */}
         <div className="lg:col-span-5 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
               <CreditCard className="w-5 h-5 text-cyan-400" /> Metode de Plată
            </h3>

            {/* Visual Credit Card */}
            <div className="relative h-56 w-full rounded-2xl overflow-hidden shadow-2xl transition-transform hover:scale-[1.02] duration-300 group">
               <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black z-0"></div>
               {/* Decorative Circles */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
               
               <div className="relative z-10 p-6 h-full flex flex-col justify-between border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
                  <div className="flex justify-between items-start">
                     <div className="w-12 h-8 bg-white/10 rounded border border-white/20 flex items-center justify-center">
                        <div className="w-6 h-4 bg-yellow-400/80 rounded-sm"></div>
                     </div>
                     <span className="text-white font-display font-bold tracking-widest italic text-lg">VISA</span>
                  </div>

                  <div className="space-y-1">
                     <div className="text-xs text-slate-400 uppercase tracking-widest">Card Number</div>
                     <div className="text-xl font-mono text-white tracking-widest flex gap-4">
                        <span>••••</span><span>••••</span><span>••••</span><span>4291</span>
                     </div>
                  </div>

                  <div className="flex justify-between items-end">
                     <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest">Card Holder</div>
                        <div className="text-sm font-bold text-white uppercase">Alex I.</div>
                     </div>
                     <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest text-right">Expires</div>
                        <div className="text-sm font-bold text-white">12/28</div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="space-y-3">
               <div className="p-4 bg-slate-900/50 border border-white/5 rounded-xl flex items-center justify-between group hover:border-cyan-500/30 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                        <Smartphone className="w-5 h-5" />
                     </div>
                     <div>
                        <div className="text-sm font-bold text-white">Revolut</div>
                        <div className="text-xs text-slate-500">@alexinvestor</div>
                     </div>
                  </div>
                  <div className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded">Verificat</div>
               </div>

               <button className="w-full py-3 border border-dashed border-slate-700 rounded-xl text-slate-400 text-sm hover:text-white hover:border-slate-500 hover:bg-slate-800/50 transition-all flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Adaugă Metodă Nouă
               </button>
            </div>
         </div>

         {/* Transaction History */}
         <div className="lg:col-span-7">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
               <History className="w-5 h-5 text-violet-400" /> Istoric Tranzacții
            </h3>
            
            <div className="space-y-4">
               {transactions.map((tx, i) => (
                  <div key={i} className="bg-slate-900/50 border border-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                     <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full border ${
                           tx.type === 'Depunere' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                           tx.type === 'Retragere' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                           tx.type === 'Profit' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' :
                           'bg-slate-800 border-slate-700 text-slate-400'
                        }`}>
                           {tx.type === 'Depunere' ? <ArrowDownRight className="w-5 h-5" /> :
                            tx.type === 'Retragere' ? <ArrowUpRight className="w-5 h-5" /> :
                            tx.type === 'Profit' ? <TrendingUp className="w-5 h-5" /> :
                            <WalletIcon className="w-5 h-5" />}
                        </div>
                        <div>
                           <div className="font-bold text-white text-sm">{tx.type}</div>
                           <div className="text-xs text-slate-500">{tx.method}</div>
                        </div>
                     </div>
                     <div className="text-right">
                        <div className={`font-mono font-bold text-sm ${tx.amount.startsWith('+') ? 'text-emerald-400' : 'text-slate-200'}`}>
                           {tx.amount}
                        </div>
                        <div className="text-xs text-slate-500">{tx.date}</div>
                     </div>
                  </div>
               ))}
               
               <button className="w-full py-3 text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors">
                  Vezi tot istoricul
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};