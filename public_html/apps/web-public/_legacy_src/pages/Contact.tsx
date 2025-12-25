
import { motion } from 'motion/react';
import { ArrowLeft, Mail, MessageSquare } from 'lucide-react';

interface ContactProps {
    onBack?: () => void;
    onNavigate?: (page: string) => void;
}

export function Contact({ onBack, onNavigate }: ContactProps) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white relative">
            {/* Background effects */}
            <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20 pointer-events-none" />

            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-50 border-b border-slate-800 backdrop-blur-xl bg-slate-900/80"
            >
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span>Înapoi</span>
                    </button>
                    <div className="text-sm text-slate-500">Contact</div>
                </div>
            </motion.header>

            {/* Main content */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
                {/* Intro */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 text-center"
                >
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto">
                        <Mail className="w-8 h-8 text-blue-400" />
                    </div>
                    <h1 className="text-3xl md:text-4xl text-slate-100">
                        Contactează-ne
                    </h1>
                    <p className="text-lg text-slate-400 leading-relaxed max-w-lg mx-auto">
                        Ai întrebări despre platformă sau vrei să discuți oportunități? Suntem aici.
                    </p>
                </motion.div>

                {/* Contact Options */}
                <div className="grid md:grid-cols-2 gap-6">
                    <motion.a
                        href="mailto:contact@pariazainteligent.ro"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-center p-8 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 hover:border-blue-500/30 transition-all group"
                    >
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                            <Mail className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-200 mb-2">Email</h3>
                        <p className="text-slate-400 text-sm mb-4">Pentru orice întrebări generale</p>
                        <span className="text-blue-400 font-medium">contact@pariazainteligent.ro</span>
                    </motion.a>

                    <motion.a
                        href="#"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col items-center p-8 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 hover:border-emerald-500/30 transition-all group cursor-not-allowed opacity-75"
                    >
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                            <MessageSquare className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-200 mb-2">Live Chat</h3>
                        <p className="text-slate-400 text-sm mb-4">Disponibil în curând pentru membri</p>
                        <span className="text-emerald-400/50 font-medium">Coming Soon</span>
                    </motion.a>
                </div>

                {/* Footer */}
                <div className="pt-8 border-t border-slate-800 text-center">
                    <div className="flex justify-center gap-6 text-sm text-slate-500">
                        <button onClick={() => onNavigate?.('terms')} className="hover:text-slate-300 transition-colors">Termeni</button>
                        <button onClick={() => onNavigate?.('privacy')} className="hover:text-slate-300 transition-colors">Confidențialitate</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
