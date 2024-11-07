import { Router } from "express";
import { findOrder } from "./Order_page.Controller";

const findOrderRouter = Router();

findOrderRouter.get("/:projectNumber", findOrder);

export default findOrderRouter;