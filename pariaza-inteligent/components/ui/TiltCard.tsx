import React, { useRef, useState } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'purple' | 'red' | 'green';
  noPadding?: boolean;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = '',
  glowColor = 'cyan',
  noPadding = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const div = cardRef.current;
    const rect = div.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const rotateX = (mouseY / height - 0.5) * 20; // -10 to 10 deg
    const rotateY = (mouseX / width - 0.5) * -20; // 10 to -10 deg

    setRotation({ x: rotateX, y: rotateY });
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setOpacity(0);
  };

  const glowColors = {
    cyan: 'from-cyan-500/20 to-blue-500/20',
    purple: 'from-purple-500/20 to-pink-500/20',
    red: 'from-red-500/20 to-orange-500/20',
    green: 'from-emerald-500/20 to-green-500/20',
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-3xl transition-transform duration-200 ease-out transform-gpu hover:z-50 ${className} ${!noPadding ? 'p-6' : ''}`}
      style={{
        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1, 1, 1)`,
        boxShadow: opacity > 0 ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : 'none',
      }}
    >
      <div
        className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${glowColors[glowColor]} opacity-0 transition-opacity duration-300 pointer-events-none`}
        style={{ opacity }}
      ></div>
      <div className="relative z-10 h-full">
        {children}
      </div>

      {/* Border Gradient */}
      <div className="absolute inset-0 rounded-3xl border border-white/10 pointer-events-none"></div>
    </div>
  );
};
