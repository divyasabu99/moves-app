-- Add confirmation support to receipts.
-- confirmed_at NULL means amounts are still provisional; non-NULL means finalized.
ALTER TABLE move_receipts ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
