import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('erp_sidebar_collapsed') === 'true';
  });

  const toggleMobileSidebar = () => {
    setMobileOpen(prev => !prev);
  };

  const toggleDesktopCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('erp_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleToggle = () => {
    if (window.innerWidth < 1024) {
      toggleMobileSidebar();
    } else {
      toggleDesktopCollapse();
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 relative overflow-hidden">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        isOpen={mobileOpen} 
        onClose={() => setMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleDesktopCollapse}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Navbar 
          onToggleSidebar={handleToggle} 
          isCollapsed={isCollapsed}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
