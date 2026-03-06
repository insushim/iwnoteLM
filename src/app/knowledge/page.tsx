'use client';

import { useState } from 'react';
import { Database, Play, Loader2, CheckCircle, XCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Card from '@/components/common/Card';
import TrustScore from '@/components/common/TrustScore';
import { CATEGORY_INFO, cn, getCategoryColor } from '@/lib/utils';
import type { NotebookCategory, CollectResult } from '@/types';

const CATEGORIES = Object.entries(CATEGORY_INFO) as [NotebookCategory, typeof CATEGORY_INFO[NotebookCategory]][];

export default function KnowledgePage() {
  const [collecting, setCollecting] = useState<NotebookCategory | null>(null);
  const [results, setResults] = useState<Record<string, CollectResult>>({});

  const handleCollect = async (category: NotebookCategory) => {
    if (collecting) return;
    setCollecting(category);

    try {
      const res = await fetch('/api/auto-collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, maxTopics: 3 }),
      });
      const data = await res.json();
      if (data.success) {
        setResults(prev => ({ ...prev, [category]: data.result }));
      }
    } catch {
      // silently fail
    } finally {
      setCollecting(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Header title="지식베이스 관리" description="카테고리별 교차검증 지식을 자동 수집·관리합니다" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {CATEGORIES.map(([key, info]) => {
          const result = results[key];
          const isCollecting = collecting === key;

          return (
            <Card key={key} className="relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{info.emoji}</span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{info.label}</h3>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border', getCategoryColor(key))}>
                      {key}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleCollect(key)}
                  disabled={!!collecting}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    isCollecting
                      ? 'bg-blue-50 text-blue-600'
                      : collecting
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  )}
                >
                  {isCollecting ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                  {isCollecting ? '수집 중...' : '자동 수집'}
                </button>
              </div>

              {/* Collect results */}
              {result && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                    <span>검색: {result.searched}</span>
                    <span className="text-green-600">검증: {result.verified}</span>
                    <span className="text-blue-600">저장: {result.stored}</span>
                    {result.failed > 0 && <span className="text-red-500">실패: {result.failed}</span>}
                  </div>
                  <div className="space-y-1.5">
                    {result.sources.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {s.stored ? (
                          <CheckCircle size={12} className="text-green-500 shrink-0" />
                        ) : (
                          <XCircle size={12} className="text-red-400 shrink-0" />
                        )}
                        <span className="truncate flex-1 text-gray-700">{s.title}</span>
                        {s.trustScore > 0 && <TrustScore score={s.trustScore} size="sm" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!result && !isCollecting && (
                <p className="text-xs text-gray-400 mt-2">&quot;자동 수집&quot; 버튼으로 공식 사이트에서 검증된 정보를 수집합니다</p>
              )}

              {isCollecting && (
                <div className="mt-3 flex items-center gap-2 text-xs text-blue-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  공식 사이트 교차검증 중...
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Info */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Database size={18} className="text-blue-600 mt-0.5 shrink-0" />
          <div className="text-xs text-blue-800 space-y-1">
            <p className="font-semibold">교차검증 지식베이스 안내</p>
            <ul className="space-y-0.5 text-blue-700">
              <li>- 각 카테고리의 &quot;자동 수집&quot;을 클릭하면 공식 사이트 5곳+에서 교차검증합니다</li>
              <li>- 신뢰도 80점 이상인 정보만 지식베이스에 저장됩니다</li>
              <li>- AI 질문 시 저장된 지식베이스가 자동으로 활용됩니다</li>
              <li>- ANTHROPIC_API_KEY가 .env.local에 설정되어야 작동합니다</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
