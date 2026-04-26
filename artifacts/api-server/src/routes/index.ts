import { Router, type IRouter } from "express";
import healthRouter from "./health";
import shelbyRouter from "./shelby";
import mintRouter from "./mint";
import generateRouter from "./generate";

const router: IRouter = Router();

router.use(healthRouter);
router.use(shelbyRouter);
router.use(mintRouter);
router.use(generateRouter);

export default router;
