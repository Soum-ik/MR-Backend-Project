import { Router } from "express";
import { OrderController } from "./admin-deshboard.Controller";

const findOrderRouter = Router();

findOrderRouter.get("/", OrderController.findOrder);
findOrderRouter.patch("/update-designer-name/:orderId", OrderController.updateDesignerName);

export default findOrderRouter;