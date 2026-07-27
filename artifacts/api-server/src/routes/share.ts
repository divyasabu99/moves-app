import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pool } from "@workspace/db";

const router = Router();
const JWT_SECRET = process.env.SESSION_SECRET ?? "moves-secret-fallback";

// ── DB init ───────────────────────────────────────────────────────────────────

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS moves_share_tokens (
      id           VARCHAR(36) PRIMARY KEY,
      token        VARCHAR(16) UNIQUE NOT NULL,
      move_data    JSONB NOT NULL,
      created_by   VARCHAR(128) REFERENCES moves_users(id) ON DELETE CASCADE,
      created_at   TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS moves_share_recipients (
      id          VARCHAR(36) PRIMARY KEY,
      token_id    VARCHAR(36) REFERENCES moves_share_tokens(id) ON DELETE CASCADE,
      phone       TEXT NOT NULL,
      shared_at   TIMESTAMP DEFAULT NOW(),
      viewed_at   TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS moves_share_reactions (
      id          VARCHAR(36) PRIMARY KEY,
      token_id    VARCHAR(36) REFERENCES moves_share_tokens(id) ON DELETE CASCADE,
      user_id     VARCHAR(128) REFERENCES moves_users(id) ON DELETE SET NULL,
      reaction    VARCHAR(4) CHECK (reaction IN ('up', 'down')),
      suggestion  JSONB,
      created_at  TIMESTAMP DEFAULT NOW(),
      UNIQUE (token_id, user_id)
    );
  `);
}
ensureTables().catch(err => console.error("[share] table init error:", err));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function makeToken(): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string; displayName: string };
      (req as any).userId = payload.userId;
      (req as any).displayName = payload.displayName;
    } catch { /* not logged in — that's fine */ }
  }
  next();
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; displayName: string };
    (req as any).userId = payload.userId;
    (req as any).displayName = payload.displayName;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function shareUrl(req: Request, token: string): string {
  const domain =
    process.env.REPLIT_DOMAINS?.split(",")[0] ??
    process.env.REPLIT_DEV_DOMAIN ??
    req.get("host") ??
    "localhost";
  const proto = domain.includes("localhost") ? "http" : "https";
  return `${proto}://${domain}/s/${token}`;
}

async function sendSms(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const auth = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !auth || !from) return { ok: false, error: "SMS not configured" };

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${auth}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
  });
  if (res.ok) return { ok: true };
  const data = await res.json() as any;
  return { ok: false, error: data.message ?? "SMS failed" };
}

// ── POST /api/share ───────────────────────────────────────────────────────────
// Body: { move, phones?: string[], message?: string }
// Returns: { token, url, smsSent: boolean, smsError?: string }

router.post("/share", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const displayName = (req as any).displayName as string;
  const { move, phones, message } = req.body ?? {};

  if (!move || typeof move !== "object") {
    return res.status(400).json({ error: "move is required" });
  }

  try {
    const token = makeToken();
    const id = makeId();

    await pool.query(
      `INSERT INTO moves_share_tokens (id, token, move_data, created_by) VALUES ($1, $2, $3, $4)`,
      [id, token, JSON.stringify(move), userId],
    );

    const url = shareUrl(req, token);

    // Record recipients and send SMS
    let smsSent = false;
    let smsError: string | undefined;
    const recipientPhones: string[] = Array.isArray(phones) ? phones : [];

    if (recipientPhones.length > 0) {
      const smsBody = message
        ? `${message}\n\nView the move: ${url}`
        : `${displayName} shared a move with you on MOVES! Check it out:\n\n${url}`;

      for (const phone of recipientPhones) {
        const normalised = phone.replace(/\D/g, "");
        const e164 = normalised.startsWith("1") ? `+${normalised}` : `+1${normalised}`;

        await pool.query(
          `INSERT INTO moves_share_recipients (id, token_id, phone) VALUES ($1, $2, $3)`,
          [makeId(), id, e164],
        );

        const result = await sendSms(e164, smsBody);
        if (result.ok) {
          smsSent = true;
        } else {
          smsError = result.error;
        }
      }
    }

    res.json({ token, url, smsSent, smsError, recipientCount: recipientPhones.length });
  } catch (err) {
    console.error("[share] POST /share error:", err);
    res.status(500).json({ error: "Failed to create share link" });
  }
});

// ── GET /api/shared/:token ────────────────────────────────────────────────────
// Public — returns move data + reaction counts + recipient count

router.get("/shared/:token", optionalAuth, async (req: Request, res: Response) => {
  const { token } = req.params;
  const userId = (req as any).userId as string | undefined;

  try {
    const row = await pool.query(
      `SELECT t.id, t.move_data, t.created_at,
              u.display_name AS shared_by_name,
              (SELECT COUNT(*) FROM moves_share_recipients WHERE token_id = t.id) AS recipient_count,
              (SELECT COUNT(*) FROM moves_share_reactions WHERE token_id = t.id AND reaction = 'up') AS up_count,
              (SELECT COUNT(*) FROM moves_share_reactions WHERE token_id = t.id AND reaction = 'down') AS down_count
       FROM moves_share_tokens t
       LEFT JOIN moves_users u ON u.id = t.created_by
       WHERE t.token = $1`,
      [token],
    );

    if (row.rows.length === 0) return res.status(404).json({ error: "Share link not found" });

    const r = row.rows[0];

    // User's own reaction (if logged in)
    let myReaction: string | null = null;
    let mySuggestion: any = null;
    if (userId) {
      const rxRow = await pool.query(
        `SELECT reaction, suggestion FROM moves_share_reactions WHERE token_id = $1 AND user_id = $2`,
        [r.id, userId],
      );
      if (rxRow.rows.length > 0) {
        myReaction = rxRow.rows[0].reaction;
        mySuggestion = rxRow.rows[0].suggestion;
      }

      // Record that this app user viewed the token (separate from phone-recipient tracking)
      // We intentionally do NOT update moves_share_recipients.viewed_at here because we
      // cannot reliably map an app-user login to a specific phone recipient row; doing so
      // would mark all recipients as viewed whenever any logged-in user opens the link.
    }

    res.json({
      token,
      move: r.move_data,
      sharedBy: r.shared_by_name ?? "Someone",
      sharedAt: r.created_at,
      stats: {
        recipientCount: parseInt(r.recipient_count, 10),
        upCount: parseInt(r.up_count, 10),
        downCount: parseInt(r.down_count, 10),
      },
      myReaction,
      mySuggestion,
    });
  } catch (err) {
    console.error("[share] GET /shared/:token error:", err);
    res.status(500).json({ error: "Failed to load shared move" });
  }
});

