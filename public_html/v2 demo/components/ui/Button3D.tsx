import React from 'react';

interface Button3DProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'cyan' | 'purple' | 'danger';
  className?: string;
}

export const Button3D: React.FC<Button3DProps> = ({ 
  children, 
  variant = 'cyan', 
  className = "",
  ...props 
}) => {
  const styles = {
    cyan: {
      bg: 'bg-cyan-600',
      border: 'border-cyan-400',
      shadow: 'shadow-cyan-900',
      text: 'text-white',
      glow: 'group-hover:shadow-[0_0_20px_rgba(6,182,212,0.6)]'
    },
    purple: {
      bg: 'bg-violet-600',
      border: 'border-violet-400',
      shadow: 'shadow-violet-900',
      text: 'text-white',
      glow: 'group-hover:shadow-[0_0_20px_rgba(139,92,246,0.6)]'
    },
    danger: {
      bg: 'bg-red-600',
      border: 'border-red-400',
      shadow: 'shadow-red-900',
      text: 'text-white',
      glow: 'group-hover:shadow-[0_0_20px_rgba(220,38,38,0.6)]'
    }
  };

  const s = styles[variant];

  return (
    <button 
      className={`group relative inline-flex items-center justify-center font-display font-bold uppercase tracking-wider transition-all duration-200 active:translate-y-1 active:shadow-none ${className}`}
      {...props}
    >
      {/* 3D Depth Layer */}
      <div className={`absolute inset-0 translate-y-2 rounded-lg ${s.shadow} bg-opacity-100`}></div>
      <div className={`absolute inset-0 translate-y-2 rounded-lg bg-black/40`}></div>
      
      {/* Main Button Body */}
      <div className={`relative z-10 px-8 py-4 rounded-lg border-t border-l border-r ${s.border} ${s.bg} ${s.text} shadow-lg ${s.glow} transition-shadow`}>
        {/* Shine highlight */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 rounded-t-lg pointer-events-none"></div>
        
        {children}
      </div>
    </button>
  );
};