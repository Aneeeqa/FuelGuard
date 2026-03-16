import { motion } from 'framer-motion';
import { useState } from 'react';

// Cycles through 4 directions based on card index (derived from delay)
const DIRECTIONS = [
  { x: 0,    y: 60  },  // 0 — from bottom
  { x: 60,   y: 0   },  // 1 — from right
  { x: 0,    y: -60 },  // 2 — from top
  { x: -60,  y: 0   },  // 3 — from left
];

const GlassCard = ({ children, className = '', hoverColor = 'rgba(37, 99, 235, 0.1)', delay = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);

  const idx = Math.round(delay / 0.1) % DIRECTIONS.length;
  const { x, y } = DIRECTIONS[idx];

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x, y, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="h-full"
        whileHover={{
          scale: 1.02,
          boxShadow: isHovered ? `0 0 40px ${hoverColor}, 0 0 80px ${hoverColor}40` : '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
        transition={{ duration: 0.3 }}
        style={{
          background: 'linear-gradient(135deg, rgba(20,20,22,0.92) 0%, rgba(28,28,31,0.80) 100%)',
          border: '1px solid rgba(96,165,250,0.12)',
          borderRadius: '24px',
          padding: '32px',
          height: '100%',
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

export default GlassCard;
