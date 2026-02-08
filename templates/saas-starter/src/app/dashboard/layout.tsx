'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  DashboardLayout,
  PrivyProtectedRoute,
  usePrivy,
} from '@varity-labs/ui-kit';
import { APP_NAME, NAVIGATION_ITEMS } from '@/lib/constants';
import { useProjects, useTasks, useTeam } from '@/lib/hooks';
import { CommandPalette } from '@/components/ui/command-palette';
import { Menu, X } from 'lucide-react';

function RedirectToLogin() {
  const router = useRouter();
  useEffect(() => {
    router.push('/login');
  }, [router]);
  return null;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 768);
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = usePrivy();
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Data for command palette search
  const { data: projects } = useProjects();
  const { data: tasks } = useTasks();
  const { data: team } = useTeam();

  // Cmd+K / Ctrl+K keyboard shortcut
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setCommandPaletteOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navWithActive = NAVIGATION_ITEMS.map((item) => ({
    ...item,
    active: pathname === item.path || pathname.startsWith(item.path + '/'),
  }));

  const userName = user?.email?.address?.split('@')[0] || 'User';
  const userEmail = user?.email?.address || '';

  return (
    <>
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        projects={projects}
        tasks={tasks}
        team={team}
      />

      {/* Mobile hamburger button */}
      {isMobile && (
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="fixed top-4 left-4 z-[60] rounded-lg bg-white p-2 shadow-md border border-gray-200 md:hidden"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5 text-gray-700" />
          ) : (
            <Menu className="h-5 w-5 text-gray-700" />
          )}
        </button>
      )}

      {/* Mobile menu overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar navigation */}
      {isMobile && mobileMenuOpen && (
        <div className="fixed inset-y-0 left-0 z-[56] w-64 bg-white shadow-xl md:hidden overflow-y-auto">
          <div className="p-4 pt-16">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">{APP_NAME}</h2>
              <p className="text-sm text-gray-500">{userEmail}</p>
            </div>
            <nav className="space-y-1">
              {navWithActive.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    item.active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="mt-8 border-t border-gray-200 pt-4">
              <button
                onClick={async () => {
                  await logout();
                  router.push('/');
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop layout — hide sidebar on mobile since we have our own mobile nav */}
      <div className={isMobile ? '[&>div>div:first-child]:hidden' : ''}>
        <DashboardLayout
          companyName={APP_NAME}
          logoUrl="/logo.svg"
          navigationItems={navWithActive}
          showSidebar={!isMobile}
          user={{
            name: userName,
            address: userEmail,
          }}
          onLogout={async () => {
            await logout();
            router.push('/');
          }}
        >
          <div className={isMobile ? 'pt-14' : ''}>
            {children}
          </div>
        </DashboardLayout>
      </div>
    </>
  );
}

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrivyProtectedRoute
      fallback={<RedirectToLogin />}
    >
      <DashboardShell>{children}</DashboardShell>
    </PrivyProtectedRoute>
  );
}
