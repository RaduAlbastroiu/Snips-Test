import { Router } from "express";
import { healthRoutes } from "./health/routes";
import { selectionRouter } from "./selection/routes";

const apiRouter = Router();

apiRouter.use("/", healthRoutes);
apiRouter.use("/selections", selectionRouter);

export default apiRouter;
