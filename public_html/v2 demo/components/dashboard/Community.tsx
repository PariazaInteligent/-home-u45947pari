import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Hash, 
  Users, 
  Send, 
  Bot, 
  ShieldAlert, 
  MoreVertical, 
  Search, 
  Smile, 
  Paperclip,
  Zap,
  Crown,
  Lock
} from 'lucide-react';
import { TiltCard } from '../ui/TiltCard';

interface Message {
  id: string;
  user: string;
  avatar?: string;
  role: 'admin' | 'investor' | 'bot' | 'whale';
  content: string;
  timestamp: string;
  type?: 'text' | 'signal' | 'alert';
}

interface Channel {
  id: string;
  name: string;
  type: 'public' | 'private' | 'read-only';
  unread?: number;
  description: string;
}

// Type definition for the dictionary of messages
type MessageMap = Record<string, Message[]>;

export const Community: React.FC = () => {
  const [activeChannel, setActiveChannel] = useState('general');
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock Channels Definition
  const channels: Channel[] = [
    { id: 'general', name: 'general-lounge', type: 'public', description: 'Discuții generale despre piață și evenimente sportive.' },
    { id: 'strategy', name: 'strategii-avansate', type: 'public', unread: 3, description: 'Matematică, Kelly Criterion și Money Management.' },
    { id: 'signals', name: 'live-signals-feed', type: 'read-only', description: 'Canal automatizat. Doar sistemul postează aici.' },
    { id: 'crypto', name: 'crypto-talk', type: 'public', description: 'Discuții despre Bitcoin, ETH și intersecția cu pariurile.' },
    { id: 'high-rollers', name: 'whale-club-vip', type: 'private', description: 'Zonă exclusivistă pentru investitorii Tier: Whale.' },
  ];

  // Initial Data Per Channel
  const [allMessages, setAllMessages] = useState<MessageMap>({
    'general': [
      { id: 'g1', user: 'System Bot', role: 'bot', content: 'Bine ați venit în General Lounge. Păstrați discuțiile civilizate.', timestamp: '08:00', type: 'alert' },
      { id: 'g2', user: 'Alex I.', role: 'investor', content: 'Salutare! Cine urmărește meciul din seara asta?', timestamp: '10:30' },
      { id: 'g3', user: 'Investitor01', role: 'investor', content: 'Eu. Cred că o să fie un meci strâns, cotele sunt foarte echilibrate.', timestamp: '10:32' },
    ],
    'strategy': [
        { id: 's1', user: 'Mihai Pro', role: 'whale', content: 'Am testat o variantă modificată de Kelly Criterion pentru tenis live.', timestamp: '09:15' },
        { id: 's2', user: 'Admin Root', role: 'admin', content: '@Mihai Pro Interesant. Ai grijă la variance pe seturile decisive.', timestamp: '09:20' },
        { id: 's3', user: 'Mihai Pro', role: 'whale', content: 'Corect. Am redus miza la 1.5% per unitate pentru siguranță.', timestamp: '09:22' },
    ],
    'signals': [
        { id: 'sig1', user: 'Signal Bot', role: 'bot', content: '🚨 VALUE ALERT: Real Madrid vs Barcelona. Over 2.5 Goals @ 1.85. Edge: 6.2%', timestamp: '14:00', type: 'signal' },
        { id: 'sig2', user: 'Signal Bot', role: 'bot', content: '🚨 VALUE ALERT: Djokovic Win 2-0 @ 2.10. Edge: 4.5%', timestamp: '15:30', type: 'signal' },
        { id: 'sig3', user: 'Signal Bot', role: 'bot', content: '📉 MARKET DROP: Liverpool odds dropping fast on Asian Market.', timestamp: '16:45', type: 'alert' },
    ],
    'crypto': [
        { id: 'c1', user: 'CryptoKing', role: 'investor', content: 'BTC atinge suportul de 60k. Oportunitate de acumulare?', timestamp: '11:00' },
        { id: 'c2', user: 'SatoshiFan', role: 'investor', content: 'Aștept confirmarea pe 4h. Nu mă grăbesc.', timestamp: '11:05' },
    ],
    'high-rollers': [
        { id: 'h1', user: 'The Whale', role: 'whale', content: 'Am intrat cu 50k RON pe finala UCL.', timestamp: '20:00' },
        { id: 'h2', user: 'Admin Root', role: 'admin', content: 'Confirmăm lichiditatea. Ordinul a fost procesat prin broker privat.', timestamp: '20:05' },
    ]
  });

  const currentChannelData = channels.find(c => c.id === activeChannel);
  const currentMessages = allMessages[activeChannel] || [];

  // Auto-scroll to bottom when messages or channel changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages, activeChannel]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Prevent sending in read-only channels (just in case)
    if (currentChannelData?.type === 'read-only') return;

    const newMessage: Message = {
      id: Date.now().toString(),
      user: 'Eu (Tu)',
      role: 'investor',
      content: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAllMessages(prev => ({
        ...prev,
        [activeChannel]: [...(prev[activeChannel] || []), newMessage]
    }));
    
    setInputText('');

    // Simulate Bot Response in General channel
    if (activeChannel === 'general' && (inputText.toLowerCase().includes('bot') || inputText.toLowerCase().includes('ajutor'))) {
        setTimeout(() => {
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                user: 'System Bot',
                role: 'bot',
                content: 'Analizez cererea ta... Te rog verifică secțiunea Academie pentru detalii tehnice sau deschide un tichet pentru suport.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setAllMessages(prev => ({
                ...prev,
                [activeChannel]: [...prev[activeChannel], botMsg]
            }));
        }, 1500);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
        
        {/* LEFT SIDEBAR: CHANNELS */}
        <div className="hidden lg:flex lg:col-span-3 flex-col bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
           <div className="p-4 border-b border-white/5 bg-slate-950/30">
              <h3 className="font-display font-bold text-white flex items-center gap-2">
                 <Users className="w-5 h-5 text-violet-400" />
                 Canale Discuții
              </h3>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
              {channels.map(channel => (
                 <button
                    key={channel.id}
                    onClick={() => setActiveChannel(channel.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                       activeChannel === channel.id 
                       ? 'bg-violet-600/20 text-white' 
                       : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                 >
                    <div className="flex items-center gap-2">
                       {channel.type === 'private' ? (
                          <ShieldAlert className="w-4 h-4 text-yellow-500" />
                       ) : channel.type === 'read-only' ? (
                          <Zap className="w-4 h-4 text-emerald-500" />
                       ) : (
                          <Hash className="w-4 h-4 text-slate-500 group-hover:text-violet-400" />
                       )}
                       <span>{channel.name}</span>
                    </div>
                    {channel.unread && activeChannel !== channel.id && (
                       <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full">
                          {channel.unread}
                       </span>
                    )}
                 </button>
              ))}

              <div className="mt-8 mb-2 px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                 Online - Investitori Top
              </div>
              {[1, 2, 3, 4].map(i => (
                 <div key={i} className="flex items-center gap-3 px-3 py-2 opacity-70 hover:opacity-100 cursor-pointer">
                    <div className="relative">
                       <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-slate-300">
                          U{i}
                       </div>
                       <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
                    </div>
                    <div className="text-xs text-slate-300">Investor_0{i}</div>
                 </div>
              ))}
           </div>
        </div>

        {/* MIDDLE: CHAT AREA */}
        <div className="lg:col-span-9 flex flex-col h-full">
           <TiltCard glowColor="purple" noPadding className="h-full flex flex-col relative overflow-hidden">
              
              {/* Chat Header */}
              <div className="h-16 border-b border-white/5 bg-slate-900/80 backdrop-blur flex items-center justify-between px-6 z-10">
                 <div className="flex items-center gap-3">
                    {currentChannelData?.type === 'read-only' ? (
                        <Zap className="w-6 h-6 text-emerald-500" />
                    ) : (
                        <Hash className="w-6 h-6 text-violet-400" />
                    )}
                    <div>
                       <h2 className="font-bold text-white text-sm lg:text-base">#{currentChannelData?.name}</h2>
                       <p className="text-[10px] text-slate-400 hidden sm:block">{currentChannelData?.description}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                       {[1,2,3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white">
                             {i}
                          </div>
                       ))}
                       <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] text-slate-400">
                          +42
                       </div>
                    </div>
                    <div className="h-8 w-px bg-white/10 mx-2"></div>
                    <Search className="w-5 h-5 text-slate-400 cursor-pointer hover:text-white" />
                    <MoreVertical className="w-5 h-5 text-slate-400 cursor-pointer hover:text-white" />
                 </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6 space-y-6 relative">
                  {/* Background Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
                     <MessageSquare className="w-96 h-96" />
                  </div>

                  {currentMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-500">
                          <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
                          <p className="text-sm">Începe conversația în #{currentChannelData?.name}</p>
                      </div>
                  ) : (
                      currentMessages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 group ${msg.user === 'Eu (Tu)' ? 'flex-row-reverse' : ''}`}>
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center border shadow-lg ${
                            msg.role === 'admin' ? 'bg-red-900/20 border-red-500/30 text-red-400' :
                            msg.role === 'bot' ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400' :
                            msg.role === 'whale' ? 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400' :
                            'bg-slate-800 border-slate-700 text-slate-400'
                            }`}>
                            {msg.role === 'admin' ? <ShieldAlert className="w-5 h-5" /> :
                                msg.role === 'bot' ? <Bot className="w-5 h-5" /> :
                                msg.role === 'whale' ? <Crown className="w-5 h-5" /> :
                                <span className="font-bold text-xs">{msg.user.substring(0,2)}</span>}
                            </div>

                            {/* Content */}
                            <div className={`max-w-[80%] lg:max-w-[60%] space-y-1 ${msg.user === 'Eu (Tu)' ? 'text-right' : ''}`}>
                            <div className="flex items-center gap-2 text-xs">
                                <span className={`font-bold ${
                                    msg.role === 'admin' ? 'text-red-400' : 
                                    msg.role === 'bot' ? 'text-emerald-400' : 
                                    msg.role === 'whale' ? 'text-yellow-400' :
                                    'text-slate-300'
                                } ${msg.user === 'Eu (Tu)' ? 'order-last' : ''}`}>
                                    {msg.user}
                                </span>
                                {msg.role !== 'investor' && (
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold border ${
                                        msg.role === 'admin' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                        msg.role === 'bot' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                        'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                                    } ${msg.user === 'Eu (Tu)' ? 'order-last' : ''}`}>
                                        {msg.role.toUpperCase()}
                                    </span>
                                )}
                                <span className="text-slate-600">{msg.timestamp}</span>
                            </div>

                            <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                msg.type === 'alert' 
                                    ? 'bg-red-900/10 border border-red-500/20 text-red-200' 
                                    : msg.type === 'signal'
                                    ? 'bg-emerald-900/10 border border-emerald-500/20 text-emerald-200 font-mono'
                                    : msg.user === 'Eu (Tu)'
                                        ? 'bg-violet-600 text-white rounded-tr-none'
                                        : 'bg-slate-800/50 border border-white/5 text-slate-200 rounded-tl-none'
                            }`}>
                                {msg.content}
                            </div>
                            </div>
                        </div>
                      ))
                  )}
                  <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-slate-900/80 backdrop-blur border-t border-white/5 z-10">
                 {currentChannelData?.type === 'read-only' ? (
                     <div className="flex items-center justify-center p-4 bg-slate-950/50 border border-white/5 rounded-xl text-slate-500 text-sm gap-2">
                         <Lock className="w-4 h-4" />
                         <span>Acest canal este "Read-Only". Doar sistemul poate posta notificări.</span>
                     </div>
                 ) : (
                    <>
                        <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                            <button type="button" className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-white/5 rounded-full transition-colors">
                            <Paperclip className="w-5 h-5" />
                            </button>
                            <input 
                            type="text" 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={`Scrie un mesaj în #${currentChannelData?.name}...`}
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors placeholder:text-slate-600"
                            />
                            <button type="button" className="p-2 text-slate-400 hover:text-yellow-400 hover:bg-white/5 rounded-full transition-colors">
                            <Smile className="w-5 h-5" />
                            </button>
                            <button 
                            type="submit" 
                            disabled={!inputText.trim()}
                            className="p-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-lg shadow-violet-900/20 transition-all"
                            >
                            <Send className="w-4 h-4" />
                            </button>
                        </form>
                        <div className="text-center mt-2">
                            <p className="text-[10px] text-slate-600">
                            Mesajele sunt criptate end-to-end. Nu împărtășiți date sensibile precum parole sau carduri.
                            </p>
                        </div>
                    </>
                 )}
              </div>

           </TiltCard>
        </div>
      </div>
    </div>
  );
};