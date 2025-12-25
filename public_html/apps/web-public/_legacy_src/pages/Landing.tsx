
import { motion, useScroll, useTransform } from "motion/react";
import { InteractiveGeometry } from "../components/InteractiveGeometry";
import { useEngine } from "../hooks/useEngine";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowRight,
    Shield,
    BarChart3,
    Eye,
    LogIn
} from "lucide-react";

export function Landing() {
    // Engine Wiring
    const { data, loading, error } = useEngine();
    const navigate = useNavigate();

    const { scrollYProgress } = useScroll();

    // Parallax effects for different layers
    const y1 = useTransform(
        scrollYProgress,
        [0, 1],
        ["0%", "50%"],
    );
    const y2 = useTransform(
        scrollYProgress,
        [0, 1],
        ["0%", "30%"],
    );
    const opacity = useTransform(
        scrollYProgress,
        [0, 0.3],
        [1, 0],
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
            {/* Background effects */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />
            <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30 pointer-events-none" />

            {/* Header / Top Right Login Button */}
            <div className="absolute top-0 right-0 p-6 z-50">
                <Link to="/login" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/80 border border-slate-700/50 backdrop-blur-sm transition-all duration-300 text-sm font-medium text-slate-300 hover:text-white group">
                    <LogIn className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Autentificare</span>
                </Link>
            </div>

            {/* Hero Section */}
            <motion.section
                className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8"
                style={{ opacity }}
            >
                <div className="max-w-7xl mx-auto w-full">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                                duration: 0.8,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="space-y-8"
                            style={{ y: y1 }}
                        >
                            {/* Badge */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm"
                            >
                                <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400' : (error ? 'bg-red-500' : 'bg-green-400')} animate-pulse`} />
                                <span className="text-sm text-blue-200">
                                    {loading ? 'Connecting Engine...' : (error ? 'Offline' : 'Engine Live Beta')}
                                </span>
                            </motion.div>

                            {/* Headline */}
                            <div className="space-y-4">
                                <h1 className="text-5xl md:text-6xl lg:text-7xl tracking-tight">
                                    Investiții disciplinate
                                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                                        în value betting
                                    </span>
                                </h1>

                                <p className="text-xl text-slate-300 max-w-xl leading-relaxed">
                                    Capital gestionat logic, transparent,
                                    auditabil. Fără promisiuni. Fără jargon. Doar
                                    matematică și proces.
                                </p>
                            </div>

                            {/* CTA */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="flex flex-col sm:flex-row gap-4"
                            >
                                <Link to="/how-it-works" className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-300 overflow-hidden text-center">
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        Vezi cum funcționează
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>

                                <Link to="/documentation" className="px-8 py-4 border border-slate-700 hover:border-slate-600 rounded-lg transition-all duration-300 hover:bg-slate-800/50 backdrop-blur-sm text-center">
                                    Documentație
                                </Link>
                            </motion.div>

                            {/* Stats - WIRED TO ENGINE */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="flex gap-8 pt-8 border-t border-slate-800"
                            >
                                <div>
                                    <div className="text-3xl text-blue-400">
                                        {data ? `€${Math.round(data.equity).toLocaleString()}` : '...'}
                                    </div>
                                    <div className="text-sm text-slate-400">
                                        Total Equity
                                    </div>
                                </div>
                                <div>
                                    <div className="text-3xl text-cyan-400">
                                        {data ? data.nav.toFixed(2) : '...'}
                                    </div>
                                    <div className="text-sm text-slate-400">
                                        NAV
                                    </div>
                                </div>
                                <div>
                                    <div className="text-3xl text-emerald-400">
                                        100%
                                    </div>
                                    <div className="text-sm text-slate-400">
                                        Transparență
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Right 3D Element */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                                duration: 1,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="relative"
                            style={{ y: y2 }}
                        >
                            <div className="relative">
                                {/* Glow effect */}
                                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />

                                {/* Glass container */}
                                <div className="relative rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 p-8 shadow-2xl">
                                    <InteractiveGeometry />
                                </div>

                                {/* Floating info cards - WIRED */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="absolute -left-4 top-1/4 bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-lg p-4 shadow-xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <BarChart3 className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-400">
                                                Edge
                                            </div>
                                            <div className="font-semibold text-emerald-400">
                                                {data ? data.edge : '...'}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1 }}
                                    className="absolute -right-4 bottom-1/4 bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-lg p-4 shadow-xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                            <Shield className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-400">
                                                Last Trade
                                            </div>
                                            <div className="font-semibold">
                                                {data ? data.lastTradeImpact : '...'}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* Context Section */}
            <section className="relative py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    {/* Section header */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16 space-y-4"
                    >
                        <h2 className="text-4xl md:text-5xl">
                            De ce{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                                pariază inteligent
                            </span>
                            ?
                        </h2>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Pentru că aici nu se joacă. Aici se calculează, se
                            execută, se controlează.
                        </p>
                    </motion.div>

                    {/* Features grid */}
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: BarChart3,
                                title: "Proces, nu noroc",
                                description:
                                    "Fiecare decizie bazată pe analiză matematică. Zero impuls, doar edge sistematic.",
                                delay: 0.2,
                            },
                            {
                                icon: Eye,
                                title: "Transparență totală",
                                description:
                                    "Raportare completă, auditabilă. Vezi exact unde merge fiecare leu investit.",
                                delay: 0.4,
                            },
                            {
                                icon: Shield,
                                title: "Control pro-rata",
                                description:
                                    "Plasează doar cât vrei. Retrage când vrei. Capitalul tău rămâne al tău.",
                                delay: 0.6,
                            },
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{
                                    duration: 0.6,
                                    delay: feature.delay,
                                }}
                                whileHover={{ y: -8 }}
                                className="group relative"
                            >
                                {/* Card glow */}
                                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl" />

                                {/* Card */}
                                <div className="relative h-full bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 transition-all duration-300 group-hover:border-blue-500/50">
                                    <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                                        <feature.icon className="w-7 h-7 text-blue-400" />
                                    </div>

                                    <h3 className="text-2xl mb-3">
                                        {feature.title}
                                    </h3>
                                    <p className="text-slate-400 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Bottom CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                        className="mt-16 text-center"
                    >
                        <div className="inline-flex flex-col items-center gap-4 bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
                            <p className="text-lg text-slate-300">
                                Gata să investești disciplinat?
                            </p>
                            <Link to="/waitlist" className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 opacity-100 flex items-center gap-2">
                                Intră pe listă de așteptare
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <p className="text-sm text-slate-500">
                                Fără PII. Fără date sensibile. Doar email pentru
                                acces beta.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative border-t border-slate-800 py-8 px-4">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
                    <div>
                        © 2024 Pariază Inteligent. Toate drepturile
                        rezervate.
                    </div>
                    <div className="flex gap-6">
                        <Link
                            to="/terms"
                            className="hover:text-slate-300 transition-colors"
                        >
                            Termeni
                        </Link>
                        <Link
                            to="/privacy"
                            className="hover:text-slate-300 transition-colors"
                        >
                            Confidențialitate
                        </Link>
                        <Link
                            to="/contact"
                            className="hover:text-slate-300 transition-colors"
                        >
                            Contact
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
