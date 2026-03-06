import { NextRequest, NextResponse } from 'next/server';
import { crossVerifyAndStore } from '@/lib/cross-verify';
import type { NotebookCategory, CollectResult } from '@/types';

const AUTO_COLLECT_TOPICS: Record<NotebookCategory, string[]> = {
  education_law: [
    '초·중등교육법 주요 조항 정리',
    '교육기본법 핵심 내용',
    '교육공무원법 임용·전보·파견 규정',
  ],
  school_violence: [
    '학교폭력예방법 전체 절차 요약',
    '학교폭력 사안처리 가이드라인',
    '학교폭력 가해학생 조치사항 1~9호 기준',
  ],
  teacher_hr: [
    '교원 연가 병가 공가 특별휴가 규정',
    '교원 성과급 지급 기준',
    '교원 승진 가산점 항목',
  ],
  neis: [
    'NEIS 권한관리 업무분장 방법',
    'NEIS 학적 처리 전학·입학·졸업',
    'NEIS 성적 입력 방법',
  ],
  classroom: [
    '학생 생활지도 교원 권한 범위',
    '학부모 민원 대응 가이드라인',
    '아동학대 신고의무자 의무와 절차',
  ],
  safety: [
    '학교안전사고 발생 시 대응 매뉴얼',
    '현장학습 안전관리 계획 수립 기준',
    '감염병 발생 시 학교 대응 절차',
  ],
  special_education: [
    '특수교육대상자 선정·배치 절차',
    '통합교육 운영 기준과 지원',
    '다문화학생 교육지원 정책',
  ],
  curriculum: [
    '2022 개정 교육과정 총론 핵심',
    '교과별 성취기준 구조',
    '교육과정 자율화 범위',
  ],
  moe_directive: [
    '학교생활기록부 기재요령',
    '초등학교 교육과정 편성·운영 기준',
    '방과후학교 운영 기본계획',
  ],
  finance: [
    '학교회계 예산 편성 절차',
    '수익자부담경비 징수 기준',
    '학교급식 운영비 집행 기준',
  ],
  general: [
    '초등교사 업무 분장 가이드',
    '학기 초 학급경영 체크리스트',
  ],
};

export async function POST(request: NextRequest) {
  try {
    const { category, maxTopics }: { category: NotebookCategory; maxTopics?: number } = await request.json();

    const topics = AUTO_COLLECT_TOPICS[category] || AUTO_COLLECT_TOPICS.general;
    const limit = maxTopics || topics.length;

    const results: CollectResult = {
      category,
      searched: 0,
      verified: 0,
      stored: 0,
      failed: 0,
      sources: [],
      completedAt: '',
    };

    for (let i = 0; i < Math.min(limit, topics.length); i++) {
      const topic = topics[i];
      results.searched++;

      try {
        const verification = await crossVerifyAndStore({
          question: topic,
          category,
          minSources: 3,
          autoStore: true,
        });

        if (verification.isVerified) {
          results.verified++;
          results.stored++;
          results.sources.push({
            url: verification.sources[0]?.url || '',
            title: topic,
            trustScore: verification.trustScore,
            stored: true,
          });
        } else {
          results.failed++;
          results.sources.push({
            url: '',
            title: topic,
            trustScore: verification.trustScore,
            stored: false,
            reason: `신뢰도 부족 (${verification.trustScore}점)`,
          });
        }
      } catch {
        results.failed++;
        results.sources.push({
          url: '',
          title: topic,
          trustScore: 0,
          stored: false,
          reason: '검색 오류',
        });
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    results.completedAt = new Date().toISOString();
    return NextResponse.json({ success: true, result: results });
  } catch (error) {
    console.error('자동 수집 실패:', error);
    return NextResponse.json({ error: '자동 수집 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
