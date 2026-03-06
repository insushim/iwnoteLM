// D1 Database helper for Cloudflare Pages
// In local dev, uses in-memory storage; in production, uses D1

import { generateId } from './utils';
import type { NotebookCategory } from '@/types';

interface QueryRecord {
  id: string;
  question: string;
  category: NotebookCategory;
  answer: string;
  trust_score: number;
  legal_basis: string;
  sources: string;
  mode: string;
  created_at: string;
}

interface VerificationRecord {
  id: string;
  query: string;
  category: NotebookCategory;
  sources_checked: number;
  agreement_count: number;
  trust_score: number;
  is_verified: boolean;
  stored_to_notebook: boolean;
  created_at: string;
}

// In-memory store for local development
const memoryStore = {
  queries: [] as QueryRecord[],
  verifications: [] as VerificationRecord[],
};

export async function saveQuery(data: {
  question: string;
  category: NotebookCategory;
  answer: string;
  trustScore: number;
  legalBasis: string[];
  sources: string;
  mode: string;
}): Promise<string> {
  const record: QueryRecord = {
    id: generateId(),
    question: data.question,
    category: data.category,
    answer: data.answer,
    trust_score: data.trustScore,
    legal_basis: JSON.stringify(data.legalBasis),
    sources: data.sources,
    mode: data.mode,
    created_at: new Date().toISOString(),
  };
  memoryStore.queries.unshift(record);
  if (memoryStore.queries.length > 100) memoryStore.queries.pop();
  return record.id;
}

export async function saveVerification(data: {
  query: string;
  category: NotebookCategory;
  sourcesChecked: number;
  agreementCount: number;
  trustScore: number;
  isVerified: boolean;
  storedToNotebook: boolean;
}): Promise<string> {
  const record: VerificationRecord = {
    id: generateId(),
    query: data.query,
    category: data.category,
    sources_checked: data.sourcesChecked,
    agreement_count: data.agreementCount,
    trust_score: data.trustScore,
    is_verified: data.isVerified,
    stored_to_notebook: data.storedToNotebook,
    created_at: new Date().toISOString(),
  };
  memoryStore.verifications.unshift(record);
  if (memoryStore.verifications.length > 100) memoryStore.verifications.pop();
  return record.id;
}

export async function getRecentQueries(limit = 10): Promise<QueryRecord[]> {
  return memoryStore.queries.slice(0, limit);
}

export async function getRecentVerifications(limit = 10): Promise<VerificationRecord[]> {
  return memoryStore.verifications.slice(0, limit);
}

export async function getStats() {
  const queries = memoryStore.queries;
  const verifications = memoryStore.verifications;

  const avgTrust = queries.length > 0
    ? Math.round(queries.reduce((sum, q) => sum + q.trust_score, 0) / queries.length)
    : 0;

  const categoryBreakdown: Record<string, { queries: number; verifications: number }> = {};
  for (const q of queries) {
    if (!categoryBreakdown[q.category]) categoryBreakdown[q.category] = { queries: 0, verifications: 0 };
    categoryBreakdown[q.category].queries++;
  }
  for (const v of verifications) {
    if (!categoryBreakdown[v.category]) categoryBreakdown[v.category] = { queries: 0, verifications: 0 };
    categoryBreakdown[v.category].verifications++;
  }

  return {
    totalQueries: queries.length,
    totalVerifications: verifications.length,
    avgTrustScore: avgTrust,
    categoryBreakdown,
    recentQueries: queries.slice(0, 5),
  };
}
