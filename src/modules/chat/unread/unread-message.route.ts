import { Router } from "express";
import { unreadMessageController } from "./unread-message.controller";

const router = Router();

router.get("/message-count", unreadMessageController);

export const unreadMessageRoutes = router;