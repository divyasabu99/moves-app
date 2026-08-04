import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
// Receipt upload sends a base64 image — allow 10 MB for that route only.
// All other routes keep a tight 256 KB ceiling.
app.use((req, res, next) => {
  const isReceiptUpload = req.method === "POST" && req.path === "/api/receipts";
  express.json({ limit: isReceiptUpload ? "10mb" : "256kb" })(req, res, next);
});
app.use(express.urlencoded({ extended: true, limit: "256kb" }));

app.use("/api", router);

// ── HTML-escaping helper ──────────────────────────────────────────────────────
function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// ── /s/:token — web share preview ────────────────────────────────────────────
app.get("/s/:token", async (req: Request, res: Response) => {
  const { token } = req.params;
  try {
    const row = await pool.query(
      `SELECT t.move_data, u.display_name AS shared_by
       FROM moves_share_tokens t
       LEFT JOIN moves_users u ON u.id = t.created_by
       WHERE t.token = $1`,
      [token],
    );
    if (!row.rows.length) {
      return res.status(404).send("Move not found or link has expired.");
    }
    const move = row.rows[0].move_data as any;
    const sharedBy: string = row.rows[0].shared_by ?? "Someone";
    const deepLink = `moves://shared/${esc(token)}`;

    const stopsHtml = (move.stops ?? []).map((stop: any, i: number) => `
      <div class="stop">
        <div class="stop-num">${i + 1}</div>
        <div class="stop-info">
          <strong>${esc(stop.place?.name ?? "Stop")}</strong>
          <span>${esc(stop.place?.neighborhood ?? "")}</span>
        </div>
      </div>`).join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(move.title ?? "A Move")} — MOVES</title>
<meta property="og:title" content="${esc(move.title ?? "A Move")}" />
<meta property="og:description" content="${esc(sharedBy)} shared a move with you on MOVES." />
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0a; color: #f0f0f0; font-family: -apple-system, sans-serif; min-height: 100dvh; display: flex; flex-direction: column; align-items: center; padding: 40px 16px; }
  .card { background: #151515; border: 1px solid #222; border-radius: 16px; padding: 24px; width: min(480px, 100%); }
  .vibe { color: #7c3aed; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px; }
  .title { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
  .by { font-size: 13px; color: #666; margin-bottom: 20px; }
  .stop { display: flex; gap: 12px; align-items: flex-start; padding: 10px 0; border-top: 1px solid #1f1f1f; }
  .stop-num { width: 24px; height: 24px; border-radius: 50%; background: #7c3aed22; color: #7c3aed; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
  .stop-info strong { display: block; font-size: 14px; font-weight: 600; }
  .stop-info span { font-size: 12px; color: #666; }
  .cta { display: block; margin-top: 24px; background: #7c3aed; color: #fff; text-align: center; padding: 14px; border-radius: 12px; font-weight: 700; font-size: 16px; text-decoration: none; }
</style>
</head>
<body>
<div class="card">
  <div class="vibe">${esc(move.vibe ?? "move")}</div>
  <div class="title">${esc(move.title ?? "Untitled")}</div>
  <div class="by">Shared by ${esc(sharedBy)}</div>
  ${stopsHtml}
  <a class="cta" href="${deepLink}">Open in MOVES</a>
</div>
</body>
</html>`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  } catch (err) {
    logger.error(err, "share preview error");
    return res.status(500).send("Something went wrong.");
  }
});

export default app;
