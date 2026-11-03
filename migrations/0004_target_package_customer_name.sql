-- Migration 0004: add target_package and customer_names to assignments table
ALTER TABLE assignments ADD COLUMN target_package TEXT NOT NULL DEFAULT '';
ALTER TABLE assignments ADD COLUMN customer_names TEXT NOT NULL DEFAULT '';
