import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, History, Settings, Fuel, Shield } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/add', icon: PlusCircle, label: 'Add Entry' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const Sidebar = () => {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#1E293B] border-r border-gray-700">
      {/* Logo/Brand */}
      <div className="flex items-center gap-3 h-16 px-6 border-b border-gray-700">
        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-[#F3F4F6]">Fuel Guard</h1>
          <p className="text-xs text-[#9CA3AF]">Theft Detection</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200',
                'hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-[#1E293B]',
                isActive
                  ? 'bg-[#60A5FA]/20 text-[#60A5FA] shadow-sm'
                  : 'text-[#D1D5DB] hover:text-[#F3F4F6]'
              )
            }
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 rounded-xl">
          <Fuel className="w-5 h-5 text-warning-500" />
          <div className="text-sm">
            <p className="font-medium text-[#F3F4F6]">Fuel Guard</p>
            <p className="text-[#9CA3AF]">Theft Detection System</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
