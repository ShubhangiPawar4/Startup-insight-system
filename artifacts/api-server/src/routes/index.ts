import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import insightsRouter from "./insights.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(insightsRouter);

export default router;
