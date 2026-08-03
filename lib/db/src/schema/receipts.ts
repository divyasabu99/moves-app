import { pgTable, text, jsonb, numeric, timestamp, integer, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * One receipt per shared group move. Stores AI-parsed line items as JSONB.
 * uploaded_by, group_id, and share_id reference existing tables created via
 * raw SQL (moves_users, moves_groups, moves_shared_moves).
 */
export const moveReceipts = pgTable("move_receipts", {
  id:         text("id").primaryKey(),
  groupId:    text("group_id").notNull(),
  shareId:    text("share_id").notNull().unique(),  // one receipt per shared move
  uploadedBy: text("uploaded_by").notNull(),
  items:      jsonb("items").notNull().default(sql`'[]'::jsonb`),
  subtotal:   numeric("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  tax:        numeric("tax",      { precision: 10, scale: 2 }).notNull().default("0"),
  tip:        numeric("tip",      { precision: 10, scale: 2 }).notNull().default("0"),
  total:      numeric("total",    { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt:  timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Each row means a user claimed a line item on a receipt.
 * Multiple users can claim the same item (cost is split equally).
 */
export const receiptClaims = pgTable(
  "receipt_claims",
  {
    receiptId:  text("receipt_id").notNull().references(() => moveReceipts.id, { onDelete: "cascade" }),
    itemIndex:  integer("item_index").notNull(),
    userId:     text("user_id").notNull(),
  },
);
