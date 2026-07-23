import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "@workspace/db";

const router = Router();
const JWT_SECRET = process.env.SESSION_SECRET ?? "moves-secret-fallback";
const SALT_ROUNDS = 10;

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function signToken(userId: string, displayName: string): string {
  return jwt.sign({ userId, displayName }, JWT_SECRET, { expiresIn: "90d" });
}

// POST /api/auth/register
router.post("/auth/register", async (req: Request, res: Response) => {
  const { email, password, displayName } = req.body ?? {};

  if (!email || !password || !displayName) {
    return res.status(400).json({ error: "email, password and displayName are required" });
  }
  if (typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email address" });
  }
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const nameTrimmed = String(displayName).trim().slice(0, 80) || "Anonymous";

  try {
    // Check email already taken
    const existing = await pool.query(
      "SELECT id FROM moves_users WHERE LOWER(email) = $1",
      [normalizedEmail]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = makeId();

    await pool.query(
      `INSERT INTO moves_users (id, display_name, email, password_hash)
       VALUES ($1, $2, $3, $4)`,
      [userId, nameTrimmed, normalizedEmail, passwordHash]
    );

    const token = signToken(userId, nameTrimmed);
    return res.status(201).json({ userId, displayName: nameTrimmed, token });
  } catch (err: any) {
    console.error("register error", err);
    return res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const result = await pool.query(
      "SELECT id, display_name, password_hash FROM moves_users WHERE LOWER(email) = $1",
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Incorrect email or password" });
    }

    const user = result.rows[0];
    if (!user.password_hash) {
      return res.status(401).json({ error: "This account has no password set. Use a different sign-in method." });
    }

    const valid = await bcrypt.compare(String(password), user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Incorrect email or password" });
    }

    const token = signToken(user.id, user.display_name);
    return res.json({ userId: user.id, displayName: user.display_name, token });
  } catch (err: any) {
    console.error("login error", err);
    return res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/auth/verify  — lightweight token check used on app launch
router.post("/auth/verify", (req: Request, res: Response) => {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; displayName: string };
    return res.json({ userId: payload.userId, displayName: payload.displayName });
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

export default router;
