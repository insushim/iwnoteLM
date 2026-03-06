'use client';

import { cn, getTrustScoreColor, getTrustScoreLabel } from '@/lib/utils';

export default function TrustScore({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-semibold border',
      getTrustScoreColor(score),
      sizeClasses[size]
    )}>
      <span className={cn(
        'w-2 h-2 rounded-full',
        score >= 90 ? 'bg-emerald-500' :
        score >= 80 ? 'bg-blue-500' :
        score >= 60 ? 'bg-amber-500' : 'bg-red-500'
      )} />
      {score}점 · {getTrustScoreLabel(score)}
    </span>
  );
}
