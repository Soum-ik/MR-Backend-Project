import { Router } from "express";
import { OrderDelivarController } from "./Order-delivar.controller";
import { USER_ROLE } from "../../user/user.constant";
import authenticateToken from "../../../middleware/auth";

const DeliveredRoute = Router();

DeliveredRoute.post("/accept", authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN, USER_ROLE.USER), OrderDelivarController.DeliveredOrders);
DeliveredRoute.post("/revision", authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN, USER_ROLE.USER), OrderDelivarController.handleDeliveryResponse);

export default DeliveredRoute;