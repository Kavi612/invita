"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { AppProviders } from "@/components/providers/AppProviders";
import { useAuthStore } from "@/hooks/use-auth";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === "/login";
  const isRsvpPage = pathname.startsWith("/rsvp");
  const isPublicPage = isLoginPage || isRsvpPage;

  // Client-side layout guard
  useEffect(() => {
    if (!isPublicPage && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isPublicPage, isAuthenticated, pathname, router]);

  // For public pages (e.g. login, public RSVP), render without navigation shell
  if (isPublicPage) {
    return <AppProviders>{children}</AppProviders>;
  }

  // Prevent flash of protected UI if unauthenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppProviders>
      <div className="flex min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans">
        {/* Navigation Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Content Area */}
        <div className="flex flex-1 flex-col min-w-0 overflow-x-hidden">
          <Topbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

          <main className="flex-1 px-4 py-8 sm:px-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </AppProviders>
  );
}
