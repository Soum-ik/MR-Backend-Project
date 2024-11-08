import { Router } from "express";
import { OrderController } from "./Order_page.Controller";

const findOrderRouter = Router();

findOrderRouter.get("/", OrderController.findOrder);
findOrderRouter.patch("/update-designer-name/:orderId", OrderController.updateDesignerName);

export default findOrderRouter;