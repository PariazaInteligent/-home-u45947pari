import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  CreditCard, 
  Wallet, 
  Bitcoin, 
  ShieldCheck, 
  ChevronRight, 
  CheckCircle2, 
  RefreshCw,
  Lock,
  Zap
} from 'lucide-react';
import { TiltCard } from './ui/TiltCard';
import { Button3D } from './ui/Button3D';

interface DepositPageProps {
  onBack: () => void;
}

export const DepositPage: React.FC<DepositPageProps> = ({ onBack }) => {
  const [amount, setAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'revolut' | 'crypto'>('card');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const presets = ['100', '500', '1000', '5000'];

  const handleDeposit = () => {
    if (!amount) return;
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
        <TiltCard glowColor="emerald" className="max-w-md w-full p-8 text-center relative z-10">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">Transfer Reușit</h2>
          <p className="text-emerald-400/80 font-mono text-sm mb-6 uppercase tracking-wider">Fonduri adăugate în balanță</p>
          
          <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 mb-8">
            <div className="text-slate-500 text-xs uppercase mb-1">Sumă Depusă</div>
            <div className="text-2xl font-bold text-white">{amount} RON</div>
            <div className="text-xs text-emerald-500 mt-2 flex items-center justify-center gap-1">
               <ShieldCheck className="w-3 h-3" /> Tranzacție Securizată #TX-992
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
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent z-50"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.1),transparent_50%)]"></div>

      {/* Header */}
      <header className="h-20 flex items-center px-6 lg:px-12 border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs uppercase tracking-widest font-bold">Anulează</span>
        </button>
        <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-cyan-950/30 border border-cyan-500/20 rounded-full">
           <Lock className="w-3 h-3 text-cyan-400" />
           <span className="text-[10px] font-mono text-cyan-400">SECURE_GATEWAY_V3</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-5xl w-full grid lg:grid-cols-2 gap-12">
           
           {/* Left Column: Method Selection */}
           <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-display font-bold text-white mb-2">Alimentează Contul</h1>
                <p className="text-slate-400">Selectează metoda de transfer preferată.</p>
              </div>

              <div className="space-y-4">
                 {/* Card Option */}
                 <div 
                    onClick={() => setSelectedMethod('card')}
                    className={`relative p-5 rounded-2xl border transition-all cursor-pointer group overflow-hidden ${selectedMethod === 'card' ? 'bg-cyan-900/20 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]' : 'bg-slate-900/40 border-white/5 hover:border-white/20'}`}
                 >
                    <div className="flex items-center justify-between relative z-10">
                       <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${selectedMethod === 'card' ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                             <CreditCard className="w-6 h-6" />
                          </div>
                          <div>
                             <div className={`font-bold ${selectedMethod === 'card' ? 'text-white' : 'text-slate-300'}`}>Card Bancar</div>
                             <div className="text-xs text-slate-500">Visa / Mastercard / Maestro</div>
                          </div>
                       </div>
                       <div className={`w-4 h-4 rounded-full border border-white/20 flex items-center justify-center ${selectedMethod === 'card' ? 'bg-cyan-500 border-cyan-500' : ''}`}>
                          {selectedMethod === 'card' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                       </div>
                    </div>
                 </div>

                 {/* Revolut Option */}
                 <div 
                    onClick={() => setSelectedMethod('revolut')}
                    className={`relative p-5 rounded-2xl border transition-all cursor-pointer group overflow-hidden ${selectedMethod === 'revolut' ? 'bg-blue-900/20 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'bg-slate-900/40 border-white/5 hover:border-white/20'}`}
                 >
                    <div className="flex items-center justify-between relative z-10">
                       <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${selectedMethod === 'revolut' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                             <Zap className="w-6 h-6" />
                          </div>
                          <div>
                             <div className={`font-bold ${selectedMethod === 'revolut' ? 'text-white' : 'text-slate-300'}`}>Revolut Pay</div>
                             <div className="text-xs text-slate-500">Transfer Instant</div>
                          </div>
                       </div>
                       <div className={`w-4 h-4 rounded-full border border-white/20 flex items-center justify-center ${selectedMethod === 'revolut' ? 'bg-blue-500 border-blue-500' : ''}`}>
                          {selectedMethod === 'revolut' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                       </div>
                    </div>
                 </div>

                 {/* Crypto Option */}
                 <div 
                    onClick={() => setSelectedMethod('crypto')}
                    className={`relative p-5 rounded-2xl border transition-all cursor-pointer group overflow-hidden ${selectedMethod === 'crypto' ? 'bg-violet-900/20 border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.15)]' : 'bg-slate-900/40 border-white/5 hover:border-white/20'}`}
                 >
                    <div className="flex items-center justify-between relative z-10">
                       <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${selectedMethod === 'crypto' ? 'bg-violet-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                             <Bitcoin className="w-6 h-6" />
                          </div>
                          <div>
                             <div className={`font-bold ${selectedMethod === 'crypto' ? 'text-white' : 'text-slate-300'}`}>Crypto Transfer</div>
                             <div className="text-xs text-slate-500">USDT / BTC / ETH</div>
                          </div>
                       </div>
                       <div className={`w-4 h-4 rounded-full border border-white/20 flex items-center justify-center ${selectedMethod === 'crypto' ? 'bg-violet-500 border-violet-500' : ''}`}>
                          {selectedMethod === 'crypto' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Right Column: Amount & Confirm */}
           <div className="relative">
              <TiltCard glowColor="cyan" className="h-full relative overflow-hidden" noPadding>
                 {processing && (
                   <div className="absolute inset-0 z-20 bg-slate-900/90 backdrop-blur flex flex-col items-center justify-center text-center p-8">
                      <div className="w-16 h-16 relative mb-4">
                         <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
                         <div className="absolute inset-0 rounded-full border-4 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">Procesare Tranzacție</h3>
                      <p className="text-cyan-400 text-xs font-mono animate-pulse">ENCRYPTING_PACKETS...</p>
                   </div>
                 )}

                 <div className="p-8 h-full flex flex-col">
                    <div className="mb-6">
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Sumă de depus (RON)</label>
                       <div className="relative">
                          <input 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl py-4 pl-4 pr-12 text-2xl font-bold text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-700"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">RON</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-8">
                       {presets.map(val => (
                          <button
                            key={val}
                            onClick={() => setAmount(val)}
                            className="py-2 bg-slate-900/50 border border-white/10 rounded-lg text-sm text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-colors"
                          >
                             +{val}
                          </button>
                       ))}
                    </div>

                    <div className="mt-auto space-y-4">
                       <div className="p-4 bg-slate-950/50 rounded-xl border border-white/5 space-y-2">
                          <div className="flex justify-between text-sm">
                             <span className="text-slate-400">Sumă:</span>
                             <span className="text-white font-mono">{amount || '0'} RON</span>
                          </div>
                          <div className="flex justify-between text-sm">
                             <span className="text-slate-400">Comision (0%):</span>
                             <span className="text-emerald-400 font-mono">0 RON</span>
                          </div>
                          <div className="h-px bg-white/10 my-2"></div>
                          <div className="flex justify-between text-base font-bold">
                             <span className="text-white">Total:</span>
                             <span className="text-cyan-400 font-mono">{amount || '0'} RON</span>
                          </div>
                       </div>

                       <Button3D 
                          variant="cyan" 
                          className="w-full py-4 text-lg" 
                          onClick={handleDeposit}
                          disabled={!amount}
                       >
                          Confirmă Plăta
                       </Button3D>
                       
                       <p className="text-[10px] text-slate-500 text-center mx-auto max-w-xs leading-tight">
                          Prin confirmare, accepți termenii și condițiile de procesare a plăților. Fondurile vor fi disponibile instant.
                       </p>
                    </div>
                 </div>
              </TiltCard>
           </div>

        </div>
      </div>
    </div>
  );
};