import { NextRequest, NextResponse } from 'next/server';
import { crossVerifyAndStore } from '@/lib/cross-verify';
import { callGemini } from '@/lib/gemini-api';
import { saveQuery, saveVerification } from '@/lib/db';
import type { AskRequest, AskResponse, NotebookCategory } from '@/types';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: AskRequest = await request.json();
    const { question, category = 'general', mode = 'auto' } = body;

    if (!question?.trim()) {
      return NextResponse.json({ error: '질문을 입력해주세요.' }, { status: 400 });
    }

    const actualMode = 'verify_then_answer';

    const verification = await crossVerifyAndStore({
      question,
      category: category as NotebookCategory,
      minSources: 5,
      autoStore: true,
    });

    await saveVerification({
      query: question,
      category: category as NotebookCategory,
      sourcesChecked: verification.totalSourcesChecked,
      agreementCount: verification.agreementCount,
      trustScore: verification.trustScore,
      isVerified: verification.isVerified,
      storedToNotebook: verification.storedToNotebook,
    });

    let answer = verification.verifiedContent || verification.summary;

    if (answer) {
      try {
        const polished = await callGemini(
          `당신은 한국 초등학교 교사에게 업무·법률 자문을 제공하는 전문 AI 비서입니다.
아래 교차검증된 정보를 바탕으로, 교사가 바로 이해하고 활용할 수 있도록 답변을 정리해주세요.
법률 용어에는 간단한 설명을 괄호 안에 추가해주세요.
마크다운 형식으로 깔끔하게 정리해주세요.`,
          [{
            role: 'user',
            content: `질문: ${question}\n\n교차검증된 정보:\n${answer}\n\n법적 근거: ${verification.legalBasis.join(', ')}\n\n위 내용을 초등교사가 바로 활용할 수 있도록 정리해주세요.`
          }],
          4096
        );
        answer = polished;
      } catch {
        // Use original answer if polishing fails
      }
    }

    const sources = verification.sources.map(s => ({
      title: s.title,
      url: s.url,
      domain: s.source.domain,
      trustLevel: s.source.trustLevel,
      excerpt: s.snippet,
    }));

    let relatedQuestions: string[] = [];
    try {
      const rq = await callGemini(
        '초등교사가 추가로 궁금해할 만한 관련 질문 3개를 생성하세요. JSON 배열로만 응답하세요. 마크다운 코드블록 없이.',
        [{ role: 'user', content: `원래 질문: "${question}" (카테고리: ${category})` }],
        512
      );
      const cleaned = rq.replace(/```json\n?|```\n?/g, '').trim();
      relatedQuestions = JSON.parse(cleaned);
    } catch {
      relatedQuestions = [];
    }

    await saveQuery({
      question,
      category: category as NotebookCategory,
      answer,
      trustScore: verification.trustScore,
      legalBasis: verification.legalBasis,
      sources: JSON.stringify(sources),
      mode: actualMode,
    });

    const response: AskResponse = {
      answer: answer || '죄송합니다. 해당 질문에 대한 정확한 정보를 찾지 못했습니다.',
      mode: actualMode,
      sources,
      trustScore: verification.trustScore,
      legalBasis: verification.legalBasis,
      warnings: [
        ...verification.warnings,
        '※ AI가 제공하는 법률 정보는 참고용이며, 중요한 결정은 반드시 관할 교육(지원)청이나 법률 전문가에게 확인하세요.',
      ],
      disclaimer: '본 답변은 AI(Gemini)가 공식 사이트를 교차검증하여 생성한 것으로, 법적 효력이 없습니다.',
      relatedQuestions,
      newSourcesAdded: verification.storedToNotebook ? 1 : 0,
      processingTime: Date.now() - startTime,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('질문 처리 실패:', error);
    return NextResponse.json(
      { error: '질문 처리 중 오류가 발생했습니다. GEMINI_API_KEY를 확인해주세요.' },
      { status: 500 }
    );
  }
}
