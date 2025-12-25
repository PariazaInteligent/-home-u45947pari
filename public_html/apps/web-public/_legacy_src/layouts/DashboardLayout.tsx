
import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    PieChart,
    History,
    Settings,
    LogOut,
    Menu,
    User,
    Shield,
    ArrowLeft,
    Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function DashboardLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isAdminArea = location.pathname.startsWith('/dashboard/admin');

    const navigation = isAdminArea
        ? [
            { name: 'Utilizatori', href: '/dashboard/admin', icon: User },
            { name: 'Depuneri', href: '/dashboard/admin/deposits', icon: Wallet },
            { name: 'Configurări', href: '/dashboard/admin/settings', icon: Settings },
        ]
        : [
            { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
            { name: 'Portofoliu', href: '/dashboard/portfolio', icon: PieChart },
            { name: 'Tranzacții', href: '/dashboard/transactions', icon: History },
            { name: 'Setări', href: '/dashboard/settings', icon: Settings },
        ];

    return (
        <div className="min-h-screen bg-slate-950 text-white flex">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform lg:transform-none transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-16 flex items-center px-6 border-b border-slate-800">
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            {isAdminArea ? 'Admin Panel' : 'Pariaza Inteligent'}
                        </span>
                    </div>

                    {/* Nav Links */}
                    <nav className="flex-1 px-4 py-6 space-y-1">
                        {isAdminArea && (
                            <Link
                                to="/dashboard"
                                className="flex items-center gap-3 px-4 py-3 mb-4 text-sm font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Înapoi la Investitor
                            </Link>
                        )}

                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                                            ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile & Logout */}
                    <div className="p-4 border-t border-slate-800">
                        <div className="flex items-center gap-3 px-4 py-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                                <User className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {user?.name || user?.email}
                                </p>
                                <p className="text-xs text-slate-500 truncate">{user?.role}</p>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Deconectare
                        </button>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar (Mobile Toggle & Title) */}
                <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-lg"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-lg font-semibold text-white">
                            {isAdminArea ? 'Administrare' : 'Dashboard'}
                        </h1>
                    </div>

                    {/* Admin Badge/Link if Admin */}
                    {user?.role === 'ADMIN' && !isAdminArea && (
                        <Link
                            to="/dashboard/admin"
                            className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-xs font-semibold hover:bg-purple-500/20 transition-colors"
                        >
                            <Shield className="w-3 h-3" />
                            Admin Area
                        </Link>
                    )}
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
