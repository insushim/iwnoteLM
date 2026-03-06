import { NextResponse } from 'next/server';

const GITHUB_REPO = 'insushim/iwnoteLM';

export async function GET() {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      {
        headers: { Accept: 'application/vnd.github.v3+json' },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      return NextResponse.json({
        version: '1.0.0',
        downloadUrl: '',
        releaseNotes: '초기 릴리스',
        publishedAt: new Date().toISOString(),
      });
    }

    const data = await res.json();
    const apkAsset = data.assets?.find((a: { name: string }) => a.name.endsWith('.apk'));

    return NextResponse.json({
      version: data.tag_name?.replace('v', '') || '1.0.0',
      downloadUrl: apkAsset?.browser_download_url || '',
      releaseNotes: data.body || '',
      publishedAt: data.published_at || new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      version: '1.0.0',
      downloadUrl: '',
      releaseNotes: '',
      publishedAt: new Date().toISOString(),
    });
  }
}
