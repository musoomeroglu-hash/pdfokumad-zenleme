'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FolderOpen, Settings, Zap, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/mukellefler', label: 'Mükellefler', icon: Users },
  { href: '/klasorleme', label: 'Klasörleme', icon: FolderOpen },
  { href: '/rapor', label: 'Rapor', icon: FileText },
  { href: '/ayarlar', label: 'Ayarlar', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 bg-slate-800 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-slate-700">
        <Zap className="w-5 h-5 text-blue-400 mr-2" />
        <span className="text-white font-semibold text-sm">Antigravity v2</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-700">
        <p className="text-slate-500 text-xs">Zirve Express Aktarım</p>
      </div>
    </aside>
  );
}
