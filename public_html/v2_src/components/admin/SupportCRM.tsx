
import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  User, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Send, 
  MoreVertical, 
  CreditCard, 
  ShieldAlert, 
  History,
  CornerUpLeft,
  Mic,
  Paperclip,
  Ban,
  Unlock,
  RefreshCw,
  Archive
} from 'lucide-react';
import { TiltCard } from '../ui/TiltCard';
import { Button3D } from '../ui/Button3D';

interface Message {
  id: string;
  sender: 'admin' | 'user' | 'system';
  content: string;
  timestamp: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  tier: 'Entry' | 'Investor' | 'Pro' | 'Whale';
  totalDeposited: number;
  netProfit: number;
  riskScore: number; // 0-100
  kycStatus: 'Verified' | 'Pending' | 'Rejected';
  lastActive: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: 'open' | 'pending' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  category: 'Financial' | 'Technical' | 'Account';
  user: UserProfile;
  messages: Message[];
  created: string;
}

export const SupportCRM: React.FC = () => {
  // --- MOCK DATA ---
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 'TKT-9921',
      subject: 'Retragere blocată de 24h',
      status: 'open',
      priority: 'high',
      category: 'Financial',
      created: '2 hours ago',
      user: {
        id: 'USR-8821',
        name: 'Mihai Popescu',
        email: 'mihai.pop@gmail.com',
        tier: 'Pro',
        totalDeposited: 15400,
        netProfit: -2300,
        riskScore: 12,
        kycStatus: 'Verified',
        lastActive: '5 min ago'
      },
      messages: [
        { id: 'm1', sender: 'user', content: 'Salut, am cerut o retragere ieri și încă apare ca "Pending". De obicei durează o oră.', timestamp: '10:30' },
        { id: 'm2', sender: 'system', content: 'Automated Check: Withdrawal flagged for manual review due to sum > 5000 RON.', timestamp: '10:31' }
      ]
    },
    {
      id: 'TKT-9844',
      subject: 'Eroare la plasare pariu Live',
      status: 'pending',
      priority: 'medium',
      category: 'Technical',
      created: '5 hours ago',
      user: {
        id: 'USR-7732',
        name: 'Elena D.',
        email: 'elena.d@yahoo.com',
        tier: 'Investor',
        totalDeposited: 2500,
        netProfit: 450,
        riskScore: 45,
        kycStatus: 'Verified',
        lastActive: '1 hour ago'
      },
      messages: [
        { id: 'm1', sender: 'user', content: 'Încerc să pariez pe meciul de tenis dar primesc eroare 503.', timestamp: '08:15' },
        { id: 'm2', sender: 'admin', content: 'Bună Elena. A fost o mentenanță scurtă la providerul de cote. Mai persistă problema?', timestamp: '09:00' },
        { id: 'm3', sender: 'user', content: 'Acum merge, dar cota a scăzut. Pot primi diferența?', timestamp: '09:15' }
      ]
    },
    {
      id: 'TKT-9102',
      subject: 'Vreau să schimb limita de depunere',
      status: 'resolved',
      priority: 'low',
      category: 'Account',
      created: '1 day ago',
      user: {
        id: 'USR-1002',
        name: 'George V.',
        email: 'george.v@outlook.com',
        tier: 'Entry',
        totalDeposited: 500,
        netProfit: 0,
        riskScore: 5,
        kycStatus: 'Pending',
        lastActive: 'Yesterday'
      },
      messages: [
        { id: 'm1', sender: 'user', content: 'Cum pot mări limita zilnică?', timestamp: 'Yesterday' },
        { id: 'm2', sender: 'admin', content: 'Salut George. Trebuie să finalizezi procesul KYC complet pentru a ridica limitele.', timestamp: 'Yesterday' }
      ]
    }
  ]);

  const [selectedTicketId, setSelectedTicketId] = useState<string>('TKT-9921');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved'>('all');
  const [replyText, setReplyText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- DERIVED STATE ---
  const activeTicket = tickets.find(t => t.id === selectedTicketId) || tickets[0];
  
  const filteredTickets = tickets.filter(t => {
      if (filterStatus === 'all') return t.status !== 'resolved'; // Show active by default in 'all' view or change logic
      if (filterStatus === 'open') return t.status === 'open' || t.status === 'pending';
      return t.status === 'resolved';
  });

  // --- EFFECTS ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTicket]);

  // --- ACTIONS ---
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim()) return;

    const newMsg: Message = {
        id: `m-${Date.now()}`,
        sender: 'admin',
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setTickets(prev => prev.map(t => 
        t.id === activeTicket.id 
        ? { ...t, messages: [...t.messages, newMsg], status: 'pending' } 
        : t
    ));
    setReplyText('');
  };

  const handleQuickReply = (text: string) => {
      setReplyText(text);
  };

  const handleStatusChange = (newStatus: 'open' | 'resolved') => {
      setTickets(prev => prev.map(t => 
        t.id === activeTicket.id ? { ...t, status: newStatus } : t
      ));
  };

  // Helper for Styles
  const getPriorityColor = (p: string) => {
      switch(p) {
          case 'high': return 'text-red-500 bg-red-500/10 border-red-500/20';
          case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
          case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
          default: return 'text-slate-500';
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-140px)] min-h-[600px] flex flex-col">
        
        {/* Top KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-shrink-0">
            <div className="bg-slate-900/50 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Open Tickets</div>
                    <div className="text-xl font-bold text-white">{tickets.filter(t => t.status === 'open').length}</div>
                </div>
                <AlertCircle className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="bg-slate-900/50 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Avg. Response</div>
                    <div className="text-xl font-bold text-emerald-400">12m</div>
                </div>
                <Clock className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="bg-slate-900/50 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Escalated</div>
                    <div className="text-xl font-bold text-red-400">1</div>
                </div>
                <ShieldAlert className="w-5 h-5 text-red-500" />
            </div>
            <div className="bg-slate-900/50 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Online Agents</div>
                    <div className="text-xl font-bold text-cyan-400">3</div>
                </div>
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
            </div>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 grid lg:grid-cols-12 gap-6 overflow-hidden">
            
            {/* LEFT: Ticket Queue */}
            <div className="lg:col-span-3 flex flex-col bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-slate-950/30">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Search tickets..." 
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:border-cyan-500 outline-none"
                        />
                    </div>
                    <div className="flex bg-slate-900 p-1 rounded-lg border border-white/5">
                        <button 
                            onClick={() => setFilterStatus('all')}
                            className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded transition-colors ${filterStatus === 'all' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Active
                        </button>
                        <button 
                            onClick={() => setFilterStatus('open')}
                            className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded transition-colors ${filterStatus === 'open' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Open
                        </button>
                        <button 
                            onClick={() => setFilterStatus('resolved')}
                            className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded transition-colors ${filterStatus === 'resolved' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Closed
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {filteredTickets.map(ticket => (
                        <div 
                            key={ticket.id}
                            onClick={() => setSelectedTicketId(ticket.id)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all group relative overflow-hidden ${
                                selectedTicketId === ticket.id 
                                ? 'bg-cyan-900/20 border-cyan-500/50' 
                                : 'bg-slate-900/30 border-white/5 hover:bg-white/5'
                            }`}
                        >
                            {selectedTicketId === ticket.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500"></div>}
                            
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-mono text-[10px] text-slate-500">{ticket.id}</span>
                                <span className="text-[10px] text-slate-400">{ticket.created}</span>
                            </div>
                            <h4 className={`text-sm font-bold mb-2 line-clamp-1 ${selectedTicketId === ticket.id ? 'text-white' : 'text-slate-300'}`}>
                                {ticket.subject}
                            </h4>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${getPriorityColor(ticket.priority)}`}>
                                    {ticket.priority}
                                </span>
                                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                                    {ticket.category}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CENTER: Communication Console */}
            <div className="lg:col-span-6 flex flex-col h-full">
                <TiltCard glowColor="purple" noPadding className="h-full flex flex-col relative overflow-hidden">
                    
                    {/* Chat Header */}
                    <div className="h-16 border-b border-white/5 bg-slate-900/80 backdrop-blur flex items-center justify-between px-6 z-10">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${activeTicket.category === 'Financial' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                {activeTicket.category === 'Financial' ? <CreditCard className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm line-clamp-1">{activeTicket.subject}</h3>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    <span>ID: {activeTicket.id}</span>
                                    <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                    <span className={activeTicket.status === 'open' ? 'text-green-400' : 'text-slate-400'}>
                                        {activeTicket.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {activeTicket.status !== 'resolved' ? (
                                <button 
                                    onClick={() => handleStatusChange('resolved')}
                                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                >
                                    <CheckCircle2 className="w-3 h-3" /> Resolve
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handleStatusChange('open')}
                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                >
                                    <RefreshCw className="w-3 h-3" /> Reopen
                                </button>
                            )}
                            <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-slate-950/30">
                        {activeTicket.messages.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl p-4 text-sm ${
                                    msg.sender === 'admin' 
                                    ? 'bg-violet-600 text-white rounded-tr-none shadow-lg shadow-violet-900/20' 
                                    : msg.sender === 'system'
                                    ? 'bg-slate-800 border border-yellow-500/30 text-yellow-100 w-full text-center font-mono text-xs'
                                    : 'bg-slate-800 border border-white/10 text-slate-200 rounded-tl-none'
                                }`}>
                                    {msg.content}
                                </div>
                                {msg.sender !== 'system' && (
                                    <span className="text-[10px] text-slate-500 mt-1 px-1">
                                        {msg.sender === 'admin' ? 'Admin' : activeTicket.user.name} • {msg.timestamp}
                                    </span>
                                )}
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-slate-900/80 backdrop-blur border-t border-white/5 z-10 space-y-3">
                        {/* Smart Replies */}
                        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                            {['Investigăm situația...', 'Te rog să aștepți 24h.', 'Confirmă te rog datele.', 'Ticket escaladat.'].map((reply, i) => (
                                <button 
                                    key={i}
                                    onClick={() => handleQuickReply(reply)}
                                    className="whitespace-nowrap px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-full text-[10px] text-slate-300 transition-colors"
                                >
                                    {reply}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                            <button type="button" className="p-2 text-slate-400 hover:text-cyan-400 transition-colors">
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <input 
                                type="text" 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Scrie un răspuns..."
                                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-sm text-white focus:border-violet-500 outline-none transition-colors"
                            />
                            <button type="button" className="p-2 text-slate-400 hover:text-cyan-400 transition-colors">
                                <Mic className="w-5 h-5" />
                            </button>
                            <button 
                                type="submit" 
                                disabled={!replyText.trim()}
                                className="p-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl shadow-lg transition-all"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </TiltCard>
            </div>

            {/* RIGHT: User CRM Dossier */}
            <div className="lg:col-span-3 flex flex-col h-full">
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl h-full overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-white/5 relative overflow-hidden bg-slate-950/50">
                        {/* ID Card Header */}
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <User className="w-24 h-24 text-white" />
                        </div>
                        <div className="relative z-10 text-center">
                            <div className="w-20 h-20 bg-slate-800 rounded-full border-2 border-cyan-500 mx-auto mb-3 flex items-center justify-center text-xl font-bold text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                                {activeTicket.user.name.substring(0,2).toUpperCase()}
                            </div>
                            <h3 className="font-bold text-white text-lg">{activeTicket.user.name}</h3>
                            <div className="flex justify-center items-center gap-2 mt-1">
                                <span className="text-xs text-slate-400 font-mono">{activeTicket.user.id}</span>
                                <span className={`text-[10px] font-bold px-1.5 rounded uppercase border ${
                                    activeTicket.user.tier === 'Whale' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 
                                    activeTicket.user.tier === 'Pro' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                                    'bg-slate-700 text-slate-300 border-slate-600'
                                }`}>{activeTicket.user.tier}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-6">
                        {/* Vital Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-950 p-3 rounded-lg border border-white/5">
                                <div className="text-[10px] text-slate-500 uppercase font-bold">Total Deposited</div>
                                <div className="text-sm font-bold text-white">{activeTicket.user.totalDeposited} RON</div>
                            </div>
                            <div className="bg-slate-950 p-3 rounded-lg border border-white/5">
                                <div className="text-[10px] text-slate-500 uppercase font-bold">Net Profit</div>
                                <div className={`text-sm font-bold ${activeTicket.user.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {activeTicket.user.netProfit} RON
                                </div>
                            </div>
                        </div>

                        {/* Risk & Status */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">Risk Score</span>
                                <span className={`font-bold ${activeTicket.user.riskScore > 50 ? 'text-red-400' : 'text-emerald-400'}`}>{activeTicket.user.riskScore}/100</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full ${activeTicket.user.riskScore > 50 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                    style={{ width: `${activeTicket.user.riskScore}%` }}
                                ></div>
                            </div>
                            
                            <div className="flex justify-between items-center text-xs pt-2 border-t border-white/5">
                                <span className="text-slate-400">KYC Status</span>
                                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                                    <CheckCircle2 className="w-3 h-3" /> {activeTicket.user.kycStatus}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">Last Active</span>
                                <span className="text-slate-200">{activeTicket.user.lastActive}</span>
                            </div>
                        </div>

                        {/* Recent History */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                <History className="w-3 h-3" /> Recent Activity
                            </h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs p-2 bg-white/5 rounded border border-white/5">
                                    <span className="text-slate-300">Bet Placed (Football)</span>
                                    <span className="text-slate-500">2h ago</span>
                                </div>
                                <div className="flex justify-between text-xs p-2 bg-white/5 rounded border border-white/5">
                                    <span className="text-slate-300">Login (IP: 89.23...)</span>
                                    <span className="text-slate-500">5h ago</span>
                                </div>
                                <div className="flex justify-between text-xs p-2 bg-white/5 rounded border border-white/5">
                                    <span className="text-red-400">Failed Withdraw</span>
                                    <span className="text-slate-500">Yesterday</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Admin Actions */}
                    <div className="p-4 bg-slate-950/80 border-t border-white/10 space-y-2">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Quick Actions</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <button className="p-2 bg-red-900/20 hover:bg-red-900/30 border border-red-500/20 text-red-400 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1">
                                <Ban className="w-3 h-3" /> Freeze
                            </button>
                            <button className="p-2 bg-yellow-900/20 hover:bg-yellow-900/30 border border-yellow-500/20 text-yellow-400 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1">
                                <CornerUpLeft className="w-3 h-3" /> Refund
                            </button>
                            <button className="p-2 bg-blue-900/20 hover:bg-blue-900/30 border border-blue-500/20 text-blue-400 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1 col-span-2">
                                <Archive className="w-3 h-3" /> Archive User Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
  );
};
