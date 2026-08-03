import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pool } from "@workspace/db";

const router = Router();

import { JWT_SECRET } from "../lib/jwt.js";

const OPENAI_BASE = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"] ?? "https://api.openai.com/v1";
const OPENAI_KEY  = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"]  ?? "";

// ── Auth middleware ────────────────────────────────────────────────────────────

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    (req as any).userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ── AI receipt parsing ────────────────────────────────────────────────────────

interface ReceiptItem {
  name: string;
  price: number;
  quantity: number;
}

interface ParsedReceipt {
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
}

async function parseReceiptImage(imageBase64: string): Promise<ParsedReceipt> {
  const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

  const response = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-5.6-luna",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a receipt parser. Extract all itemized line items from the receipt image and return structured JSON.

Respond ONLY with valid JSON matching this shape exactly:
{
  "items": [
    { "name": "<item name>", "price": <total price for this line as number>, "quantity": <quantity as integer> }
  ],
  "subtotal": <subtotal as number, 0 if not visible>,
  "tax": <tax amount as number, 0 if not visible>,
  "tip": <tip amount as number, 0 if not visible>,
  "total": <total as number, 0 if not visible>
}

Rules:
- Include every individual food/drink line item
- price is the TOTAL price for that line (not unit price), as a plain number (no $ sign)
- quantity defaults to 1 if not shown
- Skip subtotals, totals, tax, tip lines from items array — put those in their own fields
- If subtotal is 0 but items have prices, sum the items to compute it
- Round all prices to 2 decimal places`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Data}`,
                detail: "high",
              },
            },
            { type: "text", text: "Parse this receipt and return all line items as JSON." },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json() as any;
  const content = data.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content);

  const items: ReceiptItem[] = Array.isArray(parsed.items)
    ? parsed.items.map((it: any) => ({
        name: String(it.name ?? "Item").trim(),
        price: Math.round((Number(it.price) || 0) * 100) / 100,
        quantity: Math.max(1, Math.round(Number(it.quantity) || 1)),
      }))
    : [];

  const subtotal = Number(parsed.subtotal) || items.reduce((s, it) => s + it.price, 0);
  const tax = Number(parsed.tax) || 0;
  const tip = Number(parsed.tip) || 0;
  const total = Number(parsed.total) || subtotal + tax + tip;

  return {
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    tip: Math.round(tip * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/receipts
 * Header: Authorization: Bearer <token>
 * Body: { groupId, shareId, imageBase64 }
 * Parses receipt image with AI and stores the result.
 * userId is derived from the JWT — not accepted from the client.
 * Note: app.ts applies a 10 MB JSON body limit for this route specifically.
 */
router.post("/receipts", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { groupId, shareId, imageBase64 } = req.body as {
    groupId?: string; shareId?: string; imageBase64?: string;
  };

  if (!groupId || !shareId || !imageBase64) {
    res.status(400).json({ error: "groupId, shareId, imageBase64 are required" });
    return;
  }

  try {
    // Verify the shared move exists and belongs to the stated group
    const { rows: smRows } = await pool.query(
      "SELECT id FROM moves_shared_moves WHERE id=$1 AND group_id=$2",
      [shareId, groupId]
    );
    if (smRows.length === 0) {
      res.status(404).json({ error: "Shared move not found in this group" });
      return;
    }

    // Verify caller is a member of this group
    const { rows: mem } = await pool.query(
      "SELECT 1 FROM moves_group_members WHERE group_id=$1 AND user_id=$2",
      [groupId, userId]
    );
    if (mem.length === 0) { res.status(403).json({ error: "Not a member of this group" }); return; }

    // Check if receipt already exists for this shareId
    const { rows: existing } = await pool.query(
      "SELECT id FROM move_receipts WHERE share_id=$1",
      [shareId]
    );
    if (existing.length > 0) {
      res.status(409).json({ error: "Receipt already exists for this move", receiptId: existing[0].id });
      return;
    }

    const parsed = await parseReceiptImage(imageBase64);
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
    await pool.query(
      `INSERT INTO move_receipts (id, group_id, share_id, uploaded_by, items, subtotal, tax, tip, total)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9)`,
      [id, groupId, shareId, userId, JSON.stringify(parsed.items),
       parsed.subtotal, parsed.tax, parsed.tip, parsed.total]
    );
    res.status(201).json({ id, ...parsed });
  } catch (err: any) {
    console.error("receipt parse error:", err);
    res.status(502).json({ error: err?.message ?? "Failed to parse receipt" });
  }
});

/**
 * GET /api/receipts?shareId=
 * Header: Authorization: Bearer <token>
 * Returns the receipt for a shared move, with claims and per-person summary.
 * Membership is verified from the JWT.
 */
router.get("/receipts", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { shareId } = req.query as { shareId?: string };
  if (!shareId) { res.status(400).json({ error: "shareId required" }); return; }

  try {
    const { rows } = await pool.query(
      `SELECT r.*, u.display_name AS uploader_name, g.created_by AS group_creator
       FROM move_receipts r
       JOIN moves_users u ON u.id = r.uploaded_by
       JOIN moves_groups g ON g.id = r.group_id
       WHERE r.share_id = $1`,
      [shareId]
    );
    if (rows.length === 0) { res.status(404).json({ error: "No receipt found" }); return; }
    const receipt = rows[0];

    // Verify caller is a member of this receipt's group
    const { rows: mem } = await pool.query(
      "SELECT 1 FROM moves_group_members WHERE group_id=$1 AND user_id=$2",
      [receipt.group_id, userId]
    );
    if (mem.length === 0) { res.status(403).json({ error: "Not a member of this group" }); return; }

    // Claims
    const { rows: claims } = await pool.query(
      `SELECT rc.item_index, rc.user_id, u.display_name
       FROM receipt_claims rc
       JOIN moves_users u ON u.id = rc.user_id
       WHERE rc.receipt_id = $1`,
      [receipt.id]
    );

    // Group members
    const { rows: members } = await pool.query(
      `SELECT u.id, u.display_name
       FROM moves_group_members gm
       JOIN moves_users u ON u.id = gm.user_id
       WHERE gm.group_id = $1`,
      [receipt.group_id]
    );

    const items: ReceiptItem[] = receipt.items ?? [];
    const claimsByItem: Record<number, { userId: string; displayName: string }[]> = {};
    for (const claim of claims) {
      if (!claimsByItem[claim.item_index]) claimsByItem[claim.item_index] = [];
      claimsByItem[claim.item_index].push({ userId: claim.user_id, displayName: claim.display_name });
    }

    // Compute per-person totals
    const subtotal = Number(receipt.subtotal);
    const tax = Number(receipt.tax);
    const tip = Number(receipt.tip);
    const total = Number(receipt.total);
    const extras = tax + tip;

    const personOwes: Record<string, number> = {};
    for (const [idxStr, claimants] of Object.entries(claimsByItem)) {
      const idx = Number(idxStr);
      if (idx < 0 || idx >= items.length) continue;
      const item = items[idx];
      const share = item.price / claimants.length;
      for (const c of claimants) {
        personOwes[c.userId] = (personOwes[c.userId] ?? 0) + share;
      }
    }

    // Proportional tax+tip
    if (extras > 0 && subtotal > 0) {
      for (const uid of Object.keys(personOwes)) {
        const fraction = personOwes[uid] / subtotal;
        personOwes[uid] += extras * fraction;
      }
    }

    const summary = members.map(m => ({
      userId: m.id,
      displayName: m.display_name,
      subtotal: Math.round((personOwes[m.id] ?? 0) * 100) / 100,
      isUploader: m.id === receipt.uploaded_by,
    }));

    // Caller can confirm if they uploaded the receipt OR created the group
    const canConfirm = userId === receipt.uploaded_by || userId === receipt.group_creator;

    res.json({
      id: receipt.id,
      shareId: receipt.share_id,
      groupId: receipt.group_id,
      uploadedBy: { id: receipt.uploaded_by, displayName: receipt.uploader_name },
      items: items.map((item, i) => ({
        ...item,
        index: i,
        claimedBy: claimsByItem[i] ?? [],
      })),
      subtotal,
      tax,
      tip,
      total,
      summary,
      createdAt: receipt.created_at,
      confirmedAt: receipt.confirmed_at ?? null,
      canConfirm,
    });
  } catch (err: any) {
    console.error("receipts GET error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

/**
 * PUT /api/receipts/:id/claims
 * Header: Authorization: Bearer <token>
 * Body: { itemIndexes: number[] }
 * Replaces all claims for the authenticated user on this receipt.
 * Returns 409 if the receipt has already been confirmed.
 */
router.put("/receipts/:id/claims", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { id } = req.params;
  const { itemIndexes } = req.body as { itemIndexes?: number[] };
  if (!Array.isArray(itemIndexes)) {
    res.status(400).json({ error: "itemIndexes[] required" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "SELECT group_id, items, confirmed_at FROM move_receipts WHERE id=$1",
      [id]
    );
    if (rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Receipt not found" });
      return;
    }

    // Block changes after confirmation
    if (rows[0].confirmed_at) {
      await client.query("ROLLBACK");
      res.status(409).json({ error: "Receipt has been confirmed — claims are locked" });
      return;
    }

    // Verify membership
    const { rows: mem } = await client.query(
      "SELECT 1 FROM moves_group_members WHERE group_id=$1 AND user_id=$2",
      [rows[0].group_id, userId]
    );
    if (mem.length === 0) {
      await client.query("ROLLBACK");
      res.status(403).json({ error: "Not a member of this group" });
      return;
    }

    // Validate item indexes are within bounds
    const itemCount = Array.isArray(rows[0].items) ? rows[0].items.length : 0;
    const validIndexes = itemIndexes.filter(idx =>
      Number.isInteger(idx) && idx >= 0 && idx < itemCount
    );

    // Replace all claims for this user
    await client.query(
      "DELETE FROM receipt_claims WHERE receipt_id=$1 AND user_id=$2",
      [id, userId]
    );
    for (const idx of validIndexes) {
      await client.query(
        "INSERT INTO receipt_claims (receipt_id, item_index, user_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING",
        [id, idx, userId]
      );
    }
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("claims PUT error:", err);
    res.status(500).json({ error: "Internal error" });
  } finally {
    client.release();
  }
});

/**
 * POST /api/receipts/:id/confirm
 * Header: Authorization: Bearer <token>
 * Finalizes the receipt — locks all amounts. Only the uploader or group creator
 * may confirm. Idempotent (confirming an already-confirmed receipt is a no-op).
 */
router.post("/receipts/:id/confirm", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT r.uploaded_by, r.confirmed_at, g.created_by AS group_creator
       FROM move_receipts r
       JOIN moves_groups g ON g.id = r.group_id
       WHERE r.id = $1`,
      [id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "Receipt not found" });
      return;
    }

    const receipt = rows[0];

    // Only uploader or group creator may confirm
    if (userId !== receipt.uploaded_by && userId !== receipt.group_creator) {
      res.status(403).json({ error: "Only the person who uploaded the receipt or the group leader can confirm" });
      return;
    }

    // Idempotent — already confirmed is fine
    if (receipt.confirmed_at) {
      res.json({ ok: true, confirmedAt: receipt.confirmed_at });
      return;
    }

    const { rows: updated } = await pool.query(
      "UPDATE move_receipts SET confirmed_at = NOW() WHERE id = $1 RETURNING confirmed_at",
      [id]
    );
    res.json({ ok: true, confirmedAt: updated[0].confirmed_at });
  } catch (err: any) {
    console.error("confirm error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
