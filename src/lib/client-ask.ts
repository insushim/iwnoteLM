/**
 * 클라이언트에서 직접 Gemini API를 호출하는 질문 처리 모듈
 * static export를 위해 API route 대신 사용
 */

import { callGemini } from './gemini-api';
import { getSourcesForCategory, OFFICIAL_SOURCES } from './official-sources';
import type {
  NotebookCategory,
  AskResponse,
  SearchResult,
  OfficialSource,
} from '@/types';

export async function askQuestion(
  question: string,
  category: NotebookCategory
): Promise<AskResponse> {
  const startTime = Date.now();

  try {
    const targetSources = getSourcesForCategory(category);

    // Step 1: 검색 + 교차검증을 한 번의 API 호출로 통합 (RPM 절약)
    const verifyResult = await searchAndVerify(question, category, targetSources);

    // Step 2: 답변 정리 + 관련 질문 생성 (1회 호출로 통합)
    let answer = verifyResult.verifiedContent || verifyResult.summary;
    let relatedQuestions: string[] = [];

    if (answer) {
      try {
        const polished = await callGemini(
          `당신은 한국 초등학교 교사에게 업무·법률 자문을 제공하는 전문 AI 비서입니다.

아래 2가지를 한 번에 해주세요:

1. 교차검증된 정보를 교사가 바로 이해하고 활용할 수 있도록 마크다운으로 깔끔하게 정리
2. 교사가 추가로 궁금해할 관련 질문 3개 생성

반드시 다음 JSON 형식으로만 응답하세요 (마크다운 코드블록 없이):
{
  "answer": "정리된 답변 (마크다운)",
  "relatedQuestions": ["질문1", "질문2", "질문3"]
}`,
          [{
            role: 'user',
            content: `질문: ${question}\n\n교차검증된 정보:\n${answer}\n\n법적 근거: ${verifyResult.legalBasis.join(', ')}`
          }],
          4096
        );
        const cleaned = polished.replace(/```json\n?|```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        answer = parsed.answer || answer;
        relatedQuestions = parsed.relatedQuestions || [];
      } catch {
        // 파싱 실패 시 원본 사용
      }
    }

    return {
      answer: answer || '죄송합니다. 해당 질문에 대한 정확한 정보를 찾지 못했습니다. 질문을 더 구체적으로 해주시거나, 다른 카테고리를 선택해주세요.',
      mode: 'verify_then_answer',
      sources: verifyResult.sources.map(s => ({
        title: s.title,
        url: s.url,
        domain: s.source.domain,
        trustLevel: s.source.trustLevel,
        excerpt: s.snippet,
      })),
      trustScore: verifyResult.trustScore,
      legalBasis: verifyResult.legalBasis,
      warnings: [
        ...verifyResult.warnings,
        '※ AI가 제공하는 법률 정보는 참고용이며, 중요한 결정은 반드시 관할 교육(지원)청이나 법률 전문가에게 확인하세요.',
      ],
      disclaimer: '본 답변은 AI(Gemini)가 공식 사이트를 교차검증하여 생성한 것으로, 법적 효력이 없습니다.',
      relatedQuestions,
      newSourcesAdded: 0,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('질문 처리 실패:', error);
    throw error;
  }
}

async function searchAndVerify(
  question: string,
  category: NotebookCategory,
  targetSources: OfficialSource[]
): Promise<{
  sources: SearchResult[];
  trustScore: number;
  verifiedContent: string;
  summary: string;
  legalBasis: string[];
  warnings: string[];
}> {
  // 검색 + 교차검증을 1회 API 호출로 통합 (RPM 절약)
  const prompt = `당신은 한국 초등교육 법률·행정 교차검증 전문가입니다.

다음 질문에 대해:
1. 아래 공식 사이트들의 정보를 기반으로 관련 법령·규정을 찾아주세요
2. 찾은 정보를 교차검증하여 신뢰도를 평가하세요
3. 검증된 정보만 포함하세요

질문: "${question}"
카테고리: ${category}

참고할 공식 사이트:
${targetSources.slice(0, 8).map((s, i) => `${i + 1}. ${s.name} (${s.url}) [ID: ${s.id}] [신뢰등급: ${s.trustLevel}]`).join('\n')}

반드시 다음 JSON 형식으로만 응답하세요 (마크다운 코드블록 없이):
{
  "sources": [
    {
      "sourceId": "사이트 ID",
      "sourceName": "사이트 이름",
      "sourceUrl": "관련 페이지 URL",
      "title": "문서 제목",
      "content": "관련 내용 (상세하게)",
      "snippet": "핵심 요약 2-3문장"
    }
  ],
  "trustScore": 0에서100사이신뢰도점수,
  "verifiedContent": "교차검증된 정보 전문 (상세하게)",
  "summary": "핵심 요약",
  "legalBasis": ["관련 법령 제X조"],
  "warnings": ["주의사항"]
}

중요 규칙:
- 반드시 실제 존재하는 법령·고시·지침만 인용
- 법령번호, 조항번호 정확 기재
- 추측 금지. 확실한 정보만 포함`;

  const response = await callGemini(prompt, [
    { role: 'user', content: `"${question}"에 대해 교차검증해주세요.` }
  ], 8192);

  try {
    const cleaned = response.replace(/```json\n?|```\n?/g, '').trim();
    const result = JSON.parse(cleaned);

    const sources: SearchResult[] = (result.sources || []).map((s: {
      sourceId: string;
      sourceName: string;
      sourceUrl: string;
      title: string;
      content: string;
      snippet: string;
    }) => {
      const officialSource = targetSources.find(t => t.id === s.sourceId) || targetSources[0];
      return {
        source: officialSource,
        url: s.sourceUrl,
        title: s.title,
        snippet: s.snippet,
        content: s.content,
        fetchedAt: new Date().toISOString(),
        isAccessible: true,
      };
    });

    return {
      sources,
      trustScore: Math.min(100, result.trustScore || 0),
      verifiedContent: result.verifiedContent || '',
      summary: result.summary || '',
      legalBasis: result.legalBasis || [],
      warnings: result.warnings || [],
    };
  } catch (error) {
    console.error('파싱 실패:', error);
    return {
      sources: [],
      trustScore: 0,
      verifiedContent: '',
      summary: '응답 처리 중 오류가 발생했습니다.',
      legalBasis: [],
      warnings: ['응답 파싱에 실패했습니다.'],
    };
  }
}
