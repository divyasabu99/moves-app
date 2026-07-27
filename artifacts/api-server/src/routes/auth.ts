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

function makeCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function signToken(userId: string, displayName: string): string {
  return jwt.sign({ userId, displayName }, JWT_SECRET, { expiresIn: "90d" });
}

async function sendVerificationEmail(email: string, name: string, code: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`\n📬 VERIFICATION CODE for ${email}: ${code}\n`);
    return;
  }
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0d0d0d;color:#fff;padding:40px;border-radius:16px">
      <h1 style="color:#ff3c5f;letter-spacing:4px;font-size:28px;margin:0 0 8px">MOVES</h1>
      <p style="color:#aaa;margin:0 0 32px">Hi ${name}, here's your verification code:</p>
      <div style="background:#1a1a1a;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
        <span style="font-size:42px;font-weight:700;letter-spacing:10px;color:#fff">${code}</span>
      </div>
      <p style="color:#888;font-size:13px">This code expires in 30 minutes. If you didn't create a MOVES account, ignore this email.</p>
    </div>`;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "MOVES <onboarding@resend.dev>",
      to: email,
      subject: `${code} is your MOVES verification code`,
      html,
    }),
  });
}

// POST /api/auth/register
router.post("/auth/register", async (req: Request, res: Response) => {
  const { email, password, displayName } = req.body ?? {};

  if (!email || !password || !displayName)
    return res.status(400).json({ error: "email, password and displayName are required" });
  if (typeof email !== "string" || !email.includes("@"))
    return res.status(400).json({ error: "Invalid email address" });
  if (typeof password !== "string" || password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });

  const normalizedEmail = email.trim().toLowerCase();
  const nameTrimmed = String(displayName).trim().slice(0, 80) || "Anonymous";

  try {
    const existing = await pool.query(
      "SELECT id FROM moves_users WHERE LOWER(email) = $1",
      [normalizedEmail]
    );
    if (existing.rows.length > 0)
      return res.status(409).json({ error: "An account with this email already exists" });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = makeId();
    const verificationCode = makeCode();
    const verificationExpires = new Date(Date.now() + 30 * 60 * 1000);

    await pool.query(
      `INSERT INTO moves_users (id, display_name, email, password_hash, email_verified, verification_code, verification_expires_at)
       VALUES ($1, $2, $3, $4, FALSE, $5, $6)`,
      [userId, nameTrimmed, normalizedEmail, passwordHash, verificationCode, verificationExpires]
    );

    await sendVerificationEmail(normalizedEmail, nameTrimmed, verificationCode).catch(() => {});

    const isDev = !process.env.RESEND_API_KEY;
    return res.status(201).json({
      userId, displayName: nameTrimmed, emailVerified: false,
      ...(isDev ? { devCode: verificationCode } : {}),
    });
  } catch (err: any) {
    console.error("register error", err);
    return res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (!email || !password)
    return res.status(400).json({ error: "email and password are required" });

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const result = await pool.query(
      "SELECT id, display_name, password_hash, email_verified FROM moves_users WHERE LOWER(email) = $1",
      [normalizedEmail]
    );
    if (result.rows.length === 0)
      return res.status(401).json({ error: "Incorrect email or password" });

    const u = result.rows[0];
    if (!u.password_hash)
      return res.status(401).json({ error: "This account has no password set." });

    const valid = await bcrypt.compare(String(password), u.password_hash);
    if (!valid)
      return res.status(401).json({ error: "Incorrect email or password" });

    const token = signToken(u.id, u.display_name);
    return res.json({
      userId: u.id,
      displayName: u.display_name,
      token,
      emailVerified: Boolean(u.email_verified),
    });
  } catch (err: any) {
    console.error("login error", err);
    return res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/auth/verify-code  { userId, code }
router.post("/auth/verify-code", async (req: Request, res: Response) => {
  const { userId, code } = req.body ?? {};
  if (!userId || !code)
    return res.status(400).json({ error: "userId and code are required" });

  try {
    const result = await pool.query(
      "SELECT verification_code, verification_expires_at, email_verified FROM moves_users WHERE id = $1",
      [userId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    const row = result.rows[0];
    if (row.email_verified)
      return res.json({ ok: true }); // already verified

    if (!row.verification_code || String(row.verification_code) !== String(code).trim())
      return res.status(400).json({ error: "Incorrect code. Please try again." });

    if (new Date() > new Date(row.verification_expires_at))
      return res.status(400).json({ error: "Code expired. Please request a new one." });

    await pool.query(
      "UPDATE moves_users SET email_verified = TRUE, verification_code = NULL, verification_expires_at = NULL WHERE id = $1",
      [userId]
    );
    return res.json({ ok: true });
  } catch (err: any) {
    console.error("verify-code error", err);
    return res.status(500).json({ error: "Verification failed" });
  }
});

// POST /api/auth/resend-code  { userId }
router.post("/auth/resend-code", async (req: Request, res: Response) => {
  const { userId } = req.body ?? {};
  if (!userId)
    return res.status(400).json({ error: "userId required" });

  try {
    const result = await pool.query(
      "SELECT email, display_name, email_verified FROM moves_users WHERE id = $1",
      [userId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    const row = result.rows[0];
    if (row.email_verified)
      return res.json({ ok: true }); // already verified

    const code = makeCode();
    const expires = new Date(Date.now() + 30 * 60 * 1000);
    await pool.query(
      "UPDATE moves_users SET verification_code = $1, verification_expires_at = $2 WHERE id = $3",
      [code, expires, userId]
    );
    await sendVerificationEmail(row.email, row.display_name, code).catch(() => {});
    const isDev = !process.env.RESEND_API_KEY;
    return res.json({ ok: true, ...(isDev ? { devCode: code } : {}) });
  } catch (err: any) {
    console.error("resend-code error", err);
    return res.status(500).json({ error: "Failed to resend code" });
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
