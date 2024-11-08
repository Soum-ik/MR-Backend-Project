import { Router } from "express";
import { OrderNoteController } from "./OrderNote.contorller";
import { USER_ROLE } from "../../user/user.constant";
import authenticateToken from "../../../middleware/auth";
const OrderNoteRouter = Router();

OrderNoteRouter.put("/update-order-note/:orderId/:noteId",
    authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN, USER_ROLE.USER),
    OrderNoteController.UpdateOrderNote);

OrderNoteRouter.delete("/delete-order-note/:orderId/:noteId",
    authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN, USER_ROLE.USER),
    OrderNoteController.DeleteOrderNote);

OrderNoteRouter.get(
    "/find-order-note/:orderId",
    authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN, USER_ROLE.USER),
    OrderNoteController.findOrderNote);

OrderNoteRouter.post("/create-order-note",
    authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN, USER_ROLE.USER),
    OrderNoteController.CreateOrderNote);

export default OrderNoteRouter;