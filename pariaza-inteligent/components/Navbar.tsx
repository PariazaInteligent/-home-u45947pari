import React, { useState, useEffect } from 'react';
import { Menu, X, Sparkles, LogIn } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Cum Funcționează', href: '/#how-it-works', emoji: '🎯' },
    { name: 'Statistici', href: '/#stats', emoji: '📊' },
    { name: 'Avantaje', href: '/#benefits', emoji: '✨' },
    { name: 'Comunitate', href: '/#community', emoji: '👥' },
  ];

  const handleLogoClick = () => {
    if (location.pathname === '/') {
      window.scrollTo(0, 0);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="fixed top-0 w-full z-50 flex justify-center pt-4 px-4 pointer-events-none">
      <nav
        className={`
        pointer-events-auto
        transition-all duration-500 ease-out
        ${isScrolled
            ? 'w-full md:w-[95%] max-w-6xl bg-white/90 backdrop-blur-xl border-2 border-purple-200 shadow-playful-lg rounded-3xl py-3 px-6'
            : 'w-full max-w-7xl bg-white/70 backdrop-blur-md border-2 border-white/50 rounded-3xl py-4 px-6 shadow-playful'
          }
      `}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center space-x-3 group cursor-pointer"
            onClick={handleLogoClick}
          >
            <div className="relative">
              {/* Prof. Investino Owl */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-playful group-hover:scale-110 transition-transform">
                <span className="text-2xl">🦉</span>
              </div>
              {/* Graduation cap floating badge */}
              <div className="absolute -top-1 -right-1 text-lg animate-wiggle">🎓</div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-gray-900 leading-none">Pariază</span>
              <span className="font-bold text-base text-purple-600 leading-none">Inteligent</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-2">
            <div className="flex bg-gradient-to-r from-purple-50 to-pink-50 rounded-full p-1 border-2 border-purple-200 mr-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="px-4 py-2 text-sm font-bold text-gray-700 hover:text-purple-600 hover:bg-white rounded-full transition-all flex items-center gap-2"
                >
                  <span>{link.emoji}</span>
                  <span>{link.name}</span>
                </a>
              ))}
            </div>

            {/* Login Button */}
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-bold text-gray-700 hover:text-purple-600 flex items-center gap-2 transition-colors rounded-full hover:bg-purple-50"
            >
              <LogIn className="w-4 h-4" />
              Intră în Cont
            </button>

            {/* CTA */}
            <button
              onClick={() => navigate('/register')}
              className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white px-6 py-3 rounded-full font-bold text-sm shadow-playful hover:shadow-playful-lg hover:scale-105 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Începe Gratuit
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-purple-600 p-2 bg-purple-100 rounded-xl border-2 border-purple-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-24 left-4 right-4 bg-white rounded-3xl border-4 border-purple-200 p-6 flex flex-col space-y-4 shadow-playful-lg pointer-events-auto animate-slide-in-bottom">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-gray-700 hover:text-purple-600 text-lg font-bold p-3 border-b-2 border-dashed border-purple-100 flex items-center gap-3"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="text-2xl">{link.emoji}</span>
              <span>{link.name}</span>
            </a>
          ))}
          <div className="pt-4 space-y-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/login');
              }}
              className="w-full py-3 text-purple-600 font-bold border-2 border-purple-300 rounded-2xl flex items-center justify-center gap-2 hover:bg-purple-50 transition-all"
            >
              <LogIn className="w-4 h-4" /> Intră în Cont
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/register');
              }}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white py-3 rounded-2xl font-bold shadow-playful hover:shadow-playful-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Începe Gratuit!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};