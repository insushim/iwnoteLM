export interface OfficialSource {
  id: string;
  name: string;
  url: string;
  domain: string;
  category: 'law' | 'policy' | 'education_office' | 'institute' | 'neis' | 'safety';
  trustLevel: 1 | 2 | 3;
  description: string;
}

export interface SearchResult {
  source: OfficialSource;
  url: string;
  title: string;
  snippet: string;
  content: string;
  fetchedAt: string;
  isAccessible: boolean;
}

export interface VerificationResult {
  query: string;
  sources: SearchResult[];
  totalSourcesChecked: number;
  agreementCount: number;
  trustScore: number;
  isVerified: boolean;
  verifiedContent: string;
  summary: string;
  legalBasis: string[];
  warnings: string[];
  storedToNotebook: boolean;
  notebookId?: string;
  verifiedAt: string;
}

export interface CrossVerifyRequest {
  question: string;
  category: NotebookCategory;
  minSources?: number;
  autoStore?: boolean;
}

export type NotebookCategory =
  | 'education_law'
  | 'moe_directive'
  | 'school_violence'
  | 'teacher_hr'
  | 'neis'
  | 'classroom'
  | 'safety'
  | 'special_education'
  | 'curriculum'
  | 'finance'
  | 'general';

export interface Notebook {
  id: string;
  name: string;
  category: NotebookCategory;
  description: string;
  sourceCount: number;
  lastUpdated: string;
}

export interface NotebookSource {
  id: string;
  type: 'url' | 'text' | 'pdf' | 'youtube';
  title: string;
  url?: string;
  addedAt: string;
  trustScore: number;
  verificationNote: string;
}

export interface AskRequest {
  question: string;
  category?: NotebookCategory;
  mode: 'notebook_only' | 'verify_then_answer' | 'auto';
}

export interface AskResponse {
  answer: string;
  mode: string;
  sources: AnswerSource[];
  trustScore: number;
  legalBasis: string[];
  warnings: string[];
  disclaimer: string;
  relatedQuestions: string[];
  newSourcesAdded: number;
  processingTime: number;
}

export interface AnswerSource {
  title: string;
  url: string;
  domain: string;
  trustLevel: number;
  excerpt: string;
}

export interface AutoCollectConfig {
  category: NotebookCategory;
  keywords: string[];
  officialSitesOnly: boolean;
  minTrustScore: number;
  maxSourcesPerRun: number;
  schedule: 'daily' | 'weekly' | 'monthly' | 'manual';
}

export interface CollectResult {
  category: NotebookCategory;
  searched: number;
  verified: number;
  stored: number;
  failed: number;
  sources: {
    url: string;
    title: string;
    trustScore: number;
    stored: boolean;
    reason?: string;
  }[];
  completedAt: string;
}

export interface DashboardStats {
  totalNotebooks: number;
  totalSources: number;
  totalQueries: number;
  avgTrustScore: number;
  recentQueries: RecentQuery[];
  categoryBreakdown: {
    category: NotebookCategory;
    sourceCount: number;
    queryCount: number;
  }[];
}

export interface RecentQuery {
  id: string;
  question: string;
  category: NotebookCategory;
  trustScore: number;
  answeredAt: string;
  newSourcesAdded: number;
}

// D1 Database types
export interface D1QueryHistory {
  id: string;
  question: string;
  category: NotebookCategory;
  answer: string;
  trust_score: number;
  legal_basis: string;
  sources: string;
  mode: string;
  created_at: string;
}

export interface D1VerificationLog {
  id: string;
  query: string;
  category: NotebookCategory;
  sources_checked: number;
  agreement_count: number;
  trust_score: number;
  is_verified: boolean;
  stored_to_notebook: boolean;
  created_at: string;
}

export interface AppVersion {
  version: string;
  downloadUrl: string;
  releaseNotes: string;
  publishedAt: string;
}
