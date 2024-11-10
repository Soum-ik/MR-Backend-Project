import { Router } from "express";
import ReturnBuyesController from "./Return-Buyes/return_buys.controller";
import { visitros } from "./visitors/visitors.controller";
import authenticateToken from "./visitors/visitors.middleware";
import { USER_ROLE } from "../user/user.constant";
import { worldDomination } from "./world-domination/world-domination";

const analyticsRouter = Router();

analyticsRouter.get('/return-buyes', ReturnBuyesController);
analyticsRouter.get('/visitors', authenticateToken(USER_ROLE.USER), visitros.increaseVisitors);
analyticsRouter.get('/visitors/total', authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN), visitros.getVisitors);
analyticsRouter.get('/world-domination', authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN), worldDomination.getWorldDomination);

export default analyticsRouter;