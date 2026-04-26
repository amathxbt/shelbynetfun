import { Router, type IRouter } from "express";
import healthRouter from "./health";
import shelbyRouter from "./shelby";

const router: IRouter = Router();

router.use(healthRouter);
router.use(shelbyRouter);

export default router;
