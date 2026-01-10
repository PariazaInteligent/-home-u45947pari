import React from 'react';
import { Shield, Brain, TrendingUp, Heart, Sparkles, Target } from 'lucide-react';

interface LandingStats {
  investorCount: number;
  equity: string;
  averageRoi: string;
}

interface AdvantagesProps {
  stats: LandingStats | null;
}

export const Advantages: React.FC<AdvantagesProps> = ({ stats }) => {
  const benefits = [
    {
      icon: Shield,
      emoji: '🛡️',
      title: 'Transparență Totală',
      desc: 'Vezi fiecare pariu plasat, cu timestamp-uri și cote originale. Niciun secret!',
      color: 'from-blue-400 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50'
    },
    {
      icon: Brain,
      emoji: '🧠',
      title: 'Value Betting Inteligent',
      desc: 'Software care scanează 50+ case de pariuri pentru cote greșite matematic.',
      color: 'from-purple-400 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50'
    },
    {
      icon: TrendingUp,
      emoji: '📈',
      title: 'Management Risc Profesionist',
      desc: 'Sistem Kelly Criterion adaptat. Maxim 3% din bancă pe un eveniment.',
      color: 'from-emerald-400 to-green-500',
      bgColor: 'from-emerald-50 to-green-50'
    },
    {
      icon: Heart,
      emoji: '❤️',
      title: 'Zero Emoții',
      desc: 'Disciplină investițională! Decizii strict pe baza datelor statistice.',
      color: 'from-orange-400 to-red-500',
      bgColor: 'from-orange-50 to-red-50'
    }
  ];

  return (
    <section id="benefits" className="py-24 bg-gradient-to-br from-white via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Playful Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-200/30 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-purple-200/30 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-10 text-yellow-300">
          <Sparkles className="w-10 h-10 animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-400 to-purple-500 text-white px-6 py-2 rounded-full font-bold text-sm mb-6 shadow-lg">
            <Target className="w-5 h-5" />
            <span>De Ce Suntem Diferiți</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Avantajele{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              Platformei
            </span>
            {' '}✨
          </h2>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto">
            Nu suntem un grup obișnuit de pariuri. Suntem o platformă de investiții inteligente!
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group relative bg-white rounded-3xl p-8 shadow-playful hover:shadow-playful-lg transition-all transform hover:-translate-y-2 border-4 border-gray-100 hover:border-purple-200"
              >
                {/* Icon + Emoji */}
                <div className="relative mb-6">
                  <div
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform mb-4`}
                  >
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  {/* Floating Emoji */}
                  <div className="absolute -top-2 -right-2 text-4xl animate-bounce">
                    {item.emoji}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed">
                  {item.desc}
                </p>

                {/* Decorative Bottom Badge */}
                <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-200">
                  <div
                    className={`inline-flex items-center gap-1 bg-gradient-to-r ${item.bgColor} px-3 py-1 rounded-full text-xs font-bold text-gray-700`}
                  >
                    <Sparkles className="w-3 h-3" />
                    Benefit #{idx + 1}
                  </div>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none"></div>
              </div>
            );
          })}
        </div>

        {/* Bottom Achievement */}
        {/* Bottom Achievement - Only show if we have data */}
        {stats && (stats.investorCount > 0 || parseFloat(stats.equity.replace(/[^0-9.-]+/g, "")) > 0) && (
          <div className="mt-16 bg-gradient-to-r from-yellow-100 via-orange-100 to-pink-100 rounded-3xl p-8 border-4 border-yellow-300 text-center shadow-playful-lg">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="text-5xl">🏆</div>
              <div className="text-left">
                <h4 className="text-2xl font-bold text-gray-900 mb-1">
                  ROI Mediu: {stats.averageRoi} 🎯
                </h4>
                <p className="text-gray-700">
                  Peste <span className="font-bold text-purple-600">{stats.equity} EUR</span> în fond și <span className="font-bold text-green-600">{stats.investorCount} investitori</span> mulțumiți!
                </p>
              </div>
              <div className="text-5xl">📊</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};