
import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useNavigate } from 'react-router-dom';

interface InfoPageLayoutProps {
    title: string;
    children: React.ReactNode;
}

export const InfoPageLayout: React.FC<InfoPageLayoutProps> = ({ title, children }) => {
    const navigate = useNavigate();

    return (
        <div className="font-sans antialiased text-slate-200 selection:bg-cyan-500/30 selection:text-cyan-200 min-h-screen flex flex-col bg-slate-950">
            <Navbar onJoin={() => navigate('/register')} onLogin={() => navigate('/login')} />

            <main className="flex-grow pt-32 pb-20 relative">
                {/* Background Elements similar to Hero but subdued */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -z-10"></div>
                </div>

                <div className="max-w-4xl mx-auto px-6 relative z-10">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-12 border-b border-white/10 pb-8">
                        {title}
                    </h1>

                    <div className="prose prose-invert prose-lg max-w-none text-slate-300">
                        {children}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};
