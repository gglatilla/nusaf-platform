'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close mobile menu on route change or resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        isOpen={isMobileOpen}
        isCollapsed={isCollapsed}
        onClose={() => setIsMobileOpen(false)}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main content area */}
      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300',
          isCollapsed ? 'lg:pl-16' : 'lg:pl-60'
        )}
      >
        <Header
          onMenuClick={() => setIsMobileOpen(true)}
          isCollapsed={isCollapsed}
        />

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
