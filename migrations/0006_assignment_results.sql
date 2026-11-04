-- Add results column to assignments table for site-level audit results
ALTER TABLE assignments ADD COLUMN results TEXT NOT NULL DEFAULT '{}';
