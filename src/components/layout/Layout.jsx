import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Desktop Sidebar - hidden on mobile, visible on lg+ */}
      <Sidebar />

      {/* Main content wrapper */}
      <div 
        className="flex flex-col min-h-screen lg:pl-64"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Main content area - accounts for bottom nav on mobile (64px) + safe area */}
        <main className="flex-1 pb-20 lg:pb-8 overflow-y-auto">
          <Outlet />
        </main>

        {/* Fixed bottom navigation for mobile - hidden on desktop */}
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
};

export default Layout;

