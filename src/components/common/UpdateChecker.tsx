'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

const CURRENT_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

export default function UpdateChecker() {
  const [update, setUpdate] = useState<{ version: string; downloadUrl: string; releaseNotes: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/version');
        const data = await res.json();
        if (data.version && data.version !== CURRENT_VERSION && compareVersions(data.version, CURRENT_VERSION) > 0) {
          setUpdate(data);
        }
      } catch { /* ignore */ }
    };
    check();
    const interval = setInterval(check, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!update || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white rounded-xl shadow-lg p-4 max-w-sm animate-slide-up">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Download size={18} />
          <div>
            <p className="text-sm font-semibold">새 버전 v{update.version} 사용 가능</p>
            <p className="text-xs text-blue-200 mt-0.5">현재: v{CURRENT_VERSION}</p>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} className="text-blue-200 hover:text-white">
          <X size={16} />
        </button>
      </div>
      {update.downloadUrl && (
        <a
          href={update.downloadUrl}
          className="mt-3 block text-center bg-white text-blue-600 rounded-lg py-2 text-sm font-medium hover:bg-blue-50 transition-colors"
        >
          APK 다운로드
        </a>
      )}
    </div>
  );
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
}
