-- Migration 0020: persist each appointment's audit type ('customer' | 'internal').
--
-- Until now the type was never stored, so after a reload the client had to infer it, and the
-- inference read site2/auditor2/department2, which assignmentOut() fills on every row. Result:
-- every Customer Audit was shown and counted as an Internal Audit.

ALTER TABLE assignments ADD COLUMN audit_type TEXT NOT NULL DEFAULT '';

-- Backfill existing rows from their content. Rows with neither customer nor internal-audit data
-- stay '' (unknown); the client treats those as Customer Audits until they are edited.
UPDATE assignments
SET audit_type = CASE
  WHEN TRIM(customer) != '' OR TRIM(end_customer) != '' OR TRIM(target_package) != '' OR TRIM(customer_names) != '' THEN 'customer'
  WHEN TRIM(area) != '' OR TRIM(audit_category) != '' THEN 'internal'
  ELSE ''
END
WHERE audit_type = '';
