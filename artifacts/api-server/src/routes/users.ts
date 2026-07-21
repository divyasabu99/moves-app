import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

// Upsert a user (called on first launch and whenever display name changes)
router.post("/users", async (req, res) => {
  const { id, displayName } = req.body as { id?: string; displayName?: string };
  if (!id || typeof id !== "string" || id.length > 128) {
    res.status(400).json({ error: "id is required" });
    return;
  }
  const name = (displayName ?? "").trim().slice(0, 80) || "Anonymous";
  try {
    const { rows } = await pool.query<{ id: string; display_name: string; created_at: string }>(
      `INSERT INTO moves_users (id, display_name)
       VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, updated_at = NOW()
       RETURNING id, display_name, created_at`,
      [id, name]
    );
    res.json({ id: rows[0].id, displayName: rows[0].display_name, createdAt: rows[0].created_at });
  } catch (err) {
    console.error("users POST error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
