import React from 'react';
import { Sparkles, TrendingUp, Shield, CheckCircle } from 'lucide-react';

interface CTAProps {
  onJoin: () => void;
}

export const CTA: React.FC<CTAProps> = ({ onJoin }) => {
  return (
    <section id="start" className="py-24 relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Playful Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-yellow-300/20 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-300/20 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/3 text-yellow-300 animate-pulse">
          <Sparkles className="w-16 h-16" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 rounded-[3rem] p-1 shadow-playful-lg">
          <div className="bg-white rounded-[2.8rem] p-12 md:p-16">
            {/* Character Illustration - Prof. Investino in Action */}
            <div className="flex flex-col lg:flex-row items-center gap-12">
              {/* Left Side: Character */}
              <div className="flex-shrink-0 relative">
                <div className="relative">
                  {/* Prof. Investino Badge */}
                  <div className="w-48 h-48 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center shadow-2xl animate-bounce-slow">
                    <div className="text-8xl transform hover:scale-110 transition-transform">
                      🦉
                    </div>
                  </div>
                  {/* Graduation Cap */}
                  <div className="absolute -top-4 -right-4 text-5xl animate-wiggle">
                    🎓
                  </div>
                  {/* Money Bag */}
                  <div className="absolute -bottom-2 -left-2 text-4xl animate-bounce">
                    💰
                  </div>
                  {/* Sparkle Effect */}
                  <div className="absolute top-0 left-0 text-yellow-400 animate-pulse">
                    <Sparkles className="w-8 h-8" />
                  </div>
                </div>
              </div>

              {/* Right Side: Content */}
              <div className="flex-1 text-center lg:text-left">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-2 rounded-full font-bold text-sm mb-6 shadow-lg">
                  <TrendingUp className="w-5 h-5" />
                  <span>Începe Investiția Ta Astăzi!</span>
                </div>

                {/* Heading */}
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  Gata să începi? 🎉
                </h2>

                {/* Description */}
                <p className="text-xl text-gray-700 mb-8 max-w-xl">
                  Alătură-te celor <span className="font-bold text-purple-600">62 de investitori</span> care
                  câștigă deja cu{' '}
                  <span className="font-bold text-green-600">Prof. Investino</span>! Este simplu,
                  sigur și <span className="font-bold text-orange-600">100% gratuit</span> să începi.
                </p>

                {/* CTA Button */}
                <button
                  onClick={onJoin}
                  className="group relative bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white px-12 py-5 rounded-2xl font-bold text-xl shadow-playful-lg hover:shadow-2xl transform hover:scale-105 transition-all mb-8 w-full lg:w-auto"
                >
                  <span className="flex items-center justify-center gap-3">
                    Începe Acum - E Gratuit!
                    <Sparkles className="w-6 h-6 group-hover:animate-spin" />
                  </span>
                </button>

                {/* Trust Indicators */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>100% Gratuit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-500" />
                    <span>100% Securizat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    <span>70% ROI Mediu</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Achievement Strip */}
            <div className="mt-12 pt-8 border-t-4 border-dashed border-purple-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6">
                  <div className="text-4xl mb-2">⚡</div>
                  <div className="font-bold text-gray-900 text-lg">Start Rapid</div>
                  <div className="text-sm text-gray-600">Înregistrare în 2 minute</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
                  <div className="text-4xl mb-2">🎯</div>
                  <div className="font-bold text-gray-900 text-lg">Expert Guidance</div>
                  <div className="text-sm text-gray-600">Prof. Investino te ghidează</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6">
                  <div className="text-4xl mb-2">💎</div>
                  <div className="font-bold text-gray-900 text-lg">Profit Real</div>
                  <div className="text-sm text-gray-600">526k EUR în fond</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Floating Badges */}
      <div className="absolute bottom-10 left-10 hidden md:block">
        <div className="bg-white rounded-2xl shadow-playful px-4 py-2 flex items-center gap-2 animate-float">
          <div className="text-2xl">🏆</div>
          <div className="text-sm font-bold text-gray-800">Top ROI</div>
        </div>
      </div>
      <div className="absolute top-20 right-10 hidden md:block">
        <div className="bg-white rounded-2xl shadow-playful px-4 py-2 flex items-center gap-2 animate-float-delayed">
          <div className="text-2xl">🔥</div>
          <div className="text-sm font-bold text-gray-800">62 Investitori</div>
        </div>
      </div>
    </section>
  );
};