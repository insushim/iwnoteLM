'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, ShieldCheck, ExternalLink, AlertTriangle, Lightbulb, Clock, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Card from '@/components/common/Card';
import TrustScore from '@/components/common/TrustScore';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { CATEGORY_INFO, cn, getCategoryColor } from '@/lib/utils';
import { askQuestion } from '@/lib/client-ask';
import { saveQueryLocal } from '@/lib/local-store';
import { marked } from 'marked';
import type { NotebookCategory, AskResponse, AnswerSource } from '@/types';

const CATEGORIES = Object.entries(CATEGORY_INFO) as [NotebookCategory, typeof CATEGORY_INFO[NotebookCategory]][];

export default function AskPageWrapper() {
  return (
    <Suspense fallback={<LoadingSpinner text="로딩 중..." className="py-20" />}>
      <AskPage />
    </Suspense>
  );
}

const EXAMPLE_QUESTIONS: Record<string, string[]> = {
  education_law: ['교원의 수업권은 법적으로 어디에 근거하나요?', '학교운영위원회의 심의사항은?'],
  school_violence: ['학교폭력 사안 접수 후 48시간 이내 해야 할 것은?', '가해학생 4호 조치 기준은?'],
  teacher_hr: ['초등교사 연가일수 기준은?', '교원 겸직 허가 기준은?'],
  neis: ['NEIS 권한관리에서 업무분장 방법은?', 'NEIS 출결 처리 기준은?'],
  classroom: ['학생 휴대폰 수거의 법적 근거는?', '교권 침해 시 대응 절차는?'],
  safety: ['현장학습 안전관리 계획 수립 기준은?', '학교안전사고 보상 절차는?'],
};

function AskPage() {
  const searchParams = useSearchParams();
  const [category, setCategory] = useState<NotebookCategory>(
    (searchParams.get('category') as NotebookCategory) || 'general'
  );
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const cat = searchParams.get('category') as NotebookCategory;
    if (cat && CATEGORY_INFO[cat]) setCategory(cat);
  }, [searchParams]);

  const handleAsk = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await askQuestion(question, category);
      setResult(data);
      saveQueryLocal(question, category, data.trustScore);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다. API 키를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const setExampleQuestion = (q: string) => {
    setQuestion(q);
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Header title="AI 질문하기" description="공식 사이트 5곳+ 교차검증으로 정확한 답변을 제공합니다" />

      {/* Category selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIES.map(([key, info]) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
              category === key
                ? getCategoryColor(key)
                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
            )}
          >
            {info.emoji} {info.label}
          </button>
        ))}
      </div>

      {/* Question input */}
      <Card className="mb-4">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="업무·법률 관련 질문을 입력하세요... (Shift+Enter로 줄바꿈)"
            className="w-full resize-none border-0 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none text-sm leading-relaxed min-h-[80px]"
            rows={3}
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              카테고리: {CATEGORY_INFO[category]?.emoji} {CATEGORY_INFO[category]?.label}
            </span>
            <button
              onClick={handleAsk}
              disabled={!question.trim() || loading}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                question.trim() && !loading
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {loading ? '검증 중...' : '질문하기'}
            </button>
          </div>
        </div>
      </Card>

      {/* Example questions */}
      {!result && !loading && (
        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <Lightbulb size={12} /> 예시 질문
          </p>
          <div className="flex flex-wrap gap-2">
            {(EXAMPLE_QUESTIONS[category] || EXAMPLE_QUESTIONS.education_law || []).map((q, i) => (
              <button
                key={i}
                onClick={() => setExampleQuestion(q)}
                className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <Card className="py-12">
          <LoadingSpinner text="공식 사이트 5곳 이상에서 정보를 교차검증하고 있습니다..." />
          <div className="mt-6 space-y-2 max-w-xs mx-auto">
            {['국가법령정보센터 검색 중...', '교육부 사이트 확인 중...', '시도교육청 자료 대조 중...', '교차검증 분석 중...'].map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: `${i * 0.5}s` }} />
                {step}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle size={16} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        </Card>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Trust score + meta */}
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <TrustScore score={result.trustScore} size="lg" />
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Clock size={12} /> {(result.processingTime / 1000).toFixed(1)}초</span>
                <span>{result.sources.length}개 소스 확인</span>
                {result.newSourcesAdded > 0 && (
                  <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full">+{result.newSourcesAdded} 소스 저장됨</span>
                )}
              </div>
            </div>

            {/* Legal basis */}
            {result.legalBasis.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {result.legalBasis.map((law, i) => (
                  <span key={i} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-md border border-indigo-100">
                    {law}
                  </span>
                ))}
              </div>
            )}

            {/* Answer */}
            <div
              className="markdown-body text-sm text-gray-800"
              dangerouslySetInnerHTML={{ __html: marked.parse(result.answer) as string }}
            />
          </Card>

          {/* Sources */}
          {result.sources.length > 0 && (
            <Card>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <ShieldCheck size={16} className="text-blue-600" />
                교차검증 출처 ({result.sources.length}개)
              </h4>
              <div className="space-y-2">
                {result.sources.map((source: AnswerSource, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 mt-0.5',
                      source.trustLevel === 1 ? 'bg-emerald-100 text-emerald-700' :
                      source.trustLevel === 2 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    )}>
                      {source.trustLevel === 1 ? '법령' : source.trustLevel === 2 ? '정부' : '공공'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{source.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{source.excerpt}</p>
                    </div>
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 shrink-0"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <Card className="bg-amber-50 border-amber-200">
              <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <AlertTriangle size={14} /> 주의사항
              </h4>
              <ul className="space-y-1">
                {result.warnings.map((w, i) => (
                  <li key={i} className="text-xs text-amber-700">{w}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Related questions */}
          {result.relatedQuestions.length > 0 && (
            <Card>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Lightbulb size={14} className="text-amber-500" /> 관련 질문
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.relatedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuestion(q); setResult(null); window.scrollTo(0, 0); }}
                    className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Disclaimer */}
          <p className="text-[10px] text-gray-400 text-center">{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
