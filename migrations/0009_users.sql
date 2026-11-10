-- Migration 0009: users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO users (id, username, password_hash, salt, name, role) VALUES
  ('usr_jordan', 'jordan.lee', '2d058547072ff2557887cbe75c1633a2cc7fe0c9afc2a243817ea7a4d55f91fe', 'seed_salt', 'Jordan Lee', 'admin'),
  ('usr_100234', '100234', '2d058547072ff2557887cbe75c1633a2cc7fe0c9afc2a243817ea7a4d55f91fe', 'seed_salt', 'Jordan Lee', 'admin');
