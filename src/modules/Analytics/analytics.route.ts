import { Router } from "express";
import ReturnBuyesController from "./Return-Buyes/return_buys.controller";

const analyticsRouter = Router();

analyticsRouter.get('/return-buyes', ReturnBuyesController);
// router.get('/top-buyers', TopBuyersController);

export default analyticsRouter;