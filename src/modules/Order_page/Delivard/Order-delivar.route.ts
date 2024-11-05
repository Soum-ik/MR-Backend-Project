import { Router } from "express";
import { OrderDelivarController } from "./Order-delivar.controller";
import { USER_ROLE } from "../../user/user.constant";
import authenticateToken from "../../../middleware/auth";

const DeliveredRoute = Router();

DeliveredRoute.post("/delivered-orders/:orderId", authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN), OrderDelivarController.DeliveredOrders);
DeliveredRoute.post("/handle-delivery-response/:orderId", authenticateToken(USER_ROLE.USER), OrderDelivarController.handleDeliveryResponse);

export default DeliveredRoute;