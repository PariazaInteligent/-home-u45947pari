import React from 'react';

interface Button3DProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'cyan';
  size?: 'sm' | 'md' | 'lg';
}

export const Button3D: React.FC<Button3DProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {

  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-400 text-white shadow-[0_4px_0_#1E40AF]',
    secondary: 'bg-slate-200 hover:bg-slate-100 text-slate-700 shadow-[0_4px_0_#94A3B8]',
    danger: 'bg-red-500 hover:bg-red-400 text-white shadow-[0_4px_0_#991B1B]',
    success: 'bg-[#58CC02] hover:bg-[#46A302] text-white shadow-[0_4px_0_#46A302]',
    outline: 'bg-transparent border-2 border-slate-200 text-slate-400 hover:bg-slate-50 shadow-[0_4px_0_#E2E8F0]',
    cyan: 'bg-[#1CB0F6] hover:bg-[#1899D6] text-white shadow-[0_4px_0_#1899D6]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-lg',
  };

  const activeStyle = 'active:translate-y-[4px] active:shadow-none transition-all rounded-xl font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button
      className={`${variants[variant]} ${sizes[size]} ${activeStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};