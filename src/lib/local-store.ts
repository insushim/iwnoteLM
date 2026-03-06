/**
 * 로컬 스토리지 기반 질문 이력 관리
 * static export에서 API route 대신 사용
 */

import type { NotebookCategory } from '@/types';

interface QueryRecord {
  id: string;
  question: string;
  category: NotebookCategory;
  trust_score: number;
  created_at: string;
}

const STORAGE_KEY = 'edubrain_queries';

function getQueries(): QueryRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveQueryLocal(question: string, category: NotebookCategory, trustScore: number) {
  const queries = getQueries();
  queries.unshift({
    id: Math.random().toString(36).substring(2),
    question,
    category,
    trust_score: trustScore,
    created_at: new Date().toISOString(),
  });
  if (queries.length > 50) queries.length = 50;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queries));
}

export function getRecentQueriesLocal(): QueryRecord[] {
  return getQueries().slice(0, 10);
}

export function getStatsLocal() {
  const queries = getQueries();
  const avg = queries.length > 0
    ? Math.round(queries.reduce((s, q) => s + q.trust_score, 0) / queries.length)
    : 0;

  return {
    totalQueries: queries.length,
    avgTrustScore: avg,
    recentQueries: queries.slice(0, 5),
  };
}
