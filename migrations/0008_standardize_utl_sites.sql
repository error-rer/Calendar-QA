-- Migration 0008: Standardize site codes with UTL prefix
UPDATE options SET value = 'UTL1' WHERE category = 'site_code' AND value = 'U1';
UPDATE options SET value = 'UTL2' WHERE category = 'site_code' AND value = 'U2';
UPDATE options SET value = 'UTL2A' WHERE category = 'site_code' AND value = 'U2A';
UPDATE options SET value = 'UTL2B' WHERE category = 'site_code' AND value = 'U2B';
UPDATE options SET value = 'UTL3' WHERE category = 'site_code' AND value = 'U3';
UPDATE options SET value = 'UTL3A' WHERE category = 'site_code' AND value = 'U3A';
UPDATE options SET value = 'UTL3T' WHERE category = 'site_code' AND value = 'U3T';

INSERT OR IGNORE INTO options (category, value, meta) VALUES
  ('site_code', 'UTL1', '#c0392b'),
  ('site_code', 'UTL2', '#2e7d32'),
  ('site_code', 'UTL2A', '#66bb6a'),
  ('site_code', 'UTL2B', '#1b5e20'),
  ('site_code', 'UTL3', '#1e5fa8'),
  ('site_code', 'UTL3A', '#4a90d9'),
  ('site_code', 'UTL3T', '#123f73');
