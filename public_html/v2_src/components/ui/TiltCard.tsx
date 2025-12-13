
import React, { useRef, useState, MouseEvent } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'purple' | 'emerald' | 'red';
  noPadding?: boolean;
  hFull?: boolean;
}

export const TiltCard: React.FC<TiltCardProps> = ({ 
  children, 
  className = "", 
  glowColor = 'cyan',
  noPadding = false,
  hFull = true
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -8; // Slight constraint for realism
    const rotateY = ((x - centerX) / centerX) * 8;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  const colors = {
    cyan: 'from-cyan-500/20 to-blue-600/20 border-cyan-500/30 group-hover:border-cyan-400',
    purple: 'from-violet-500/20 to-fuchsia-600/20 border-violet-500/30 group-hover:border-violet-400',
    emerald: 'from-emerald-500/20 to-teal-600/20 border-emerald-500/30 group-hover:border-emerald-400',
    red: 'from-red-500/20 to-orange-600/20 border-red-500/30 group-hover:border-red-400'
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      className={`relative group perspective-1000 ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(${isHovered ? 1.02 : 1}, ${isHovered ? 1.02 : 1}, 1)`,
        transition: 'transform 0.1s ease-out'
      }}
    >
      {/* Back Glow Layer */}
      <div 
        className={`absolute inset-4 rounded-xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 -z-10 bg-gradient-to-r ${
          glowColor === 'cyan' ? 'from-cyan-600 to-blue-600' : 
          glowColor === 'purple' ? 'from-violet-600 to-fuchsia-600' : 
          glowColor === 'emerald' ? 'from-emerald-600 to-teal-600' : 
          'from-red-600 to-orange-600'
        }`}
        style={{ transform: 'translateZ(-20px)' }}
      />

      <div className={`
        ${hFull ? 'h-full' : ''} w-full 
        bg-slate-900/60 backdrop-blur-xl 
        border ${colors[glowColor]} 
        rounded-2xl 
        ${noPadding ? '' : 'p-8'}
        shadow-2xl 
        relative overflow-hidden
        transition-colors duration-300
      `}>
        {/* Technical Corner Markers */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/20 rounded-tl-lg"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/20 rounded-tr-lg"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/20 rounded-bl-lg"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/20 rounded-br-lg"></div>

        {children}
        
        {/* Glossy Reflection */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500" />
      </div>
    </div>
  );
};
