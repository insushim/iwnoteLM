'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageCircleQuestion, Database, ShieldCheck, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/ask', label: 'AI 질문하기', icon: MessageCircleQuestion },
  { href: '/knowledge', label: '지식베이스', icon: Database },
  { href: '/verify', label: '교차검증 현황', icon: ShieldCheck },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-white border border-gray-200 rounded-lg p-2 shadow-md"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40 transition-transform duration-200',
        'lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">EduBrain</h1>
          <p className="text-xs text-gray-500 mt-1">초등교사 업무·법률 AI 자문</p>
        </div>

        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon size={18} />
                {item.label}
                {item.href === '/ask' && (
                  <span className="ml-auto text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">핵심</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
            <p className="text-xs text-gray-600">교차검증 지식베이스</p>
            <p className="text-[10px] text-gray-400 mt-1">공식 사이트 5곳+ 교차검증</p>
          </div>
        </div>
      </aside>
    </>
  );
}
