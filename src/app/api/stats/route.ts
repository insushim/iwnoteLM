import { NextResponse } from 'next/server';
import { getStats } from '@/lib/db';

export async function GET() {
  try {
    const stats = await getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('통계 조회 실패:', error);
    return NextResponse.json({ error: '통계 조회 실패' }, { status: 500 });
  }
}
