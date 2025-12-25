import { motion } from 'motion/react';
import { useState } from 'react';

export function InteractiveGeometry() {
  const [isHovered, setIsHovered] = useState(false);

  // Sport elements floating around
  const sportElements = [
    { icon: '⚽', delay: 0, duration: 4, radius: 45 },
    { icon: '🏀', delay: 0.5, duration: 5, radius: 50 },
    { icon: '🎾', delay: 1, duration: 4.5, radius: 48 },
    { icon: '🏈', delay: 1.5, duration: 5.5, radius: 46 },
    { icon: '⚾', delay: 2, duration: 4.8, radius: 52 },
    { icon: '🏐', delay: 2.5, duration: 5.2, radius: 47 },
  ];

  return (
    <div className="w-full h-[400px] md:h-[500px] relative flex items-center justify-center">
      {/* Glow orbs */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="absolute w-64 h-64 bg-blue-500/30 rounded-full blur-3xl" />
        <div className="absolute w-48 h-48 bg-cyan-500/20 rounded-full blur-2xl" />
      </motion.div>

      {/* Main geometry container */}
      <motion.div
        className="relative w-64 h-64 cursor-pointer"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        animate={{
          scale: isHovered ? 1.15 : 1,
          rotateY: isHovered ? 15 : 0,
        }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ perspective: '1000px' }}
      >
        {/* Stadium/Field lines background */}
        <motion.div
          className="absolute inset-0"
          animate={{
            rotateZ: 360,
          }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full opacity-20">
            {/* Football field lines */}
            <rect x="40" y="60" width="120" height="80" fill="none" stroke="#60a5fa" strokeWidth="1" />
            <line x1="100" y1="60" x2="100" y2="140" stroke="#60a5fa" strokeWidth="1" />
            <circle cx="100" cy="100" r="20" fill="none" stroke="#60a5fa" strokeWidth="1" />
            <circle cx="100" cy="100" r="2" fill="#60a5fa" />
          </svg>
        </motion.div>

        {/* Rotating octahedron representation using diamonds */}
        <motion.div
          className="absolute inset-0"
          animate={{
            rotateZ: 360,
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {/* Center diamond */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{
              rotateX: [0, 360],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full"
              style={{ filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))' }}
            >
              {/* Main octahedron shape */}
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.8 }} />
                  <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.6 }} />
                </linearGradient>
                <linearGradient id="grad2" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#60a5fa', stopOpacity: 0.6 }} />
                  <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0.8 }} />
                </linearGradient>
              </defs>
              
              {/* Top pyramid */}
              <polygon
                points="100,30 150,100 100,100"
                fill="url(#grad1)"
                stroke="#60a5fa"
                strokeWidth="1"
                opacity="0.9"
              />
              <polygon
                points="100,30 100,100 50,100"
                fill="url(#grad2)"
                stroke="#60a5fa"
                strokeWidth="1"
                opacity="0.8"
              />
              
              {/* Bottom pyramid */}
              <polygon
                points="100,170 150,100 100,100"
                fill="url(#grad2)"
                stroke="#60a5fa"
                strokeWidth="1"
                opacity="0.8"
              />
              <polygon
                points="100,170 100,100 50,100"
                fill="url(#grad1)"
                stroke="#60a5fa"
                strokeWidth="1"
                opacity="0.7"
              />

              {/* Wireframe overlay */}
              <motion.g
                initial={{ opacity: 0.4 }}
                animate={{
                  opacity: isHovered ? 0.8 : 0.4,
                }}
                transition={{ duration: 0.3 }}
              >
                <line x1="100" y1="30" x2="150" y2="100" stroke="#60a5fa" strokeWidth="1" opacity="0.6" />
                <line x1="100" y1="30" x2="50" y2="100" stroke="#60a5fa" strokeWidth="1" opacity="0.6" />
                <line x1="50" y1="100" x2="150" y2="100" stroke="#60a5fa" strokeWidth="1" opacity="0.6" />
                <line x1="100" y1="170" x2="150" y2="100" stroke="#60a5fa" strokeWidth="1" opacity="0.6" />
                <line x1="100" y1="170" x2="50" y2="100" stroke="#60a5fa" strokeWidth="1" opacity="0.6" />
                <line x1="100" y1="30" x2="100" y2="170" stroke="#60a5fa" strokeWidth="1" opacity="0.3" />
              </motion.g>
            </svg>
          </motion.div>
        </motion.div>

        {/* Outer rotating ring */}
        <motion.div
          className="absolute inset-0"
          animate={{
            rotateZ: -360,
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="0.5"
              opacity="0.3"
              strokeDasharray="4 4"
            />
          </svg>
        </motion.div>

        {/* Floating sport elements */}
        {sportElements.map((element, i) => {
          const angle = (i * Math.PI * 2) / sportElements.length;
          const x = Math.cos(angle) * element.radius;
          const y = Math.sin(angle) * element.radius;
          
          return (
            <motion.div
              key={i}
              className="absolute w-12 h-12 flex items-center justify-center"
              style={{
                left: '50%',
                top: '50%',
                marginLeft: '-24px',
                marginTop: '-24px',
              }}
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: element.duration,
                repeat: Infinity,
                ease: 'linear',
                delay: element.delay,
              }}
            >
              <motion.div
                className="absolute text-3xl filter drop-shadow-lg"
                style={{
                  x: `${x}%`,
                  y: `${y}%`,
                }}
                animate={{
                  rotate: -360,
                  scale: isHovered ? [1, 1.2, 1] : [1, 1.05, 1],
                }}
                transition={{
                  rotate: {
                    duration: element.duration,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: element.delay,
                  },
                  scale: {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: element.delay,
                  },
                }}
              >
                {element.icon}
              </motion.div>
            </motion.div>
          );
        })}

        {/* Data points (representing stats) */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`stat-${i}`}
            className="absolute w-1.5 h-1.5 bg-emerald-400/80 rounded-full"
            style={{
              left: `${50 + Math.cos((i * Math.PI * 2) / 8) * 35}%`,
              top: `${50 + Math.sin((i * Math.PI * 2) / 8) * 35}%`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.25,
            }}
          />
        ))}
      </motion.div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
    </div>
  );
}