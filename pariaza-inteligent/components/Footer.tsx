import React from 'react';
import { Heart, Mail, Shield, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LandingStats {
  investorCount: number;
  equity: string;
  averageRoi: string;
}

interface FooterProps {
  stats: LandingStats | null;
}

export const Footer: React.FC<FooterProps> = ({ stats }) => {

  return (
    <footer className="bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 pt-20 pb-12 relative overflow-hidden">
      {/* Playful Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-white rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/3 text-white">
          <Sparkles className="w-16 h-16 animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Col 1: Logo & Description */}
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-playful">
                <span className="text-3xl">🦉</span>
              </div>
              <div>
                <div className="font-bold text-2xl text-white">Pariază Inteligent</div>
                <div className="text-purple-200 text-sm">cu Prof. Investino</div>
              </div>
            </div>
            <p className="text-purple-100 text-sm leading-relaxed max-w-sm">
              Transformăm pariurile în investiții inteligente prin matematică, disciplină și
              transparență! 🎯 Alătură-te celor {stats?.investorCount || 0} de investitori care câștigă deja!
            </p>
            {/* Achievement Badge */}
            {stats && (stats.investorCount > 0 || parseFloat(stats.averageRoi) !== 0) && (
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-bold">
                <span className="text-xl">🏆</span>
                <span>ROI mediu: {stats.averageRoi} 🎯</span>
              </div>
            )}
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-wider flex items-center gap-2">

              <Sparkles className="w-4 h-4" />
              Platformă
            </h4>
            <ul className="space-y-3 text-sm text-purple-100">
              <li>
                <a
                  href="/#how-it-works"
                  className="hover:text-white transition-colors flex items-center gap-2"
                >
                  <span>🎯</span> Cum Funcționează
                </a>
              </li>
              <li>
                <a href="/#stats" className="hover:text-white transition-colors flex items-center gap-2">
                  <span>📊</span> Statistici Live
                </a>
              </li>
              <li>
                <a href="/#benefits" className="hover:text-white transition-colors flex items-center gap-2">
                  <span>✨</span> Avantaje
                </a>
              </li>
              <li>
                <a
                  href="/#community"
                  className="hover:text-white transition-colors flex items-center gap-2"
                >
                  <span>👥</span> Comunitate
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Support */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Legal & Suport
            </h4>
            <ul className="space-y-3 text-sm text-purple-100">
              <li>
                <Link to="/terms" className="hover:text-white transition-colors flex items-center gap-2">
                  <span>📄</span> Termeni și Condiții
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors flex items-center gap-2">
                  <span>🔒</span> Confidențialitate
                </Link>
              </li>
              <li>
                <Link to="/responsible-gaming" className="hover:text-white transition-colors flex items-center gap-2">
                  <span>⚠️</span> Joc Responsabil (18+)
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t-2 border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-purple-200 text-sm flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-300 animate-pulse" />
            <span>© {new Date().getFullYear()} Pariază Inteligent. Făcut cu pasiune pentru investitori inteligenți!</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Social Links (Optional) */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-green-200 text-sm font-bold">Live & Active</span>
            </div>
          </div>
        </div>

        {/* Fun Bottom Message */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full text-white text-sm">
            <span className="text-xl">🚀</span>
            <span className="font-bold">Start Your Investment Journey Today!</span>
            <span className="text-xl">💰</span>
          </div>
        </div>
      </div>
    </footer>
  );
};