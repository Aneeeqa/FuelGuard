import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Grid2x2, PlusCircle, History, Settings, Truck } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: Grid2x2, label: 'Dashboard' },
  { to: '/add', icon: PlusCircle, label: 'Add' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/fleet', icon: Truck, label: 'Fleet' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const BottomNav = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 border-t z-50 glass animate-fade-in-up"
      style={{ 
        paddingBottom: 'env(safe-area-inset-bottom)',
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--shadow-lg)'
      }}
    >
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ to, icon: Icon, label }, index) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center w-full h-full min-w-[48px] min-h-[48px]',
                'transition-all duration-200 no-select touchable active-scale',
                isActive && 'relative'
              )
            }
            style={({ isActive }) => ({
              animationDelay: `${index * 50}ms`,
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div 
                    className="absolute inset-y-0 w-full opacity-100 animate-fade-in"
                    style={{
                      background: 'var(--accent-blue)',
                      opacity: 0.05
                    }}
                  />
                )}
                <div
                  className={clsx(
                    'flex items-center justify-center w-12 h-10 rounded-2xl transition-all duration-300',
                    'relative z-10'
                  )}
                  style={{
                    backgroundColor: isActive ? 'var(--accent-blue)' : 'transparent',
                    color: isActive ? '#fff' : 'inherit',
                    transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                    boxShadow: isActive ? 'var(--shadow-glow-blue)' : 'none'
                  }}
                >
                  {to === '/add' && !isActive ? (
                    <div 
                      className="absolute inset-0 rounded-2xl bg-gradient-primary animate-pulse-glow"
                      style={{ opacity: 0.2 }}
                    />
                  ) : null}
                  <Icon
                    size={24}
                    weight={isActive ? 'fill' : 'regular'}
                    className="relative z-10"
                  />
                </div>
                <span 
                  className={clsx(
                    'text-xs mt-1 font-medium transition-all duration-200 relative z-10',
                    isActive ? 'text-[var(--accent-blue)] font-semibold' : ''
                  )}
                  style={{ color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)' }}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;

