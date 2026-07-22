import { Router } from "express";
import healthRouter from "./health.js";
import chatRouter from "./chat.js";
import usersRouter from "./users.js";
import groupsRouter from "./groups.js";
import importRouter from "./import.js";
import lookupRouter from "./lookup.js";
import suggestRouter from "./suggest.js";

const router = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(usersRouter);
router.use(groupsRouter);
router.use(importRouter);
router.use(lookupRouter);
router.use(suggestRouter);

export default router;
