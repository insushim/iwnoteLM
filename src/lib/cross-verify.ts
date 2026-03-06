import { getSourcesForCategory } from './official-sources';
import { callGemini } from './gemini-api';
import type {
  CrossVerifyRequest,
  VerificationResult,
  SearchResult,
  OfficialSource,
  NotebookCategory,
} from '@/types';

export async function crossVerifyAndStore(
  request: CrossVerifyRequest
): Promise<VerificationResult> {
  const { question, category, minSources = 5 } = request;

  const targetSources = getSourcesForCategory(category);
  const searchResults = await searchOfficialSources(question, category, targetSources);
  const verification = await analyzeAndVerify(question, searchResults, minSources);

  return {
    query: question,
    sources: searchResults,
    totalSourcesChecked: searchResults.length,
    agreementCount: verification.agreementCount,
    trustScore: verification.trustScore,
    isVerified: verification.isVerified,
    verifiedContent: verification.verifiedContent,
    summary: verification.summary,
    legalBasis: verification.legalBasis,
    warnings: verification.warnings,
    storedToNotebook: false,
    verifiedAt: new Date().toISOString(),
  };
}

async function searchOfficialSources(
  question: string,
  category: NotebookCategory,
  targetSources: OfficialSource[]
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  const searchPrompt = `당신은 한국 초등교육 법률·행정 리서치 전문가입니다.

다음 질문에 대해 아래 공식 사이트들에서 관련 정보를 찾아주세요.
각 사이트별로 찾은 정보를 구조화하여 JSON으로 반환하세요.

질문: "${question}"
카테고리: ${category}

검색 대상 공식 사이트:
${targetSources.map((s, i) => `${i + 1}. ${s.name} (${s.url}) [신뢰등급: ${s.trustLevel}] [ID: ${s.id}]`).join('\n')}

반드시 다음 JSON 형식으로만 응답하세요 (마크다운 코드블록 없이):
{
  "results": [
    {
      "sourceId": "사이트 ID",
      "sourceName": "사이트 이름",
      "sourceUrl": "실제 페이지 URL",
      "title": "찾은 문서/페이지 제목",
      "content": "관련 내용 전문 (최대한 상세하게)",
      "snippet": "핵심 요약 (2-3문장)",
      "isRelevant": true,
      "relevanceReason": "관련성 설명"
    }
  ],
  "searchSummary": "전체 검색 요약"
}

중요 규칙:
- 반드시 실제로 존재하는 법령·고시·지침만 인용하세요
- 법령번호, 조항번호를 정확하게 기재하세요
- 찾을 수 없는 정보는 isRelevant: false로 표시하세요
- 추측이나 추론은 절대 하지 마세요`;

  const response = await callGemini(searchPrompt, [
    { role: 'user', content: `위 공식 사이트들에서 "${question}"에 대한 정확한 정보를 검색해주세요.` }
  ], 8192);

  try {
    const cleaned = response.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    for (const result of parsed.results) {
      if (result.isRelevant) {
        const source = targetSources.find(s => s.id === result.sourceId) || targetSources[0];
        results.push({
          source,
          url: result.sourceUrl,
          title: result.title,
          snippet: result.snippet,
          content: result.content,
          fetchedAt: new Date().toISOString(),
          isAccessible: true,
        });
      }
    }
  } catch (error) {
    console.error('검색 결과 파싱 실패:', error);
  }

  return results;
}

async function analyzeAndVerify(
  question: string,
  searchResults: SearchResult[],
  minSources: number
): Promise<{
  agreementCount: number;
  trustScore: number;
  isVerified: boolean;
  verifiedContent: string;
  summary: string;
  legalBasis: string[];
  warnings: string[];
}> {
  if (searchResults.length < 2) {
    return {
      agreementCount: searchResults.length,
      trustScore: 0,
      isVerified: false,
      verifiedContent: '',
      summary: '충분한 소스를 찾지 못했습니다.',
      legalBasis: [],
      warnings: ['교차검증에 필요한 최소 소스 수(2개)를 충족하지 못했습니다.'],
    };
  }

  const verifyPrompt = `당신은 한국 교육법·행정 교차검증 전문가입니다.

다음 질문에 대해 여러 공식 사이트에서 수집된 정보를 교차검증하세요.

질문: "${question}"

수집된 정보:
${searchResults.map((r, i) => `
[소스 ${i + 1}] ${r.source.name} (신뢰등급: ${r.source.trustLevel})
URL: ${r.url}
제목: ${r.title}
내용: ${r.content}
`).join('\n---\n')}

반드시 다음 JSON 형식으로만 응답하세요:
{
  "agreementCount": 동일사실확인소스수,
  "trustScore": 신뢰도점수0to100,
  "isVerified": true,
  "verifiedContent": "검증된 정보 전문",
  "summary": "핵심 요약",
  "legalBasis": ["관련 법령1 제X조"],
  "warnings": ["주의사항"],
  "contradictions": [],
  "confidence": "high"
}`;

  const response = await callGemini(verifyPrompt, [
    { role: 'user', content: '위 정보를 교차검증하고 신뢰도를 평가해주세요.' }
  ], 8192);

  try {
    const cleaned = response.replace(/```json\n?|```\n?/g, '').trim();
    const result = JSON.parse(cleaned);

    let weightedScore = result.trustScore;
    const lawSourceCount = searchResults.filter(s => s.source.trustLevel === 1).length;
    if (lawSourceCount > 0) {
      weightedScore = Math.min(100, weightedScore + (lawSourceCount * 5));
    }

    return {
      agreementCount: result.agreementCount,
      trustScore: weightedScore,
      isVerified: weightedScore >= 80 && result.agreementCount >= Math.min(minSources, searchResults.length),
      verifiedContent: result.verifiedContent,
      summary: result.summary,
      legalBasis: result.legalBasis || [],
      warnings: [
        ...(result.warnings || []),
        ...(result.contradictions || []),
        '※ AI가 제공하는 법률 정보는 참고용이며, 중요한 결정은 반드시 관할 교육(지원)청이나 법률 전문가에게 확인하세요.',
      ],
    };
  } catch (error) {
    console.error('교차검증 분석 실패:', error);
    return {
      agreementCount: 0,
      trustScore: 0,
      isVerified: false,
      verifiedContent: '',
      summary: '교차검증 분석 중 오류가 발생했습니다.',
      legalBasis: [],
      warnings: ['교차검증 분석에 실패했습니다. 다시 시도해주세요.'],
    };
  }
}