// ── POST /api/shared/:token/react ─────────────────────────────────────────────
// Body: { reaction: 'up' | 'down', suggestion?: object }
// Auth required

router.post("/shared/:token/react", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { token } = req.params;
  const { reaction, suggestion } = req.body ?? {};

  if (!reaction || !["up", "down"].includes(reaction)) {
    return res.status(400).json({ error: "reaction must be 'up' or 'down'" });
  }

  try {
    const tokenRow = await pool.query(
      `SELECT id FROM moves_share_tokens WHERE token = $1`, [token],
    );
    if (tokenRow.rows.length === 0) return res.status(404).json({ error: "Share link not found" });

    const tokenId = tokenRow.rows[0].id;
    await pool.query(
      `INSERT INTO moves_share_reactions (id, token_id, user_id, reaction, suggestion)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (token_id, user_id)
       DO UPDATE SET reaction = EXCLUDED.reaction, suggestion = EXCLUDED.suggestion`,
      [makeId(), tokenId, userId, reaction, suggestion ? JSON.stringify(suggestion) : null],
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("[share] POST /shared/:token/react error:", err);
    res.status(500).json({ error: "Failed to save reaction" });
  }
});

// ── POST /api/shared/:token/fork ──────────────────────────────────────────────
// Copies the shared move into the user's own saved moves
// Returns: the forked move (with new id)

router.post("/shared/:token/fork", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { token } = req.params;

  try {
    const tokenRow = await pool.query(
      `SELECT move_data FROM moves_share_tokens WHERE token = $1`, [token],
    );
    if (tokenRow.rows.length === 0) return res.status(404).json({ error: "Share link not found" });

    const move = tokenRow.rows[0].move_data as any;

    // Assign a fresh id so it doesn't collide with the original
    const forkedMove = {
      ...move,
      id: makeId(),
      status: "saved",
      createdAt: new Date().toISOString(),
      groupId: undefined,
      groupName: undefined,
    };

    // Merge into user_moves (JSONB array stored as whole blob, matching sync.ts pattern)
    const existing = await pool.query(
      `SELECT moves FROM user_moves WHERE user_id = $1`, [userId],
    );
    const current: any[] = existing.rows[0]?.moves ?? [];
    const updated = [...current, forkedMove];

    await pool.query(
      `INSERT INTO user_moves (user_id, moves, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET moves = EXCLUDED.moves, updated_at = NOW()`,
      [userId, JSON.stringify(updated)],
    );

    res.json({ move: forkedMove });
  } catch (err) {
    console.error("[share] POST /shared/:token/fork error:", err);
    res.status(500).json({ error: "Failed to fork move" });
  }
});

// ── GET /api/share/recipients/:moveId ────────────────────────────────────────
// Returns phone recipients for a move — only the creator of the share token
// may view recipient data (avoids exposing PII to other users).

router.get("/share/recipients/:moveId", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { moveId } = req.params;
  try {
    const rows = await pool.query(
      `SELECT r.phone, r.shared_at, r.viewed_at,
              u.display_name AS sent_by
       FROM moves_share_recipients r
       JOIN moves_share_tokens t ON t.id = r.token_id
       LEFT JOIN moves_users u ON u.id = t.created_by
       WHERE t.move_data->>'id' = $1
         AND t.created_by = $2
       ORDER BY r.shared_at DESC`,
      [moveId, userId],
    );
    res.json({ recipients: rows.rows });
  } catch (err) {
    console.error("[share] GET /share/recipients/:moveId error:", err);
    res.status(500).json({ error: "Failed to load recipients" });
  }
});

// ── GET /api/share/stats/:moveId ──────────────────────────────────────────────
// Returns share stats for a move the current user created

router.get("/share/stats/:moveId", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { moveId } = req.params;

  try {
    const row = await pool.query(
      `SELECT t.token,
              (SELECT COUNT(*) FROM moves_share_recipients WHERE token_id = t.id) AS recipient_count,
              (SELECT COUNT(*) FROM moves_share_reactions WHERE token_id = t.id AND reaction = 'up') AS up_count,
              (SELECT COUNT(*) FROM moves_share_reactions WHERE token_id = t.id AND reaction = 'down') AS down_count
       FROM moves_share_tokens t
       WHERE t.created_by = $1 AND t.move_data->>'id' = $2
       ORDER BY t.created_at DESC LIMIT 1`,
      [userId, moveId],
    );

    if (row.rows.length === 0) {
      return res.json({ shared: false });
    }

    const r = row.rows[0];
    res.json({
      shared: true,
      token: r.token,
      recipientCount: parseInt(r.recipient_count, 10),
      upCount: parseInt(r.up_count, 10),
      downCount: parseInt(r.down_count, 10),
    });
  } catch (err) {
    console.error("[share] GET /share/stats/:moveId error:", err);
    res.status(500).json({ error: "Failed to load share stats" });
  }
});

export default router;
