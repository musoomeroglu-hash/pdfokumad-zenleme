import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Antigravity v2 — Fatura Klasörleme',
  description: 'Zirve Express Aktarım fatura klasörleme otomasyon aracı',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-slate-50">
            <div className="max-w-6xl mx-auto p-6">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
