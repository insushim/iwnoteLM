'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageCircleQuestion, Database, ShieldCheck, TrendingUp, ArrowRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Card from '@/components/common/Card';
import TrustScore from '@/components/common/TrustScore';
import { CATEGORY_INFO, formatDate, getCategoryColor } from '@/lib/utils';
import { getStatsLocal } from '@/lib/local-store';
import type { NotebookCategory } from '@/types';

const CATEGORIES = Object.entries(CATEGORY_INFO) as [NotebookCategory, typeof CATEGORY_INFO[NotebookCategory]][];

export default function DashboardPage() {
  const [stats, setStats] = useState<{
    totalQueries: number;
    avgTrustScore: number;
    recentQueries: { id: string; question: string; category: NotebookCategory; trust_score: number; created_at: string }[];
  } | null>(null);

  useEffect(() => {
    setStats(getStatsLocal());
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <Header title="EduBrain 대시보드" description="초등교사를 위한 교차검증 AI 자문 시스템" />

      {/* Quick Action */}
      <Link href="/ask">
        <Card className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0" hover>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">AI에게 질문하기</h3>
              <p className="text-blue-100 text-sm mt-1">공식 사이트 5곳 이상 교차검증으로 정확한 답변을 받으세요</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <MessageCircleQuestion size={24} />
            </div>
          </div>
        </Card>
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><MessageCircleQuestion size={18} className="text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalQueries || 0}</p>
              <p className="text-xs text-gray-500">총 질문</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg"><ShieldCheck size={18} className="text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalQueries || 0}</p>
              <p className="text-xs text-gray-500">교차검증</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg"><Database size={18} className="text-purple-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">10</p>
              <p className="text-xs text-gray-500">카테고리</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg"><TrendingUp size={18} className="text-amber-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.avgTrustScore || '-'}</p>
              <p className="text-xs text-gray-500">평균 신뢰도</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Categories */}
      <h3 className="text-lg font-bold text-gray-900 mb-3">카테고리별 지식베이스</h3>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {CATEGORIES.map(([key, info]) => (
          <Link key={key} href={`/ask?category=${key}`}>
            <Card hover className="text-center">
              <span className="text-2xl">{info.emoji}</span>
              <p className="text-sm font-medium text-gray-700 mt-2">{info.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Queries */}
      <h3 className="text-lg font-bold text-gray-900 mb-3">최근 질문</h3>
      {stats?.recentQueries && stats.recentQueries.length > 0 ? (
        <div className="space-y-2">
          {stats.recentQueries.map(q => (
            <Card key={q.id}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{q.question}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getCategoryColor(q.category)}`}>
                      {CATEGORY_INFO[q.category]?.label || q.category}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(q.created_at)}</span>
                  </div>
                </div>
                <TrustScore score={q.trust_score} size="sm" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-10">
          <MessageCircleQuestion size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">아직 질문이 없습니다</p>
          <Link href="/ask" className="text-blue-600 text-sm mt-2 inline-flex items-center gap-1 hover:underline">
            첫 질문하기 <ArrowRight size={14} />
          </Link>
        </Card>
      )}
    </div>
  );
}
