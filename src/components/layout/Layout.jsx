import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import TopNavBar from './TopNavBar';

const Layout = () => {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Desktop Sidebar - hidden on mobile, visible on lg+ */}
      <Sidebar />

      {/* Mobile Top Navigation - hidden on desktop */}
      <div className="lg:hidden">
        <TopNavBar />
      </div>

      {/* Main content wrapper */}
      <div
        className="flex flex-col min-h-screen lg:pl-64"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Main content area */}
        <main className="flex-1 pb-20 lg:pb-8 overflow-y-auto" style={{ paddingTop: '64px' }}>
          <Outlet />
        </main>

        {/* Fixed bottom navigation for mobile */}
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
};

export default Layout;

