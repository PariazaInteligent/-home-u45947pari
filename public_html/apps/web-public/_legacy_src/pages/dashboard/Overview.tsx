
import { motion } from 'motion/react';
import {
    TrendingUp,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Overview() {
    const { user } = useAuth();

    // Mock Data
    const stats = [
        {
            label: 'Balanță Totală',
            value: '12,450.00 EUR',
            change: '+15.3%',
            positive: true,
            icon: Wallet,
            color: 'blue'
        },
        {
            label: 'Profit / Pierdere (Total)',
            value: '+2,340.50 EUR',
            change: '+4.2%',
            positive: true,
            icon: TrendingUp,
            color: 'emerald'
        },
        {
            label: 'Investiții Active',
            value: '4,100.00 EUR',
            change: '3 tranzacții',
            positive: true, // neutral really
            icon: Activity,
            color: 'purple'
        },
    ];

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                    Salut, {user?.name || 'Investitor'}!
                </h2>
                <p className="text-slate-400">
                    Iată o privire de ansamblu asupra portofoliului tău astăzi.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden group"
                    >
                        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-${stat.color}-500`}>
                            <stat.icon className="w-24 h-24" />
                        </div>

                        <div className="relative z-10">
                            <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center mb-4`}>
                                <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                            </div>

                            <p className="text-sm font-medium text-slate-400 mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-white mb-2">{stat.value}</h3>

                            <div className="flex items-center gap-2 text-sm">
                                {stat.positive ? (
                                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                                ) : (
                                    <ArrowDownRight className="w-4 h-4 text-red-400" />
                                )}
                                <span className={stat.positive ? 'text-emerald-400' : 'text-red-400'}>
                                    {stat.change}
                                </span>
                                <span className="text-slate-500">vs luna trecută</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Chart Placeholder */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Performanță Portofoliu</h3>
                    <select className="bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-1 focus:outline-none focus:border-blue-500">
                        <option>Ultimile 30 zile</option>
                        <option>Anul curent</option>
                        <option>All time</option>
                    </select>
                </div>

                {/* Mock Chart Visual */}
                <div className="h-64 flex items-end justify-between gap-2 px-2">
                    {[30, 45, 35, 55, 40, 60, 50, 75, 65, 80, 70, 90, 85, 95, 100].map((h, i) => (
                        <div
                            key={i}
                            className="w-full bg-gradient-to-t from-blue-600/20 to-blue-500/50 rounded-t-sm hover:from-blue-600/40 hover:to-blue-500/80 transition-all cursor-pointer relative group"
                            style={{ height: `${h}%` }}
                        >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-xs px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                {h * 10} EUR
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-4 text-xs text-slate-500 px-2">
                    <span>01 Dec</span>
                    <span>07 Dec</span>
                    <span>14 Dec</span>
                    <span>21 Dec</span>
                    <span>28 Dec</span>
                </div>
            </motion.div>
        </div>
    );
}
