import { Router } from "express";
import { OrderNoteController } from "./OrderNote.contorller";

const router = Router();

router.post("/create-order-note", OrderNoteController.CreateOrderNote);
router.patch("/update-order-note", OrderNoteController.UpdateOrderNote);
router.delete("/delete-order-note", OrderNoteController.DeleteOrderNote);
router.get("/find-order-note", OrderNoteController.findOrderNote);

export default router;