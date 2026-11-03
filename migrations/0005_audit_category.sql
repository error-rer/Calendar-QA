-- Add audit_category column to assignments
ALTER TABLE assignments ADD COLUMN audit_category TEXT NOT NULL DEFAULT '';
