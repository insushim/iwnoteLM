'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Card from '@/components/common/Card';
import TrustScore from '@/components/common/TrustScore';
import { CATEGORY_INFO, formatDate, getCategoryColor } from '@/lib/utils';
import { OFFICIAL_SOURCES } from '@/lib/official-sources';
import { getStatsLocal } from '@/lib/local-store';
import type { NotebookCategory } from '@/types';

export default function VerifyPage() {
  const [stats, setStats] = useState<{
    totalQueries: number;
    totalVerifications: number;
    avgTrustScore: number;
    categoryBreakdown: Record<string, { queries: number; verifications: number }>;
    recentQueries: { id: string; question: string; category: NotebookCategory; trust_score: number; created_at: string }[];
  } | null>(null);

  useEffect(() => {
    const s = getStatsLocal();
    setStats({ ...s, totalVerifications: s.totalQueries, categoryBreakdown: {} });
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <Header title="교차검증 현황" description="공식 사이트 교차검증 통계 및 기록" />

      {/* Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{stats?.totalVerifications || 0}</p>
            <p className="text-sm text-gray-500 mt-1">총 교차검증 횟수</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{stats?.avgTrustScore || '-'}</p>
            <p className="text-sm text-gray-500 mt-1">평균 신뢰도 점수</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{OFFICIAL_SOURCES.length}</p>
            <p className="text-sm text-gray-500 mt-1">등록된 공식 사이트</p>
          </div>
        </Card>
      </div>

      {/* Official Sources */}
      <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
        <BarChart3 size={18} /> 등록된 공식 사이트
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        {OFFICIAL_SOURCES.map(source => (
          <Card key={source.id} className="flex items-center gap-3">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
              source.trustLevel === 1 ? 'bg-emerald-100 text-emerald-700' :
              source.trustLevel === 2 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {source.trustLevel === 1 ? '법령' : source.trustLevel === 2 ? '정부' : '공공'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{source.name}</p>
              <p className="text-xs text-gray-500 truncate">{source.description}</p>
            </div>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline shrink-0"
            >
              {source.domain}
            </a>
          </Card>
        ))}
      </div>

      {/* Category breakdown */}
      {stats?.categoryBreakdown && Object.keys(stats.categoryBreakdown).length > 0 && (
        <>
          <h3 className="text-lg font-bold text-gray-900 mb-3">카테고리별 검증 현황</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {Object.entries(stats.categoryBreakdown).map(([cat, data]) => (
              <Card key={cat}>
                <div className="text-center">
                  <span className="text-xl">{CATEGORY_INFO[cat as NotebookCategory]?.emoji || '📌'}</span>
                  <p className="text-xs font-medium text-gray-700 mt-1">
                    {CATEGORY_INFO[cat as NotebookCategory]?.label || cat}
                  </p>
                  <div className="flex justify-center gap-3 mt-2 text-xs text-gray-500">
                    <span>질문: {data.queries}</span>
                    <span>검증: {data.verifications}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Recent verifications */}
      <h3 className="text-lg font-bold text-gray-900 mb-3">최근 검증 기록</h3>
      {stats?.recentQueries && stats.recentQueries.length > 0 ? (
        <div className="space-y-2">
          {stats.recentQueries.map(q => (
            <Card key={q.id}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {q.trust_score >= 80 ? (
                      <CheckCircle size={14} className="text-green-500 shrink-0" />
                    ) : (
                      <XCircle size={14} className="text-red-400 shrink-0" />
                    )}
                    <p className="text-sm font-medium text-gray-900 truncate">{q.question}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 ml-6">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getCategoryColor(q.category)}`}>
                      {CATEGORY_INFO[q.category]?.label || q.category}
                    </span>
                    <span className="text-[10px] text-gray-400">{formatDate(q.created_at)}</span>
                  </div>
                </div>
                <TrustScore score={q.trust_score} size="sm" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-10">
          <ShieldCheck size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">아직 교차검증 기록이 없습니다</p>
          <p className="text-gray-400 text-xs mt-1">AI 질문하기에서 질문하면 자동으로 교차검증됩니다</p>
        </Card>
      )}
    </div>
  );
}
