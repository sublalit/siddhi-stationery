'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import TopHeader from '@/components/navigation/TopHeader';
import Sidebar from '@/components/navigation/Sidebar';
import { AuthProvider } from '@/lib/authContext';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage =
    pathname === '/auth' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/pending' ||
    pathname === '/forgot-password' ||
    pathname === '/update-password';

  if (isAuthPage) {
    return (
      <AuthProvider>
        <div className="min-h-screen bg-[#00aeef]">{children}</div>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <TopHeader />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 p-3 sm:p-6 lg:p-8 bg-slate-50 pb-20 md:pb-8">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
