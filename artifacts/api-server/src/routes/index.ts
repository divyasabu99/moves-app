import { Router } from "express";
import healthRouter from "./health.js";
import chatRouter from "./chat.js";
import usersRouter from "./users.js";
import groupsRouter from "./groups.js";
import importRouter from "./import.js";
import lookupRouter from "./lookup.js";
import suggestRouter from "./suggest.js";
import authRouter from "./auth.js";
import syncRouter from "./sync.js";
import preferencesRouter from "./preferences.js";
import receiptsRouter from "./receipts.js";
import shareRouter from "./share.js";

const router = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(syncRouter);
router.use(preferencesRouter);
router.use(chatRouter);
router.use(usersRouter);
router.use(groupsRouter);
router.use(importRouter);
router.use(lookupRouter);
router.use(suggestRouter);
router.use(receiptsRouter);
router.use(shareRouter);

export default router;
