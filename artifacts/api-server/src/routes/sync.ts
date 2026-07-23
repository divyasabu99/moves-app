import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pool } from "@workspace/db";

const router = Router();
const JWT_SECRET = process.env.SESSION_SECRET ?? "moves-secret-fallback";

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Authentication required" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    (req as any).userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ── Places sync ───────────────────────────────────────────────────────────────

// GET /api/sync/places
router.get("/sync/places", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  try {
    const result = await pool.query(
      "SELECT places FROM user_places WHERE user_id = $1",
      [userId]
    );
    const places = result.rows[0]?.places ?? [];
    return res.json({ places });
  } catch (err) {
    console.error("sync/places GET error", err);
    return res.status(500).json({ error: "Failed to fetch places" });
  }
});

// POST /api/sync/places  — full replace (client is source of truth per-user)
router.post("/sync/places", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { places } = req.body ?? {};
  if (!Array.isArray(places)) {
    return res.status(400).json({ error: "places must be an array" });
  }
  try {
    await pool.query(
      `INSERT INTO user_places (user_id, places, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE
         SET places = EXCLUDED.places, updated_at = NOW()`,
      [userId, JSON.stringify(places)]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("sync/places POST error", err);
    return res.status(500).json({ error: "Failed to save places" });
  }
});

// ── Moves sync ────────────────────────────────────────────────────────────────

// GET /api/sync/moves
router.get("/sync/moves", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  try {
    const result = await pool.query(
      "SELECT moves FROM user_moves WHERE user_id = $1",
      [userId]
    );
    const moves = result.rows[0]?.moves ?? [];
    return res.json({ moves });
  } catch (err) {
    console.error("sync/moves GET error", err);
    return res.status(500).json({ error: "Failed to fetch moves" });
  }
});

// POST /api/sync/moves
router.post("/sync/moves", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { moves } = req.body ?? {};
  if (!Array.isArray(moves)) {
    return res.status(400).json({ error: "moves must be an array" });
  }
  try {
    await pool.query(
      `INSERT INTO user_moves (user_id, moves, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE
         SET moves = EXCLUDED.moves, updated_at = NOW()`,
      [userId, JSON.stringify(moves)]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("sync/moves POST error", err);
    return res.status(500).json({ error: "Failed to save moves" });
  }
});

export default router;
