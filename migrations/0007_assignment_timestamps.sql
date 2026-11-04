-- Migration 0007: Add created_at and updated_at timestamps to assignments
ALTER TABLE assignments ADD COLUMN created_at TEXT NOT NULL DEFAULT '';
ALTER TABLE assignments ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';
