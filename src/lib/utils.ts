import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { NotebookCategory } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export const CATEGORY_INFO: Record<NotebookCategory, { label: string; emoji: string; color: string }> = {
  education_law: { label: '교육법령', emoji: '⚖️', color: 'indigo' },
  moe_directive: { label: '교육부 훈령·고시', emoji: '📋', color: 'blue' },
  school_violence: { label: '학교폭력', emoji: '🛡️', color: 'red' },
  teacher_hr: { label: '교원 복무·인사', emoji: '👤', color: 'purple' },
  neis: { label: 'NEIS 업무', emoji: '💻', color: 'cyan' },
  classroom: { label: '학급경영', emoji: '🏫', color: 'green' },
  safety: { label: '안전·재난', emoji: '🚨', color: 'orange' },
  special_education: { label: '특수교육·다문화', emoji: '🤝', color: 'pink' },
  curriculum: { label: '교육과정', emoji: '📚', color: 'teal' },
  finance: { label: '예산·재무', emoji: '💰', color: 'amber' },
  general: { label: '일반', emoji: '📌', color: 'slate' },
};

export function getTrustScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-600 bg-emerald-50';
  if (score >= 80) return 'text-blue-600 bg-blue-50';
  if (score >= 60) return 'text-amber-600 bg-amber-50';
  return 'text-red-600 bg-red-50';
}

export function getTrustScoreLabel(score: number): string {
  if (score >= 90) return '매우 높음';
  if (score >= 80) return '높음 (검증 완료)';
  if (score >= 60) return '보통 (추가 확인 필요)';
  return '낮음 (주의)';
}

export function getCategoryColor(category: NotebookCategory): string {
  const colors: Record<NotebookCategory, string> = {
    education_law: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    moe_directive: 'bg-blue-100 text-blue-800 border-blue-200',
    school_violence: 'bg-red-100 text-red-800 border-red-200',
    teacher_hr: 'bg-purple-100 text-purple-800 border-purple-200',
    neis: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    classroom: 'bg-green-100 text-green-800 border-green-200',
    safety: 'bg-orange-100 text-orange-800 border-orange-200',
    special_education: 'bg-pink-100 text-pink-800 border-pink-200',
    curriculum: 'bg-teal-100 text-teal-800 border-teal-200',
    finance: 'bg-amber-100 text-amber-800 border-amber-200',
    general: 'bg-slate-100 text-slate-800 border-slate-200',
  };
  return colors[category];
}
