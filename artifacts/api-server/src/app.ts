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

// ── /teleprompter — founder pitch practice tool ───────────────────────────────
app.get("/teleprompter", (_req: Request, res: Response) => {
  const pitch = [
    "Hey — I'm Divya, founder of MOVES.",
    "Planning a night out with friends is genuinely broken. You're bouncing between texts, Google Maps, and Yelp, someone flakes, and you end up at the same bar you always go to.",
    "MOVES fixes that. You pick a vibe — say, 'lowkey rooftop night' — and we generate a full itinerary: bars, restaurants, activities, in the right order, at the right time.",
    "You share it with your group in one tap. Everyone sees the plan, votes on stops, and gets directions — no more 17-message threads.",
    "We're live in New York with 2,400 monthly active users, growing 30% month over month, with a 4.8-star rating.",
    "The market is massive — Americans spend over 200 billion dollars a year on nights out. We monetize through venue partnerships, promoted placements, and a premium tier for power planners.",
    "We're raising a $1.5M pre-seed to grow the team, expand to three new cities, and launch our venue API.",
    "I'm Divya — I'd love to tell you more.",
  ];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>MOVES — Pitch Teleprompter</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0a; color: #f0f0f0; font-family: 'Georgia', serif; height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; user-select: none; }
  #ring-wrap { position: relative; width: 120px; height: 120px; flex-shrink: 0; }
  svg#ring { width: 120px; height: 120px; transform: rotate(-90deg); }
  #ring-track { fill: none; stroke: #2a2a2a; stroke-width: 8; }
  #ring-fill  { fill: none; stroke: #7c3aed; stroke-width: 8; stroke-linecap: round; transition: stroke-dashoffset 1s linear; }
  #ring-time  { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; font-family: 'Courier New', monospace; color: #f0f0f0; }
  #scroll-box { width: min(820px, 92vw); height: 52vh; overflow: hidden; position: relative; margin-top: 32px; }
  #scroll-box::before, #scroll-box::after { content: ''; position: absolute; left: 0; right: 0; height: 80px; z-index: 2; pointer-events: none; }
  #scroll-box::before { top: 0; background: linear-gradient(to bottom, #0a0a0a, transparent); }
  #scroll-box::after  { bottom: 0; background: linear-gradient(to top, #0a0a0a, transparent); }
  #scroll-inner { display: flex; flex-direction: column; gap: 36px; padding: 80px 0; transition: transform 0.6s ease; }
  .line { font-size: clamp(20px, 2.8vw, 30px); line-height: 1.6; text-align: center; color: #888; transition: color 0.4s, font-size 0.4s; padding: 0 16px; }
  .line.active { color: #fff; font-size: clamp(24px, 3.2vw, 34px); }
  #controls { display: flex; gap: 16px; margin-top: 36px; }
  button { background: #1c1c1c; border: 1px solid #333; color: #f0f0f0; border-radius: 8px; padding: 10px 22px; font-size: 15px; cursor: pointer; transition: background 0.2s; }
  button:hover { background: #2a2a2a; }
  #btn-play { background: #7c3aed; border-color: #7c3aed; }
  #btn-play:hover { background: #6d28d9; }
  #speed-display { font-size: 13px; color: #666; margin-top: 12px; font-family: monospace; }
  #hint { font-size: 12px; color: #444; margin-top: 8px; }
</style>
</head>
<body>
<div id="ring-wrap">
  <svg id="ring" viewBox="0 0 120 120">
    <circle id="ring-track" cx="60" cy="60" r="52" />
    <circle id="ring-fill"  cx="60" cy="60" r="52" />
  </svg>
  <div id="ring-time">1:00</div>
</div>

<div id="scroll-box">
  <div id="scroll-inner">
    ${pitch.map((p, i) => `<p class="line${i === 0 ? ' active' : ''}" data-index="${i}">${esc(p)}</p>`).join("\n    ")}
  </div>
</div>

<div id="controls">
  <button id="btn-play">▶ Play</button>
  <button id="btn-reset">↺ Reset</button>
  <button id="btn-slower">0.5×</button>
  <button id="btn-faster">2×</button>
</div>
<div id="speed-display">Speed: 1×</div>
<div id="hint">Space = play/pause · R = reset</div>

<script>
  const TOTAL = 60;
  const lines = Array.from(document.querySelectorAll('.line'));
  const inner = document.getElementById('scroll-inner');
  const ringFill = document.getElementById('ring-fill');
  const ringTime = document.getElementById('ring-time');
  const btnPlay = document.getElementById('btn-play');
  const speedDisplay = document.getElementById('speed-display');
  const C = 2 * Math.PI * 52;
  ringFill.style.strokeDasharray = C;
  ringFill.style.strokeDashoffset = 0;

  let playing = false, elapsed = 0, speed = 1, raf = null, last = null;
  const perLine = TOTAL / lines.length;

  function fmt(s) {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return m + ':' + String(sec).padStart(2, '0');
  }

  function render(t) {
    const idx = Math.min(Math.floor(t / perLine), lines.length - 1);
    lines.forEach((l, i) => l.classList.toggle('active', i === idx));
    const active = lines[idx];
    const boxH = document.getElementById('scroll-box').offsetHeight;
    const offset = active.offsetTop - boxH / 2 + active.offsetHeight / 2;
    inner.style.transform = 'translateY(' + (-offset) + 'px)';
    const left = Math.max(0, TOTAL - t);
    ringFill.style.strokeDashoffset = C * (t / TOTAL);
    ringTime.textContent = fmt(left);
  }

  function tick(ts) {
    if (!last) last = ts;
    elapsed += (ts - last) / 1000 * speed;
    last = ts;
    if (elapsed >= TOTAL) { elapsed = TOTAL; playing = false; btnPlay.textContent = '▶ Play'; last = null; }
    render(elapsed);
    if (playing) raf = requestAnimationFrame(tick);
  }

  function toggle() {
    playing = !playing;
    btnPlay.textContent = playing ? '⏸ Pause' : '▶ Play';
    if (playing) { last = null; raf = requestAnimationFrame(tick); }
    else { cancelAnimationFrame(raf); last = null; }
  }

  function reset() {
    playing = false; elapsed = 0; last = null;
    cancelAnimationFrame(raf);
    btnPlay.textContent = '▶ Play';
    render(0);
  }

  function setSpeed(s) {
    speed = s;
    speedDisplay.textContent = 'Speed: ' + s + '×';
  }

  btnPlay.onclick = toggle;
  document.getElementById('btn-reset').onclick = reset;
  document.getElementById('btn-slower').onclick = () => setSpeed(0.5);
  document.getElementById('btn-faster').onclick = () => setSpeed(2);
  document.addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); toggle(); }
    if (e.code === 'KeyR') reset();
  });

  render(0);
</script>
</body>
</html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

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
