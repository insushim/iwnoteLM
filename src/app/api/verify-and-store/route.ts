import { NextRequest, NextResponse } from 'next/server';
import { crossVerifyAndStore } from '@/lib/cross-verify';
import { saveVerification } from '@/lib/db';
import type { CrossVerifyRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: CrossVerifyRequest = await request.json();

    if (!body.question?.trim()) {
      return NextResponse.json({ error: '질문을 입력해주세요.' }, { status: 400 });
    }
    if (!body.category) {
      return NextResponse.json({ error: '카테고리를 선택해주세요.' }, { status: 400 });
    }

    const result = await crossVerifyAndStore({
      question: body.question,
      category: body.category,
      minSources: body.minSources || 5,
      autoStore: body.autoStore !== false,
    });

    await saveVerification({
      query: body.question,
      category: body.category,
      sourcesChecked: result.totalSourcesChecked,
      agreementCount: result.agreementCount,
      trustScore: result.trustScore,
      isVerified: result.isVerified,
      storedToNotebook: result.storedToNotebook,
    });

    return NextResponse.json({
      success: true,
      verification: result,
      disclaimer: '※ AI가 제공하는 정보는 참고용입니다.',
    });
  } catch (error) {
    console.error('교차검증 실패:', error);
    return NextResponse.json(
      { error: '교차검증 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
