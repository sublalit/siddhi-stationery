import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';

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
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
