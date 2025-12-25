import React, { useState, useEffect } from 'react';
import { Menu, X, Hexagon, LogIn } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button3D } from './ui/Button3D';

interface NavbarProps {
  onJoin: () => void;
  onLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onJoin, onLogin }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Protocol', href: '#how-it-works' },
    { name: 'Statistici Live', href: '#stats' },
    { name: 'Avantaje', href: '#benefits' },
    { name: 'Comunitate', href: '#community' },
  ];

  // Handle navigation from any page
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();

    // If we're not on homepage, navigate to homepage first
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // We're on homepage, just scroll
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="fixed top-0 w-full z-50 flex justify-center pt-4 px-4 pointer-events-none">
      <nav className={`
        pointer-events-auto
        transition-all duration-500 ease-out
        ${isScrolled ? 'w-full md:w-[90%] max-w-6xl bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] rounded-full py-3 px-6' : 'w-full max-w-7xl bg-transparent border-transparent py-6 px-6'}
      `}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 blur-lg opacity-20 group-hover:opacity-50 transition-opacity"></div>
              <Hexagon className="w-10 h-10 text-cyan-400 fill-cyan-950/50 stroke-[1.5]" />
              <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-white">PI</div>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg tracking-widest text-white leading-none">PARIAZĂ</span>
              <span className="font-display font-bold text-sm tracking-widest text-cyan-400 leading-none">INTELIGENT</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            <div className="flex bg-slate-950/50 rounded-full p-1 border border-white/5 backdrop-blur-md mr-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="px-5 py-2 text-xs font-bold text-slate-300 hover:text-cyan-300 hover:bg-white/5 rounded-full transition-all uppercase tracking-wider relative group overflow-hidden"
                >
                  <span className="relative z-10">{link.name}</span>
                </a>
              ))}
            </div>

            {/* Login Button */}
            <button
              onClick={onLogin}
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white uppercase tracking-wider mr-2 flex items-center gap-2 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Autentificare
            </button>

            {/* CTA */}
            <div onClick={onJoin} className="pointer-events-auto cursor-pointer">
              <Button3D variant="cyan" className="scale-75 origin-right">Intră în Protocol</Button3D>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-cyan-400 p-2 bg-slate-800/50 rounded-lg border border-cyan-500/30"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-24 left-4 right-4 bg-slate-900/95 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl p-6 flex flex-col space-y-4 shadow-2xl pointer-events-auto animate-in fade-in slide-in-from-top-4">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => { handleNavClick(e, link.href); setMobileMenuOpen(false); }}
              className="text-slate-200 hover:text-cyan-400 text-lg font-display font-bold p-2 border-b border-white/5"
            >
              {link.name}
            </a>
          ))}
          <div className="pt-4 space-y-3">
            <button
              onClick={() => { setMobileMenuOpen(false); onLogin(); }}
              className="w-full py-3 text-slate-300 hover:text-white border border-white/10 rounded-lg flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Autentificare
            </button>
            <div onClick={() => { setMobileMenuOpen(false); onJoin(); }} className="block w-full cursor-pointer">
              <Button3D className="w-full">Intră în Protocol</Button3D>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};