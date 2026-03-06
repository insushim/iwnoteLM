'use client';

import { cn } from '@/lib/utils';

export default function LoadingSpinner({ className, text }: { className?: string; text?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="relative">
        <div className="w-10 h-10 border-4 border-blue-100 rounded-full" />
        <div className="absolute top-0 left-0 w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
      {text && <p className="text-sm text-gray-500 animate-pulse">{text}</p>}
    </div>
  );
}
