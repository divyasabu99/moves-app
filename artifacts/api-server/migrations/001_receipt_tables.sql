-- Receipt splitting tables
-- Run once against the target database to provision the receipt feature.

CREATE TABLE IF NOT EXISTS move_receipts (
  id          TEXT PRIMARY KEY,
  group_id    TEXT NOT NULL,
  share_id    TEXT NOT NULL UNIQUE,   -- one receipt per shared move
  uploaded_by TEXT NOT NULL,
  items       JSONB    NOT NULL DEFAULT '[]',
  subtotal    NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax         NUMERIC(10,2) NOT NULL DEFAULT 0,
  tip         NUMERIC(10,2) NOT NULL DEFAULT 0,
  total       NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_receipt_group
    FOREIGN KEY (group_id) REFERENCES moves_groups(id) ON DELETE CASCADE,
  CONSTRAINT fk_receipt_share
    FOREIGN KEY (share_id) REFERENCES moves_shared_moves(id) ON DELETE CASCADE,
  CONSTRAINT fk_receipt_uploader
    FOREIGN KEY (uploaded_by) REFERENCES moves_users(id)
);

CREATE TABLE IF NOT EXISTS receipt_claims (
  receipt_id  TEXT    NOT NULL,
  item_index  INTEGER NOT NULL,
  user_id     TEXT    NOT NULL,
  PRIMARY KEY (receipt_id, item_index, user_id),
  CONSTRAINT fk_claim_receipt
    FOREIGN KEY (receipt_id) REFERENCES move_receipts(id) ON DELETE CASCADE,
  CONSTRAINT fk_claim_user
    FOREIGN KEY (user_id) REFERENCES moves_users(id) ON DELETE CASCADE,
  CONSTRAINT valid_item_index CHECK (item_index >= 0)
);
