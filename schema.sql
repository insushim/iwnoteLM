-- D1 Database Schema for EduBrain

CREATE TABLE IF NOT EXISTS query_history (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  category TEXT NOT NULL,
  answer TEXT NOT NULL,
  trust_score INTEGER DEFAULT 0,
  legal_basis TEXT DEFAULT '[]',
  sources TEXT DEFAULT '[]',
  mode TEXT DEFAULT 'auto',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS verification_log (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  category TEXT NOT NULL,
  sources_checked INTEGER DEFAULT 0,
  agreement_count INTEGER DEFAULT 0,
  trust_score INTEGER DEFAULT 0,
  is_verified INTEGER DEFAULT 0,
  stored_to_notebook INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_query_category ON query_history(category);
CREATE INDEX IF NOT EXISTS idx_query_created ON query_history(created_at);
CREATE INDEX IF NOT EXISTS idx_verify_category ON verification_log(category);
CREATE INDEX IF NOT EXISTS idx_verify_created ON verification_log(created_at);
