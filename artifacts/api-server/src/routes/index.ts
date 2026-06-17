import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import configRouter from "./config";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(configRouter);

export default router;
