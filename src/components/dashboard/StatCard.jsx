import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import './StatCard.css';

/**
 * StatCard component for dashboard statistics
 * - Animated wave design
 * - Unique gradient backgrounds for each card
 * - Icon + large value + label layout
 * - Light and dark mode support
 * - Uses Phosphor icons with duotone weight for large widgets
 */
const StatCard = ({
  icon: Icon,
  value,
  label,
  unit,
  status = 'default',
  gradientId,
  trend,
  className,
  onClick,
  ...props
}) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const gradientStyles = {
    light: [
      'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #5a67d8 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #ed64a6 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 50%, #38b2ac 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 50%, #f6ad55 100%)',
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 50%, #9f7aea 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fc8181 100%)',
      'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #d53f8c 100%)',
      'linear-gradient(135deg, #89f7fe 0%, #66a6ff 50%, #4299e1 100%)',
    ],
    dark: [
      'linear-gradient(135deg, #4a5568 0%, #2d3748 50%, #1a202c 100%)',
      'linear-gradient(135deg, #553c9a 0%, #44337a 50%, #2c2858 100%)',
      'linear-gradient(135deg, #234e52 0%, #1a3a3f 50%, #0f2a2d 100%)',
      'linear-gradient(135deg, #744210 0%, #5c3a1d 50%, #3d260f 100%)',
      'linear-gradient(135deg, #4a1a5c 0%, #3a1446 50%, #280a31 100%)',
      'linear-gradient(135deg, #5c1818 0%, #4a1313 50%, #2d0a0a 100%)',
      'linear-gradient(135deg, #2c4257 0%, #233342 50%, #1a252d 100%)',
      'linear-gradient(135deg, #285e61 0%, #1d4a4d 50%, #123638 100%)',
    ],
  };

  const gradient = isDark
    ? gradientStyles.dark[gradientId % gradientStyles.dark.length]
    : gradientStyles.light[gradientId % gradientStyles.light.length];

  return (
    <div
      className={clsx(
        'e-card playing',
        'transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95',
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        margin: '0 auto',
        background: 'transparent',
        boxShadow: '0px 8px 28px -9px rgba(0,0,0,0.45)',
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
      onClick={onClick}
      {...props}
    >
      {/* Dark overlay for better text visibility */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.2)',
          zIndex: 5,
        }}
      />

      {/* Waves */}
      <div
        className="wave wave-1"
        style={{
          background: gradient,
          width: '300px',
          height: '200px',
          animationDelay: `${-(gradientId * 5)}s`,
        }}
      />
      <div
        className="wave wave-2"
        style={{
          background: gradient,
          width: '300px',
          height: '200px',
          top: '60px',
          animationDelay: `${-(gradientId * 5 + 3)}s`,
        }}
      />
      <div
        className="wave wave-3"
        style={{
          background: gradient,
          width: '300px',
          height: '200px',
          top: '60px',
          animationDelay: `${-(gradientId * 5 + 6)}s`,
        }}
      />

      {/* Icon and content */}
      <div className="infotop">
        <div className="content-wrapper">
          {Icon && (
            <Icon
              className="icon"
              size={32}
              weight="duotone"
              color="white"
              style={{
                marginTop: '0',
                paddingBottom: '0',
              }}
            />
          )}
          <div className="text-content tabular-nums">
            <div className="value">
              {value}
              {unit && <span className="unit">{unit}</span>}
            </div>
            <div className="label">{label}</div>
          </div>
          {trend && (
            <div
              className="name"
              style={{
                color: trend.direction === 'up' ? '#86efac' : '#fca5a5',
              }}
            >
              {`${trend.direction === 'up' ? '↑' : '↓'} ${trend.value}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;

