import { Router } from "express";
import { manage_role_controller } from "./role_controller.controller";

const router = Router();

// Route to send a message
router.post("/manage-role", manage_role_controller.manage_role);

export const handleRoleRoute = router;
