import { Router } from "express";
import { OrderController } from "./admin-deshboard.Controller";

const findOrderRouter = Router();

findOrderRouter.get("/", OrderController.findOrder);
findOrderRouter.patch("/update-designer-name/:orderId", OrderController.updateDesignerName);
findOrderRouter.get("/order-count", OrderController.getOrderCount);
findOrderRouter.get("/project-status", OrderController.projectStatus);
findOrderRouter.get("/users-status", OrderController.UsersStatus);

export default findOrderRouter;