import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

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

export default app;
