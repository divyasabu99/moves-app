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

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

  const { token } = req.params;
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

export default app;

    const stopsHtml = (move.stops ?? []).map((stop: any, i: number) => `
      <div class="stop">
        <div class="stop-num">${i + 1}</div>
        <div class="stop-info">
          <strong>${esc(stop.place?.name ?? "Stop")}</strong>
          <span>${esc(stop.place?.neighborhood ?? "")}</span>
        </div>
      </div>`).join("");

    const row = await pool.query(
      `SELECT t.move_data, u.display_name AS shared_by
       FROM moves_share_tokens t
       LEFT JOIN moves_users u ON u.id = t.created_by
       WHERE t.token = $1`,
      [token],
    );

    const move = row.rows[0].move_data as any;

    const sharedBy: string = row.rows[0].shared_by ?? "Someone";

    const deepLink = `moves://shared/${esc(token)}`;
