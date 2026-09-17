'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import TopHeader from '@/components/navigation/TopHeader';
import Sidebar from '@/components/navigation/Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/auth';

  if (isAuthPage) {
    return <div className="min-h-screen bg-[#00aeef]">{children}</div>;
  }

  return (
    <>
      <TopHeader />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 bg-slate-50 pb-20 md:pb-8">
          {children}
        </main>
      </div>
    </>
  );
}
