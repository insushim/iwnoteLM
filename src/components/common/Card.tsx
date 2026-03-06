'use client';

import { cn } from '@/lib/utils';

export default function Card({
  children,
  className,
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={cn(
      'bg-white rounded-xl border border-gray-200 p-5',
      hover && 'hover:shadow-md transition-shadow cursor-pointer',
      className
    )}>
      {children}
    </div>
  );
}
