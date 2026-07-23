import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pool } from "@workspace/db";

const router = Router();
const JWT_SECRET = process.env.SESSION_SECRET ?? "moves-secret-fallback";

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

// GET /api/user/preferences
router.get("/user/preferences", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  try {
    const result = await pool.query(
      "SELECT music, events, food FROM user_preferences WHERE user_id = $1",
      [userId]
    );
    if (result.rows.length === 0) return res.json({ music: [], events: [], food: [] });
    const row = result.rows[0];
    return res.json({ music: row.music ?? [], events: row.events ?? [], food: row.food ?? [] });
  } catch (err) {
    console.error("GET preferences error", err);
    return res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

// POST /api/user/preferences
router.post("/user/preferences", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { music, events, food } = req.body ?? {};
  if (!Array.isArray(music) || !Array.isArray(events) || !Array.isArray(food))
    return res.status(400).json({ error: "music, events, and food must be arrays" });

  try {
    await pool.query(
      `INSERT INTO user_preferences (user_id, music, events, food, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id) DO UPDATE
         SET music = EXCLUDED.music, events = EXCLUDED.events, food = EXCLUDED.food, updated_at = NOW()`,
      [userId, music, events, food]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("POST preferences error", err);
    return res.status(500).json({ error: "Failed to save preferences" });
  }
});

export default router;
