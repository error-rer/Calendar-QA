-- Migration 0021: shared History (audit log).
-- One row per change made in the app. The Worker sets created_at and the user
-- from the signed-in session; the browser supplies the action, entity and description.
CREATE TABLE IF NOT EXISTS history_log (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT '',
  user_name TEXT NOT NULL DEFAULT '',
  action_type TEXT NOT NULL DEFAULT '',
  entity_type TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  metadata TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_history_log_created_at ON history_log (created_at DESC, id DESC);
