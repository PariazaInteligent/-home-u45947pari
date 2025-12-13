import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Building, 
  Smartphone, 
  Wallet, 
  ShieldCheck, 
  CheckCircle2, 
  Lock,
  Download,
  AlertTriangle,
  Info
} from 'lucide-react';
import { TiltCard } from './ui/TiltCard';
import { Button3D } from './ui/Button3D';

interface WithdrawPageProps {
  onBack: () => void;
}

export const WithdrawPage: React.FC<WithdrawPageProps> = ({ onBack }) => {
  const [amount, setAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<'bank' | 'revolut' | 'crypto'>('bank');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Mock data
  const totalBalance = 5450.00;
  const lockedBalance = 4000.00; // Invested in active bets
  const availableBalance = totalBalance - lockedBalance; // 1450.00

  const handlePercentage = (percent: number) => {
    const val = (availableBalance * percent) / 100;
    setAmount(val.toFixed(2));
  };

  const handleWithdraw = () => {
    if (!amount) return;
    if (parseFloat(amount) > availableBalance) return;
    
    setProcessing(true);
    // Simulare procesare
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
    }, 2500);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <TiltCard glowColor="purple" className="max-w-md w-full p-8 text-center relative z-10">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">Cerere Înregistrată</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Fondurile vor fi transferate în contul tău în termen de 24h lucrătoare, după verificarea de securitate.
          </p>
          
          <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 mb-8">
            <div className="text-slate-500 text-xs uppercase mb-1">Sumă Retrasă</div>
            <div className="text-2xl font-bold text-white">{amount} RON</div>
            <div className="text-xs text-emerald-500 mt-2 flex items-center justify-center gap-1">
               <ShieldCheck className="w-3 h-3" /> Audit Automat #OUT-773
            </div>
          </div>

          <Button3D variant="cyan" className="w-full" onClick={onBack}>
            Înapoi la Dashboard
          </Button3D>
        </TiltCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden font-sans selection:bg-cyan-500/30 flex flex-col">
      {/* Background FX */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent z-50"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent_50%)]"></div>

      {/* Header */}
      <header className="h-20 flex items-center px-6 lg:px-12 border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs uppercase tracking-widest font-bold">Anulează</span>
        </button>
        <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-emerald-950/30 border border-emerald-500/20 rounded-full">
           <Download className="w-3 h-3 text-emerald-400" />
           <span className="text-[10px] font-mono text-emerald-400">WITHDRAWAL_PROTOCOL</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-5xl w-full grid lg:grid-cols-2 gap-12">
           
           {/* Left Column: Context & Methods */}
           <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-display font-bold text-white mb-2">Retrage Profit</h1>
                <p className="text-slate-400">Transformă succesul digital în bani reali.</p>
              </div>

              {/* Balance Summary Card */}
              <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Wallet className="w-24 h-24 text-white" />
                 </div>
                 
                 <div className="relative z-10 space-y-4">
                    <div>
                        <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">Balanță Totală</div>
                        <div className="text-2xl font-bold text-white">{totalBalance.toLocaleString()} RON</div>
                    </div>
                    
                    <div className="h-px bg-white/10 w-full"></div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Blocat (Pariuri)
                            </div>
                            <div className="text-lg font-bold text-slate-400">{lockedBalance.toLocaleString()} RON</div>
                        </div>
                        <div>
                            <div className="text-emerald-500 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Disponibil
                            </div>
                            <div className="text-xl font-bold text-emerald-400">{availableBalance.toLocaleString()} RON</div>
                        </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Destinație Fonduri</h3>
                 
                 {/* Bank Option */}
                 <div 
                    onClick={() => setSelectedMethod('bank')}
                    className={`relative p-4 rounded-xl border transition-all cursor-pointer group flex items-center gap-4 ${selectedMethod === 'bank' ? 'bg-slate-800 border-white/30' : 'bg-slate-900/40 border-white/5 hover:border-white/20'}`}
                 >
                    <div className={`p-3 rounded-lg ${selectedMethod === 'bank' ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400'}`}>
                       <Building className="w-5 h-5" />
                    </div>
                    <div>
                       <div className="font-bold text-sm text-white">Transfer Bancar (IBAN)</div>
                       <div className="text-xs text-slate-500">RO98 BTRL 0000... (Salvat)</div>
                    </div>
                 </div>

                 {/* Revolut Option */}
                 <div 
                    onClick={() => setSelectedMethod('revolut')}
                    className={`relative p-4 rounded-xl border transition-all cursor-pointer group flex items-center gap-4 ${selectedMethod === 'revolut' ? 'bg-blue-900/20 border-blue-400/50' : 'bg-slate-900/40 border-white/5 hover:border-white/20'}`}
                 >
                    <div className={`p-3 rounded-lg ${selectedMethod === 'revolut' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                       <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                       <div className="font-bold text-sm text-white">Revolut</div>
                       <div className="text-xs text-slate-500">@alexinvestor</div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Right Column: Amount Input */}
           <div className="relative">
              <TiltCard glowColor="emerald" className="h-full relative overflow-hidden" noPadding>
                 {processing && (
                   <div className="absolute inset-0 z-20 bg-slate-900/90 backdrop-blur flex flex-col items-center justify-center text-center p-8">
                      <div className="w-16 h-16 relative mb-4">
                         <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
                         <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">Procesare Retragere</h3>
                      <p className="text-emerald-400 text-xs font-mono animate-pulse">VERIFYING_AML_RULES...</p>
                   </div>
                 )}

                 <div className="p-8 h-full flex flex-col">
                    <div className="mb-6">
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Sumă de retras (RON)</label>
                       <div className="relative">
                          <input 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            max={availableBalance}
                            className={`w-full bg-slate-950 border rounded-xl py-4 pl-4 pr-12 text-2xl font-bold text-white focus:outline-none focus:ring-1 transition-all placeholder:text-slate-700 ${parseFloat(amount || '0') > availableBalance ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/50'}`}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">RON</span>
                       </div>
                       {parseFloat(amount || '0') > availableBalance && (
                          <div className="flex items-center gap-1 mt-2 text-red-500 text-xs">
                             <AlertTriangle className="w-3 h-3" /> Fonduri insuficiente. Maxim disponibil: {availableBalance} RON
                          </div>
                       )}
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-8">
                       <button onClick={() => handlePercentage(25)} className="py-2 bg-slate-900/50 border border-white/10 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:border-white/30 transition-colors">25%</button>
                       <button onClick={() => handlePercentage(50)} className="py-2 bg-slate-900/50 border border-white/10 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:border-white/30 transition-colors">50%</button>
                       <button onClick={() => handlePercentage(75)} className="py-2 bg-slate-900/50 border border-white/10 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:border-white/30 transition-colors">75%</button>
                       <button onClick={() => handlePercentage(100)} className="py-2 bg-emerald-900/20 border border-emerald-500/30 rounded-lg text-xs font-bold text-emerald-400 hover:bg-emerald-900/40 transition-colors">MAX</button>
                    </div>

                    <div className="mt-auto space-y-4">
                       <div className="bg-yellow-500/5 border border-yellow-500/10 p-4 rounded-xl flex gap-3">
                          <Info className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                          <p className="text-xs text-yellow-200/80 leading-relaxed">
                             Din motive de securitate, retragerile sunt procesate doar către conturile utilizate anterior pentru depunere.
                          </p>
                       </div>

                       <div className="p-4 bg-slate-950/50 rounded-xl border border-white/5 space-y-2">
                          <div className="flex justify-between text-sm">
                             <span className="text-slate-400">Sumă Cerută:</span>
                             <span className="text-white font-mono">{amount || '0'} RON</span>
                          </div>
                          <div className="flex justify-between text-sm">
                             <span className="text-slate-400">Taxe Procesare:</span>
                             <span className="text-emerald-400 font-mono">GRATUIT</span>
                          </div>
                          <div className="h-px bg-white/10 my-2"></div>
                          <div className="flex justify-between text-base font-bold">
                             <span className="text-white">Total de Primit:</span>
                             <span className="text-emerald-400 font-mono">{amount || '0'} RON</span>
                          </div>
                       </div>

                       <Button3D 
                          variant="purple" 
                          className="w-full py-4 text-lg" 
                          onClick={handleWithdraw}
                          disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > availableBalance}
                       >
                          Confirmă Retragerea
                       </Button3D>
                    </div>
                 </div>
              </TiltCard>
           </div>

        </div>
      </div>
    </div>
  );
};