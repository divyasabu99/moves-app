import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pool } from "@workspace/db";

const router = Router();
if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET env var is required");
const JWT_SECRET: string = process.env.SESSION_SECRET;

// ── Auth helpers ──────────────────────────────────────────────────────────────

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; displayName: string };
    (req as any).userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Optional auth — sets userId if token present but does not block unauthenticated requests
function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
      (req as any).userId = payload.userId;
    } catch { /* ignore */ }
  }
  next();
}

// ── DB init ───────────────────────────────────────────────────────────────────

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS moves_group_move_votes (
      id          VARCHAR(36) PRIMARY KEY,
      share_id    VARCHAR(36) NOT NULL REFERENCES moves_shared_moves(id) ON DELETE CASCADE,
      group_id    VARCHAR(36) NOT NULL,
      user_id     VARCHAR(128) NOT NULL REFERENCES moves_users(id) ON DELETE CASCADE,
      vote        VARCHAR(4) NOT NULL CHECK (vote IN ('up', 'down')),
      created_at  TIMESTAMP DEFAULT NOW(),
      UNIQUE (share_id, user_id)
    );
  `);
}
ensureTables().catch(err => console.error("[groups] table init error:", err));

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// ── GET /api/groups?userId= ───────────────────────────────────────────────────
// Read-only list; still uses query userId for backward-compat while mobile migrates,
// but we fall back to token identity if present.
router.get("/groups", optionalAuth, async (req, res) => {
  const userId = (req as any).userId ?? (req.query as any).userId;
  if (!userId) { res.status(400).json({ error: "userId required" }); return; }
  try {
    const { rows } = await pool.query(
      `SELECT g.id, g.name, g.invite_code, g.created_by, g.created_at,
              COUNT(DISTINCT gm.user_id)::int AS member_count,
              COUNT(DISTINCT sm.id)::int AS move_count
       FROM moves_groups g
       JOIN moves_group_members gm ON gm.group_id = g.id AND gm.user_id = $1
       JOIN moves_group_members gm_all ON gm_all.group_id = g.id
       LEFT JOIN moves_shared_moves sm ON sm.group_id = g.id
       GROUP BY g.id
       ORDER BY g.created_at DESC`,
      [userId]
    );
    res.json(rows.map(r => ({
      id: r.id, name: r.name, inviteCode: r.invite_code,
      createdBy: r.created_by, createdAt: r.created_at,
      memberCount: r.member_count, moveCount: r.move_count,
    })));
  } catch (err) {
    console.error("groups GET error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// ── POST /api/groups — create a group ────────────────────────────────────────
router.post("/groups", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const { name } = req.body as { name?: string };
  if (!name?.trim()) { res.status(400).json({ error: "name required" }); return; }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let inviteCode = generateInviteCode();
    for (let i = 0; i < 5; i++) {
      const { rows } = await client.query("SELECT 1 FROM moves_groups WHERE invite_code=$1", [inviteCode]);
      if (rows.length === 0) break;
      inviteCode = generateInviteCode();
    }
    const id = generateId();
    const { rows } = await client.query(
      `INSERT INTO moves_groups (id, name, invite_code, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, name.trim().slice(0, 80), inviteCode, userId]
    );
    await client.query(
      "INSERT INTO moves_group_members (group_id, user_id) VALUES ($1, $2)",
      [id, userId]
    );
    await client.query("COMMIT");
    const g = rows[0];
    res.status(201).json({
      id: g.id, name: g.name, inviteCode: g.invite_code,
      createdBy: g.created_by, createdAt: g.created_at,
      memberCount: 1, moveCount: 0,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("groups POST error:", err);
    res.status(500).json({ error: "Internal error" });
  } finally {
    client.release();
  }
});

