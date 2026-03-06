# EduBrain - 초등교사 업무·법률 AI 자문 시스템

## 프로젝트 개요
- Next.js 16 + TypeScript + Tailwind CSS 4
- **Gemini 2.0 Flash** API (무료 1500 RPD)
- Cloudflare Pages 배포 (D1 데이터베이스)
- Android WebView APK (GitHub Releases)
- PWA 지원 (iOS 홈 화면 추가)

## 핵심 아키텍처
```
교사 질문 → Gemini API 교차검증 (공식 사이트 5곳+) → 신뢰도 점수 → 답변 + 출처
```

## 주요 파일
- `src/lib/cross-verify.ts` — 교차검증 엔진 (핵심)
- `src/lib/official-sources.ts` — 공식 사이트 15곳 목록
- `src/lib/gemini-api.ts` — Gemini 2.0 Flash API 호출
- `src/lib/db.ts` — 데이터 저장 (인메모리 / D1)
- `src/app/api/ask/route.ts` — 질문 처리 API
- `src/app/api/verify-and-store/route.ts` — 교차검증 API
- `src/app/ask/page.tsx` — AI 질문 페이지 (핵심 UI)

## 배포
- **웹**: `npm run build` → Cloudflare Pages
- **APK**: `wsl bash scripts/build-apk.sh` 또는 GitHub Actions
- **릴리스**: `bash scripts/release.sh patch` → `git push --tags`

## 환경 변수
- `GEMINI_API_KEY` — Gemini API 키 (필수)
- `NEXT_PUBLIC_APP_VERSION` — 앱 버전
- `NEXT_PUBLIC_GITHUB_REPO` — GitHub 저장소 (업데이트 체크)

## 코드 컨벤션
- 한국어 UI, 영어 코드
- Server Components 기본, 'use client' 필요시만
- Tailwind 유틸리티 클래스 사용
