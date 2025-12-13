import React, { useState } from 'react';
import { 
  Headphones, 
  MessageSquare, 
  Plus, 
  Search, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  Send,
  HelpCircle,
  ChevronRight,
  LifeBuoy,
  CreditCard,
  Code2,
  BookOpen
} from 'lucide-react';
import { TiltCard } from '../ui/TiltCard';
import { Button3D } from '../ui/Button3D';

interface Ticket {
  id: string;
  subject: string;
  category: 'Tehnic' | 'Financiar' | 'Cont' | 'Altul';
  status: 'open' | 'pending' | 'closed';
  priority: 'low' | 'medium' | 'high';
  lastUpdate: string;
}

type HelpTopicKey = 'deposits' | 'api' | 'faq';

export const Support: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([
    { id: 'TKT-9921', subject: 'Întârziere retragere Revolut', category: 'Financiar', status: 'open', priority: 'high', lastUpdate: 'Acum 10 min' },
    { id: 'TKT-9840', subject: 'Nu pot accesa modulul 3 din Academie', category: 'Tehnic', status: 'pending', priority: 'medium', lastUpdate: 'Ieri, 14:30' },
    { id: 'TKT-9102', subject: 'Confirmare identitate KYC', category: 'Cont', status: 'closed', priority: 'low', lastUpdate: '20 Oct, 09:00' },
  ]);

  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', category: 'Tehnic', description: '', priority: 'medium' });
  
  // State for Help Modal
  const [activeHelpTopic, setActiveHelpTopic] = useState<HelpTopicKey | null>(null);

  // Content for Help Topics
  const helpContent = {
    deposits: {
        title: 'Ghid Probleme Depuneri',
        icon: CreditCard,
        color: 'text-violet-400',
        content: (
            <div className="space-y-4 text-slate-300 text-sm">
                <p>Majoritatea problemelor legate de depuneri sunt cauzate de restricții bancare sau date introduse greșit. Iată pașii de verificare:</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Fonduri insuficiente:</strong> Verifică balanța cardului tău bancar.</li>
                    <li><strong>3D Secure:</strong> Asigură-te că ai confirmat tranzacția în aplicația de banking.</li>
                    <li><strong>Limite Online:</strong> Unele bănci blochează tranzacțiile către site-uri de investiții/gambling. Contactează banca pentru a ridica limita.</li>
                </ul>
                <div className="bg-slate-950 p-4 rounded-lg border border-white/5 mt-4">
                    <h4 className="font-bold text-white mb-1">Timp de procesare</h4>
                    <ul className="text-xs space-y-1 text-slate-400">
                        <li>Card Bancar: <span className="text-emerald-400">Instant</span></li>
                        <li>Revolut: <span className="text-emerald-400">Instant</span></li>
                        <li>Crypto: <span className="text-yellow-400">10-30 minute (confirmări blockchain)</span></li>
                    </ul>
                </div>
            </div>
        )
    },
    api: {
        title: 'Documentație & Algoritm',
        icon: Code2,
        color: 'text-cyan-400',
        content: (
            <div className="space-y-4 text-slate-300 text-sm">
                <p>Algoritmul nostru <strong>Value Betting v2.0</strong> funcționează prin compararea cotelor în timp real între 50+ case de pariuri și "Sharp Bookies" (ex: Pinnacle).</p>
                
                <h4 className="font-bold text-white mt-4">Cum calculăm Value Edge?</h4>
                <code className="block bg-slate-950 p-3 rounded border border-cyan-500/20 font-mono text-xs text-cyan-300">
                    Edge = (Probabilitate_Reala * Cota_Oferită) - 1
                </code>
                
                <h4 className="font-bold text-white mt-4">Terminologie API</h4>
                <ul className="list-disc pl-5 space-y-2 text-xs">
                    <li><strong>ROI (Return on Investment):</strong> Profitul net raportat la suma totală investită.</li>
                    <li><strong>CLV (Closing Line Value):</strong> Valoarea cotei la momentul începerii evenimentului. Dacă Cota Noastră > CLV, strategia este profitabilă pe termen lung.</li>
                </ul>
            </div>
        )
    },
    faq: {
        title: 'Întrebări Frecvente (FAQ)',
        icon: BookOpen,
        color: 'text-emerald-400',
        content: (
            <div className="space-y-4 text-slate-300 text-sm">
                <div className="space-y-2">
                    <h4 className="font-bold text-white">Este legal acest fond de investiții?</h4>
                    <p>Da, operăm sub licență de investiții private. Taxele sunt reținute la sursă conform legislației în vigoare.</p>
                </div>
                <div className="space-y-2">
                    <h4 className="font-bold text-white">Care este suma minimă de retragere?</h4>
                    <p>Suma minimă este de <strong>100 RON</strong>. Nu există comisioane pentru primele 3 retrageri din lună.</p>
                </div>
                <div className="space-y-2">
                    <h4 className="font-bold text-white">Ce se întâmplă dacă pierd bani?</h4>
                    <p>Orice investiție implică riscuri. Totuși, folosind strategia Kelly Criterion și volum mare de pariuri, varianța negativă este minimizată pe termen lung. Istoricul nostru arată un ROI pozitiv anual de 4 ani consecutiv.</p>
                </div>
            </div>
        )
    }
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const ticket: Ticket = {
        id: `TKT-${Math.floor(Math.random() * 10000)}`,
        subject: newTicket.subject,
        category: newTicket.category as any,
        status: 'open',
        priority: newTicket.priority as any,
        lastUpdate: 'Chiar acum'
    };
    setTickets([ticket, ...tickets]);
    setShowNewTicketForm(false);
    setNewTicket({ subject: '', category: 'Tehnic', description: '', priority: 'medium' });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
              <Headphones className="w-6 h-6 text-cyan-400" /> Centru de Suport
           </h2>
           <p className="text-slate-400 text-sm">Ai o problemă? Echipa noastră tehnică este aici 24/7.</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-mono text-emerald-400">AGENTS_ONLINE</span>
            </div>
            <Button3D variant="cyan" className="text-xs px-6 py-3" onClick={() => setShowNewTicketForm(true)}>
                <span className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Tichet Nou
                </span>
            </Button3D>
        </div>
      </div>

      {/* Quick Stats / FAQ Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div onClick={() => setActiveHelpTopic('deposits')}>
            <TiltCard glowColor="purple" noPadding className="p-6 cursor-pointer group hover:border-violet-400/50 transition-colors h-full">
                <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-violet-500/10 rounded-xl border border-violet-500/20 group-hover:bg-violet-500/20 transition-colors">
                    <LifeBuoy className="w-6 h-6 text-violet-400" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-white mb-1">Probleme Depuneri</h3>
                <p className="text-xs text-slate-400">Ghid rapid pentru tranzacții blocate sau întârziate.</p>
            </TiltCard>
         </div>

         <div onClick={() => setActiveHelpTopic('api')}>
            <TiltCard glowColor="cyan" noPadding className="p-6 cursor-pointer group hover:border-cyan-400/50 transition-colors h-full">
                <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
                    <FileText className="w-6 h-6 text-cyan-400" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-white mb-1">Documentație API</h3>
                <p className="text-xs text-slate-400">Cum funcționează algoritmul și calculul cotelor.</p>
            </TiltCard>
         </div>

         <div onClick={() => setActiveHelpTopic('faq')}>
            <TiltCard glowColor="emerald" noPadding className="p-6 cursor-pointer group hover:border-emerald-400/50 transition-colors h-full">
                <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                    <HelpCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-white mb-1">Întrebări Frecvente</h3>
                <p className="text-xs text-slate-400">Răspunsuri la cele mai comune întrebări ale investitorilor.</p>
            </TiltCard>
         </div>
      </div>

      {/* Ticket List */}
      <div className="bg-slate-900/50 backdrop-blur border border-white/5 rounded-2xl overflow-hidden min-h-[400px]">
         <div className="p-4 border-b border-white/5 bg-slate-950/30 flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2">
               <MessageSquare className="w-5 h-5 text-slate-400" /> Istoric Tichete
            </h3>
            <div className="relative">
               <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
               <input 
                  type="text" 
                  placeholder="Caută după ID sau Subiect..." 
                  className="bg-slate-900 border border-slate-700 rounded-lg py-1.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-cyan-500 w-64 transition-colors"
               />
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-white/5 text-slate-400 font-mono text-xs uppercase">
                  <tr>
                     <th className="p-4 font-normal">ID Tichet</th>
                     <th className="p-4 font-normal">Subiect</th>
                     <th className="p-4 font-normal">Categorie</th>
                     <th className="p-4 font-normal text-center">Status</th>
                     <th className="p-4 font-normal text-center">Prioritate</th>
                     <th className="p-4 font-normal text-right">Ultima Actualizare</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {tickets.map((ticket) => (
                     <tr key={ticket.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                        <td className="p-4 font-mono text-cyan-400 font-bold">{ticket.id}</td>
                        <td className="p-4 font-bold text-white">{ticket.subject}</td>
                        <td className="p-4 text-slate-400">{ticket.category}</td>
                        <td className="p-4 text-center">
                           <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${
                              ticket.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              ticket.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                              'bg-slate-700/30 text-slate-400 border-slate-600/30'
                           }`}>
                              {ticket.status === 'open' ? 'Deschis' : ticket.status === 'pending' ? 'În Lucru' : 'Închis'}
                           </span>
                        </td>
                        <td className="p-4 text-center">
                            <span className={`text-xs font-bold ${
                                ticket.priority === 'high' ? 'text-red-400' :
                                ticket.priority === 'medium' ? 'text-yellow-400' :
                                'text-blue-400'
                            }`}>
                                {ticket.priority.toUpperCase()}
                            </span>
                        </td>
                        <td className="p-4 text-right text-slate-500 text-xs">{ticket.lastUpdate}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
         {tickets.length === 0 && (
             <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                 <CheckCircle2 className="w-12 h-12 mb-4 opacity-50" />
                 <p>Nu ai niciun tichet activ. Totul funcționează perfect!</p>
             </div>
         )}
      </div>

      {/* New Ticket Modal */}
      {showNewTicketForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500"></div>
                  
                  <div className="p-6 border-b border-white/10 flex justify-between items-center">
                      <h3 className="font-display font-bold text-white text-lg">Deschide Tichet Nou</h3>
                      <button onClick={() => setShowNewTicketForm(false)} className="text-slate-400 hover:text-white transition-colors">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
                      <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Subiect</label>
                          <input 
                              type="text" 
                              required
                              value={newTicket.subject}
                              onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                              placeholder="Descrie problema pe scurt..."
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                          />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Categorie</label>
                              <select 
                                  value={newTicket.category}
                                  onChange={(e) => setNewTicket({...newTicket, category: e.target.value as any})}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-colors cursor-pointer"
                              >
                                  <option>Tehnic</option>
                                  <option>Financiar</option>
                                  <option>Cont</option>
                                  <option>Altul</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Prioritate</label>
                              <select 
                                  value={newTicket.priority}
                                  onChange={(e) => setNewTicket({...newTicket, priority: e.target.value as any})}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-colors cursor-pointer"
                              >
                                  <option value="low">Scăzută</option>
                                  <option value="medium">Medie</option>
                                  <option value="high">Ridicată</option>
                              </select>
                          </div>
                      </div>

                      <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Descriere Detaliată</label>
                          <textarea 
                              required
                              value={newTicket.description}
                              onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                              rows={5}
                              placeholder="Oferă cât mai multe detalii (ID tranzacție, capturi de ecran, pași de reproducere)..."
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-colors resize-none"
                          ></textarea>
                      </div>

                      <div className="pt-4 flex justify-end gap-3">
                          <button 
                              type="button" 
                              onClick={() => setShowNewTicketForm(false)}
                              className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                          >
                              Anulează
                          </button>
                          <Button3D variant="cyan" type="submit" className="text-xs px-8 py-3">
                              <span className="flex items-center gap-2">
                                  Trimite Cererea <Send className="w-4 h-4" />
                              </span>
                          </Button3D>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* HELP TOPIC MODAL */}
      {activeHelpTopic && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                  {/* Modal Header */}
                  <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-950/50">
                      <div className="flex items-center gap-3">
                        {React.createElement(helpContent[activeHelpTopic].icon, { 
                            className: `w-6 h-6 ${helpContent[activeHelpTopic].color}` 
                        })}
                        <h3 className="font-display font-bold text-white text-lg">
                            {helpContent[activeHelpTopic].title}
                        </h3>
                      </div>
                      <button onClick={() => setActiveHelpTopic(null)} className="text-slate-400 hover:text-white transition-colors">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  {/* Modal Content */}
                  <div className="p-6 overflow-y-auto custom-scrollbar">
                     {helpContent[activeHelpTopic].content}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 border-t border-white/10 bg-slate-950/30 flex justify-between items-center">
                     <p className="text-xs text-slate-500">Nu ai găsit răspunsul?</p>
                     <button 
                        onClick={() => {
                            setActiveHelpTopic(null);
                            setShowNewTicketForm(true);
                        }}
                        className="text-xs font-bold text-cyan-400 hover:text-white transition-colors uppercase tracking-wider"
                     >
                        Deschide Tichet
                     </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};