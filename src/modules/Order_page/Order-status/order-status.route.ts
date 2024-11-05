import { Router } from "express";
import getOrderStatus from "./order-status.controller";

const getOrderStatusRoute = Router();

getOrderStatusRoute.get('/', getOrderStatus);

export default getOrderStatusRoute;