// ── POST /api/groups/join — join by invite code ───────────────────────────────
router.post("/groups/join", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const { inviteCode } = req.body as { inviteCode?: string };
  if (!inviteCode?.trim()) { res.status(400).json({ error: "inviteCode required" }); return; }
  try {
    const { rows: groups } = await pool.query(
      "SELECT * FROM moves_groups WHERE invite_code = $1",
      [inviteCode.trim().toUpperCase()]
    );
    if (groups.length === 0) { res.status(404).json({ error: "Group not found" }); return; }
    const group = groups[0];
    await pool.query(
      `INSERT INTO moves_group_members (group_id, user_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [group.id, userId]
    );
    const { rows: [counts] } = await pool.query(
      `SELECT COUNT(DISTINCT gm.user_id)::int AS member_count, COUNT(DISTINCT sm.id)::int AS move_count
       FROM moves_group_members gm
       LEFT JOIN moves_shared_moves sm ON sm.group_id = gm.group_id
       WHERE gm.group_id = $1`,
      [group.id]
    );
    res.json({
      id: group.id, name: group.name, inviteCode: group.invite_code,
      createdBy: group.created_by, createdAt: group.created_at,
      memberCount: counts.member_count, moveCount: counts.move_count,
    });
  } catch (err) {
    console.error("groups join error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// ── GET /api/groups/:id — group details + members ────────────────────────────
router.get("/groups/:id", optionalAuth, async (req, res) => {
  const { id } = req.params;
  const userId = (req as any).userId ?? (req.query as any).userId;
  try {
    const { rows: groups } = await pool.query("SELECT * FROM moves_groups WHERE id = $1", [id]);
    if (groups.length === 0) { res.status(404).json({ error: "Not found" }); return; }
    if (userId) {
      const { rows: mem } = await pool.query(
        "SELECT 1 FROM moves_group_members WHERE group_id=$1 AND user_id=$2",
        [id, userId]
      );
      if (mem.length === 0) { res.status(403).json({ error: "Not a member" }); return; }
    }
    const { rows: members } = await pool.query(
      `SELECT u.id, u.display_name, gm.joined_at
       FROM moves_group_members gm
       JOIN moves_users u ON u.id = gm.user_id
       WHERE gm.group_id = $1
       ORDER BY gm.joined_at ASC`,
      [id]
    );
    const g = groups[0];
    res.json({
      id: g.id, name: g.name, inviteCode: g.invite_code,
      createdBy: g.created_by, createdAt: g.created_at,
      members: members.map(m => ({ id: m.id, displayName: m.display_name, joinedAt: m.joined_at })),
    });
  } catch (err) {
    console.error("groups GET:id error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// ── GET /api/groups/:id/moves ─────────────────────────────────────────────────
router.get("/groups/:id/moves", optionalAuth, async (req, res) => {
  const { id } = req.params;
  const userId = (req as any).userId ?? (req.query as any).userId ?? null;
  try {
    if (userId) {
      const { rows: mem } = await pool.query(
        "SELECT 1 FROM moves_group_members WHERE group_id=$1 AND user_id=$2",
        [id, userId]
      );
      if (mem.length === 0) { res.status(403).json({ error: "Not a member" }); return; }
    }
    const { rows } = await pool.query(
      `SELECT sm.id, sm.move_data, sm.shared_at, u.id AS user_id, u.display_name,
              COUNT(CASE WHEN v.vote = 'up'   THEN 1 END)::int AS up_count,
              COUNT(CASE WHEN v.vote = 'down' THEN 1 END)::int AS down_count,
              MAX(CASE WHEN v.user_id = $2 THEN v.vote END) AS my_vote
       FROM moves_shared_moves sm
       JOIN moves_users u ON u.id = sm.user_id
       LEFT JOIN moves_group_move_votes v ON v.share_id = sm.id
       WHERE sm.group_id = $1
       GROUP BY sm.id, sm.move_data, sm.shared_at, u.id, u.display_name
       ORDER BY sm.shared_at DESC
       LIMIT 50`,
      [id, userId]
    );
    res.json(rows.map(r => ({
      id: r.id, move: r.move_data,
      sharedBy: { id: r.user_id, displayName: r.display_name },
      sharedAt: r.shared_at,
      votes: { upCount: r.up_count ?? 0, downCount: r.down_count ?? 0, myVote: r.my_vote ?? null },
    })));
  } catch (err) {
    console.error("group moves GET error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// ── GET /api/groups/:id/moves/:shareId — single shared move ──────────────────
router.get("/groups/:id/moves/:shareId", optionalAuth, async (req, res) => {
  const { id, shareId } = req.params;
  const userId = (req as any).userId ?? (req.query as any).userId ?? null;
  try {
    const { rows } = await pool.query(
      `SELECT sm.id, sm.move_data, sm.shared_at, u.id AS user_id, u.display_name,
              COUNT(CASE WHEN v.vote = 'up'   THEN 1 END)::int AS up_count,
              COUNT(CASE WHEN v.vote = 'down' THEN 1 END)::int AS down_count,
              MAX(CASE WHEN v.user_id = $3 THEN v.vote END) AS my_vote
       FROM moves_shared_moves sm
       JOIN moves_users u ON u.id = sm.user_id
       LEFT JOIN moves_group_move_votes v ON v.share_id = sm.id
       WHERE sm.id = $1 AND sm.group_id = $2
       GROUP BY sm.id, sm.move_data, sm.shared_at, u.id, u.display_name`,
      [shareId, id, userId]
    );
    if (rows.length === 0) { res.status(404).json({ error: "Not found" }); return; }
    const r = rows[0];
    res.json({
      id: r.id, move: r.move_data,
      sharedBy: { id: r.user_id, displayName: r.display_name },
      sharedAt: r.shared_at,
      votes: { upCount: r.up_count ?? 0, downCount: r.down_count ?? 0, myVote: r.my_vote ?? null },
    });
  } catch (err) {
    console.error("group single move GET error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// ── POST /api/groups/:id/moves/:shareId/vote ──────────────────────────────────
// Vote up or down; creator is blocked. Same-vote toggled off.
router.post("/groups/:id/moves/:shareId/vote", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const { id, shareId } = req.params;
  const { vote } = req.body as { vote?: string };
  if (!vote || !["up", "down"].includes(vote)) {
    res.status(400).json({ error: "vote must be 'up' or 'down'" }); return;
  }
  try {
    const { rows: mem } = await pool.query(
      "SELECT 1 FROM moves_group_members WHERE group_id=$1 AND user_id=$2",
      [id, userId]
    );
    if (mem.length === 0) { res.status(403).json({ error: "Not a member" }); return; }

    const { rows: sm } = await pool.query(
      "SELECT user_id FROM moves_shared_moves WHERE id=$1 AND group_id=$2",
      [shareId, id]
    );
    if (sm.length === 0) { res.status(404).json({ error: "Move not found" }); return; }
    if (sm[0].user_id === userId) {
      res.status(403).json({ error: "You cannot vote on your own move" }); return;
    }

    const existing = await pool.query(
      "SELECT vote FROM moves_group_move_votes WHERE share_id=$1 AND user_id=$2",
      [shareId, userId]
    );

    if (existing.rows.length > 0 && existing.rows[0].vote === vote) {
      // Same vote — toggle off
      await pool.query(
        "DELETE FROM moves_group_move_votes WHERE share_id=$1 AND user_id=$2",
        [shareId, userId]
      );
    } else {
      await pool.query(
        `INSERT INTO moves_group_move_votes (id, share_id, group_id, user_id, vote)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (share_id, user_id) DO UPDATE SET vote = $5`,
        [generateId(), shareId, id, userId, vote]
      );
    }

    const { rows: counts } = await pool.query(
      `SELECT COUNT(CASE WHEN vote = 'up'   THEN 1 END)::int AS up_count,
              COUNT(CASE WHEN vote = 'down' THEN 1 END)::int AS down_count,
              MAX(CASE WHEN user_id = $2 THEN vote END) AS my_vote
       FROM moves_group_move_votes WHERE share_id = $1`,
      [shareId, userId]
    );
    res.json({
      upCount: counts[0].up_count ?? 0,
      downCount: counts[0].down_count ?? 0,
      myVote: counts[0].my_vote ?? null,
    });
  } catch (err) {
    console.error("group vote POST error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// ── POST /api/groups/:id/moves — share a move ────────────────────────────────
router.post("/groups/:id/moves", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const { id } = req.params;
  const { move } = req.body as { move?: object };
  if (!move) { res.status(400).json({ error: "move required" }); return; }
  try {
    const { rows: mem } = await pool.query(
      "SELECT 1 FROM moves_group_members WHERE group_id=$1 AND user_id=$2",
      [id, userId]
    );
    if (mem.length === 0) { res.status(403).json({ error: "Not a member" }); return; }
    const shareId = generateId();
    const { rows } = await pool.query(
      `INSERT INTO moves_shared_moves (id, group_id, user_id, move_data)
       VALUES ($1, $2, $3, $4) RETURNING id, shared_at`,
      [shareId, id, userId, JSON.stringify(move)]
    );
    res.status(201).json({ id: rows[0].id, sharedAt: rows[0].shared_at });
  } catch (err) {
    console.error("group moves POST error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// ── POST /api/groups/:id/sync-places ─────────────────────────────────────────
router.post("/groups/:id/sync-places", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const { id } = req.params;
  const { places } = req.body as { places?: unknown[] };
  if (!Array.isArray(places)) { res.status(400).json({ error: "places[] required" }); return; }
  try {
    const { rows: mem } = await pool.query(
      "SELECT 1 FROM moves_group_members WHERE group_id=$1 AND user_id=$2",
      [id, userId]
    );
    if (mem.length === 0) { res.status(403).json({ error: "Not a member" }); return; }

    await pool.query(
      `INSERT INTO moves_member_places (group_id, user_id, places, synced_at)
       VALUES ($1, $2, $3::jsonb, NOW())
       ON CONFLICT (group_id, user_id) DO UPDATE
         SET places = $3::jsonb, synced_at = NOW()`,
      [id, userId, JSON.stringify(places)]
    );

    const { rows } = await pool.query(
      `SELECT mp.user_id, u.display_name, mp.places
       FROM moves_member_places mp
       JOIN moves_users u ON u.id = mp.user_id
       WHERE mp.group_id = $1 AND mp.user_id <> $2`,
      [id, userId]
    );

    res.json({
      members: rows.map(r => ({
        userId: r.user_id,
        displayName: r.display_name,
        places: r.places ?? [],
      })),
    });
  } catch (err) {
    console.error("sync-places error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// ── GET /api/users/lookup?email=&groupId= ────────────────────────────────────
// Auth-gated: caller must be a member of the given group.
router.get("/users/lookup", requireAuth, async (req, res) => {
  const callerId = (req as any).userId as string;
  const { email, groupId } = req.query as { email?: string; groupId?: string };
  if (!email?.trim()) { res.status(400).json({ error: "email required" }); return; }
  if (!groupId?.trim()) { res.status(400).json({ error: "groupId required" }); return; }
  try {
    const { rows: membership } = await pool.query(
      "SELECT 1 FROM moves_group_members WHERE group_id=$1 AND user_id=$2",
      [groupId, callerId]
    );
    if (membership.length === 0) {
      res.status(403).json({ error: "Not a member of this group" }); return;
    }
    const { rows } = await pool.query(
      "SELECT id, display_name FROM moves_users WHERE LOWER(email) = $1",
      [email.trim().toLowerCase()]
    );
    if (rows.length === 0) { res.json({ found: false }); return; }
    res.json({ found: true, userId: rows[0].id, displayName: rows[0].display_name });
  } catch (err) {
    console.error("user lookup error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// ── POST /api/groups/:id/members ─────────────────────────────────────────────
// Any authenticated member can add another verified user by their userId.
router.post("/groups/:id/members", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const { id } = req.params;
  const { targetUserId } = req.body as { targetUserId?: string };
  if (!targetUserId) { res.status(400).json({ error: "targetUserId required" }); return; }
  try {
    const { rows: mem } = await pool.query(
      "SELECT 1 FROM moves_group_members WHERE group_id=$1 AND user_id=$2",
      [id, userId]
    );
    if (mem.length === 0) { res.status(403).json({ error: "Not a member" }); return; }
    const { rows: target } = await pool.query(
      "SELECT id, display_name FROM moves_users WHERE id=$1",
      [targetUserId]
    );
    if (target.length === 0) { res.status(404).json({ error: "User not found" }); return; }
    await pool.query(
      `INSERT INTO moves_group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [id, targetUserId]
    );
    res.status(201).json({ ok: true, displayName: target[0].display_name });
  } catch (err) {
    console.error("group member add error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// ── PATCH /api/groups/:id — rename group (leader only) ───────────────────────
router.patch("/groups/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const { id } = req.params;
  const { name } = req.body as { name?: string };
  if (!name?.trim()) { res.status(400).json({ error: "name required" }); return; }
  try {
    const { rows } = await pool.query("SELECT created_by FROM moves_groups WHERE id=$1", [id]);
    if (rows.length === 0) { res.status(404).json({ error: "Group not found" }); return; }
    if (rows[0].created_by !== userId) {
      res.status(403).json({ error: "Only the group leader can rename the group" }); return;
    }
    const trimmed = name.trim().slice(0, 80);
    await pool.query("UPDATE moves_groups SET name=$1 WHERE id=$2", [trimmed, id]);
    res.json({ ok: true, name: trimmed });
  } catch (err) {
    console.error("group PATCH error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// ── DELETE /api/groups/:id/members/:memberId — leader only ───────────────────
router.delete("/groups/:id/members/:memberId", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const { id, memberId } = req.params;
  try {
    const { rows: group } = await pool.query(
      "SELECT created_by FROM moves_groups WHERE id=$1", [id]
    );
    if (group.length === 0) { res.status(404).json({ error: "Group not found" }); return; }
    if (group[0].created_by !== userId) {
      res.status(403).json({ error: "Only the group leader can remove members" }); return;
    }
    if (memberId === userId) {
      res.status(400).json({ error: "Group leader cannot remove themselves" }); return;
    }
    const result = await pool.query(
      "DELETE FROM moves_group_members WHERE group_id=$1 AND user_id=$2",
      [id, memberId]
    );
    if (result.rowCount === 0) { res.status(404).json({ error: "Member not found" }); return; }
    res.json({ ok: true });
  } catch (err) {
    console.error("group member DELETE error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// ── DELETE /api/groups/:id/moves/:shareId ────────────────────────────────────
router.delete("/groups/:id/moves/:shareId", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const { id, shareId } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM moves_shared_moves WHERE id=$1 AND group_id=$2 AND user_id=$3",
      [shareId, id, userId]
    );
    if (result.rowCount === 0) { res.status(404).json({ error: "Not found or not yours" }); return; }
    res.json({ ok: true });
  } catch (err) {
    console.error("group moves DELETE error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
