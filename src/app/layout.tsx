import type { Metadata } from 'next';
import './globals.css';
import TopHeader from '@/components/navigation/TopHeader';
import Sidebar from '@/components/navigation/Sidebar';

export const metadata: Metadata = {
  title: 'Siddhi Stationery — Inventory & Billing Platform',
  description: 'Full-stack inventory management, POS billing, and custom stationery printing platform for Siddhi Stationery.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-50 text-slate-900 flex flex-col antialiased">
        <TopHeader />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
