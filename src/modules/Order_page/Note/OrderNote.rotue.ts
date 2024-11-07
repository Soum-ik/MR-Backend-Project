import { Router } from "express";
import { OrderNoteController } from "./OrderNote.contorller";
import { USER_ROLE } from "../../user/user.constant";
import authenticateToken from "../../../middleware/auth";
const OrderNoteRouter = Router();

OrderNoteRouter.post("/create-order-note", authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN, USER_ROLE.USER), OrderNoteController.CreateOrderNote);
OrderNoteRouter.patch("/update-order-note", OrderNoteController.UpdateOrderNote);
OrderNoteRouter.delete("/delete-order-note", OrderNoteController.DeleteOrderNote);
OrderNoteRouter.get("/find-order-note", OrderNoteController.findOrderNote);

export default OrderNoteRouter;