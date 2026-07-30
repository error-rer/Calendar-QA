-- Migration 0003: Store options and configuration lists in database

CREATE TABLE IF NOT EXISTS options (
  category TEXT NOT NULL,
  value TEXT NOT NULL,
  meta TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (category, value)
);

-- Seed Purpose Options
INSERT OR IGNORE INTO options (category, value) VALUES
  ('purpose', 'site qualification'),
  ('purpose', 'system audit'),
  ('purpose', 'product qualification'),
  ('purpose', 'pre-audit'),
  ('purpose', 'annual audit'),
  ('purpose', 'process control'),
  ('purpose', 'gemba walk'),
  ('purpose', 'QMS audit');

-- Seed Customer Department Options
INSERT OR IGNORE INTO options (category, value) VALUES
  ('customer_department', 'ESD Audit'),
  ('customer_department', 'QS Audit'),
  ('customer_department', 'IATF16949/ISO9001'),
  ('customer_department', 'ISO14001/ISO45001'),
  ('customer_department', 'RBA');

-- Seed Internal Department Options
INSERT OR IGNORE INTO options (category, value) VALUES
  ('internal_department', 'QMS'),
  ('internal_department', 'EHS'),
  ('internal_department', 'ESD');

-- Seed Site Code Options & Badge Colors (stored in meta)
INSERT OR IGNORE INTO options (category, value, meta) VALUES
  ('site_code', 'U1', '#c0392b'),
  ('site_code', 'U2', '#2e7d32'),
  ('site_code', 'U2A', '#66bb6a'),
  ('site_code', 'U2B', '#1b5e20'),
  ('site_code', 'U3', '#1e5fa8'),
  ('site_code', 'U3A', '#4a90d9'),
  ('site_code', 'U3T', '#123f73');
