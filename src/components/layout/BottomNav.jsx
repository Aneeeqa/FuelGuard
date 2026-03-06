import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, History, Settings } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/add', icon: PlusCircle, label: 'Add' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const BottomNav = () => {
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-[#1E293B] border-t border-gray-700 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center w-full h-full min-w-[48px] min-h-[48px]',
                'transition-colors duration-200 no-select touchable',
                isActive
                  ? 'text-[#60A5FA]'
                  : 'text-[#9CA3AF] hover:text-[#D1D5DB] active:text-[#60A5FA]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={clsx(
                    'flex items-center justify-center w-12 h-8 rounded-full transition-colors duration-200',
                    isActive && 'bg-[#60A5FA]/20'
                  )}
                >
                  <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-xs mt-0.5 font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;

