import type { OfficialSource, NotebookCategory } from '@/types';

export const OFFICIAL_SOURCES: OfficialSource[] = [
  // === 법령 (trustLevel: 1) ===
  {
    id: 'law_go_kr',
    name: '국가법령정보센터',
    url: 'https://law.go.kr',
    domain: 'law.go.kr',
    category: 'law',
    trustLevel: 1,
    description: '법제처 운영, 모든 법률·시행령·시행규칙 원문',
  },
  {
    id: 'lawnb',
    name: '로앤비',
    url: 'https://www.lawnb.com',
    domain: 'lawnb.com',
    category: 'law',
    trustLevel: 1,
    description: '법령·판례·행정규칙 통합 검색',
  },
  {
    id: 'scourt',
    name: '대법원 종합법률정보',
    url: 'https://glaw.scourt.go.kr',
    domain: 'glaw.scourt.go.kr',
    category: 'law',
    trustLevel: 1,
    description: '판례·법령·예규 검색',
  },
  // === 정부 기관 (trustLevel: 2) ===
  {
    id: 'moe',
    name: '교육부',
    url: 'https://www.moe.go.kr',
    domain: 'moe.go.kr',
    category: 'policy',
    trustLevel: 2,
    description: '교육 정책, 고시, 훈령, 예규, 보도자료',
  },
  {
    id: 'ncic',
    name: '국가교육과정정보센터',
    url: 'https://ncic.re.kr',
    domain: 'ncic.re.kr',
    category: 'policy',
    trustLevel: 2,
    description: '교육과정 원문, 해설서, 성취기준',
  },
  {
    id: 'schoolsafe',
    name: '학교안전정보센터',
    url: 'https://www.schoolsafe.kr',
    domain: 'schoolsafe.kr',
    category: 'safety',
    trustLevel: 2,
    description: '학교안전사고 예방, 매뉴얼, 보상',
  },
  {
    id: 'nise',
    name: '국립특수교육원',
    url: 'https://www.nise.go.kr',
    domain: 'nise.go.kr',
    category: 'institute',
    trustLevel: 2,
    description: '특수교육, 장애학생 지원, 통합교육',
  },
  {
    id: 'mpm',
    name: '인사혁신처',
    url: 'https://www.mpm.go.kr',
    domain: 'mpm.go.kr',
    category: 'policy',
    trustLevel: 2,
    description: '공무원 복무, 인사, 성과평가, 연금',
  },
  // === 공공 기관 (trustLevel: 3) ===
  {
    id: 'keris',
    name: '한국교육학술정보원',
    url: 'https://www.keris.or.kr',
    domain: 'keris.or.kr',
    category: 'institute',
    trustLevel: 3,
    description: 'NEIS, 교육정보화, 디지털교과서',
  },
  {
    id: 'kedi',
    name: '한국교육개발원',
    url: 'https://www.kedi.re.kr',
    domain: 'kedi.re.kr',
    category: 'institute',
    trustLevel: 3,
    description: '교육 연구, 통계, 정책 분석',
  },
  {
    id: 'kice',
    name: '한국교육과정평가원',
    url: 'https://www.kice.re.kr',
    domain: 'kice.re.kr',
    category: 'institute',
    trustLevel: 3,
    description: '교육과정, 교과서, 학업성취도 평가',
  },
  // === 시도교육청 (trustLevel: 2) ===
  {
    id: 'sen',
    name: '서울특별시교육청',
    url: 'https://www.sen.go.kr',
    domain: 'sen.go.kr',
    category: 'education_office',
    trustLevel: 2,
    description: '서울 교육정책, 지침, 장학자료',
  },
  {
    id: 'goe',
    name: '경기도교육청',
    url: 'https://www.goe.go.kr',
    domain: 'goe.go.kr',
    category: 'education_office',
    trustLevel: 2,
    description: '경기 교육정책, 지침, 장학자료',
  },
  {
    id: 'pen',
    name: '부산광역시교육청',
    url: 'https://www.pen.go.kr',
    domain: 'pen.go.kr',
    category: 'education_office',
    trustLevel: 2,
    description: '부산 교육정책, 지침, 장학자료',
  },
  // === NEIS (trustLevel: 2) ===
  {
    id: 'neis',
    name: 'NEIS 교육정보시스템',
    url: 'https://neis.go.kr',
    domain: 'neis.go.kr',
    category: 'neis',
    trustLevel: 2,
    description: 'NEIS 매뉴얼, 권한관리, 학적·성적·출결',
  },
];

export function getSourcesForCategory(category: NotebookCategory): OfficialSource[] {
  const baseSources = OFFICIAL_SOURCES.filter(s => s.category === 'law');
  const categorySources = OFFICIAL_SOURCES.filter(s => {
    switch (category) {
      case 'education_law':
      case 'moe_directive':
        return ['law', 'policy', 'institute'].includes(s.category);
      case 'school_violence':
        return ['law', 'policy', 'safety'].includes(s.category);
      case 'teacher_hr':
        return ['law', 'policy', 'education_office'].includes(s.category);
      case 'neis':
        return ['neis', 'policy', 'institute'].includes(s.category);
      case 'classroom':
        return ['policy', 'education_office', 'safety'].includes(s.category);
      case 'safety':
        return ['law', 'safety', 'policy'].includes(s.category);
      case 'special_education':
        return ['law', 'policy', 'institute'].includes(s.category);
      case 'curriculum':
        return ['policy', 'institute'].includes(s.category);
      case 'finance':
        return ['law', 'policy', 'education_office'].includes(s.category);
      default:
        return true;
    }
  });
  const merged = [...baseSources, ...categorySources];
  return [...new Map(merged.map(s => [s.id, s])).values()];
}
